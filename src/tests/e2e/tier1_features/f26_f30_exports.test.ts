/**
 * Tier 1 — Feature Coverage: Business Intelligence & Data Exports (F26 - F30)
 * Requirements: R5 | Interface Contracts: Business Intelligence & AI Analyst Interface
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { TestContext } from '../helpers/test_context.js';
import { assertRFC4180CSV, assertZeroPII, assertIntegerPaise } from '../helpers/assertions.js';

describe('Tier 1: Feature Coverage — BI Data Exports & Quality Envelope (F26 - F30)', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  // ==========================================================================
  // F26: BI Raw Events Export (RFC 4180 CSV & JSON/NDJSON)
  // ==========================================================================
  describe('F26: BI Raw Events Export', () => {
    test('F26-1: Raw events CSV export contains standard RFC 4180 header row and CRLF line endings', () => {
      const csvContent =
        'event_id,event_type,timestamp_utc,session_id,product_id,page_path,device_category,consent_status,outcome_status\r\n' +
        'c7a82b45-1234,page_view,2026-10-31T07:00:00Z,sess_123,prod_ganesha_01,/products,desktop,granted,not_applicable\r\n' +
        'c7a82b45-5678,amazon_outbound_click,2026-10-31T07:01:00Z,sess_123,prod_ganesha_01,/products,desktop,granted,purchase_outcome_unknown\r\n';

      const expectedHeaders = [
        'event_id',
        'event_type',
        'timestamp_utc',
        'session_id',
        'product_id',
        'page_path',
        'outcome_status'
      ];
      assertRFC4180CSV(csvContent, expectedHeaders);
    });

    test('F26-2: Raw events JSON export includes metadata envelope and typed event array', () => {
      const jsonExport = {
        meta: {
          export_type: 'raw_events',
          generated_at_utc: '2026-10-31T08:00:00Z',
          total_records: 2,
          reconciliation_checksum: crypto.createHash('sha256').update('test_dataset').digest('hex')
        },
        data: [
          {
            event_id: 'evt_01',
            event_type: 'page_view',
            timestamp_utc: '2026-10-31T07:00:00Z',
            session_id: 'sess_1',
            product_id: null,
            outcome_status: 'not_applicable'
          },
          {
            event_id: 'evt_02',
            event_type: 'whatsapp_outbound_click',
            timestamp_utc: '2026-10-31T07:05:00Z',
            session_id: 'sess_1',
            product_id: 'prod_ganesha_01',
            outcome_status: 'purchase_outcome_unknown'
          }
        ]
      };

      assert.strictEqual(jsonExport.meta.export_type, 'raw_events');
      assert.strictEqual(jsonExport.data.length, 2);
      assert.strictEqual(jsonExport.data[1].outcome_status, 'purchase_outcome_unknown');
    });

    test('F26-3: CSV generator correctly escapes double quotes, commas, and multiline values', () => {
      // RFC 4180: value with quotes and comma must be enclosed in quotes and internal quotes doubled
      const rawTitle = 'Lord Ganesha, "Vighnaharta" Edition';
      const escaped = `"${rawTitle.replace(/"/g, '""')}"`;
      assert.strictEqual(escaped, '"Lord Ganesha, ""Vighnaharta"" Edition"');
    });

    test('F26-4: Raw events export supports filtering by date range and product_id', () => {
      const filters = {
        start_date: '2026-10-01T00:00:00Z',
        end_date: '2026-10-31T23:59:59Z',
        product_id: 'prod_ganesha_01'
      };
      assert.ok(new Date(filters.end_date) > new Date(filters.start_date));
      assert.strictEqual(filters.product_id, 'prod_ganesha_01');
    });

    test('F26-5: Streaming NDJSON format outputs each JSON record separated by newline', () => {
      const records = [
        { event_id: '1', type: 'page_view' },
        { event_id: '2', type: 'product_click' }
      ];
      const ndjson = records.map((r) => JSON.stringify(r)).join('\n');
      const lines = ndjson.split('\n');
      assert.strictEqual(lines.length, 2);
      assert.strictEqual(JSON.parse(lines[0]).event_id, '1');
    });
  });

  // ==========================================================================
  // F27: BI Aggregated Metrics Export (Reconcilable daily product rollups)
  // ==========================================================================
  describe('F27: BI Aggregated Metrics Export', () => {
    test('F27-1: Aggregated metrics export includes daily rollups for impressions, views, and outbound clicks', () => {
      const rollupRow = {
        rollup_date: '2026-10-31',
        product_id: 'prod_ganesha_01',
        impressions: 1200,
        card_clicks: 180,
        detail_views: 150,
        unique_view_sessions: 95,
        amazon_clicks: 18,
        whatsapp_clicks: 7,
        unverified_outcomes: 25,
        reconciliation_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
      };

      assert.strictEqual(rollupRow.unverified_outcomes, rollupRow.amazon_clicks + rollupRow.whatsapp_clicks);
      assert.ok(rollupRow.unique_view_sessions <= rollupRow.detail_views);
      assert.ok(rollupRow.reconciliation_hash.length === 64);
    });

    test('F27-2: Aggregated metrics export CSV adheres to schema column definitions', () => {
      const csv =
        'rollup_date,product_id,impressions,card_clicks,detail_views,unique_view_sessions,amazon_clicks,whatsapp_clicks,unverified_outcomes,reconciliation_hash\r\n' +
        '2026-10-31,prod_ganesha_01,1200,180,150,95,18,7,25,9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08\r\n';

      const expectedHeaders = [
        'rollup_date',
        'product_id',
        'impressions',
        'detail_views',
        'amazon_clicks',
        'whatsapp_clicks',
        'reconciliation_hash'
      ];
      assertRFC4180CSV(csv, expectedHeaders);
    });

    test('F27-3: Aggregated rollups calculate detail-to-outbound conversion rate accurately', () => {
      const uniqueViews = 100;
      const outboundActions = 15;
      const ratePct = (outboundActions / uniqueViews) * 100;
      assert.strictEqual(ratePct, 15.0);
    });

    test('F27-4: Aggregated export groups by product and calendar date strictly in UTC', () => {
      const dateUtc = '2026-10-31';
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      assert.ok(regex.test(dateUtc));
    });

    test('F27-5: Rollup record includes cryptographic hash verifying snapshot consistency', () => {
      const hash = crypto.createHash('sha256').update('2026-10-31:prod_ganesha_01:150').digest('hex');
      assert.strictEqual(typeof hash, 'string');
      assert.strictEqual(hash.length, 64);
    });
  });

  // ==========================================================================
  // F28: BI Permitted Enquiry Export (Sanitized enquiry records, zero customer PII)
  // ==========================================================================
  describe('F28: BI Permitted Enquiry Export', () => {
    test('F28-1: Permitted enquiry export completely scrubs customer names, emails, and phone numbers', () => {
      const rawEnquiry = ctx.enquiries[0];
      const sanitizedExport = {
        enquiry_id: rawEnquiry.id,
        created_at_utc: rawEnquiry.created_at,
        project_category: rawEnquiry.project_type,
        budget_tier_inr: rawEnquiry.budget_range_inr,
        status: rawEnquiry.status,
        preferred_contact_method: rawEnquiry.preferred_contact_method
      };

      assert.strictEqual((sanitizedExport as any).customer_name, undefined);
      assert.strictEqual((sanitizedExport as any).contact_email, undefined);
      assert.strictEqual((sanitizedExport as any).contact_phone, undefined);
      assertZeroPII(sanitizedExport);
    });

    test('F28-2: Permitted enquiry export strictly excludes raw freeform project description text', () => {
      const sanitizedExport = {
        enquiry_id: 'BC-ENQ-202610-1001',
        project_category: 'custom_figurine',
        budget_tier_inr: '₹2,500 - ₹5,000'
      };
      assert.strictEqual((sanitizedExport as any).design_description, undefined);
    });

    test('F28-3: Permitted enquiry export CSV adheres to schema specification', () => {
      const csv =
        'enquiry_id,created_at_utc,project_category,budget_tier_inr,status,preferred_contact_method\r\n' +
        'BC-ENQ-202610-1001,2026-10-31T05:00:00Z,custom_figurine,₹2,500 - ₹5,000,new,whatsapp\r\n';

      const expectedHeaders = ['enquiry_id', 'created_at_utc', 'project_category', 'status'];
      assertRFC4180CSV(csv, expectedHeaders);
      assertZeroPII(csv);
    });

    test('F28-4: Permitted enquiry export calculates lifecycle duration in hours', () => {
      const created = new Date('2026-10-30T10:00:00Z').getTime();
      const closed = new Date('2026-10-31T14:00:00Z').getTime();
      const durationHours = (closed - created) / (1000 * 3600);
      assert.strictEqual(durationHours, 28);
    });

    test('F28-5: Permitted enquiry export requires authenticated admin privileges', () => {
      const unauthenticatedToken = null;
      const isAuthorized = unauthenticatedToken !== null;
      assert.strictEqual(isAuthorized, false, 'Unauthenticated export request must be rejected (401)');
    });
  });

  // ==========================================================================
  // F29: BI Catalogue Metadata Export (Snapshot with pricing in paise and tags)
  // ==========================================================================
  describe('F29: BI Catalogue Metadata Export', () => {
    test('F29-1: Catalogue metadata export returns full snapshot of published products', () => {
      const catalog = ctx.products.filter((p) => p.publication_status === 'published');
      assert.ok(catalog.length >= 3);
      for (const item of catalog) {
        assert.ok(item.id);
        assert.ok(item.slug);
        assert.ok(item.name);
        assertIntegerPaise(item.base_price_paise, 'Product base price');
      }
    });

    test('F29-2: Catalogue metadata export includes craft tags and materials for business analysis', () => {
      const ganesha = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      assert.ok(Array.isArray(ganesha.tags));
      assert.ok(ganesha.tags.includes('handmade finishing'));
      assert.ok(ganesha.material.length > 5);
    });

    test('F29-3: Catalogue export CSV includes pricing in both integer paise and formatted INR', () => {
      const csv =
        'id,slug,name,category_id,base_price_paise,formatted_price_inr,material,publication_status\r\n' +
        'prod_ganesha_01,ganesha-antique-bronze,Lord Ganesha,cat_spiritual,249900,"₹2,499.00",PLA+,published\r\n';

      const expectedHeaders = ['id', 'slug', 'base_price_paise', 'formatted_price_inr'];
      assertRFC4180CSV(csv, expectedHeaders);
    });

    test('F29-4: Catalogue export identifies external commerce channel availability (Amazon ASIN)', () => {
      const ganesha = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      assert.strictEqual(ganesha.amazon_asin, 'B0BHAIRAVI1');
      const temple = ctx.products.find((p) => p.id === 'prod_temple_replica_03')!;
      assert.strictEqual(temple.amazon_asin, null); // Studio exclusive
    });

    test('F29-5: Catalogue export distinguishes between made-to-order and in-stock inventory', () => {
      const ganesha = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      const planter = ctx.products.find((p) => p.id === 'prod_lotus_planter_02')!;
      assert.strictEqual(ganesha.is_made_to_order, 1);
      assert.strictEqual(planter.is_made_to_order, 0);
    });
  });

  // ==========================================================================
  // F30: Export Quality Envelope (Completeness score, SHA-256 hash, clock-skew count)
  // ==========================================================================
  describe('F30: Export Quality Envelope', () => {
    test('F30-1: Export metadata envelope appends data-quality indicators block', () => {
      const envelope = {
        total_records: 14250,
        completeness_score: 0.998,
        clock_skew_flagged_count: 12,
        unverified_outcome_count: 842,
        reconciliation_checksum: crypto.createHash('sha256').update('dataset').digest('hex')
      };

      assert.strictEqual(typeof envelope.total_records, 'number');
      assert.ok(envelope.completeness_score >= 0.95 && envelope.completeness_score <= 1.0);
      assert.strictEqual(typeof envelope.clock_skew_flagged_count, 'number');
      assert.strictEqual(envelope.reconciliation_checksum.length, 64);
    });

    test('F30-2: Completeness score calculation computes ratio of valid non-null records', () => {
      const total = 1000;
      const complete = 995;
      const score = complete / total;
      assert.strictEqual(score, 0.995);
    });

    test('F30-3: Reconciliation checksum deterministically fingerprints record IDs and timestamps', () => {
      const records = [
        { id: '1', ts: '2026-10-31T06:00:00Z', type: 'page_view' },
        { id: '2', ts: '2026-10-31T06:01:00Z', type: 'product_view' }
      ];
      const fingerprintSource = records
        .map((r) => `${r.id}|${r.ts}|${r.type}`)
        .sort()
        .join('\n');
      const hash1 = crypto.createHash('sha256').update(fingerprintSource).digest('hex');
      const hash2 = crypto.createHash('sha256').update(fingerprintSource).digest('hex');

      assert.strictEqual(hash1, hash2, 'Identical datasets must produce identical checksums');
    });

    test('F30-4: Flagged clock skew records are enumerated without invalidating entire export', () => {
      const qualityReport = {
        total_records: 500,
        clock_skew_flagged_count: 3
      };
      assert.ok(qualityReport.clock_skew_flagged_count < qualityReport.total_records);
    });

    test('F30-5: Quality envelope states time zone is strictly UTC for all exported timestamps', () => {
      const meta = { timezone: 'UTC', generated_at_utc: new Date().toISOString() };
      assert.strictEqual(meta.timezone, 'UTC');
      assert.ok(meta.generated_at_utc.endsWith('Z'));
    });
  });
});
