/**
 * BHAIRAVI Creations Digital Platform
 * Integration Test Suite: Database Schema, SQLite WAL, Constraints & Migrations
 * Target: src/tests/integration/db.test.ts
 *
 * Covers: Features F1, F2, F3, F4, F5 (All 9 Suites, 25 Tests)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDbConnection } from '../../server/db/connection.js';
import { runMigrations } from '../../server/db/migrator.js';

// Isolated test database file path
const TEST_DB_PATH = path.resolve(process.cwd(), 'data/test_bhairavi.db');

describe('Database Integration & Invariant Test Suite (Milestone 1)', () => {
  let db: Database.Database;

  beforeAll(() => {
    // Ensure test directory exists and clean up any leftover test database
    const dbDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    // Remove WAL and SHM files if present
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);

    // Initialize database connection using standard factory
    db = createDbConnection(TEST_DB_PATH);
  });

  afterAll(() => {
    if (db && db.open) {
      db.close();
    }
    // Clean up test database files
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);
  });

  // ==========================================================================
  // Suite 1: SQLite Connection Pragmas (Feature F4)
  // ==========================================================================
  describe('1. SQLite Connection Pragmas (F4)', () => {
    it('1.1 should enable Write-Ahead Logging (WAL) journal mode', () => {
      const result = db.pragma('journal_mode', { simple: true }) as string;
      expect(result.toLowerCase()).toBe('wal');
    });

    it('1.2 should strictly enable foreign key enforcement (foreign_keys = ON)', () => {
      const result = db.pragma('foreign_keys', { simple: true }) as number;
      expect(result).toBe(1);
    });

    it('1.3 should set busy_timeout to at least 5000 milliseconds', () => {
      const result = db.pragma('busy_timeout', { simple: true }) as number;
      expect(result).toBeGreaterThanOrEqual(5000);
    });

    it('1.4 should set synchronous mode to NORMAL (1)', () => {
      const result = db.pragma('synchronous', { simple: true }) as number;
      expect(result).toBe(1);
    });
  });

  // ==========================================================================
  // Suite 2: Migration Runner Idempotency & Rollback (Feature F3)
  // ==========================================================================
  describe('2. Migration Runner Engine (F3)', () => {
    it('2.1 should execute all migrations sequentially and track in _migrations table', () => {
      const migrationResult = runMigrations(db);
      expect(migrationResult.applied.length).toBeGreaterThanOrEqual(3);

      // Verify _migrations tracking table
      const rows = db.prepare('SELECT name FROM _migrations ORDER BY id ASC').all() as { name: string }[];
      const names = rows.map((r) => r.name);
      expect(names).toContain('001_initial_schema.sql');
      expect(names).toContain('002_analytics_and_bi.sql');
      expect(names).toContain('003_seed_catalog.sql');
    });

    it('2.2 should be strictly idempotent: running migrations a second time applies 0 migrations', () => {
      const secondRun = runMigrations(db);
      expect(secondRun.applied.length).toBe(0);
      expect(secondRun.skipped.length).toBeGreaterThanOrEqual(3);
    });

    it('2.3 should roll back transaction cleanly on faulty migration without recording it', () => {
      // Create temporary in-memory database to test rollback isolation
      const tempDb = new Database(':memory:');
      tempDb.pragma('foreign_keys = ON');

      // Initialize _migrations table
      tempDb.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          applied_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
        );
      `);

      // Attempt to execute a failing migration block within a transaction
      const faultyMigration = `
        CREATE TABLE valid_test_table (id TEXT PRIMARY KEY);
        CREATE INVALID_SQL_SYNTAX broken_table;
      `;

      expect(() => {
        const executeTransaction = tempDb.transaction(() => {
          tempDb.exec(faultyMigration);
          tempDb.prepare('INSERT INTO _migrations (name) VALUES (?)').run('999_faulty.sql');
        });
        executeTransaction();
      }).toThrow();

      // Assert that valid_test_table was NOT created (transaction rolled back)
      const tableCheck = tempDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='valid_test_table'")
        .get();
      expect(tableCheck).toBeUndefined();

      // Assert _migrations does not contain the faulty migration
      const migrationCheck = tempDb
        .prepare("SELECT name FROM _migrations WHERE name='999_faulty.sql'")
        .get();
      expect(migrationCheck).toBeUndefined();

      tempDb.close();
    });
  });

  // ==========================================================================
  // Suite 3: Table & Index Existence Verification (Feature F1)
  // ==========================================================================
  describe('3. Table and Index Schema Verification (F1)', () => {
    const EXPECTED_TABLES = [
      '_migrations',
      'categories',
      'products',
      'product_images',
      'product_variants',
      'enquiries',
      'enquiry_attachments',
      'enquiry_timeline',
      'admin_users',
      'admin_sessions',
      'audit_logs',
      'system_settings',
      'analytics_events',
      'analytics_daily_product_rollups',
    ];

    it.each(EXPECTED_TABLES)('3.1 should have created table "%s"', (tableName) => {
      const row = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
        .get(tableName);
      expect(row, `Table ${tableName} must exist in database`).toBeDefined();
    });

    const EXPECTED_INDEXES = [
      'idx_products_slug',
      'idx_products_category',
      'idx_products_status',
      'idx_product_images_product',
      'idx_product_variants_product',
      'idx_enquiries_status',
      'idx_admin_sessions_expires',
      'idx_events_timestamp_type',
    ];

    it.each(EXPECTED_INDEXES)('3.2 should have created index "%s"', (indexName) => {
      const row = db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name = ?")
        .get(indexName);
      expect(row, `Index ${indexName} must exist in database`).toBeDefined();
    });
  });

  // ==========================================================================
  // Suite 4: Foreign Key Enforcement (Feature F1)
  // ==========================================================================
  describe('4. Foreign Key Referential Integrity (F1)', () => {
    it('4.1 should pass PRAGMA foreign_key_check with zero violations across all seeded data', () => {
      const violations = db.pragma('foreign_key_check') as any[];
      expect(violations).toEqual([]);
    });

    it('4.2 should reject inserting product with non-existent category_id', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES (
            'test_fk_prod', 'test-fk-slug', 'Test FK Product', 'Description',
            'non_existent_category_id', 149900, 'INR', 'PLA+', 'Care guide', 'FDM', 'Painted'
          )
        `).run();
      }).toThrow(/FOREIGN KEY/i);
    });

    it('4.3 should reject inserting product_image with non-existent product_id', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO product_images (
            id, product_id, storage_path, public_url, alt_text, file_size_bytes, mime_type
          ) VALUES (
            'img_invalid', 'non_existent_product_id', '/path/img.webp', '/uploads/img.webp', 'Alt', 1024, 'image/webp'
          )
        `).run();
      }).toThrow(/FOREIGN KEY/i);
    });

    it('4.4 should reject inserting product_variant with non-existent product_id', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO product_variants (
            id, product_id, sku, variant_name, price_modifier_paise
          ) VALUES (
            'var_invalid', 'non_existent_product_id', 'SKU-INVALID-01', 'Gold Leaf 6in', 50000
          )
        `).run();
      }).toThrow(/FOREIGN KEY/i);
    });

    it('4.5 should block deleting a category that has associated products (ON DELETE RESTRICT)', () => {
      // Find an existing category with products
      const category = db.prepare('SELECT id FROM categories LIMIT 1').get() as { id: string };
      expect(category).toBeDefined();

      expect(() => {
        db.prepare('DELETE FROM categories WHERE id = ?').run(category.id);
      }).toThrow(/FOREIGN KEY/i);
    });
  });

  // ==========================================================================
  // Suite 5: Cascade Deletion & Referential Actions (Feature F1)
  // ==========================================================================
  describe('5. Cascade Deletes & Referential Actions (F1)', () => {
    it('5.1 should cascade delete product_images and product_variants when product is deleted', () => {
      // Insert test category
      db.prepare(`
        INSERT OR IGNORE INTO categories (id, slug, name) VALUES ('cat_cascade_test', 'cascade-test', 'Cascade Test')
      `).run();

      const prodId = 'prod_cascade_target';
      db.prepare(`
        INSERT INTO products (
          id, slug, name, description, category_id, base_price_paise,
          currency, material, care_safety_instructions, manufacturing_method, finishing_type
        ) VALUES (
          ?, 'cascade-product-slug', 'Cascade Target Product', 'Desc',
          'cat_cascade_test', 99900, 'INR', 'Resin', 'Care', 'SLA', 'Polished'
        )
      `).run(prodId);

      // Insert 2 images and 2 variants
      db.prepare(`
        INSERT INTO product_images (id, product_id, storage_path, public_url, alt_text, file_size_bytes, mime_type)
        VALUES ('img_c1', ?, '/p1.webp', '/u1.webp', 'A1', 100, 'image/webp'),
               ('img_c2', ?, '/p2.webp', '/u2.webp', 'A2', 200, 'image/webp')
      `).run(prodId, prodId);

      db.prepare(`
        INSERT INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise)
        VALUES ('var_c1', ?, 'SKU-CAS-1', 'Small', 0),
               ('var_c2', ?, 'SKU-CAS-2', 'Large', 20000)
      `).run(prodId, prodId);

      // Verify records exist
      expect(db.prepare('SELECT COUNT(*) as c FROM product_images WHERE product_id = ?').get(prodId)).toEqual({ c: 2 });
      expect(db.prepare('SELECT COUNT(*) as c FROM product_variants WHERE product_id = ?').get(prodId)).toEqual({ c: 2 });

      // Execute product deletion
      db.prepare('DELETE FROM products WHERE id = ?').run(prodId);

      // Verify cascade deletion
      expect(db.prepare('SELECT COUNT(*) as c FROM product_images WHERE product_id = ?').get(prodId)).toEqual({ c: 0 });
      expect(db.prepare('SELECT COUNT(*) as c FROM product_variants WHERE product_id = ?').get(prodId)).toEqual({ c: 0 });
    });

    it('5.2 should cascade delete enquiry_attachments and enquiry_timeline when enquiry is deleted', () => {
      const enqId = 'enq_cascade_target';
      db.prepare(`
        INSERT INTO enquiries (
          id, customer_name, contact_phone, preferred_contact_method, project_type, design_description, ip_hash
        ) VALUES (
          ?, 'Aarav Sharma', '+919876543210', 'whatsapp', 'custom_figurine', 'Custom miniature figurine', 'hash123'
        )
      `).run(enqId);

      db.prepare(`
        INSERT INTO enquiry_attachments (id, enquiry_id, storage_path, original_filename, file_size_bytes, mime_type, file_sha256)
        VALUES ('att_c1', ?, '/att1.stl', 'model.stl', 50000, 'model/stl', 'sha256_mock')
      `).run(enqId);

      db.prepare(`
        INSERT INTO enquiry_timeline (id, enquiry_id, action_type, note)
        VALUES ('tl_c1', ?, 'status_change', 'Received inquiry'),
               ('tl_c2', ?, 'internal_note', 'Quoted customer via WhatsApp')
      `).run(enqId, enqId);

      expect(db.prepare('SELECT COUNT(*) as c FROM enquiry_attachments WHERE enquiry_id = ?').get(enqId)).toEqual({ c: 1 });
      expect(db.prepare('SELECT COUNT(*) as c FROM enquiry_timeline WHERE enquiry_id = ?').get(enqId)).toEqual({ c: 2 });

      // Delete enquiry
      db.prepare('DELETE FROM enquiries WHERE id = ?').run(enqId);

      // Verify cascade
      expect(db.prepare('SELECT COUNT(*) as c FROM enquiry_attachments WHERE enquiry_id = ?').get(enqId)).toEqual({ c: 0 });
      expect(db.prepare('SELECT COUNT(*) as c FROM enquiry_timeline WHERE enquiry_id = ?').get(enqId)).toEqual({ c: 0 });
    });

    it('5.3 should set referenced_product_id to NULL when referenced product is deleted (ON DELETE SET NULL)', () => {
      db.prepare(`
        INSERT OR IGNORE INTO categories (id, slug, name) VALUES ('cat_setnull_test', 'setnull-test', 'SetNull Test')
      `).run();

      const prodId = 'prod_setnull_target';
      db.prepare(`
        INSERT INTO products (
          id, slug, name, description, category_id, base_price_paise,
          currency, material, care_safety_instructions, manufacturing_method, finishing_type
        ) VALUES (
          ?, 'setnull-product-slug', 'SetNull Product', 'Desc',
          'cat_setnull_test', 199900, 'INR', 'PLA+', 'Care', 'FDM', 'Matte'
        )
      `).run(prodId);

      const enqId = 'enq_setnull_ref';
      db.prepare(`
        INSERT INTO enquiries (
          id, customer_name, contact_phone, preferred_contact_method, project_type,
          design_description, referenced_product_id, ip_hash
        ) VALUES (
          ?, 'Neha Patel', '+919811122233', 'email', 'lithophane', 'Custom lamp query', ?, 'ip_hash'
        )
      `).run(enqId, prodId);

      // Verify referenced_product_id is populated
      const beforeDelete = db.prepare('SELECT referenced_product_id FROM enquiries WHERE id = ?').get(enqId) as any;
      expect(beforeDelete.referenced_product_id).toBe(prodId);

      // Delete the product
      db.prepare('DELETE FROM products WHERE id = ?').run(prodId);

      // Verify enquiry still exists and referenced_product_id is now NULL
      const afterDelete = db.prepare('SELECT referenced_product_id FROM enquiries WHERE id = ?').get(enqId) as any;
      expect(afterDelete).toBeDefined();
      expect(afterDelete.referenced_product_id).toBeNull();
    });
  });

  // ==========================================================================
  // Suite 6: Database CHECK Constraints (Feature F1)
  // ==========================================================================
  describe('6. Database CHECK Constraints Invariants (F1)', () => {
    it('6.1 should enforce CHECK(publication_status IN ("draft", "published", "archived"))', () => {
      const category = db.prepare('SELECT id FROM categories LIMIT 1').get() as { id: string };

      // Valid publication status insert succeeds
      expect(() => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise, publication_status,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type, tags
          ) VALUES ('prod_valid_status', 'valid-status', 'Valid Product', 'D', ?, 10000, 'published', 'INR', 'PLA', 'C', 'M', 'F', '["test"]')
        `).run(category.id);
      }).not.toThrow();
      db.prepare('DELETE FROM products WHERE id = ?').run('prod_valid_status');

      // Invalid publication status throws CHECK constraint violation
      expect(() => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise, publication_status,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES ('prod_invalid_status', 'invalid-status', 'Invalid Product', 'D', ?, 10000, 'pending_review', 'INR', 'PLA', 'C', 'M', 'F')
        `).run(category.id);
      }).toThrow(/CHECK constraint failed/i);
    });

    it('6.2 should enforce CHECK(preferred_contact_method IN ("whatsapp", "phone", "email"))', () => {
      // Invalid contact method throws CHECK constraint violation
      expect(() => {
        db.prepare(`
          INSERT INTO enquiries (
            id, customer_name, contact_phone, preferred_contact_method, project_type, design_description, ip_hash
          ) VALUES ('enq_bad_contact', 'User', '+919876543210', 'telegram', 'custom_figurine', 'Desc', 'hash')
        `).run();
      }).toThrow(/CHECK constraint failed/i);
    });

    it('6.3 should enforce CHECK(project_type IN ("custom_figurine", "architectural_model", "lithophane", "corporate_gifting", "replacement_part", "other"))', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO enquiries (
            id, customer_name, contact_phone, preferred_contact_method, project_type, design_description, ip_hash
          ) VALUES ('enq_bad_proj', 'User', '+919876543210', 'whatsapp', 'invalid_project_type', 'Desc', 'hash')
        `).run();
      }).toThrow(/CHECK constraint failed/i);
    });

    it('6.4 should enforce CHECK(status IN ("new", "contacted", "quoted", "converted", "closed"))', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO enquiries (
            id, customer_name, contact_phone, preferred_contact_method, project_type, design_description, status, ip_hash
          ) VALUES ('enq_bad_stat', 'User', '+919876543210', 'whatsapp', 'other', 'Desc', 'in_progress', 'hash')
        `).run();
      }).toThrow(/CHECK constraint failed/i);
    });

    it('6.5 should enforce CHECK(role IN ("superadmin", "admin", "viewer")) on admin_users', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO admin_users (id, username, email, password_hash, role)
          VALUES ('usr_bad_role', 'hacker', 'hacker@example.com', 'hash', 'superuser')
        `).run();
      }).toThrow(/CHECK constraint failed/i);
    });
  });

  // ==========================================================================
  // Suite 7: Integer INR Pricing Model Invariants (Feature F2)
  // ==========================================================================
  describe('7. Integer INR Pricing Model Invariants (F2)', () => {
    it('7.1 should store all prices in exact integer paise (e.g. ₹1,499.00 = 149900)', () => {
      const product = db.prepare('SELECT base_price_paise, currency FROM products LIMIT 1').get() as {
        base_price_paise: number;
        currency: string;
      };

      expect(product).toBeDefined();
      expect(product.currency).toBe('INR');
      expect(Number.isInteger(product.base_price_paise)).toBe(true);
      expect(product.base_price_paise).toBeGreaterThan(0);
    });

    it('7.2 should reject or prevent fractional floating-point paise distortion', () => {
      const category = db.prepare('SELECT id FROM categories LIMIT 1').get() as { id: string };

      // When inserting base_price_paise with CHECK(base_price_paise = CAST(base_price_paise AS INTEGER))
      // or retrieving it, paise must strictly be integer.
      const insertFloat = () => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES (
            'prod_float_test', 'float-price-test', 'Float Test', 'D', ?, 1499.99, 'INR', 'PLA', 'C', 'M', 'F'
          )
        `).run(category.id);
      };

      // If strict CHECK constraint is present:
      expect(insertFloat).toThrow(/CHECK constraint failed/i);
    });

    it('7.3 should reject negative price values (base_price_paise >= 0)', () => {
      const category = db.prepare('SELECT id FROM categories LIMIT 1').get() as { id: string };

      expect(() => {
        db.prepare(`
          INSERT INTO products (
            id, slug, name, description, category_id, base_price_paise,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES (
            'prod_neg_price', 'neg-price-test', 'Neg Test', 'D', ?, -500, 'INR', 'PLA', 'C', 'M', 'F'
          )
        `).run(category.id);
      }).toThrow(/CHECK constraint failed/i);
    });

    it('7.4 should compute variant price arithmetic with zero floating-point remainder', () => {
      const variant = db.prepare(`
        SELECT p.base_price_paise, v.price_modifier_paise
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        LIMIT 1
      `).get() as { base_price_paise: number; price_modifier_paise: number };

      if (variant) {
        const effectivePrice = variant.base_price_paise + variant.price_modifier_paise;
        expect(Number.isInteger(effectivePrice)).toBe(true);
        expect(effectivePrice % 1).toBe(0);
      }
    });
  });

  // ==========================================================================
  // Suite 8: Seed Data Integrity Verification (Feature F5)
  // ==========================================================================
  describe('8. Authentic Seed Data Verification (F5)', () => {
    it('8.1 should seed default artisanal categories', () => {
      const categories = db.prepare('SELECT slug, name FROM categories ORDER BY display_order ASC').all() as {
        slug: string;
        name: string;
      }[];

      expect(categories.length).toBeGreaterThanOrEqual(4);
      const slugs = categories.map((c) => c.slug);
      expect(slugs).toContain('spiritual-deities');
      expect(slugs).toContain('home-decor');
      expect(slugs).toContain('planters-vases');
      expect(slugs).toContain('architectural-models');
    });

    it('8.2 should seed authentic 3D-printed products with detailed craftsmanship specs', () => {
      const products = db.prepare(`
        SELECT id, slug, name, base_price_paise, currency, material, manufacturing_method, finishing_type, tags
        FROM products
        WHERE publication_status = 'published'
      `).all() as any[];

      expect(products.length).toBeGreaterThanOrEqual(3);

      for (const p of products) {
        expect(p.slug).toMatch(/^[a-z0-9-]+$/);
        expect(p.base_price_paise).toBeGreaterThan(0);
        expect(p.currency).toBe('INR');
        expect(p.material.length).toBeGreaterThan(0);
        expect(p.manufacturing_method.length).toBeGreaterThan(0);
        expect(p.finishing_type.length).toBeGreaterThan(0);

        // Tags should be parseable JSON array
        const tags = JSON.parse(p.tags);
        expect(Array.isArray(tags)).toBe(true);
        expect(tags.length).toBeGreaterThan(0);
      }
    });

    it('8.3 should seed draft brand statement copy in system_settings', () => {
      const heroHeadline = db
        .prepare("SELECT value FROM system_settings WHERE key = 'brand.hero_headline'")
        .get() as { value: string };

      expect(heroHeadline).toBeDefined();
      expect(heroHeadline.value).toBe('Thoughtfully created. Precisely printed. Finished by hand.');
    });
  });

  // ==========================================================================
  // Suite 9: Analytics Storage & Reconciliation Readiness (Foundation for M3)
  // ==========================================================================
  describe('9. Analytics Storage & Reconciliation Readiness (M3 Foundation)', () => {
    it('9.1 should allow inserting immutable analytics event with ISO 8601 UTC timestamp', () => {
      const testEventId = 'evt_test_001_uuid';
      const nowUtc = new Date().toISOString();

      db.prepare(`
        INSERT INTO analytics_events (
          event_id, event_type, timestamp_utc, session_id, page_path,
          referrer_category, device_category, consent_status, outcome_status, metadata
        ) VALUES (
          ?, 'page_view', ?, 'sess_test_12345678', '/products',
          'direct', 'desktop', 'granted', 'not_applicable', '{"test":true}'
        )
      `).run(testEventId, nowUtc);

      const event = db.prepare('SELECT * FROM analytics_events WHERE event_id = ?').get(testEventId) as any;
      expect(event).toBeDefined();
      expect(event.event_type).toBe('page_view');
      expect(event.timestamp_utc).toBe(nowUtc);
      expect(JSON.parse(event.metadata)).toEqual({ test: true });
    });

    it('9.2 should enforce unique constraint on (rollup_date, product_id) in analytics rollups', () => {
      const today = '2026-10-31';
      const prodId = 'prod_test_rollup';

      // Ensure product prerequisite exists if foreign key constraint is active
      db.prepare(`
        INSERT OR IGNORE INTO categories (id, slug, name) VALUES ('cat_test_rollup', 'test-rollup', 'Test Rollup')
      `).run();
      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, slug, name, description, category_id, base_price_paise,
          currency, material, care_safety_instructions, manufacturing_method, finishing_type
        ) VALUES (
          ?, 'rollup-test-prod', 'Rollup Prod', 'Desc', 'cat_test_rollup', 100000,
          'INR', 'PLA+', 'Care', 'FDM', 'Sanded'
        )
      `).run(prodId);

      db.prepare(`
        INSERT INTO analytics_daily_product_rollups (
          rollup_date, product_id, impressions, card_clicks, detail_views,
          unique_view_sessions, amazon_outbound_clicks, whatsapp_outbound_clicks,
          reconciliation_hash
        ) VALUES (?, ?, 10, 5, 2, 2, 1, 0, 'mock_hash')
      `).run(today, prodId);

      // Attempt duplicate insertion for same date and product
      expect(() => {
        db.prepare(`
          INSERT INTO analytics_daily_product_rollups (
            rollup_date, product_id, impressions, reconciliation_hash
          ) VALUES (?, ?, 20, 'duplicate_hash')
        `).run(today, prodId);
      }).toThrow(/UNIQUE constraint failed/i);
    });
  });
});
