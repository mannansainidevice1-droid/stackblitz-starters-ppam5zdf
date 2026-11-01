/**
 * Tier 4 — Real-World Application Scenario 2:
 * Artisanal Catalog Discovery to Amazon India Purchase
 * Steps: Home Showcase -> PDP -> Gallery Compare -> Variant Selection -> Amazon Outbound Action
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { TestContext } from '../helpers/test_context.js';
import { assertIntegerPaise, assertOutcomeUnknown } from '../helpers/assertions.js';

describe('Tier 4 Scenario 2: Artisanal Catalog Discovery to Amazon India Purchase', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  test('Execute Full Shopper Journey from Catalog Showcase to Amazon India Attribution', () => {
    const sessionId = 'sess_amazon_journey_02';

    // Step 1: Shopper views Home Page featured showcase and clicks Lord Ganesha card
    const impressionEvent = {
      event_id: crypto.randomUUID(),
      event_type: 'product_impression',
      timestamp_utc: '2026-10-31T07:00:00Z',
      session_id: sessionId,
      product_id: 'prod_ganesha_01',
      page_path: '/',
      device_category: 'mobile',
      consent_status: 'granted' as const
    };
    assert.strictEqual(ctx.ingestEvent(impressionEvent).status, 202);

    const clickEvent = {
      event_id: crypto.randomUUID(),
      event_type: 'product_click',
      timestamp_utc: '2026-10-31T07:00:15Z',
      session_id: sessionId,
      product_id: 'prod_ganesha_01',
      page_path: '/',
      device_category: 'mobile',
      consent_status: 'granted' as const
    };
    assert.strictEqual(ctx.ingestEvent(clickEvent).status, 202);

    // Step 2: PDP renders by slug
    const ganesha = ctx.products.find((p) => p.slug === 'ganesha-antique-bronze-hand-painted')!;
    assert.ok(ganesha);
    assertIntegerPaise(ganesha.base_price_paise); // 249900 = ₹2,499.00

    const pdpViewEvent = {
      event_id: crypto.randomUUID(),
      event_type: 'product_view',
      timestamp_utc: '2026-10-31T07:00:20Z',
      session_id: sessionId,
      product_id: ganesha.id,
      page_path: `/products/${ganesha.slug}`,
      device_category: 'mobile',
      consent_status: 'granted' as const
    };
    assert.strictEqual(ctx.ingestEvent(pdpViewEvent).status, 202);

    // Step 3: Shopper toggles Gallery Raw Print vs Hand-Finished comparison
    const galleryToggleEvent = {
      event_id: crypto.randomUUID(),
      event_type: 'product_image_interaction',
      timestamp_utc: '2026-10-31T07:00:35Z',
      session_id: sessionId,
      product_id: ganesha.id,
      page_path: `/products/${ganesha.slug}`,
      device_category: 'mobile',
      consent_status: 'granted' as const,
      metadata: { action: 'toggle_raw_vs_finished', active_view: 'raw_print' }
    };
    assert.strictEqual(ctx.ingestEvent(galleryToggleEvent).status, 202);

    // Step 4: Shopper selects 9-inch Large Altar variant (price delta = +₹1,500.00)
    const largeVariant = ctx.variants.find((v) => v.sku === 'BHR-GNSH-BRZ-L')!;
    const calculatedTotalPaise = ganesha.base_price_paise + largeVariant.price_modifier_paise;
    assertIntegerPaise(calculatedTotalPaise);
    assert.strictEqual(calculatedTotalPaise, 399900); // ₹3,999.00

    const variantInteractionEvent = {
      event_id: crypto.randomUUID(),
      event_type: 'customization_interaction',
      timestamp_utc: '2026-10-31T07:00:50Z',
      session_id: sessionId,
      product_id: ganesha.id,
      page_path: `/products/${ganesha.slug}`,
      device_category: 'mobile',
      consent_status: 'granted' as const,
      metadata: { variant_sku: largeVariant.sku, new_price_paise: calculatedTotalPaise }
    };
    assert.strictEqual(ctx.ingestEvent(variantInteractionEvent).status, 202);

    // Step 5: Shopper clicks "Buy on Amazon India"
    const expectedAmazonUrl = `https://www.amazon.in/dp/${ganesha.amazon_asin}?tag=bhairavicreat-21&ref=bhairavi_web`;
    assert.ok(expectedAmazonUrl.includes('B0BHAIRAVI1'));

    const amazonOutboundEvent = {
      event_id: crypto.randomUUID(),
      event_type: 'amazon_outbound_click',
      timestamp_utc: '2026-10-31T07:01:10Z',
      session_id: sessionId,
      product_id: ganesha.id,
      page_path: `/products/${ganesha.slug}`,
      device_category: 'mobile',
      consent_status: 'granted' as const,
      metadata: { asin: ganesha.amazon_asin, destination_url: expectedAmazonUrl }
    };
    assert.strictEqual(ctx.ingestEvent(amazonOutboundEvent).status, 202);

    // Step 6: Attribution verification asserts outcome_status="purchase_outcome_unknown"
    const recordedAmazon = ctx.analyticsEvents.find(
      (e) => e.event_type === 'amazon_outbound_click'
    )!;
    assertOutcomeUnknown(recordedAmazon);
    assert.strictEqual(recordedAmazon.outcome_status, 'purchase_outcome_unknown');
  });
});
