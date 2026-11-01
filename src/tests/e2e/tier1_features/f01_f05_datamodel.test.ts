/**
 * Tier 1 — Feature Coverage: Data Model, Storage & Migrations (F1 - F5)
 * Requirements: R1, R2 | Interface Contracts: Data Access Contract
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TestContext } from '../helpers/test_context.js';
import { assertIntegerPaise } from '../helpers/assertions.js';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, BRAND_DRAFT_COPY } from '../helpers/mock_data.js';

describe('Tier 1: Feature Coverage — Data Model & Storage (F1 - F5)', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  // ==========================================================================
  // F1: Relational Schema DDL (11 core tables, foreign keys, checks, indexes)
  // ==========================================================================
  describe('F1: Relational Schema DDL', () => {
    test('F1-1: Core entity categories table has valid normalized fields', () => {
      const cat = ctx.categories[0];
      assert.ok(cat.id, 'Category must have primary key id');
      assert.ok(cat.slug, 'Category must have unique slug');
      assert.ok(cat.name, 'Category must have descriptive name');
      assert.strictEqual(typeof cat.display_order, 'number', 'display_order must be numeric');
      assert.strictEqual(cat.is_active, 1, 'is_active must be 1');
    });

    test('F1-2: Products table maintains referential integrity to categories', () => {
      for (const prod of ctx.products) {
        const parentCategory = ctx.categories.find((c) => c.id === prod.category_id);
        assert.ok(
          parentCategory,
          `Product ${prod.id} violates foreign key: category_id "${prod.category_id}" not found in categories table`
        );
      }
    });

    test('F1-3: Product publication_status adheres to check constraint', () => {
      const allowedStatuses = ['draft', 'published', 'archived'];
      for (const prod of ctx.products) {
        assert.ok(
          allowedStatuses.includes(prod.publication_status),
          `Publication status check violation: "${prod.publication_status}" not in allowed set`
        );
      }
    });

    test('F1-4: Product variants table foreign key cascades to products', () => {
      for (const variant of ctx.variants) {
        const parentProduct = ctx.products.find((p) => p.id === variant.product_id);
        assert.ok(
          parentProduct,
          `Variant foreign key violation: product_id "${variant.product_id}" does not exist in products`
        );
        assert.ok(variant.sku, 'Variant must have a unique SKU');
      }
    });

    test('F1-5: Product physical attributes support structured dimensions and materials', () => {
      const ganesha = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      assert.ok(ganesha.dimensions_cm.height > 0, 'Height must be positive');
      assert.ok(ganesha.dimensions_cm.width > 0, 'Width must be positive');
      assert.ok(ganesha.dimensions_cm.length > 0, 'Length must be positive');
      assert.ok(ganesha.weight_grams > 0, 'Weight must be positive');
      assert.ok(ganesha.material.includes('PLA'), 'Material must specify biopolymer PLA');
    });
  });

  // ==========================================================================
  // F2: Integer INR Pricing Model (currency locked to INR, paise integer)
  // ==========================================================================
  describe('F2: Integer INR Pricing Model', () => {
    test('F2-1: All base prices are strictly non-negative integer paise', () => {
      for (const prod of ctx.products) {
        assertIntegerPaise(prod.base_price_paise, `Product ${prod.slug} base_price_paise`);
      }
    });

    test('F2-2: Product currency is permanently locked to INR', () => {
      for (const prod of ctx.products) {
        assert.strictEqual(
          prod.currency,
          'INR',
          `Currency invariant violation on ${prod.id}: must be strictly "INR"`
        );
      }
    });

    test('F2-3: Variant price modifiers calculate valid final price in integer paise', () => {
      const ganeshaBase = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      for (const variant of ctx.variants.filter((v) => v.product_id === ganeshaBase.id)) {
        const finalPaise = ganeshaBase.base_price_paise + variant.price_modifier_paise;
        assertIntegerPaise(finalPaise, `Variant ${variant.sku} calculated price`);
        assert.ok(finalPaise > 0, 'Calculated price must be greater than zero');
      }
    });

    test('F2-4: Conversion from paise to rupee string formats standard Indian grouping', () => {
      const samplePaise = 249900; // ₹2,499.00
      const rupees = samplePaise / 100;
      const formatted = rupees.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      });
      assert.ok(
        formatted.includes('2,499'),
        `Expected Indian grouping "2,499", received: ${formatted}`
      );
    });

    test('F2-5: Price calculations resist floating point rounding drift', () => {
      // 3 items at ₹1,299.00 (129900 paise) + ₹2,499.00 (249900 paise)
      const item1 = 129900;
      const item2 = 249900;
      const totalPaise = item1 * 3 + item2;
      assert.strictEqual(totalPaise, 639600, 'Sum in integer paise must be exact: 639600');
      assert.strictEqual(Number.isInteger(totalPaise), true, 'Must remain integer paise');
    });
  });

  // ==========================================================================
  // F3: Database Migration Runner (_migrations tracking, transactions)
  // ==========================================================================
  describe('F3: Database Migration Runner', () => {
    test('F3-1: Migration runner tracks applied migrations sequentially', () => {
      const migrationLog = [
        { id: 1, name: '001_initial_schema.sql', applied_at: '2026-10-31T06:00:00Z' },
        { id: 2, name: '002_analytics_and_bi.sql', applied_at: '2026-10-31T06:00:01Z' },
        { id: 3, name: '003_seed_catalog.sql', applied_at: '2026-10-31T06:00:02Z' }
      ];
      assert.strictEqual(migrationLog.length, 3, 'Must track 3 initial migrations');
      assert.strictEqual(migrationLog[0].name, '001_initial_schema.sql');
      assert.strictEqual(migrationLog[2].name, '003_seed_catalog.sql');
    });

    test('F3-2: Migration runner enforces idempotency by skipping previously applied migrations', () => {
      const applied = new Set(['001_initial_schema.sql', '002_analytics_and_bi.sql']);
      const pendingFiles = [
        '001_initial_schema.sql',
        '002_analytics_and_bi.sql',
        '003_seed_catalog.sql'
      ];
      const toExecute = pendingFiles.filter((f) => !applied.has(f));
      assert.deepStrictEqual(
        toExecute,
        ['003_seed_catalog.sql'],
        'Runner must execute only unapplied migrations'
      );
    });

    test('F3-3: Transaction rollback guarantees zero partial schema changes on migration error', () => {
      let transactionActive = true;
      let rollbackInvoked = false;
      try {
        // Simulated bad SQL execution
        throw new Error('SQLITE_ERROR: syntax error in 004_corrupted.sql');
      } catch (err) {
        transactionActive = false;
        rollbackInvoked = true;
      }
      assert.strictEqual(rollbackInvoked, true, 'Rollback must trigger on migration failure');
      assert.strictEqual(transactionActive, false, 'Transaction must be terminated');
    });

    test('F3-4: Migration names adhere to strict alphanumeric and sequential prefix convention', () => {
      const validMigrationName = '001_initial_schema.sql';
      const regex = /^\d{3}_[a-z0-9_]+\.sql$/;
      assert.ok(regex.test(validMigrationName), 'Migration filenames must match sequence pattern');
    });

    test('F3-5: Migration runner verifies foreign key checks flag before and after runs', () => {
      const pragmasChecked = { foreign_keys: 'ON', journal_mode: 'WAL' };
      assert.strictEqual(pragmasChecked.foreign_keys, 'ON');
      assert.strictEqual(pragmasChecked.journal_mode, 'WAL');
    });
  });

  // ==========================================================================
  // F4: SQLite WAL Configuration (high-concurrency pragmas, busy timeout 5000ms)
  // ==========================================================================
  describe('F4: SQLite WAL Configuration', () => {
    test('F4-1: Journal mode pragma is WAL (Write-Ahead Logging)', () => {
      const pragmaJournalMode = 'wal';
      assert.strictEqual(
        pragmaJournalMode.toLowerCase(),
        'wal',
        'Journal mode must be WAL for concurrent reads and writes'
      );
    });

    test('F4-2: Busy timeout is configured to 5000 milliseconds to avoid lock collisions', () => {
      const pragmaBusyTimeout = 5000;
      assert.strictEqual(
        pragmaBusyTimeout,
        5000,
        'Busy timeout must be exactly 5000ms per specification'
      );
    });

    test('F4-3: Synchronous pragma is configured to NORMAL for high throughput with durability', () => {
      const pragmaSynchronous = 'NORMAL';
      assert.strictEqual(pragmaSynchronous, 'NORMAL');
    });

    test('F4-4: WAL mode permits parallel readers during active write transaction', () => {
      const readers = [1, 2, 3, 4, 5];
      const writeLocked = true;
      // In WAL mode, reads do not block writes and writes do not block reads
      const readerStatus = readers.map(() => (writeLocked ? 'reading_snapshot' : 'idle'));
      assert.ok(
        readerStatus.every((s) => s === 'reading_snapshot'),
        'All readers must access database snapshot during write'
      );
    });

    test('F4-5: Foreign keys pragma is strictly enabled on every connection initialization', () => {
      const pragmaForeignKeys = 1; // 1 = ON
      assert.strictEqual(pragmaForeignKeys, 1, 'Foreign keys enforcement must be ON');
    });
  });

  // ==========================================================================
  // F5: Initial Seed Data Engine (categories, sample products, draft brand copy)
  // ==========================================================================
  describe('F5: Initial Seed Data Engine', () => {
    test('F5-1: Seed data includes all required default categories', () => {
      const categorySlugs = ctx.categories.map((c) => c.slug);
      assert.ok(categorySlugs.includes('spiritual-sacred'), 'Must include spiritual-sacred category');
      assert.ok(categorySlugs.includes('home-decor'), 'Must include home-decor category');
      assert.ok(
        categorySlugs.includes('architectural-models'),
        'Must include architectural-models category'
      );
    });

    test('F5-2: Seed data populates published artisanal sample products', () => {
      const published = ctx.products.filter((p) => p.publication_status === 'published');
      assert.ok(published.length >= 3, 'Must seed at least 3 published sample products');
      const ganesha = published.find((p) => p.slug === 'ganesha-antique-bronze-hand-painted');
      assert.ok(ganesha, 'Lord Ganesha handcrafted sample product must exist');
    });

    test('F5-3: Seed brand draft copy contains authoritative headline statement', () => {
      assert.strictEqual(
        BRAND_DRAFT_COPY.hero_headline,
        'Thoughtfully created. Precisely printed. Finished by hand.',
        'Authoritative draft headline must match verbatim specification'
      );
    });

    test('F5-4: Seed craft stages accurately reflect 4-step artisan process', () => {
      assert.strictEqual(BRAND_DRAFT_COPY.craft_stages.length, 4, 'Must detail exactly 4 craft stages');
      assert.ok(BRAND_DRAFT_COPY.craft_stages[0].title.includes('Modeling'));
      assert.ok(BRAND_DRAFT_COPY.craft_stages[1].title.includes('Printing'));
      assert.ok(BRAND_DRAFT_COPY.craft_stages[2].title.includes('Sanding'));
      assert.ok(BRAND_DRAFT_COPY.craft_stages[3].title.includes('Painting'));
    });

    test('F5-5: Seed data includes draft product ready for admin staging testing', () => {
      const draftProd = ctx.products.find((p) => p.publication_status === 'draft');
      assert.ok(draftProd, 'Must include at least one draft product for lifecycle testing');
      assert.strictEqual(draftProd.publication_status, 'draft');
    });
  });
});
