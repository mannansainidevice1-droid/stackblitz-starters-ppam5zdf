/**
 * BHAIRAVI Creations Digital Platform
 * SQLite Database Connection & WAL Configuration Module
 * Target: src/server/db/connection.ts
 *
 * Implements Feature F4: High-concurrency WAL pragmas, 5s busy timeout, NORMAL sync, FKs ON.
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface DbConnectionOptions {
  dbPath?: string;
  readonly?: boolean;
  verbose?: boolean;
}

let activeConnection: Database.Database | null = null;

/**
 * Resolves the absolute database file path from environment or default project location.
 */
export function getDefaultDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return path.resolve(process.env.DATABASE_PATH);
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('sqlite:')) {
    return path.resolve(process.env.DATABASE_URL.replace('sqlite:', ''));
  }
  return path.resolve(process.cwd(), 'data/bhairavi.db');
}

/**
 * Applies high-concurrency performance and integrity pragmas to the SQLite instance.
 */
export function applyPragmas(db: Database.Database): void {
  // 1. Enable Write-Ahead Logging (WAL) for concurrent readers and writer
  db.pragma('journal_mode = WAL');

  // 2. Wait up to 5000ms if database is locked before returning SQLITE_BUSY
  db.pragma('busy_timeout = 5000');

  // 3. Set synchronous mode to NORMAL (ACID compliant in WAL mode with fast writes)
  db.pragma('synchronous = NORMAL');

  // 4. Strictly enforce relational foreign key constraints
  db.pragma('foreign_keys = ON');

  // 5. Allocate 64MB memory page cache (-64000 KiB)
  db.pragma('cache_size = -64000');

  // 6. Store temporary tables and sorting buffers in memory
  db.pragma('temp_store = MEMORY');
}

/**
 * Factory function to create a new, configured SQLite database connection.
 */
export function createDbConnection(
  targetPath?: string,
  options: DbConnectionOptions = {}
): Database.Database {
  const dbPath = targetPath ?? getDefaultDatabasePath();
  const dbDir = path.dirname(dbPath);

  // Automatically create data directory if missing
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath, {
    readonly: options.readonly ?? false,
    verbose: options.verbose ? console.log : undefined,
  });

  // Apply mandatory WAL and foreign key pragmas
  applyPragmas(db);

  return db;
}

/**
 * Singleton accessor returning the active shared database connection.
 */
export function getDatabase(): Database.Database {
  if (!activeConnection || !activeConnection.open) {
    activeConnection = createDbConnection();
  }
  return activeConnection;
}

/**
 * Gracefully closes the active singleton database connection.
 */
export function closeDatabase(): void {
  if (activeConnection && activeConnection.open) {
    activeConnection.close();
    activeConnection = null;
  }
}

/**
 * Health check inspecting active database status and active pragmas.
 */
export function checkDatabaseHealth(db?: Database.Database): {
  ok: boolean;
  journalMode: string;
  foreignKeys: boolean;
  busyTimeout: number;
  synchronous: number;
} {
  const targetDb = db ?? getDatabase();
  const journalMode = targetDb.pragma('journal_mode', { simple: true }) as string;
  const foreignKeys = (targetDb.pragma('foreign_keys', { simple: true }) as number) === 1;
  const busyTimeout = targetDb.pragma('busy_timeout', { simple: true }) as number;
  const synchronous = targetDb.pragma('synchronous', { simple: true }) as number;

  return {
    ok: journalMode.toLowerCase() === 'wal' && foreignKeys && busyTimeout >= 5000,
    journalMode,
    foreignKeys,
    busyTimeout,
    synchronous,
  };
}

// Clean up database connection on process termination
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
