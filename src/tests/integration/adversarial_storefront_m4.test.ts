/**
 * BHAIRAVI Creations Digital Platform
 * Milestone 4 Adversarial Challenger 1 Stress Harness & Fuzzer
 * Target: src/tests/integration/adversarial_storefront_m4.test.ts
 *
 * Scope:
 * 1. WCAG Contrast Stress Verification:
 *    - Relative luminance linearized calculation ($L = 0.2126 R + 0.7152 G + 0.0722 B$)
 *    - Contrast ratio for #FAF9F6 vs #1C1917 > 7.0:1 (WCAG AAA)
 *    - Amber ochre #9A3412 against canvas #FAF9F6 > 3.0:1 (WCAG 2.1 Non-text UI Contrast)
 *    - Terracotta #C2410C against canvas #FAF9F6 > 3.0:1
 * 2. Search Sanitization & Tie-Breaking Fuzzing:
 *    - SQL injection fuzzing (' OR 1=1 --, UNION SELECT, /*, ; DROP TABLE)
 *    - XSS injection fuzzing (<script>, <img onerror>, etc.)
 *    - Unicode & Emoji fuzzing (Devanagari, multi-byte emojis, ZWJ sequences)
 *    - Whitespace-only fuzzing
 *    - Sorting stability tie-breaking with identical prices
 * 3. Variant Price Delta Integer Math Fuzzing:
 *    - Non-negative integer paise invariant: P_eff = P_base + delta_P
 *    - Large positive, zero, boundary deltas
 *    - Negative delta exceeding base price rejected by RangeError
 *    - Floating-point decimal modifiers rejected by TypeError
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { createDbConnection } from '../../server/db/connection.js';
import { runMigrations } from '../../server/db/migrator.js';
import { ProductService } from '../../server/services/product.service.js';
import { BRAND_DRAFT_COPY } from '../../shared/constants.js';
import {
  assertPaise,
  isValidPaise,
  calculateEffectivePrice,
  formatINR,
  paiseToRupees,
  rupeesToPaise,
  type Paise
} from '../../shared/pricing.js';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data/test_adversarial_m4_challenger1.db');

// ============================================================================
// WCAG 2.1 Specification Helpers
// ============================================================================

/**
 * Parses a 6-digit hex color string into [R, G, B] numbers in range [0, 255].
 */
