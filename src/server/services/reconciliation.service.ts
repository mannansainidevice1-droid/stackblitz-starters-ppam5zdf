/**
 * BHAIRAVI Creations Digital Platform
 * Mathematical Reconciliation Invariant Engine (Delta = 0)
 * Target: src/server/services/reconciliation.service.ts
 */

import Database from 'better-sqlite3';

export interface ProductReconciliationVariance {
  product_id: string;
  product_name: string;
  rollup_views: number;
  raw_views: number;
  delta_views: number;
  rollup_amazon_clicks: number;
  raw_amazon_clicks: number;
  delta_amazon_clicks: number;
  rollup_whatsapp_clicks: number;
  raw_whatsapp_clicks: number;
  delta_whatsapp_clicks: number;
  rollup_card_clicks: number;
  raw_card_clicks: number;
  delta_card_clicks: number;
  rollup_impressions: number;
  raw_impressions: number;
  delta_impressions: number;
  total_variance: number;
}

export interface ReconciliationVerificationResult {
  status: 'reconciled_zero_drift' | 'drift_detected' | 'INVARIANT_HOLD_ZERO_DRIFT' | 'INVARIANT_DRIFT_DETECTED';
  invariant_status: 'INVARIANT_HOLD_ZERO_DRIFT' | 'INVARIANT_DRIFT_DETECTED';
  reconciled: boolean;
  query_window: {
    start_date: string;
    end_date: string;
    product_id: string | null;
  };
  total_drift: number;
  total_raw_events_checked: number;
  total_events_checked: number;
  total_rollup_records_checked: number;
  product_variances: ProductReconciliationVariance[];
  discrepancies: ProductReconciliationVariance[];
  error?: string;
}

export class ReconciliationService {
  constructor(private db: Database.Database) {}

