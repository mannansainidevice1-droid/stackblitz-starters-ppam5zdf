/// <reference lib="dom" />
/**
 * BHAIRAVI Creations Digital Platform
 * First-Party Storefront Telemetry & CPM Engagement Dispatcher
 * Target: src/client/tracking/telemetry.ts
 */

export type ConsentStatus = 'granted' | 'denied' | 'essential_only';
export type DeviceCategory = 'mobile' | 'tablet' | 'desktop' | 'unknown';
export type OutcomeStatus = 'not_applicable' | 'purchase_outcome_unknown' | 'verified_purchase';

export interface TelemetryConfig {
  endpoint: string;
  batchEndpoint: string;
  flushIntervalMs?: number;
}

export interface AnalyticsEventPayload {
  event_id: string;
  event_type: string;
  timestamp_utc: string;
  session_id: string;
  product_id?: string | null;
  page_path: string;
  referrer_category: string;
  device_category: DeviceCategory;
  consent_status: ConsentStatus;
  outcome_status: OutcomeStatus;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  metadata?: Record<string, any>;
}

export class TelemetryDispatcher {
  private sessionId: string;
  private consentStatus: ConsentStatus;
  private queue: AnalyticsEventPayload[] = [];
  private flushTimer: any = null;
  private observedProducts = new Set<string>();
  private intersectionObserver: IntersectionObserver | null = null;
  private impressionTimers = new Map<string, any>();

  constructor(
    private config: TelemetryConfig = {
      endpoint: '/api/v1/analytics/events',
      batchEndpoint: '/api/v1/analytics/events/batch',
      flushIntervalMs: 5000
    }
  ) {
    this.sessionId = this.initSessionId();
    this.consentStatus = this.initConsentStatus();
    this.initLifecycleListeners();
    this.initIntersectionObserver();
  }

  private initSessionId(): string {
    if (typeof window === 'undefined') return 'sess_ssr_default_001';
    try {
      let sid = sessionStorage.getItem('bhr_session_id');
      if (!sid) {
        sid = 'sess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
        sessionStorage.setItem('bhr_session_id', sid);
      }
      return sid;
    } catch {
      return 'sess_fallback_' + Date.now().toString(36);
    }
  }

