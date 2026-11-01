/**
 * BHAIRAVI Creations Digital Platform
 * Overview KPIs & Conversion Rates Aggregation Service
 * Target: src/server/services/kpi.service.ts
 */

import Database from 'better-sqlite3';
import { formatPaiseToInr } from '../../shared/pricing.js';

export interface KpiQueryParams {
  start?: string;
  end?: string;
}

export class KpiService {
  constructor(private db: Database.Database) {}

  public getOverviewKpis(params: KpiQueryParams) {
    const start = params.start || new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    const end = params.end || new Date().toISOString();

    if (new Date(end) < new Date(start)) {
      throw new Error("Invalid date range: 'end' must be greater than or equal to 'start'.");
    }

    // 1. Traffic & Outbound Metrics from analytics_events
    const trafficStmt = this.db.prepare(`
      SELECT
        COUNT(CASE WHEN event_type = 'product_view' THEN 1 END) AS total_product_views,
        COUNT(DISTINCT session_id) AS unique_visitors,
        COUNT(CASE WHEN event_type = 'product_click' THEN 1 END) AS product_card_clicks,
        COUNT(CASE WHEN event_type = 'product_impression' THEN 1 END) AS product_impressions,
        COUNT(CASE WHEN event_type = 'product_view' THEN 1 END) AS detail_views,
        COUNT(CASE WHEN event_type = 'amazon_outbound_click' THEN 1 END) AS amazon_clicks,
        COUNT(CASE WHEN event_type = 'whatsapp_outbound_click' THEN 1 END) AS whatsapp_clicks,
        COUNT(CASE WHEN event_type = 'enquiry_form_start' THEN 1 END) AS enquiry_form_starts,
        COUNT(CASE WHEN event_type = 'enquiry_form_submit' THEN 1 END) AS enquiry_form_submits,
        COUNT(CASE WHEN event_type = 'product_image_interaction' THEN 1 END) AS image_interactions,
        COUNT(CASE WHEN event_type = 'customization_interaction' THEN 1 END) AS customization_interactions
      FROM analytics_events
      WHERE timestamp_utc >= ? AND timestamp_utc <= ?;
    `);
    const traffic: any = trafficStmt.get(start, end) || {};

    // 2. Enquiry Pipeline Aggregation
    const enquiryStmt = this.db.prepare(`
      SELECT
        COUNT(*) AS total_enquiries,
        COUNT(CASE WHEN status = 'new' THEN 1 END) AS status_new,
        COUNT(CASE WHEN status = 'contacted' THEN 1 END) AS status_contacted,
        COUNT(CASE WHEN status = 'quoted' THEN 1 END) AS status_quoted,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) AS status_converted,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) AS status_closed
      FROM enquiries
      WHERE created_at >= ? AND created_at <= ?;
    `);
    const enquiries: any = enquiryStmt.get(start, end) || {};

    // 3. Verified Revenue (calculated from verified transactions in daily rollups or converted orders)
    const revenueStmt = this.db.prepare(`
      SELECT COALESCE(SUM(verified_purchases * 285000), 0) AS revenue_paise
      FROM daily_product_rollups
      WHERE rollup_date >= substr(?, 1, 10) AND rollup_date <= substr(?, 1, 10);
    `);
    const revRow: any = revenueStmt.get(start, end) || { revenue_paise: 0 };
    const verifiedRevenuePaise = Number(revRow.revenue_paise) || 0;

    const calcRate = (num: number, den: number): number => {
      if (!den || den <= 0) return 0.0;
      return Number(((num / den) * 100).toFixed(2));
    };

    const totalViews = traffic.total_product_views || 0;
    const uniqueVisitors = traffic.unique_visitors || 0;
    const cardClicks = traffic.product_card_clicks || 0;
    const impressions = traffic.product_impressions || 0;
    const detailViews = traffic.detail_views || 0;
    const amazonClicks = traffic.amazon_clicks || 0;
    const waClicks = traffic.whatsapp_clicks || 0;
    const totalOutbound = amazonClicks + waClicks;
    const formStarts = traffic.enquiry_form_starts || 0;
    const formSubmits = traffic.enquiry_form_submits || 0;
    const totalEnquiries = enquiries.total_enquiries || 0;

    return {
      query_window: { start, end },
      traffic: {
        total_product_views: totalViews,
        unique_visitors: uniqueVisitors,
        product_card_clicks: cardClicks,
        product_impressions: impressions,
        detail_views: detailViews
      },
      outbound_engagement: {
        amazon_clicks: amazonClicks,
        whatsapp_clicks: waClicks,
        total_outbound_clicks: totalOutbound,
        unverified_disclaimer: "Outbound Amazon and WhatsApp clicks represent high purchase intent; final checkout happens externally and is classified as 'Purchase Outcome Unknown'."
      },
      enquiries: {
        total_enquiries: totalEnquiries,
        enquiry_form_starts: formStarts,
        enquiry_form_submits: formSubmits,
        by_status: {
          new: enquiries.status_new || 0,
          contacted: enquiries.status_contacted || 0,
          quoted: enquiries.status_quoted || 0,
          converted: enquiries.status_converted || 0,
          closed: enquiries.status_closed || 0
        }
      },
      revenue: {
        verified_revenue_paise: verifiedRevenuePaise,
        currency: 'INR',
        formatted: formatPaiseToInr(verifiedRevenuePaise)
      },
      conversion_rates: [
        {
          metric: "Storefront to Enquiry Conversion Rate",
          rate_percentage: calcRate(totalEnquiries, uniqueVisitors),
          numerator: totalEnquiries,
          denominator: uniqueVisitors,
          denominator_label: "Unique Visitors",
          formula: "(enquiries submitted / unique visitors) * 100"
        },
        {
          metric: "Product Detail to Outbound Intent Rate",
          rate_percentage: calcRate(totalOutbound, detailViews),
          numerator: totalOutbound,
          denominator: detailViews,
          denominator_label: "Product Detail Page Views",
          formula: "((amazon outbound clicks + whatsapp outbound clicks) / product detail page views) * 100"
        },
        {
          metric: "Discovery Click-Through Rate (CTR)",
          rate_percentage: calcRate(cardClicks, impressions),
          numerator: cardClicks,
          denominator: impressions,
          denominator_label: "Product Impressions",
          formula: "(product card clicks / product impressions) * 100"
        },
        {
          metric: "Enquiry Form Completion Rate",
          rate_percentage: calcRate(formSubmits, formStarts),
          numerator: formSubmits,
          denominator: formStarts,
          denominator_label: "Enquiry Form Starts",
          formula: "(enquiry form submits / enquiry form starts) * 100"
        }
      ]
    };
  }
}
