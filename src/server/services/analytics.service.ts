/**
 * BHAIRAVI Creations Digital Platform
 * First-Party Telemetry & Analytics Ingestion Service
 * Target: src/server/services/analytics.service.ts
 */

import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import {
  AnalyticsEventType,
  ReferrerCategory,
  DeviceCategory,
  ConsentStatus,
  OutcomeStatus,
  DailyProductRollupRecord
} from '../../shared/types.js';

export const CORE_EVENT_TYPES: readonly AnalyticsEventType[] = [
  'page_view',
  'product_impression',
  'product_click',
  'product_view',
  'product_image_interaction',
  'customization_interaction',
  'amazon_outbound_click',
  'whatsapp_outbound_click',
  'enquiry_form_start',
  'enquiry_form_submit',
  'add_to_cart',
  'checkout_start',
  'purchase'
] as const;

export const MANDATORY_ATTRIBUTION_DISCLAIMER =
  "Outbound Amazon and WhatsApp clicks represent high purchase intent; final checkout happens externally and is classified as 'Purchase Outcome Unknown'.";

export interface IngestEventPayload {
  event_id?: string;
  event_type?: string;
  timestamp_utc?: string;
  session_id?: string;
  product_id?: string | null;
  page_path?: string;
  referrer_category?: ReferrerCategory;
  utm_parameters?: {
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_term?: string | null;
    utm_content?: string | null;
    campaign_source?: string | null;
    campaign_medium?: string | null;
    campaign_name?: string | null;
    campaign_term?: string | null;
    campaign_content?: string | null;
  };
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  campaign_source?: string | null;
  campaign_medium?: string | null;
  campaign_name?: string | null;
  campaign_term?: string | null;
  campaign_content?: string | null;
  device_category?: DeviceCategory;
  consent_status?: ConsentStatus;
  metadata?: Record<string, any>;
  outcome_status?: string;
}

export interface IngestionResult {
  status: 202 | 204 | 400 | 403 | 413 | 422 | 429;
  success?: boolean;
  event_id?: string;
  ingested_count?: number;
  message?: string;
  error?: string;
}

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * Matches standard and URL-encoded email addresses:
 * - Local part allows standard chars plus %2B for encoded '+'
 * - Separator allows '@' or '%40' (case-insensitive)
 * - Domain and TLD standard formats
 */
const EMAIL_REGEX = /(?:[a-zA-Z0-9_.+-]|%2[bB])+(?:@|%40)[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gi;

/**
 * Matches Indian mobile numbers (10 digits starting with 6, 7, 8, or 9) across:
 * - Prefixes: +91, 91, (+91), (91), 0, (0), +91 (0), (+91)(0), etc.
 * - Separators: spaces, hyphens, dots
 * - Internal bracketed codes: (98765) 43210, (987) 654-3210, (9876) 543210, (9876543210)
 * - Boundary assertions: (?<!\d) and (?!\d) to avoid truncating longer numerical IDs
 */
const INDIAN_PHONE_REGEX =
  /(?<!\d)(?:(?:\+?91|\(\+?91\))[\s\.\-]*(?:\(0\)|0)?|(?:\(0\)|0))?[\s\.\-]*(?:\([6-9]\d{2}\)(?:[\s\.\-]?\d){7}|\([6-9]\d{3}\)(?:[\s\.\-]?\d){6}|\([6-9]\d{4}\)(?:[\s\.\-]?\d){5}|\(?[6-9](?:[\s\.\-]?\d){9}\)?)(?!\d)/g;

const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;

/**
 * Recursively sanitizes any string or nested object/array against customer PII.
 * Handles emails (standard & URL-encoded %40), Indian phone numbers (prefixes +91, 0, (0), (+91),
 * dot/hyphen/space delimiters, and bracketed sub-groups), credit cards, and sensitive keys.
 */
export function sanitizeZeroPII(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    let sanitized = val
      .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
      .replace(INDIAN_PHONE_REGEX, '[REDACTED_PHONE]')
      .replace(CREDIT_CARD_REGEX, '[REDACTED_CC]');

    // Second pass for URL-encoded content if '%' remains in string
    if (sanitized.includes('%')) {
      try {
        const decoded = decodeURIComponent(sanitized);
        if (decoded !== sanitized) {
          const resanitized = decoded
            .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
            .replace(INDIAN_PHONE_REGEX, '[REDACTED_PHONE]')
            .replace(CREDIT_CARD_REGEX, '[REDACTED_CC]');
          if (resanitized !== decoded) {
            sanitized = resanitized;
          }
        }
      } catch {
        // Fallback for malformed URI encoding: safe partial replace
        const partiallyDecoded = sanitized.replace(/%40/gi, '@').replace(/%2b/gi, '+');
        if (partiallyDecoded !== sanitized) {
          sanitized = partiallyDecoded
            .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
            .replace(INDIAN_PHONE_REGEX, '[REDACTED_PHONE]')
            .replace(CREDIT_CARD_REGEX, '[REDACTED_CC]');
        }
      }
    }

    return sanitized;
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeZeroPII(item));
  }
  if (typeof val === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (/password|secret|token|hash|card_number|cvv/i.test(k) && typeof v === 'string') {
        cleanObj[k] = '[REDACTED]';
      } else {
        cleanObj[k] = sanitizeZeroPII(v);
      }
    }
    return cleanObj;
  }
  return val;
}

