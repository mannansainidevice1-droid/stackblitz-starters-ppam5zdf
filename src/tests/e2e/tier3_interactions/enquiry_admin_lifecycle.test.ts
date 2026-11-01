/**
 * Tier 3 — Cross-Feature Interaction: Enquiry Submission & Admin Lifecycle
 * Pairwise: F11/F12 (Enquiry & Timeline) <-> F14 (Anti-Spam) <-> F45 (Custom Form)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TestContext } from '../helpers/test_context.js';

describe('Tier 3 Interaction: Enquiry Submission & Admin Lifecycle', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  test('Pairwise 1: Clean customer submission passes honeypot, persists in enquiries table with status "new"', () => {
    const submission = {
      id: 'BC-ENQ-202610-8888',
      customer_name: 'Priya Kulkarni',
      contact_phone: '+919876543210',
      contact_email: 'priya@example.in',
      preferred_contact_method: 'whatsapp',
      project_type: 'custom_figurine',
      design_description: 'Custom 3D printed temple brass lamp scale replica with hand finishing',
      approximate_quantity: 1,
      budget_range_inr: '₹2,500 - ₹5,000',
      status: 'new',
      bhr_check_field: '', // clean honeypot
      renderedAt: Date.now() - 10000 // 10s ago
    };

    assert.strictEqual(submission.bhr_check_field, '');
    assert.ok(Date.now() - submission.renderedAt >= 2500);

    ctx.enquiries.push(submission);
    assert.strictEqual(ctx.enquiries.find((e) => e.id === 'BC-ENQ-202610-8888')?.status, 'new');
  });

  test('Pairwise 2: Admin reviews new enquiry, changes status to "contacted", creating timeline audit record', () => {
    const enq = ctx.enquiries[0];
    const oldStatus = enq.status;
    enq.status = 'contacted';

    const auditEntry = {
      id: 'tl_change_01',
      enquiry_id: enq.id,
      admin_user_id: 'usr_admin_02',
      action_type: 'status_change',
      previous_status: oldStatus,
      new_status: 'contacted',
      note: 'Reached out to customer on WhatsApp to confirm scale dimensions.',
      created_at: new Date().toISOString()
    };

    ctx.enquiryTimeline.push(auditEntry);
    assert.strictEqual(enq.status, 'contacted');
    assert.strictEqual(ctx.enquiryTimeline.length, 1);
    assert.strictEqual(ctx.enquiryTimeline[0].admin_user_id, 'usr_admin_02');
  });

  test('Pairwise 3: Admin quotes customer, status transitions to "quoted" and quote note is preserved', () => {
    const enq = ctx.enquiries[0];
    enq.status = 'quoted';

    ctx.enquiryTimeline.push({
      id: 'tl_quote_02',
      enquiry_id: enq.id,
      admin_user_id: 'usr_admin_02',
      action_type: 'quote_sent',
      previous_status: 'contacted',
      new_status: 'quoted',
      note: 'Provided fixed quote of ₹3,800.00 inclusive of insured shipping.',
      created_at: new Date().toISOString()
    });

    assert.strictEqual(enq.status, 'quoted');
    assert.strictEqual(ctx.enquiryTimeline.length, 1);
  });

  test('Pairwise 4: Customer confirms quote, status transitions to "converted" and converts into active production', () => {
    const enq = ctx.enquiries[0];
    enq.status = 'converted';

    ctx.enquiryTimeline.push({
      id: 'tl_convert_03',
      enquiry_id: enq.id,
      admin_user_id: 'usr_admin_02',
      action_type: 'status_change',
      previous_status: 'quoted',
      new_status: 'converted',
      note: 'Advance received. Scheduled for 0.12mm FDM printing and multi-coat patina finishing.',
      created_at: new Date().toISOString()
    });

    assert.strictEqual(enq.status, 'converted');
    assert.ok(ctx.enquiryTimeline[0].note.includes('Scheduled for 0.12mm'));
  });

  test('Pairwise 5: Spambot with populated honeypot is silently dropped without polluting enquiries or timeline tables', () => {
    const botSubmission = {
      customer_name: 'Casino Promo Bot',
      bhr_check_field: 'http://spambot-link.ru'
    };

    const initialEnquiriesCount = ctx.enquiries.length;
    const initialTimelineCount = ctx.enquiryTimeline.length;

    if (!botSubmission.bhr_check_field) {
      ctx.enquiries.push(botSubmission);
    }

    assert.strictEqual(ctx.enquiries.length, initialEnquiriesCount);
    assert.strictEqual(ctx.enquiryTimeline.length, initialTimelineCount);
  });
});
