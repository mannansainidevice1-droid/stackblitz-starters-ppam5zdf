/**
 * BHAIRAVI Creations Digital Platform
 * First-Party Storefront Telemetry & CPM Engagement Dispatcher (Vanilla JS)
 * Target: src/client/tracking/telemetry.js
 */

(function(global) {
  'use strict';

  function TelemetryDispatcher(config) {
    this.config = config || {
      endpoint: '/api/v1/analytics/events',
      batchEndpoint: '/api/v1/analytics/events/batch',
      flushIntervalMs: 5000
    };
    this.queue = [];
    this.observedProducts = new Set();
    this.impressionTimers = new Map();
    this.intersectionObserver = null;
    this.sessionId = this.initSessionId();
    this.consentStatus = this.initConsentStatus();
    this.initLifecycleListeners();
    this.initIntersectionObserver();
  }

  TelemetryDispatcher.prototype.initSessionId = function() {
    if (typeof window === 'undefined') return 'sess_default_001';
    try {
      var sid = sessionStorage.getItem('bhr_session_id');
      if (!sid) {
        sid = 'sess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
        sessionStorage.setItem('bhr_session_id', sid);
      }
      return sid;
    } catch (e) {
      return 'sess_fallback_' + Date.now().toString(36);
    }
  };

  TelemetryDispatcher.prototype.initConsentStatus = function() {
    if (typeof window === 'undefined') return 'granted';
    try {
      if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
        return 'denied';
      }
      var stored = localStorage.getItem('bhr_consent_status');
      return stored || 'granted';
    } catch (e) {
      return 'granted';
    }
  };

  TelemetryDispatcher.prototype.setConsentStatus = function(status) {
    this.consentStatus = status;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bhr_consent_status', status);
      }
    } catch (e) {}
    if (status === 'denied') {
      this.queue = [];
    }
  };

  TelemetryDispatcher.prototype.getConsentStatus = function() {
    return this.consentStatus;
  };

  TelemetryDispatcher.prototype.getSessionId = function() {
    return this.sessionId;
  };

  TelemetryDispatcher.prototype.getDeviceCategory = function() {
    if (typeof window === 'undefined') return 'desktop';
    var width = window.innerWidth || 1024;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  TelemetryDispatcher.prototype.getUtmParameters = function() {
    if (typeof window === 'undefined' || !window.location) return {};
    try {
      var params = new URLSearchParams(window.location.search);
      var utms = {};
      var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      for (var i = 0; i < keys.length; i++) {
        var val = params.get(keys[i]);
        if (val) utms[keys[i]] = val;
      }
      return utms;
    } catch (e) {
      return {};
    }
  };

  TelemetryDispatcher.prototype.sanitizeMetadata = function(meta) {
    if (!meta || typeof meta !== 'object') return {};
    var sanitized = {};
    var prohibited = ['email', 'contact_email', 'phone', 'contact_phone', 'customer_name', 'chat_body', 'message'];
    for (var key in meta) {
      if (Object.prototype.hasOwnProperty.call(meta, key)) {
        if (prohibited.indexOf(key.toLowerCase()) !== -1) continue;
        var val = meta[key];
        if (typeof val === 'string' && val.indexOf('@') !== -1 && val.indexOf('.') !== -1) continue;
        sanitized[key] = val;
      }
    }
    return sanitized;
  };

  TelemetryDispatcher.prototype.trackEvent = function(eventType, payload) {
    if (this.consentStatus === 'denied') return;
    payload = payload || {};

    var outcomeStatus = payload.outcome_status || 'not_applicable';
    if (eventType === 'amazon_outbound_click' || eventType === 'whatsapp_outbound_click') {
      outcomeStatus = 'purchase_outcome_unknown';
    }

    var utms = this.getUtmParameters();
    var eventRecord = {
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
      utm_source: utms.utm_source || null,
      utm_medium: utms.utm_medium || null,
      utm_campaign: utms.utm_campaign || null,
      utm_term: utms.utm_term || null,
      utm_content: utms.utm_content || null,
      metadata: this.sanitizeMetadata(payload.metadata)
    };

    this.queue.push(eventRecord);

    if (eventType.indexOf('outbound') !== -1 || eventType === 'enquiry_form_submit') {
      this.flushQueue();
    }
  };

  TelemetryDispatcher.prototype.initIntersectionObserver = function() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    var self = this;
    this.intersectionObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var target = entry.target;
        var productId = target.getAttribute('data-product-id');
        if (!productId) return;

        if (entry.isIntersecting) {
          if (!self.observedProducts.has(productId) && !self.impressionTimers.has(productId)) {
            var timer = setTimeout(function() {
              if (!self.observedProducts.has(productId)) {
                self.observedProducts.add(productId);
                self.trackEvent('product_impression', { product_id: productId });
              }
              self.impressionTimers.delete(productId);
            }, 1000);
            self.impressionTimers.set(productId, timer);
          }
        } else {
          var activeTimer = self.impressionTimers.get(productId);
          if (activeTimer) {
            clearTimeout(activeTimer);
            self.impressionTimers.delete(productId);
          }
        }
      });
    }, { threshold: 0.5 });
  };

  TelemetryDispatcher.prototype.observeProductCards = function(container) {
    if (!this.intersectionObserver) return;
    var root = container || (typeof document !== 'undefined' ? document.body : null);
    if (!root) return;
    var cards = root.querySelectorAll('[data-product-id]');
    for (var i = 0; i < cards.length; i++) {
      this.intersectionObserver.observe(cards[i]);
    }
  };

  TelemetryDispatcher.prototype.flushQueue = function() {
    if (this.queue.length === 0) return;
    var batch = this.queue.slice();
    this.queue = [];
    var json = JSON.stringify(batch.length === 1 ? batch[0] : batch);
    var targetUrl = batch.length === 1 ? this.config.endpoint : this.config.batchEndpoint;

    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        var blob = new Blob([json], { type: 'application/json' });
        var sent = navigator.sendBeacon(targetUrl, blob);
        if (!sent) this.fallbackFetch(targetUrl, json);
      } else {
        this.fallbackFetch(targetUrl, json);
      }
    } catch (e) {
      this.fallbackFetch(targetUrl, json);
    }
  };

  TelemetryDispatcher.prototype.fallbackFetch = function(url, json) {
    if (typeof fetch === 'undefined') return;
    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
        keepalive: true
      }).catch(function() {});
    } catch (e) {}
  };

  TelemetryDispatcher.prototype.initLifecycleListeners = function() {
    if (typeof window === 'undefined') return;
    var self = this;
    setInterval(function() { self.flushQueue(); }, this.config.flushIntervalMs);

    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') self.flushQueue();
    });
    window.addEventListener('pagehide', function() { self.flushQueue(); });
    window.addEventListener('online', function() { self.flushQueue(); });
  };

  var instance = new TelemetryDispatcher();

  if (typeof window !== 'undefined') {
    window.__BHR_TELEMETRY__ = instance;
    window.__bhr_send_event = function(eventType, payload) {
      instance.trackEvent(eventType, payload);
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TelemetryDispatcher: TelemetryDispatcher, telemetry: instance };
  } else {
    global.TelemetryDispatcher = TelemetryDispatcher;
    global.telemetry = instance;
  }
})(typeof window !== 'undefined' ? window : this);
