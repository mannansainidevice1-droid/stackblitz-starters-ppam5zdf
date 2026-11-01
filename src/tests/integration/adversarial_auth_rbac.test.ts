/**
 * BHAIRAVI Creations Digital Platform
 * Adversarial Test Suite: Authentication, RBAC Privilege Escalation & Lockout Fuzzing
 * Target: src/tests/integration/adversarial_auth_rbac.test.ts
 *
 * Challenger 1 (Milestone 2):
 * 1. Cookie forgery & session tampering attacks (malformed tokens, SQL injection payloads, truncated tokens)
 * 2. Brute-force & lockout stress (4 attempts ok, 5th locks 15m with HTTP 423, active sessions purged)
 * 3. RBAC privilege escalation fuzzing (viewer attempting mutations & audit logs -> HTTP 403)
 * 4. Timing attack oracle & constant-time cryptographic validation
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
import { hashSessionToken, generateRawSessionToken } from '../../server/auth/tokens.js';
import { timingSafeEqualString, verifyPassword, hashSha256, hashPassword } from '../../server/auth/password.js';
import { hasPermission } from '../../server/auth/rbac.js';
import { authRateLimiter } from '../../server/middleware/rate_limiter.js';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data/test_adversarial_auth_rbac.db');

describe('Adversarial Verification: Auth, RBAC & Lockout Fuzzing (Milestone 2)', () => {
  let db: Database.Database;
  let server: http.Server;
  let baseUrl: string;

  // Test accounts
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
    password: 'ViewerPass2026!',
    passwordHash: crypto.createHash('sha256').update('ViewerPass2026!').digest('hex'),
    role: 'viewer'
  };

  let viewerCookie: string;
  let sampleEnquiryId: string;

  // Helper HTTP request function
  async function makeRequest(
    method: string,
    urlPath: string,
    options: {
      headers?: Record<string, string>;
      body?: any;
    } = {}
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
    return new Promise((resolve, reject) => {
      const url = new URL(urlPath, baseUrl);
      const reqHeaders: Record<string, string> = { ...(options.headers || {}) };

      let payload: string | undefined;
      if (options.body) {
        payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        if (!reqHeaders['content-type']) {
          reqHeaders['content-type'] = 'application/json';
        }
        reqHeaders['content-length'] = Buffer.byteLength(payload).toString();
      }

      const req = http.request(
        url,
        {
          method,
          headers: reqHeaders
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const rawBody = Buffer.concat(chunks).toString('utf-8');
            let parsedBody: any = rawBody;
            try {
              parsedBody = JSON.parse(rawBody);
            } catch {
              parsedBody = rawBody;
            }
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: parsedBody
            });
          });
        }
      );

      req.on('error', reject);
      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  // Helper to obtain a valid session cookie for a given user
  async function loginAndGetCookie(user: { username: string; password: string }, clientIp: string = '127.0.0.1'): Promise<string> {
    authRateLimiter.reset();
    const res = await makeRequest('POST', '/api/admin/auth/login', {
      headers: { 'x-forwarded-for': clientIp },
      body: { username: user.username, password: user.password }
    });
    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : (setCookie as unknown as string);
    const match = cookieHeader.match(/bhr_session=([^;]+)/);
    expect(match).toBeTruthy();
    return `bhr_session=${match![1]}`;
  }

  beforeAll(async () => {
    // 1. Initialize isolated database
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
        INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, role, is_active, failed_login_attempts, locked_until)
        VALUES (?, ?, ?, ?, ?, 1, 0, NULL)
      `).run(u.id, u.username, u.email, u.passwordHash, u.role);
    }

    // 2. Start HTTP server on dynamic port
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
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (db && db.open) {
      db.close();
    }
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);
  });

  beforeEach(() => {
    authRateLimiter.reset();
  });

  // ==========================================================================
  // SECTION 1: COOKIE FORGERY & SESSION TAMPERING ATTACKS
  // ==========================================================================
  describe('1. Cookie Forgery, Session Tampering & Injection Attacks', () => {
    it('rejects forged 64-hex session token with HTTP 401', async () => {
      const forgedToken = crypto.randomBytes(32).toString('hex');
      const res = await makeRequest('GET', '/api/admin/products', {
        headers: { Cookie: `bhr_session=${forgedToken}` }
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('rejects truncated, partial, and malformed tokens with HTTP 401', async () => {
      const malformedCases = [
        '',
        '   ',
        'a',
        '12345678',
        'deadbeefcafebabe',
        '00000000000000000000000000000000', // 32 hex chars instead of 64
        'invalid_chars_!@#$%^&*()_+',
        'bhr_session=',
        'undefined',
        'null'
      ];

      for (const token of malformedCases) {
        const res = await makeRequest('GET', '/api/admin/overview/kpis', {
          headers: { Cookie: `bhr_session=${token}` }
        });
        expect(res.status).toBe(401);
      }
    });

    it('neutralizes SQL injection payloads in Cookie header without SQLi or crash', async () => {
      const sqlInjectionPayloads = [
        "' OR 1=1 --",
        "admin' --",
        "' UNION SELECT 1, 'admin', 'pass', 'superadmin', 1, NULL --",
        "'; DROP TABLE admin_sessions; --",
        "' OR 'x'='x",
        "\" OR \"\"=\"",
        "1; ATTACH DATABASE '/tmp/pwn.db' AS pwn; --",
        "test' OR EXISTS(SELECT * FROM admin_users) --"
      ];

      for (const sqli of sqlInjectionPayloads) {
        const res = await makeRequest('GET', '/api/admin/products', {
          headers: { Cookie: `bhr_session=${sqli}` }
        });
        expect(res.status).toBe(401);
      }

      // Verify database table integrity remains intact
      const count = db.prepare('SELECT count(*) as cnt FROM admin_users').get() as any;
      expect(count.cnt).toBeGreaterThanOrEqual(3);
      const sessionCount = db.prepare('SELECT count(*) as cnt FROM admin_sessions').get() as any;
      expect(sessionCount).toBeDefined();
    });

    it('rejects oversized cookie payloads (10KB) without crashing', async () => {
      const largePayload = 'A'.repeat(10240);
      const res = await makeRequest('GET', '/api/admin/overview/kpis', {
        headers: { Cookie: `bhr_session=${largePayload}` }
      });
      expect(res.status).toBe(401);
    });

    it('rejects control characters, newlines (CRLF), and unicode injection in Cookie', async () => {
      const specialPayloads = [
        'token\r\nSet-Cookie: evil_cookie=pwned',
        'token%0d%0aSet-Cookie: evil=1',
        '🔥🚨💀🎉_unicode_token_test',
        'bhr_session=\x00\x01\x02\x03'
      ];

      for (const payload of specialPayloads) {
        try {
          const res = await makeRequest('GET', '/api/admin/products', {
            headers: { Cookie: `bhr_session=${payload}` }
          });
          expect(res.status).toBe(401);
        } catch (err: any) {
          expect(err.message).toMatch(/Invalid character in header content/);
        }
      }
    });

    it('invalidates and purges expired sessions automatically from database', async () => {
      // Manually insert an expired session
      const rawToken = generateRawSessionToken();
      const tokenHash = hashSessionToken(rawToken);
      const expiredDate = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour ago

      db.prepare(`
        INSERT INTO admin_sessions (id, admin_user_id, user_agent, ip_hash, expires_at)
        VALUES (?, ?, 'AdversarialTest', ?, ?)
      `).run(tokenHash, adminUser.id, hashSha256('127.0.0.1'), expiredDate);

      // Verify row exists prior to request
      const beforeRow = db.prepare('SELECT * FROM admin_sessions WHERE id = ?').get(tokenHash);
      expect(beforeRow).toBeDefined();

      // Attempt to access with expired token
      const res = await makeRequest('GET', '/api/admin/products', {
        headers: { Cookie: `bhr_session=${rawToken}` }
      });
      expect(res.status).toBe(401);

      // Verify row was purged from database
      const afterRow = db.prepare('SELECT * FROM admin_sessions WHERE id = ?').get(tokenHash);
      expect(afterRow).toBeUndefined();
    });

    it('invalidates sessions for deactivated users (is_active = 0) and purges session', async () => {
      // 1. Login viewer
      const cookie = await loginAndGetCookie(viewerUser);
      const rawToken = cookie.replace('bhr_session=', '');
      const tokenHash = hashSessionToken(rawToken);

      // Verify session works initially
      const res1 = await makeRequest('GET', '/api/admin/products', {
        headers: { Cookie: cookie }
      });
      expect(res1.status).toBe(200);

      // 2. Deactivate user in database
      db.prepare('UPDATE admin_users SET is_active = 0 WHERE id = ?').run(viewerUser.id);

      // 3. Attempt access with deactivated user
      const res2 = await makeRequest('GET', '/api/admin/products', {
        headers: { Cookie: cookie }
      });
      expect(res2.status).toBe(401);

      // Verify session was purged
      const sessionRow = db.prepare('SELECT * FROM admin_sessions WHERE id = ?').get(tokenHash);
      expect(sessionRow).toBeUndefined();

      // Restore user active state
      db.prepare('UPDATE admin_users SET is_active = 1 WHERE id = ?').run(viewerUser.id);
    });
  });

  // ==========================================================================
  // SECTION 2: BRUTE-FORCE & LOCKOUT STRESS HARNESS
  // ==========================================================================
  describe('2. Brute-Force & Lockout Stress Harness', () => {
    const victimUser = {
      id: 'usr_adv_victim_lockout',
      username: 'adv_victim',
      email: 'adv_victim@bhairavicreations.test',
      password: 'VictimSecretPass2026!',
      passwordHash: crypto.createHash('sha256').update('VictimSecretPass2026!').digest('hex'),
      role: 'admin'
    };

    beforeAll(() => {
      db.prepare(`
        INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, role, is_active, failed_login_attempts, locked_until)
        VALUES (?, ?, ?, ?, ?, 1, 0, NULL)
      `).run(victimUser.id, victimUser.username, victimUser.email, victimUser.passwordHash, victimUser.role);
    });

    it('permits attempts 1-4 with HTTP 401, then enforces HTTP 423 Locked on 5th attempt', async () => {
      // Reset victim state
      db.prepare('UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?').run(victimUser.id);

      // Attempts 1 to 4: Each should return 401 and increment counter
      for (let i = 1; i <= 4; i++) {
        authRateLimiter.reset(); // bypass IP limiter to test account-level lockout specifically
        const res = await makeRequest('POST', '/api/admin/auth/login', {
          body: { username: victimUser.username, password: 'WrongPasswordAttempt!' }
        });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid username or password');

        const dbUser = db.prepare('SELECT failed_login_attempts, locked_until FROM admin_users WHERE id = ?').get(victimUser.id) as any;
        expect(dbUser.failed_login_attempts).toBe(i);
        expect(dbUser.locked_until).toBeNull();
      }

      // 5th attempt: triggers lockout
      authRateLimiter.reset();
      const res5 = await makeRequest('POST', '/api/admin/auth/login', {
        body: { username: victimUser.username, password: 'WrongPasswordAttempt!' }
      });
      expect(res5.status).toBe(423);
      expect(res5.body.error).toContain('Account locked: 5 consecutive failed attempts');
      expect(res5.body.error).toContain('15 minutes');

      // Verify database state: locked_until ~ 15 minutes ahead
      const lockedUser = db.prepare('SELECT failed_login_attempts, locked_until FROM admin_users WHERE id = ?').get(victimUser.id) as any;
      expect(lockedUser.failed_login_attempts).toBe(5);
      expect(lockedUser.locked_until).toBeDefined();
      const lockDate = new Date(lockedUser.locked_until);
      const minutesRemaining = (lockDate.getTime() - Date.now()) / (60 * 1000);
      expect(minutesRemaining).toBeGreaterThan(14.0);
      expect(minutesRemaining).toBeLessThanOrEqual(15.5);

      // Verify audit log entry exists
      const audit = db.prepare(`
        SELECT * FROM audit_logs 
        WHERE target_id = ? AND action = 'admin.account_lockout'
        ORDER BY created_at DESC LIMIT 1
      `).get(victimUser.id) as any;
      expect(audit).toBeDefined();
      expect(audit.action).toBe('admin.account_lockout');
      expect(audit.target_type).toBe('admin_user');
      const changes = JSON.parse(audit.changes_json);
      expect(changes.reason).toContain('5 consecutive failed password attempts');
    });

    it('rejects subsequent login attempts during lockout window EVEN WITH CORRECT credentials', async () => {
      // Ensure victim is locked
      const lockedUser = db.prepare('SELECT locked_until FROM admin_users WHERE id = ?').get(victimUser.id) as any;
      expect(lockedUser.locked_until).toBeDefined();

      authRateLimiter.reset();
      const res = await makeRequest('POST', '/api/admin/auth/login', {
        body: { username: victimUser.username, password: victimUser.password } // Correct password!
      });

      expect(res.status).toBe(423);
      expect(res.body.error).toContain('Account locked: 5 consecutive failed attempts');
    });

    it('immediately purges active sessions for user when account locks on 5th attempt', async () => {
      // 1. Unlock victim temporarily and establish an active session
      db.prepare('UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?').run(victimUser.id);
      authRateLimiter.reset();

      const victimCookie = await loginAndGetCookie(victimUser, '192.168.1.100');
      const victimRawToken = victimCookie.replace('bhr_session=', '');
      const victimTokenHash = hashSessionToken(victimRawToken);

      // Confirm session is valid
      const checkRes = await makeRequest('GET', '/api/admin/products', {
        headers: { Cookie: victimCookie }
      });
      expect(checkRes.status).toBe(200);

      // Confirm session exists in database
      const activeSessionBefore = db.prepare('SELECT * FROM admin_sessions WHERE id = ?').get(victimTokenHash);
      expect(activeSessionBefore).toBeDefined();

      // 2. Attacker performs 5 brute force attempts from different IP
      for (let i = 1; i <= 5; i++) {
        authRateLimiter.reset();
        await makeRequest('POST', '/api/admin/auth/login', {
          headers: { 'x-forwarded-for': `10.0.0.${i}` },
          body: { username: victimUser.username, password: `WrongAttackerPassword${i}` }
        });
      }

      // 3. Verify victim session in admin_sessions table was purged
      const activeSessionAfter = db.prepare('SELECT * FROM admin_sessions WHERE id = ?').get(victimTokenHash);
      expect(activeSessionAfter).toBeUndefined();

      // 4. Verify victim request with previous cookie is rejected with HTTP 401
      const checkResAfter = await makeRequest('GET', '/api/admin/products', {
        headers: { Cookie: victimCookie }
      });
      expect(checkResAfter.status).toBe(401);
    });

    it('auto-unlocks account once the 15-minute lockout window has elapsed', async () => {
      // Manually set locked_until to 1 second in the past
      const pastTime = new Date(Date.now() - 1000).toISOString();
      db.prepare('UPDATE admin_users SET failed_login_attempts = 5, locked_until = ? WHERE id = ?').run(pastTime, victimUser.id);

      authRateLimiter.reset();
      // Valid login attempt should now unlock the account
      const res = await makeRequest('POST', '/api/admin/auth/login', {
        body: { username: victimUser.username, password: victimUser.password }
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify database reset
      const resetUser = db.prepare('SELECT failed_login_attempts, locked_until FROM admin_users WHERE id = ?').get(victimUser.id) as any;
      expect(resetUser.failed_login_attempts).toBe(0);
      expect(resetUser.locked_until).toBeNull();
    });

    it('throttles IP after 5 attempts across 15 minutes with HTTP 429', async () => {
      const attackingIp = '198.51.100.99';
      authRateLimiter.reset(attackingIp);

      // Attempts 1 to 5 from this IP:
      for (let i = 1; i <= 5; i++) {
        const res = await makeRequest('POST', '/api/admin/auth/login', {
          headers: { 'x-forwarded-for': attackingIp },
          body: { username: 'non_existent_target', password: 'bad_password' }
        });
        expect(res.status).toBe(401);
      }

      // 6th attempt from same IP triggers HTTP 429
      const res6 = await makeRequest('POST', '/api/admin/auth/login', {
        headers: { 'x-forwarded-for': attackingIp },
        body: { username: 'non_existent_target', password: 'bad_password' }
      });
      expect(res6.status).toBe(429);
      expect(res6.body.error).toContain('Too many login attempts');
      expect(res6.body.error).toContain('Throttled for 15 minutes');
    });
  });

  // ==========================================================================
  // SECTION 3: RBAC PRIVILEGE ESCALATION FUZZING
  // ==========================================================================
  describe('3. RBAC Privilege Escalation Fuzzing', () => {
    let adminCookie: string;
    let superadminCookie: string;
    let sampleProductId: string;

    beforeAll(async () => {
      viewerCookie = await loginAndGetCookie(viewerUser);
      adminCookie = await loginAndGetCookie(adminUser);
      superadminCookie = await loginAndGetCookie(superadminUser);

      // Create a sample product using superadmin for testing mutations
      const prodRes = await makeRequest('POST', '/api/admin/products', {
        headers: { Cookie: superadminCookie },
        body: {
          name: 'RBAC Test Product Mandir',
          description: 'A test handcrafted product for RBAC fuzzing',
          category_id: 'cat_spiritual_deities',
          base_price_paise: 249900,
          is_made_to_order: 1,
          material: 'Artisanal Resin',
          dimensions_cm: { length: 15, width: 10, height: 20 },
          weight_grams: 450,
          manufacturing_method: '3D Printed & Hand Painted',
          finishing_type: 'Hand Glazed'
        }
      });
      expect(prodRes.status).toBe(201);
      sampleProductId = prodRes.body.data.id;

      // Create a sample enquiry for testing enquiry mutations
      const enqId = 'enq_adv_test_01';
      db.prepare(`
        INSERT INTO enquiries (id, customer_name, contact_phone, project_type, design_description, status, ip_hash)
        VALUES (?, 'Adv Customer', '+919876543210', 'custom_figurine', 'Custom mandir prototype request', 'new', ?)
      `).run(enqId, hashSha256('ip_test'));
      sampleEnquiryId = enqId;
    });

    it('FORBIDS viewer from creating products (POST /api/admin/products) with HTTP 403', async () => {
      const res = await makeRequest('POST', '/api/admin/products', {
        headers: { Cookie: viewerCookie },
        body: {
          name: 'Viewer Escaped Product',
          category_id: 'cat_spiritual_deities',
          base_price_paise: 100000
        }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('FORBIDS viewer from modifying products (PUT /api/admin/products/:id) with HTTP 403', async () => {
      const res = await makeRequest('PUT', `/api/admin/products/${sampleProductId}`, {
        headers: { Cookie: viewerCookie },
        body: { name: 'Viewer Renamed Name' }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('FORBIDS viewer from deleting products (DELETE /api/admin/products/:id) with HTTP 403', async () => {
      const res = await makeRequest('DELETE', `/api/admin/products/${sampleProductId}`, {
        headers: { Cookie: viewerCookie }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('FORBIDS viewer from patching product status (PATCH /api/admin/products/:id/status) with HTTP 403', async () => {
      const res = await makeRequest('PATCH', `/api/admin/products/${sampleProductId}/status`, {
        headers: { Cookie: viewerCookie },
        body: { status: 'published' }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('FORBIDS viewer from patching product featured (PATCH /api/admin/products/:id/featured) with HTTP 403', async () => {
      const res = await makeRequest('PATCH', `/api/admin/products/${sampleProductId}/featured`, {
        headers: { Cookie: viewerCookie },
        body: { is_featured: 1 }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('FORBIDS viewer from uploading product images (POST /api/admin/products/:id/images) with HTTP 403', async () => {
      const fakeJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      const res = await makeRequest('POST', `/api/admin/products/${sampleProductId}/images`, {
        headers: { Cookie: viewerCookie },
        body: { file_base64: fakeJpeg.toString('base64'), alt_text: 'Viewer Attack Image' }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('FORBIDS viewer from mutating enquiry status (PATCH /api/admin/enquiries/:id/status) with HTTP 403', async () => {
      const res = await makeRequest('PATCH', `/api/admin/enquiries/${sampleEnquiryId}/status`, {
        headers: { Cookie: viewerCookie },
        body: { status: 'contacted', note: 'Viewer unauthorised progression' }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('FORBIDS viewer from adding internal enquiry notes (POST /api/admin/enquiries/:id/notes) with HTTP 403', async () => {
      const res = await makeRequest('POST', `/api/admin/enquiries/${sampleEnquiryId}/notes`, {
        headers: { Cookie: viewerCookie },
        body: { note: 'Viewer inject internal note' }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('FORBIDS viewer from accessing security audit logs (GET /api/admin/audit-logs) with HTTP 403', async () => {
      const res = await makeRequest('GET', '/api/admin/audit-logs', {
        headers: { Cookie: viewerCookie }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden: Only superadmin may view audit logs');
    });

    it('FORBIDS standard admin from accessing audit logs (GET /api/admin/audit-logs) with HTTP 403', async () => {
      const res = await makeRequest('GET', '/api/admin/audit-logs', {
        headers: { Cookie: adminCookie }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden: Only superadmin may view audit logs');
    });

    it('ALLOWS superadmin to access audit logs with HTTP 200', async () => {
      const res = await makeRequest('GET', '/api/admin/audit-logs', {
        headers: { Cookie: superadminCookie }
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('ALLOWS viewer to perform permitted read-only operations with HTTP 200', async () => {
      const readEndpoints = [
        '/api/admin/products',
        `/api/admin/products/${sampleProductId}`,
        '/api/admin/overview/kpis',
        '/api/admin/overview/diagnostics',
        '/api/admin/auth/me'
      ];

      for (const endpoint of readEndpoints) {
        const res = await makeRequest('GET', endpoint, {
          headers: { Cookie: viewerCookie }
        });
        expect(res.status).toBe(200);
      }
    });

    it('FORBIDS viewer from accessing customer enquiry list (GET /api/admin/enquiries) with HTTP 403', async () => {
      const res = await makeRequest('GET', '/api/admin/enquiries', {
        headers: { Cookie: viewerCookie }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('FORBIDS viewer from accessing customer enquiry details (GET /api/admin/enquiries/:id) with HTTP 403', async () => {
      const res = await makeRequest('GET', `/api/admin/enquiries/${sampleEnquiryId}`, {
        headers: { Cookie: viewerCookie }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('corrupted or unrecognized role strictly defaults to false across all permissions', () => {
      const bogusRoles = ['moderator', 'hacker', 'support', 'guest', '', 'null', 'undefined', 'SUPERADMIN'];
      for (const role of bogusRoles) {
        expect(hasPermission(role, 'products:read')).toBe(false);
        expect(hasPermission(role, 'products:mutate')).toBe(false);
        expect(hasPermission(role, 'enquiries:mutate')).toBe(false);
        expect(hasPermission(role, 'audit:read')).toBe(false);
      }
    });
  });

  // ==========================================================================
  // SECTION 4: TIMING ATTACK ORACLE & CONSTANT-TIME VERIFICATION
  // ==========================================================================
  describe('4. Timing Attack Oracle & Cryptographic Safety', () => {
    it('timingSafeEqualString operates safely on varying string lengths without throwing RangeError', () => {
      expect(timingSafeEqualString('secret_token_123', 'secret_token_123')).toBe(true);
      expect(timingSafeEqualString('secret_token_123', 'secret_token_124')).toBe(false);
      expect(timingSafeEqualString('short', 'much_longer_string_value')).toBe(false);
      expect(timingSafeEqualString('', 'non_empty')).toBe(false);
      expect(timingSafeEqualString('', '')).toBe(true);
    });

    it('verifyPassword correctly validates SHA-256 hashes using timingSafeEqual', () => {
      const plain = 'MySecretArtisanPassword2026!';
      const hash = hashSha256(plain);

      // Positive match
      expect(verifyPassword(plain, hash)).toBe(true);

      // Negative matches (single character tampering)
      expect(verifyPassword('WrongPassword', hash)).toBe(false);
      expect(verifyPassword(plain + 'x', hash)).toBe(false);
      expect(verifyPassword(plain.slice(0, -1), hash)).toBe(false);

      // Tampered hash of same 64-char length
      const tamperedHash = hash.slice(0, 63) + (hash[63] === 'a' ? 'b' : 'a');
      expect(verifyPassword(plain, tamperedHash)).toBe(false);

      // Blank and malformed inputs
      expect(verifyPassword('', hash)).toBe(false);
      expect(verifyPassword(plain, '')).toBe(false);
    });

    it('verifyPassword correctly validates scrypt hashes generated by hashPassword', () => {
      const plain = 'ChangeMeImmediately123!';
      const scryptHash = hashPassword(plain);
      expect(scryptHash.startsWith('scrypt$')).toBe(true);
      expect(verifyPassword(plain, scryptHash)).toBe(true);
      expect(verifyPassword('WrongPassword', scryptHash)).toBe(false);
      expect(verifyPassword(plain + 'x', scryptHash)).toBe(false);
    });

    it('verifyPassword correctly validates PBKDF2 modular crypt format hashes', () => {
      const plain = 'MySecretArtisanPassword2026!';
      const salt = crypto.randomBytes(16).toString('hex');
      const derivedKey = crypto.pbkdf2Sync(plain, salt, 10000, 32, 'sha256').toString('hex');
      const pbkdf2Hash = `pbkdf2$sha256$10000$${salt}$${derivedKey}`;
      expect(verifyPassword(plain, pbkdf2Hash)).toBe(true);
      expect(verifyPassword('WrongPassword', pbkdf2Hash)).toBe(false);
    });

    it('verifyPassword safely rejects unsupported hash formats without exceptions', () => {
      const unsupportedBcrypt = '$2a$12$KIXe8dGy/d2Q.5B43aJ4e.sXjP4V7m8m1Q1b/7TjZk7JzM6k2X4Gq';
      expect(verifyPassword('ChangeMeImmediately123!', unsupportedBcrypt)).toBe(false);
      expect(verifyPassword('AnyPassword', 'invalid$malformed$hash')).toBe(false);
    });

    it('performs dummy hash verification on unknown username to prevent timing oracle user enumeration', async () => {
      // Benchmark response time for non-existent user vs existing user with wrong password
      const runs = 10;
      const nonExistentDurations: number[] = [];
      const wrongPassDurations: number[] = [];

      for (let i = 0; i < runs; i++) {
        authRateLimiter.reset();
        const t0 = performance.now();
        await makeRequest('POST', '/api/admin/auth/login', {
          body: { username: `non_existent_user_${Date.now()}_${i}`, password: 'AttemptedPassword123!' }
        });
        const t1 = performance.now();
        nonExistentDurations.push(t1 - t0);

        authRateLimiter.reset();
        const t2 = performance.now();
        await makeRequest('POST', '/api/admin/auth/login', {
          body: { username: superadminUser.username, password: 'WrongPasswordAttempt123!' }
        });
        const t3 = performance.now();
        wrongPassDurations.push(t3 - t2);
      }

      const avgNonExistent = nonExistentDurations.reduce((a, b) => a + b, 0) / runs;
      const avgWrongPass = wrongPassDurations.reduce((a, b) => a + b, 0) / runs;

      // Both execution times should be in the same order of magnitude (within reasonable delta < 50ms)
      // because dummy_hash verification runs on non-existent users
      const delta = Math.abs(avgNonExistent - avgWrongPass);
      expect(delta).toBeLessThan(60); // Difference bounded within reasonable network/DB noise
    });

    it('session verification uses SHA-256 token preimage resistance against token timing attacks', () => {
      const rawTokenA = generateRawSessionToken();
      const rawTokenB = generateRawSessionToken();

      const hashA = hashSessionToken(rawTokenA);
      const hashB = hashSessionToken(rawTokenB);

      // Raw tokens are 64 hex characters (32 bytes)
      expect(rawTokenA).toHaveLength(64);
      expect(rawTokenB).toHaveLength(64);

      // Hashes are 64 hex characters (32 bytes)
      expect(hashA).toHaveLength(64);
      expect(hashB).toHaveLength(64);

      // 1-bit difference in raw token causes complete hash divergence (avalanche effect)
      const tokenAlmostIdentical = rawTokenA.slice(0, 63) + (rawTokenA[63] === '0' ? '1' : '0');
      const hashAlmostIdentical = hashSessionToken(tokenAlmostIdentical);
      expect(hashAlmostIdentical).not.toBe(hashA);

      // Avalanche check: count differing hex nibbles
      let diffCount = 0;
      for (let i = 0; i < 64; i++) {
        if (hashA[i] !== hashAlmostIdentical[i]) diffCount++;
      }
      expect(diffCount).toBeGreaterThan(20); // Massive divergence guarantees safe index lookup
    });
  });

  // ==========================================================================
  // SECTION 5: CHALLENGER EMPIRICAL FUZZING HARNESS
  // ==========================================================================
  describe('5. Challenger Empirical Fuzzing (Milestone 2 Iteration 2)', () => {
    describe('5.1 Password Crypto & Parameter Tampering Fuzzing', () => {
      const password = 'GenuinePassword!2026';
      const validScryptHash = hashPassword(password);

      it('rejects tampered salt or tampered derived key in scrypt format', () => {
        const parts = validScryptHash.split('$');
        expect(parts).toHaveLength(6);

        // Tamper salt: flip first character
        const tamperedSalt = (parts[4][0] === 'a' ? 'b' : 'a') + parts[4].slice(1);
        const hashTamperedSalt = `scrypt$${parts[1]}$${parts[2]}$${parts[3]}$${tamperedSalt}$${parts[5]}`;
        expect(verifyPassword(password, hashTamperedSalt)).toBe(false);

        // Tamper derived key: flip last character
        const lastIdx = parts[5].length - 1;
        const tamperedKey = parts[5].slice(0, lastIdx) + (parts[5][lastIdx] === 'a' ? 'b' : 'a');
        const hashTamperedKey = `scrypt$${parts[1]}$${parts[2]}$${parts[3]}$${parts[4]}$${tamperedKey}`;
        expect(verifyPassword(password, hashTamperedKey)).toBe(false);
      });

      it('safely rejects malformed scrypt parameter strings without unhandled exceptions', () => {
        const parts = validScryptHash.split('$');
        const salt = parts[4];
        const key = parts[5];

        const malformedHashes = [
          `scrypt$NaN$8$1$${salt}$${key}`,
          `scrypt$16384$NaN$1$${salt}$${key}`,
          `scrypt$16384$8$NaN$${salt}$${key}`,
          `scrypt$-1$8$1$${salt}$${key}`,
          `scrypt$0$8$1$${salt}$${key}`,
          `scrypt$1048576$8$1$${salt}$${key}`, // memory limit exceeded
          `scrypt$$$$$`,
          `scrypt$1$2$3$4$5$6$7`, // too many segments
          `scrypt$16384$8$1$$${key}`, // empty salt
          `scrypt$16384$8$1$${salt}$`, // empty key
          `scrypt$16384$8$1$${salt}$ZZZZnothex`, // invalid hex characters
          `scrypt$16384$8$1$${salt}$abc` // odd-length hex string
        ];

        for (const malformed of malformedHashes) {
          expect(verifyPassword(password, malformed)).toBe(false);
        }
      });

      it('safely rejects unsupported hash formats with constant-time dummy fallback', () => {
        const unsupportedHashes = [
          '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgqlfre',
          '$argon2i$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgqlfre',
          '$apr1$salt$hashvaluehere1234567890',
          '$1$salt$hashvaluehere1234567890',
          '$5$salt$hashvaluehere1234567890',
          '$6$salt$hashvaluehere1234567890',
          'bcrypt$2a$12$someotherfakehashstring',
          'plain:unhashed_password_attempt',
          'md5:e10adc3949ba59abbe56e057f20f883e',
          'sha1:2fd4e1c67a2d28fced849ee1bb76e7391b93eb12'
        ];

        for (const unsupported of unsupportedHashes) {
          expect(verifyPassword('AnyPasswordAttempt', unsupported)).toBe(false);
        }
      });

      it('safely handles corrupted PBKDF2 hash segments', () => {
        const corruptedPbkdf2 = [
          'pbkdf2$sha256$NaN$salt$hash',
          'pbkdf2$unsupported_algorithm$1000$salt$hash',
          'pbkdf2$sha256$10000$$hash',
          'pbkdf2$sha256$10000$salt$',
          'pbkdf2$sha256$10000',
          'pbkdf2$sha256$10000$salt$hash$extra'
        ];

        for (const corrupted of corruptedPbkdf2) {
          expect(verifyPassword(password, corrupted)).toBe(false);
        }
      });
    });

    describe('5.2 Raw IP Injection & Database Invariant Fuzzing', () => {
      it('guarantees 100% of ip_hash records in admin_sessions and audit_logs are 64-char hex digests', async () => {
        const forgedIpHeaders = [
          '203.0.113.195',
          '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          '198.51.100.42, 10.0.0.1, 192.168.1.1',
          '::ffff:192.0.2.128',
          '<script>alert("xss_ip")</script>',
          "' OR '1'='1"
        ];

        for (const forgedIp of forgedIpHeaders) {
          authRateLimiter.reset();
          db.prepare('UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL WHERE username = ?').run(superadminUser.username);

          // 1. Perform a successful login with forged IP header
          const loginRes = await makeRequest('POST', '/api/admin/auth/login', {
            headers: { 'x-forwarded-for': forgedIp },
            body: { username: superadminUser.username, password: superadminUser.password }
          });
          expect(loginRes.status).toBe(200);
        }

        // 2. Perform 5 failed logins with forged IP header to trigger account lockout and audit_log write
        const lockoutTargetUser = {
          id: 'usr_adv_fuzz_lockout',
          username: 'adv_fuzz_lockout_target',
          email: 'adv_fuzz_lockout@bhairavicreations.test',
          password: 'SecretLockoutPass2026!',
          passwordHash: hashSha256('SecretLockoutPass2026!'),
          role: 'admin'
        };

        db.prepare(`
          INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, role, is_active, failed_login_attempts, locked_until)
          VALUES (?, ?, ?, ?, ?, 1, 0, NULL)
        `).run(lockoutTargetUser.id, lockoutTargetUser.username, lockoutTargetUser.email, lockoutTargetUser.passwordHash, lockoutTargetUser.role);

        for (let i = 0; i < 5; i++) {
          authRateLimiter.reset();
          await makeRequest('POST', '/api/admin/auth/login', {
            headers: { 'x-forwarded-for': '203.0.113.88' },
            body: { username: lockoutTargetUser.username, password: 'WrongPassword' }
          });
        }

        // 3. Inspect admin_sessions in SQLite database
        const sessions = db.prepare('SELECT id, admin_user_id, ip_hash FROM admin_sessions WHERE ip_hash IS NOT NULL').all() as any[];
        expect(sessions.length).toBeGreaterThan(0);
        for (const session of sessions) {
          expect(session.ip_hash).toMatch(/^[0-9a-f]{64}$/i);
          expect(session.ip_hash).not.toContain('.');
          expect(session.ip_hash).not.toContain(':');
          expect(session.ip_hash).not.toContain('203.0.113');
        }

        // 4. Inspect audit_logs in SQLite database
        const auditLogs = db.prepare('SELECT id, action, ip_hash FROM audit_logs WHERE ip_hash IS NOT NULL').all() as any[];
        expect(auditLogs.length).toBeGreaterThan(0);
        for (const log of auditLogs) {
          expect(log.ip_hash).toMatch(/^[0-9a-f]{64}$/i);
          expect(log.ip_hash).not.toContain('.');
          expect(log.ip_hash).not.toContain(':');
          expect(log.ip_hash).not.toContain('203.0.113');
        }
      });
    });

    describe('5.3 Viewer Role Enquiry PII Leak Prevention Fuzzing', () => {
      it('consistently rejects viewer access to customer enquiry list across all parameter variations with HTTP 403', async () => {
        const queryVariants = [
          '',
          '?status=new',
          '?status=contacted',
          '?project_type=custom_figurine',
          '?search=Adv',
          '?page=1&limit=5',
          '?date_from=2026-01-01&date_to=2026-12-31'
        ];

        for (const query of queryVariants) {
          const res = await makeRequest('GET', `/api/admin/enquiries${query}`, {
            headers: { Cookie: viewerCookie }
          });
          expect(res.status).toBe(403);
          expect(res.body.error).toContain('Forbidden');
          expect(res.body.data).toBeUndefined();
        }
      });

      it('consistently rejects viewer access to customer enquiry details with HTTP 403 prior to entity lookup', async () => {
        const enquiryIds = [
          sampleEnquiryId,
          'non_existent_enquiry_id',
          'BC-ENQ-999999',
          'enq_12345'
        ];

        for (const id of enquiryIds) {
          const res = await makeRequest('GET', `/api/admin/enquiries/${id}`, {
            headers: { Cookie: viewerCookie }
          });
          expect(res.status).toBe(403);
          expect(res.body.error).toContain('Forbidden');
          expect(res.body.data).toBeUndefined();
        }
      });
    });
  });
});
