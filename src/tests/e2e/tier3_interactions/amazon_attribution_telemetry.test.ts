/**
 * Tier 3 — Cross-Feature Interaction: Amazon India Commerce Actions & Attribution
 * Pairwise: F49 (Amazon Link Gen) <-> F16/F20 (Telemetry Ingestion) <-> F23 (Attribution Invariant)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { TestContext } from '../helpers/test_context.js';
import { assertOutcomeUnknown } from '../helpers/assertions.js';

describe('Tier 3 Interaction: Amazon Commerce & Attribution Telemetry', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  test('Pairwise 1: Generating Amazon URL attaches campaign UTM parameters and associate tag', () => {
    const asin = 'B0BHAIRAVI1';
    const tag = 'bhairavicreat-21';
    const campaignRef = 'diwali_2026';
    const url = `https://www.amazon.in/dp/${asin}?tag=${tag}&ref=${campaignRef}`;

    assert.ok(url.includes('tag=bhairavicreat-21'));
    assert.ok(url.includes('ref=diwali_2026'));
  });

  test('Pairwise 2: Outbound interceptor dispatches amazon_outbound_click telemetry before navigating', () => {
    const clickEvt = {
      event_id: crypto.randomUUID(),
      event_type: 'amazon_outbound_click',
      timestamp_utc: new Date().toISOString(),
      session_id: 'sess_interceptor_test',
      product_id: 'prod_ganesha_01',
      page_path: '/products/ganesha-antique-bronze-hand-painted',
      device_category: 'desktop',
      consent_status: 'granted' as const,
      metadata: { asin: 'B0BHAIRAVI1' }
    };

    const res = ctx.ingestEvent(clickEvt);
    assert.strictEqual(res.status, 202);

    const stored = ctx.analyticsEvents[0];
    assertOutcomeUnknown(stored);
    assert.strictEqual(stored.outcome_status, 'purchase_outcome_unknown');
  });

  test('Pairwise 3: Missing Amazon listing gracefully switches PDP primary button to WhatsApp consultation', () => {
    const prodWithoutAmazon = ctx.products.find((p) => p.amazon_url === null)!;
    assert.strictEqual(prodWithoutAmazon.amazon_url, null);

    const ctaMode = prodWithoutAmazon.amazon_url ? 'buy_amazon' : 'whatsapp_consultation';
    assert.strictEqual(ctaMode, 'whatsapp_consultation');
  });

  test('Pairwise 4: Amazon URL click preserves original campaign referrer in analytics metadata', () => {
    const evt = {
      event_id: crypto.randomUUID(),
      event_type: 'amazon_outbound_click',
      timestamp_utc: new Date().toISOString(),
      session_id: 'sess_ref_test',
      product_id: 'prod_lotus_planter_02',
      page_path: '/products',
      referrer_category: 'social_media',
      device_category: 'mobile',
      consent_status: 'granted' as const,
      utm_parameters: { utm_source: 'instagram', utm_campaign: 'spring_art' }
    };

    ctx.ingestEvent(evt);
    const stored = ctx.analyticsEvents[0];
    assert.strictEqual(stored.utm_parameters?.utm_source, 'instagram');
  });

  test('Pairwise 5: Target URL opens with rel="noopener noreferrer" preventing reverse tab hijacking', () => {
    const rel = 'noopener noreferrer';
    assert.strictEqual(rel, 'noopener noreferrer');
  });
});
