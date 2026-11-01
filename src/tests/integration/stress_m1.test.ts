/**
 * BHAIRAVI Creations Digital Platform
 * Empirical Stress Test Harness: Concurrency, WAL Contention, Rollback Atomicity & FK Enforcement
 * Target: src/tests/integration/stress_m1.test.ts
 *
 * Role: Milestone 1 Challenger (Adversarial Empirical Verification)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { createDbConnection } from '../../server/db/connection.js';
import {
  runMigrations,
  getMigrationStatus,
  MigrationExecutionError,
  sanitizeMigrationSql,
} from '../../server/db/migrator.js';

const STRESS_DB_PATH = path.resolve(process.cwd(), 'data/stress_bhairavi.db');
const TEMP_MIGRATIONS_DIR = path.resolve(process.cwd(), 'data/temp_stress_migrations');

describe('Milestone 1 Empirical Challenger Stress Suite', () => {
  let db: Database.Database;

  beforeAll(() => {
    // Ensure clean state
    const cleanFiles = [
      STRESS_DB_PATH,
      `${STRESS_DB_PATH}-wal`,
      `${STRESS_DB_PATH}-shm`,
    ];
    for (const f of cleanFiles) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    if (fs.existsSync(TEMP_MIGRATIONS_DIR)) {
      fs.rmSync(TEMP_MIGRATIONS_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_MIGRATIONS_DIR, { recursive: true });

    // Initialize database with WAL pragmas & apply existing migrations
    db = createDbConnection(STRESS_DB_PATH);
    runMigrations(db);
  });

  afterAll(() => {
    if (db && db.open) {
      db.close();
    }
    const cleanFiles = [
      STRESS_DB_PATH,
      `${STRESS_DB_PATH}-wal`,
      `${STRESS_DB_PATH}-shm`,
    ];
    for (const f of cleanFiles) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    if (fs.existsSync(TEMP_MIGRATIONS_DIR)) {
      fs.rmSync(TEMP_MIGRATIONS_DIR, { recursive: true, force: true });
    }
  });

  // ==========================================================================
  // Stress Area 1: Concurrency, WAL Contention & Lock Serialization
  // ==========================================================================
  describe('Area 1: Concurrency & WAL Contention Under Multithreaded Pressure', () => {
    it('1.1 should permit parallel readers without blocking during an active uncommitted write transaction', async () => {
      // In WAL mode, a writer holding an exclusive write transaction must NOT block readers.
      // Furthermore, readers must see snapshot isolation (only committed rows).
      const initialCount = (db.prepare('SELECT count(*) as c FROM products').get() as any).c;

      // Launch writer thread that opens transaction, inserts uncommitted rows, and sleeps
      const writerWorkerCode = `
        const { parentPort, workerData } = require('node:worker_threads');
        const Database = require('better-sqlite3');
        const db = new Database(workerData.dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('busy_timeout = 5000');

        db.exec('BEGIN EXCLUSIVE;');
        for (let i = 0; i < 20; i++) {
          db.prepare(\`
            INSERT INTO products (
              id, slug, name, description, category_id, base_price_paise,
              currency, material, care_safety_instructions, manufacturing_method, finishing_type
            ) VALUES (?, ?, 'Uncommitted Prod', 'Desc', 'cat_spiritual_deities', 100000, 'INR', 'PLA', 'Care', 'FDM', 'Raw')
          \`).run('prod_uncommitted_' + i, 'uncommitted-slug-' + i);
        }

        parentPort.postMessage('in_transaction');

        // Hold uncommitted write lock for 1200ms
        const end = Date.now() + 1200;
        while (Date.now() < end) {}

        // Roll back so we do not pollute the DB
        db.exec('ROLLBACK;');
        db.close();
        parentPort.postMessage('rolled_back');
      `;

      const readerWorkerCode = `
        const { parentPort, workerData } = require('node:worker_threads');
        const Database = require('better-sqlite3');
        const db = new Database(workerData.dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('busy_timeout = 5000');

        const start = Date.now();
        const row = db.prepare('SELECT count(*) as c FROM products').get();
        const duration = Date.now() - start;
        db.close();
        parentPort.postMessage({ count: row.c, duration });
      `;

      await new Promise<void>((resolve, reject) => {
        const writer = new Worker(writerWorkerCode, {
          eval: true,
          workerData: { dbPath: STRESS_DB_PATH },
        });

        writer.on('message', async (msg) => {
          if (msg === 'in_transaction') {
            // Spawn 5 parallel reader worker threads while write lock is actively held
            const readerPromises = [1, 2, 3, 4, 5].map((rId) => {
              return new Promise<{ count: number; duration: number }>((resReader, rejReader) => {
                const reader = new Worker(readerWorkerCode, {
                  eval: true,
                  workerData: { dbPath: STRESS_DB_PATH, rId },
                });
                reader.on('message', resReader);
                reader.on('error', rejReader);
              });
            });

            try {
              const readerResults = await Promise.all(readerPromises);
              for (const result of readerResults) {
                // Must NOT see uncommitted 20 rows!
                expect(result.count).toBe(initialCount);
                // Must NOT be blocked for 1200ms! Should execute in under 300ms
                expect(result.duration).toBeLessThan(500);
              }
            } catch (err) {
              reject(err);
            }
          } else if (msg === 'rolled_back') {
            resolve();
          }
        });

        writer.on('error', reject);
      });
    });

    it('1.2 should serialize concurrent write transactions across multiple worker threads without SQLITE_BUSY', async () => {
      // 5 concurrent worker threads each attempting 8 sequential write transactions (40 total)
      // With busy_timeout = 5000ms, all transactions should serialize cleanly
      const writerWorkerCode = `
        const { parentPort, workerData } = require('node:worker_threads');
        const Database = require('better-sqlite3');
        const db = new Database(workerData.dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('busy_timeout = 5000');

        let successfulWrites = 0;
        for (let i = 0; i < workerData.txCount; i++) {
          const insertTx = db.transaction(() => {
            const id = 'prod_conc_' + workerData.workerId + '_' + i;
            const slug = 'conc-slug-' + workerData.workerId + '-' + i;
            db.prepare(\`
              INSERT INTO products (
                id, slug, name, description, category_id, base_price_paise,
                currency, material, care_safety_instructions, manufacturing_method, finishing_type
              ) VALUES (?, ?, 'Concurrent Prod', 'Desc', 'cat_spiritual_deities', 150000, 'INR', 'PLA+', 'Care', 'FDM', 'Polished')
            \`).run(id, slug);
          });
          insertTx();
          successfulWrites++;
        }
        db.close();
        parentPort.postMessage({ workerId: workerData.workerId, successfulWrites });
      `;

      const numWorkers = 5;
      const txCount = 8;
      const workerPromises = Array.from({ length: numWorkers }, (_, idx) => {
        return new Promise<{ workerId: number; successfulWrites: number }>((resolve, reject) => {
          const w = new Worker(writerWorkerCode, {
            eval: true,
            workerData: {
              dbPath: STRESS_DB_PATH,
              workerId: idx,
              txCount,
            },
          });
          w.on('message', resolve);
          w.on('error', reject);
        });
      });

      const results = await Promise.all(workerPromises);
      for (const res of results) {
        expect(res.successfulWrites).toBe(txCount);
      }

      // Verify all 40 rows are in the database
      const row = db.prepare("SELECT count(*) as c FROM products WHERE id LIKE 'prod_conc_%'").get() as any;
      expect(row.c).toBe(numWorkers * txCount);

      // Clean up concurrent products
      db.prepare("DELETE FROM products WHERE id LIKE 'prod_conc_%'").run();
    });

    it('1.3 should enforce busy_timeout oracle: wait for specified timeout and throw SQLITE_BUSY if lock held', async () => {
      // Writer 1 acquires exclusive lock for 1000ms
      // Writer 2 configured with short busy_timeout = 300ms attempts write
      // Writer 2 MUST wait ~300ms, fail with code SQLITE_BUSY, message 'database is locked'
      const lockHolderCode = `
        const { parentPort, workerData } = require('node:worker_threads');
        const Database = require('better-sqlite3');
        const db = new Database(workerData.dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('busy_timeout = 5000');

        db.exec('BEGIN EXCLUSIVE;');
        parentPort.postMessage('locked');

        const end = Date.now() + 1000;
        while (Date.now() < end) {}

        db.exec('COMMIT;');
        db.close();
        parentPort.postMessage('unlocked');
      `;

      const contenderCode = `
        const { parentPort, workerData } = require('node:worker_threads');
        const Database = require('better-sqlite3');
        const db = new Database(workerData.dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('busy_timeout = 300'); // Short timeout 300ms

        const start = Date.now();
        try {
          db.prepare(\`
            INSERT INTO products (
              id, slug, name, description, category_id, base_price_paise,
              currency, material, care_safety_instructions, manufacturing_method, finishing_type
            ) VALUES ('prod_busy_fail', 'busy-fail-slug', 'Busy Fail', 'Desc', 'cat_spiritual_deities', 100000, 'INR', 'PLA', 'C', 'M', 'F')
          \`).run();
          parentPort.postMessage({ success: true, duration: Date.now() - start });
        } catch (err) {
          parentPort.postMessage({
            success: false,
            code: err.code,
            message: err.message,
            duration: Date.now() - start
          });
        } finally {
          db.close();
        }
      `;

      await new Promise<void>((resolve, reject) => {
        const holder = new Worker(lockHolderCode, {
          eval: true,
          workerData: { dbPath: STRESS_DB_PATH },
        });

        holder.on('message', (msg) => {
          if (msg === 'locked') {
            const contender = new Worker(contenderCode, {
              eval: true,
              workerData: { dbPath: STRESS_DB_PATH },
            });

            contender.on('message', (res: any) => {
              try {
                expect(res.success).toBe(false);
                expect(res.code).toBe('SQLITE_BUSY');
                expect(res.message).toMatch(/database is locked/i);
                // Elapsed time must be at least 250ms (honoring busy_timeout)
                expect(res.duration).toBeGreaterThanOrEqual(250);
                // And must fail well before the 1000ms lock duration
                expect(res.duration).toBeLessThan(800);
              } catch (e) {
                reject(e);
              }
            });
            contender.on('error', reject);
          } else if (msg === 'unlocked') {
            resolve();
          }
        });

        holder.on('error', reject);
      });
    });

    it('1.4 should maintain WAL checkpoint integrity under PASSIVE and TRUNCATE checkpoints', () => {
      // Execute WAL checkpoint pragmas
      const passiveCheck = db.pragma('wal_checkpoint(PASSIVE)') as any[];
      expect(passiveCheck[0].busy).toBe(0);

      const truncateCheck = db.pragma('wal_checkpoint(TRUNCATE)') as any[];
      expect(truncateCheck[0].busy).toBe(0);

      // Verify DB remains completely healthy and readable
      const catCount = db.prepare('SELECT count(*) as c FROM categories').get() as any;
      expect(catCount.c).toBeGreaterThanOrEqual(5);

      const prodCount = db.prepare('SELECT count(*) as c FROM products').get() as any;
      expect(prodCount.c).toBeGreaterThanOrEqual(10);
    });
  });

  // ==========================================================================
  // Stress Area 2: Migration Rollback Atomicity Under Multi-Statement Errors
  // ==========================================================================
  describe('Area 2: Migration Rollback Atomicity Under Syntax & Constraint Errors', () => {
    let isolatedDb: Database.Database;
    const ISOLATED_DB_PATH = path.resolve(process.cwd(), 'data/isolated_rollback_test.db');
    const ISOLATED_MIGRATIONS_DIR = path.resolve(process.cwd(), 'data/isolated_migrations');

    beforeAll(() => {
      const cleanFiles = [
        ISOLATED_DB_PATH,
        `${ISOLATED_DB_PATH}-wal`,
        `${ISOLATED_DB_PATH}-shm`,
      ];
      for (const f of cleanFiles) {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
      if (fs.existsSync(ISOLATED_MIGRATIONS_DIR)) {
        fs.rmSync(ISOLATED_MIGRATIONS_DIR, { recursive: true, force: true });
      }
      fs.mkdirSync(ISOLATED_MIGRATIONS_DIR, { recursive: true });

      // Copy migrations 001 and 002 to isolated dir
      const realMigrationsDir = path.resolve(process.cwd(), 'src/server/db/migrations');
      fs.copyFileSync(
        path.join(realMigrationsDir, '001_initial_schema.sql'),
        path.join(ISOLATED_MIGRATIONS_DIR, '001_initial_schema.sql')
      );
      fs.copyFileSync(
        path.join(realMigrationsDir, '002_analytics_and_bi.sql'),
        path.join(ISOLATED_MIGRATIONS_DIR, '002_analytics_and_bi.sql')
      );

      isolatedDb = createDbConnection(ISOLATED_DB_PATH);
      // Run the initial 2 migrations
      runMigrations(isolatedDb, { migrationsDir: ISOLATED_MIGRATIONS_DIR });
    });

    afterAll(() => {
      if (isolatedDb && isolatedDb.open) isolatedDb.close();
      const cleanFiles = [
        ISOLATED_DB_PATH,
        `${ISOLATED_DB_PATH}-wal`,
        `${ISOLATED_DB_PATH}-shm`,
      ];
      for (const f of cleanFiles) {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
      if (fs.existsSync(ISOLATED_MIGRATIONS_DIR)) {
        fs.rmSync(ISOLATED_MIGRATIONS_DIR, { recursive: true, force: true });
      }
    });

    it('2.1 should completely roll back multi-statement migration on syntax error midway without leaking partial tables', () => {
      // Craft multi-statement migration:
      // - 3 valid table creations
      // - 1 invalid SQL syntax error
      // - 2 valid table creations after the error
      const brokenSql = `
        CREATE TABLE stress_rollback_t1 (id TEXT PRIMARY KEY, title TEXT);
        CREATE TABLE stress_rollback_t2 (id TEXT PRIMARY KEY, amount INTEGER);
        INSERT INTO stress_rollback_t1 (id, title) VALUES ('t1_1', 'Alpha');

        -- INTENTIONAL SYNTAX ERROR MIDWAY
        CREATE MALFORMED_SYNTAX_ERROR TABLE stress_rollback_fail (;;;

        CREATE TABLE stress_rollback_t3 (id TEXT PRIMARY KEY);
        CREATE TABLE stress_rollback_t4 (id TEXT PRIMARY KEY);
      `;

      fs.writeFileSync(path.join(ISOLATED_MIGRATIONS_DIR, '003_bad_syntax.sql'), brokenSql, 'utf-8');

      // Attempt to run migrations
      expect(() => {
        runMigrations(isolatedDb, { migrationsDir: ISOLATED_MIGRATIONS_DIR });
      }).toThrowError(MigrationExecutionError);

      // Verify that NONE of the tables from 003 exist in sqlite_master
      const tables = isolatedDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'stress_rollback_%'")
        .all();
      expect(tables).toEqual([]);

      // Verify that _migrations does NOT contain '003_bad_syntax.sql'
      const migrationRecord = isolatedDb
        .prepare("SELECT * FROM _migrations WHERE name = '003_bad_syntax.sql'")
        .get();
      expect(migrationRecord).toBeUndefined();

      // Verify migration status reports 003 as pending
      const status = getMigrationStatus(isolatedDb, { migrationsDir: ISOLATED_MIGRATIONS_DIR });
      expect(status.pending).toContain('003_bad_syntax.sql');
      expect(status.applied.length).toBe(2);

      // Remove the bad migration file
      fs.unlinkSync(path.join(ISOLATED_MIGRATIONS_DIR, '003_bad_syntax.sql'));
    });

    it('2.2 should completely roll back multi-statement migration on runtime foreign key violation', () => {
      const fkFailSql = `
        CREATE TABLE stress_fk_leak_check (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL REFERENCES categories(id)
        );
        -- Violates foreign key constraint:
        INSERT INTO stress_fk_leak_check (id, category_id) VALUES ('c1', 'non_existent_category_xyz');
      `;

      fs.writeFileSync(path.join(ISOLATED_MIGRATIONS_DIR, '003_fk_fail.sql'), fkFailSql, 'utf-8');

      expect(() => {
        runMigrations(isolatedDb, { migrationsDir: ISOLATED_MIGRATIONS_DIR });
      }).toThrowError(MigrationExecutionError);

      // Verify table was dropped/rolled back
      const tableCheck = isolatedDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'stress_fk_leak_check'")
        .get();
      expect(tableCheck).toBeUndefined();

      // Verify _migrations table is untouched
      const migCheck = isolatedDb
        .prepare("SELECT * FROM _migrations WHERE name = '003_fk_fail.sql'")
        .get();
      expect(migCheck).toBeUndefined();

      fs.unlinkSync(path.join(ISOLATED_MIGRATIONS_DIR, '003_fk_fail.sql'));
    });

    it('2.3 should completely roll back multi-statement migration on runtime CHECK constraint failure', () => {
      const checkFailSql = `
        CREATE TABLE stress_check_leak_tbl (
          id TEXT PRIMARY KEY,
          price_paise INTEGER NOT NULL CHECK(price_paise >= 0)
        );
        INSERT INTO stress_check_leak_tbl (id, price_paise) VALUES ('p1', 100);
        -- Violates CHECK constraint:
        INSERT INTO stress_check_leak_tbl (id, price_paise) VALUES ('p2', -500);
      `;

      fs.writeFileSync(path.join(ISOLATED_MIGRATIONS_DIR, '003_check_fail.sql'), checkFailSql, 'utf-8');

      expect(() => {
        runMigrations(isolatedDb, { migrationsDir: ISOLATED_MIGRATIONS_DIR });
      }).toThrowError(MigrationExecutionError);

      const tableCheck = isolatedDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'stress_check_leak_tbl'")
        .get();
      expect(tableCheck).toBeUndefined();

      const migCheck = isolatedDb
        .prepare("SELECT * FROM _migrations WHERE name = '003_check_fail.sql'")
        .get();
      expect(migCheck).toBeUndefined();

      fs.unlinkSync(path.join(ISOLATED_MIGRATIONS_DIR, '003_check_fail.sql'));
    });

    it('2.4 should recover cleanly when faulty migration is replaced with valid SQL', () => {
      const valid003Sql = `
        CREATE TABLE stress_valid_tbl (
          id TEXT PRIMARY KEY,
          val TEXT NOT NULL
        );
        INSERT INTO stress_valid_tbl (id, val) VALUES ('v1', 'verified_success');
      `;

      fs.writeFileSync(path.join(ISOLATED_MIGRATIONS_DIR, '003_valid_recovered.sql'), valid003Sql, 'utf-8');

      const result = runMigrations(isolatedDb, { migrationsDir: ISOLATED_MIGRATIONS_DIR });
      expect(result.applied).toEqual(['003_valid_recovered.sql']);

      const tableCheck = isolatedDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'stress_valid_tbl'")
        .get();
      expect(tableCheck).toBeDefined();

      const row = isolatedDb.prepare('SELECT val FROM stress_valid_tbl WHERE id = ?').get('v1') as any;
      expect(row.val).toBe('verified_success');

      const status = getMigrationStatus(isolatedDb, { migrationsDir: ISOLATED_MIGRATIONS_DIR });
      expect(status.isUpToDate).toBe(true);
      expect(status.pending.length).toBe(0);
    });

    it('2.5 should sanitize BEGIN / COMMIT transaction wrappers without error', () => {
      const wrappedSql = `
        BEGIN TRANSACTION;
        CREATE TABLE test_sanitized (id TEXT PRIMARY KEY);
        COMMIT;
      `;
      const sanitized = sanitizeMigrationSql(wrappedSql);
      expect(sanitized).not.toMatch(/BEGIN TRANSACTION/i);
      expect(sanitized).not.toMatch(/COMMIT/i);
    });
  });

  // ==========================================================================
  // Stress Area 3: Complete Foreign Key Referential Integrity Fuzzing
  // ==========================================================================
  describe('Area 3: Comprehensive Foreign Key Enforcement & Referential Integrity Fuzzing', () => {
    it('3.1 should reject invalid foreign keys across ALL 12 relational foreign key links', () => {
      const INVALID_FK = 'fk_does_not_exist_99999';

      // 1. products -> categories(id)
      expect(() => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES ('prod_bad_cat', 'bad-cat-slug', 'P', 'D', ?, 1000, 'INR', 'M', 'C', 'MM', 'F')
        `).run(INVALID_FK);
      }).toThrow(/FOREIGN KEY/i);

      // 2. product_images -> products(id)
      expect(() => {
        db.prepare(`
          INSERT INTO product_images (id, product_id, storage_path, public_url, alt_text, file_size_bytes, mime_type)
          VALUES ('img_bad_prod', ?, '/p.webp', '/u.webp', 'Alt', 100, 'image/webp')
        `).run(INVALID_FK);
      }).toThrow(/FOREIGN KEY/i);

      // 3. product_variants -> products(id)
      expect(() => {
        db.prepare(`
          INSERT INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise)
          VALUES ('var_bad_prod', ?, 'SKU-BAD-1', 'Name', 0)
        `).run(INVALID_FK);
      }).toThrow(/FOREIGN KEY/i);

      // 4. enquiries -> products(id) via referenced_product_id (when non-null)
      expect(() => {
        db.prepare(`
          INSERT INTO enquiries (
            id, customer_name, contact_phone, preferred_contact_method, project_type,
            design_description, referenced_product_id, ip_hash
          ) VALUES ('enq_bad_prod', 'Name', '+919999999999', 'whatsapp', 'other', 'Desc', ?, 'hash')
        `).run(INVALID_FK);
      }).toThrow(/FOREIGN KEY/i);

      // 5. enquiry_attachments -> enquiries(id)
      expect(() => {
        db.prepare(`
          INSERT INTO enquiry_attachments (id, enquiry_id, storage_path, original_filename, file_size_bytes, mime_type, file_sha256)
          VALUES ('att_bad_enq', ?, '/p.stl', 'orig.stl', 100, 'model/stl', 'sha')
        `).run(INVALID_FK);
      }).toThrow(/FOREIGN KEY/i);

      // 6. enquiry_timeline -> enquiries(id)
      expect(() => {
        db.prepare(`
          INSERT INTO enquiry_timeline (id, enquiry_id, action_type, note)
          VALUES ('tl_bad_enq', ?, 'internal_note', 'Note')
        `).run(INVALID_FK);
      }).toThrow(/FOREIGN KEY/i);

      // 7. enquiry_timeline -> admin_users(id) via admin_user_id
      // First create valid enquiry
      db.prepare(`
        INSERT INTO enquiries (id, customer_name, contact_phone, preferred_contact_method, project_type, design_description, ip_hash)
        VALUES ('enq_valid_for_tl', 'Cust', '+919999999999', 'whatsapp', 'other', 'Desc', 'hash')
      `).run();

      expect(() => {
        db.prepare(`
          INSERT INTO enquiry_timeline (id, enquiry_id, admin_user_id, action_type, note)
          VALUES ('tl_bad_admin', 'enq_valid_for_tl', ?, 'internal_note', 'Note')
        `).run(INVALID_FK);
      }).toThrow(/FOREIGN KEY/i);

      // 8. admin_sessions -> admin_users(id)
      expect(() => {
        db.prepare(`
          INSERT INTO admin_sessions (id, admin_user_id, expires_at)
          VALUES ('sess_bad_admin', ?, '2026-12-31T23:59:59Z')
        `).run(INVALID_FK);
      }).toThrow(/FOREIGN KEY/i);

      // 9. audit_logs -> admin_users(id)
      expect(() => {
        db.prepare(`
          INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id)
          VALUES ('log_bad_admin', ?, 'login', 'user', '123')
        `).run(INVALID_FK);
      }).toThrow(/FOREIGN KEY/i);

      // 10. system_settings -> admin_users(id) via updated_by
      expect(() => {
        db.prepare(`
          INSERT INTO system_settings (key, value, updated_by)
          VALUES ('test.bad.updated_by', 'val', ?)
        `).run(INVALID_FK);
      }).toThrow(/FOREIGN KEY/i);

      // 11. analytics_events -> products(id) via product_id (when non-null)
      expect(() => {
        db.prepare(`
          INSERT INTO analytics_events (
            event_id, event_type, timestamp_utc, session_id, page_path,
            product_id, referrer_category, device_category, consent_status, outcome_status
          ) VALUES ('evt_bad_prod', 'product_view', '2026-10-31T12:00:00Z', 'sess_12345678', '/p', ?, 'direct', 'desktop', 'granted', 'not_applicable')
        `).run(INVALID_FK);
      }).toThrow(/FOREIGN KEY/i);

      // 12. analytics_daily_product_rollups -> products(id)
      expect(() => {
        db.prepare(`
          INSERT INTO analytics_daily_product_rollups (
            rollup_date, product_id, impressions, reconciliation_hash
          ) VALUES ('2026-10-31', ?, 5, 'hash123')
        `).run(INVALID_FK);
      }).toThrow(/FOREIGN KEY/i);

      // Clean up helper enquiry
      db.prepare("DELETE FROM enquiries WHERE id = 'enq_valid_for_tl'").run();
    });

    it('3.2 should enforce complete referential action matrix: RESTRICT, CASCADE, and SET NULL', () => {
      // Setup test fixtures:
      // Category -> Product -> Images, Variants, Rollups
      // AdminUser -> Sessions, AuditLog, Settings
      const testCatId = 'cat_fuzz_parent';
      const testProdId = 'prod_fuzz_parent';
      const testAdminId = 'usr_fuzz_parent';
      const testEnqId = 'enq_fuzz_parent';

      db.prepare(`INSERT OR IGNORE INTO categories (id, slug, name) VALUES (?, 'fuzz-cat', 'Fuzz Cat')`).run(testCatId);
      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, slug, name, description, category_id, base_price_paise,
          currency, material, care_safety_instructions, manufacturing_method, finishing_type
        ) VALUES (?, 'fuzz-prod', 'Fuzz Prod', 'D', ?, 120000, 'INR', 'PLA', 'C', 'M', 'F')
      `).run(testProdId, testCatId);

      // A. ON DELETE RESTRICT on category
      expect(() => {
        db.prepare('DELETE FROM categories WHERE id = ?').run(testCatId);
      }).toThrow(/FOREIGN KEY/i);

      // B. Attach children to product
      db.prepare(`
        INSERT INTO product_images (id, product_id, storage_path, public_url, alt_text, file_size_bytes, mime_type)
        VALUES ('img_fuzz_1', ?, '/p.webp', '/u.webp', 'Alt', 100, 'image/webp')
      `).run(testProdId);

      db.prepare(`
        INSERT INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise)
        VALUES ('var_fuzz_1', ?, 'SKU-FUZZ-1', 'Name', 0)
      `).run(testProdId);

      db.prepare(`
        INSERT INTO analytics_daily_product_rollups (rollup_date, product_id, impressions, reconciliation_hash)
        VALUES ('2026-10-31', ?, 10, 'hash_fuzz')
      `).run(testProdId);

      // Attach SET NULL children to product
      db.prepare(`
        INSERT INTO enquiries (id, customer_name, contact_phone, preferred_contact_method, project_type, design_description, referenced_product_id, ip_hash)
        VALUES (?, 'Cust', '+919999999999', 'whatsapp', 'other', 'Desc', ?, 'hash')
      `).run(testEnqId, testProdId);

      db.prepare(`
        INSERT INTO analytics_events (
          event_id, event_type, timestamp_utc, session_id, page_path,
          product_id, referrer_category, device_category, consent_status, outcome_status
        ) VALUES ('evt_fuzz_1', 'product_view', '2026-10-31T12:00:00Z', 'sess_12345678', '/p', ?, 'direct', 'desktop', 'granted', 'not_applicable')
      `).run(testProdId);

      // Attach CASCADE children to enquiry
      db.prepare(`
        INSERT INTO enquiry_attachments (id, enquiry_id, storage_path, original_filename, file_size_bytes, mime_type, file_sha256)
        VALUES ('att_fuzz_1', ?, '/f.stl', 'f.stl', 500, 'model/stl', 'hash')
      `).run(testEnqId);

      db.prepare(`
        INSERT INTO enquiry_timeline (id, enquiry_id, action_type, note)
        VALUES ('tl_fuzz_1', ?, 'status_change', 'Note')
      `).run(testEnqId);

      // Attach Admin User and its CASCADE & SET NULL children
      db.prepare(`
        INSERT INTO admin_users (id, username, email, password_hash, role)
        VALUES (?, 'fuzz_admin', 'fuzz@example.com', 'hash', 'admin')
      `).run(testAdminId);

      db.prepare(`
        INSERT INTO admin_sessions (id, admin_user_id, expires_at)
        VALUES ('sess_fuzz_1', ?, '2026-12-31T23:59:59Z')
      `).run(testAdminId);

      db.prepare(`
        INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id)
        VALUES ('log_fuzz_1', ?, 'create', 'product', ?)
      `).run(testAdminId, testProdId);

      db.prepare(`
        INSERT INTO system_settings (key, value, updated_by)
        VALUES ('fuzz.setting.key', 'val', ?)
      `).run(testAdminId);

      // NOW TEST DELETING PRODUCT:
      db.prepare('DELETE FROM products WHERE id = ?').run(testProdId);

      // 1. CASCADE on product_images, product_variants, analytics_daily_product_rollups
      expect(db.prepare("SELECT count(*) as c FROM product_images WHERE id = 'img_fuzz_1'").get()).toEqual({ c: 0 });
      expect(db.prepare("SELECT count(*) as c FROM product_variants WHERE id = 'var_fuzz_1'").get()).toEqual({ c: 0 });
      expect(db.prepare("SELECT count(*) as c FROM analytics_daily_product_rollups WHERE product_id = ?").get(testProdId)).toEqual({ c: 0 });

      // 2. SET NULL on enquiries.referenced_product_id and analytics_events.product_id
      const enqAfter = db.prepare('SELECT referenced_product_id FROM enquiries WHERE id = ?').get(testEnqId) as any;
      expect(enqAfter.referenced_product_id).toBeNull();

      const evtAfter = db.prepare("SELECT product_id FROM analytics_events WHERE event_id = 'evt_fuzz_1'").get() as any;
      expect(evtAfter.product_id).toBeNull();

      // TEST DELETING ENQUIRY:
      db.prepare('DELETE FROM enquiries WHERE id = ?').run(testEnqId);
      // CASCADE on enquiry_attachments and enquiry_timeline
      expect(db.prepare("SELECT count(*) as c FROM enquiry_attachments WHERE id = 'att_fuzz_1'").get()).toEqual({ c: 0 });
      expect(db.prepare("SELECT count(*) as c FROM enquiry_timeline WHERE id = 'tl_fuzz_1'").get()).toEqual({ c: 0 });

      // TEST DELETING ADMIN USER:
      db.prepare('DELETE FROM admin_users WHERE id = ?').run(testAdminId);
      // CASCADE on admin_sessions
      expect(db.prepare("SELECT count(*) as c FROM admin_sessions WHERE id = 'sess_fuzz_1'").get()).toEqual({ c: 0 });
      // SET NULL on audit_logs.admin_user_id and system_settings.updated_by
      const logAfter = db.prepare("SELECT admin_user_id FROM audit_logs WHERE id = 'log_fuzz_1'").get() as any;
      expect(logAfter.admin_user_id).toBeNull();
      const settingAfter = db.prepare("SELECT updated_by FROM system_settings WHERE key = 'fuzz.setting.key'").get() as any;
      expect(settingAfter.updated_by).toBeNull();

      // Now that child product is gone, deleting category must succeed:
      db.prepare('DELETE FROM categories WHERE id = ?').run(testCatId);
      expect(db.prepare('SELECT count(*) as c FROM categories WHERE id = ?').get(testCatId)).toEqual({ c: 0 });

      // Cleanup remaining test fixtures
      db.prepare("DELETE FROM analytics_events WHERE event_id = 'evt_fuzz_1'").run();
      db.prepare("DELETE FROM audit_logs WHERE id = 'log_fuzz_1'").run();
      db.prepare("DELETE FROM system_settings WHERE key = 'fuzz.setting.key'").run();
    });

    it('3.3 should block mutating parent primary key when child records exist', () => {
      // Find category with products
      const category = db.prepare('SELECT id FROM categories LIMIT 1').get() as { id: string };
      expect(category).toBeDefined();

      expect(() => {
        db.prepare('UPDATE categories SET id = ? WHERE id = ?').run('mutated_cat_id', category.id);
      }).toThrow(/FOREIGN KEY/i);
    });

    it('3.4 should pass global PRAGMA foreign_key_check with zero dangling foreign keys', () => {
      const violations = db.pragma('foreign_key_check') as any[];
      expect(violations).toEqual([]);
    });
  });

  // ==========================================================================
  // Stress Area 4: Invariants, CHECK Constraints & Integer INR Pricing Fuzzing
  // ==========================================================================
  describe('Area 4: Invariants, CHECK Constraints & Integer INR Pricing Fuzzing', () => {
    it('4.1 should reject all non-integer and negative price injections', () => {
      const category = db.prepare('SELECT id FROM categories LIMIT 1').get() as { id: string };

      // Negative paise:
      expect(() => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES ('prod_neg_1', 'neg-1-slug', 'P', 'D', ?, -1, 'INR', 'PLA', 'C', 'M', 'F')
        `).run(category.id);
      }).toThrow(/CHECK constraint/i);

      // Fractional paise (1499.50):
      expect(() => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES ('prod_float_1', 'float-1-slug', 'P', 'D', ?, 1499.50, 'INR', 'PLA', 'C', 'M', 'F')
        `).run(category.id);
      }).toThrow(/CHECK constraint/i);

      // Non-INR currency (USD):
      expect(() => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES ('prod_usd_1', 'usd-1-slug', 'P', 'D', ?, 150000, 'USD', 'PLA', 'C', 'M', 'F')
        `).run(category.id);
      }).toThrow(/CHECK constraint/i);

      // Lowercase inr currency:
      expect(() => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES ('prod_inr_lower', 'inr-lower-slug', 'P', 'D', ?, 150000, 'inr', 'PLA', 'C', 'M', 'F')
        `).run(category.id);
      }).toThrow(/CHECK constraint/i);

      // Valid zero paise:
      expect(() => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES ('prod_zero_paise', 'zero-paise-slug', 'P', 'D', ?, 0, 'INR', 'PLA', 'C', 'M', 'F')
        `).run(category.id);
      }).not.toThrow();

      db.prepare("DELETE FROM products WHERE id = 'prod_zero_paise'").run();
    });

    it('4.2 should reject invalid enum values across all domain check constraints', () => {
      const category = db.prepare('SELECT id FROM categories LIMIT 1').get() as { id: string };

      // Invalid publication_status
      expect(() => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise, publication_status,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES ('p_bad_pub', 'bad-pub', 'P', 'D', ?, 1000, 'pending_review', 'INR', 'M', 'C', 'MM', 'F')
        `).run(category.id);
      }).toThrow(/CHECK constraint/i);

      // Invalid product weight (<= 0)
      expect(() => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise, weight_grams,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES ('p_bad_wt', 'bad-wt', 'P', 'D', ?, 1000, 0, 'INR', 'M', 'C', 'MM', 'F')
        `).run(category.id);
      }).toThrow(/CHECK constraint/i);

      // Invalid image mime_type (SVG forbidden for upload security)
      expect(() => {
        db.prepare(`
          INSERT INTO product_images (id, product_id, storage_path, public_url, alt_text, file_size_bytes, mime_type)
          VALUES ('img_bad_mime', 'prod_00000000-0000-4000-8000-000000000001', '/a.svg', '/a.svg', 'SVG', 100, 'image/svg+xml')
        `).run();
      }).toThrow(/CHECK constraint/i);

      // Invalid enquiry approximate_quantity (< 1)
      expect(() => {
        db.prepare(`
          INSERT INTO enquiries (id, customer_name, contact_phone, preferred_contact_method, project_type, design_description, approximate_quantity, ip_hash)
          VALUES ('enq_bad_qty', 'Cust', '+919876543210', 'whatsapp', 'other', 'Desc', 0, 'hash')
        `).run();
      }).toThrow(/CHECK constraint/i);

      // Invalid analytics outcome_status
      expect(() => {
        db.prepare(`
          INSERT INTO analytics_events (
            event_id, event_type, timestamp_utc, session_id, page_path,
            referrer_category, device_category, consent_status, outcome_status
          ) VALUES ('evt_bad_outcome', 'page_view', '2026-10-31T12:00:00Z', 'sess_12345678', '/', 'direct', 'desktop', 'granted', 'confirmed_buyer')
        `).run();
      }).toThrow(/CHECK constraint/i);

      // Invalid rollups counter (< 0)
      expect(() => {
        db.prepare(`
          INSERT INTO analytics_daily_product_rollups (
            rollup_date, product_id, impressions, reconciliation_hash
          ) VALUES ('2026-10-31', 'prod_00000000-0000-4000-8000-000000000001', -10, 'hash')
        `).run();
      }).toThrow(/CHECK constraint/i);
    });
  });
});