  private initConsentStatus(): ConsentStatus {
    if (typeof window === 'undefined') return 'granted';
    try {
      if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
        return 'denied';
      }
      const stored = localStorage.getItem('bhr_consent_status') as ConsentStatus;
      return stored || 'granted';
    } catch {
      return 'granted';
    }
  }

  public setConsentStatus(status: ConsentStatus): void {
    this.consentStatus = status;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bhr_consent_status', status);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    if (status === 'denied') {
      this.queue = [];
    }
  }

  public getConsentStatus(): ConsentStatus {
    return this.consentStatus;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  private getDeviceCategory(): DeviceCategory {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getUtmParameters(): Record<string, string | null> {
    if (typeof window === 'undefined') return {};
    try {
      const params = new URLSearchParams(window.location.search);
      const utms: Record<string, string | null> = {};
      const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      for (const key of keys) {
        const val = params.get(key);
        if (val) utms[key] = val;
      }
      return utms;
    } catch {
      return {};
    }
  }

  /**
   * Cleans metadata to enforce Zero PII Invariant.
   */
  private sanitizeMetadata(meta?: Record<string, any>): Record<string, any> {
    if (!meta) return {};
    const sanitized: Record<string, any> = {};
    const prohibitedKeys = ['email', 'contact_email', 'phone', 'contact_phone', 'customer_name', 'chat_body', 'message'];

    for (const [key, val] of Object.entries(meta)) {
      if (prohibitedKeys.includes(key.toLowerCase())) {
        continue; // Scrub PII
      }
      if (typeof val === 'string' && (val.includes('@') && val.includes('.'))) {
        continue; // Scrub potential email strings
      }
      sanitized[key] = val;
    }
    return sanitized;
  }

  public trackEvent(
    eventType: string,
    payload: {
      product_id?: string | null;
      page_path?: string;
      metadata?: Record<string, any>;
      outcome_status?: OutcomeStatus;
    } = {}
  ): void {
    if (this.consentStatus === 'denied') return;

    // Strict Attribution Invariant Enforcement:
    // Outbound Amazon and WhatsApp events MUST ALWAYS be purchase_outcome_unknown
    let outcomeStatus: OutcomeStatus = payload.outcome_status || 'not_applicable';
    if (eventType === 'amazon_outbound_click' || eventType === 'whatsapp_outbound_click') {
      outcomeStatus = 'purchase_outcome_unknown';
    }

    const eventRecord: AnalyticsEventPayload = {
      event_id: 'evt_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      event_type: eventType,
      timestamp_utc: new Date().toISOString(),
      session_id: this.sessionId,
      product_id: payload.product_id || null,
      page_path: payload.page_path || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      referrer_category: 'direct',
      device_category: this.getDeviceCategory(),
      consent_status: this.consentStatus,
      outcome_status: outcomeStatus,
      ...this.getUtmParameters(),
      metadata: this.sanitizeMetadata(payload.metadata)
    };

    this.queue.push(eventRecord);

    // Flush immediately on high-priority outbound transitions
    if (eventType.includes('outbound') || eventType === 'enquiry_form_submit') {
      this.flushQueue();
    }
  }

  /**
   * CPM Viewability IntersectionObserver:
   * Requires product card to be >=50% visible for >=1000ms viewable duration.
   */
  private initIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const productId = target.getAttribute('data-product-id');
          if (!productId) return;

          if (entry.isIntersecting) {
            if (!this.observedProducts.has(productId) && !this.impressionTimers.has(productId)) {
              const timer = setTimeout(() => {
                if (!this.observedProducts.has(productId)) {
                  this.observedProducts.add(productId);
                  this.trackEvent('product_impression', { product_id: productId });
                }
                this.impressionTimers.delete(productId);
              }, 1000); // 1-second viewable threshold
              this.impressionTimers.set(productId, timer);
            }
          } else {
            const timer = this.impressionTimers.get(productId);
            if (timer) {
              clearTimeout(timer);
              this.impressionTimers.delete(productId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );
  }

  public observeProductCards(container: HTMLElement = (typeof document !== 'undefined' ? document.body : null as any)): void {
    if (!this.intersectionObserver || !container) return;
    const cards = container.querySelectorAll('[data-product-id]');
    cards.forEach((card) => this.intersectionObserver!.observe(card));
  }

  public flushQueue(): void {
    if (this.queue.length === 0) return;
    const batch = [...this.queue];
    this.queue = [];

    const json = JSON.stringify(batch.length === 1 ? batch[0] : batch);
    const targetUrl = batch.length === 1 ? this.config.endpoint : this.config.batchEndpoint;

    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([json], { type: 'application/json' });
        const sent = navigator.sendBeacon(targetUrl, blob);
        if (!sent) {
          this.fallbackFetch(targetUrl, json);
        }
      } else {
        this.fallbackFetch(targetUrl, json);
      }
    } catch {
      this.fallbackFetch(targetUrl, json);
    }
  }

  private fallbackFetch(url: string, json: string): void {
    if (typeof fetch === 'undefined') return;
    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
        keepalive: true
      }).catch(() => {
        // Fail silently for ad-blockers or offline states without breaking navigation
      });
    } catch {
      // Invariant: telemetry failures must never throw or block UI
    }
  }

  private initLifecycleListeners(): void {
    if (typeof window === 'undefined') return;

    this.flushTimer = setInterval(() => this.flushQueue(), this.config.flushIntervalMs);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushQueue();
      }
    });

    window.addEventListener('pagehide', () => this.flushQueue());
    window.addEventListener('online', () => this.flushQueue());
  }
}

// Global Singleton Export
export const telemetry = new TelemetryDispatcher();

// Expose on window for inline handlers if in browser environment
if (typeof window !== 'undefined') {
  (window as any).__BHR_TELEMETRY__ = telemetry;
}
