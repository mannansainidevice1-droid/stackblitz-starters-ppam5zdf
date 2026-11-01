/**
 * BHAIRAVI Creations Digital Platform
 * Milestone 3 Iteration 2 Challenger 1: Empirical Adversarial Fuzzer
 * File: src/tests/integration/adversarial_fuzzer_m3_r2.test.ts
 *
 * Verifies enhanced Zero-PII sanitization and telemetry invariants:
 * 1. Phone numbers with dots, spaces, hyphens
 * 2. Bracketed numbers
 * 3. Trunk prefix 0
 * 4. URL-encoded emails in page_path and metadata
 * 5. UTM campaign parameters containing emails/phones
 * 6. Zero regressions on privileged purchase shield, clock-skew, DPDP consent, and attribution integrity
 * 7. Non-PII safety invariant (no corruption of UUIDs, timestamps, prices, slugs)
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
import { telemetryRateLimiter } from '../../server/middleware/rate_limiter.js';
import { sanitizeZeroPII } from '../../server/services/analytics.service.js';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data/test_adversarial_fuzzer_m3_r2.db');

describe('Milestone 3 Iteration 2 Challenger 1: Adversarial Telemetry & Zero-PII Fuzzer', () => {
  let db: Database.Database;
  let server: http.Server;
  let baseUrl: string;

  const adminUser = {
    id: 'usr_fuzz_admin_01',
    username: 'fuzz_admin',
    email: 'fuzz_admin@bhairavicreations.test',
    password: 'AdminPassword2026!',
    passwordHash: crypto.createHash('sha256').update('AdminPassword2026!').digest('hex'),
    role: 'admin'
  };

  const viewerUser = {
    id: 'usr_fuzz_viewer_02',
    username: 'fuzz_viewer',
    email: 'fuzz_viewer@bhairavicreations.test',
    password: 'ViewerPassword2026!',
    passwordHash: crypto.createHash('sha256').update('ViewerPassword2026!').digest('hex'),
    role: 'viewer'
  };

  beforeAll(async () => {
    const dbDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);

    db = createDbConnection(TEST_DB_PATH);
    runMigrations(db);

    const insertAdmin = db.prepare(`
      INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    insertAdmin.run(adminUser.id, adminUser.username, adminUser.email, adminUser.passwordHash, adminUser.role);
    insertAdmin.run(viewerUser.id, viewerUser.username, viewerUser.email, viewerUser.passwordHash, viewerUser.role);

    const appHandler = createApp(db);
    server = http.createServer(appHandler);

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (db && db.open) db.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);
  });

  beforeEach(() => {
    telemetryRateLimiter.reset();
  });

  async function loginAs(user: { username: string; password: string }): Promise<string> {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, password: user.password })
    });
    return res.headers.get('set-cookie') || '';
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
  // VECTOR 1: Phone numbers with dots, spaces, hyphens
  // ==========================================================================
  describe('Vector 1: Phone numbers with dots, spaces, hyphens', () => {
    const dotSpaceHyphenPhones = [
      '98765.43210',
      '+91 98765.43210',
      '+91.98765.43210',
      '91.98765.43210',
      '98765-43210',
      '+91-98765-43210',
      '+91 98765-43210',
      '+91.98765-43210',
      '98765 43210',
      '+91 98765 43210',
      '987.654.3210',
      '+91.987.654.3210',
      '987-654-3210',
      '+91-987-654-3210',
      '+91 987 654 3210',
      '+91 98 76 54 32 10',
      '61234.56789',
      '71234.56789',
      '81234.56789',
      '91234.56789',
      '+91 61234.56789',
      '+91 71234.56789',
      '+91 81234.56789',
      '+91 91234.56789'
    ];

    it('1.1 should redact all dot/space/hyphen phone numbers in unit sanitizer', () => {
      for (const phone of dotSpaceHyphenPhones) {
        const sanitized = sanitizeZeroPII(phone);
        expect(sanitized, `Failed to redact: "${phone}"`).toBe('[REDACTED_PHONE]');
      }
    });

    it('1.2 should sanitize dot/space/hyphen phones in page_path and metadata via HTTP ingestion', async () => {
      for (const phone of dotSpaceHyphenPhones) {
        const evt = makeEvent({
          page_path: `/custom-order?callback=${phone}`,
          metadata: {
            customer_contact: phone,
            note: `Please call ${phone} urgently`
          }
        });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status).toBe(202);
        const row = db.prepare('SELECT page_path, metadata FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;
        expect(row.page_path, `Phone "${phone}" leaked in page_path`).not.toContain(phone);
        expect(row.metadata, `Phone "${phone}" leaked in metadata`).not.toContain(phone);
        expect(row.page_path).toContain('[REDACTED_PHONE]');
        expect(row.metadata).toContain('[REDACTED_PHONE]');
      }
    });

    it('1.3 should redact multiple phone numbers embedded in a single sentence', () => {
      const text = 'Primary: +91 98765.43210, Alternate: 87654.32109, Office: +91-76543-21098';
      const sanitized = sanitizeZeroPII(text);
      expect(sanitized).toBe('Primary: [REDACTED_PHONE], Alternate: [REDACTED_PHONE], Office: [REDACTED_PHONE]');
      expect(sanitized).not.toContain('98765');
      expect(sanitized).not.toContain('87654');
      expect(sanitized).not.toContain('76543');
    });
  });

  // ==========================================================================
  // VECTOR 2: Bracketed numbers
  // ==========================================================================
  describe('Vector 2: Bracketed numbers', () => {
    const bracketedPhones = [
      '+91 (98765) 43210',
      '(987) 654-3210',
      '+91 (0) 98765 43210',
      '(+91) (98765) 43210',
      '(+91) 98765 43210',
      '(+91) (0) 98765 43210',
      '(09876543210)',
      '(9876543210)',
      '(+919876543210)',
      '(9876) 543210',
      '(+91) (987) 654-3210',
      '+91 (0) 98765.43210',
      '+91 (0) 98765-43210',
      '(91) 9876543210',
      '(+91)9876543210'
    ];

    it('2.1 should redact all bracketed phone numbers completely without leaving dangling brackets', () => {
      for (const phone of bracketedPhones) {
        const sanitized = sanitizeZeroPII(phone);
        expect(sanitized, `Failed to redact bracketed phone: "${phone}"`).toBe('[REDACTED_PHONE]');
        expect(sanitized).not.toContain('(');
        expect(sanitized).not.toContain(')');
      }
    });

    it('2.2 should redact bracketed numbers in page_path and nested metadata via HTTP ingestion', async () => {
      for (const phone of bracketedPhones) {
        const evt = makeEvent({
          page_path: `/order?phone=${encodeURIComponent(phone)}`,
          metadata: {
            billing: { phone_number: phone },
            shipping: { phone_number: phone }
          }
        });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status).toBe(202);
        const row = db.prepare('SELECT page_path, metadata FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;
        expect(row.page_path, `Bracketed phone "${phone}" leaked in page_path`).not.toContain(phone);
        expect(row.metadata, `Bracketed phone "${phone}" leaked in metadata`).not.toContain(phone);
        expect(row.metadata).toContain('[REDACTED_PHONE]');
      }
    });
  });

  // ==========================================================================
  // VECTOR 3: Trunk prefix 0
  // ==========================================================================
  describe('Vector 3: Trunk prefix 0', () => {
    const trunk0Phones = [
      { raw: '09876543210', label: '11-digit continuous starting with 0' },
      { raw: '0 9876543210', label: '0 with space and 10 digits' },
      { raw: '0-9876543210', label: '0 with hyphen and 10 digits' },
      { raw: '0.9876543210', label: '0 with dot and 10 digits' },
      { raw: '098765 43210', label: '0 with 5-5 split' },
      { raw: '098765.43210', label: '0 with dot 5-5 split' },
      { raw: '098765-43210', label: '0 with hyphen 5-5 split' },
      { raw: '(0) 9876543210', label: 'bracketed (0) with space' },
      { raw: '(0)9876543210', label: 'bracketed (0) continuous' },
      { raw: '(0) 98765 43210', label: 'bracketed (0) with 5-5 split' },
      { raw: '(0) 98765.43210', label: 'bracketed (0) with dot 5-5 split' },
      { raw: '0 98765 43210', label: '0 with two spaces' },
      { raw: '0-98765-43210', label: '0 with two hyphens' },
      { raw: '0.98765.43210', label: '0 with two dots' }
    ];

    it('3.1 should sanitize trunk prefix 0 numbers without leaving leading "0" or "(0)" in unit sanitizer', () => {
      for (const { raw, label } of trunk0Phones) {
        const sanitized = sanitizeZeroPII(raw);
        expect(sanitized, `Failed for ${label} ("${raw}")`).toBe('[REDACTED_PHONE]');
        expect(sanitized).not.toBe('0[REDACTED_PHONE]');
        expect(sanitized).not.toBe('(0)[REDACTED_PHONE]');
        expect(sanitized).not.toBe('(0) [REDACTED_PHONE]');
      }
    });

    it('3.2 should sanitize trunk prefix 0 numbers in HTTP ingestion', async () => {
      for (const { raw, label } of trunk0Phones) {
        const evt = makeEvent({
          metadata: { phone: raw }
        });

        const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt)
        });

        expect(res.status).toBe(202);
        const row = db.prepare('SELECT metadata FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;
        const meta = JSON.parse(row.metadata);
        expect(meta.phone, `Leaked in DB for ${label}`).toBe('[REDACTED_PHONE]');
      }
    });
  });

  // ==========================================================================
  // VECTOR 4: URL-encoded emails
  // ==========================================================================
  describe('Vector 4: URL-encoded emails', () => {
    const encodedEmails = [
      { raw: '?contact=user%40example.com', label: 'standard percent-40' },
      { raw: 'user%2Btag%40domain.co.in', label: 'plus-tag with domain.co.in' },
      { raw: '?email=user%2Borders%40artisan.studio.co.in&tag=urgent', label: 'query string with plus tag and subdomain' },
      { raw: 'USER%40EXAMPLE.COM', label: 'uppercase percent-40' },
      { raw: 'user%2btag%40domain.co.in', label: 'lowercase %2b tag' },
      { raw: 'subscriber%2Bpromo2026%40bhairavicreations.test', label: 'promo campaign email' }
    ];

    it('4.1 should redact URL-encoded emails in unit sanitizer', () => {
      for (const { raw, label } of encodedEmails) {
        const sanitized = sanitizeZeroPII(raw);
        expect(sanitized, `Failed for ${label} ("${raw}")`).toContain('[REDACTED_EMAIL]');
        expect(sanitized).not.toContain('%40');
        expect(sanitized).not.toContain('@');
        expect(sanitized).not.toContain('example.com');
        expect(sanitized).not.toContain('domain.co.in');
      }
    });

    it('4.2 should sanitize URL-encoded emails in page_path and metadata via HTTP ingestion', async () => {
      for (const { raw, label } of encodedEmails) {
        const evt = makeEvent({
          page_path: `/catalog${raw.startsWith('?') ? raw : '?' + raw}`,
          metadata: {
            query_param: raw,
            deep_nesting: {
              account: {
                encoded_contact: raw
              }
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

        expect(row.page_path, `URL-encoded email leaked in page_path for ${label}`).not.toContain('%40');
        expect(row.page_path, `Decoded email leaked in page_path for ${label}`).not.toContain('@');
        expect(row.page_path).toContain('[REDACTED_EMAIL]');

        expect(row.metadata, `URL-encoded email leaked in metadata for ${label}`).not.toContain('%40');
        expect(row.metadata, `Decoded email leaked in metadata for ${label}`).not.toContain('@');
        expect(row.metadata).toContain('[REDACTED_EMAIL]');
      }
    });
  });

  // ==========================================================================
  // VECTOR 5: UTM campaign parameters containing emails/phones
  // ==========================================================================
  describe('Vector 5: UTM campaign parameters containing emails/phones', () => {
    it('5.1 should sanitize flat UTM properties with emails and phones', async () => {
      const evt = makeEvent({
        utm_source: 'newsletter_artisan@studio.co.in',
        utm_medium: '+91 (98765) 43210',
        utm_campaign: '09876543210',
        utm_term: 'user%40example.com',
        utm_content: '98765.43210'
      });

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt)
      });

      expect(res.status).toBe(202);
      const row = db.prepare(`
        SELECT utm_source, utm_medium, utm_campaign, utm_term, utm_content
        FROM analytics_events WHERE event_id = ?
      `).get(evt.event_id) as any;

      expect(row.utm_source).toBe('newsletter_[REDACTED_EMAIL]');
      expect(row.utm_medium).toBe('[REDACTED_PHONE]');
      expect(row.utm_campaign).toBe('[REDACTED_PHONE]');
      expect(row.utm_term).toBe('[REDACTED_EMAIL]');
      expect(row.utm_content).toBe('[REDACTED_PHONE]');
    });

    it('5.2 should sanitize nested utm_parameters object with campaign_* aliases', async () => {
      const evt = makeEvent({
        utm_parameters: {
          campaign_source: 'partner_team@vendor.org',
          campaign_medium: '+91 98765.43210',
          campaign_name: 'promo_+91(0)98765 43210',
          campaign_term: 'contact_user%2Btag%40domain.co.in',
          campaign_content: 'call_09876543210'
        }
      });

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt)
      });

      expect(res.status).toBe(202);
      const row = db.prepare(`
        SELECT utm_source, utm_medium, utm_campaign, utm_term, utm_content
        FROM analytics_events WHERE event_id = ?
      `).get(evt.event_id) as any;

      expect(row.utm_source).toBe('partner_[REDACTED_EMAIL]');
      expect(row.utm_medium).toBe('[REDACTED_PHONE]');
      expect(row.utm_campaign).toBe('promo_[REDACTED_PHONE]');
      expect(row.utm_term).toBe('contact_[REDACTED_EMAIL]');
      expect(row.utm_content).toBe('call_[REDACTED_PHONE]');
    });

    it('5.3 should preserve legitimate clean marketing UTM parameters intact', async () => {
      const evt = makeEvent({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'diwali_brass_statues_2026',
        utm_term: 'handcrafted ganesha 3d print',
        utm_content: 'hero_banner_v2'
      });

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt)
      });

      expect(res.status).toBe(202);
      const row = db.prepare(`
        SELECT utm_source, utm_medium, utm_campaign, utm_term, utm_content
        FROM analytics_events WHERE event_id = ?
      `).get(evt.event_id) as any;

      expect(row.utm_source).toBe('google');
      expect(row.utm_medium).toBe('cpc');
      expect(row.utm_campaign).toBe('diwali_brass_statues_2026');
      expect(row.utm_term).toBe('handcrafted ganesha 3d print');
      expect(row.utm_content).toBe('hero_banner_v2');
    });
  });

  // ==========================================================================
  // VECTOR 6: Zero regressions verification
  // ==========================================================================
  describe('Vector 6: Zero regressions verification', () => {
    it('6.1 Privileged purchase shield: client rejected with HTTP 403 and 0 DB write', async () => {
      const countBefore = getEventsCount();
      const evt = makeEvent({ event_type: 'purchase' });

      const res = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt)
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('PrivilegedEventError');
      expect(getEventsCount()).toBe(countBefore);
    });

    it('6.2 Privileged purchase shield: viewer role rejected with HTTP 403 and 0 DB write', async () => {
      const viewerCookie = await loginAs(viewerUser);
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
      expect(getEventsCount()).toBe(countBefore);
    });

    it('6.3 Privileged purchase shield: admin allowed to emit verified_purchase', async () => {
      const adminCookie = await loginAs(adminUser);
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
      const row = db.prepare('SELECT event_type, outcome_status FROM analytics_events WHERE event_id = ?').get(evt.event_id) as any;
      expect(row.event_type).toBe('purchase');
      expect(row.outcome_status).toBe('verified_purchase');
    });

    it('6.4 Clock-skew: drift > 24h rejected with HTTP 422 and 0 DB write', async () => {
      const countBefore = getEventsCount();
      const futureEvt = makeEvent({
        timestamp_utc: new Date(Date.now() + 90000000).toISOString() // +25h
      });

      const res1 = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(futureEvt)
      });

      expect(res1.status).toBe(422);

      const pastEvt = makeEvent({
        timestamp_utc: new Date(Date.now() - 90000000).toISOString() // -25h
      });

      const res2 = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pastEvt)
      });

      expect(res2.status).toBe(422);
      expect(getEventsCount()).toBe(countBefore);
    });

    it('6.5 Clock-skew: drift > 300s sets clock_skew_flag = 1, <= 300s sets clock_skew_flag = 0', async () => {
      // Drift = +350s (> 300s)
      const skewEvt = makeEvent({
        timestamp_utc: new Date(Date.now() + 350000).toISOString()
      });

      const res1 = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skewEvt)
      });

      expect(res1.status).toBe(202);
      const row1 = db.prepare('SELECT clock_skew_flag FROM analytics_events WHERE event_id = ?').get(skewEvt.event_id) as any;
      expect(row1.clock_skew_flag).toBe(1);

      // Drift = +10s (<= 300s)
      const normalEvt = makeEvent({
        timestamp_utc: new Date(Date.now() + 10000).toISOString()
      });

      const res2 = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalEvt)
      });

      expect(res2.status).toBe(202);
      const row2 = db.prepare('SELECT clock_skew_flag FROM analytics_events WHERE event_id = ?').get(normalEvt.event_id) as any;
      expect(row2.clock_skew_flag).toBe(0);
    });

    it('6.6 DPDP consent opt-out: HTTP 204 and strict 0 DB writes on denied and DNT: 1', async () => {
      const countBefore = getEventsCount();

      // consent_status = 'denied'
      const deniedEvt = makeEvent({ consent_status: 'denied' });
      const res1 = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deniedEvt)
      });
      expect(res1.status).toBe(204);
      expect(getEventsCount()).toBe(countBefore);

      // DNT: 1
      const dntEvt = makeEvent({ consent_status: 'granted' });
      const res2 = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'DNT': '1' },
        body: JSON.stringify(dntEvt)
      });
      expect(res2.status).toBe(204);
      expect(getEventsCount()).toBe(countBefore);
    });

    it('6.7 Attribution integrity: outbound clicks strictly enforced as purchase_outcome_unknown', async () => {
      const amazonEvt = makeEvent({
        event_type: 'amazon_outbound_click',
        outcome_status: 'verified_purchase' // client spoof attempt
      });

      const res1 = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(amazonEvt)
      });

      expect(res1.status).toBe(202);
      const row1 = db.prepare('SELECT outcome_status FROM analytics_events WHERE event_id = ?').get(amazonEvt.event_id) as any;
      expect(row1.outcome_status).toBe('purchase_outcome_unknown');

      const whatsappEvt = makeEvent({
        event_type: 'whatsapp_outbound_click',
        outcome_status: 'verified_purchase' // client spoof attempt
      });

      const res2 = await fetch(`${baseUrl}/api/v1/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatsappEvt)
      });

      expect(res2.status).toBe(202);
      const row2 = db.prepare('SELECT outcome_status FROM analytics_events WHERE event_id = ?').get(whatsappEvt.event_id) as any;
      expect(row2.outcome_status).toBe('purchase_outcome_unknown');
    });
  });

  // ==========================================================================
  // VECTOR 7: Non-PII Safety Invariant (Over-sanitization defense)
  // ==========================================================================
  describe('Vector 7: Non-PII Safety Invariant (No accidental corruption)', () => {
    const nonPiiValues = [
      { val: 'prod_00000000-0000-4000-8000-000000000001', label: 'Product UUID' },
      { val: '88cb2e24-90b8-4bbe-9dc2-45dfb7816f07', label: 'Session / Event UUID' },
      { val: '2026-10-31T12:00:00.000Z', label: 'ISO 8601 UTC timestamp' },
      { val: '149900', label: 'Paise integer string' },
      { val: '₹1,499.00', label: 'Formatted INR currency string' },
      { val: '/products/ganesha-antique-bronze-hand-painted', label: 'Catalog slug URL' },
      { val: 'custom_figurine_3d_print_v2', label: 'Project type token' },
      { val: 'layer_height_0.12mm_infill_20_percent', label: '3D print specification note' }
    ];

    it('7.1 should never corrupt platform UUIDs, timestamps, prices, or catalog slugs', () => {
      for (const { val, label } of nonPiiValues) {
        const sanitized = sanitizeZeroPII(val);
        expect(sanitized, `Accidentally over-sanitized ${label}: "${val}"`).toBe(val);
      }
    });
  });
});
