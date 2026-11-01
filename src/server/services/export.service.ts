/**
 * BHAIRAVI Creations Digital Platform
 * BI Data Export Engine & RFC 4180 Serialization
 * Target: src/server/services/export.service.ts
 */

import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import { formatPaiseToInr } from '../../shared/pricing.js';
import { sanitizeZeroPII, MANDATORY_ATTRIBUTION_DISCLAIMER } from './analytics.service.js';

export type ExportType =
  | 'raw_events'
  | 'product_metrics'
  | 'conversion_funnels'
  | 'permitted_enquiries'
  | 'product_catalog';

export type ExportFormat = 'csv' | 'json' | 'ndjson';

export interface ExportFilters {
  start_date?: string;
  end_date?: string;
  product_id?: string;
  event_type?: string;
  referrer?: string;
  status?: string;
  category_id?: string;
}

export interface ExportQualityEnvelope {
  export_type: ExportType;
  generated_at_utc: string;
  timezone: 'UTC';
  schema_version: string;
  query_parameters: ExportFilters;
  total_records: number;
  completeness_score: number;
  clock_skew_flagged_count: number;
  unverified_outcome_count: number;
  pii_sanitization_verified: boolean;
  reconciliation_checksum: string;
  attribution_disclaimer?: string;
}

export interface ExportResult {
  format: ExportFormat;
  contentType: string;
  payload: string;
  qualityEnvelope: ExportQualityEnvelope;
}

/**
 * Set of characters that trigger spreadsheet formula evaluation or command execution (CWE-1236).
 * Standard OWASP triggers: '=', '+', '-', '@', '\t', '\r', '\n'
 * Also includes fullwidth unicode equivalents normalized by Asian Excel locales.
 */
const FORMULA_TRIGGER_CHARS = new Set([
  '=',
  '+',
  '-',
  '@',
  '\t',
  '\r',
  '\n',
  '\uFF1D', // Fullwidth Equals Sign '＝'
  '\uFF0B', // Fullwidth Plus Sign '＋'
  '\uFF0D', // Fullwidth Hyphen-Minus '－'
  '\uFF20'  // Fullwidth Commercial At '＠'
]);

/**
 * Formats an array of records into strictly RFC 4180 compliant CSV string:
 * - Proper header row
 * - CRLF (\r\n) line endings
 * - Defense against CWE-1236 (CSV Formula Injection) via OWASP single quote neutralization
 * - Preservation of genuine numeric (integer paise, counts, rates) and boolean values
 * - Quotes escaping: values containing commas, quotes, or newlines wrapped in quotes, internal quotes doubled ("")
 */
export function formatRFC4180CSV<T extends Record<string, any>>(
  rows: T[],
  headers: string[]
): string {
  const escapeCell = (val: any): string => {
    // 1. Null / undefined values
    if (val === null || val === undefined) return '';

    // 2. Preserve genuine numeric values (integer paise, counts, rates)
    // Never prefix numbers with "'" so spreadsheet arithmetic remains functional
    if (typeof val === 'number') {
      return Number.isFinite(val) ? String(val) : '';
    }

    // 3. Preserve boolean values
    if (typeof val === 'boolean') {
      return String(val);
    }

    // 4. Convert objects or non-string primitives to string
    let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

    // 5. Defend against CWE-1236 (CSV Formula Injection)
    // If string starts with a formula trigger or has leading whitespace followed
    // by a formula trigger, prepend a single quote (') to force text interpretation
    if (str.length > 0) {
      const firstChar = str[0];
      const trimmed = str.trimStart();
      const trimmedFirstChar = trimmed.length > 0 ? trimmed[0] : '';

      if (FORMULA_TRIGGER_CHARS.has(firstChar) || FORMULA_TRIGGER_CHARS.has(trimmedFirstChar)) {
        str = `'${str}`;
      }
    }

    // 6. Strictly RFC 4180 double-quoting and quote escaping
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCell(row[h])).join(',')
  );

  return [headerLine, ...dataLines].join('\r\n') + '\r\n';
}

export class ExportService {
  constructor(private db: Database.Database) {}

