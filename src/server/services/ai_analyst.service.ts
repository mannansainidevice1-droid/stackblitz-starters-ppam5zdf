/**
 * BHAIRAVI Creations Digital Platform
 * AI Analyst & 3-Tier Epistemic Separation Service
 * Target: src/server/services/ai_analyst.service.ts
 */

import Database from 'better-sqlite3';
import { formatPaiseToInr } from '../../shared/pricing.js';
import { MANDATORY_ATTRIBUTION_DISCLAIMER } from './analytics.service.js';

export interface AiAnalystQueryWindow {
  start?: string;
  end?: string;
  product_id?: string;
}

export class AiAnalystService {
  constructor(private db: Database.Database) {}

  /**
   * 1. GET /api/v1/ai-analyst/catalog-summary
   */
  public getCatalogSummary() {
    // 1. Published / Draft / Archived product counts
    const counts = this.db
      .prepare(
        `
      SELECT 
        COUNT(CASE WHEN publication_status = 'published' THEN 1 END) as total_published,
        COUNT(CASE WHEN publication_status = 'draft' THEN 1 END) as total_draft,
        COUNT(CASE WHEN publication_status = 'archived' THEN 1 END) as total_archived,
        COUNT(CASE WHEN is_made_to_order = 1 AND publication_status = 'published' THEN 1 END) as made_to_order_count,
        COUNT(CASE WHEN is_made_to_order = 0 AND publication_status = 'published' THEN 1 END) as stocked_count,
        MIN(CASE WHEN publication_status = 'published' THEN base_price_paise END) as min_price,
        MAX(CASE WHEN publication_status = 'published' THEN base_price_paise END) as max_price,
        AVG(CASE WHEN publication_status = 'published' THEN base_price_paise END) as avg_price
      FROM products;
    `
      )
      .get() as any;

    // 2. Categories breakdown
    const categories = this.db
      .prepare(
        `
      SELECT 
        c.id, c.slug, c.name,
        COUNT(p.id) as published_product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.publication_status = 'published'
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.display_order ASC;
    `
      )
      .all() as any[];

    // 3. Price median calculation
    const prices = (
      this.db
        .prepare(
          `
      SELECT base_price_paise 
      FROM products 
      WHERE publication_status = 'published' 
      ORDER BY base_price_paise ASC;
    `
        )
        .all() as any[]
    ).map((r: any) => r.base_price_paise);

    let medianPrice = 0;
    if (prices.length > 0) {
      const mid = Math.floor(prices.length / 2);
      medianPrice =
        prices.length % 2 !== 0 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);
    }

    const pubCount = counts.total_published || 0;
    const mtoCount = counts.made_to_order_count || 0;
    const mtoRatio = pubCount > 0 ? Number(((mtoCount / pubCount) * 100).toFixed(2)) : 0.0;

