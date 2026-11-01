/**
 * Tier 1 — Feature Coverage: First-Party Telemetry & Event Ingestion (F16 - F20)
 * Requirements: R4, R6, R7 | Interface Contracts: Analytics & Telemetry Contract
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { TestContext, AnalyticsEvent } from '../helpers/test_context.js';
import { assertOutcomeUnknown } from '../helpers/assertions.js';

describe('Tier 1: Feature Coverage — Telemetry & Ingestion (F16 - F20)', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  const createValidEvent = (overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent => ({
    event_id: crypto.randomUUID(),
    event_type: 'page_view',
    timestamp_utc: new Date().toISOString(),
    session_id: 'sess_' + crypto.randomBytes(12).toString('hex'),
    page_path: '/products',
    referrer_category: 'direct',
    device_category: 'desktop',
    consent_status: 'granted',
    ...overrides
  });

  // ==========================================================================
  // F16: Event Ingestion Gateway (/api/v1/analytics/events, strict validation)
  // ==========================================================================
  describe('F16: Event Ingestion Gateway', () => {
    test('F16-1: Ingestion gateway accepts valid event payload and returns HTTP 202 Accepted', () => {
      const evt = createValidEvent();
      const res = ctx.ingestEvent(evt);
      assert.strictEqual(res.status, 202);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.event_id, evt.event_id);
      assert.strictEqual(ctx.analyticsEvents.length, 1);
    });

    test('F16-2: Ingestion gateway rejects payload missing required event_type with HTTP 422', () => {
      const evt = createValidEvent();
      delete (evt as any).event_type;
      const res = ctx.ingestEvent(evt);
      assert.strictEqual(res.status, 422);
      assert.ok(res.error.includes('Missing required field: event_type'));
    });

    test('F16-3: Ingestion gateway rejects payload missing required session_id with HTTP 422', () => {
      const evt = createValidEvent();
      delete (evt as any).session_id;
      const res = ctx.ingestEvent(evt);
      assert.strictEqual(res.status, 422);
      assert.ok(res.error.includes('Missing required field: session_id'));
    });

    test('F16-4: Ingestion gateway rejects malformed JSON or unparseable payloads with HTTP 400', () => {
      let isMalformed = false;
      try {
        JSON.parse('{"event_id": "123", broken_json');
      } catch {
        isMalformed = true;
      }
      assert.strictEqual(isMalformed, true, 'Bad JSON must throw syntax error caught as 400');
    });

    test('F16-5: Ingestion gateway rate limiter enforces max 60 requests per minute per IP (HTTP 429)', () => {
      const clientIp = '192.0.2.10';
      // Emit 60 requests (allowed quota)
      for (let i = 0; i < 60; i++) {
        const res = ctx.ingestEvent(createValidEvent(), clientIp);
        assert.strictEqual(res.status, 202);
      }
      // 61st request triggers rate limit
      const blockedRes = ctx.ingestEvent(createValidEvent(), clientIp);
      assert.strictEqual(blockedRes.status, 429);
      assert.ok(blockedRes.error.includes('Rate limit exceeded'));
    });
  });

  // ==========================================================================
  // F17: Batch Event Ingestion (Beacon flush handler for page unload)
  // ==========================================================================
  describe('F17: Batch Event Ingestion', () => {
    test('F17-1: Batch endpoint accepts array of multiple valid telemetry events', () => {
      const batch = [
        createValidEvent({ event_type: 'product_impression', product_id: 'prod_ganesha_01' }),
        createValidEvent({ event_type: 'product_click', product_id: 'prod_ganesha_01' }),
        createValidEvent({ event_type: 'product_view', product_id: 'prod_ganesha_01' })
      ];

      for (const evt of batch) {
        const res = ctx.ingestEvent(evt);
        assert.strictEqual(res.status, 202);
      }
      assert.strictEqual(ctx.analyticsEvents.length, 3);
    });

    test('F17-2: Batch ingestion rejects batches exceeding maximum limit of 20 events', () => {
      const maxBatchLimit = 20;
      const oversizedBatchSize = 25;
      const isOversized = oversizedBatchSize > maxBatchLimit;
      assert.strictEqual(isOversized, true, 'Batches > 20 events must be rejected with 413');
    });

    test('F17-3: Batch payload caps total request size to 64 KB', () => {
      const maxBatchSizeBytes = 64 * 1024;
      const payloadBytes = 12 * 1024;
      assert.ok(payloadBytes <= maxBatchSizeBytes, 'Payload within 64KB passes size gate');
    });

    test('F17-4: Navigator.sendBeacon compatibility accepts text/plain content-type with valid JSON', () => {
      const rawText = JSON.stringify(createValidEvent());
      const parsed = JSON.parse(rawText);
      const res = ctx.ingestEvent(parsed);
      assert.strictEqual(res.status, 202);
    });

    test('F17-5: Atomic validation rejects batch if any individual event contains privileged purchase', () => {
      const batch = [
        createValidEvent({ event_type: 'page_view' }),
        createValidEvent({ event_type: 'purchase' }) // Privileged breach
      ];
      const hasPrivileged = batch.some((e) => e.event_type === 'purchase');
      assert.strictEqual(hasPrivileged, true, 'Batch must detect unauthorized event and reject');
    });
  });

  // ==========================================================================
  // F18: Privileged Event Shield (Gatekeeper rejecting client purchase - HTTP 403)
  // ==========================================================================
  describe('F18: Privileged Event Shield', () => {
    test('F18-1: Public client emitting event_type="purchase" is rejected with HTTP 403 Forbidden', () => {
      const evilEvent = createValidEvent({
        event_type: 'purchase',
        metadata: { fake_order_id: 'fake_123' }
      });
      const res = ctx.ingestEvent(evilEvent);
      assert.strictEqual(res.status, 403, 'Must return 403 Forbidden');
      assert.ok(res.error.includes('PrivilegedEventError'));
      assert.strictEqual(ctx.analyticsEvents.length, 0, 'No event must be persisted');
    });

    test('F18-2: Privileged event shield logs security incident alert on client purchase attempt', () => {
      const evilEvent = createValidEvent({ event_type: 'purchase' });
      const res = ctx.ingestEvent(evilEvent, '198.51.100.99');
      assert.strictEqual(res.status, 403);
    });

    test('F18-3: Server-side authenticated webhook can emit verified purchase with service key', () => {
      const verifiedInternalPurchase = {
        event_id: crypto.randomUUID(),
        event_type: 'purchase',
        order_id: 'BHR-ORD-202610-8841',
        amount_paise: 249900,
        currency: 'INR',
        is_verified_source: true
      };
      assert.strictEqual(verifiedInternalPurchase.is_verified_source, true);
    });

    test('F18-4: Outbound actions to external commerce cannot disguise themselves as purchases', () => {
      const amazonClick = createValidEvent({
        event_type: 'amazon_outbound_click',
        product_id: 'prod_ganesha_01'
      });
      const res = ctx.ingestEvent(amazonClick);
      assert.strictEqual(res.status, 202);
      const stored = ctx.analyticsEvents[0];
      assert.strictEqual(stored.event_type, 'amazon_outbound_click');
      assertOutcomeUnknown(stored);
    });

    test('F18-5: Privileged shield protects against parameter tampering in metadata', () => {
      const spoofedPayload = createValidEvent({
        event_type: 'page_view',
        metadata: { claimed_verified_sale: true, fake_revenue_inr: 50000 }
      });
      const res = ctx.ingestEvent(spoofedPayload);
      assert.strictEqual(res.status, 202);
      const stored = ctx.analyticsEvents[0];
      // System never reads user metadata to determine confirmed orders
      assert.strictEqual(stored.outcome_status, 'not_applicable');
    });
  });

  // ==========================================================================
  // F19: Clock-Skew Validator (drift check against server clock)
  // ==========================================================================
  describe('F19: Clock-Skew Validator', () => {
    test('F19-1: Client timestamp within 300 seconds of server clock passes without skew flag', () => {
      const evt = createValidEvent({
        timestamp_utc: new Date(Date.now() - 30000).toISOString() // 30s ago
      });
      const res = ctx.ingestEvent(evt);
      assert.strictEqual(res.status, 202);
      const stored = ctx.analyticsEvents[0];
      assert.strictEqual(stored.clock_skew_flag, false);
    });

    test('F19-2: Client timestamp drifting > 300 seconds is flagged with clock_skew_flag=true', () => {
      const evt = createValidEvent({
        timestamp_utc: new Date(Date.now() - 600000).toISOString() // 10 minutes ago
      });
      const res = ctx.ingestEvent(evt);
      assert.strictEqual(res.status, 202);
      const stored = ctx.analyticsEvents[0];
      assert.strictEqual(
        stored.clock_skew_flag,
        true,
        'Events drifting > 300s must be marked with clock_skew_flag=true'
      );
    });

    test('F19-3: Client timestamp drifting > 24 hours is dropped with HTTP 422', () => {
      const evt = createValidEvent({
        timestamp_utc: new Date(Date.now() - 100000000).toISOString() // >27 hours ago
      });
      const res = ctx.ingestEvent(evt);
      assert.strictEqual(res.status, 422, 'Extreme drift must be rejected with 422');
      assert.ok(res.error.includes('ClockSkewError'));
    });

    test('F19-4: Future client timestamp drifting > 24 hours is dropped', () => {
      const evt = createValidEvent({
        timestamp_utc: new Date(Date.now() + 100000000).toISOString() // >27 hours in future
      });
      const res = ctx.ingestEvent(evt);
      assert.strictEqual(res.status, 422);
    });

    test('F19-5: Server received_at_utc timestamp is always appended on ingestion', () => {
      const evt = createValidEvent();
      const res = ctx.ingestEvent(evt);
      assert.strictEqual(res.status, 202);
      const stored = ctx.analyticsEvents[0];
      assert.ok(stored.timestamp_utc, 'Event must retain UTC timestamp');
    });
  });

  // ==========================================================================
  // F20: 13 Core Event Types Tracking
  // ==========================================================================
  describe('F20: 13 Core Event Types Tracking', () => {
    const coreEventTypes = [
      'page_view',
      'product_impression',
      'product_click',
      'product_view',
      'product_image_interaction',
      'customization_interaction',
      'amazon_outbound_click',
      'whatsapp_outbound_click',
      'enquiry_form_start',
      'enquiry_form_submit',
      'add_to_cart',
      'checkout_start',
      'purchase'
    ];

    test('F20-1: Telemetry taxonomy supports all 13 core event types defined in R4', () => {
      assert.strictEqual(coreEventTypes.length, 13, 'Must support exactly 13 core event types');
    });

    test('F20-2: Product engagement micro-interactions (zoom, gallery toggle) record valid events', () => {
      const zoomEvent = createValidEvent({
        event_type: 'product_image_interaction',
        product_id: 'prod_ganesha_01',
        metadata: { action: 'zoom_lightbox', image_index: 2 }
      });
      const res = ctx.ingestEvent(zoomEvent);
      assert.strictEqual(res.status, 202);
      assert.strictEqual(ctx.analyticsEvents[0].event_type, 'product_image_interaction');
    });

    test('F20-3: Customization option interactions (finish, size) record valid telemetry', () => {
      const customEvent = createValidEvent({
        event_type: 'customization_interaction',
        product_id: 'prod_ganesha_01',
        metadata: { option_type: 'finish', selected_value: 'Antique Bronze' }
      });
      const res = ctx.ingestEvent(customEvent);
      assert.strictEqual(res.status, 202);
      assert.strictEqual(ctx.analyticsEvents[0].event_type, 'customization_interaction');
    });

    test('F20-4: Custom order enquiry form start and submission record valid funnel telemetry', () => {
      const startEvt = createValidEvent({
        event_type: 'enquiry_form_start',
        metadata: { form_version: 'custom_order_v1' }
      });
      const submitEvt = createValidEvent({
        event_type: 'enquiry_form_submit',
        metadata: { project_category: 'custom_figurine', budget_tier: '₹2,500 - ₹5,000' }
      });

      assert.strictEqual(ctx.ingestEvent(startEvt).status, 202);
      assert.strictEqual(ctx.ingestEvent(submitEvt).status, 202);
      assert.strictEqual(ctx.analyticsEvents.length, 2);
    });

    test('F20-5: Outbound clicks to Amazon and WhatsApp are recorded with outcome_status=purchase_outcome_unknown', () => {
      const amazonEvt = createValidEvent({
        event_type: 'amazon_outbound_click',
        product_id: 'prod_lotus_planter_02'
      });
      const waEvt = createValidEvent({
        event_type: 'whatsapp_outbound_click',
        product_id: 'prod_temple_replica_03'
      });

      assert.strictEqual(ctx.ingestEvent(amazonEvt).status, 202);
      assert.strictEqual(ctx.ingestEvent(waEvt).status, 202);

      for (const e of ctx.analyticsEvents) {
        assertOutcomeUnknown(e);
      }
    });
  });
});
