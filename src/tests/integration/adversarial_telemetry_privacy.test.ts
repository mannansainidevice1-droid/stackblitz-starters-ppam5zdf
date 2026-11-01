/**
 * BHAIRAVI Creations Digital Platform
 * Adversarial Stress & Fuzzing Test Suite — Milestone 3 Challenger 1
 * Target: src/tests/integration/adversarial_telemetry_privacy.test.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGES:
 * 1. Privileged Purchase Shield Fuzzing:
 *    - Bypass attempts via case variations (PURCHASE, pUrchase, PuRcHaSe, etc.)
 *    - Bypass attempts via batch arrays (purchase hidden at start, middle, end of batch)
 *    - Bypass attempts via Unicode tricks (homoglyphs, fullwidth, zero-width spaces, NBSP)
 *    - Bypass attempts via header spoofing (X-Privileged, X-Role, Authorization, forged cookies)
 *    - Role privilege boundaries (viewer role sending purchase)
 *    - Verify HTTP 403 Forbidden and strict 0 database writes in all bypass attempts.
 *
 * 2. Clock-Skew Validation Fuzzing:
 *    - Extreme future drift (+48h, +10 years, year 9999) -> HTTP 422 Unprocessable Entity
 *    - Extreme past drift (-48h, year 1970, -25h) -> HTTP 422 Unprocessable Entity
 *    - Borderline drift past & future (+301s, -301s) -> HTTP 202 Accepted, clock_skew_flag = 1
 *    - Borderline non-drift (+299s, -299s, 0s) -> HTTP 202 Accepted, clock_skew_flag = 0
 *    - Malformed timestamp strings (non-date strings, numbers, empty) -> HTTP 422
 *
 * 3. DPDP Consent & Zero DB Write Fuzzing:
 *    - Fuzz consent_status: 'denied', 'DENIED', 'Denied', '  denied  ' -> HTTP 204 No Content, 0 DB write
 *    - Header DNT: '1', dnt: '1' with consent_status: 'granted' -> HTTP 204 No Content, 0 DB write
 *    - Batched opt-outs (all denied, DNT: 1 on batch, mixed batch) -> verify 0 writes for denied events
 *    - Malformed consent status ('opt_out', 'revoked', empty, null, invalid enum) -> 0 DB writes
 *
 * 4. Zero-PII Sanitization Fuzzing:
 *    - Complex email formats (plus tags, subdomains, quoted local-parts, uppercase, query strings, metadata)
 *    - Indian phone numbers with varying spacing, brackets, and prefixes (+91, 0, 91-, (+91), etc.)
 *    - UTM parameter PII injection test
 *
 * 5. Attribution Integrity Mandate Fuzzing:
 *    - amazon_outbound_click with client-spoofed outcome_status ('verified_purchase', 'completed_order')
 *    - whatsapp_outbound_click with client-spoofed outcome_status ('verified_purchase', 'converted')
 *    - Batch submissions of outbound clicks with spoofed statuses
 *    - Strict assertion of purchase_outcome_unknown in database and BI exports
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { createDbConnection } from '../../server/db/connection.js';
import { runMigrations } from '../../server/db/migrator.js';
import { createApp } from '../../server/app.js';
import { telemetryRateLimiter, aiAnalystRateLimiter } from '../../server/middleware/rate_limiter.js';
import { assertOutcomeUnknown } from '../helpers/assertions.js';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data/test_adversarial_telemetry.db');
const AI_TOKEN = 'test_ai_analyst_scoped_bearer_token_2026';

describe('Milestone 3 Challenger 1: Adversarial Telemetry Ingestion & Privacy Fuzzing', () => {
  let db: Database.Database;
  let server: http.Server;
  let baseUrl: string;

  const superadminUser = {
    id: 'usr_adv_superadmin_01',
    username: 'adv_superadmin',
    email: 'adv_superadmin@bhairavicreations.test',
    password: 'SuperAdminPass2026!',
    passwordHash: crypto.createHash('sha256').update('SuperAdminPass2026!').digest('hex'),
    role: 'superadmin'
  };

  const adminUser = {
    id: 'usr_adv_admin_02',
    username: 'adv_admin',
    email: 'adv_admin@bhairavicreations.test',
    password: 'AdminLeadPass2026!',
    passwordHash: crypto.createHash('sha256').update('AdminLeadPass2026!').digest('hex'),
    role: 'admin'
  };

  const viewerUser = {
    id: 'usr_adv_viewer_03',
    username: 'adv_viewer',
    email: 'adv_viewer@bhairavicreations.test',
    password: 'ViewerReadPass2026!',
    passwordHash: crypto.createHash('sha256').update('ViewerReadPass2026!').digest('hex'),
    role: 'viewer'
  };

  beforeAll(async () => {
    process.env.AI_ANALYST_TOKEN = AI_TOKEN;

    const dbDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);

    db = createDbConnection(TEST_DB_PATH);
    runMigrations(db);

    const insertAdmin = db.prepare(`
      INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    insertAdmin.run(superadminUser.id, superadminUser.username, superadminUser.email, superadminUser.passwordHash, superadminUser.role);
    insertAdmin.run(adminUser.id, adminUser.username, adminUser.email, adminUser.passwordHash, adminUser.role);
    insertAdmin.run(viewerUser.id, viewerUser.username, viewerUser.email, viewerUser.passwordHash, viewerUser.role);

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
    if (db && db.open) {
      db.close();
    }
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);
  });

  beforeEach(() => {
    telemetryRateLimiter.reset();
    aiAnalystRateLimiter.reset();
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

  const makeEvent = (overrides: Record<string, any> = {}) => ({
    event_id: crypto.randomUUID(),
    event_type: 'page_view',
    timestamp_utc: new Date().toISOString(),
    session_id: 'sess_' + crypto.randomBytes(12).toString('hex'),
    product_id: 'prod_00000000-0000-4000-8000-000000000001',
    page_path: '/products/ganesha-antique-bronze-hand-painted',
    referrer_category: 'direct',
    device_category: 'desktop',
    consent_status: 'granted',
    metadata: {},
    ...overrides
  });

  const getEventsCount = (): number => {
    return (db.prepare('SELECT COUNT(*) as count FROM analytics_events').get() as any).count;
  };

  // ==========================================================================
  // CHALLENGE 1: Privileged Purchase Shield Fuzzing
  // ==========================================================================
  describe('1. Privileged Purchase Shield Adversarial Challenge', () => {
    it('1.1 should reject case variations of purchase (PURCHASE, pUrchase, PuRcHaSe, purchase\\u00A0) with HTTP 403 and 0 DB writes', async () => {
      const variations = [
        'PURCHASE',
        'pUrchase',
        'PuRcHaSe',
        'pURchASE',
        '  purchase  ',
        '\tpurchase\n',
        'purchase\u00A0' // non-breaking space
      ];

      for (const variant of variations) {
        const countBefore = getEventsCount();
        const evt = makeEvent({ event_type: variant });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status, `Failed for event_type: "${variant}"`).toBe(403);
        const json = await res.json();
        expect(json.error).toContain('PrivilegedEventError');

        const countAfter = getEventsCount();
        expect(countAfter, `DB record created for variant: "${variant}"`).toBe(countBefore);
      }
    });

    it('1.2 should block batch arrays containing a hidden purchase event (start, middle, end) with HTTP 403 and 0 DB writes', async () => {
      const positions = ['start', 'middle', 'end'];

      for (const pos of positions) {
        const countBefore = getEventsCount();
        const ev1 = makeEvent({ event_type: 'product_impression' });
        const ev2 = makeEvent({ event_type: 'product_click' });
        const purchaseEv = makeEvent({ event_type: 'purchase' });

        let batch: any[] = [];
        if (pos === 'start') batch = [purchaseEv, ev1, ev2];
        else if (pos === 'middle') batch = [ev1, purchaseEv, ev2];
        else batch = [ev1, ev2, purchaseEv];

        const res = await fetch(`${baseUrl}/api/v1/analytics/events/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch)
        });

        expect(res.status, `Batch with purchase at ${pos} did not return 403`).toBe(403);
        const json = await res.json();
        expect(json.error).toContain('PrivilegedEventError');

        const countAfter = getEventsCount();
        expect(countAfter, `Batch with purchase at ${pos} wrote records to DB!`).toBe(countBefore);
      }
    });

    it('1.3 should reject Unicode homoglyphs and fullwidth characters without recording purchases', async () => {
      const unicodeTricks = [
        'рurchase', // Cyrillic small 'р' (U+0440)
        'purсhase', // Cyrillic small 'с' (U+0441)
        'ｐｕｒｃｈａｓｅ', // Fullwidth purchase (U+FF50...)
        'pur\u200Bchase', // Zero-width space inserted
        'purchase\u0000', // Null byte
        'PURCHASE%00'
      ];

      for (const trick of unicodeTricks) {
        const countBefore = getEventsCount();
        const evt = makeEvent({ event_type: trick });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        // Must NOT succeed (must be 403 or 422)
        expect([403, 422]).toContain(res.status);

        // Must write 0 records to DB
        const countAfter = getEventsCount();
        expect(countAfter, `Unicode trick "${trick}" wrote records to DB!`).toBe(countBefore);

        // Verify no purchase record exists with this event_id
        const row = db.prepare('SELECT * FROM analytics_events WHERE event_id = ?').get(evt.event_id);
        expect(row).toBeUndefined();
      }
    });

    it('1.4 should reject purchase emissions with spoofed privilege headers and fake cookies with HTTP 403 and 0 DB writes', async () => {
      const spoofHeaders: Record<string, string>[] = [
        { 'X-Privileged': 'true' },
        { 'X-Privileged': '1' },
        { 'X-Role': 'admin' },
        { 'X-Role': 'superadmin' },
        { 'X-User-Role': 'superadmin' },
        { 'Authorization': `Bearer ${AI_TOKEN}` },
        { 'Authorization': 'Basic YWRtaW46cGFzc3dvcmQ=' },
        { 'Cookie': 'bhr_session=fake_unauthorized_token_12345' },
        { 'Cookie': 'role=superadmin; is_admin=1' }
      ];

      for (const headers of spoofHeaders) {
        const countBefore = getEventsCount();
        const evt = makeEvent({ event_type: 'purchase' });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(evt)
        });

        expect(res.status, `Header spoof failed to block 403: ${JSON.stringify(headers)}`).toBe(403);
        const countAfter = getEventsCount();
        expect(countAfter, `Header spoof wrote to DB: ${JSON.stringify(headers)}`).toBe(countBefore);
      }
    });

    it('1.5 should reject purchase emissions from authenticated viewer role with HTTP 403 and 0 DB writes', async () => {
      const viewerCookie = await loginAs(viewerUser);
      expect(viewerCookie).toContain('bhr_session=');

      const countBefore = getEventsCount();
      const evt = makeEvent({ event_type: 'purchase' });

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': viewerCookie
        },
        body: JSON.stringify(evt)
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('PrivilegedEventError');

      const countAfter = getEventsCount();
      expect(countAfter).toBe(countBefore);
    });

    it('1.6 should accept purchase event ONLY from authenticated admin or superadmin', async () => {
      const adminCookie = await loginAs(adminUser);
      const countBefore = getEventsCount();
      const evt = makeEvent({ event_type: 'purchase' });

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': adminCookie
        },
        body: JSON.stringify(evt)
      });

      expect(res.status).toBe(202);
      const countAfter = getEventsCount();
      expect(countAfter).toBe(countBefore + 1);

      const row = db.prepare('SELECT * FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;
      expect(row.event_type).toBe('purchase');
      expect(row.outcome_status).toBe('verified_purchase');
    });
  });

  // ==========================================================================
  // CHALLENGE 2: Clock-Skew Validation Fuzzing
  // ==========================================================================
  describe('2. Clock-Skew Validation Adversarial Challenge', () => {
    it('2.1 should reject extreme future timestamps (+48h, +10 years, year 9999) with HTTP 422 and 0 DB writes', async () => {
      const nowMs = Date.now();
      const extremeFutureTimestamps = [
        new Date(nowMs + 48 * 3600 * 1000).toISOString(), // +48 hours
        new Date(nowMs + 10 * 365 * 86400 * 1000).toISOString(), // +10 years
        '9999-12-31T23:59:59.000Z',
        new Date(nowMs + 25 * 3600 * 1000).toISOString() // +25 hours (beyond 24h boundary)
      ];

      for (const ts of extremeFutureTimestamps) {
        const countBefore = getEventsCount();
        const evt = makeEvent({ timestamp_utc: ts });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status, `Timestamp ${ts} did not return 422`).toBe(422);
        const json = await res.json();
        expect(json.error).toContain('ClockSkewError');

        const countAfter = getEventsCount();
        expect(countAfter, `Timestamp ${ts} wrote to DB!`).toBe(countBefore);
      }
    });

    it('2.2 should reject extreme past timestamps (-48h, year 1970, -25h) with HTTP 422 and 0 DB writes', async () => {
      const nowMs = Date.now();
      const extremePastTimestamps = [
        new Date(nowMs - 48 * 3600 * 1000).toISOString(), // -48 hours
        '1970-01-01T00:00:00.000Z', // Unix epoch 1970
        '1999-12-31T23:59:59.000Z', // Y2K
        new Date(nowMs - 25 * 3600 * 1000).toISOString() // -25 hours
      ];

      for (const ts of extremePastTimestamps) {
        const countBefore = getEventsCount();
        const evt = makeEvent({ timestamp_utc: ts });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status, `Past timestamp ${ts} did not return 422`).toBe(422);
        const json = await res.json();
        expect(json.error).toContain('ClockSkewError');

        const countAfter = getEventsCount();
        expect(countAfter, `Past timestamp ${ts} wrote to DB!`).toBe(countBefore);
      }
    });

    it('2.3 should accept borderline drift (+301s and -301s) with HTTP 202 and set clock_skew_flag = 1', async () => {
      const nowMs = Date.now();
      const drifts = [
        { desc: 'future 301s', ts: new Date(nowMs + 301 * 1000).toISOString() },
        { desc: 'past 301s', ts: new Date(nowMs - 301 * 1000).toISOString() },
        { desc: 'past 1 hour', ts: new Date(nowMs - 3600 * 1000).toISOString() },
        { desc: 'future 23 hours', ts: new Date(nowMs + 23 * 3600 * 1000).toISOString() }
      ];

      for (const { desc, ts } of drifts) {
        const evt = makeEvent({ timestamp_utc: ts });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status, `Drift ${desc} failed with status ${res.status}`).toBe(202);
        const row = db.prepare('SELECT clock_skew_flag FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;
        expect(row, `Event not found for ${desc}`).toBeDefined();
        expect(row.clock_skew_flag, `clock_skew_flag not set to 1 for ${desc}`).toBe(1);
      }
    });

    it('2.4 should accept acceptable drift (+299s, -299s, 0s) with HTTP 202 and set clock_skew_flag = 0', async () => {
      const nowMs = Date.now();
      const acceptableDrifts = [
        { desc: 'future 299s', ts: new Date(nowMs + 299 * 1000).toISOString() },
        { desc: 'past 299s', ts: new Date(nowMs - 299 * 1000).toISOString() },
        { desc: 'exact now', ts: new Date(nowMs).toISOString() }
      ];

      for (const { desc, ts } of acceptableDrifts) {
        const evt = makeEvent({ timestamp_utc: ts });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status, `Acceptable drift ${desc} failed`).toBe(202);
        const row = db.prepare('SELECT clock_skew_flag FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;
        expect(row, `Event not found for ${desc}`).toBeDefined();
        expect(row.clock_skew_flag, `clock_skew_flag was unexpectedly flagged for ${desc}`).toBe(0);
      }
    });

    it('2.5 should reject malformed or unparseable timestamps with HTTP 422 and 0 DB writes', async () => {
      const malformedTimestamps = [
        'invalid-date-string',
        '2026-99-99T99:99:99Z',
        'tomorrow',
        '0',
        'NaN'
      ];

      for (const ts of malformedTimestamps) {
        const countBefore = getEventsCount();
        const evt = makeEvent({ timestamp_utc: ts });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status, `Malformed timestamp "${ts}" did not return 422`).toBe(422);
        const countAfter = getEventsCount();
        expect(countAfter, `Malformed timestamp "${ts}" wrote to DB!`).toBe(countBefore);
      }
    });
  });

  // ==========================================================================
  // CHALLENGE 3: DPDP Consent & Zero DB Write Fuzzing
  // ==========================================================================
  describe('3. DPDP Consent & Zero DB Write Adversarial Challenge', () => {
    it('3.1 should return HTTP 204 No Content and write 0 DB records for consent_status variations (denied, DENIED, Denied, whitespace)', async () => {
      const deniedVariations = [
        'denied',
        'DENIED',
        'Denied',
        '  denied  ',
        '\tdenied\n'
      ];

      for (const status of deniedVariations) {
        const countBefore = getEventsCount();
        const evt = makeEvent({ consent_status: status });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status, `Failed for consent_status: "${status}"`).toBe(204);
        const countAfter = getEventsCount();
        expect(countAfter, `DB record created for denied consent status: "${status}"`).toBe(countBefore);

        const row = db.prepare('SELECT * FROM analytics_events WHERE event_id = ?').get(evt.event_id);
        expect(row).toBeUndefined();
      }
    });

    it('3.2 should return HTTP 204 No Content and write 0 DB records when DNT: 1 header is passed', async () => {
      const dntHeaders: Record<string, string>[] = [
        { 'DNT': '1' },
        { 'dnt': '1' }
      ];

      for (const headers of dntHeaders) {
        const countBefore = getEventsCount();
        const evt = makeEvent({ consent_status: 'granted' });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(evt)
        });

        expect(res.status, `DNT header failed to return 204: ${JSON.stringify(headers)}`).toBe(204);
        const countAfter = getEventsCount();
        expect(countAfter, `DNT header wrote to DB: ${JSON.stringify(headers)}`).toBe(countBefore);

        const row = db.prepare('SELECT * FROM analytics_events WHERE event_id = ?').get(evt.event_id);
        expect(row).toBeUndefined();
      }
    });

    it('3.3 should handle batches with DNT header and denied consent, dropping opted-out events atomically', async () => {
      // Test 1: entire batch denied
      const countBefore1 = getEventsCount();
      const allDeniedBatch = [
        makeEvent({ consent_status: 'denied' }),
        makeEvent({ consent_status: 'denied' }),
        makeEvent({ consent_status: 'denied' })
      ];

      const res1 = await fetch(`${baseUrl}/api/v1/analytics/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allDeniedBatch)
      });

      expect(res1.status).toBe(202);
      const json1 = await res1.json();
      expect(json1.ingested_count).toBe(0);
      expect(getEventsCount()).toBe(countBefore1);

      // Test 2: mixed batch (2 granted, 1 denied)
      const countBefore2 = getEventsCount();
      const evGranted1 = makeEvent({ consent_status: 'granted' });
      const evDenied = makeEvent({ consent_status: 'denied' });
      const evGranted2 = makeEvent({ consent_status: 'granted' });

      const res2 = await fetch(`${baseUrl}/api/v1/analytics/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([evGranted1, evDenied, evGranted2])
      });

      expect(res2.status).toBe(202);
      const json2 = await res2.json();
      expect(json2.ingested_count).toBe(2);
      expect(getEventsCount()).toBe(countBefore2 + 2);

      // Verify evDenied was not inserted
      const deniedRow = db.prepare('SELECT * FROM analytics_events WHERE event_id = ?').get(evDenied.event_id);
      expect(deniedRow).toBeUndefined();

      // Test 3: batch with DNT: 1 header
      const countBefore3 = getEventsCount();
      const batchWithDNT = [
        makeEvent({ consent_status: 'granted' }),
        makeEvent({ consent_status: 'granted' })
      ];

      const res3 = await fetch(`${baseUrl}/api/v1/analytics/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'DNT': '1' },
        body: JSON.stringify(batchWithDNT)
      });

      expect(res3.status).toBe(202);
      const json3 = await res3.json();
      expect(json3.ingested_count).toBe(0);
      expect(getEventsCount()).toBe(countBefore3);
    });

    it('3.4 should ensure 0 DB records are written when malformed consent payloads are sent', async () => {
      const malformedConsents = [
        '',
        null,
        'opt_out',
        'revoked',
        'forbidden_status',
        'random_string'
      ];

      for (const mal of malformedConsents) {
        const countBefore = getEventsCount();
        const evt = makeEvent({ consent_status: mal });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        // May return 422 or 500 (CHECK constraint failure)
        expect([400, 422, 500]).toContain(res.status);

        // Crucial invariant: 0 DB records created
        const countAfter = getEventsCount();
        expect(countAfter, `Malformed consent "${mal}" created a DB record!`).toBe(countBefore);
      }
    });
  });

  // ==========================================================================
  // CHALLENGE 4: Zero-PII Sanitization Fuzzing
  // ==========================================================================
  describe('4. Zero-PII Sanitization Adversarial Challenge', () => {
    it('4.1 should scrub standard and complex email formats (unencoded) from page_path and metadata', async () => {
      const complexEmails = [
        'simple.user@bhairavicreations.test',
        'custom.craft+orders@artisan.studio.co.in',
        'lead-artisan_99@sub-domain.workshop.org',
        'CUSTOMER.SUPPORT@BHAIRAVICREATIONS.COM'
      ];

      for (const email of complexEmails) {
        const evt = makeEvent({
          page_path: `/products/ganesha?contact=${email}`,
          metadata: {
            user_email: email,
            nested: {
              contact: `Reach out to ${email} for quotes`,
              array_data: [`Note: ${email}`]
            }
          }
        });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status).toBe(202);
        const row = db.prepare('SELECT page_path, metadata FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;
        expect(row.page_path, `Email ${email} leaked in page_path`).not.toContain(email);
        expect(row.metadata, `Email ${email} leaked in metadata`).not.toContain(email);
        expect(row.page_path).toContain('[REDACTED_EMAIL]');
        expect(row.metadata).toContain('[REDACTED_EMAIL]');
      }
    });

    it('4.2 should test Indian phone number redaction across standard spacing and prefixes (+91, 91-, 10 digits)', async () => {
      const phoneVariations = [
        { label: '+91 with spaces', phone: '+91 98765 43210' },
        { label: '+91 with hyphens', phone: '+91-98765-43210' },
        { label: '91- with hyphens', phone: '91-98765-43210' },
        { label: '10 digits starting with 9', phone: '9876543210' },
        { label: '10 digits starting with 8', phone: '8765432109' },
        { label: '10 digits starting with 7', phone: '7654321098' },
        { label: '10 digits starting with 6', phone: '6543210987' }
      ];

      for (const { label, phone } of phoneVariations) {
        const evt = makeEvent({
          page_path: `/custom-order?caller=${phone}`,
          metadata: {
            customer_mobile: phone,
            note: `Call customer at ${phone}`
          }
        });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status).toBe(202);
        const row = db.prepare('SELECT page_path, metadata FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;

        // Verify phone was redacted
        expect(row.page_path, `${label} leaked in page_path`).not.toContain(phone);
        expect(row.metadata, `${label} leaked in metadata`).not.toContain(phone);
        expect(row.metadata).toContain('[REDACTED_PHONE]');
      }
    });

    it('4.3 Indian phone numbers with brackets and dots are sanitized to [REDACTED_PHONE]', async () => {
      const phones = [
        { label: 'bracketed subscriber code', phone: '+91 (98765) 43210' },
        { label: 'bracketed area code', phone: '+91 (987) 654-3210' },
        { label: 'dotted phone', phone: '+91.98765.43210' },
        { label: 'standard dotted 5-5', phone: '98765.43210' }
      ];

      for (const { label, phone } of phones) {
        const evt = makeEvent({
          metadata: { contact: phone }
        });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status).toBe(202);
        const row = db.prepare('SELECT metadata FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;

        const parsedMetadata = JSON.parse(row.metadata);
        expect(parsedMetadata.contact).toBe('[REDACTED_PHONE]');
        expect(parsedMetadata.contact).not.toContain(phone);
      }
    });

    it('4.4 Trunk prefix 0 and bracketed country codes are fully redacted without prefix leaks', async () => {
      const phones = [
        { label: 'trunk prefix 0', phone: '09876543210' },
        { label: 'trunk prefix 0 with space', phone: '09876 543210' },
        { label: 'bracketed country code', phone: '(+91) 9876543210' },
        { label: 'bracketed zero', phone: '+91 (0) 98765 43210' },
        { label: 'bare bracketed zero', phone: '(0)9876543210' }
      ];

      for (const { label, phone } of phones) {
        const evt = makeEvent({
          metadata: { contact: phone }
        });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status).toBe(202);
        const row = db.prepare('SELECT metadata FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;

        const parsedMetadata = JSON.parse(row.metadata);
        expect(parsedMetadata.contact).toBe('[REDACTED_PHONE]');
        expect(parsedMetadata.contact).not.toContain('0[REDACTED_PHONE]');
      }
    });

    it('4.5 URL-encoded emails (%40) in page_path are sanitized to [REDACTED_EMAIL]', async () => {
      const rawEmail = 'customer.order@bhairavicreations.test';
      const encodedEmail = encodeURIComponent(rawEmail); // customer.order%40bhairavicreations.test
      const encodedPath = `/products/ganesha?contact=${encodedEmail}`;

      const evt = makeEvent({
        page_path: encodedPath
      });

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt)
      });

      expect(res.status).toBe(202);
      const row = db.prepare('SELECT page_path FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;

      expect(row.page_path).toContain('[REDACTED_EMAIL]');
      expect(row.page_path).not.toContain(encodedEmail);
      expect(row.page_path).not.toContain(rawEmail);
    });

    it('4.6 UTM parameters are sanitized through Zero-PII sanitization', async () => {
      const piiEmail = 'customer.utm@bhairavicreations.test';
      const piiPhone = '+919876543210';

      const evt = makeEvent({
        utm_source: piiEmail,
        utm_campaign: piiPhone
      });

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt)
      });

      expect(res.status).toBe(202);
      const row = db.prepare('SELECT utm_source, utm_campaign FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;

      expect(row.utm_source).toBe('[REDACTED_EMAIL]');
      expect(row.utm_campaign).toBe('[REDACTED_PHONE]');
    });
  });

  // ==========================================================================
  // CHALLENGE 5: Attribution Integrity Mandate Fuzzing
  // ==========================================================================
  describe('5. Attribution Integrity Mandate Adversarial Challenge', () => {
    it('5.1 should strictly store outcome_status = purchase_outcome_unknown for amazon_outbound_click regardless of client payload', async () => {
      const spoofAttempts = [
        'verified_purchase',
        'completed_order',
        'success',
        'converted',
        'purchase',
        'not_applicable',
        'null',
        '1'
      ];

      for (const spoof of spoofAttempts) {
        const evt = makeEvent({
          event_type: 'amazon_outbound_click',
          outcome_status: spoof
        });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status).toBe(202);
        const row = db.prepare('SELECT outcome_status FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;
        expect(row.outcome_status, `Spoofed outcome "${spoof}" bypassed override!`).toBe('purchase_outcome_unknown');
        assertOutcomeUnknown(row);
      }
    });

    it('5.2 should strictly store outcome_status = purchase_outcome_unknown for whatsapp_outbound_click regardless of client payload', async () => {
      const spoofAttempts = [
        'verified_purchase',
        'confirmed_lead',
        'converted',
        'not_applicable'
      ];

      for (const spoof of spoofAttempts) {
        const evt = makeEvent({
          event_type: 'whatsapp_outbound_click',
          outcome_status: spoof
        });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status).toBe(202);
        const row = db.prepare('SELECT outcome_status FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;
        expect(row.outcome_status, `WhatsApp spoofed outcome "${spoof}" bypassed override!`).toBe('purchase_outcome_unknown');
        assertOutcomeUnknown(row);
      }
    });

    it('5.3 should enforce attribution integrity across batched outbound clicks with spoofed statuses', async () => {
      const batch = [
        makeEvent({ event_type: 'amazon_outbound_click', outcome_status: 'verified_purchase' }),
        makeEvent({ event_type: 'whatsapp_outbound_click', outcome_status: 'verified_purchase' }),
        makeEvent({ event_type: 'page_view', outcome_status: 'verified_purchase' })
      ];

      const res = await fetch(`${baseUrl}/api/v1/analytics/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch)
      });

      expect(res.status).toBe(202);

      const rowA = db.prepare('SELECT outcome_status FROM analytics_events WHERE event_id = ?').get(batch[0].event_id) as any;
      const rowW = db.prepare('SELECT outcome_status FROM analytics_events WHERE event_id = ?').get(batch[1].event_id) as any;
      const rowP = db.prepare('SELECT outcome_status FROM analytics_events WHERE event_id = ?').get(batch[2].event_id) as any;

      expect(rowA.outcome_status).toBe('purchase_outcome_unknown');
      expect(rowW.outcome_status).toBe('purchase_outcome_unknown');
      expect(rowP.outcome_status).toBe('not_applicable');
    });

    it('5.4 should verify outbound clicks appear with outcome_status purchase_outcome_unknown in BI exports and AI Analyst', async () => {
      // 1. Export raw events
      const adminCookie = await loginAs(superadminUser);
      const resExport = await fetch(`${baseUrl}/api/admin/exports/raw_events?format=json`, {
        headers: { 'Cookie': adminCookie }
      });
      expect(resExport.status).toBe(200);
      const exportJson = await resExport.json();
      expect(exportJson.meta.attribution_disclaimer).toContain('Outbound Amazon and WhatsApp');

      const outboundRecords = exportJson.data.filter((r: any) =>
        r.event_type === 'amazon_outbound_click' || r.event_type === 'whatsapp_outbound_click'
      );
      expect(outboundRecords.length).toBeGreaterThan(0);
      for (const rec of outboundRecords) {
        expect(rec.outcome_status).toBe('purchase_outcome_unknown');
      }

      // 2. Query AI Analyst performance facts
      const resAI = await fetch(`${baseUrl}/api/v1/ai-analyst/performance-facts`, {
        headers: { 'Authorization': `Bearer ${AI_TOKEN}` }
      });
      expect(resAI.status).toBe(200);
      const aiFacts = await resAI.json();
      expect(aiFacts.measured_facts.downstream_purchase_status).toBe('purchase_outcome_unknown');
      expect(aiFacts.measured_facts.attribution_disclaimer).toContain('Purchase Outcome Unknown');
    });
  });
});
