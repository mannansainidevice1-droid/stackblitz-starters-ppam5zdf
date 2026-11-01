/**
 * BHAIRAVI Creations Digital Platform
 * Core TypeScript Models & Database Entity Types
 * Target: src/shared/types.ts
 */

import { Paise } from './pricing.js';

// ============================================================================
// 1. Categories
// ============================================================================
export interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

// ============================================================================
// 2. Products
// ============================================================================
export type PublicationStatus = 'draft' | 'published' | 'archived';

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

export interface CustomisationOption {
  id: string;
  name: string;
  type: 'text' | 'choice' | 'boolean' | 'file_upload';
  choices?: string[];
  price_modifier_paise?: number;
  max_characters?: number;
}

export interface WhatsAppConfig {
  prefill_template: string;
}

export interface ProductRecord {
  id: string; // UUID v4
  slug: string;
  name: string;
  description: string;
  category_id: string;
  tags: string; // JSON array of string tags
  base_price_paise: Paise; // integer paise
  currency: 'INR';
  is_made_to_order: number; // 0 or 1
  inventory_count: number;
  production_lead_days: string;
  material: string;
  dimensions_cm: string; // JSON ProductDimensions
  weight_grams: number;
  manufacturing_method: string;
  finishing_type: string;
  customisation_options: string; // JSON CustomisationOption[]
  care_safety_instructions: string;
  dispatch_estimate: string;
  amazon_url: string | null;
  amazon_asin: string | null;
  whatsapp_config: string; // JSON WhatsAppConfig
  publication_status: PublicationStatus;
  is_featured: number; // 0 or 1
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// 3. Product Images
// ============================================================================
export interface ProductImageRecord {
  id: string; // UUID v4
  product_id: string;
  storage_path: string;
  public_url: string;
  alt_text: string;
  is_primary: number; // 0 or 1
  display_order: number;
  file_size_bytes: number;
  mime_type: 'image/webp' | 'image/jpeg' | 'image/png';
  created_at: string;
}

// ============================================================================
// 4. Product Variants
// ============================================================================
export interface ProductVariantRecord {
  id: string; // UUID v4
  product_id: string;
  sku: string;
  variant_name: string;
  price_modifier_paise: number; // integer paise delta
  dimensions_cm: string | null; // JSON
  color_finish: string | null;
  is_available: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

// ============================================================================
// 5. Customer Enquiries
// ============================================================================
export type PreferredContactMethod = 'whatsapp' | 'phone' | 'email';

export type ProjectType =
  | 'custom_figurine'
  | 'architectural_model'
  | 'lithophane'
  | 'corporate_gifting'
  | 'replacement_part'
  | 'other';

export type EnquiryStatus = 'new' | 'contacted' | 'quoted' | 'converted' | 'closed';

export interface EnquiryRecord {
  id: string; // UUID v4
  customer_name: string;
  contact_email: string | null;
  contact_phone: string;
  preferred_contact_method: PreferredContactMethod;
  project_type: ProjectType;
  design_description: string;
  approximate_quantity: number;
  budget_range_inr: string | null;
  referenced_product_id: string | null;
  status: EnquiryStatus;
  ip_hash: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnquiryAttachmentRecord {
  id: string;
  enquiry_id: string;
  storage_path: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  file_sha256: string;
  created_at: string;
}

export type TimelineActionType = 'status_change' | 'internal_note' | 'contact_logged' | 'quote_sent';

export interface EnquiryTimelineRecord {
  id: string;
  enquiry_id: string;
  admin_user_id: string | null;
  action_type: TimelineActionType;
  previous_status: EnquiryStatus | null;
  new_status: EnquiryStatus | null;
  note: string | null;
  created_at: string;
}

// ============================================================================
// 6. Admin Authentication & RBAC
// ============================================================================
export type AdminRole = 'superadmin' | 'admin' | 'viewer';

export interface AdminUserRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: AdminRole;
  is_active: number;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSessionRecord {
  id: string; // SHA-256 hash of raw session token
  admin_user_id: string;
  user_agent: string | null;
  ip_hash: string | null;
  expires_at: string;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  admin_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  changes_json: string | null;
  ip_hash: string | null;
  created_at: string;
}

export interface SystemSettingRecord {
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

// ============================================================================
// 7. Analytics & BI
// ============================================================================
export type AnalyticsEventType =
  | 'page_view'
  | 'product_impression'
  | 'product_click'
  | 'product_view'
  | 'product_image_interaction'
  | 'customization_interaction'
  | 'amazon_outbound_click'
  | 'whatsapp_outbound_click'
  | 'enquiry_form_start'
  | 'enquiry_form_submit'
  | 'add_to_cart'
  | 'checkout_start'
  | 'purchase';

export type ReferrerCategory =
  | 'direct'
  | 'internal'
  | 'search_engine'
  | 'social_media'
  | 'external_link'
  | 'unknown';

export type DeviceCategory = 'mobile' | 'tablet' | 'desktop' | 'unknown';
export type ConsentStatus = 'granted' | 'denied' | 'essential_only';
export type OutcomeStatus = 'not_applicable' | 'purchase_outcome_unknown' | 'verified_purchase';

export interface AnalyticsEventRecord {
  event_id: string;
  event_type: AnalyticsEventType;
  timestamp_utc: string;
  received_at_utc: string;
  session_id: string;
  product_id: string | null;
  page_path: string;
  referrer_category: ReferrerCategory;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  device_category: DeviceCategory;
  consent_status: ConsentStatus;
  clock_skew_flag: number; // 0 or 1
  outcome_status: OutcomeStatus;
  metadata: string; // JSON
}

export interface DailyProductRollupRecord {
  id: number;
  rollup_date: string; // YYYY-MM-DD
  product_id: string;
  impressions: number;
  card_clicks: number;
  detail_views: number;
  unique_view_sessions: number;
  image_interactions: number;
  customization_interactions: number;
  amazon_outbound_clicks: number;
  whatsapp_outbound_clicks: number;
  unverified_outcomes: number;
  verified_purchases: number;
  reconciliation_hash: string;
  last_reconciled_at: string;
}
