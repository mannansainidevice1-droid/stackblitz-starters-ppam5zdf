/**
 * BHAIRAVI Creations Digital Platform
 * Integration Test Suite: Milestone 3 — First-Party Analytics, BI Export & AI Analyst
 * Target: src/tests/integration/analytics_bi_ai.test.ts
 *
 * Covers Features F16–F33:
 * - F16: Single Event Ingestion Gateway (POST /api/v1/analytics/events)
 * - F17: Batch Event Ingestion (POST /api/v1/analytics/events/batch)
 * - F18: Privileged Purchase Shield (HTTP 403 Forbidden on public client purchase)
 * - F19: Clock-Skew Validator (+-24h reject, >300s flag)
 * - F20: 13 Core Telemetry Events Taxonomy
 * - F21: Zero-PII Sanitization Gate
 * - F22: DPDP Consent & Opt-Out Handling (HTTP 204 No Content)
 * - F23: Mandatory Attribution Integrity (purchase_outcome_unknown)
 * - F24: Conversion Funnel Engine & Formulas
 * - F26: BI Raw Events Export (RFC 4180 CSV, JSON, NDJSON)
 * - F27: BI Aggregated Product Metrics Export
 * - F28: BI Permitted Enquiry Export (Zero PII)
 * - F29: BI Product Catalogue Metadata Export (Integer Paise)
 * - F30: Export Quality Envelope & Checksums
 * - F31: 100% Mathematical Reconciliation Invariant (Delta = 0)
 * - F32: Read-Only AI Analyst REST API & 3-Tier Epistemic Separation
 * - F33: AI Analyst Query Guard (Scoped Bearer Token, HTTP 405 Mutations, SQL Injection 422, Rate Limit 429)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { createDbConnection } from '../../server/db/connection.js';
import { runMigrations } from '../../server/db/migrator.js';
import { createApp } from '../../server/app.js';
import { telemetryRateLimiter, aiAnalystRateLimiter } from '../../server/middleware/rate_limiter.js';
import {
  assertRFC4180CSV,
  assertZeroPII,
  assertOutcomeUnknown,
  assertReconciliationZeroDrift,
  assertEpistemicSeparation,
  assertIntegerPaise
} from '../helpers/assertions.js';
import { MANDATORY_ATTRIBUTION_DISCLAIMER } from '../../server/services/analytics.service.js';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data/test_analytics_bi_ai.db');
const AI_TOKEN = 'test_ai_analyst_scoped_bearer_token_2026';

describe('Milestone 3: Analytics Ingestion, BI Exports, Reconciliation & AI Analyst', () => {
  let db: Database.Database;
  let server: http.Server;
  let baseUrl: string;

  // Test accounts
  const superadminUser = {
    id: 'usr_test_superadmin_01',
    username: 'test_superadmin',
    email: 'superadmin@bhairavicreations.test',
    password: 'SuperAdminPass2026!',
    passwordHash: crypto.createHash('sha256').update('SuperAdminPass2026!').digest('hex'),
    role: 'superadmin'
  };

  const adminUser = {
    id: 'usr_test_admin_02',
    username: 'test_admin',
    email: 'admin@bhairavicreations.test',
    password: 'AdminLeadPass2026!',
    passwordHash: crypto.createHash('sha256').update('AdminLeadPass2026!').digest('hex'),
    role: 'admin'
  };

  const viewerUser = {
    id: 'usr_test_viewer_03',
    username: 'test_viewer',
    email: 'viewer@bhairavicreations.test',
    password: 'ViewerReadPass2026!',
    passwordHash: crypto.createHash('sha256').update('ViewerReadPass2026!').digest('hex'),
    role: 'viewer'
  };

  beforeAll(async () => {
    process.env.AI_ANALYST_TOKEN = AI_TOKEN;

    db = createDbConnection(TEST_DB_PATH);
    runMigrations(db);

    // Insert admin users for testing
    const insertAdmin = db.prepare(`
      INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    insertAdmin.run(superadminUser.id, superadminUser.username, superadminUser.email, superadminUser.passwordHash, superadminUser.role);
    insertAdmin.run(adminUser.id, adminUser.username, adminUser.email, adminUser.passwordHash, adminUser.role);
    insertAdmin.run(viewerUser.id, viewerUser.username, viewerUser.email, viewerUser.passwordHash, viewerUser.role);

    // Start ephemeral server
    const appHandler = createApp(db);
    server = http.createServer(appHandler);

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });

  beforeEach(() => {
    telemetryRateLimiter.reset();
    aiAnalystRateLimiter.reset();
  });

  // Helper to log in and get cookie header
  async function loginAs(user: { username: string; password: string }): Promise<string> {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, password: user.password })
    });
    const setCookie = res.headers.get('set-cookie');
    return setCookie || '';
  }

  const createEvent = (overrides: Record<string, any> = {}) => ({
    event_id: crypto.randomUUID(),
    event_type: 'page_view',
    timestamp_utc: new Date().toISOString(),
    session_id: 'sess_' + crypto.randomBytes(12).toString('hex'),
    product_id: 'prod_00000000-0000-4000-8000-000000000001',
    page_path: '/products/ganesha-antique-bronze-hand-painted',
    referrer_category: 'direct',
    device_category: 'desktop',
    consent_status: 'granted',
    metadata: { test: true },
    ...overrides
  });

  // ==========================================================================
  // 1. Analytics Telemetry Ingestion (F16-F23)
  // ==========================================================================
  describe('1. Analytics Telemetry Ingestion Gateway', () => {
    it('1.1 should accept valid telemetry event and return HTTP 202 Accepted', async () => {
      const evt = createEvent();
      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt)
      });

      expect(res.status).toBe(202);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.event_id).toBe(evt.event_id);

      const row = db.prepare('SELECT * FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;
      expect(row).toBeDefined();
      expect(row.event_type).toBe('page_view');
      expect(row.outcome_status).toBe('not_applicable');
    });

    it('1.2 should accept batch of events (up to 20) and return HTTP 202 Accepted', async () => {
      const batch = [
        createEvent({ event_type: 'product_impression' }),
        createEvent({ event_type: 'product_click' }),
        createEvent({ event_type: 'product_view' })
      ];

      const res = await fetch(`${baseUrl}/api/v1/analytics/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch)
      });

      expect(res.status).toBe(202);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.ingested_count).toBe(3);
    });

    it('1.3 should reject batches exceeding maximum of 20 events with HTTP 413', async () => {
      const oversizedBatch = Array.from({ length: 21 }, () => createEvent());
      const res = await fetch(`${baseUrl}/api/v1/analytics/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oversizedBatch)
      });

      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toContain('limit of 20 events');
    });

    it('1.4 should reject empty batch [] with HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/analytics/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      });

      expect(res.status).toBe(400);
    });

    it('1.5 should accept text/plain with JSON body (Navigator.sendBeacon compatibility)', async () => {
      const evt = createEvent({ event_type: 'product_view' });
      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(evt)
      });

      expect(res.status).toBe(202);
      const row = db.prepare('SELECT * FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;
      expect(row).toBeDefined();
    });

    it('1.6 should reject malformed JSON with HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"event_id": "broken_json'
      });

      expect(res.status).toBe(400);
    });

    it('1.7 Privileged Purchase Shield: Client emitting purchase event returns HTTP 403 Forbidden with 0 DB writes', async () => {
      const countBefore = (db.prepare('SELECT COUNT(*) as count FROM analytics_events').get() as any).count;
      const fakePurchase = createEvent({ event_type: 'purchase', metadata: { order_id: 'fake_order' } });

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fakePurchase)
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('PrivilegedEventError');

      const countAfter = (db.prepare('SELECT COUNT(*) as count FROM analytics_events').get() as any).count;
      expect(countAfter).toBe(countBefore);
    });

    it('1.8 Privileged Purchase Shield: Uppercase PURCHASE event is rejected with HTTP 403', async () => {
      const fakePurchase = createEvent({ event_type: 'PURCHASE' });
      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fakePurchase)
      });

      expect(res.status).toBe(403);
    });

    it('1.9 Clock-Skew Validator: rejects drift > 24 hours with HTTP 422', async () => {
      const oldEvent = createEvent({
        timestamp_utc: '1970-01-01T00:00:00.000Z'
      });

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oldEvent)
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toContain('ClockSkewError');
    });

    it('1.10 Clock-Skew Validator: flags timestamp drifting > 300 seconds with clock_skew_flag = 1', async () => {
      const driftedEvent = createEvent({
        timestamp_utc: new Date(Date.now() - 600000).toISOString() // 10 minutes ago
      });

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driftedEvent)
      });

      expect(res.status).toBe(202);
      const row = db.prepare('SELECT clock_skew_flag FROM analytics_events WHERE event_id = ?').get(driftedEvent.event_id) as any;
      expect(row.clock_skew_flag).toBe(1);
    });

    it('1.11 DPDP Consent: consent_status="denied" returns HTTP 204 No Content and writes 0 DB rows', async () => {
      const deniedEvent = createEvent({ consent_status: 'denied' });
      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deniedEvent)
      });

      expect(res.status).toBe(204);
      const row = db.prepare('SELECT * FROM analytics_events WHERE event_id = ?').get(deniedEvent.event_id);
      expect(row).toBeUndefined();
    });

    it('1.12 DPDP Consent: DNT: 1 header returns HTTP 204 No Content with 0 DB writes', async () => {
      const dntEvent = createEvent();
      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', DNT: '1' },
        body: JSON.stringify(dntEvent)
      });

      expect(res.status).toBe(204);
      const row = db.prepare('SELECT * FROM analytics_events WHERE event_id = ?').get(dntEvent.event_id);
      expect(row).toBeUndefined();
    });

    it('1.13 Zero-PII Sanitization: scrubs emails and phone numbers from page_path and metadata', async () => {
      const piiEvent = createEvent({
        page_path: '/products?user=artisan@bhairavicreations.test&ref=whatsapp',
        metadata: {
          customer_contact: '+91 98765 43210',
          query: 'Contact me at test.user@gmail.com please'
        }
      });

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(piiEvent)
      });

      expect(res.status).toBe(202);
      const row = db.prepare('SELECT page_path, metadata FROM analytics_events WHERE event_id = ?').get(piiEvent.event_id) as any;
      expect(row.page_path).not.toContain('artisan@bhairavicreations.test');
      expect(row.page_path).toContain('[REDACTED_EMAIL]');
      expect(row.metadata).not.toContain('98765 43210');
      expect(row.metadata).toContain('[REDACTED_PHONE]');
      expect(row.metadata).toContain('[REDACTED_EMAIL]');
    });

    it('1.14 Attribution Integrity Mandate: Outbound Amazon and WhatsApp clicks strictly record purchase_outcome_unknown', async () => {
      const amazonClick = createEvent({
        event_type: 'amazon_outbound_click',
        outcome_status: 'confirmed_purchase' // Attempt to spoof
      });
      const whatsappClick = createEvent({
        event_type: 'whatsapp_outbound_click',
        outcome_status: 'verified_sale' // Attempt to spoof
      });

      await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(amazonClick)
      });
      await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatsappClick)
      });

      const rowA = db.prepare('SELECT outcome_status FROM analytics_events WHERE event_id = ?').get(amazonClick.event_id) as any;
      const rowW = db.prepare('SELECT outcome_status FROM analytics_events WHERE event_id = ?').get(whatsappClick.event_id) as any;

      expect(rowA.outcome_status).toBe('purchase_outcome_unknown');
      expect(rowW.outcome_status).toBe('purchase_outcome_unknown');
      assertOutcomeUnknown(rowA);
      assertOutcomeUnknown(rowW);
    });

    it('1.15 Telemetry rate limiter enforces max 60 req/min (HTTP 429)', async () => {
      for (let i = 0; i < 60; i++) {
        telemetryRateLimiter.check('127.0.0.1');
      }

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createEvent())
      });

      expect(res.status).toBe(429);
      expect(res.headers.get('retry-after')).toBeDefined();
    });
  });

  // ==========================================================================
  // 2. Daily Rollup Aggregation & Delta = 0 Invariant (F27, F31)
  // ==========================================================================
  describe('2. Daily Rollup Aggregation & Reconciliation Invariant', () => {
    const today = new Date().toISOString().slice(0, 10);
    const prodId = 'prod_00000000-0000-4000-8000-000000000001';

    beforeEach(() => {
      // Clear events and rollups for isolation in this suite
      db.prepare("DELETE FROM analytics_events WHERE timestamp_utc LIKE ?").run(`${today}%`);
      db.prepare('DELETE FROM analytics_daily_product_rollups WHERE rollup_date = ?').run(today);
    });

    it('2.1 should aggregate daily telemetry into rollups with Delta = 0 and valid SHA-256 hash', async () => {
      const adminCookie = await loginAs(adminUser);

      // Ingest synthetic ground truth events
      const events = [
        createEvent({ event_type: 'product_impression', product_id: prodId, timestamp_utc: `${today}T10:00:00.000Z` }),
        createEvent({ event_type: 'product_impression', product_id: prodId, timestamp_utc: `${today}T10:01:00.000Z` }),
        createEvent({ event_type: 'product_click', product_id: prodId, timestamp_utc: `${today}T10:02:00.000Z` }),
        createEvent({ event_type: 'product_view', product_id: prodId, timestamp_utc: `${today}T10:03:00.000Z`, session_id: 'sess_1' }),
        createEvent({ event_type: 'product_view', product_id: prodId, timestamp_utc: `${today}T10:04:00.000Z`, session_id: 'sess_1' }), // Same session
        createEvent({ event_type: 'product_view', product_id: prodId, timestamp_utc: `${today}T10:05:00.000Z`, session_id: 'sess_2' }), // Second session
        createEvent({ event_type: 'amazon_outbound_click', product_id: prodId, timestamp_utc: `${today}T10:06:00.000Z` }),
        createEvent({ event_type: 'whatsapp_outbound_click', product_id: prodId, timestamp_utc: `${today}T10:07:00.000Z` })
      ];

      for (const e of events) {
        await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(e)
        });
      }

      // Trigger daily rollup
      const rollupRes = await fetch(`${baseUrl}/api/admin/reconciliation/rollup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ date: today })
      });

      expect(rollupRes.status).toBe(200);
      const rollupJson = await rollupRes.json();
      expect(rollupJson.success).toBe(true);

      const row = db.prepare('SELECT * FROM analytics_daily_product_rollups WHERE rollup_date = ? AND product_id = ?').get(today, prodId) as any;
      expect(row).toBeDefined();
      expect(row.impressions).toBe(2);
      expect(row.card_clicks).toBe(1);
      expect(row.detail_views).toBe(3);
      expect(row.unique_view_sessions).toBe(2); // sess_1 and sess_2
      expect(row.amazon_outbound_clicks).toBe(1);
      expect(row.whatsapp_outbound_clicks).toBe(1);
      expect(row.unverified_outcomes).toBe(2);
      expect(row.reconciliation_hash).toHaveLength(64);

      // Verify Mathematical Invariant Delta = 0
      assertReconciliationZeroDrift(3, row.detail_views);
      assertReconciliationZeroDrift(1, row.amazon_outbound_clicks);
      assertReconciliationZeroDrift(1, row.whatsapp_outbound_clicks);
    });

    it('2.2 GET /api/admin/reconciliation/verify returns 200 and reconciled=true when Delta = 0', async () => {
      const adminCookie = await loginAs(adminUser);

      // Ingest 5 views and trigger rollup
      for (let i = 0; i < 5; i++) {
        await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createEvent({ event_type: 'product_view', product_id: prodId, timestamp_utc: `${today}T11:00:00.000Z` }))
        });
      }

      await fetch(`${baseUrl}/api/admin/reconciliation/rollup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ date: today })
      });

      const verifyRes = await fetch(`${baseUrl}/api/admin/reconciliation/verify?start_date=${today}&end_date=${today}&product_id=${prodId}`, {
        headers: { Cookie: adminCookie }
      });

      expect(verifyRes.status).toBe(200);
      const json = await verifyRes.json();
      expect(json.status).toBe('reconciled_zero_drift');
      expect(json.reconciled).toBe(true);
      expect(json.total_drift).toBe(0);
    });

    it('2.3 GET /api/admin/reconciliation/verify returns 409 Conflict when drift occurs (Delta > 0)', async () => {
      const adminCookie = await loginAs(adminUser);

      // Ingest 10 views and trigger rollup
      for (let i = 0; i < 10; i++) {
        await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createEvent({ event_type: 'product_view', product_id: prodId, timestamp_utc: `${today}T12:00:00.000Z` }))
        });
      }

      await fetch(`${baseUrl}/api/admin/reconciliation/rollup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ date: today })
      });

      // Inject deliberate drift: corrupt the rollup row
      db.prepare('UPDATE analytics_daily_product_rollups SET detail_views = 8 WHERE rollup_date = ? AND product_id = ?').run(today, prodId);

      const verifyRes = await fetch(`${baseUrl}/api/admin/reconciliation/verify?start_date=${today}&end_date=${today}&product_id=${prodId}`, {
        headers: { Cookie: adminCookie }
      });

      expect(verifyRes.status).toBe(409);
      const json = await verifyRes.json();
      expect(json.status).toBe('drift_detected');
      expect(json.reconciled).toBe(false);
      expect(json.total_drift).toBeGreaterThan(0);
      expect(json.error).toContain('ERR_RECONCILIATION_DRIFT');
    });
  });

  // ==========================================================================
  // 3. BI Data Export Engine (F26–F30)
  // ==========================================================================
  describe('3. BI Data Export Engine', () => {
    let superadminCookie: string;
    let viewerCookie: string;

    beforeAll(async () => {
      superadminCookie = await loginAs(superadminUser);
      viewerCookie = await loginAs(viewerUser);
    });

    it('3.1 RBAC: Unauthenticated requests to /api/admin/exports/:type return HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/admin/exports/raw_events`);
      expect(res.status).toBe(401);
    });

    it('3.2 RBAC: Viewer role returns HTTP 403 Forbidden on data exports', async () => {
      const res = await fetch(`${baseUrl}/api/admin/exports/raw_events`, {
        headers: { Cookie: viewerCookie }
      });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Viewer role does not have export:read privileges');
    });

    it('3.3 Raw Events Export: RFC 4180 CSV adheres to headers and CRLF formatting', async () => {
      const res = await fetch(`${baseUrl}/api/admin/exports/raw_events?format=csv`, {
        headers: { Cookie: superadminCookie }
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/csv');
      expect(res.headers.get('x-export-type')).toBe('raw_events');
      expect(res.headers.get('x-export-timezone')).toBe('UTC');
      expect(res.headers.get('x-export-checksum')).toHaveLength(64);

      const csv = await res.text();
      assertRFC4180CSV(csv, ['event_id', 'event_type', 'timestamp_utc', 'session_id', 'outcome_status']);
    });

    it('3.4 Raw Events Export: JSON format wraps data in Quality Envelope', async () => {
      const res = await fetch(`${baseUrl}/api/admin/exports/raw_events?format=json`, {
        headers: { Cookie: superadminCookie }
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.meta).toBeDefined();
      expect(json.meta.export_type).toBe('raw_events');
      expect(json.meta.timezone).toBe('UTC');
      expect(json.meta.reconciliation_checksum).toHaveLength(64);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('3.5 Product Metrics Export: provides RFC 4180 CSV with amazon_clicks and whatsapp_clicks', async () => {
      const res = await fetch(`${baseUrl}/api/admin/exports/product_metrics?format=csv`, {
        headers: { Cookie: superadminCookie }
      });

      expect(res.status).toBe(200);
      const csv = await res.text();
      assertRFC4180CSV(csv, ['rollup_date', 'product_id', 'impressions', 'detail_views', 'amazon_clicks', 'whatsapp_clicks']);
    });

    it('3.6 Permitted Enquiries Export: STRICT Zero-PII (excludes customer_name, email, phone, design)', async () => {
      // Insert a sample enquiry with PII
      const enqId = 'BC-ENQ-' + crypto.randomBytes(4).toString('hex');
      db.prepare(`
        INSERT INTO enquiries (id, customer_name, contact_email, contact_phone, preferred_contact_method, project_type, design_description, approximate_quantity, budget_range_inr, status, ip_hash)
        VALUES (?, 'Rahul Sharma', 'rahul@sharma.in', '+91 98765 43210', 'whatsapp', 'custom_figurine', 'Detailed secret sculpture requirement', 2, '₹5,000 - ₹10,000', 'new', 'hash_123')
      `).run(enqId);

      const res = await fetch(`${baseUrl}/api/admin/exports/permitted_enquiries?format=json`, {
        headers: { Cookie: superadminCookie }
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.length).toBeGreaterThan(0);

      const item = json.data.find((e: any) => e.enquiry_id === enqId);
      expect(item).toBeDefined();
      expect(item.customer_name).toBeUndefined();
      expect(item.contact_email).toBeUndefined();
      expect(item.contact_phone).toBeUndefined();
      expect(item.design_description).toBeUndefined();
      expect(item.project_category).toBe('custom_figurine');
      assertZeroPII(json);
    });

    it('3.7 Product Catalog Export: exports prices in integer paise and formatted INR', async () => {
      const res = await fetch(`${baseUrl}/api/admin/exports/product_catalog?format=json`, {
        headers: { Cookie: superadminCookie }
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.length).toBeGreaterThan(0);

      for (const prod of json.data) {
        assertIntegerPaise(prod.base_price_paise, 'Catalog base price');
        expect(prod.formatted_price_inr).toMatch(/^₹[0-9,]+(\.[0-9]{2})?$/);
      }
    });

    it('3.8 Conversion Funnels Export: contains verbatim mandatory attribution disclaimer', async () => {
      const res = await fetch(`${baseUrl}/api/admin/exports/conversion_funnels?format=json`, {
        headers: { Cookie: superadminCookie }
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.length).toBe(4);

      const outboundStep = json.data.find((f: any) => f.funnel_name.includes('Outbound'));
      expect(outboundStep).toBeDefined();
      expect(outboundStep.disclaimer).toBe(MANDATORY_ATTRIBUTION_DISCLAIMER);
    });
  });

  // ==========================================================================
  // 4. Read-Only AI Analyst REST API (F32 & F33)
  // ==========================================================================
  describe('4. Read-Only AI Analyst REST API & Epistemic Separation', () => {
    it('4.1 Bearer Token Auth: returns HTTP 401 when Authorization header is missing', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai-analyst/catalog-summary`);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain('Missing or malformed Bearer token');
    });

    it('4.2 Bearer Token Auth: returns HTTP 401 on forged or expired Bearer token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai-analyst/catalog-summary`, {
        headers: { Authorization: 'Bearer invalid_ai_analyst_token_value_here' }
      });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain('Invalid or expired');
    });

    it('4.3 Query Guard: Categorically blocks mutating HTTP methods with HTTP 405 Method Not Allowed', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
      for (const m of methods) {
        const res = await fetch(`${baseUrl}/api/v1/ai-analyst/catalog-summary`, {
          method: m,
          headers: { Authorization: `Bearer ${AI_TOKEN}` }
        });
        expect(res.status).toBe(405);
        expect(res.headers.get('allow')).toBe('GET');
        const json = await res.json();
        expect(json.error).toContain('Method Not Allowed');
      }
    });

    it('4.4 Query Guard: Rejects SQL injection attempts in query parameters with HTTP 422', async () => {
      const maliciousUrls = [
        `${baseUrl}/api/v1/ai-analyst/performance-facts?product_id=prod_1'%20OR%201=1--`,
        `${baseUrl}/api/v1/ai-analyst/performance-facts?start=2026-01-01;DROP%20TABLE%20products;--`,
        `${baseUrl}/api/v1/ai-analyst/conversion-insights?product_id=p' UNION SELECT * FROM admin_users --`
      ];

      for (const u of maliciousUrls) {
        const res = await fetch(u, {
          headers: { Authorization: `Bearer ${AI_TOKEN}` }
        });
        expect(res.status).toBe(422);
        const json = await res.json();
        expect(json.error).toContain('Unprocessable Entity');
      }
    });

    it('4.5 Query Guard: Rate limit throttles after 30 requests/min with HTTP 429', async () => {
      for (let i = 0; i < 30; i++) {
        aiAnalystRateLimiter.check('ai_analyst_127.0.0.1');
      }

      const res = await fetch(`${baseUrl}/api/v1/ai-analyst/catalog-summary`, {
        headers: { Authorization: `Bearer ${AI_TOKEN}` }
      });

      expect(res.status).toBe(429);
      expect(res.headers.get('retry-after')).toBeDefined();
    });

    it('4.6 GET /api/v1/ai-analyst/catalog-summary returns product counts, price range, made-to-order ratio', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai-analyst/catalog-summary`, {
        headers: { Authorization: `Bearer ${AI_TOKEN}` }
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('success');
      expect(json.catalog_summary).toBeDefined();

      const summary = json.catalog_summary;
      expect(typeof summary.total_products_published).toBe('number');
      expect(Array.isArray(summary.categories)).toBe(true);
      assertIntegerPaise(summary.pricing_spectrum_inr.min_price_paise, 'Catalog min price');
      assertIntegerPaise(summary.pricing_spectrum_inr.max_price_paise, 'Catalog max price');
      expect(typeof summary.production_characteristics.made_to_order_ratio_pct).toBe('number');
    });

    it('4.7 GET /api/v1/ai-analyst/performance-facts returns database truth counts and purchase_outcome_unknown', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai-analyst/performance-facts`, {
        headers: { Authorization: `Bearer ${AI_TOKEN}` }
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('success');
      expect(json.measured_facts).toBeDefined();

      const m = json.measured_facts;
      expect(m.downstream_purchase_status).toBe('purchase_outcome_unknown');
      expect(m.verified_on_platform_purchases).toBe(0);
      expect(m.attribution_disclaimer).toBe(MANDATORY_ATTRIBUTION_DISCLAIMER);
    });

    it('4.8 GET /api/v1/ai-analyst/conversion-insights strictly enforces 3-Tier Epistemic Separation', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai-analyst/conversion-insights`, {
        headers: { Authorization: `Bearer ${AI_TOKEN}` }
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      assertEpistemicSeparation(json);

      const ec = json.epistemic_classification;

      // Tier 1: Facts
      expect(ec.tier_1_measured_facts.epistemic_level).toBe('EMPIRICAL_OBSERVATION');
      expect(ec.tier_1_measured_facts.data.downstream_purchase_status).toBe('purchase_outcome_unknown');
      expect(ec.tier_1_measured_facts.data.verified_on_platform_purchases).toBe(0);

      // Tier 2: Derived Ratios
      expect(ec.tier_2_derived_metrics.epistemic_level).toBe('DETERMINISTIC_CALCULATION');
      expect(ec.tier_2_derived_metrics.formulas_applied).toBeDefined();
      expect(ec.tier_2_derived_metrics.data.explicit_denominator).toBeDefined();

      // Tier 3: Inferences & Disclaimer
      expect(ec.tier_3_hypotheses_and_inferences.epistemic_level).toBe('STATISTICAL_INFERENCE');
      expect(ec.tier_3_hypotheses_and_inferences.disclaimer).toContain('statistical heuristics');
      expect(Array.isArray(ec.tier_3_hypotheses_and_inferences.signals)).toBe(true);

      // Verify zero PII in AI payload
      assertZeroPII(json);
    });

    it('4.9 GET /api/v1/ai-analyst/schema-docs returns self-documenting OpenAPI contract', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai-analyst/schema-docs`, {
        headers: { Authorization: `Bearer ${AI_TOKEN}` }
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.schema_version).toBe('1.0.0');
      expect(json.api_title).toContain('AI Analyst');
      expect(Array.isArray(json.endpoints)).toBe(true);
      expect(json.operational_guardrails.rate_limit_per_minute).toBe(30);
      expect(json.operational_guardrails.mutation_policy).toContain('Strictly Read-Only');
    });
  });
});
