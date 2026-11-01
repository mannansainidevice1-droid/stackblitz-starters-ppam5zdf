/**
 * BHAIRAVI Creations Digital Platform
 * Transactional Database Migration Runner
 * Target: src/server/db/migrator.ts
 *
 * Implements Feature F3: Atomic SQL migrations runner with _migrations tracking.
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDbConnection, getDatabase } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationRecord {
  id: number;
  name: string;
  applied_at: string;
}

export interface MigrationStatus {
  applied: MigrationRecord[];
  pending: string[];
  isUpToDate: boolean;
}

export interface MigrationResult {
  applied: string[];
  skipped: string[];
  durationMs: number;
}

export interface MigratorOptions {
  migrationsDir?: string;
  logger?: (message: string) => void;
}

export class MigrationExecutionError extends Error {
  public readonly migrationName: string;
  public readonly originalError: Error;

  constructor(migrationName: string, originalError: Error) {
    super(`Migration failed at '${migrationName}': ${originalError.message}`);
    this.name = 'MigrationExecutionError';
    this.migrationName = migrationName;
    this.originalError = originalError;
  }
}

/**
 * Strips outer transaction wrappers (BEGIN / COMMIT) from SQL content to prevent
 * nested transaction conflicts when executed inside better-sqlite3 managed transactions.
 */
export function sanitizeMigrationSql(sql: string): string {
  return sql
    .replace(/^\s*BEGIN(\s+TRANSACTION)?\s*;/im, '')
    .replace(/;\s*COMMIT\s*;?\s*$/im, ';')
    .trim();
}

/**
 * Initializes the metadata tracking table if it does not exist.
 */
export function initMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
  `);
}

/**
 * Resolves all SQL migration files from the target directory in natural sorted order.
 */
export function getAvailableMigrationFiles(migrationsDir: string): string[] {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

/**
 * Checks which migrations have been applied and which remain pending.
 */
export function getMigrationStatus(
  db: Database.Database,
  options: MigratorOptions = {}
): MigrationStatus {
  initMigrationsTable(db);

  const migrationsDir = options.migrationsDir ?? path.join(__dirname, 'migrations');
  const availableFiles = getAvailableMigrationFiles(migrationsDir);

  const applied = db
    .prepare('SELECT id, name, applied_at FROM _migrations ORDER BY id ASC')
    .all() as MigrationRecord[];

  const appliedNames = new Set(applied.map((m) => m.name));
  const pending = availableFiles.filter((file) => !appliedNames.has(file));

  return {
    applied,
    pending,
    isUpToDate: pending.length === 0,
  };
}

/**
 * Runs all pending migrations within individual atomic transactions.
 * If any migration fails, its transaction rolls back and an error is thrown.
 */
export function runMigrations(
  db: Database.Database,
  options: MigratorOptions = {}
): MigrationResult {
  const startTime = Date.now();
  const logger = options.logger ?? console.log;
  const migrationsDir = options.migrationsDir ?? path.join(__dirname, 'migrations');

  initMigrationsTable(db);

  const status = getMigrationStatus(db, { migrationsDir });
  const alreadyAppliedNames = status.applied.map((m) => m.name);

  if (status.isUpToDate) {
    logger('Database schema is already up to date. Zero pending migrations.');
    return { applied: [], skipped: alreadyAppliedNames, durationMs: Date.now() - startTime };
  }

  const newlyApplied: string[] = [];

  for (const file of status.pending) {
    const filePath = path.join(migrationsDir, file);
    const rawSql = fs.readFileSync(filePath, 'utf-8');
    const sanitizedSql = sanitizeMigrationSql(rawSql);

    logger(`Applying migration: ${file}...`);

    try {
      // Execute each migration inside an atomic SQLite transaction
      const runTransaction = db.transaction(() => {
        db.exec(sanitizedSql);
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
      });

      runTransaction();
      newlyApplied.push(file);
      logger(`✓ Successfully applied: ${file}`);
    } catch (error: any) {
      logger(`✗ FAILED migration: ${file}`);
      logger(`Error details: ${error.message}`);
      throw new MigrationExecutionError(file, error);
    }
  }

  const durationMs = Date.now() - startTime;
  logger(`All ${newlyApplied.length} pending migrations applied successfully in ${durationMs}ms.`);
  return { applied: newlyApplied, skipped: alreadyAppliedNames, durationMs };
}

/**
 * Startup helper ensuring migrations are applied before application starts listening.
 */
export function ensureMigrationsApplied(
  db: Database.Database,
  options: MigratorOptions = {}
): void {
  try {
    const result = runMigrations(db, options);
    if (result.applied.length > 0) {
      console.log(`[Database] Boot migration complete. Applied: ${result.applied.join(', ')}`);
    }
  } catch (error) {
    console.error('[Database FATAL] Failed to apply database migrations during startup:', error);
    process.exit(1);
  }
}

/**
 * Drops all user tables, views, and indexes, resets _migrations, and re-runs all migrations.
 * WARNING: FOR TESTING AND DEVELOPMENT USE ONLY.
 */
export function resetDatabase(
  db: Database.Database,
  options: MigratorOptions = {}
): MigrationResult {
  const logger = options.logger ?? console.log;
  logger('[Database] Resetting database schema...');

  // Disable FKs during teardown to avoid constraint violation during drops
  db.pragma('foreign_keys = OFF');

  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master 
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
    )
    .all() as { name: string }[];

  for (const { name } of tables) {
    db.exec(`DROP TABLE IF EXISTS "${name}";`);
  }

  const views = db
    .prepare(
      `SELECT name FROM sqlite_master 
       WHERE type = 'view' AND name NOT LIKE 'sqlite_%'`
    )
    .all() as { name: string }[];

  for (const { name } of views) {
    db.exec(`DROP VIEW IF EXISTS "${name}";`);
  }

  // Re-enable FKs
  db.pragma('foreign_keys = ON');
  logger('[Database] All tables and views dropped. Running migrations fresh...');

  return runMigrations(db, options);
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================
const isMain =
  process.argv[1] &&
  (process.argv[1] === __filename ||
    process.argv[1].endsWith('migrator.ts') ||
    process.argv[1].endsWith('migrator.js'));

if (isMain) {
  const db = getDatabase();
  const command = process.argv[2] || 'up';

  try {
    switch (command) {
      case 'status': {
        const status = getMigrationStatus(db);
        console.log('\n--- BHAIRAVI Creations Migration Status ---');
        console.log(`Applied (${status.applied.length}):`);
        status.applied.forEach((m) => console.log(`  ✓ ${m.name} (applied ${m.applied_at})`));
        console.log(`Pending (${status.pending.length}):`);
        status.pending.forEach((p) => console.log(`  ⏳ ${p}`));
        console.log(`Status: ${status.isUpToDate ? 'UP TO DATE' : 'MIGRATIONS PENDING'}\n`);
        break;
      }
      case 'up': {
        runMigrations(db);
        break;
      }
      case 'reset': {
        resetDatabase(db);
        break;
      }
      default:
        console.error(`Unknown command '${command}'. Use: up | status | reset`);
        process.exit(1);
    }
  } catch (err) {
    console.error('Migration command failed:', err);
    process.exit(1);
  }
}