export class AnalyticsService {
  constructor(private db: Database.Database) {}

  /**
   * Validates a single event payload and returns sanitized/normalized values or an error.
   */
  public validateEvent(
    payload: IngestEventPayload,
    isPrivileged: boolean = false,
    dntHeader?: string
  ): { errorStatus?: number; error?: string; normalized?: any; dropDueToOptOut?: boolean } {
    // 1. Required fields check
    const required = [
      'event_id',
      'event_type',
      'timestamp_utc',
      'session_id',
      'page_path',
      'device_category',
      'consent_status'
    ];
    for (const field of required) {
      if (!(payload as any)[field]) {
        return { errorStatus: 422, error: `Missing required field: ${field}` };
      }
    }

    const eventId = String(payload.event_id).trim();
    if (!UUID_V4_REGEX.test(eventId)) {
      return { errorStatus: 422, error: 'Unprocessable Entity: event_id must be a valid UUID v4' };
    }

    const rawEventType = String(payload.event_type).trim().toLowerCase();

    // 2. Privileged Event Shield: Client is forbidden from emitting "purchase" directly
    if (rawEventType === 'purchase' && !isPrivileged) {
      return {
        errorStatus: 403,
        error: 'PrivilegedEventError: Client is not authorized to emit purchase events directly.'
      };
    }

    // 3. Taxonomy whitelist check (13 core events)
    if (!CORE_EVENT_TYPES.includes(rawEventType as AnalyticsEventType)) {
      return {
        errorStatus: 422,
        error: `Unprocessable Entity: Unknown or unsupported event_type: ${payload.event_type}`
      };
    }

    // 4. Consent Opt-Out Check (DPDP)
    const consentStatus = String(payload.consent_status).trim().toLowerCase() as ConsentStatus;
    if (dntHeader === '1' || consentStatus === 'denied') {
      return { dropDueToOptOut: true };
    }

    // 5. Clock-skew evaluation (drift against server UTC)
    const clientTime = Date.parse(payload.timestamp_utc!);
    if (Number.isNaN(clientTime)) {
      return { errorStatus: 422, error: 'ClockSkewError: Malformed or unparseable timestamp_utc' };
    }

    const now = Date.now();
    const driftMs = Math.abs(now - clientTime);

    if (driftMs > 86400000) {
      // > 24 hours drift
      return { errorStatus: 422, error: 'ClockSkewError: Timestamp drift exceeds allowable 24h limit.' };
    }

    const clockSkewFlag = driftMs > 300000 ? 1 : 0; // > 300 seconds

    // 6. Zero-PII sanitization
    const sanitizedPagePath = sanitizeZeroPII(payload.page_path);
    const sanitizedMetadata = sanitizeZeroPII(payload.metadata || {});

    // 7. Attribution Integrity Mandate
    let outcomeStatus: OutcomeStatus = 'not_applicable';
    if (rawEventType === 'amazon_outbound_click' || rawEventType === 'whatsapp_outbound_click') {
      outcomeStatus = 'purchase_outcome_unknown';
    } else if (rawEventType === 'purchase' && isPrivileged) {
      outcomeStatus = 'verified_purchase';
    }

    // UTMS & Campaign Parameters with Zero-PII Sanitization
    const rawUtmSource =
      payload.utm_source ??
      payload.utm_parameters?.utm_source ??
      (payload as any).campaign_source ??
      payload.utm_parameters?.campaign_source ??
      null;

    const rawUtmMedium =
      payload.utm_medium ??
      payload.utm_parameters?.utm_medium ??
      (payload as any).campaign_medium ??
      payload.utm_parameters?.campaign_medium ??
      null;

    const rawUtmCampaign =
      payload.utm_campaign ??
      payload.utm_parameters?.utm_campaign ??
      (payload as any).campaign_name ??
      payload.utm_parameters?.campaign_name ??
      (payload as any).campaign ??
      null;

    const rawUtmTerm =
      payload.utm_term ??
      payload.utm_parameters?.utm_term ??
      (payload as any).campaign_term ??
      payload.utm_parameters?.campaign_term ??
      null;

    const rawUtmContent =
      payload.utm_content ??
      payload.utm_parameters?.utm_content ??
      (payload as any).campaign_content ??
      payload.utm_parameters?.campaign_content ??
      null;

    const utmSource = rawUtmSource !== null ? sanitizeZeroPII(String(rawUtmSource).trim()) : null;
    const utmMedium = rawUtmMedium !== null ? sanitizeZeroPII(String(rawUtmMedium).trim()) : null;
    const utmCampaign = rawUtmCampaign !== null ? sanitizeZeroPII(String(rawUtmCampaign).trim()) : null;
    const utmTerm = rawUtmTerm !== null ? sanitizeZeroPII(String(rawUtmTerm).trim()) : null;
    const utmContent = rawUtmContent !== null ? sanitizeZeroPII(String(rawUtmContent).trim()) : null;

    const normalized = {
      event_id: eventId,
      event_type: rawEventType,
      timestamp_utc: new Date(clientTime).toISOString(),
      received_at_utc: new Date(now).toISOString(),
      session_id: String(payload.session_id).trim(),
      product_id: (() => {
        if (!payload.product_id) return null;
        const trimmed = String(payload.product_id).trim();
        const exists = this.db.prepare('SELECT 1 FROM products WHERE id = ?').get(trimmed);
        return exists ? trimmed : null;
      })(),
      page_path: sanitizedPagePath,
      referrer_category: payload.referrer_category || 'direct',
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_term: utmTerm,
      utm_content: utmContent,
      device_category: payload.device_category || 'unknown',
      consent_status: consentStatus,
      clock_skew_flag: clockSkewFlag,
      outcome_status: outcomeStatus,
      metadata: JSON.stringify(sanitizedMetadata)
    };

    return { normalized };
  }

