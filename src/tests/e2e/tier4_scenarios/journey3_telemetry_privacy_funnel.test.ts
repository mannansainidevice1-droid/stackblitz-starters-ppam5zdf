/**
 * Tier 4 — Real-World Application Scenario 3:
 * First-Party Telemetry, Privacy Pipeline & Funnel Analysis
 * Steps: Navigation -> Session Tracking -> PII Redaction -> Opt-Out -> Shield -> Funnel Calculation
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { TestContext } from '../helpers/test_context.js';
import { assertZeroPII } from '../helpers/assertions.js';

describe('Tier 4 Scenario 3: Telemetry, Privacy Pipeline & Conversion Funnel', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  test('Execute First-Party Telemetry Ingestion, Zero-PII Sanitization & Funnel Math', () => {
    // 1. Session token generation (anonymous cryptographic token)
    const sessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
    assert.ok(sessionId.length >= 16);

    // 2. Navigation with accidental PII in query string
    const piiUrl = '/products?search=priya.patil@outlook.com&ref=whatsapp_share';
    const visitEvent = {
      event_id: crypto.randomUUID(),
      event_type: 'page_view',
      timestamp_utc: '2026-10-31T08:00:00Z',
      session_id: sessionId,
      page_path: piiUrl,
      referrer_category: 'social_media',
      device_category: 'mobile',
      consent_status: 'granted' as const
    };

    assert.strictEqual(ctx.ingestEvent(visitEvent).status, 202);
    const recordedVisit = ctx.analyticsEvents[0];
    assert.ok(!recordedVisit.page_path.includes('priya.patil@outlook.com'));
    assert.ok(recordedVisit.page_path.includes('[REDACTED_EMAIL]'));
    assertZeroPII(recordedVisit);

    // 3. Product Impression & View
    ctx.ingestEvent({
      event_id: crypto.randomUUID(),
      event_type: 'product_impression',
      timestamp_utc: '2026-10-31T08:00:10Z',
      session_id: sessionId,
      product_id: 'prod_lotus_planter_02',
      page_path: '/products',
      device_category: 'mobile',
      consent_status: 'granted'
    });

    ctx.ingestEvent({
      event_id: crypto.randomUUID(),
      event_type: 'product_view',
      timestamp_utc: '2026-10-31T08:00:25Z',
      session_id: sessionId,
      product_id: 'prod_lotus_planter_02',
      page_path: '/products/geometric-lotus-planter-terracotta',
      device_category: 'mobile',
      consent_status: 'granted'
    });

    // 4. Visitor opts out on cookie banner ("Reject Non-Essential")
    const optOutEvent = {
      event_id: crypto.randomUUID(),
      event_type: 'page_view',
      timestamp_utc: '2026-10-31T08:01:00Z',
      session_id: sessionId,
      page_path: '/faq',
      device_category: 'mobile',
      consent_status: 'denied' as const
    };
    const optOutRes = ctx.ingestEvent(optOutEvent);
    assert.strictEqual(optOutRes.status, 204, 'Opted out telemetry must return HTTP 204');
    assert.strictEqual(
      ctx.analyticsEvents.some((e) => e.page_path === '/faq'),
      false,
      'Dropped event must not be written to database'
    );

    // 5. Malicious script attempts to emit fake "purchase" event from browser console
    const fakePurchase = {
      event_id: crypto.randomUUID(),
      event_type: 'purchase',
      timestamp_utc: '2026-10-31T08:01:30Z',
      session_id: sessionId,
      page_path: '/checkout/success',
      device_category: 'mobile',
      consent_status: 'granted' as const
    };
    const shieldRes = ctx.ingestEvent(fakePurchase);
    assert.strictEqual(shieldRes.status, 403, 'Privileged event shield must reject client purchase');

    // 6. Funnel calculation over valid recorded session
    const impressions = ctx.analyticsEvents.filter(
      (e) => e.event_type === 'product_impression'
    ).length;
    const views = ctx.analyticsEvents.filter((e) => e.event_type === 'product_view').length;

    assert.strictEqual(impressions, 1);
    assert.strictEqual(views, 1);
    const viewConversionRate = (views / impressions) * 100;
    assert.strictEqual(viewConversionRate, 100.0);
  });
});