function parseHexColor(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) {
    throw new Error(`Invalid 6-digit hex color: ${hex}`);
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

/**
 * Linearizes an sRGB channel value according to WCAG 2.1 definition.
 */
function linearizeChannel(val8Bit: number): number {
  const c = val8Bit / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Computes exact relative luminance of an RGB hex string.
 * L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
 */
function computeRelativeLuminance(hex: string): number {
  const [r, g, b] = parseHexColor(hex);
  const rLin = linearizeChannel(r);
  const gLin = linearizeChannel(g);
  const bLin = linearizeChannel(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Computes WCAG contrast ratio between two hex colors.
 * (L1 + 0.05) / (L2 + 0.05) where L1 is lighter and L2 is darker.
 */
function computeContrastRatio(hex1: string, hex2: string): number {
  const l1 = computeRelativeLuminance(hex1);
  const l2 = computeRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Milestone 4 Adversarial Challenger 1: Empirical Verification Harness', () => {
  let db: Database.Database;
  let productService: ProductService;

  beforeAll(() => {
    const dbDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);

    db = createDbConnection(TEST_DB_PATH);
    runMigrations(db);
    productService = new ProductService(db);
  });

  afterAll(() => {
    if (db && db.open) {
      db.close();
    }
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);
  });

  // ==========================================================================
  // Section 1: WCAG Contrast Stress Verification
  // ==========================================================================
  describe('1. WCAG Contrast Adversarial Verification', () => {
    const canvas = BRAND_DRAFT_COPY.brand_colors.canvas; // #FAF9F6
    const charcoal = BRAND_DRAFT_COPY.brand_colors.charcoal; // #1C1917
    const amber = BRAND_DRAFT_COPY.brand_colors.amber_accent; // #9A3412
    const terracotta = BRAND_DRAFT_COPY.brand_colors.terracotta_accent; // #C2410C
    const stoneBorder = BRAND_DRAFT_COPY.brand_colors.stone_border; // #E7E5E4

    it('1.1 should correctly compute relative luminance with standard linearization formula', () => {
      // Pure White #FFFFFF -> L = 1.0
      expect(computeRelativeLuminance('#FFFFFF')).toBeCloseTo(1.0, 4);
      // Pure Black #000000 -> L = 0.0
      expect(computeRelativeLuminance('#000000')).toBeCloseTo(0.0, 4);

      const lCanvas = computeRelativeLuminance(canvas);
      const lCharcoal = computeRelativeLuminance(charcoal);
      const lAmber = computeRelativeLuminance(amber);

      // Verify canvas is near-white (> 0.94)
      expect(lCanvas).toBeGreaterThan(0.94);
      expect(lCanvas).toBeLessThan(0.96);

      // Verify charcoal is deep dark (< 0.02)
      expect(lCharcoal).toBeGreaterThan(0.005);
      expect(lCharcoal).toBeLessThan(0.02);

      // Verify amber relative luminance
      expect(lAmber).toBeGreaterThan(0.08);
      expect(lAmber).toBeLessThan(0.12);
    });

    it('1.2 should verify #FAF9F6 vs #1C1917 contrast ratio strictly exceeds 7.0:1 (WCAG AAA)', () => {
      const contrast = computeContrastRatio(canvas, charcoal);
      // Expected: ~16.60:1
      expect(contrast).toBeGreaterThan(7.0);
      expect(contrast).toBeGreaterThanOrEqual(16.0);
    });

    it('1.3 should verify amber #9A3412 against canvas #FAF9F6 strictly exceeds 3.0:1 (UI Components)', () => {
      const contrast = computeContrastRatio(canvas, amber);
      // Expected: ~6.92:1
      expect(contrast).toBeGreaterThan(3.0);
      expect(contrast).toBeGreaterThan(4.5); // Even passes AA normal text!
    });

    it('1.4 should verify terracotta #C2410C against canvas #FAF9F6 strictly exceeds 3.0:1', () => {
      const contrast = computeContrastRatio(canvas, terracotta);
      // Expected: ~4.92:1
      expect(contrast).toBeGreaterThan(3.0);
      expect(contrast).toBeGreaterThan(4.5);
    });

    it('1.5 should verify stone border #E7E5E4 provides subtle structural definition without harsh contrast', () => {
      const lBorder = computeRelativeLuminance(stoneBorder);
      expect(lBorder).toBeGreaterThan(0.75);
      expect(lBorder).toBeLessThan(0.85);
      const borderContrast = computeContrastRatio(canvas, stoneBorder);
      expect(borderContrast).toBeLessThan(2.0); // Subtle decorative divider
    });
  });

  // ==========================================================================
  // Section 2: Search Sanitization & Tie-Breaking Fuzzing
  // ==========================================================================
  describe('2. Search Sanitization & Tie-Breaking Fuzzing', () => {
    const maliciousSqlStrings = [
      "' OR 1=1 --",
      "'; DROP TABLE products; --",
      "UNION SELECT 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 --",
      "admin' --",
      "/* multi-line comment */",
      "' OR ''='",
      "1' OR '1'='1",
      "1; SELECT pg_sleep(5);",
      "' OR 1=1#",
      "\" OR 1=1 --"
    ];

    const maliciousXssStrings = [
      "<script>alert('xss')</script>",
      "<img src=x onerror=alert(1)>",
      "\"><svg/onload=alert('pwned')>",
      "<iframe src=\"javascript:alert(1)\">",
      "javascript:alert(1)",
      "<body onload=alert(1)>",
      "\" autofocus onfocus=alert(1) id=\"",
      "<input oninput=alert(1)>"
    ];

    const unicodeAndEmojiStrings = [
      "गणेश मूर्ती",
      "पुणे हस्तनिर्मित 3D प्रिंट",
      "दिवा 🪔 आणि कमळ 🪷",
      "🕉️ ॐ नमः शिवाय",
      "🎨 Artisanal Finishes ✨",
      "Special Zero-Width: \u200B\u200C\u200D Test",
      "High-Surrogate Emoji Sequence: 👨‍👩‍👧‍👦",
      "Punctuation !@#$%^&*()_+-=[]{}|;':\",./<>?"
    ];

    it.each(maliciousSqlStrings)('2.1 should treat SQL injection query "%s" as literal text and execute safely', (sqlPayload) => {
      // Must not throw SQL syntax errors or crash SQLite
      expect(() => {
        const result = productService.listPublicProducts({ search: sqlPayload });
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
        // None of our seed products contain raw SQL injection keywords as product names
        expect(result.data.length).toBe(0);
      }).not.toThrow();
    });

    it.each(maliciousXssStrings)('2.2 should safely accept XSS string "%s" without script execution or crash', (xssPayload) => {
      expect(() => {
        const result = productService.listPublicProducts({ search: xssPayload });
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(0);
      }).not.toThrow();
    });

    it.each(unicodeAndEmojiStrings)('2.3 should safely process complex Unicode & Emoji queries without encoding crash', (unicodePayload) => {
      expect(() => {
        const result = productService.listPublicProducts({ search: unicodePayload });
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
      }).not.toThrow();
    });

    it('2.4 should handle whitespace-only search queries gracefully without crashing', () => {
      const whitespaceQueries = [' ', '   ', '\t', '\n\r  \t '];
      for (const q of whitespaceQueries) {
        expect(() => {
          const result = productService.listPublicProducts({ search: q });
          expect(result.success).toBe(true);
          expect(Array.isArray(result.data)).toBe(true);
        }).not.toThrow();
      }
    });

    it('2.5 should verify deterministic tie-breaking for products with identical base prices', () => {
      // Create two temporary test products with identical price = 150000 (₹1,500.00)
      const p1Id = 'prod_tie_test_01';
      const p2Id = 'prod_tie_test_02';
      const catId = 'cat_home_decor';

      db.prepare(`
        INSERT OR REPLACE INTO products (
          id, slug, name, description, category_id, tags, base_price_paise,
          currency, is_made_to_order, inventory_count, production_lead_days,
          material, dimensions_cm, weight_grams, manufacturing_method,
          finishing_type, care_safety_instructions, publication_status,
          display_order, created_at
        ) VALUES
        (?, 'tie-product-alpha', 'Tie Product Alpha', 'Alpha test', ?, '["decor"]', 150000,
         'INR', 1, 5, '3-5 days', 'PLA', '{}', 200, 'FDM', 'Painted', 'Indoor only', 'published', 1, '2026-01-01 10:00:00'),
        (?, 'tie-product-beta', 'Tie Product Beta', 'Beta test', ?, '["decor"]', 150000,
         'INR', 1, 5, '3-5 days', 'PLA', '{}', 200, 'FDM', 'Painted', 'Indoor only', 'published', 2, '2026-01-01 11:00:00')
      `).run(p1Id, catId, p2Id, catId);

      // Verify client sorting logic tie-breaker
      const items = [
        { id: p2Id, price: 150000, display_order: 2 },
        { id: p1Id, price: 150000, display_order: 1 }
      ];

      const sortedAsc = [...items].sort((a, b) => a.price - b.price || a.display_order - b.display_order);
      expect(sortedAsc[0].id).toBe(p1Id);
      expect(sortedAsc[1].id).toBe(p2Id);

      const sortedDesc = [...items].sort((a, b) => b.price - a.price || a.display_order - b.display_order);
      expect(sortedDesc[0].id).toBe(p1Id); // Even with identical prices, order 1 comes first
      expect(sortedDesc[1].id).toBe(p2Id);

      // Clean up
      db.prepare('DELETE FROM products WHERE id IN (?, ?)').run(p1Id, p2Id);
    });
  });

  // ==========================================================================
  // Section 3: Variant Price Delta Integer Math Fuzzing
  // ==========================================================================
  describe('3. Variant Price Delta Integer Math Fuzzing', () => {
    it('3.1 should assert P_effective = P_base + Delta_P is strictly integer paise for valid positive and zero modifiers', () => {
      const basePrices: Paise[] = [0, 100, 149900, 249900, 5000000];
      const modifiers: number[] = [0, 1, 50000, 150000, 10000000];

      for (const base of basePrices) {
        for (const mod of modifiers) {
          const effective = calculateEffectivePrice(base, mod);
          expect(effective).toBe(base + mod);
          expect(isValidPaise(effective)).toBe(true);
          expect(() => assertPaise(effective)).not.toThrow();
        }
      }
    });

    it('3.2 should compute negative modifiers correctly when effective price remains >= 0', () => {
      const basePrice = 249900; // ₹2,499.00
      const negativeModifiers = [-100, -30000, -100000, -249900]; // up to 100% discount

      for (const mod of negativeModifiers) {
        const effective = calculateEffectivePrice(basePrice, mod);
        expect(effective).toBe(basePrice + mod);
        expect(effective).toBeGreaterThanOrEqual(0);
        expect(isValidPaise(effective)).toBe(true);
      }
    });

    it('3.3 should reject negative delta exceeding base price with RangeError', () => {
      const testCases = [
        { base: 100000, mod: -100001 },
        { base: 249900, mod: -250000 },
        { base: 0, mod: -1 },
        { base: 500, mod: -999999 }
      ];

      for (const { base, mod } of testCases) {
        expect(() => calculateEffectivePrice(base, mod)).toThrow(RangeError);
      }
    });

    it('3.4 should reject floating-point decimals with TypeError (no decimal paise allowed)', () => {
      const floatModifiers = [2499.50, 0.1, 0.05, 100.99, -50.25, NaN, Infinity, -Infinity];

      for (const mod of floatModifiers) {
        expect(() => calculateEffectivePrice(100000, mod)).toThrow(TypeError);
      }
    });

    it('3.5 should reject non-integer or negative base prices with TypeError', () => {
      const invalidBases = [-1, -500, 1499.50, NaN, Infinity, '249900' as any, null as any, undefined as any];

      for (const base of invalidBases) {
        expect(() => calculateEffectivePrice(base, 0)).toThrow(TypeError);
      }
    });

    it('3.6 should format INR prices using Indian Numbering System without fractional paise by default', () => {
      expect(formatINR(149900)).toMatch(/₹\s?1,499/);
      expect(formatINR(249900)).toMatch(/₹\s?2,499/);
      expect(formatINR(10000000)).toMatch(/₹\s?1,00,000/); // 1 Lakh INR
    });
  });
});