  /**
   * Ingests a single client telemetry event.
   */
  public ingestEvent(
    payload: IngestEventPayload,
    isPrivileged: boolean = false,
    dntHeader?: string
  ): IngestionResult {
    const validation = this.validateEvent(payload, isPrivileged, dntHeader);

    if (validation.errorStatus) {
      return { status: validation.errorStatus as any, error: validation.error };
    }

    if (validation.dropDueToOptOut) {
      return { status: 204, message: 'Telemetry dropped per user opt-out' };
    }

    const n = validation.normalized;

    const insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO analytics_events (
        event_id, event_type, timestamp_utc, received_at_utc, session_id,
        product_id, page_path, referrer_category, utm_source, utm_medium,
        utm_campaign, utm_term, utm_content, device_category, consent_status,
        clock_skew_flag, outcome_status, metadata
      ) VALUES (
        :event_id, :event_type, :timestamp_utc, :received_at_utc, :session_id,
        :product_id, :page_path, :referrer_category, :utm_source, :utm_medium,
        :utm_campaign, :utm_term, :utm_content, :device_category, :consent_status,
        :clock_skew_flag, :outcome_status, :metadata
      )
    `);

    insertStmt.run(n);

    return { status: 202, success: true, event_id: n.event_id };
  }

  /**
   * Ingests a batch of telemetry events atomically.
   */
  public ingestBatch(
    events: IngestEventPayload[],
    isPrivileged: boolean = false,
    dntHeader?: string
  ): IngestionResult {
    if (!Array.isArray(events) || events.length === 0) {
      return { status: 400, error: 'Bad Request: Batch must be a non-empty array of events' };
    }

    if (events.length > 20) {
      return { status: 413, error: 'Payload Too Large: Batch exceeds maximum limit of 20 events' };
    }

    // Atomic validation: inspect all events first
    const validatedEvents: any[] = [];
    for (const evt of events) {
      const v = this.validateEvent(evt, isPrivileged, dntHeader);
      if (v.errorStatus) {
        return { status: v.errorStatus as any, error: v.error };
      }
      if (!v.dropDueToOptOut && v.normalized) {
        validatedEvents.push(v.normalized);
      }
    }

    // Atomic insert within SQLite transaction
    const insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO analytics_events (
        event_id, event_type, timestamp_utc, received_at_utc, session_id,
        product_id, page_path, referrer_category, utm_source, utm_medium,
        utm_campaign, utm_term, utm_content, device_category, consent_status,
        clock_skew_flag, outcome_status, metadata
      ) VALUES (
        :event_id, :event_type, :timestamp_utc, :received_at_utc, :session_id,
        :product_id, :page_path, :referrer_category, :utm_source, :utm_medium,
        :utm_campaign, :utm_term, :utm_content, :device_category, :consent_status,
        :clock_skew_flag, :outcome_status, :metadata
      )
    `);