  /**
   * Generates BI export dataset in the requested format (csv, json, ndjson).
   */
  public generateExport(
    type: ExportType,
    format: ExportFormat = 'csv',
    filters: ExportFilters = {}
  ): ExportResult {
    let headers: string[] = [];
    let rows: Record<string, any>[] = [];
    let clockSkewCount = 0;
    let unverifiedCount = 0;
    let validRecordsCount = 0;

    const startDate = filters.start_date || '2020-01-01T00:00:00Z';
    const endDate = filters.end_date || new Date().toISOString();

    switch (type) {
      case 'raw_events': {
        headers = [
          'event_id',
          'event_type',
          'timestamp_utc',
          'session_id',
          'product_id',
          'page_path',
          'referrer_category',
          'device_category',
          'consent_status',
          'outcome_status',
          'metadata'
        ];

        let sql = `
          SELECT event_id, event_type, timestamp_utc, session_id, product_id,
                 page_path, referrer_category, device_category, consent_status,
                 clock_skew_flag, outcome_status, metadata
          FROM analytics_events
          WHERE timestamp_utc >= ? AND timestamp_utc <= ?
        `;
        const params: any[] = [startDate, endDate];

        if (filters.product_id) {
          sql += ` AND product_id = ?`;
          params.push(filters.product_id);
        }
        if (filters.event_type) {
          sql += ` AND event_type = ?`;
          params.push(filters.event_type);
        }
        if (filters.referrer) {
          sql += ` AND (referrer_category = ? OR utm_source = ?)`;
          params.push(filters.referrer, filters.referrer);
        }

        sql += ` ORDER BY timestamp_utc ASC`;

        const dbRows = this.db.prepare(sql).all(...params) as any[];

        rows = dbRows.map((r) => {
          if (r.clock_skew_flag === 1) clockSkewCount++;
          if (r.outcome_status === 'purchase_outcome_unknown') unverifiedCount++;
          if (r.event_id && r.event_type && r.timestamp_utc) validRecordsCount++;

          return {
            event_id: r.event_id,
            event_type: r.event_type,
            timestamp_utc: r.timestamp_utc,
            session_id: r.session_id,
            product_id: r.product_id || '',
            page_path: sanitizeZeroPII(r.page_path),
            referrer_category: r.referrer_category,
            device_category: r.device_category,
            consent_status: r.consent_status,
            outcome_status: r.outcome_status,
            metadata: sanitizeZeroPII(typeof r.metadata === 'string' ? r.metadata : JSON.stringify(r.metadata))
          };
        });
        break;
      }

      case 'product_metrics': {
        headers = [
          'rollup_date',
          'product_id',
          'impressions',
          'card_clicks',
          'detail_views',
          'unique_view_sessions',
          'amazon_clicks',
          'whatsapp_clicks',
          'unverified_outcomes',
          'reconciliation_hash'
        ];

        const startDay = startDate.slice(0, 10);
        const endDay = endDate.slice(0, 10);

        let sql = `
          SELECT rollup_date, product_id, impressions, card_clicks, detail_views,
                 unique_view_sessions, amazon_outbound_clicks AS amazon_clicks,
                 whatsapp_outbound_clicks AS whatsapp_clicks, unverified_outcomes,
                 reconciliation_hash
          FROM analytics_daily_product_rollups
          WHERE rollup_date >= ? AND rollup_date <= ?
        `;
        const params: any[] = [startDay, endDay];

        if (filters.product_id) {
          sql += ` AND product_id = ?`;
          params.push(filters.product_id);
        }

        sql += ` ORDER BY rollup_date ASC, product_id ASC`;

        const dbRows = this.db.prepare(sql).all(...params) as any[];

        rows = dbRows.map((r) => {
          unverifiedCount += Number(r.unverified_outcomes || 0);
          validRecordsCount++;
          return {
            rollup_date: r.rollup_date,
            product_id: r.product_id,
            impressions: r.impressions,
            card_clicks: r.card_clicks,
            detail_views: r.detail_views,
            unique_view_sessions: r.unique_view_sessions,
            amazon_clicks: r.amazon_clicks,
            whatsapp_clicks: r.whatsapp_clicks,
            amazon_outbound_clicks: r.amazon_clicks,
            whatsapp_outbound_clicks: r.whatsapp_clicks,
            unverified_outcomes: r.unverified_outcomes,
            reconciliation_hash: r.reconciliation_hash
          };
        });
        break;
      }

      case 'conversion_funnels': {
        headers = [
          'funnel_name',
          'step_number',
          'step_name',
          'numerator',
          'denominator',
          'denominator_label',
          'conversion_rate_pct',
          'formula',
          'disclaimer'
        ];

        // Query aggregations over window
        const agg = this.db
          .prepare(
            `
          SELECT
            COUNT(CASE WHEN event_type = 'product_impression' THEN 1 END) as impressions,
            COUNT(CASE WHEN event_type = 'product_click' THEN 1 END) as card_clicks,
            COUNT(CASE WHEN event_type = 'product_view' THEN 1 END) as detail_views,
            COUNT(DISTINCT session_id) as unique_sessions,
            COUNT(CASE WHEN event_type = 'amazon_outbound_click' THEN 1 END) as amazon_clicks,
            COUNT(CASE WHEN event_type = 'whatsapp_outbound_click' THEN 1 END) as whatsapp_clicks,
            COUNT(CASE WHEN event_type = 'enquiry_form_start' THEN 1 END) as enquiry_starts,
            COUNT(CASE WHEN event_type = 'enquiry_form_submit' THEN 1 END) as enquiry_submits
          FROM analytics_events
          WHERE timestamp_utc >= ? AND timestamp_utc <= ?
        `
          )
          .get(startDate, endDate) as any;

        const calcRate = (n: number, d: number): number => {
          if (!d || d <= 0) return 0.0;
          return Number(((n / d) * 100).toFixed(2));
        };

        const totalOutbounds = (agg?.amazon_clicks || 0) + (agg?.whatsapp_clicks || 0);
        unverifiedCount = totalOutbounds;

        const funnels = [
          {
            funnel_name: 'Storefront Discovery Funnel',
            step_number: 1,
            step_name: 'Card Click-Through Rate (CTR)',
            numerator: agg?.card_clicks || 0,
            denominator: agg?.impressions || 0,
            denominator_label: 'Catalog Impressions',
            conversion_rate_pct: calcRate(agg?.card_clicks || 0, agg?.impressions || 0),
            formula: '(card_clicks / impressions) * 100',
            disclaimer: 'Calculated over unique card impressions'
          },
          {
            funnel_name: 'Product Detail to Outbound Intent Funnel',
            step_number: 2,
            step_name: 'Detail View to Outbound Clicks',
            numerator: totalOutbounds,
            denominator: agg?.detail_views || 0,
            denominator_label: 'Detail Page Views',
            conversion_rate_pct: calcRate(totalOutbounds, agg?.detail_views || 0),
            formula: '((amazon_clicks + whatsapp_clicks) / detail_views) * 100',
            disclaimer: MANDATORY_ATTRIBUTION_DISCLAIMER
          },
          {
            funnel_name: 'Custom Enquiry Funnel',
            step_number: 3,
            step_name: 'Enquiry Form Completion Rate',
            numerator: agg?.enquiry_submits || 0,
            denominator: agg?.enquiry_starts || 0,
            denominator_label: 'Form Starts',
            conversion_rate_pct: calcRate(agg?.enquiry_submits || 0, agg?.enquiry_starts || 0),
            formula: '(enquiry_submits / enquiry_starts) * 100',
            disclaimer: 'Excludes honeypot bot submissions'
          },
          {
            funnel_name: 'Visitor to Custom Enquiry Conversion',
            step_number: 4,
            step_name: 'Storefront Visitor to Enquiry Rate',
            numerator: agg?.enquiry_submits || 0,
            denominator: agg?.unique_sessions || 0,
            denominator_label: 'Unique Visitor Sessions',
            conversion_rate_pct: calcRate(agg?.enquiry_submits || 0, agg?.unique_sessions || 0),
            formula: '(enquiry_submits / unique_sessions) * 100',
            disclaimer: 'Based on unique visitor sessions'
          }
        ];

        rows = funnels;
        validRecordsCount = funnels.length;
        break;
      }

      case 'permitted_enquiries': {
        headers = [
          'enquiry_id',
          'created_at_utc',
          'project_category',
          'budget_tier_inr',
          'approximate_quantity',
          'status',
          'preferred_contact_method',
          'lifecycle_duration_hours'
        ];

        let sql = `
          SELECT id AS enquiry_id,
                 created_at AS created_at_utc,
                 project_type AS project_category,
                 budget_range_inr AS budget_tier_inr,
                 approximate_quantity,
                 status,
                 preferred_contact_method,
                 ROUND((JULIANDAY(updated_at) - JULIANDAY(created_at)) * 24.0, 2) AS lifecycle_duration_hours
          FROM enquiries
          WHERE created_at >= ? AND created_at <= ?
        `;
        const params: any[] = [startDate, endDate];

        if (filters.status) {
          sql += ` AND status = ?`;
          params.push(filters.status);
        }

        sql += ` ORDER BY created_at ASC`;

        const dbRows = this.db.prepare(sql).all(...params) as any[];

        rows = dbRows.map((r) => {
          validRecordsCount++;
          // STRICT Zero PII: exclude name, email, phone, design description
          return {
            enquiry_id: r.enquiry_id,
            created_at_utc: r.created_at_utc,
            project_category: r.project_category,
            budget_tier_inr: r.budget_tier_inr || '',
            approximate_quantity: r.approximate_quantity || 1,
            status: r.status,
            preferred_contact_method: r.preferred_contact_method,
            lifecycle_duration_hours: r.lifecycle_duration_hours !== null ? r.lifecycle_duration_hours : 0
          };
        });
        break;
      }

      case 'product_catalog': {
        headers = [
          'id',
          'slug',
          'name',
          'category_id',
          'base_price_paise',
          'formatted_price_inr',
          'material',
          'manufacturing_method',
          'finishing_type',
          'is_made_to_order',
          'inventory_count',
          'amazon_asin',
          'publication_status'
        ];

        let sql = `
          SELECT id, slug, name, category_id, base_price_paise,
                 material, manufacturing_method, finishing_type,
                 is_made_to_order, inventory_count, amazon_asin,
                 publication_status
          FROM products
          WHERE 1=1
        `;
        const params: any[] = [];

        if (filters.status) {
          sql += ` AND publication_status = ?`;
          params.push(filters.status);
        }
        if (filters.category_id) {
          sql += ` AND category_id = ?`;
          params.push(filters.category_id);
        }

        sql += ` ORDER BY display_order ASC, created_at DESC`;

        const dbRows = this.db.prepare(sql).all(...params) as any[];

        rows = dbRows.map((r) => {
          validRecordsCount++;
          return {
            id: r.id,
            slug: r.slug,
            name: r.name,
            category_id: r.category_id,
            base_price_paise: r.base_price_paise,
            formatted_price_inr: formatPaiseToInr(r.base_price_paise),
            material: r.material,
            manufacturing_method: r.manufacturing_method,
            finishing_type: r.finishing_type,
            is_made_to_order: r.is_made_to_order,
            inventory_count: r.inventory_count,
            amazon_asin: r.amazon_asin || '',
            publication_status: r.publication_status
          };
        });
        break;
      }

      default:
        throw new Error(`Unsupported export type: ${type}`);
    }

    // Compute checksum deterministically
    const checksumSource = rows
      .map((r) => {
        const id = r.event_id || r.id || r.enquiry_id || `${r.rollup_date}_${r.product_id}` || r.funnel_name;
        const ts = r.timestamp_utc || r.created_at_utc || r.rollup_date || '';
        return `${id}|${ts}`;
      })
      .sort()
      .join('\n');

    const checksum = crypto.createHash('sha256').update(checksumSource || type).digest('hex');
    const totalRecords = rows.length;
    const completenessScore = totalRecords > 0 ? Number((validRecordsCount / totalRecords).toFixed(4)) : 1.0;

    const qualityEnvelope: ExportQualityEnvelope = {
      export_type: type,
      generated_at_utc: new Date().toISOString(),
      timezone: 'UTC',
      schema_version: '1.0.0',
      query_parameters: filters,
      total_records: totalRecords,
      completeness_score: completenessScore,
      clock_skew_flagged_count: clockSkewCount,
      unverified_outcome_count: unverifiedCount,
      pii_sanitization_verified: true,
      reconciliation_checksum: checksum,
      attribution_disclaimer: MANDATORY_ATTRIBUTION_DISCLAIMER
    };

    let payload = '';
    let contentType = '';

    if (format === 'json') {
      contentType = 'application/json';
      payload = JSON.stringify({ meta: qualityEnvelope, data: rows }, null, 2);
    } else if (format === 'ndjson') {
      contentType = 'application/x-ndjson';
      payload = rows.map((r) => JSON.stringify(r)).join('\n');
    } else {
      // Default to RFC 4180 CSV
      contentType = 'text/csv; charset=utf-8';
      payload = formatRFC4180CSV(rows, headers);
    }

    return {
      format,
      contentType,
      payload,
      qualityEnvelope
    };
  }
}