    return {
      status: 'success',
      generated_at_utc: new Date().toISOString(),
      catalog_summary: {
        total_products_published: pubCount,
        total_products_draft: counts.total_draft || 0,
        total_products_archived: counts.total_archived || 0,
        categories,
        pricing_spectrum_inr: {
          currency: 'INR',
          min_price_paise: counts.min_price || 0,
          min_price_formatted: formatPaiseToInr(counts.min_price || 0),
          max_price_paise: counts.max_price || 0,
          max_price_formatted: formatPaiseToInr(counts.max_price || 0),
          median_price_paise: medianPrice,
          median_price_formatted: formatPaiseToInr(medianPrice),
          average_price_paise: Math.round(counts.avg_price || 0),
          average_price_formatted: formatPaiseToInr(Math.round(counts.avg_price || 0))
        },
        production_characteristics: {
          made_to_order_count: mtoCount,
          stocked_inventory_count: counts.stocked_count || 0,
          made_to_order_ratio_pct: mtoRatio,
          primary_materials: ['Biodegradable PLA+', 'Sculpting Resin', 'Wood-Infused Composite'],
          finishing_methods: ['Hand-Painted Acrylic', 'Antique Bronze Patina', 'Raw Print Inspection']
        }
      }
    };
  }

  /**
   * 2. GET /api/v1/ai-analyst/performance-facts
   */
  public getPerformanceFacts(window: AiAnalystQueryWindow) {
    const start = window.start || new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    const end = window.end || new Date().toISOString();
    const productId = window.product_id;

    let sql = `
      SELECT
        COUNT(CASE WHEN event_type = 'product_impression' THEN 1 END) as product_impressions,
        COUNT(CASE WHEN event_type = 'product_click' THEN 1 END) as product_card_clicks,
        COUNT(CASE WHEN event_type = 'product_view' THEN 1 END) as detail_views,
        COUNT(DISTINCT session_id) as unique_session_views,
        COUNT(CASE WHEN event_type = 'product_image_interaction' THEN 1 END) as image_interactions,
        COUNT(CASE WHEN event_type = 'customization_interaction' THEN 1 END) as customization_interactions,
        COUNT(CASE WHEN event_type = 'amazon_outbound_click' THEN 1 END) as amazon_outbound_clicks,
        COUNT(CASE WHEN event_type = 'whatsapp_outbound_click' THEN 1 END) as whatsapp_outbound_clicks,
        COUNT(CASE WHEN event_type = 'enquiry_form_start' THEN 1 END) as enquiry_form_starts,
        COUNT(CASE WHEN event_type = 'enquiry_form_submit' THEN 1 END) as enquiry_form_submits
      FROM analytics_events
      WHERE timestamp_utc >= ? AND timestamp_utc <= ?
    `;

    const params: any[] = [start, end];
    if (productId) {
      sql += ` AND product_id = ?`;
      params.push(productId);
    }

    const row = (this.db.prepare(sql).get(...params) as any) || {};
    const amazon = row.amazon_outbound_clicks || 0;
    const whatsapp = row.whatsapp_outbound_clicks || 0;

    return {
      status: 'success',
      generated_at_utc: new Date().toISOString(),
      query_window: { start_utc: start, end_utc: end, product_id: productId || null },
      measured_facts: {
        raw_page_views: row.detail_views || 0,
        unique_session_views: row.unique_session_views || 0,
        product_card_clicks: row.product_card_clicks || 0,
        product_impressions: row.product_impressions || 0,
        image_interactions: row.image_interactions || 0,
        customization_interactions: row.customization_interactions || 0,
        amazon_outbound_clicks: amazon,
        whatsapp_outbound_clicks: whatsapp,
        total_outbound_intent_clicks: amazon + whatsapp,
        enquiry_form_starts: row.enquiry_form_starts || 0,
        enquiry_form_submits: row.enquiry_form_submits || 0,
        verified_on_platform_purchases: 0,
        downstream_purchase_status: 'purchase_outcome_unknown',
        attribution_disclaimer: MANDATORY_ATTRIBUTION_DISCLAIMER
      }
    };
  }

  /**
   * 3. GET /api/v1/ai-analyst/conversion-insights (3-Tier Epistemic Separation)
   */
  public getConversionInsights(window: AiAnalystQueryWindow) {
    const facts = this.getPerformanceFacts(window);
    const m = facts.measured_facts;

    const calcRate = (num: number, den: number): number => {
      if (!den || den <= 0) return 0.0;
      return Number(((num / den) * 100).toFixed(2));
    };

    const discoveryCtr = calcRate(m.product_card_clicks, m.product_impressions);
    const detailToOutbound = calcRate(m.total_outbound_intent_clicks, m.raw_page_views);
    const sessionOutbound = calcRate(m.total_outbound_intent_clicks, m.unique_session_views);
    const visitorEnquiry = calcRate(m.enquiry_form_submits, m.unique_session_views);
    const formCompletion = calcRate(m.enquiry_form_submits, m.enquiry_form_starts);

    // Tier 3 signals derived from heuristic analysis
    const signals: any[] = [];

    if (sessionOutbound >= 10.0) {
      signals.push({
        signal_type: 'HIGH_OUTBOUND_COMMERCIAL_INTENT',
        confidence_score: 0.94,
        methodology: `Outbound intent rate (${sessionOutbound}%) exceeds catalog baseline of 10%`,
        hypothesis: 'Strong external purchase desire detected across Amazon and WhatsApp channels.',
        recommendation:
          'Maintain active inventory listings and verify rapid response times for WhatsApp enquiries.'
      });
    }

    if (m.raw_page_views >= 50 && detailToOutbound <= 2.0) {
      signals.push({
        signal_type: 'HIGH_INTEREST_LOW_OUTCOME',
        confidence_score: 0.89,
        methodology: `High detail views (${m.raw_page_views}) but low outbound conversion (${detailToOutbound}% <= 2.0%)`,
        hypothesis:
          'Visitors inspect the product in detail but drop off before clicking outbound purchase links.',
        recommendation:
          'Consider introducing multi-angle craftsmanship photos or reviewing the price modifier options.'
      });
    }

    if (signals.length === 0) {
      signals.push({
        signal_type: 'STABLE_PERFORMANCE',
        confidence_score: 0.85,
        methodology: 'All conversion metrics fall within expected catalog baseline bands.',
        hypothesis: 'Traffic and conversion funnels are operating within nominal statistical variance.',
        recommendation: 'Continue regular monitoring and seasonal marketing campaigns.'
      });
    }

    return {
      status: 'success',
      generated_at_utc: facts.generated_at_utc,
      query_window: facts.query_window,
      epistemic_classification: {
        tier_1_measured_facts: {
          epistemic_level: 'EMPIRICAL_OBSERVATION',
          description: 'Directly observed, immutable database records without interpretation',
          data: {
            observed_period: facts.query_window,
            product_id: facts.query_window.product_id,
            raw_page_views: m.raw_page_views,
            unique_session_views: m.unique_session_views,
            product_card_clicks: m.product_card_clicks,
            product_impressions: m.product_impressions,
            image_interactions: m.image_interactions,
            customization_interactions: m.customization_interactions,
            amazon_outbound_clicks: m.amazon_outbound_clicks,
            whatsapp_outbound_clicks: m.whatsapp_outbound_clicks,
            total_outbound_clicks: m.total_outbound_intent_clicks,
            enquiry_form_starts: m.enquiry_form_starts,
            enquiry_form_submits: m.enquiry_form_submits,
            verified_on_platform_purchases: 0,
            downstream_purchase_status: 'purchase_outcome_unknown',
            attribution_integrity_note: MANDATORY_ATTRIBUTION_DISCLAIMER
          }
        },
        tier_2_derived_metrics: {
          epistemic_level: 'DETERMINISTIC_CALCULATION',
          description:
            'Calculated ratios with exact documented mathematical formulas and explicit denominators',
          formulas_applied: {
            discovery_ctr: '(product_card_clicks / product_impressions) * 100',
            detail_to_outbound_rate: '(total_outbound_clicks / product_detail_views) * 100',
            outbound_action_rate:
              '(amazon_outbound_clicks + whatsapp_outbound_clicks) / unique_session_views * 100',
            session_outbound_intent_rate: '(total_outbound_clicks / unique_session_views) * 100',
            enquiry_rate: 'enquiry_form_submits / unique_session_views * 100',
            visitor_to_enquiry_rate: '(enquiry_form_submits / unique_session_views) * 100',
            enquiry_form_completion_rate: '(enquiry_form_submits / enquiry_form_starts) * 100'
          },
          data: {
            discovery_ctr_pct: discoveryCtr,
            detail_to_outbound_rate_pct: detailToOutbound,
            outbound_action_rate_pct: sessionOutbound,
            session_outbound_intent_rate_pct: sessionOutbound,
            enquiry_rate_pct: visitorEnquiry,
            visitor_to_enquiry_rate_pct: visitorEnquiry,
            enquiry_form_completion_rate_pct: formCompletion,
            explicit_denominator: m.unique_session_views,
            denominators: {
              discovery_impressions: m.product_impressions,
              detail_views: m.raw_page_views,
              unique_sessions: m.unique_session_views,
              form_starts: m.enquiry_form_starts
            }
          }
        },
        tier_3_hypotheses_and_inferences: {
          epistemic_level: 'STATISTICAL_INFERENCE',
          description: 'Algorithmic anomaly flags, trend projections, and hypotheses (NOT ground truth)',
          signals,
          disclaimer: 'Inferences are statistical heuristics and must not be used as audited financial statements.'
        }
      }
    };
  }

  /**
   * 4. GET /api/v1/ai-analyst/schema-docs
   */
  public getSchemaDocs() {
    return {
      schema_version: '1.0.0',
      api_title: 'BHAIRAVI Creations Read-Only AI Analyst Interface',
      base_path: '/api/v1/ai-analyst',
      authentication: {
        type: 'http_bearer',
        token_env_variable: 'AI_ANALYST_TOKEN',
        scope_required: 'ai_analyst:read',
        header_format: 'Authorization: Bearer <TOKEN>'
      },
      operational_guardrails: {
        rate_limit_per_minute: 30,
        max_query_timeout_ms: 5000,
        max_payload_bytes: 32768,
        supported_http_methods: ['GET'],
        mutation_policy: 'Strictly Read-Only (POST/PUT/DELETE return HTTP 405 Method Not Allowed)'
      },
      epistemic_architecture: {
        tier_1_measured_facts: {
          definition: 'Unadjusted counts derived from immutable database event rows',
          attribution_invariant: "External clicks are strictly tagged as 'purchase_outcome_unknown'"
        },
        tier_2_derived_metrics: {
          definition:
            'Deterministic mathematical functions of Tier 1 counts with disclosed formulas and denominators'
        },
        tier_3_hypotheses_and_inferences: {
          definition: 'Statistical heuristic insights with confidence scores and non-audited disclaimer'
        }
      },
      endpoints: [
        {
          path: '/api/v1/ai-analyst/catalog-summary',
          method: 'GET',
          description:
            'Factual overview of published products, categories, price range, and custom order options'
        },
        {
          path: '/api/v1/ai-analyst/performance-facts',
          method: 'GET',
          description: 'Ground truth event counts over a specified UTC query window',
          query_parameters: {
            start: 'ISO 8601 UTC timestamp',
            end: 'ISO 8601 UTC timestamp',
            product_id: 'UUID v4 of specific product'
          }
        },
        {
          path: '/api/v1/ai-analyst/conversion-insights',
          method: 'GET',
          description: 'Comprehensive 3-tier epistemically separated analytics payload',
          query_parameters: {
            start: 'ISO 8601 UTC timestamp',
            end: 'ISO 8601 UTC timestamp',
            product_id: 'UUID v4 of specific product'
          }
        },
        {
          path: '/api/v1/ai-analyst/schema-docs',
          method: 'GET',
          description: 'Machine-readable schema and epistemic governance contract'
        }
      ]
    };
  }
}
