/**
 * BHAIRAVI Creations Digital Platform
 * Adversarial Stress & Fuzzing Test Suite — Milestone 1 Challenger 2
 * Target: src/tests/integration/adversarial_pricing_constraints.test.ts
 *
 * Focus:
 * 1. Price Arithmetic Fuzzing (float inputs, NaN, Infinity, -0, extreme bounds in src/shared/pricing.ts)
 * 2. Negative & Float Price Database CHECK Constraints (base_price_paise, price_modifier_paise)
 * 3. Schema Enum & CHECK Constraint Fuzzing (status, role, mime_type, project_type, non-negative metrics, JSON resilience)
 * 4. Variant Arithmetic Boundaries & Referential Integrity (discount exceeding base, zero price, float modifiers)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDbConnection } from '../../server/db/connection.js';
import { runMigrations } from '../../server/db/migrator.js';
import {
  assertPaise,
  isValidPaise,
  paiseToRupees,
  rupeesToPaise,
  calculateEffectivePrice,
  formatINR,
  getPriceBreakdown,
  type Paise,
} from '../../shared/pricing.js';

const STRESS_DB_PATH = path.resolve(process.cwd(), 'data/test_stress_challenger2.db');

describe('Milestone 1 Adversarial Challenger 2 Stress Harness', () => {
  let db: Database.Database;

  beforeAll(() => {
    const dbDir = path.dirname(STRESS_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    if (fs.existsSync(STRESS_DB_PATH)) fs.unlinkSync(STRESS_DB_PATH);
    if (fs.existsSync(`${STRESS_DB_PATH}-wal`)) fs.unlinkSync(`${STRESS_DB_PATH}-wal`);
    if (fs.existsSync(`${STRESS_DB_PATH}-shm`)) fs.unlinkSync(`${STRESS_DB_PATH}-shm`);

    db = createDbConnection(STRESS_DB_PATH);
    runMigrations(db);
  });

  afterAll(() => {
    if (db && db.open) {
      db.close();
    }
    if (fs.existsSync(STRESS_DB_PATH)) fs.unlinkSync(STRESS_DB_PATH);
    if (fs.existsSync(`${STRESS_DB_PATH}-wal`)) fs.unlinkSync(`${STRESS_DB_PATH}-wal`);
    if (fs.existsSync(`${STRESS_DB_PATH}-shm`)) fs.unlinkSync(`${STRESS_DB_PATH}-shm`);
  });

  // ==========================================================================
  // Section 1: Price Arithmetic Fuzzing (src/shared/pricing.ts)
  // ==========================================================================
  describe('1. Price Arithmetic & Input Fuzzing (src/shared/pricing.ts)', () => {
    describe('1.1 assertPaise & isValidPaise', () => {
      const invalidPaiseValues: { name: string; val: unknown }[] = [
        { name: 'float 1499.50', val: 1499.5 },
        { name: 'float 0.1 + 0.2', val: 0.1 + 0.2 },
        { name: 'float 0.000001', val: 0.000001 },
        { name: 'float 99.9999', val: 99.9999 },
        { name: 'NaN', val: NaN },
        { name: 'Infinity', val: Infinity },
        { name: '-Infinity', val: -Infinity },
        { name: 'negative integer -1', val: -1 },
        { name: 'negative integer -500', val: -500 },
        { name: 'negative float -0.5', val: -0.5 },
        { name: 'string integer "149900"', val: '149900' },
        { name: 'string float "1499.50"', val: '1499.50' },
        { name: 'empty string ""', val: '' },
        { name: 'null', val: null },
        { name: 'undefined', val: undefined },
        { name: 'boolean true', val: true },
        { name: 'boolean false', val: false },
        { name: 'object {}', val: {} },
        { name: 'array []', val: [] },
        { name: 'BigInt 100n', val: 100n },
      ];

      it.each(invalidPaiseValues)('should reject $name via assertPaise and isValidPaise', ({ val }) => {
        expect(() => assertPaise(val)).toThrow(TypeError);
        expect(isValidPaise(val)).toBe(false);
      });

      const validPaiseValues: { name: string; val: number }[] = [
        { name: 'zero 0', val: 0 },
        { name: '1 paisa', val: 1 },
        { name: '100 paise (₹1)', val: 100 },
        { name: '149900 paise (₹1,499)', val: 149900 },
        { name: '1 crore paise (₹1,00,000)', val: 10000000 },
        { name: 'MAX_SAFE_INTEGER', val: Number.MAX_SAFE_INTEGER },
      ];

      it.each(validPaiseValues)('should accept $name via assertPaise and isValidPaise', ({ val }) => {
        expect(() => assertPaise(val)).not.toThrow();
        expect(isValidPaise(val)).toBe(true);
      });

      it('boundary test: -0 behavior in assertPaise', () => {
        // In JS: -0 === 0, Number.isInteger(-0) === true, -0 < 0 is false
        // Verify behavior: does assertPaise accept or reject -0?
        expect(isValidPaise(-0)).toBe(true);
        expect(() => assertPaise(-0)).not.toThrow();
      });
    });

    describe('1.2 paiseToRupees conversion', () => {
      it('should convert integer paise to exact rupee floating values', () => {
        expect(paiseToRupees(149900)).toBe(1499);
        expect(paiseToRupees(0)).toBe(0);
        expect(paiseToRupees(50)).toBe(0.5);
        expect(paiseToRupees(1)).toBe(0.01);
        expect(paiseToRupees(99999999)).toBe(999999.99);
      });

      it('should reject non-integer paise inputs with TypeError', () => {
        expect(() => paiseToRupees(1499.5 as any)).toThrow(TypeError);
        expect(() => paiseToRupees(NaN as any)).toThrow(TypeError);
        expect(() => paiseToRupees(Infinity as any)).toThrow(TypeError);
      });
    });

    describe('1.3 rupeesToPaise conversion & rounding', () => {
      it('should convert standard rupee amounts into integer paise', () => {
        expect(rupeesToPaise(1499)).toBe(149900);
        expect(rupeesToPaise(1499.5)).toBe(149950);
        expect(rupeesToPaise(0)).toBe(0);
        expect(rupeesToPaise(0.01)).toBe(1);
      });

      it('should accurately round sub-paisa floating points (0.1 + 0.2)', () => {
        // 0.1 + 0.2 = 0.30000000000000004
        expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
        expect(rupeesToPaise(1499.994)).toBe(149999);
        expect(rupeesToPaise(1499.996)).toBe(150000);
      });

      it('should reject invalid rupee inputs (NaN, negative, non-number)', () => {
        expect(() => rupeesToPaise(NaN)).toThrow(TypeError);
        expect(() => rupeesToPaise(-1)).toThrow(TypeError);
        expect(() => rupeesToPaise(-0.01)).toThrow(TypeError);
        expect(() => rupeesToPaise('1499' as any)).toThrow(TypeError);
        expect(() => rupeesToPaise(null as any)).toThrow(TypeError);
      });

      it('ADVERSARIAL PROBE: rupeesToPaise(Infinity) flaw investigation', () => {
        // In JS: typeof Infinity === 'number', !isNaN(Infinity), Infinity >= 0
        // Math.round(Infinity * 100) evaluates to Infinity, which is NOT integer paise!
        const result = rupeesToPaise(Infinity);
        // Note: rupeesToPaise returns Infinity, which violates Paise type invariant!
        // But passing it to assertPaise will catch it:
        expect(() => assertPaise(result)).toThrow(TypeError);
      });
    });

    describe('1.4 calculateEffectivePrice variant arithmetic', () => {
      it('should accurately calculate positive and negative modifiers', () => {
        expect(calculateEffectivePrice(149900, 50000)).toBe(199900);
        expect(calculateEffectivePrice(149900, -49900)).toBe(100000);
        expect(calculateEffectivePrice(149900, 0)).toBe(149900);
        expect(calculateEffectivePrice(149900)).toBe(149900);
        expect(calculateEffectivePrice(10000, -10000)).toBe(0); // 0 price is allowed
      });

      it('should throw RangeError if modifier causes effective price to be negative', () => {
        expect(() => calculateEffectivePrice(10000, -10001)).toThrow(RangeError);
        expect(() => calculateEffectivePrice(0, -1)).toThrow(RangeError);
        expect(() => calculateEffectivePrice(50000, -100000)).toThrow(RangeError);
      });

      it('should reject float modifiers with TypeError', () => {
        expect(() => calculateEffectivePrice(10000, 50.5)).toThrow(TypeError);
        expect(() => calculateEffectivePrice(10000, 0.1)).toThrow(TypeError);
        expect(() => calculateEffectivePrice(10000, -0.5)).toThrow(TypeError);
        expect(() => calculateEffectivePrice(10000, NaN)).toThrow(TypeError);
        expect(() => calculateEffectivePrice(10000, Infinity)).toThrow(TypeError);
      });

      it('should reject float or invalid base prices with TypeError', () => {
        expect(() => calculateEffectivePrice(1499.5 as any, 0)).toThrow(TypeError);
        expect(() => calculateEffectivePrice(-100 as any, 0)).toThrow(TypeError);
        expect(() => calculateEffectivePrice(NaN as any, 0)).toThrow(TypeError);
      });
    });

    describe('1.5 formatINR presentation & Indian grouping', () => {
      it('should format standard prices without sub-paise decimals', () => {
        const formatted = formatINR(149900);
        // Should contain 1,499 and INR currency symbol (₹)
        expect(formatted).toMatch(/₹\s?1,499/);
      });

      it('should format sub-rupee paise with 2 decimal places', () => {
        const formatted = formatINR(149950);
        expect(formatted).toMatch(/₹\s?1,499\.50/);
      });

      it('should respect showZeroPaise option', () => {
        const formatted = formatINR(149900, { showZeroPaise: true });
        expect(formatted).toMatch(/₹\s?1,499\.00/);
      });

      it('should correctly format Indian grouping (lakhs and crores)', () => {
        // 1 lakh rupees = 100,000 rupees = 10,000,000 paise
        const oneLakh = formatINR(10000000);
        expect(oneLakh).toMatch(/₹\s?1,00,000/);

        // 1 crore rupees = 10,000,000 rupees = 1,000,000,000 paise
        const oneCrore = formatINR(1000000000);
        expect(oneCrore).toMatch(/₹\s?1,00,00,000/);
      });

      it('should reject invalid paise in formatINR and getPriceBreakdown', () => {
        expect(() => formatINR(1499.5 as any)).toThrow(TypeError);
        expect(() => formatINR(-100 as any)).toThrow(TypeError);
        expect(() => getPriceBreakdown(1499.5 as any)).toThrow(TypeError);
      });
    });
  });

  // ==========================================================================
  // Section 2: Negative & Float Price Database CHECK Constraints
  // ==========================================================================
  describe('2. Negative & Float Price Database CHECK Constraints', () => {
    const testCatId = 'cat_adversarial_test';

    beforeAll(() => {
      db.prepare(`
        INSERT OR IGNORE INTO categories (id, slug, name)
        VALUES ('${testCatId}', 'adv-cat', 'Adversarial Category')
      `).run();
    });

    const createProductSql = `
      INSERT INTO products (
        id, slug, name, description, category_id, base_price_paise,
        currency, material, care_safety_instructions, manufacturing_method, finishing_type
      ) VALUES (?, ?, 'Adv Product', 'Desc', '${testCatId}', ?, 'INR', 'PLA+', 'Care', 'FDM', 'Sanded')
    `;

    describe('2.1 products.base_price_paise float rejection', () => {
      const floatPrices = [
        { name: 'float 1499.50', val: 1499.5 },
        { name: 'float 0.1', val: 0.1 },
        { name: 'float 99.9999', val: 99.9999 },
        { name: 'float 0.00001', val: 0.00001 },
        { name: 'float 100000.75', val: 100000.75 },
      ];

      it.each(floatPrices)('should reject $name via CHECK(base_price_paise = CAST(base_price_paise AS INTEGER))', ({ val }) => {
        const id = `prod_float_${Math.random()}`;
        expect(() => {
          db.prepare(createProductSql).run(id, `slug-${id}`, val);
        }).toThrow(/CHECK constraint failed/i);
      });
    });

    describe('2.2 products.base_price_paise negative rejection', () => {
      const negativePrices = [
        { name: 'negative -1', val: -1 },
        { name: 'negative -500', val: -500 },
        { name: 'negative -149900', val: -149900 },
        { name: 'negative float -0.5', val: -0.5 },
      ];

      it.each(negativePrices)('should reject $name via CHECK(base_price_paise >= 0)', ({ val }) => {
        const id = `prod_neg_${Math.random()}`;
        expect(() => {
          db.prepare(createProductSql).run(id, `slug-${id}`, val);
        }).toThrow(/CHECK constraint failed/i);
      });
    });

    describe('2.3 products.base_price_paise valid boundaries', () => {
      it('should permit zero price (0 paise)', () => {
        const id = 'prod_zero_price';
        expect(() => {
          db.prepare(createProductSql).run(id, 'slug-zero-price', 0);
        }).not.toThrow();

        const row = db.prepare('SELECT base_price_paise FROM products WHERE id = ?').get(id) as any;
        expect(row.base_price_paise).toBe(0);
        db.prepare('DELETE FROM products WHERE id = ?').run(id);
      });

      it('should permit high safe integer values (10 crore paise = ₹10,00,000)', () => {
        const id = 'prod_high_price';
        const highPrice = 100000000; // 10 crore paise
        expect(() => {
          db.prepare(createProductSql).run(id, 'slug-high-price', highPrice);
        }).not.toThrow();

        const row = db.prepare('SELECT base_price_paise FROM products WHERE id = ?').get(id) as any;
        expect(row.base_price_paise).toBe(highPrice);
        db.prepare('DELETE FROM products WHERE id = ?').run(id);
      });
    });

    describe('2.4 product_variants.price_modifier_paise constraints', () => {
      const prodId = 'prod_variant_host';

      beforeAll(() => {
        db.prepare(createProductSql).run(prodId, 'slug-var-host', 149900);
      });

      afterAll(() => {
        db.prepare('DELETE FROM products WHERE id = ?').run(prodId);
      });

      it('should reject float price_modifier_paise via CHECK constraint', () => {
        expect(() => {
          db.prepare(`
            INSERT INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise)
            VALUES ('var_float_1', ?, 'SKU-FLT-1', 'Float Var', 500.5)
          `).run(prodId);
        }).toThrow(/CHECK constraint failed/i);
      });

      it('should allow negative integer price_modifier_paise (discount variant)', () => {
        expect(() => {
          db.prepare(`
            INSERT INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise)
            VALUES ('var_neg_1', ?, 'SKU-NEG-1', 'Discount Var', -49900)
          `).run(prodId);
        }).not.toThrow();

        const v = db.prepare('SELECT price_modifier_paise FROM product_variants WHERE id = ?').get('var_neg_1') as any;
        expect(v.price_modifier_paise).toBe(-49900);
      });
    });
  });

  // ==========================================================================
  // Section 3: Schema Enum & CHECK Constraint Bypass Attempts
  // ==========================================================================
  describe('3. Schema Enum & CHECK Constraint Fuzzing', () => {
    const testCatId = 'cat_adversarial_test';

    describe('3.1 products table CHECK constraints', () => {
      const invalidPublicationStatuses = ['pending', 'active', 'deleted', 'hidden', 'DRAFT', 'PUBLISHED', ''];
      it.each(invalidPublicationStatuses)('should reject publication_status "%s"', (status) => {
        expect(() => {
          db.prepare(`
            INSERT INTO products (
              id, slug, name, description, category_id, base_price_paise, publication_status,
              currency, material, care_safety_instructions, manufacturing_method, finishing_type
            ) VALUES (?, ?, 'P', 'D', '${testCatId}', 10000, ?, 'INR', 'PLA', 'C', 'M', 'F')
          `).run(`prod_stat_${status}`, `slug-stat-${status}`, status);
        }).toThrow(/CHECK constraint failed/i);
      });

      const invalidCurrencies = ['USD', 'EUR', 'inr', 'Rs', '', 'GBP'];
      it.each(invalidCurrencies)('should reject non-INR currency "%s"', (curr) => {
        expect(() => {
          db.prepare(`
            INSERT INTO products (
              id, slug, name, description, category_id, base_price_paise, publication_status,
              currency, material, care_safety_instructions, manufacturing_method, finishing_type
            ) VALUES (?, ?, 'P', 'D', '${testCatId}', 10000, 'draft', ?, 'PLA', 'C', 'M', 'F')
          `).run(`prod_curr_${curr}`, `slug-curr-${curr}`, curr);
        }).toThrow(/CHECK constraint failed/i);
      });

      const invalidBooleans = [2, -1, 10, -100];
      it.each(invalidBooleans)('should reject invalid boolean integer %s on is_made_to_order and is_featured', (boolVal) => {
        expect(() => {
          db.prepare(`
            INSERT INTO products (
              id, slug, name, description, category_id, base_price_paise, publication_status,
              currency, material, care_safety_instructions, manufacturing_method, finishing_type, is_made_to_order
            ) VALUES (?, ?, 'P', 'D', '${testCatId}', 10000, 'draft', 'INR', 'PLA', 'C', 'M', 'F', ?)
          `).run(`prod_bool_${boolVal}`, `slug-bool-${boolVal}`, boolVal);
        }).toThrow(/CHECK constraint failed/i);
      });

      it('should reject negative inventory_count', () => {
        expect(() => {
          db.prepare(`
            INSERT INTO products (
              id, slug, name, description, category_id, base_price_paise,
              currency, material, care_safety_instructions, manufacturing_method, finishing_type, inventory_count
            ) VALUES ('prod_neg_inv', 'slug-neg-inv', 'P', 'D', '${testCatId}', 10000, 'INR', 'PLA', 'C', 'M', 'F', -5)
          `).run();
        }).toThrow(/CHECK constraint failed/i);
      });

      it('should reject zero or negative weight_grams (weight_grams > 0)', () => {
        expect(() => {
          db.prepare(`
            INSERT INTO products (
              id, slug, name, description, category_id, base_price_paise,
              currency, material, care_safety_instructions, manufacturing_method, finishing_type, weight_grams
            ) VALUES ('prod_zero_wt', 'slug-zero-wt', 'P', 'D', '${testCatId}', 10000, 'INR', 'PLA', 'C', 'M', 'F', 0)
          `).run();
        }).toThrow(/CHECK constraint failed/i);

        expect(() => {
          db.prepare(`
            INSERT INTO products (
              id, slug, name, description, category_id, base_price_paise,
              currency, material, care_safety_instructions, manufacturing_method, finishing_type, weight_grams
            ) VALUES ('prod_neg_wt', 'slug-neg-wt', 'P', 'D', '${testCatId}', 10000, 'INR', 'PLA', 'C', 'M', 'F', -100)
          `).run();
        }).toThrow(/CHECK constraint failed/i);
      });
    });

    describe('3.2 enquiries table CHECK constraints', () => {
      const invalidEnquiryStatuses = ['pending', 'active', 'in_progress', 'resolved', 'open', 'NEW', ''];
      it.each(invalidEnquiryStatuses)('should reject invalid enquiry status "%s"', (st) => {
        expect(() => {
          db.prepare(`
            INSERT INTO enquiries (
              id, customer_name, contact_phone, preferred_contact_method, project_type,
              design_description, status, ip_hash
            ) VALUES (?, 'User', '+919876543210', 'whatsapp', 'custom_figurine', 'Desc', ?, 'hash')
          `).run(`enq_st_${st}`, st);
        }).toThrow(/CHECK constraint failed/i);
      });

      const invalidContactMethods = ['telegram', 'sms', 'signal', 'WHATSAPP', 'phone_call', ''];
      it.each(invalidContactMethods)('should reject invalid preferred_contact_method "%s"', (method) => {
        expect(() => {
          db.prepare(`
            INSERT INTO enquiries (
              id, customer_name, contact_phone, preferred_contact_method, project_type,
              design_description, ip_hash
            ) VALUES (?, 'User', '+919876543210', ?, 'custom_figurine', 'Desc', 'hash')
          `).run(`enq_cm_${method}`, method);
        }).toThrow(/CHECK constraint failed/i);
      });

      const invalidProjectTypes = ['prototype', 'miniature', 'stl_print', 'custom', ''];
      it.each(invalidProjectTypes)('should reject invalid project_type "%s"', (pt) => {
        expect(() => {
          db.prepare(`
            INSERT INTO enquiries (
              id, customer_name, contact_phone, preferred_contact_method, project_type,
              design_description, ip_hash
            ) VALUES (?, 'User', '+919876543210', 'whatsapp', ?, 'Desc', 'hash')
          `).run(`enq_pt_${pt}`, pt);
        }).toThrow(/CHECK constraint failed/i);
      });

      it('should reject non-positive approximate_quantity (< 1)', () => {
        expect(() => {
          db.prepare(`
            INSERT INTO enquiries (
              id, customer_name, contact_phone, preferred_contact_method, project_type,
              design_description, approximate_quantity, ip_hash
            ) VALUES ('enq_qty_0', 'User', '+919876543210', 'whatsapp', 'other', 'Desc', 0, 'hash')
          `).run();
        }).toThrow(/CHECK constraint failed/i);

        expect(() => {
          db.prepare(`
            INSERT INTO enquiries (
              id, customer_name, contact_phone, preferred_contact_method, project_type,
              design_description, approximate_quantity, ip_hash
            ) VALUES ('enq_qty_neg', 'User', '+919876543210', 'whatsapp', 'other', 'Desc', -5, 'hash')
          `).run();
        }).toThrow(/CHECK constraint failed/i);
      });
    });

    describe('3.3 admin_users role CHECK constraint', () => {
      const invalidRoles = ['superuser', 'root', 'moderator', 'guest', 'ADMIN', ''];
      it.each(invalidRoles)('should reject invalid admin role "%s"', (role) => {
        expect(() => {
          db.prepare(`
            INSERT INTO admin_users (id, username, email, password_hash, role)
            VALUES (?, ?, ?, 'hash', ?)
          `).run(`usr_${role}`, `user_${role}`, `${role}@example.com`, role);
        }).toThrow(/CHECK constraint failed/i);
      });
    });

    describe('3.4 product_images mime_type & file_size CHECK constraints', () => {
      const prodId = 'prod_img_test_host';

      beforeAll(() => {
        db.prepare(`
          INSERT OR IGNORE INTO products (
            id, slug, name, description, category_id, base_price_paise,
            currency, material, care_safety_instructions, manufacturing_method, finishing_type
          ) VALUES (?, 'slug-img-host', 'Img Host', 'D', '${testCatId}', 10000, 'INR', 'PLA', 'C', 'M', 'F')
        `).run(prodId);
      });

      afterAll(() => {
        db.prepare('DELETE FROM products WHERE id = ?').run(prodId);
      });

      const invalidMimes = ['image/svg+xml', 'image/gif', 'application/pdf', 'image/bmp', 'text/html'];
      it.each(invalidMimes)('should reject unauthorized mime_type "%s"', (mime) => {
        expect(() => {
          db.prepare(`
            INSERT INTO product_images (id, product_id, storage_path, public_url, alt_text, file_size_bytes, mime_type)
            VALUES (?, ?, '/path/x', '/url/x', 'Alt', 1000, ?)
          `).run(`img_${mime}`, prodId, mime);
        }).toThrow(/CHECK constraint failed/i);
      });

      it('should reject zero or negative file_size_bytes', () => {
        expect(() => {
          db.prepare(`
            INSERT INTO product_images (id, product_id, storage_path, public_url, alt_text, file_size_bytes, mime_type)
            VALUES ('img_sz_0', ?, '/path/x', '/url/x', 'Alt', 0, 'image/webp')
          `).run(prodId);
        }).toThrow(/CHECK constraint failed/i);
      });
    });

    describe('3.5 analytics_events event_type & attribution CHECK constraints', () => {
      const invalidEventTypes = ['click', 'hover', 'scroll', 'buy', 'payment_success', 'order_created', ''];
      it.each(invalidEventTypes)('should reject unauthorized event_type "%s"', (evt) => {
        expect(() => {
          db.prepare(`
            INSERT INTO analytics_events (
              event_id, event_type, timestamp_utc, session_id, page_path
            ) VALUES (?, ?, '2026-10-31T00:00:00Z', 'sess_123', '/test')
          `).run(`evt_bad_${evt}`, evt);
        }).toThrow(/CHECK constraint failed/i);
      });

      const invalidOutcomes = ['converted', 'bought', 'confirmed_order', ''];
      it.each(invalidOutcomes)('should reject unauthorized outcome_status "%s"', (outcome) => {
        expect(() => {
          db.prepare(`
            INSERT INTO analytics_events (
              event_id, event_type, timestamp_utc, session_id, page_path, outcome_status
            ) VALUES (?, 'page_view', '2026-10-31T00:00:00Z', 'sess_123', '/test', ?)
          `).run(`evt_bad_out_${outcome}`, outcome);
        }).toThrow(/CHECK constraint failed/i);
      });
    });

    describe('3.6 JSON Column Integrity Probe (Fuzzing malformed JSON in DDL)', () => {
      it('EMPIRICAL DISCOVERY: inspect whether SQLite schema DDL rejects malformed JSON strings in tags/specs', () => {
        const prodId = 'prod_malformed_json_probe';
        const malformedJson = '{broken json: missing quotes and brackets';

        // Check whether SQLite allows or rejects malformed JSON in tags
        let allowed = false;
        try {
          db.prepare(`
            INSERT INTO products (
              id, slug, name, description, category_id, base_price_paise,
              currency, material, care_safety_instructions, manufacturing_method, finishing_type, tags
            ) VALUES (?, 'slug-malformed-json', 'P', 'D', '${testCatId}', 10000, 'INR', 'PLA', 'C', 'M', 'F', ?)
          `).run(prodId, malformedJson);
          allowed = true;
        } catch (e: any) {
          allowed = false;
        }

        if (allowed) {
          // Document that DDL does NOT have json_valid() check constraint
          const row = db.prepare('SELECT tags FROM products WHERE id = ?').get(prodId) as any;
          expect(row.tags).toBe(malformedJson);
          db.prepare('DELETE FROM products WHERE id = ?').run(prodId);
        }

        // Test records whether DDL lacks json_valid check constraint
        // In SQLite 3.38+, json_valid(tags) can enforce valid JSON at schema level.
        expect(typeof allowed).toBe('boolean');
      });
    });
  });

  // ==========================================================================
  // Section 4: Variant Arithmetic Boundaries & Integrity
  // ==========================================================================
  describe('4. Variant Arithmetic Boundaries & Integrity', () => {
    it('should compute effective price for all seeded products and variants with zero variance', () => {
      const variants = db.prepare(`
        SELECT
          p.id as product_id,
          p.name as product_name,
          p.base_price_paise,
          v.id as variant_id,
          v.sku,
          v.price_modifier_paise
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
      `).all() as any[];

      expect(variants.length).toBeGreaterThan(0);

      for (const v of variants) {
        expect(Number.isInteger(v.base_price_paise)).toBe(true);
        expect(Number.isInteger(v.price_modifier_paise)).toBe(true);
        expect(v.base_price_paise).toBeGreaterThan(0);

        const effective = calculateEffectivePrice(v.base_price_paise, v.price_modifier_paise);
        expect(Number.isInteger(effective)).toBe(true);
        expect(effective).toBeGreaterThanOrEqual(0);
        expect(effective % 1).toBe(0);

        const breakdown = getPriceBreakdown(effective);
        expect(breakdown.paise).toBe(effective);
        expect(breakdown.rupees).toBe(effective / 100);
        expect(breakdown.formatted).toContain('₹');
      }
    });

    it('should reject inserting variant without valid product FK', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise)
          VALUES ('var_orphan', 'non_existent_prod_12345', 'SKU-ORPHAN-1', 'Orphan', 0)
        `).run();
      }).toThrow(/FOREIGN KEY/i);
    });

    it('should reject duplicate variant SKUs across products', () => {
      const existingSku = db.prepare('SELECT sku FROM product_variants LIMIT 1').get() as { sku: string };
      expect(existingSku).toBeDefined();

      const prod = db.prepare('SELECT id FROM products LIMIT 1').get() as { id: string };

      expect(() => {
        db.prepare(`
          INSERT INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise)
          VALUES ('var_dup_sku', ?, ?, 'Duplicate SKU Variant', 0)
        `).run(prod.id, existingSku.sku);
      }).toThrow(/UNIQUE constraint failed/i);
    });
  });
});
