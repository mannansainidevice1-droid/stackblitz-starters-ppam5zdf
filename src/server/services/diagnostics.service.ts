/**
 * BHAIRAVI Creations Digital Platform
 * High-Interest / Low-Outcome Diagnostics Service
 * Target: src/server/services/diagnostics.service.ts
 */

import Database from 'better-sqlite3';

export interface DiagnosticsQueryParams {
  start?: string;
  end?: string;
}

export class DiagnosticsService {
  constructor(private db: Database.Database) {}

  public getDiagnostics(params: DiagnosticsQueryParams) {
    const start = params.start || new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    const end = params.end || new Date().toISOString();

    // 1. Fetch published products with view and outbound click metrics from analytics_events
    const productsStmt = this.db.prepare(`
      SELECT 
        p.id,
        p.slug,
        p.name,
        p.base_price_paise,
        p.is_made_to_order,
        p.production_lead_days,
        (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count,
        COUNT(CASE WHEN ae.event_type = 'product_view' THEN 1 END) as unique_views,
        COUNT(CASE WHEN ae.event_type IN ('amazon_outbound_click', 'whatsapp_outbound_click') THEN 1 END) as outbound_clicks
      FROM products p
      LEFT JOIN analytics_events ae ON p.id = ae.product_id 
        AND ae.timestamp_utc >= ? AND ae.timestamp_utc <= ?
      WHERE p.publication_status = 'published'
      GROUP BY p.id;
    `);

    const products = productsStmt.all(start, end) as any[];

    if (!products || products.length === 0) {
      return {
        query_window: { start, end },
        catalog_baselines: {
          median_views: 0,
          baseline_outcome_rate_pct: 0.0,
          minimum_sample_threshold: 30
        },
        flagged_products_count: 0,
        flagged_products: []
      };
    }

    // 2. Compute Median Views
    const viewCounts = products.map((p) => Number(p.unique_views) || 0).sort((a, b) => a - b);
    const n = viewCounts.length;
    let medianViews = 0;
    if (n > 0) {
      if (n % 2 === 1) {
        medianViews = viewCounts[Math.floor(n / 2)];
      } else {
        medianViews = (viewCounts[n / 2 - 1] + viewCounts[n / 2]) / 2;
      }
    }

    // 3. Compute Catalog Baseline Outcome Rate
    const totalViews = products.reduce((acc, p) => acc + (Number(p.unique_views) || 0), 0);
    const totalOutbound = products.reduce((acc, p) => acc + (Number(p.outbound_clicks) || 0), 0);
    const baselineRate = totalViews > 0 ? Number(((totalOutbound / totalViews) * 100).toFixed(2)) : 0.0;

    // 4. Identify High-Interest / Low-Outcome Products
    const flaggedProducts: any[] = [];

    for (const p of products) {
      const views = Number(p.unique_views) || 0;
      const clicks = Number(p.outbound_clicks) || 0;
      const convRate = views > 0 ? Number(((clicks / views) * 100).toFixed(2)) : 0.0;

      // Condition 1: Sample gate (views >= 30)
      if (views < 30) continue;

      // Condition 2: High Interest (views >= 1.5 * medianViews)
      const isHighInterest = views >= 1.5 * medianViews;

      // Condition 3: Low Outcome (conversion rate <= 0.5 * baselineRate)
      const isLowOutcome = convRate <= 0.5 * baselineRate;

      if (isHighInterest && isLowOutcome) {
        let recommendation = 'High visitor interest is not translating to outbound intent. Consider reviewing price point, providing additional dimensions, or adding video demonstration of craftsmanship details.';
        if (p.image_count < 3) {
          recommendation = 'Product has fewer than 3 images. Adding multi-angle shots, close-ups of hand-painted details, and size comparison references is recommended to build purchasing confidence.';
        } else if (p.is_made_to_order === 1 && p.production_lead_days.includes('7')) {
          recommendation = 'Extended production lead time may be deterring immediate buyer action. Clarify dispatch milestones or maintain small ready-to-ship inventory batches.';
        }

        flaggedProducts.push({
          product_id: p.id,
          product_name: p.name,
          product_slug: p.slug,
          base_price_paise: p.base_price_paise,
          flag: 'HIGH_INTEREST_LOW_OUTCOME',
          unique_views: views,
          outbound_clicks: clicks,
          conversion_rate_pct: convRate,
          benchmark_ratio_views: medianViews > 0 ? Number((views / medianViews).toFixed(2)) : 1.0,
          benchmark_ratio_conversion: baselineRate > 0 ? Number((convRate / baselineRate).toFixed(2)) : 0.0,
          recommendation
        });
      }
    }

    return {
      query_window: { start, end },
      catalog_baselines: {
        median_views: medianViews,
        baseline_outcome_rate_pct: baselineRate,
        minimum_sample_threshold: 30
      },
      flagged_products_count: flaggedProducts.length,
      flagged_products: flaggedProducts
    };
  }
}
