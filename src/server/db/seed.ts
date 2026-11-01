/**
 * BHAIRAVI Creations Digital Platform
 * Programmatic Seed Data Engine
 * Target: src/server/db/seed.ts
 *
 * Implements Feature F5: Initial seed data engine with invariant validation.
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabase } from './connection.js';
import { hashPassword } from '../auth/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SeedResult {
  categoriesCount: number;
  productsCount: number;
  variantsCount: number;
  imagesCount: number;
  settingsCount: number;
  adminUsersCount: number;
  durationMs: number;
}

/**
 * Programmatic Seed Engine for BHAIRAVI Creations.
 * Executes the SQL seed script and validates dataset integrity invariants.
 */
export function seedDatabase(
  db: Database.Database,
  options: { seedSqlPath?: string; logger?: (msg: string) => void } = {}
): SeedResult {
  const startTime = Date.now();
  const logger = options.logger ?? console.log;
  const sqlPath =
    options.seedSqlPath ?? path.join(__dirname, 'migrations', '003_seed_catalog.sql');

  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Seed SQL file not found at: ${sqlPath}`);
  }

  logger(`[SeedEngine] Executing seed dataset from: ${sqlPath}`);
  const seedSql = fs.readFileSync(sqlPath, 'utf-8');

  // Wrap seeding in an atomic transaction
  const executeSeedTx = db.transaction(() => {
    db.exec(seedSql);
  });

  executeSeedTx();

  // Dynamically hash and set the initial superadmin password using native scrypt
  const defaultAdminPassword = process.env.SUPERADMIN_DEFAULT_PASSWORD || 'ChangeMeImmediately123!';
  const superadminHash = hashPassword(defaultAdminPassword);
  db.prepare(`
    UPDATE admin_users
    SET password_hash = ?
    WHERE username = 'bhairavi_admin'
  `).run(superadminHash);

  // Query counts to verify insertion
  const categoriesCount = (
    db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
  ).count;
  const productsCount = (
    db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
  ).count;
  const variantsCount = (
    db.prepare('SELECT COUNT(*) as count FROM product_variants').get() as { count: number }
  ).count;
  const imagesCount = (
    db.prepare('SELECT COUNT(*) as count FROM product_images').get() as { count: number }
  ).count;
  const settingsCount = (
    db.prepare('SELECT COUNT(*) as count FROM system_settings').get() as { count: number }
  ).count;
  const adminUsersCount = (
    db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number }
  ).count;

  const durationMs = Date.now() - startTime;

  logger('[SeedEngine] ✓ Seeding complete:');
  logger(`  - Categories: ${categoriesCount}`);
  logger(`  - Products: ${productsCount}`);
  logger(`  - Product Variants: ${variantsCount}`);
  logger(`  - Product Images: ${imagesCount}`);
  logger(`  - System Settings: ${settingsCount}`);
  logger(`  - Admin Users: ${adminUsersCount}`);
  logger(`  - Time Elapsed: ${durationMs}ms`);

  // Invariant verification assertions
  if (categoriesCount < 5) throw new Error('Seed invariant failed: Minimum 5 categories required.');
  if (productsCount < 10) throw new Error('Seed invariant failed: Minimum 10 products required.');
  if (adminUsersCount < 1) throw new Error('Seed invariant failed: Superadmin user missing.');

  return {
    categoriesCount,
    productsCount,
    variantsCount,
    imagesCount,
    settingsCount,
    adminUsersCount,
    durationMs,
  };
}

// CLI Execution Support
const isMain =
  process.argv[1] &&
  (process.argv[1] === __filename ||
    process.argv[1].endsWith('seed.ts') ||
    process.argv[1].endsWith('seed.js'));

if (isMain) {
  try {
    const db = getDatabase();
    seedDatabase(db);
    process.exit(0);
  } catch (err) {
    console.error('[SeedEngine FATAL] Seed execution failed:', err);
    process.exit(1);
  }
}
