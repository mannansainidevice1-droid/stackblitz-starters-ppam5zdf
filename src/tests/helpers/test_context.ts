/**
 * BHAIRAVI Creations - In-Memory Test Context & Simulated Application Harness
 * Provides full contract-compliant mock runtime for opaque-box E2E testing
 */

import crypto from 'node:crypto';
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_VARIANTS,
  MOCK_ENQUIRIES,
  MockCategory,
  MockProduct,
  MockVariant
} from './mock_data.js';

export interface AnalyticsEvent {
  event_id: string;
  event_type: string;
  timestamp_utc: string;
  session_id: string;
  product_id?: string | null;
  page_path: string;
  referrer_category: string;
  utm_parameters?: {
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
  };
  device_category: string;
  consent_status: 'granted' | 'denied' | 'essential_only';
  clock_skew_flag?: boolean;
  outcome_status?: string;
  metadata?: Record<string, any>;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'superadmin' | 'admin' | 'viewer';
  is_active: number;
  failed_login_attempts: number;
  locked_until: string | null;
}

export class TestContext {
  public categories: MockCategory[] = [];
  public products: MockProduct[] = [];
  public variants: MockVariant[] = [];
  public enquiries: any[] = [];
  public enquiryTimeline: any[] = [];
  public analyticsEvents: AnalyticsEvent[] = [];
  public dailyRollups: any[] = [];
  public adminUsers: AdminUser[] = [];
  public activeSessions: Map<string, { userId: string; role: string; expiresAt: Date }> = new Map();
  public rateLimitTracker: Map<string, { count: number; windowStart: number }> = new Map();
  public auditLogs: any[] = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.categories = JSON.parse(JSON.stringify(MOCK_CATEGORIES));
    this.products = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
    this.variants = JSON.parse(JSON.stringify(MOCK_VARIANTS));
    this.enquiries = JSON.parse(JSON.stringify(MOCK_ENQUIRIES));
    this.enquiryTimeline = [];
    this.analyticsEvents = [];
    this.dailyRollups = [];
    this.activeSessions.clear();
    this.rateLimitTracker.clear();
    this.auditLogs = [];

