-- ============================================================================
-- BHAIRAVI CREATIONS - 002_analytics_and_bi.sql
-- First-Party Immutable Event Log & Daily Reconcilable Rollups
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Immutable Analytics Events Table (R4 Telemetry)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL CHECK(event_type IN (
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
    )),
    timestamp_utc TEXT NOT NULL,
    received_at_utc TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    session_id TEXT NOT NULL,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    page_path TEXT NOT NULL,
    referrer_category TEXT NOT NULL DEFAULT 'unknown' CHECK(referrer_category IN (
        'direct', 'internal', 'search_engine', 'social_media', 'external_link', 'unknown'
    )),
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    device_category TEXT NOT NULL DEFAULT 'unknown' CHECK(device_category IN (
        'mobile', 'tablet', 'desktop', 'unknown'
    )),
    consent_status TEXT NOT NULL DEFAULT 'granted' CHECK(consent_status IN (
        'granted', 'denied', 'essential_only'
    )),
    clock_skew_flag INTEGER NOT NULL DEFAULT 0 CHECK(clock_skew_flag IN (0, 1)),
    outcome_status TEXT NOT NULL DEFAULT 'not_applicable' CHECK(outcome_status IN (
        'not_applicable', 'purchase_outcome_unknown', 'verified_purchase'
    )),
    metadata TEXT NOT NULL DEFAULT '{}'
);

-- Reporting & Invariant Query Indexes
CREATE INDEX IF NOT EXISTS idx_events_timestamp_type ON analytics_events(timestamp_utc, event_type);
CREATE INDEX IF NOT EXISTS idx_events_product_type_ts ON analytics_events(product_id, event_type, timestamp_utc);
CREATE INDEX IF NOT EXISTS idx_events_session_ts ON analytics_events(session_id, timestamp_utc);
CREATE INDEX IF NOT EXISTS idx_events_reconciliation ON analytics_events(event_type, product_id, timestamp_utc);

-- ----------------------------------------------------------------------------
-- 2. Daily Product Rollups Table (R5 BI & Reconciliation Invariant Delta = 0)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_daily_product_rollups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rollup_date TEXT NOT NULL, -- YYYY-MM-DD
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    impressions INTEGER NOT NULL DEFAULT 0 CHECK(impressions >= 0),
    card_clicks INTEGER NOT NULL DEFAULT 0 CHECK(card_clicks >= 0),
    detail_views INTEGER NOT NULL DEFAULT 0 CHECK(detail_views >= 0),
    unique_view_sessions INTEGER NOT NULL DEFAULT 0 CHECK(unique_view_sessions >= 0),
    image_interactions INTEGER NOT NULL DEFAULT 0 CHECK(image_interactions >= 0),
    customization_interactions INTEGER NOT NULL DEFAULT 0 CHECK(customization_interactions >= 0),
    amazon_outbound_clicks INTEGER NOT NULL DEFAULT 0 CHECK(amazon_outbound_clicks >= 0),
    whatsapp_outbound_clicks INTEGER NOT NULL DEFAULT 0 CHECK(whatsapp_outbound_clicks >= 0),
    unverified_outcomes INTEGER NOT NULL DEFAULT 0 CHECK(unverified_outcomes >= 0),
    verified_purchases INTEGER NOT NULL DEFAULT 0 CHECK(verified_purchases >= 0),
    reconciliation_hash TEXT NOT NULL,
    last_reconciled_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    UNIQUE(rollup_date, product_id)
);

CREATE INDEX IF NOT EXISTS idx_rollups_date_prod ON analytics_daily_product_rollups(rollup_date, product_id);
CREATE INDEX IF NOT EXISTS idx_rollups_product ON analytics_daily_product_rollups(product_id);

-- Optional compatibility view for daily_product_rollups
CREATE VIEW IF NOT EXISTS daily_product_rollups AS SELECT * FROM analytics_daily_product_rollups;

CREATE TRIGGER IF NOT EXISTS trg_delete_daily_product_rollups
INSTEAD OF DELETE ON daily_product_rollups
BEGIN
    DELETE FROM analytics_daily_product_rollups WHERE id = OLD.id;
END;