    const insertMany = this.db.transaction((records: any[]) => {
      for (const rec of records) {
        insertStmt.run(rec);
      }
    });

    insertMany(validatedEvents);

    return { status: 202, success: true, ingested_count: validatedEvents.length };
  }

  /**
   * Aggregates daily rollups for a given UTC calendar date (YYYY-MM-DD) into analytics_daily_product_rollups.
   */
  public aggregateDailyRollups(targetDateUtc: string): DailyProductRollupRecord[] {
    const rows = this.db
      .prepare(
        `
      SELECT
        product_id,
        COUNT(CASE WHEN event_type = 'product_impression' THEN 1 END) as impressions,
        COUNT(CASE WHEN event_type = 'product_click' THEN 1 END) as card_clicks,
        COUNT(CASE WHEN event_type = 'product_view' THEN 1 END) as detail_views,
        COUNT(DISTINCT CASE WHEN event_type = 'product_view' THEN session_id END) as unique_view_sessions,
        COUNT(CASE WHEN event_type = 'product_image_interaction' THEN 1 END) as image_interactions,
        COUNT(CASE WHEN event_type = 'customization_interaction' THEN 1 END) as customization_interactions,
        COUNT(CASE WHEN event_type = 'amazon_outbound_click' THEN 1 END) as amazon_outbound_clicks,
        COUNT(CASE WHEN event_type = 'whatsapp_outbound_click' THEN 1 END) as whatsapp_outbound_clicks,
        COUNT(CASE WHEN event_type IN ('amazon_outbound_click', 'whatsapp_outbound_click') THEN 1 END) as unverified_outcomes,
        COUNT(CASE WHEN event_type = 'purchase' AND outcome_status = 'verified_purchase' THEN 1 END) as verified_purchases
      FROM analytics_events
      WHERE product_id IS NOT NULL
        AND substr(timestamp_utc, 1, 10) = ?
      GROUP BY product_id
    `
      )
      .all(targetDateUtc) as any[];

    const upsertStmt = this.db.prepare(`
      INSERT INTO analytics_daily_product_rollups (
        rollup_date, product_id, impressions, card_clicks, detail_views,
        unique_view_sessions, image_interactions, customization_interactions,
        amazon_outbound_clicks, whatsapp_outbound_clicks, unverified_outcomes,
        verified_purchases, reconciliation_hash, last_reconciled_at
      ) VALUES (
        :rollup_date, :product_id, :impressions, :card_clicks, :detail_views,
        :unique_view_sessions, :image_interactions, :customization_interactions,
        :amazon_outbound_clicks, :whatsapp_outbound_clicks, :unverified_outcomes,
        :verified_purchases, :reconciliation_hash, CURRENT_TIMESTAMP
      )
      ON CONFLICT(rollup_date, product_id) DO UPDATE SET
        impressions = excluded.impressions,
        card_clicks = excluded.card_clicks,
        detail_views = excluded.detail_views,
        unique_view_sessions = excluded.unique_view_sessions,
        image_interactions = excluded.image_interactions,
        customization_interactions = excluded.customization_interactions,
        amazon_outbound_clicks = excluded.amazon_outbound_clicks,
        whatsapp_outbound_clicks = excluded.whatsapp_outbound_clicks,
        unverified_outcomes = excluded.unverified_outcomes,
        verified_purchases = excluded.verified_purchases,
        reconciliation_hash = excluded.reconciliation_hash,
        last_reconciled_at = CURRENT_TIMESTAMP
    `);

    const results: DailyProductRollupRecord[] = [];

    const runRollups = this.db.transaction((items: any[]) => {
      for (const item of items) {
        const hash = crypto
          .createHash('sha256')
          .update(`${targetDateUtc}:${item.product_id}:${item.detail_views}`)
          .digest('hex');

        const record = {
          rollup_date: targetDateUtc,
          product_id: item.product_id,
          impressions: item.impressions || 0,
          card_clicks: item.card_clicks || 0,
          detail_views: item.detail_views || 0,
          unique_view_sessions: item.unique_view_sessions || 0,
          image_interactions: item.image_interactions || 0,
          customization_interactions: item.customization_interactions || 0,
          amazon_outbound_clicks: item.amazon_outbound_clicks || 0,
          whatsapp_outbound_clicks: item.whatsapp_outbound_clicks || 0,
          unverified_outcomes: item.unverified_outcomes || 0,
          verified_purchases: item.verified_purchases || 0,
          reconciliation_hash: hash
        };

        upsertStmt.run(record);
        results.push(record as any);
      }
    });

    runRollups(rows);
    return results;
  }
}
