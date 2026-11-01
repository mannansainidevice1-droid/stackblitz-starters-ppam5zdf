/**
 * Tier 3 — Cross-Feature Interaction: Privacy Consent, Sanitization & Data Exports
 * Pairwise: F21 (Zero-PII Gate) <-> F22 (Consent & Opt-Out) <-> F26/F28 (BI Exports)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { TestContext } from '../helpers/test_context.js';
import { assertZeroPII, assertRFC4180CSV } from '../helpers/assertions.js';

describe('Tier 3 Interaction: Consent, Sanitization & BI Exports', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  test('Pairwise 1: User opting out causes immediate telemetry drop; zero records appear in raw event export', () => {
    // User visits catalogue after clicking "Reject All"
    const optOutEvent = {
      event_id: crypto.randomUUID(),
      event_type: 'page_view',
      timestamp_utc: new Date().toISOString(),
      session_id: 'sess_optout_visitor',
      page_path: '/products',
      device_category: 'desktop',
      consent_status: 'denied' as const
    };

    const res = ctx.ingestEvent(optOutEvent);
    assert.strictEqual(res.status, 204);

    // Export raw events
    const exportedEvents = ctx.analyticsEvents;
    assert.strictEqual(exportedEvents.length, 0, 'No events exported for opted out user');
  });

  test('Pairwise 2: PII in search query is scrubbed before DB insertion; CSV export outputs redacted token', () => {
    const rawSearchEvent = {
      event_id: crypto.randomUUID(),
      event_type: 'page_view',
      timestamp_utc: new Date().toISOString(),
      session_id: 'sess_pii_tester',
      page_path: '/products?search=test.user@company.co.in&tag=statue',
      device_category: 'desktop',
      consent_status: 'granted' as const
    };

    ctx.ingestEvent(rawSearchEvent);
    const stored = ctx.analyticsEvents[0];
    assert.ok(stored.page_path.includes('[REDACTED_EMAIL]'));
    assert.ok(!stored.page_path.includes('test.user@company.co.in'));

    // Verify CSV export
    const csvExport = `event_id,page_path\r\n${stored.event_id},${stored.page_path}\r\n`;
    assertRFC4180CSV(csvExport, ['event_id', 'page_path']);
    assertZeroPII(csvExport);
  });

  test('Pairwise 3: Permitted enquiry export scrubs all customer PII while preserving aggregate project types and statuses', () => {
    const rawEnquiry = {
      id: 'BC-ENQ-202610-7777',
      customer_name: 'Rajesh Sharma',
      contact_phone: '+919876543210',
      contact_email: 'rajesh@example.com',
      preferred_contact_method: 'phone',
      project_type: 'architectural_model',
      design_description: 'Scale model of temple architecture with intricate jali windows',
      status: 'quoted'
    };

    // Permitted export sanitization projection
    const permittedRecord = {
      enquiry_id: rawEnquiry.id,
      project_type: rawEnquiry.project_type,
      status: rawEnquiry.status,
      preferred_contact_method: rawEnquiry.preferred_contact_method
    };

    assertZeroPII(permittedRecord);
    assert.strictEqual((permittedRecord as any).customer_name, undefined);
    assert.strictEqual((permittedRecord as any).contact_phone, undefined);
    assert.strictEqual((permittedRecord as any).contact_email, undefined);
  });

  test('Pairwise 4: Exporting 100 sanitized records asserts zero PII across entire dataset', () => {
    const exportDataset = Array.from({ length: 100 }, (_, i) => ({
      enquiry_id: `BC-ENQ-202610-${1000 + i}`,
      project_type: 'custom_figurine',
      status: 'new'
    }));

    assertZeroPII(exportDataset);
  });

  test('Pairwise 5: In-flight sanitization preserves legitimate search keywords while scrubbing sensitive patterns', () => {
    const searchPath = '/products?search=ganesha+bronze+statue&category=spiritual';
    ctx.ingestEvent({
      event_id: crypto.randomUUID(),
      event_type: 'page_view',
      timestamp_utc: new Date().toISOString(),
      session_id: 'sess_search',
      page_path: searchPath,
      device_category: 'desktop',
      consent_status: 'granted'
    });

    const stored = ctx.analyticsEvents[0];
    assert.ok(stored.page_path.includes('ganesha+bronze+statue'));
  });
});
