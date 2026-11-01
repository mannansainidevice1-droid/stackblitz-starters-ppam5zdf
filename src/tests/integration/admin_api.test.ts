/**
 * BHAIRAVI Creations Digital Platform
 * Integration Test Suite: Admin APIs, Security Pipeline, RBAC & Lifecycle
 * Target: src/tests/integration/admin_api.test.ts
 *
 * Covers Milestone 2 Features F6–F15:
 * - F6: Server-Side Session Auth (HttpOnly, SameSite=Strict, Secure cookies, SHA-256 tokens)
 * - F7: 3-Tier RBAC Access Control Matrix (superadmin, admin, viewer)
 * - F8: Brute-Force & Lockout Guard (5 failed attempts -> 15 min lock, session purge, audit log)
 * - F9: Admin Overview KPI API (UTC query windows, explicit conversion rates, disclaimer)
 * - F10: Product Management CRUD API (integer INR paise, publication state machine)
 * - F11: Enquiry Lifecycle Management (new -> contacted -> quoted -> converted -> closed)
 * - F12: Enquiry Timeline Audit Trail (internal notes up to 10k chars, staff attribution)
 * - F13: Multi-Stage Upload Security Pipeline (magic bytes, reject SVG/HTML, UUID isolation, nosniff)
 * - F14: Honeypot & Anti-Spam Filter (bhr_check_field bot trap, <2.5s render duration gate)
 * - F15: Zero Hardcoded Secrets & Configuration Template (.env.example)
 * - F25: High-Interest / Low-Outcome Diagnostics (views >= 1.5x median, rate <= 0.5x baseline)
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
import { hashSessionToken } from '../../server/auth/tokens.js';
import { authRateLimiter, enquiryRateLimiter } from '../../server/middleware/rate_limiter.js';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data/test_admin_api.db');

describe('Admin API, Security & Backend Lifecycle Integration (Milestone 2)', () => {
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
    password: 'ViewerPass2026!',
    passwordHash: crypto.createHash('sha256').update('ViewerPass2026!').digest('hex'),
    role: 'viewer'
  };

  beforeAll(async () => {
    // 1. Initialize isolated test database
    const dbDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);

    db = createDbConnection(TEST_DB_PATH);
    runMigrations(db);

    // Seed test users
    for (const u of [superadminUser, adminUser, viewerUser]) {
      db.prepare(`
        INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, role, is_active, failed_login_attempts)
        VALUES (?, ?, ?, ?, ?, 1, 0)
      `).run(u.id, u.username, u.email, u.passwordHash, u.role);
    }

    // 2. Start live HTTP server on ephemeral port
    const app = createApp(db);
    server = http.createServer(app);

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    if (db && db.open) db.close();

    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);
  });

  beforeEach(() => {
    // Reset in-memory rate limiters between tests
    authRateLimiter.reset();
    enquiryRateLimiter.reset();
  });

  // Helper to log in and get cookie header
  async function loginAs(user: { username: string; password: string }): Promise<{ cookie: string; rawToken: string; user: any }> {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, password: user.password })
    });
    const setCookie = res.headers.get('set-cookie');
    const json = await res.json();
    return {
      cookie: setCookie || '',
      rawToken: json.token,
      user: json.user
    };
  }

  // ==========================================================================
  // Suite 1: Authentication & Session Management (Feature F6)
  // ==========================================================================
  describe('1. Server-Side Session Auth (Feature F6)', () => {
    it('1.1 should issue HttpOnly, SameSite=Strict, Secure cookie on successful login', async () => {
      const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: superadminUser.username,
          password: superadminUser.password
        })
      });

      expect(res.status).toBe(200);
      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain('bhr_session=');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Strict');
      expect(setCookie).toContain('Secure');
      expect(setCookie).toContain('Path=/');

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.token).toHaveLength(64); // 32 random bytes = 64 hex characters
      expect(json.user.role).toBe('superadmin');
    });

    it('1.2 should store ONLY SHA-256 hash in admin_sessions, never raw token or raw IP', async () => {
      const { rawToken } = await loginAs(superadminUser);
      const expectedHash = hashSessionToken(rawToken);

      const sessionInDb = db.prepare('SELECT * FROM admin_sessions WHERE id = ?').get(expectedHash) as any;
      expect(sessionInDb).toBeDefined();
      expect(sessionInDb.id).toBe(expectedHash);

      // Verify raw token is NOT in database
      const rawInDb = db.prepare('SELECT * FROM admin_sessions WHERE id = ?').get(rawToken);
      expect(rawInDb).toBeUndefined();

      // DPDP Verification: ip_hash must be a 64-character SHA-256 hex digest, never raw IP
      expect(sessionInDb.ip_hash).toMatch(/^[0-9a-f]{64}$/i);
      expect(sessionInDb.ip_hash).not.toContain('127.0.0.1');
    });

    it('1.3 should resolve session cookie to SessionUser via GET /api/admin/auth/me', async () => {
      const { cookie, user } = await loginAs(adminUser);

      const res = await fetch(`${baseUrl}/api/admin/auth/me`, {
        headers: { Cookie: cookie }
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.id).toBe(user.id);
      expect(json.user.role).toBe('admin');
    });

    it('1.4 should return HTTP 401 for empty or missing cookie on protected route', async () => {
      const res = await fetch(`${baseUrl}/api/admin/auth/me`);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain('Unauthorized');
    });

    it('1.5 should return HTTP 401 for forged or expired session token', async () => {
      const forgedToken = crypto.randomBytes(32).toString('hex');
      const res = await fetch(`${baseUrl}/api/admin/auth/me`, {
        headers: { Cookie: `bhr_session=${forgedToken}` }
      });
      expect(res.status).toBe(401);
    });

    it('1.6 should revoke session and clear cookie on logout', async () => {
      const { cookie, rawToken } = await loginAs(viewerUser);
      const tokenHash = hashSessionToken(rawToken);

      // Confirm session exists in DB
      expect(db.prepare('SELECT id FROM admin_sessions WHERE id = ?').get(tokenHash)).toBeDefined();

      const logoutRes = await fetch(`${baseUrl}/api/admin/auth/logout`, {
        method: 'POST',
        headers: { Cookie: cookie }
      });

      expect(logoutRes.status).toBe(200);
      const setCookie = logoutRes.headers.get('set-cookie');
      expect(setCookie).toContain('Max-Age=0');

      // Verify session deleted from DB
      expect(db.prepare('SELECT id FROM admin_sessions WHERE id = ?').get(tokenHash)).toBeUndefined();

      // Subsequent access returns 401
      const meRes = await fetch(`${baseUrl}/api/admin/auth/me`, {
        headers: { Cookie: cookie }
      });
      expect(meRes.status).toBe(401);
    });
  });

  // ==========================================================================
  // Suite 2: 3-Tier RBAC Access Control Matrix (Feature F7)
  // ==========================================================================
  describe('2. 3-Tier RBAC Model (Feature F7)', () => {
    it('2.1 superadmin should have full access to audit logs and user management', async () => {
      const { cookie } = await loginAs(superadminUser);

      const res = await fetch(`${baseUrl}/api/admin/audit-logs`, {
        headers: { Cookie: cookie }
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('2.2 admin should be forbidden (HTTP 403) from viewing audit logs', async () => {
      const { cookie } = await loginAs(adminUser);

      const res = await fetch(`${baseUrl}/api/admin/audit-logs`, {
        headers: { Cookie: cookie }
      });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Forbidden');
    });

    it('2.3 viewer should be permitted to read products and overview KPIs', async () => {
      const { cookie } = await loginAs(viewerUser);

      const prodRes = await fetch(`${baseUrl}/api/admin/products`, {
        headers: { Cookie: cookie }
      });
      expect(prodRes.status).toBe(200);

      const kpiRes = await fetch(`${baseUrl}/api/admin/overview/kpis`, {
        headers: { Cookie: cookie }
      });
      expect(kpiRes.status).toBe(200);
    });

    it('2.4 viewer should be strictly forbidden (HTTP 403) from any mutation (POST/PUT/PATCH/DELETE)', async () => {
      const { cookie } = await loginAs(viewerUser);

      // Attempt POST product
      const postRes = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized Viewer Product', base_price_paise: 100000 })
      });
      expect(postRes.status).toBe(403);

      // Attempt PUT product
      const putRes = await fetch(`${baseUrl}/api/admin/products/some_id`, {
        method: 'PUT',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Changed Name' })
      });
      expect(putRes.status).toBe(403);

      // Attempt DELETE product
      const delRes = await fetch(`${baseUrl}/api/admin/products/some_id`, {
        method: 'DELETE',
        headers: { Cookie: cookie }
      });
      expect(delRes.status).toBe(403);
    });
  });

  // ==========================================================================
  // Suite 3: Brute-Force & Account Lockout Guard (Feature F8)
  // ==========================================================================
  describe('3. Brute-Force & Lockout Guard (Feature F8)', () => {
    const victimUser = {
      id: 'usr_test_victim_lockout',
      username: 'lockout_test_user',
      email: 'victim@bhairavicreations.test',
      password: 'CorrectPass2026!',
      passwordHash: crypto.createHash('sha256').update('CorrectPass2026!').digest('hex'),
      role: 'admin'
    };

    beforeAll(() => {
      db.prepare(`
        INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, role, is_active, failed_login_attempts, locked_until)
        VALUES (?, ?, ?, ?, ?, 1, 0, NULL)
      `).run(victimUser.id, victimUser.username, victimUser.email, victimUser.passwordHash, victimUser.role);
    });

    it('3.1 first 4 failed attempts should increment counter without locking account', async () => {
      for (let i = 1; i <= 4; i++) {
        authRateLimiter.reset(); // clear IP throttle to test user lockout independently
        const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: victimUser.username, password: 'WrongPassword!' })
        });
        expect(res.status).toBe(401);

        const row = db.prepare('SELECT failed_login_attempts, locked_until FROM admin_users WHERE id = ?').get(victimUser.id) as any;
        expect(row.failed_login_attempts).toBe(i);
        expect(row.locked_until).toBeNull();
      }
    });

    it('3.2 5th failed attempt should lock account for 15 minutes (HTTP 423) and record audit log', async () => {
      authRateLimiter.reset();

      // Seed an active session for victim to verify session termination upon lockout
      const fakeToken = crypto.randomBytes(32).toString('hex');
      const fakeHash = hashSessionToken(fakeToken);
      db.prepare(`
        INSERT INTO admin_sessions (id, admin_user_id, expires_at)
        VALUES (?, ?, datetime('now', '+8 hours'))
      `).run(fakeHash, victimUser.id);

      const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: victimUser.username, password: 'WrongPassword!' })
      });

      expect(res.status).toBe(423);
      const json = await res.json();
      expect(json.error).toContain('Locked for 15 minutes');

      // Verify user DB state
      const row = db.prepare('SELECT failed_login_attempts, locked_until FROM admin_users WHERE id = ?').get(victimUser.id) as any;
      expect(row.failed_login_attempts).toBe(5);
      expect(row.locked_until).toBeTruthy();
      expect(new Date(row.locked_until).getTime()).toBeGreaterThan(Date.now());

      // Verify active sessions for victim are purged
      const sessions = db.prepare('SELECT * FROM admin_sessions WHERE admin_user_id = ?').all(victimUser.id);
      expect(sessions).toHaveLength(0);

      // Verify security audit log was written
      const auditLog = db.prepare("SELECT * FROM audit_logs WHERE target_id = ? AND action = 'admin.account_lockout'").get(victimUser.id) as any;
      expect(auditLog).toBeDefined();
      // DPDP Verification: ip_hash in audit_logs must be a 64-character SHA-256 hex digest
      expect(auditLog.ip_hash).toMatch(/^[0-9a-f]{64}$/i);
      expect(auditLog.ip_hash).not.toContain('127.0.0.1');
    });

    it('3.3 locked account should reject even correct password while locked (HTTP 423)', async () => {
      authRateLimiter.reset();

      const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: victimUser.username, password: victimUser.password })
      });

      expect(res.status).toBe(423);
      const json = await res.json();
      expect(json.error).toContain('Locked for 15 minutes');
    });

    it('3.4 after lockout expires, successful login resets counters', async () => {
      authRateLimiter.reset();

      // Fast-forward lockout in DB to past
      db.prepare(`
        UPDATE admin_users 
        SET locked_until = datetime('now', '-1 minute')
        WHERE id = ?
      `).run(victimUser.id);

      const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: victimUser.username, password: victimUser.password })
      });

      expect(res.status).toBe(200);
      const row = db.prepare('SELECT failed_login_attempts, locked_until FROM admin_users WHERE id = ?').get(victimUser.id) as any;
      expect(row.failed_login_attempts).toBe(0);
      expect(row.locked_until).toBeNull();
    });
  });

  // ==========================================================================
  // Suite 4: Product Catalog CRUD & Availability (Feature F10 & F9)
  // ==========================================================================
  describe('4. Product Management CRUD & Availability (Features F10 & F9)', () => {
    let createdProductId: string;
    let createdProductSlug: string;

    it('4.1 should create a new product with integer INR paise and draft status', async () => {
      const { cookie } = await loginAs(adminUser);

      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Handcrafted Brass Ganesha Idol',
          slug: 'handcrafted-brass-ganesha-idol',
          description: 'Finely detailed artisanal idol.',
          category_id: 'cat_spiritual_deities',
          base_price_paise: 249900, // ₹2,499.00
          currency: 'INR',
          is_made_to_order: 1,
          inventory_count: 5,
          production_lead_days: '3-5 business days',
          material: 'High-Density PLA+ with Brass finish',
          dimensions_cm: { length: 12.0, width: 8.5, height: 16.0 },
          weight_grams: 420,
          manufacturing_method: '0.12mm FDM 3D Layering',
          finishing_type: 'Triple wet sanded, brass wash, matte lacquer',
          publication_status: 'draft',
          variants: [
            {
              sku: 'BHR-GNS-BRS-6IN',
              variant_name: '6-inch Standard',
              price_modifier_paise: 0,
              is_available: 1
            },
            {
              sku: 'BHR-GNS-BRS-8IN',
              variant_name: '8-inch Large',
              price_modifier_paise: 50000, // +₹500.00
              is_available: 1
            }
          ]
        })
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBeTruthy();
      expect(json.data.publication_status).toBe('draft');

      createdProductId = json.data.id;
      createdProductSlug = json.data.slug;

      // Verify DB persistence & integer paise
      const dbRow = db.prepare('SELECT * FROM products WHERE id = ?').get(createdProductId) as any;
      expect(dbRow.base_price_paise).toBe(249900);
      expect(Number.isInteger(dbRow.base_price_paise)).toBe(true);

      // Verify audit log
      const audit = db.prepare("SELECT * FROM audit_logs WHERE target_id = ? AND action = 'product.create'").get(createdProductId);
      expect(audit).toBeDefined();
    });

    it('4.2 draft product should NOT appear in public catalog (GET /api/products)', async () => {
      const res = await fetch(`${baseUrl}/api/products`);
      expect(res.status).toBe(200);
      const json = await res.json();
      const found = json.data.find((p: any) => p.id === createdProductId);
      expect(found).toBeUndefined();

      // Public PDP returns 404 for draft
      const pdpRes = await fetch(`${baseUrl}/api/products/${createdProductSlug}`);
      expect(pdpRes.status).toBe(404);
    });

    it('4.3 admin can publish product (PATCH /status)', async () => {
      const { cookie } = await loginAs(adminUser);

      const res = await fetch(`${baseUrl}/api/admin/products/${createdProductId}/status`, {
        method: 'PATCH',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' })
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.previous_status).toBe('draft');
      expect(json.new_status).toBe('published');

      // Now visible in public catalog
      const pubRes = await fetch(`${baseUrl}/api/products`);
      const pubJson = await pubRes.json();
      const found = pubJson.data.find((p: any) => p.id === createdProductId);
      expect(found).toBeDefined();
      expect(found.formatted_price).toBe('₹2,499');

      // Visible in public PDP
      const pdpRes = await fetch(`${baseUrl}/api/products/${createdProductSlug}`);
      expect(pdpRes.status).toBe(200);
      const pdpJson = await pdpRes.json();
      expect(pdpJson.data.name).toBe('Handcrafted Brass Ganesha Idol');
      expect(pdpJson.data.variants).toHaveLength(2);
    });

    it('4.4 admin can archive product and it disappears from public catalog', async () => {
      const { cookie } = await loginAs(adminUser);

      const res = await fetch(`${baseUrl}/api/admin/products/${createdProductId}/status`, {
        method: 'PATCH',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' })
      });
      expect(res.status).toBe(200);

      // Not visible in public catalog
      const pubRes = await fetch(`${baseUrl}/api/products`);
      const pubJson = await pubRes.json();
      const found = pubJson.data.find((p: any) => p.id === createdProductId);
      expect(found).toBeUndefined();

      // PDP returns 404
      const pdpRes = await fetch(`${baseUrl}/api/products/${createdProductSlug}`);
      expect(pdpRes.status).toBe(404);
    });

    it('4.5 should reject invalid pricing (negative paise)', async () => {
      const { cookie } = await loginAs(adminUser);

      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Negative Price Item',
          category_id: 'cat_spiritual_deities',
          base_price_paise: -1500
        })
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('non-negative integer');
    });
  });

  // ==========================================================================
  // Suite 5: Multi-Stage Upload Security Pipeline (Feature F13 & F10)
  // ==========================================================================
  describe('5. Upload Security Pipeline (Features F13 & F10)', () => {
    let testProductId: string;

    beforeAll(async () => {
      const { cookie } = await loginAs(adminUser);
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Upload Test Idol',
          category_id: 'cat_spiritual_deities',
          base_price_paise: 99900
        })
      });
      const json = await res.json();
      testProductId = json.data.id;
    });

    it('5.1 should accept authentic JPEG binary with magic bytes FF D8 FF', async () => {
      const { cookie } = await loginAs(adminUser);

      // Valid JPEG header
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01]);

      const res = await fetch(`${baseUrl}/api/admin/products/${testProductId}/images`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: jpegBuffer.toString('base64'),
          alt_text: 'Front view of Ganesha idol',
          is_primary: 1
        })
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.public_url).toMatch(/^\/uploads\/products\/[0-9a-f-]+\.jpg$/i);

      // Verify static serving delivers with nosniff and CSP headers
      const serveRes = await fetch(`${baseUrl}${json.data.public_url}`);
      expect(serveRes.status).toBe(200);
      expect(serveRes.headers.get('content-type')).toBe('image/jpeg');
      expect(serveRes.headers.get('x-content-type-options')).toBe('nosniff');
      expect(serveRes.headers.get('content-security-policy')).toContain('sandbox');
    });

    it('5.2 should accept authentic PNG binary with magic bytes 89 50 4E 47', async () => {
      const { cookie } = await loginAs(adminUser);

      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);

      const res = await fetch(`${baseUrl}/api/admin/products/${testProductId}/images`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: pngBuffer.toString('base64'),
          alt_text: 'Close up shot'
        })
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.public_url).toMatch(/^\/uploads\/products\/[0-9a-f-]+\.png$/i);
    });

    it('5.3 should strictly reject SVG file disguised as image (HTTP 422)', async () => {
      const { cookie } = await loginAs(adminUser);

      // SVG with XSS payload
      const svgPayload = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

      const res = await fetch(`${baseUrl}/api/admin/products/${testProductId}/images`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: svgPayload.toString('base64'),
          alt_text: 'Malicious SVG payload'
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toContain('SVG');
    });

    it('5.4 should reject files exceeding 5MB max size (HTTP 413)', async () => {
      const { cookie } = await loginAs(adminUser);

      // Create a large 6MB dummy buffer
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 0xff);

      const res = await fetch(`${baseUrl}/api/admin/products/${testProductId}/images`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: largeBuffer.toString('base64'),
          alt_text: 'Oversized file'
        })
      });

      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toContain('5MB');
    });
  });

  // ==========================================================================
  // Suite 6: Custom Order Enquiry, Timeline & Anti-Spam (Features F11, F12, F14)
  // ==========================================================================
  describe('6. Custom Order Enquiry & Anti-Spam (Features F11, F12, F14)', () => {
    let createdEnquiryId: string;

    it('6.1 should accept valid human submission and return WhatsApp bridge URL', async () => {
      const validRenderedAt = Date.now() - 5000; // 5 seconds ago (passes >= 2.5s gate)

      const res = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Priya Sharma',
          contact_phone: '+91 98230 12345',
          contact_email: 'priya.sharma@example.com',
          preferred_contact_method: 'whatsapp',
          project_type: 'custom_figurine',
          design_description: 'Custom family deity idol with metallic bronze wash finish.',
          approximate_quantity: 2,
          bhr_check_field: '', // Empty honeypot
          rendered_at: validRenderedAt
        })
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.enquiry_id).toBeTruthy();
      expect(json.whatsapp_url).toContain('https://wa.me/');
      expect(json.whatsapp_url).toContain('Priya%20Sharma');

      createdEnquiryId = json.enquiry_id;

      // Verify stored in DB with status 'new' and anonymized IP hash
      const row = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(createdEnquiryId) as any;
      expect(row).toBeDefined();
      expect(row.status).toBe('new');
      expect(row.ip_hash).toHaveLength(64); // SHA-256 hash
      expect(row.customer_name).toBe('Priya Sharma');

      // Verify initial timeline audit record
      const timeline = db.prepare('SELECT * FROM enquiry_timeline WHERE enquiry_id = ?').all(createdEnquiryId);
      expect(timeline.length).toBeGreaterThanOrEqual(1);
    });

    it('6.2 bot populating honeypot field bhr_check_field should be silently dropped (no DB write)', async () => {
      const validRenderedAt = Date.now() - 4000;

      const res = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Spam Bot Crawler',
          contact_phone: '1234567890',
          project_type: 'other',
          design_description: 'Buy cheap watches online now!',
          bhr_check_field: 'http://spam-site.ru', // Honeypot populated!
          rendered_at: validRenderedAt
        })
      });

      // Returns synthetic success
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Verify NOTHING was written to database
      const row = db.prepare("SELECT * FROM enquiries WHERE customer_name = 'Spam Bot Crawler'").get();
      expect(row).toBeUndefined();
    });

    it('6.3 submissions faster than 2.5s should be rejected (HTTP 422)', async () => {
      const fastRenderedAt = Date.now() - 300; // 300ms ago (< 2500ms)

      const res = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Speedy Script',
          contact_phone: '+91 99999 88888',
          project_type: 'lithophane',
          design_description: 'Automated lightning fast submission test.',
          bhr_check_field: '',
          rendered_at: fastRenderedAt
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toContain('< 2.5s');
    });

    it('6.4 admin can progress enquiry status: new -> contacted -> quoted -> converted -> closed', async () => {
      const { cookie } = await loginAs(adminUser);

      // 1. new -> contacted
      let res = await fetch(`${baseUrl}/api/admin/enquiries/${createdEnquiryId}/status`, {
        method: 'PATCH',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'contacted', note: 'Outreached via WhatsApp.' })
      });
      expect(res.status).toBe(200);
      expect((await res.json()).new_status).toBe('contacted');

      // 2. contacted -> quoted
      res = await fetch(`${baseUrl}/api/admin/enquiries/${createdEnquiryId}/status`, {
        method: 'PATCH',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'quoted', note: 'Sent formal quote of ₹3,400.' })
      });
      expect(res.status).toBe(200);
      expect((await res.json()).new_status).toBe('quoted');

      // 3. quoted -> converted
      res = await fetch(`${baseUrl}/api/admin/enquiries/${createdEnquiryId}/status`, {
        method: 'PATCH',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'converted', note: 'Advance payment received.' })
      });
      expect(res.status).toBe(200);
      expect((await res.json()).new_status).toBe('converted');

      // 4. converted -> closed
      res = await fetch(`${baseUrl}/api/admin/enquiries/${createdEnquiryId}/status`, {
        method: 'PATCH',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed', note: 'Delivered and accepted.' })
      });
      expect(res.status).toBe(200);
      expect((await res.json()).new_status).toBe('closed');

      // 5. Attempt invalid transition from terminal 'closed' -> 'new' should fail (HTTP 422)
      res = await fetch(`${baseUrl}/api/admin/enquiries/${createdEnquiryId}/status`, {
        method: 'PATCH',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'new' })
      });
      expect(res.status).toBe(422);
      expect((await res.json()).error).toContain('Disallowed status transition');
    });

    it('6.5 admin can add internal craftsmanship notes up to 10,000 chars', async () => {
      const { cookie } = await loginAs(adminUser);

      const noteText = 'Artisan consultation: recommended 0.12mm layer deposition with cold-cast bronze infill.';
      const res = await fetch(`${baseUrl}/api/admin/enquiries/${createdEnquiryId}/notes`, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText })
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Verify in enquiry timeline
      const detailRes = await fetch(`${baseUrl}/api/admin/enquiries/${createdEnquiryId}`, {
        headers: { Cookie: cookie }
      });
      const detailJson = await detailRes.json();
      const addedNote = detailJson.data.timeline.find((t: any) => t.action_type === 'internal_note');
      expect(addedNote).toBeDefined();
      expect(addedNote.note).toBe(noteText);
      expect(addedNote.admin_username).toBe(adminUser.username);
    });
  });

  // ==========================================================================
  // Suite 7: Overview KPIs & Diagnostics API (Features F9 & F25)
  // ==========================================================================
  describe('7. Overview KPIs & Diagnostics API (Features F9 & F25)', () => {
    beforeAll(() => {
      // Seed some test analytics events for KPI calculations
      const nowUtc = new Date().toISOString();
      const insertEvent = db.prepare(`
        INSERT INTO analytics_events (
          event_id, event_type, timestamp_utc, received_at_utc, session_id,
          page_path, referrer_category, device_category, consent_status, outcome_status, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, 'direct', 'desktop', 'granted', 'purchase_outcome_unknown', '{}')
      `);

      for (let i = 0; i < 20; i++) {
        insertEvent.run(`evt_view_${i}`, 'product_view', nowUtc, nowUtc, `sess_${i % 5}`, '/products/ganesha');
      }
      for (let i = 0; i < 5; i++) {
        insertEvent.run(`evt_click_${i}`, 'product_click', nowUtc, nowUtc, `sess_${i}`, '/products');
      }
      for (let i = 0; i < 3; i++) {
        insertEvent.run(`evt_amz_${i}`, 'amazon_outbound_click', nowUtc, nowUtc, `sess_${i}`, '/products/ganesha');
      }
      for (let i = 0; i < 2; i++) {
        insertEvent.run(`evt_wa_${i}`, 'whatsapp_outbound_click', nowUtc, nowUtc, `sess_${i}`, '/products/ganesha');
      }
    });

    it('7.1 should return overview metrics with explicit conversion formulas and mandatory disclaimer', async () => {
      const { cookie } = await loginAs(viewerUser);

      const res = await fetch(`${baseUrl}/api/admin/overview/kpis`, {
        headers: { Cookie: cookie }
      });

      expect(res.status).toBe(200);
      const json = await res.json();

      // Traffic
      expect(json.traffic.total_product_views).toBeGreaterThan(0);
      expect(json.traffic.unique_visitors).toBeGreaterThan(0);

      // Mandatory Attribution Disclaimer
      expect(json.outbound_engagement.unverified_disclaimer).toBe(
        "Outbound Amazon and WhatsApp clicks represent high purchase intent; final checkout happens externally and is classified as 'Purchase Outcome Unknown'."
      );

      // Conversion rates structure
      expect(Array.isArray(json.conversion_rates)).toBe(true);
      for (const rate of json.conversion_rates) {
        expect(rate.metric).toBeTruthy();
        expect(typeof rate.rate_percentage).toBe('number');
        expect(typeof rate.numerator).toBe('number');
        expect(typeof rate.denominator).toBe('number');
        expect(rate.denominator_label).toBeTruthy();
        expect(rate.formula).toBeTruthy();
        // Safe against NaN or Infinity
        expect(Number.isFinite(rate.rate_percentage)).toBe(true);
      }
    });

    it('7.2 should handle zero denominators safely (returning 0.00%)', async () => {
      const { cookie } = await loginAs(viewerUser);

      // Far future query window with 0 events
      const res = await fetch(`${baseUrl}/api/admin/overview/kpis?start=2099-01-01T00:00:00.000Z&end=2099-01-31T23:59:59.999Z`, {
        headers: { Cookie: cookie }
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      for (const rate of json.conversion_rates) {
        expect(rate.rate_percentage).toBe(0.0);
        expect(rate.numerator).toBe(0);
        expect(rate.denominator).toBe(0);
      }
    });

    it('7.3 diagnostics API should return baseline stats and empty array when no products flagged', async () => {
      const { cookie } = await loginAs(viewerUser);

      const res = await fetch(`${baseUrl}/api/admin/overview/diagnostics`, {
        headers: { Cookie: cookie }
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.catalog_baselines).toBeDefined();
      expect(json.catalog_baselines.minimum_sample_threshold).toBe(30);
      expect(Array.isArray(json.flagged_products)).toBe(true);
    });
  });

  // ==========================================================================
  // Suite 8: Configuration & Secrets (.env.example) (Feature F15)
  // ==========================================================================
  describe('8. Configuration & Secrets (.env.example) (Feature F15)', () => {
    it('8.1 .env.example should exist and define all mandatory environment variables', () => {
      const envPath = path.resolve(process.cwd(), '.env.example');
      expect(fs.existsSync(envPath)).toBe(true);

      const content = fs.readFileSync(envPath, 'utf-8');
      const requiredVars = [
        'PORT',
        'HOST',
        'DATABASE_URL',
        'SQLITE_WAL_ENABLED',
        'SESSION_SECRET',
        'IP_HASH_SALT',
        'SUPERADMIN_DEFAULT_PASSWORD',
        'ADMIN_LOCKOUT_MAX_ATTEMPTS',
        'ADMIN_LOCKOUT_DURATION_MINUTES',
        'RATE_LIMIT_AUTH_PER_15_MINUTES',
        'RATE_LIMIT_ENQUIRY_MAX_PER_HOUR',
        'UPLOAD_MAX_FILE_SIZE_BYTES',
        'UPLOAD_STORAGE_PATH',
        'WHATSAPP_BUSINESS_NUMBER',
        'AMAZON_ASSOCIATE_TAG',
        'AI_ANALYST_TOKEN'
      ];

      for (const v of requiredVars) {
        expect(content).toContain(v);
      }
    });

    it('8.2 .env.example should contain zero hardcoded production secrets', () => {
      const envPath = path.resolve(process.cwd(), '.env.example');
      const content = fs.readFileSync(envPath, 'utf-8');

      // Ensure placeholder instructions are provided rather than actual live API keys
      expect(content).toContain('replace_with_');
    });
  });
});