  /**
   * Verifies the mathematical reconciliation invariant (Delta = 0) between
   * raw telemetry events and aggregated daily rollups over a date window.
   */
  public verifyReconciliation(
    startDate: string,
    endDate: string,
    productId?: string
  ): ReconciliationVerificationResult {
    // Normalise date boundary strings to YYYY-MM-DD
    const startDay = startDate.slice(0, 10);
    const endDay = endDate.slice(0, 10);

    let sql = `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        COALESCE(r.rollup_views, 0) AS rollup_views,
        COALESCE(e.raw_views, 0) AS raw_views,
        ABS(COALESCE(r.rollup_views, 0) - COALESCE(e.raw_views, 0)) AS delta_views,

        COALESCE(r.rollup_amazon, 0) AS rollup_amazon_clicks,
        COALESCE(e.raw_amazon, 0) AS raw_amazon_clicks,
        ABS(COALESCE(r.rollup_amazon, 0) - COALESCE(e.raw_amazon, 0)) AS delta_amazon_clicks,

        COALESCE(r.rollup_whatsapp, 0) AS rollup_whatsapp_clicks,
        COALESCE(e.raw_whatsapp, 0) AS raw_whatsapp_clicks,
        ABS(COALESCE(r.rollup_whatsapp, 0) - COALESCE(e.raw_whatsapp, 0)) AS delta_whatsapp_clicks,

        COALESCE(r.rollup_card_clicks, 0) AS rollup_card_clicks,
        COALESCE(e.raw_card_clicks, 0) AS raw_card_clicks,
        ABS(COALESCE(r.rollup_card_clicks, 0) - COALESCE(e.raw_card_clicks, 0)) AS delta_card_clicks,

        COALESCE(r.rollup_impressions, 0) AS rollup_impressions,
        COALESCE(e.raw_impressions, 0) AS raw_impressions,
        ABS(COALESCE(r.rollup_impressions, 0) - COALESCE(e.raw_impressions, 0)) AS delta_impressions
      FROM products p
      LEFT JOIN (
        SELECT product_id,
               SUM(detail_views) AS rollup_views,
               SUM(amazon_outbound_clicks) AS rollup_amazon,
               SUM(whatsapp_outbound_clicks) AS rollup_whatsapp,
               SUM(card_clicks) AS rollup_card_clicks,
               SUM(impressions) AS rollup_impressions
        FROM analytics_daily_product_rollups
        WHERE rollup_date >= ? AND rollup_date <= ?
        GROUP BY product_id
      ) r ON p.id = r.product_id
      LEFT JOIN (
        SELECT product_id,
               COUNT(CASE WHEN event_type = 'product_view' THEN 1 END) AS raw_views,
               COUNT(CASE WHEN event_type = 'amazon_outbound_click' THEN 1 END) AS raw_amazon,
               COUNT(CASE WHEN event_type = 'whatsapp_outbound_click' THEN 1 END) AS raw_whatsapp,
               COUNT(CASE WHEN event_type = 'product_click' THEN 1 END) AS raw_card_clicks,
               COUNT(CASE WHEN event_type = 'product_impression' THEN 1 END) AS raw_impressions
        FROM analytics_events
        WHERE substr(timestamp_utc, 1, 10) >= ? AND substr(timestamp_utc, 1, 10) <= ?
        GROUP BY product_id
      ) e ON p.id = e.product_id
      WHERE 1=1
    `;

    const params: any[] = [startDay, endDay, startDay, endDay];

    if (productId) {
      sql += ` AND p.id = ?`;
      params.push(productId);
    }

    sql += ` ORDER BY p.display_order ASC, p.id ASC`;

    const rows = this.db.prepare(sql).all(...params) as any[];

    let totalDrift = 0;
    let totalRaw = 0;
    let totalRollup = 0;

    const productVariances: ProductReconciliationVariance[] = rows.map((row) => {
      const variance =
        row.delta_views +
        row.delta_amazon_clicks +
        row.delta_whatsapp_clicks +
        row.delta_card_clicks +
        row.delta_impressions;

      totalDrift += variance;
      totalRaw +=
        row.raw_views +
        row.raw_amazon_clicks +
        row.raw_whatsapp_clicks +
        row.raw_card_clicks +
        row.raw_impressions;

      totalRollup +=
        row.rollup_views +
        row.rollup_amazon_clicks +
        row.rollup_whatsapp_clicks +
        row.rollup_card_clicks +
        row.rollup_impressions;

      return {
        product_id: row.product_id,
        product_name: row.product_name,
        rollup_views: row.rollup_views,
        raw_views: row.raw_views,
        delta_views: row.delta_views,
        rollup_amazon_clicks: row.rollup_amazon_clicks,
        raw_amazon_clicks: row.raw_amazon_clicks,
        delta_amazon_clicks: row.delta_amazon_clicks,
        rollup_whatsapp_clicks: row.rollup_whatsapp_clicks,
        raw_whatsapp_clicks: row.raw_whatsapp_clicks,
        delta_whatsapp_clicks: row.delta_whatsapp_clicks,
        rollup_card_clicks: row.rollup_card_clicks,
        raw_card_clicks: row.raw_card_clicks,
        delta_card_clicks: row.delta_card_clicks,
        rollup_impressions: row.rollup_impressions,
        raw_impressions: row.raw_impressions,
        delta_impressions: row.delta_impressions,
        total_variance: variance
      };
    });

    const isReconciled = totalDrift === 0;
    const discrepancies: ProductReconciliationVariance[] = isReconciled
      ? []
      : productVariances.filter((p) => p.total_variance > 0);

    return {
      status: isReconciled ? 'reconciled_zero_drift' : 'drift_detected',
      invariant_status: isReconciled ? 'INVARIANT_HOLD_ZERO_DRIFT' : 'INVARIANT_DRIFT_DETECTED',
      reconciled: isReconciled,
      query_window: {
        start_date: startDay,
        end_date: endDay,
        product_id: productId || null
      },
      total_drift: totalDrift,
      total_raw_events_checked: totalRaw,
      total_events_checked: totalRaw,
      total_rollup_records_checked: totalRollup,
      product_variances: productVariances,
      discrepancies,
      ...(isReconciled
        ? {}
        : {
            error: `ERR_RECONCILIATION_DRIFT: Mathematical drift detected! Total variance across products: ${totalDrift}`
          })
    };
  }
}
