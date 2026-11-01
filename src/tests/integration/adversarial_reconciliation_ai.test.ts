/**
 * BHAIRAVI Creations Digital Platform
 * Adversarial Challenge Suite: Reconciliation Invariant, CSV Formula Injection & AI Analyst Fuzzing
 * Target: src/tests/integration/adversarial_reconciliation_ai.test.ts
 *
 * Challenger 2 (Milestone 3):
 * 1. Mathematical Reconciliation Invariant (Delta = 0) & Drift Induction:
 *    - Induce drift in daily rollups (Delta > 0) -> assert HTTP 409 Conflict with exact discrepancies.
 *    - Induce drift via un-aggregated raw telemetry event -> assert HTTP 409 Conflict.
 *    - Re-aggregate via POST /api/admin/reconciliation/rollup -> assert Delta = 0 returns HTTP 200.
 *    - Verify exact returned payload status: compare claimed 'INVARIANT_HOLD_ZERO_DRIFT' vs 'reconciled_zero_drift'.
 * 2. CSV Export Escaping & Formula Injection Protection (CWE-1236):
 *    - Test product names/design fields with quotes, CRLF, and formula prefixes (=, +, -, @, \t, \r).
 *    - Verify RFC 4180 compliance (double quote wrapping and escaping).
 *    - Stress-test whether formula prefixes are neutralized or exposed directly to spreadsheet execution.
 * 3. AI Analyst Query Guard & Epistemic Separation:
 *    - Mutating verbs (POST, PUT, PATCH, DELETE) -> HTTP 405 Method Not Allowed + Allow header.
 *    - SQL injection fuzzing in parameters -> HTTP 422 Unprocessable Entity.
 *    - Rate limiter enforcement: 30 req/min -> HTTP 429 Too Many Requests.
 *    - Payload size ceiling: >32KB -> HTTP 413 Payload Too Large.
 *    - Strict 3-tier epistemic separation schema verification & division-by-zero resilience.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { createDbConnection } from '../../server/db/connection.js';
import { runMigrations } from '../../server/db/migrator.js';
import { createApp } from '../../server/app.js';
import {
  assertRFC4180CSV,
  assertZeroPII,
  assertOutcomeUnknown,
  assertIntegerPaise,
  assertReconciliationZeroDrift,
  assertEpistemicSeparation
} from '../helpers/assertions.js';
import { formatRFC4180CSV, ExportService } from '../../server/services/export.service.js';
import { ReconciliationService } from '../../server/services/reconciliation.service.js';
import { AiAnalystService } from '../../server/services/ai_analyst.service.js';
import { aiAnalystRateLimiter, authRateLimiter } from '../../server/middleware/rate_limiter.js';
import { hashPassword } from '../../server/auth/password.js';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data/test_adversarial_reconciliation_ai.db');
const AI_TOKEN = 'test_ai_analyst_scoped_bearer_token_2026';

describe('Adversarial Verification: Reconciliation Invariant, CSV Injection & AI Guard (Milestone 3)', () => {
  let db: Database.Database;
  let server: http.Server;
  let baseUrl: string;
  let serverPort: number;

  const adminUser = {
    username: 'adv_admin_m3',
    password: 'AdminPassword2026!',
    email: 'adv_admin_m3@bhairavicreations.test',
    role: 'admin'
  };

  const viewerUser = {
    username: 'adv_viewer_m3',
    password: 'ViewerPassword2026!',
    email: 'adv_viewer_m3@bhairavicreations.test',
    role: 'viewer'
  };

  beforeAll(async () => {
    process.env.AI_ANALYST_TOKEN = AI_TOKEN;

    if (fs.existsSync(TEST_DB_PATH)) {
      try { fs.unlinkSync(TEST_DB_PATH); } catch {}
    }

    db = createDbConnection(TEST_DB_PATH);
    runMigrations(db);

    // Seed test admin and viewer accounts using SHA-256 for test credentials
    const adminPasswordHash = crypto.createHash('sha256').update(adminUser.password).digest('hex');
    db.prepare(`
      INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `).run('usr_adv_admin_m3_id', adminUser.username, adminUser.email, adminPasswordHash, adminUser.role);

    const viewerPasswordHash = crypto.createHash('sha256').update(viewerUser.password).digest('hex');
    db.prepare(`
      INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `).run('usr_adv_viewer_m3_id', viewerUser.username, viewerUser.email, viewerPasswordHash, viewerUser.role);

    const app = createApp(db);
    server = http.createServer(app);

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        serverPort = addr.port;
        baseUrl = `http://127.0.0.1:${serverPort}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    try { db.close(); } catch {}
    if (fs.existsSync(TEST_DB_PATH)) {
      try { fs.unlinkSync(TEST_DB_PATH); } catch {}
    }
  });

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
  // CHALLENGE 1: Mathematical Reconciliation Invariant (Delta = 0) & Drift
  // ==========================================================================
  describe('Challenge 1: Mathematical Reconciliation Invariant (Delta = 0)', () => {
    const today = new Date().toISOString().slice(0, 10);
    const prodId1 = 'prod_00000000-0000-4000-8000-000000000001';
    const prodId2 = 'prod_00000000-0000-4000-8000-000000000002';
    let adminCookie: string;

    beforeEach(async () => {
      authRateLimiter.reset();
      adminCookie = await loginAs(adminUser);
      // Clean slate for test isolation
      db.prepare("DELETE FROM analytics_events WHERE timestamp_utc LIKE ?").run(`${today}%`);
      db.prepare('DELETE FROM analytics_daily_product_rollups WHERE rollup_date = ?').run(today);
    });

    it('1.1 should verify Delta = 0 returns HTTP 200 after clean rollup, but inspect status string', async () => {
      // Ingest 3 product views and 2 amazon clicks
      for (let i = 0; i < 3; i++) {
        await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createEvent({ event_type: 'product_view', product_id: prodId1, timestamp_utc: `${today}T09:00:0${i}.000Z` }))
        });
      }
      for (let i = 0; i < 2; i++) {
        await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createEvent({ event_type: 'amazon_outbound_click', product_id: prodId1, timestamp_utc: `${today}T09:01:0${i}.000Z` }))
        });
      }

      // Aggregate
      const rollupRes = await fetch(`${baseUrl}/api/admin/reconciliation/rollup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ date: today })
      });
      expect(rollupRes.status).toBe(200);

      // Verify reconciliation endpoint
      const verifyRes = await fetch(`${baseUrl}/api/admin/reconciliation/verify?start_date=${today}&end_date=${today}&product_id=${prodId1}`, {
        headers: { Cookie: adminCookie }
      });

      expect(verifyRes.status).toBe(200);
      const json = await verifyRes.json();
      expect(json.reconciled).toBe(true);
      expect(json.total_drift).toBe(0);
      expect(json.discrepancies).toEqual([]);
      expect(json.invariant_status).toBe('INVARIANT_HOLD_ZERO_DRIFT');
      expect(['reconciled_zero_drift', 'INVARIANT_HOLD_ZERO_DRIFT']).toContain(json.status);
    });

    it('1.2 Drift Injection A: Modify rollup counts in SQLite -> GET verify returns HTTP 409 Conflict with exact discrepancy', async () => {
      // Ingest 5 product clicks
      for (let i = 0; i < 5; i++) {
        await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createEvent({ event_type: 'product_click', product_id: prodId1, timestamp_utc: `${today}T10:00:0${i}.000Z` }))
        });
      }

      // Rollup
      await fetch(`${baseUrl}/api/admin/reconciliation/rollup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ date: today })
      });

      // Artificially induce drift: forge rollup row
      db.prepare('UPDATE analytics_daily_product_rollups SET card_clicks = 2 WHERE rollup_date = ? AND product_id = ?').run(today, prodId1);

      // Verify drift detection
      const verifyRes = await fetch(`${baseUrl}/api/admin/reconciliation/verify?start_date=${today}&end_date=${today}&product_id=${prodId1}`, {
        headers: { Cookie: adminCookie }
      });

      expect(verifyRes.status).toBe(409);
      const json = await verifyRes.json();
      expect(json.reconciled).toBe(false);
      expect(json.status).toBe('drift_detected');
      expect(json.invariant_status).toBe('INVARIANT_DRIFT_DETECTED');
      expect(json.total_drift).toBe(3); // 5 - 2 = 3
      expect(json.discrepancies.length).toBeGreaterThan(0);
      expect(json.discrepancies[0].product_id).toBe(prodId1);
      expect(json.discrepancies[0].delta_card_clicks).toBe(3);
      expect(json.error).toContain('ERR_RECONCILIATION_DRIFT');

      // Verify product discrepancy details
      const variance = json.product_variances.find((p: any) => p.product_id === prodId1);
      expect(variance).toBeDefined();
      expect(variance.delta_card_clicks).toBe(3);
      expect(variance.raw_card_clicks).toBe(5);
      expect(variance.rollup_card_clicks).toBe(2);
      expect(variance.total_variance).toBe(3);
    });

    it('1.3 Drift Injection B: Insert un-aggregated event -> GET verify returns HTTP 409 Conflict, then re-aggregating restores HTTP 200', async () => {
      // Ingest 4 views and aggregate
      for (let i = 0; i < 4; i++) {
        await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createEvent({ event_type: 'product_view', product_id: prodId1, timestamp_utc: `${today}T11:00:0${i}.000Z` }))
        });
      }

      await fetch(`${baseUrl}/api/admin/reconciliation/rollup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ date: today })
      });

      // Insert un-aggregated raw event directly into SQLite (without created_at column)
      db.prepare(`
        INSERT INTO analytics_events (
          event_id, event_type, timestamp_utc, session_id, product_id, page_path,
          referrer_category, device_category, consent_status, clock_skew_flag,
          outcome_status, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'not_applicable', '{}')
      `).run(
        crypto.randomUUID(),
        'product_view',
        `${today}T11:30:00.000Z`,
        'sess_unaggregated_01',
        prodId1,
        '/products/ganesha',
        'direct',
        'desktop',
        'granted'
      );

      // Verify drift detected
      const verifyDrift = await fetch(`${baseUrl}/api/admin/reconciliation/verify?start_date=${today}&end_date=${today}&product_id=${prodId1}`, {
        headers: { Cookie: adminCookie }
      });
      expect(verifyDrift.status).toBe(409);
      const driftJson = await verifyDrift.json();
      expect(driftJson.reconciled).toBe(false);
      expect(driftJson.total_drift).toBe(1);

      // Now Re-aggregate to restore invariant
      const restoreRollup = await fetch(`${baseUrl}/api/admin/reconciliation/rollup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ date: today })
      });
      expect(restoreRollup.status).toBe(200);

      // Verify invariant restored (HTTP 200, Delta = 0)
      const verifyRestored = await fetch(`${baseUrl}/api/admin/reconciliation/verify?start_date=${today}&end_date=${today}&product_id=${prodId1}`, {
        headers: { Cookie: adminCookie }
      });
      expect(verifyRestored.status).toBe(200);
      const restoredJson = await verifyRestored.json();
      expect(restoredJson.reconciled).toBe(true);
      expect(restoredJson.total_drift).toBe(0);
    });

    it('1.4 Multi-Product & Cross-Metric Drift Stress: Multi-product simultaneous drift accumulation', async () => {
      // Ingest events for two distinct products
      const p1Events = [
        createEvent({ event_type: 'product_impression', product_id: prodId1, timestamp_utc: `${today}T12:00:00.000Z` }),
        createEvent({ event_type: 'whatsapp_outbound_click', product_id: prodId1, timestamp_utc: `${today}T12:01:00.000Z` })
      ];
      const p2Events = [
        createEvent({ event_type: 'product_view', product_id: prodId2, timestamp_utc: `${today}T12:02:00.000Z` }),
        createEvent({ event_type: 'amazon_outbound_click', product_id: prodId2, timestamp_utc: `${today}T12:03:00.000Z` })
      ];

      for (const e of [...p1Events, ...p2Events]) {
        await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(e)
        });
      }

      await fetch(`${baseUrl}/api/admin/reconciliation/rollup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ date: today })
      });

      // Corrupt both products:
      // Product 1: alter whatsapp_clicks by +2
      db.prepare('UPDATE analytics_daily_product_rollups SET whatsapp_outbound_clicks = 3 WHERE rollup_date = ? AND product_id = ?').run(today, prodId1);
      // Product 2: alter detail_views by +4
      db.prepare('UPDATE analytics_daily_product_rollups SET detail_views = 5 WHERE rollup_date = ? AND product_id = ?').run(today, prodId2);

      // Verify without product_id filter (global check)
      const verifyRes = await fetch(`${baseUrl}/api/admin/reconciliation/verify?start_date=${today}&end_date=${today}`, {
        headers: { Cookie: adminCookie }
      });

      expect(verifyRes.status).toBe(409);
      const json = await verifyRes.json();
      expect(json.reconciled).toBe(false);
      // Total drift should sum: |3 - 1| + |5 - 1| = 2 + 4 = 6
      expect(json.total_drift).toBe(6);

      const var1 = json.product_variances.find((p: any) => p.product_id === prodId1);
      const var2 = json.product_variances.find((p: any) => p.product_id === prodId2);
      expect(var1.delta_whatsapp_clicks).toBe(2);
      expect(var2.delta_views).toBe(4);
    });

    it('1.5 RBAC Guard: viewer cannot access GET /api/admin/reconciliation/verify (HTTP 403)', async () => {
      const viewerCookie = await loginAs(viewerUser);
      expect(viewerCookie).toContain('bhr_session');
      const res = await fetch(`${baseUrl}/api/admin/reconciliation/verify?start_date=${today}&end_date=${today}`, {
        headers: { Cookie: viewerCookie }
      });
      expect(res.status).toBe(403);
    });
  });

  // ==========================================================================
  // CHALLENGE 2: CSV Export Escaping & Formula Injection (CWE-1236)
  // ==========================================================================
  describe('Challenge 2: CSV Export Escaping & Formula Injection Protection', () => {
    let adminCookie: string;

    beforeEach(async () => {
      authRateLimiter.reset();
      adminCookie = await loginAs(adminUser);
    });

    it('2.1 RFC 4180 Escaping: product names and text fields with quotes, commas, and CRLF', () => {
      const rows = [
        {
          id: 'test_1',
          name: 'Lord Ganesha, "Vighnaharta" Edition',
          description: 'Handcrafted\r\nwith precision',
          price: 149900
        },
        {
          id: 'test_2',
          name: 'Simple Vase',
          description: 'No special chars',
          price: 99900
        }
      ];

      const csv = formatRFC4180CSV(rows, ['id', 'name', 'description', 'price']);

      // CRLF line endings
      expect(csv).toContain('\r\n');

      // Double quotes escaped as ""
      expect(csv).toContain('"Lord Ganesha, ""Vighnaharta"" Edition"');
      // Multiline wrapped in quotes
      expect(csv).toContain('"Handcrafted\r\nwith precision"');
    });

    it('2.2 Formula Injection Fuzzing on formatRFC4180CSV: =cmd, +, -, @ prefixes are neutralized with OWASP single quote', () => {
      const maliciousRows = [
        { id: '1', name: "=cmd|' /C calc'!A0", type: 'DDE Execution' },
        { id: '2', name: '+1+1', type: 'Formula Plus' },
        { id: '3', name: '-10+5', type: 'Formula Minus' },
        { id: '4', name: '@SUM(1,2)', type: 'Formula At' },
        { id: '5', name: '\t=1+1', type: 'Tab Formula' },
        { id: '6', name: '\r=1+1', type: 'CR Formula' }
      ];

      const csv = formatRFC4180CSV(maliciousRows, ['id', 'name', 'type']);

      // Check whether formula injection is neutralized
      const rawFormulaExposed = csv.includes("=cmd|' /C calc'!A0") && !csv.includes("'=cmd|' /C calc'!A0");
      expect(rawFormulaExposed).toBe(false);
      expect(csv).toContain("'=cmd|' /C calc'!A0");
      expect(csv).toContain("'+1+1");
      expect(csv).toContain("'-10+5");
      expect(csv).toContain("'@SUM(1,2)");
      expect(csv).toContain("'\t=1+1");
      expect(csv).toContain("'\r=1+1");
    });

    it('2.3 Catalog CSV Export with adversarial product name injected in DB is safely neutralized', async () => {
      const advProdId = 'prod_adv_formula_injection_01';
      const advPayload = "=cmd|' /C calc'!A0";

      // Insert product with formula injection name into test database
      db.prepare(`
        INSERT OR REPLACE INTO products (
          id, slug, name, description, category_id, base_price_paise, material,
          manufacturing_method, finishing_type, is_made_to_order, inventory_count,
          care_safety_instructions,
          publication_status, is_featured, display_order, created_at, updated_at
        ) VALUES (
          ?, 'adv-formula-test', ?, 'Test desc', 'cat_home_decor', 149900, 'PLA+',
          '3D Printed', 'Raw', 0, 10, 'Handle with care', 'published', 0, 999, datetime('now'), datetime('now')
        )
      `).run(advProdId, advPayload);

      const res = await fetch(`${baseUrl}/api/admin/exports/product_catalog?format=csv`, {
        headers: { Cookie: adminCookie }
      });

      expect(res.status).toBe(200);
      const csvContent = await res.text();
      expect(res.headers.get('content-type')).toContain('text/csv');

      // Check that raw payload does NOT appear unescaped in CSV output
      const rawPayloadAppearsUnescaped = csvContent.includes(`"${advPayload}"`) || csvContent.includes(`,${advPayload},`);
      expect(rawPayloadAppearsUnescaped).toBe(false);
      expect(csvContent).toContain(`'${advPayload}`);

      // Clean up test product
      db.prepare('DELETE FROM products WHERE id = ?').run(advProdId);
    });

    it('2.4 Permitted Enquiries CSV Export: strictly enforces Zero-PII while adhering to RFC 4180', async () => {
      // Re-login to ensure fresh cookie
      const freshAdminCookie = await loginAs(adminUser);

      // Insert enquiry with customer PII
      const enqId = 'enq_adv_pii_test_01';
      db.prepare(`
        INSERT OR REPLACE INTO enquiries (
          id, customer_name, contact_email, contact_phone, preferred_contact_method,
          project_type, design_description, approximate_quantity, budget_range_inr,
          status, ip_hash, created_at, updated_at
        ) VALUES (
          ?, 'Dr. Vikram Malhotra', 'vikram.malhotra@secretdomain.in', '+91 98765 43210',
          'whatsapp', 'custom_figurine', 'Confidential design notes with formula =cmd', 5, '5000-10000',
          'new', 'hash123', datetime('now'), datetime('now')
        )
      `).run(enqId);

      const res = await fetch(`${baseUrl}/api/admin/exports/permitted_enquiries?format=csv`, {
        headers: { Cookie: freshAdminCookie }
      });

      expect(res.status).toBe(200);
      const csv = await res.text();

      // Zero-PII Invariant: customer name, email, phone, design notes MUST NOT appear
      expect(csv).not.toContain('Vikram Malhotra');
      expect(csv).not.toContain('vikram.malhotra@secretdomain.in');
      expect(csv).not.toContain('98765 43210');
      expect(csv).not.toContain('Confidential design notes');

      // RFC 4180 structure verification
      const expectedHeaders = ['enquiry_id', 'created_at_utc', 'project_category', 'budget_tier_inr', 'approximate_quantity', 'status', 'preferred_contact_method'];
      assertRFC4180CSV(csv, expectedHeaders);

      // Clean up
      db.prepare('DELETE FROM enquiries WHERE id = ?').run(enqId);
    });
  });

  // ==========================================================================
  // CHALLENGE 3: AI Analyst Query Guard & Epistemic Separation
  // ==========================================================================
  describe('Challenge 3: AI Analyst Query Guard & Epistemic Separation', () => {
    it('3.1 Mutating HTTP Methods: POST, PUT, PATCH, DELETE categorically return HTTP 405 Method Not Allowed', async () => {
      const endpoints = [
        '/api/v1/ai-analyst/catalog-summary',
        '/api/v1/ai-analyst/performance-facts',
        '/api/v1/ai-analyst/conversion-insights',
        '/api/v1/ai-analyst/schema-docs'
      ];
      const mutatingVerbs = ['POST', 'PUT', 'PATCH', 'DELETE'];

      for (const ep of endpoints) {
        for (const verb of mutatingVerbs) {
          const res = await fetch(`${baseUrl}${ep}`, {
            method: verb,
            headers: {
              Authorization: `Bearer ${AI_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ malicious: 'mutation' })
          });

          expect(res.status).toBe(405);
          expect(res.headers.get('allow')).toBe('GET');
          const json = await res.json();
          expect(json.success).toBe(false);
          expect(json.error).toContain('Method Not Allowed');
        }
      }
    });

    it('3.2 Mutating HTTP Methods return HTTP 405 even WITHOUT Bearer token (guard order)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai-analyst/catalog-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attack: 'unauthenticated write' })
      });

      // Method guard runs before auth guard
      expect(res.status).toBe(405);
      expect(res.headers.get('allow')).toBe('GET');
    });

    it('3.3 Bearer Token Security: Missing, malformed, or invalid tokens return HTTP 401', async () => {
      // 1. Missing Authorization header
      const res1 = await fetch(`${baseUrl}/api/v1/ai-analyst/catalog-summary`);
      expect(res1.status).toBe(401);

      // 2. Basic Auth instead of Bearer
      const res2 = await fetch(`${baseUrl}/api/v1/ai-analyst/catalog-summary`, {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' }
      });
      expect(res2.status).toBe(401);

      // 3. Forged token
      const res3 = await fetch(`${baseUrl}/api/v1/ai-analyst/catalog-summary`, {
        headers: { Authorization: 'Bearer forged_token_2026' }
      });
      expect(res3.status).toBe(401);
    });

    it('3.4 SQL Injection Fuzzing: Fuzz query parameters with SQL injection payloads -> HTTP 422', async () => {
      const sqliPayloads = [
        // Classic tautology with comment
        '?product_id=prod_1\'%20OR%201=1--',
        // Union based
        '?product_id=p\'%20UNION%20SELECT%20null,null,null,null,null,null,null,null,null,null%20--',
        '?product_id=p\'%20UNION%20SELECT%20*%20FROM%20admin_users%20--',
        // Stacked query with keyword
        '?start=2026-01-01;DROP%20TABLE%20products;--',
        '?end=2026-10-31;DELETE%20FROM%20analytics_events;--',
        // Comment injection
        '?product_id=prod_01--comment',
        // Disallowed keywords
        '?product_id=SELECT',
        '?product_id=UPDATE',
        '?product_id=ALTER',
        '?product_id=TRUNCATE'
      ];

      for (const payload of sqliPayloads) {
        const url = `${baseUrl}/api/v1/ai-analyst/performance-facts${payload}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${AI_TOKEN}` }
        });

        expect(res.status).toBe(422);
        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error).toMatch(/(Unprocessable Entity|Invalid|disallowed)/i);
      }
    });

    it('3.5 URL-Encoded & Unexpected Parameter SQLi Fuzzing: Stress-test query string bypasses', async () => {
      // Test payloads that should be blocked
      const blockedPayloads = [
        '?malicious_param=\'%20OR%201=1--',
        '?probe=1;DROP%20TABLE%20users;'
      ];

      for (const query of blockedPayloads) {
        const res = await fetch(`${baseUrl}/api/v1/ai-analyst/catalog-summary${query}`, {
          headers: { Authorization: `Bearer ${AI_TOKEN}` }
        });
        expect(res.status).toBe(422);
      }

      // Query guard URL decoding & stress-checks
      const encodedQuoteRes = await fetch(`${baseUrl}/api/v1/ai-analyst/catalog-summary?custom_filter=test%27`, {
        headers: { Authorization: `Bearer ${AI_TOKEN}` }
      });
      expect(encodedQuoteRes.status).toBe(422);
      const encodedJson = await encodedQuoteRes.json();
      expect(encodedJson.success).toBe(false);
      expect(encodedJson.error).toMatch(/(Unprocessable Entity|Invalid|disallowed)/i);

      // Additional stress checks: %23 (#), %22 ("), and OR injection
      const orHashRes = await fetch(`${baseUrl}/api/v1/ai-analyst/catalog-summary?probe=%27%20OR%201=1%23`, {
        headers: { Authorization: `Bearer ${AI_TOKEN}` }
      });
      expect(orHashRes.status).toBe(422);

      const commentRes = await fetch(`${baseUrl}/api/v1/ai-analyst/performance-facts?product_id=p/*comment*/`, {
        headers: { Authorization: `Bearer ${AI_TOKEN}` }
      });
      expect(commentRes.status).toBe(422);
    });

    it('3.6 Rate Limiter Stress: 30 requests within window succeed, 31st returns HTTP 429', async () => {
      const testIp = '127.0.0.99';

      // Drain rate limiter limit (30 requests)
      for (let i = 0; i < 30; i++) {
        aiAnalystRateLimiter.check(`ai_analyst_${testIp}`);
      }

      // 31st request via HTTP with X-Forwarded-For: 127.0.0.99
      const throttledRes = await fetch(`${baseUrl}/api/v1/ai-analyst/schema-docs`, {
        headers: {
          Authorization: `Bearer ${AI_TOKEN}`,
          'X-Forwarded-For': testIp
        }
      });

      expect(throttledRes.status).toBe(429);
      expect(throttledRes.headers.get('retry-after')).toBeDefined();
      const json = await throttledRes.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('rate limit exceeded');
    });

    it('3.7 Payload Ceiling Guard: Requests exceeding 32KB ceiling return HTTP 413 Payload Too Large', async () => {
      // Test payload ceiling via raw http request with Content-Length > 32KB
      const status = await new Promise<number>((resolve) => {
        const req = http.request({
          host: '127.0.0.1',
          port: serverPort,
          path: '/api/v1/ai-analyst/catalog-summary',
          method: 'POST', // Sends body > 32KB
          headers: {
            Authorization: `Bearer ${AI_TOKEN}`,
            'Content-Length': 35000,
            'Content-Type': 'application/json'
          }
        }, (res) => {
          resolve(res.statusCode || 0);
        });
        // Write oversized buffer
        req.write(Buffer.alloc(35000, 'A'));
        req.end();
      });

      expect(status).toBe(413);
    });

    it('3.8 Epistemic Separation Verification: strict 3-tier partitioning in conversion-insights', async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai-analyst/conversion-insights`, {
        headers: { Authorization: `Bearer ${AI_TOKEN}` }
      });

      expect(res.status).toBe(200);
      const json = await res.json();

      // Check epistemic_classification container
      expect(json.epistemic_classification).toBeDefined();
      const ec = json.epistemic_classification;

      // Tier 1: Measured Facts
      expect(ec.tier_1_measured_facts).toBeDefined();
      expect(ec.tier_1_measured_facts.epistemic_level).toBe('EMPIRICAL_OBSERVATION');
      expect(typeof ec.tier_1_measured_facts.data.raw_page_views).toBe('number');
      expect(typeof ec.tier_1_measured_facts.data.total_outbound_clicks).toBe('number');
      expect(ec.tier_1_measured_facts.data.downstream_purchase_status).toBe('purchase_outcome_unknown');
      expect(ec.tier_1_measured_facts.data.verified_on_platform_purchases).toBe(0);

      // Tier 2: Derived Metrics
      expect(ec.tier_2_derived_metrics).toBeDefined();
      expect(ec.tier_2_derived_metrics.epistemic_level).toBe('DETERMINISTIC_CALCULATION');
      expect(ec.tier_2_derived_metrics.formulas_applied).toBeDefined();
      expect(ec.tier_2_derived_metrics.data.discovery_ctr_pct).toBeDefined();
      expect(ec.tier_2_derived_metrics.data.detail_to_outbound_rate_pct).toBeDefined();
      expect(ec.tier_2_derived_metrics.data.explicit_denominator).toBeDefined();

      // Tier 3: Hypotheses and Inferences
      expect(ec.tier_3_hypotheses_and_inferences).toBeDefined();
      expect(ec.tier_3_hypotheses_and_inferences.epistemic_level).toBe('STATISTICAL_INFERENCE');
      expect(Array.isArray(ec.tier_3_hypotheses_and_inferences.signals)).toBe(true);
      expect(ec.tier_3_hypotheses_and_inferences.signals.length).toBeGreaterThan(0);

      for (const sig of ec.tier_3_hypotheses_and_inferences.signals) {
        expect(sig.signal_type).toBeDefined();
        expect(typeof sig.confidence_score).toBe('number');
        expect(sig.confidence_score).toBeGreaterThanOrEqual(0.0);
        expect(sig.confidence_score).toBeLessThanOrEqual(1.0);
        expect(sig.methodology).toBeDefined();
        expect(sig.hypothesis).toBeDefined();
        expect(sig.recommendation).toBeDefined();
      }

      // Mandatory heuristic disclaimer in Tier 3
      expect(typeof ec.tier_3_hypotheses_and_inferences.disclaimer).toBe('string');
      expect(ec.tier_3_hypotheses_and_inferences.disclaimer.length).toBeGreaterThan(10);

      // Verify assertEpistemicSeparation helper
      assertEpistemicSeparation(json);
      // Verify Zero PII
      assertZeroPII(json);
    });

    it('3.9 Division-by-Zero Resilience: verify derived metrics return 0.0 without NaN or Infinity on empty traffic', async () => {
      // Query with window in far future (0 events)
      const res = await fetch(`${baseUrl}/api/v1/ai-analyst/conversion-insights?start=2099-01-01T00:00:00Z&end=2099-01-02T00:00:00Z`, {
        headers: { Authorization: `Bearer ${AI_TOKEN}` }
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      const d = json.epistemic_classification.tier_2_derived_metrics.data;

      expect(Number.isFinite(d.discovery_ctr_pct)).toBe(true);
      expect(Number.isFinite(d.detail_to_outbound_rate_pct)).toBe(true);
      expect(Number.isFinite(d.session_outbound_intent_rate_pct)).toBe(true);
      expect(Number.isFinite(d.visitor_to_enquiry_rate_pct)).toBe(true);
      expect(Number.isFinite(d.enquiry_form_completion_rate_pct)).toBe(true);

      expect(d.discovery_ctr_pct).toBe(0.0);
      expect(d.detail_to_outbound_rate_pct).toBe(0.0);
      expect(d.session_outbound_intent_rate_pct).toBe(0.0);
    });
  });
});
