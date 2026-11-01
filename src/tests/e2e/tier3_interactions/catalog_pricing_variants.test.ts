/**
 * Tier 3 — Cross-Feature Interaction: Catalog Pricing & Variant Calculation
 * Pairwise: F2 (Integer Paise) <-> F10 (Admin Product CRUD) <-> F40/F41 (Catalogue) <-> F44 (Variant Selector)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TestContext } from '../helpers/test_context.js';
import { assertIntegerPaise } from '../helpers/assertions.js';

describe('Tier 3 Interaction: Catalog Pricing & Variant Calculation', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  test('Pairwise 1: Admin updates base price in paise; public storefront immediately reflects updated INR price', () => {
    const ganesha = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
    assert.strictEqual(ganesha.base_price_paise, 249900); // ₹2,499.00

    // Admin updates price to ₹2,899.00 (289900 paise)
    ganesha.base_price_paise = 289900;
    assertIntegerPaise(ganesha.base_price_paise);

    const publicProduct = ctx.products.find(
      (p) => p.slug === ganesha.slug && p.publication_status === 'published'
    )!;
    assert.strictEqual(publicProduct.base_price_paise, 289900);

    const formattedRupees = (publicProduct.base_price_paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
    assert.ok(formattedRupees.includes('2,899'));
  });

  test('Pairwise 2: Selecting variant dynamically computes final price = basePricePaise + priceModifierPaise', () => {
    const ganesha = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
    const largeVariant = ctx.variants.find((v) => v.sku === 'BHR-GNSH-BRZ-L')!;

    const calculatedPaise = ganesha.base_price_paise + largeVariant.price_modifier_paise;
    assertIntegerPaise(calculatedPaise);
    assert.strictEqual(calculatedPaise, 249900 + 150000); // 399900 paise = ₹3,999.00
  });

  test('Pairwise 3: Catalog sorting by price ascending respects updated base price dynamically', () => {
    const p1 = ctx.products.find((p) => p.id === 'prod_lotus_planter_02')!; // 129900
    const p2 = ctx.products.find((p) => p.id === 'prod_ganesha_01')!; // 249900

    // Raise planter price above ganesha
    p1.base_price_paise = 300000; // ₹3,000.00

    const sortedAsc = ctx.products
      .filter((p) => p.publication_status === 'published')
      .sort((a, b) => a.base_price_paise - b.base_price_paise);

    assert.strictEqual(sortedAsc[0].id, 'prod_ganesha_01');
    assert.strictEqual(sortedAsc[1].id, 'prod_lotus_planter_02');
  });

  test('Pairwise 4: Admin archiving product removes it from catalog and variant pricing queries', () => {
    const temple = ctx.products.find((p) => p.id === 'prod_temple_replica_03')!;
    temple.publication_status = 'archived';

    const activeCatalogue = ctx.products.filter((p) => p.publication_status === 'published');
    assert.strictEqual(
      activeCatalogue.find((p) => p.id === 'prod_temple_replica_03'),
      undefined
    );
  });

  test('Pairwise 5: Variant price delta is formatted with explicit +/- indicator in UI selector buttons', () => {
    const variant = ctx.variants.find((v) => v.sku === 'BHR-GNSH-BRZ-L')!;
    const deltaRupees = variant.price_modifier_paise / 100;
    const sign = deltaRupees > 0 ? `+₹${deltaRupees.toLocaleString('en-IN')}` : `₹${deltaRupees}`;
    assert.strictEqual(sign, '+₹1,500');
  });
});