    // Seed default admin users
    this.adminUsers = [
      {
        id: 'usr_superadmin_01',
        username: 'superadmin',
        email: 'founder@bhairavicreations.com',
        // precomputed sha256 for test: "SuperAdminPass2026!"
        password_hash: crypto.createHash('sha256').update('SuperAdminPass2026!').digest('hex'),
        role: 'superadmin',
        is_active: 1,
        failed_login_attempts: 0,
        locked_until: null
      },
      {
        id: 'usr_admin_02',
        username: 'craft_lead',
        email: 'craft@bhairavicreations.com',
        password_hash: crypto.createHash('sha256').update('CraftLead2026!').digest('hex'),
        role: 'admin',
        is_active: 1,
        failed_login_attempts: 0,
        locked_until: null
      },
      {
        id: 'usr_viewer_03',
        username: 'analyst_viewer',
        email: 'viewer@bhairavicreations.com',
        password_hash: crypto.createHash('sha256').update('ViewerPass2026!').digest('hex'),
        role: 'viewer',
        is_active: 1,
        failed_login_attempts: 0,
        locked_until: null
      }
    ];
  }

  // --- Admin Auth Operations ---
  public loginAdmin(username: string, password: string, clientIp: string = '127.0.0.1') {
    const user = this.adminUsers.find((u) => u.username === username);
    if (!user) {
      return { status: 401, error: 'Invalid username or password' };
    }

    const now = new Date();
    if (user.locked_until && new Date(user.locked_until) > now) {
      return {
        status: 423,
        error: 'Account locked due to consecutive failed attempts. Please retry later.'
      };
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (hash !== user.password_hash) {
      user.failed_login_attempts += 1;
      if (user.failed_login_attempts >= 5) {
        user.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        return {
          status: 423,
          error: 'Account locked: 5 consecutive failed attempts. Locked for 15 minutes.'
        };
      }
      return { status: 401, error: 'Invalid username or password' };
    }

    // Success
    user.failed_login_attempts = 0;
    user.locked_until = null;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 8 * 3600 * 1000);

    this.activeSessions.set(tokenHash, { userId: user.id, role: user.role, expiresAt });

    return {
      status: 200,
      token: rawToken,
      cookie: `bhr_session=${rawToken}; HttpOnly; SameSite=Strict; Secure; Path=/`,
      user: { id: user.id, username: user.username, role: user.role }
    };
  }

  public verifySession(rawToken?: string): { userId: string; role: string } | null {
    if (!rawToken) return null;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const session = this.activeSessions.get(tokenHash);
    if (!session) return null;
    if (new Date() > session.expiresAt) {
      this.activeSessions.delete(tokenHash);
      return null;
    }
    return { userId: session.userId, role: session.role };
  }

  // --- Telemetry Operations ---
  public ingestEvent(payload: Partial<AnalyticsEvent>, clientIp: string = '127.0.0.1') {
    // 1. Rate Limiting Check (60/min)
    const now = Date.now();
    const tracker = this.rateLimitTracker.get(clientIp) || { count: 0, windowStart: now };
    if (now - tracker.windowStart > 60000) {
      tracker.count = 1;
      tracker.windowStart = now;
    } else {
      tracker.count++;
      if (tracker.count > 60) {
        return { status: 429, error: 'Rate limit exceeded: max 60 requests per minute.' };
      }
    }
    this.rateLimitTracker.set(clientIp, tracker);

    // 2. Validate Required Fields
    const required = [
      'event_id',
      'event_type',
      'timestamp_utc',
      'session_id',
      'page_path',
      'device_category',
      'consent_status'
    ];
    for (const req of required) {
      if (!(payload as any)[req]) {
        return { status: 422, error: `Missing required field: ${req}` };
      }
    }

    // 3. Privileged Event Shield: Client is forbidden from emitting "purchase" directly
    if (payload.event_type === 'purchase') {
      return {
        status: 403,
        error: 'PrivilegedEventError: Client is not authorized to emit purchase events directly.'
      };
    }

    // 4. Consent Opt-Out Check
    if (payload.consent_status === 'denied') {
      return { status: 204, message: 'Telemetry dropped per user opt-out' };
    }

    // 5. PII Scrubbing
    let sanitizedPath = payload.page_path || '';
    sanitizedPath = sanitizedPath
      .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[REDACTED_EMAIL]')
      .replace(/(?:\+?91[\-\s]?)?[6789]\d{9}/g, '[REDACTED_PHONE]');

    // 6. Clock-skew evaluation (> 300s)
    let skewFlag = false;
    const clientTime = new Date(payload.timestamp_utc!).getTime();
    if (Math.abs(now - clientTime) > 300000) {
      skewFlag = true;
    }
    if (Math.abs(now - clientTime) > 86400000) {
      return { status: 422, error: 'ClockSkewError: Timestamp drift exceeds allowable 24h limit.' };
    }

    // 7. Outcome Status Invariant
    let outcomeStatus = 'not_applicable';
    if (
      payload.event_type === 'amazon_outbound_click' ||
      payload.event_type === 'whatsapp_outbound_click'
    ) {
      outcomeStatus = 'purchase_outcome_unknown';
    }

    const eventRecord: AnalyticsEvent = {
      event_id: payload.event_id!,
      event_type: payload.event_type!,
      timestamp_utc: payload.timestamp_utc!,
      session_id: payload.session_id!,
      product_id: payload.product_id || null,
      page_path: sanitizedPath,
      referrer_category: payload.referrer_category || 'direct',
      utm_parameters: payload.utm_parameters,
      device_category: payload.device_category!,
      consent_status: payload.consent_status!,
      clock_skew_flag: skewFlag,
      outcome_status: outcomeStatus,
      metadata: payload.metadata || {}
    };

    this.analyticsEvents.push(eventRecord);
    return { status: 202, success: true, event_id: eventRecord.event_id };
  }

  // --- Daily Rollup & Reconciliation Worker ---
  public executeDailyRollup(dateUtc: string = '2026-10-31') {
    const rollups: Map<string, any> = new Map();

    for (const evt of this.analyticsEvents) {
      if (!evt.product_id) continue;
      const pid = evt.product_id;
      if (!rollups.has(pid)) {
        rollups.set(pid, {
          rollup_date: dateUtc,
          product_id: pid,
          impressions: 0,
          card_clicks: 0,
          detail_views: 0,
          unique_sessions: new Set<string>(),
          amazon_clicks: 0,
          whatsapp_clicks: 0,
          unverified_outcomes: 0
        });
      }

      const r = rollups.get(pid);
      if (evt.event_type === 'product_impression') r.impressions++;
      if (evt.event_type === 'product_click') r.card_clicks++;
      if (evt.event_type === 'product_view') {
        r.detail_views++;
        r.unique_sessions.add(evt.session_id);
      }
      if (evt.event_type === 'amazon_outbound_click') {
        r.amazon_clicks++;
        r.unverified_outcomes++;
      }
      if (evt.event_type === 'whatsapp_outbound_click') {
        r.whatsapp_clicks++;
        r.unverified_outcomes++;
      }
    }

    this.dailyRollups = Array.from(rollups.values()).map((r) => ({
      ...r,
      unique_view_sessions: r.unique_sessions.size,
      reconciliation_hash: crypto
        .createHash('sha256')
        .update(`${r.rollup_date}:${r.product_id}:${r.detail_views}`)
        .digest('hex')
    }));

    return this.dailyRollups;
  }
}

export const globalTestContext = new TestContext();
