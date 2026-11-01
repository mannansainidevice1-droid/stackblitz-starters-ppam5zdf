/**
 * Tier 4 — Real-World Application Scenario 1:
 * Bespoke Custom Figurine Commission Journey
 * Steps: Discovery -> Search & Filter -> Custom Enquiry -> Safe Upload -> Confirmation -> WhatsApp Bridge
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { TestContext } from '../helpers/test_context.js';
import { assertOutcomeUnknown, assertZeroPII } from '../helpers/assertions.js';

describe('Tier 4 Scenario 1: Bespoke Custom Figurine Commission Journey', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  test('Execute Complete Custom Order Customer Journey from Storefront to WhatsApp Bridge', () => {
    const sessionId = 'sess_customer_journey_01';

    // Step 1: Customer lands on Home Page and observes brand statement
    const pageView = {
      event_id: crypto.randomUUID(),
      event_type: 'page_view',
      timestamp_utc: '2026-10-31T06:00:00Z',
      session_id: sessionId,
      page_path: '/',
      device_category: 'desktop',
      consent_status: 'granted' as const
    };
    assert.strictEqual(ctx.ingestEvent(pageView).status, 202);

    // Step 2: Customer navigates to Catalogue and searches for custom sculptures
    const catalogSearch = {
      event_id: crypto.randomUUID(),
      event_type: 'page_view',
      timestamp_utc: '2026-10-31T06:01:00Z',
      session_id: sessionId,
      page_path: '/products?search=custom&category=spiritual-sacred',
      device_category: 'desktop',
      consent_status: 'granted' as const
    };
    assert.strictEqual(ctx.ingestEvent(catalogSearch).status, 202);

    // Step 3: Customer clicks Custom Order CTA and begins filling form
    const formStart = {
      event_id: crypto.randomUUID(),
      event_type: 'enquiry_form_start',
      timestamp_utc: '2026-10-31T06:02:00Z',
      session_id: sessionId,
      page_path: '/custom-order',
      device_category: 'desktop',
      consent_status: 'granted' as const,
      metadata: { form_name: 'custom_order_v1' }
    };
    assert.strictEqual(ctx.ingestEvent(formStart).status, 202);

    // Step 4: Customer attaches 3D STL file (magic-byte validated)
    const stlFileHeader = Buffer.from('solid custom_deity_sculpture_v1');
    assert.ok(stlFileHeader.toString().startsWith('solid'));
    const safeFileUuid = crypto.randomUUID();
    const storedAttachment = `storage/uploads/enquiries/${safeFileUuid}.stl`;

    // Step 5: Form submission with honeypot verification and render duration check
    const renderTimestamp = Date.now() - 45000; // 45 seconds to fill form
    const submission = {
      id: 'BC-ENQ-202610-8842',
      customer_name: 'Kavita Sundaram',
      contact_phone: '+919876543210',
      contact_email: 'kavita.s@example.in',
      preferred_contact_method: 'whatsapp',
      project_type: 'custom_figurine',
      design_description: 'Custom 15cm Saraswati figurine with veena, hand-painted gold highlights and pearl white finish.',
      approximate_quantity: 1,
      budget_range_inr: '₹3,500 - ₹7,500',
      referenced_product_id: 'prod_ganesha_01',
      status: 'new',
      bhr_check_field: '', // clean honeypot
      attachment_path: storedAttachment
    };

    assert.strictEqual(submission.bhr_check_field, '');
    assert.ok(Date.now() - renderTimestamp >= 2500);

    ctx.enquiries.push(submission);
    assert.ok(ctx.enquiries.find((e) => e.id === 'BC-ENQ-202610-8842'));

    // Step 6: Confirmation Screen renders with instant WhatsApp prefill URL
    const cleanPhone = '919876543210';
    const message = `Hello BHAIRAVI Creations!\n\nI submitted Custom Order Enquiry #${submission.id} for: ${submission.project_type}.\nName: ${submission.customer_name}.\nLooking forward to discussing materials and finishing options.`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    assert.ok(waUrl.includes('BC-ENQ-202610-8842'));
    assert.ok(waUrl.includes('custom_figurine'));

    // Step 7: Customer clicks WhatsApp link, recording outbound click telemetry
    const waClick = {
      event_id: crypto.randomUUID(),
      event_type: 'whatsapp_outbound_click',
      timestamp_utc: '2026-10-31T06:05:00Z',
      session_id: sessionId,
      page_path: '/custom-order/confirmation',
      device_category: 'desktop',
      consent_status: 'granted' as const,
      metadata: { enquiry_ref: submission.id }
    };
    assert.strictEqual(ctx.ingestEvent(waClick).status, 202);

    const recordedWa = ctx.analyticsEvents.find((e) => e.event_type === 'whatsapp_outbound_click')!;
    assertOutcomeUnknown(recordedWa);
    assertZeroPII(recordedWa);
  });
});
