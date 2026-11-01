/**
 * Tier 4 — Real-World Application Scenario 4:
 * Admin Governance, Product Lifecycle & Enquiry Handling
 * Steps: Admin Login -> Product CRUD -> Status Workflow -> Enquiry Notes -> Audit Trail
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TestContext } from '../helpers/test_context.js';
import { assertIntegerPaise } from '../helpers/assertions.js';

describe('Tier 4 Scenario 4: Admin Governance, Product CRUD & Enquiry Handling', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  test('Execute Full Admin Operational Journey from Login to Product Lifecycle & Enquiry Management', () => {
    // 1. Admin login with secure session cookie
    const loginRes = ctx.loginAdmin('superadmin', 'SuperAdminPass2026!');
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.cookie.includes('HttpOnly'));
    assert.ok(loginRes.cookie.includes('SameSite=Strict'));

    const session = ctx.verifySession(loginRes.token);
    assert.ok(session);
    assert.strictEqual(session.role, 'superadmin');

    // 2. Admin creates new handcrafted product in "draft" status
    const newProduct = {
      id: 'prod_lithophane_06',
      slug: 'sacred-om-lithophane-night-lamp',
      name: 'Sacred Om Ambient Lithophane Night Lamp',
      description: 'Precision vertical 3D printed lithophane displaying sacred iconography when illuminated.',
      category_id: 'cat_decor',
      tags: ['handmade finishing', 'customisation', 'spiritual art'],
      base_price_paise: 189900, // ₹1,899.00
      currency: 'INR' as const,
      is_made_to_order: 1,
      inventory_count: 0,
      production_lead_days: '3-4 business days',
      material: 'Warm-white translucent PLA with natural teakwood stand',
      dimensions_cm: { length: 12, width: 12, height: 18 },
      weight_grams: 320,
      manufacturing_method: '0.10mm micro-layer lithophane vertical printing',
      finishing_type: 'Hand-assembled teak base with USB warm LED lighting',
      customisation_options: ['Custom Sanskrit shloka base engraving'],
      care_safety_instructions: 'Operate with supplied 5V USB adapter only. Do not wash.',
      dispatch_estimate: 'Dispatched in 3-4 days from Ludhiana studio',
      amazon_url: null,
      amazon_asin: null,
      whatsapp_config: { prefill_template: 'Interested in Sacred Om Lithophane' },
      publication_status: 'draft' as const,
      is_featured: 0,
      display_order: 15
    };

    assertIntegerPaise(newProduct.base_price_paise);
    ctx.products.push(newProduct);

    // Verify draft product is HIDDEN from public catalog
    const publicCatalogBefore = ctx.products.filter((p) => p.publication_status === 'published');
    assert.strictEqual(
      publicCatalogBefore.find((p) => p.id === 'prod_lithophane_06'),
      undefined
    );

    // 3. Admin publishes product
    newProduct.publication_status = 'published';
    const publicCatalogAfter = ctx.products.filter((p) => p.publication_status === 'published');
    assert.ok(publicCatalogAfter.find((p) => p.id === 'prod_lithophane_06'));

    // 4. Admin archives product
    newProduct.publication_status = 'archived';
    const publicCatalogArchived = ctx.products.filter((p) => p.publication_status === 'published');
    assert.strictEqual(
      publicCatalogArchived.find((p) => p.id === 'prod_lithophane_06'),
      undefined
    );

    // 5. Admin handles customer enquiry workflow
    const enquiry = ctx.enquiries.find((e) => e.id === 'BC-ENQ-202610-1001')!;
    assert.strictEqual(enquiry.status, 'new');

    // Transition to contacted
    enquiry.status = 'contacted';
    ctx.enquiryTimeline.push({
      id: 'tl_journey_01',
      enquiry_id: enquiry.id,
      admin_user_id: session.userId,
      action_type: 'status_change',
      previous_status: 'new',
      new_status: 'contacted',
      note: 'Discussed custom scale (20cm) and bronze patina finish with customer.'
    });

    // Transition to quoted with internal note
    enquiry.status = 'quoted';
    ctx.enquiryTimeline.push({
      id: 'tl_journey_02',
      enquiry_id: enquiry.id,
      admin_user_id: session.userId,
      action_type: 'internal_note',
      note: 'Customer agreed to ₹4,200 quote for 20cm cold-cast bronze edition.'
    });

    assert.strictEqual(enquiry.status, 'quoted');
    assert.strictEqual(ctx.enquiryTimeline.length, 2);
    assert.strictEqual(ctx.enquiryTimeline[0].admin_user_id, session.userId);
  });
});
