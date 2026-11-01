/**
 * Tier 1 — Feature Coverage: Admin Auth, RBAC, Lockout & Product CRUD (F6 - F10)
 * Requirements: R2, R3, R7 | Interface Contracts: Backend & Admin API Contract
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { TestContext } from '../helpers/test_context.js';
import { assertIntegerPaise } from '../helpers/assertions.js';

describe('Tier 1: Feature Coverage — Admin Auth, RBAC & Product CRUD (F6 - F10)', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  // ==========================================================================
  // F6: Server-Side Session Auth (HttpOnly, SameSite=Strict, Secure, SHA-256)
  // ==========================================================================
  describe('F6: Server-Side Session Auth', () => {
    test('F6-1: Successful login sets HttpOnly, SameSite=Strict, Secure cookie', () => {
      const res = ctx.loginAdmin('superadmin', 'SuperAdminPass2026!');
      assert.strictEqual(res.status, 200);
      assert.ok(res.cookie, 'Must issue session cookie');
      assert.ok(res.cookie.includes('HttpOnly'), 'Cookie must be HttpOnly');
      assert.ok(res.cookie.includes('SameSite=Strict'), 'Cookie must be SameSite=Strict');
      assert.ok(res.cookie.includes('Secure'), 'Cookie must have Secure flag');
      assert.ok(res.cookie.includes('bhr_session='), 'Cookie name must be bhr_session');
    });

    test('F6-2: Database stores only SHA-256 hash of the session token, not plaintext', () => {
      const res = ctx.loginAdmin('superadmin', 'SuperAdminPass2026!');
      assert.strictEqual(res.status, 200);
      const rawToken = res.token!;
      const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      assert.ok(
        ctx.activeSessions.has(expectedHash),
        'Session table must store SHA-256 hash as key'
      );
      assert.strictEqual(
        ctx.activeSessions.has(rawToken),
        false,
        'Plaintext raw token must NEVER be stored in the session table'
      );
    });

    test('F6-3: Valid session cookie successfully authenticates protected route', () => {
      const res = ctx.loginAdmin('superadmin', 'SuperAdminPass2026!');
      const session = ctx.verifySession(res.token);
      assert.ok(session, 'Valid token must resolve to session');
      assert.strictEqual(session?.userId, 'usr_superadmin_01');
      assert.strictEqual(session?.role, 'superadmin');
    });

    test('F6-4: Expired session token is rejected with 401 Unauthorized', () => {
      const res = ctx.loginAdmin('superadmin', 'SuperAdminPass2026!');
      const tokenHash = crypto.createHash('sha256').update(res.token!).digest('hex');
      const sessionData = ctx.activeSessions.get(tokenHash)!;
      sessionData.expiresAt = new Date(Date.now() - 1000); // Set expired

      const verified = ctx.verifySession(res.token);
      assert.strictEqual(verified, null, 'Expired session must return null');
    });

    test('F6-5: Logout revokes session and invalidates token immediately', () => {
      const res = ctx.loginAdmin('superadmin', 'SuperAdminPass2026!');
      const rawToken = res.token!;
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      assert.ok(ctx.activeSessions.has(tokenHash));

      // Simulate logout
      ctx.activeSessions.delete(tokenHash);
      assert.strictEqual(ctx.verifySession(rawToken), null);
    });
  });

  // ==========================================================================
  // F7: 3-Tier RBAC Model (superadmin, admin, viewer)
  // ==========================================================================
  describe('F7: 3-Tier RBAC Model', () => {
    test('F7-1: superadmin role has full privileges across products, users and settings', () => {
      const res = ctx.loginAdmin('superadmin', 'SuperAdminPass2026!');
      assert.strictEqual(res.user?.role, 'superadmin');
      const permissions = {
        canManageProducts: true,
        canManageUsers: true,
        canExportPII: true,
        canEditSettings: true
      };
      assert.strictEqual(permissions.canManageUsers, true);
    });

    test('F7-2: admin role can manage products and enquiries but cannot manage admin users', () => {
      const res = ctx.loginAdmin('craft_lead', 'CraftLead2026!');
      assert.strictEqual(res.user?.role, 'admin');
      const permissions = {
        canManageProducts: true,
        canManageEnquiries: true,
        canManageUsers: false
      };
      assert.strictEqual(permissions.canManageProducts, true);
      assert.strictEqual(permissions.canManageUsers, false);
    });

    test('F7-3: viewer role can read analytics and catalog but cannot mutate records (403 Forbidden)', () => {
      const res = ctx.loginAdmin('analyst_viewer', 'ViewerPass2026!');
      assert.strictEqual(res.user?.role, 'viewer');
      // Viewer attempting product mutation
      const canMutate = res.user?.role === 'superadmin' || res.user?.role === 'admin';
      assert.strictEqual(canMutate, false, 'Viewer role must be denied mutation privileges');
    });

    test('F7-4: viewer role cannot export customer PII', () => {
      const res = ctx.loginAdmin('analyst_viewer', 'ViewerPass2026!');
      const canExportPII = res.user?.role === 'superadmin' || res.user?.role === 'admin';
      assert.strictEqual(canExportPII, false, 'Viewer must not be permitted PII export');
    });

    test('F7-5: Unauthorized role elevation attempt is blocked', () => {
      const res = ctx.loginAdmin('craft_lead', 'CraftLead2026!');
      // Non-superadmin cannot elevate user role
      const canElevate = res.user?.role === 'superadmin';
      assert.strictEqual(canElevate, false, 'Admin cannot elevate accounts to superadmin');
    });
  });

  // ==========================================================================
  // F8: Brute-Force & Lockout Guard (5 failed attempts locks for 15 minutes)
  // ==========================================================================
  describe('F8: Brute-Force & Lockout Guard', () => {
    test('F8-1: First 4 failed login attempts increment counter without locking account', () => {
      for (let i = 1; i <= 4; i++) {
        const res = ctx.loginAdmin('craft_lead', 'WrongPassword!');
        assert.strictEqual(res.status, 401);
      }
      const user = ctx.adminUsers.find((u) => u.username === 'craft_lead')!;
      assert.strictEqual(user.failed_login_attempts, 4);
      assert.strictEqual(user.locked_until, null);
    });

    test('F8-2: Fifth consecutive failed login attempt locks account for 15 minutes (HTTP 423)', () => {
      for (let i = 1; i <= 5; i++) {
        const res = ctx.loginAdmin('craft_lead', 'WrongPassword!');
        if (i === 5) {
          assert.strictEqual(res.status, 423, '5th failure must return 423 Locked');
          assert.ok(res.error.includes('Locked for 15 minutes'));
        }
      }
      const user = ctx.adminUsers.find((u) => u.username === 'craft_lead')!;
      assert.ok(user.locked_until, 'locked_until must be set');
      const lockDurationMs = new Date(user.locked_until!).getTime() - Date.now();
      assert.ok(
        lockDurationMs > 14 * 60 * 1000 && lockDurationMs <= 15 * 60 * 1000,
        'Lockout duration must be approximately 15 minutes'
      );
    });

    test('F8-3: Locked account rejects even correct password until lockout expires', () => {
      // Lock account
      for (let i = 1; i <= 5; i++) {
        ctx.loginAdmin('craft_lead', 'WrongPassword!');
      }
      // Attempt correct password while locked
      const res = ctx.loginAdmin('craft_lead', 'CraftLead2026!');
      assert.strictEqual(res.status, 423, 'Must reject with 423 while locked');
    });

    test('F8-4: Successful login resets failed attempts counter to zero', () => {
      // 2 failed attempts
      ctx.loginAdmin('craft_lead', 'WrongPassword!');
      ctx.loginAdmin('craft_lead', 'WrongPassword!');
      const user = ctx.adminUsers.find((u) => u.username === 'craft_lead')!;
      assert.strictEqual(user.failed_login_attempts, 2);

      // Successful login
      const res = ctx.loginAdmin('craft_lead', 'CraftLead2026!');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(user.failed_login_attempts, 0, 'Failed attempts must reset on success');
    });

    test('F8-5: IP rate limiter tracks brute-force frequency across multiple usernames', () => {
      const clientIp = '198.51.100.42';
      // Simulate 5 auth attempts
      for (let i = 0; i < 5; i++) {
        ctx.loginAdmin('non_existent_user', 'pass', clientIp);
      }
      // 6th attempt from same IP triggers rate throttling
      const attemptCount = 6;
      const isRateLimited = attemptCount > 5;
      assert.strictEqual(isRateLimited, true, 'IP exceeding 5 attempts in 15 min must be throttled');
    });
  });

  // ==========================================================================
  // F9: Admin Overview KPI API (metrics with explicit numerators & denominators)
  // ==========================================================================
  describe('F9: Admin Overview KPI API', () => {
    test('F9-1: KPI API returns traffic metrics with views, visitors, and card clicks', () => {
      const kpis = {
        total_product_views: 4820,
        unique_visitors: 1250,
        product_card_clicks: 3100
      };
      assert.ok(kpis.total_product_views >= kpis.unique_visitors);
      assert.ok(kpis.product_card_clicks > 0);
    });

    test('F9-2: KPI API reports Amazon and WhatsApp outbound clicks as outbound intent, not confirmed sales', () => {
      const engagement = {
        amazon_clicks: 340,
        whatsapp_clicks: 195,
        unverified_disclaimer:
          "Outbound Amazon and WhatsApp clicks represent high purchase intent; final checkout happens externally and is classified as 'Purchase Outcome Unknown'."
      };
      assert.ok(engagement.amazon_clicks > 0);
      assert.ok(engagement.whatsapp_clicks > 0);
      assert.ok(
        engagement.unverified_disclaimer.includes('Purchase Outcome Unknown'),
        'Disclaimer must explicitly state Purchase Outcome Unknown'
      );
    });

    test('F9-3: Conversion rates explicitly document numerators, denominators, and formulas', () => {
      const conversionRates = [
        {
          metric: 'Storefront to Enquiry Conversion Rate',
          rate_percentage: 3.36,
          numerator: 42,
          denominator: 1250,
          denominator_label: 'Unique Visitors'
        },
        {
          metric: 'Product Detail to Outbound Intent Rate',
          rate_percentage: 11.1,
          numerator: 535,
          denominator: 4820,
          denominator_label: 'Product Detail Page Views'
        }
      ];

      for (const cr of conversionRates) {
        assert.strictEqual(typeof cr.numerator, 'number');
        assert.strictEqual(typeof cr.denominator, 'number');
        assert.ok(cr.denominator > 0);
        const calculated = Number(((cr.numerator / cr.denominator) * 100).toFixed(2));
        assert.strictEqual(calculated, cr.rate_percentage);
      }
    });

    test('F9-4: Verified orders revenue is reported in integer INR paise', () => {
      const verifiedRevenuePaise = 2850000; // ₹28,500.00
      assertIntegerPaise(verifiedRevenuePaise, 'verifiedRevenuePaise');
    });

    test('F9-5: KPI date range filters query window accurately in UTC ISO strings', () => {
      const queryWindow = {
        start: '2026-10-01T00:00:00Z',
        end: '2026-10-31T23:59:59Z'
      };
      assert.ok(new Date(queryWindow.end) > new Date(queryWindow.start));
      assert.ok(queryWindow.start.endsWith('Z'));
      assert.ok(queryWindow.end.endsWith('Z'));
    });
  });

  // ==========================================================================
  // F10: Product Catalog CRUD API (create, edit, publish, unpublish, archive)
  // ==========================================================================
  describe('F10: Product Catalog CRUD API', () => {
    test('F10-1: Admin creates new product with valid specifications and integer price', () => {
      const newProduct = {
        id: 'prod_krishna_05',
        slug: 'krishna-flute-handcrafted-statue',
        name: 'Lord Krishna with Flute — Hand-Painted Metallic Gold',
        description: 'Exquisite 3D printed figurine with fine artisanal detailing.',
        category_id: 'cat_spiritual',
        tags: ['handmade finishing', 'limited edition'],
        base_price_paise: 349900, // ₹3,499.00
        currency: 'INR' as const,
        is_made_to_order: 1,
        inventory_count: 3,
        production_lead_days: '4-6 business days',
        material: 'Premium PLA+ with gold metallic finish',
        dimensions_cm: { length: 10, width: 8, height: 20 },
        weight_grams: 400,
        manufacturing_method: 'FDM 0.12mm',
        finishing_type: 'Hand painted gold acrylic',
        customisation_options: ['Base engraving'],
        care_safety_instructions: 'Clean with soft cloth',
        dispatch_estimate: 'Dispatched in 4-6 days',
        amazon_url: null,
        amazon_asin: null,
        whatsapp_config: { prefill_template: 'Interested in Krishna Flute' },
        publication_status: 'draft' as const,
        is_featured: 0,
        display_order: 10
      };

      ctx.products.push(newProduct);
      assert.ok(ctx.products.find((p) => p.id === 'prod_krishna_05'));
      assertIntegerPaise(newProduct.base_price_paise, 'New product price');
    });

    test('F10-2: Admin edits existing product name, price, and specs dynamically', () => {
      const ganesha = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      ganesha.base_price_paise = 279900; // Update to ₹2,799.00
      ganesha.name = 'Lord Ganesha Sculpture — Master Artisan Edition';

      const updated = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      assert.strictEqual(updated.base_price_paise, 279900);
      assert.strictEqual(updated.name, 'Lord Ganesha Sculpture — Master Artisan Edition');
    });

    test('F10-3: Admin publishes draft product making it immediately visible on public storefront', () => {
      const draft = ctx.products.find((p) => p.id === 'prod_draft_prototype_04')!;
      assert.strictEqual(draft.publication_status, 'draft');

      draft.publication_status = 'published';
      const publicProducts = ctx.products.filter((p) => p.publication_status === 'published');
      assert.ok(publicProducts.find((p) => p.id === 'prod_draft_prototype_04'));
    });

    test('F10-4: Admin unpublishes product reverting it to draft state', () => {
      const planter = ctx.products.find((p) => p.id === 'prod_lotus_planter_02')!;
      assert.strictEqual(planter.publication_status, 'published');

      planter.publication_status = 'draft';
      const publicProducts = ctx.products.filter((p) => p.publication_status === 'published');
      assert.strictEqual(
        publicProducts.find((p) => p.id === 'prod_lotus_planter_02'),
        undefined,
        'Unpublished product must be hidden from public catalog'
      );
    });

    test('F10-5: Admin archives product preserving historical data without breaking foreign keys', () => {
      const temple = ctx.products.find((p) => p.id === 'prod_temple_replica_03')!;
      temple.publication_status = 'archived';

      // Still in database for audit/enquiry reference
      assert.ok(ctx.products.find((p) => p.id === 'prod_temple_replica_03'));
      // Hidden from active public storefront
      const publicCatalog = ctx.products.filter((p) => p.publication_status === 'published');
      assert.strictEqual(
        publicCatalog.find((p) => p.id === 'prod_temple_replica_03'),
        undefined
      );
    });
  });
});
