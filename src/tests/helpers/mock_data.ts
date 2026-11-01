/**
 * BHAIRAVI Creations - Canonical Mock Data & Fixtures for E2E Test Suite
 * Authoritative reference data derived directly from PROJECT.md and ORIGINAL_REQUEST.md
 */

export interface MockCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  display_order: number;
  is_active: number;
}

export interface MockProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string;
  tags: string[];
  base_price_paise: number;
  currency: 'INR';
  is_made_to_order: number;
  inventory_count: number;
  production_lead_days: string;
  material: string;
  dimensions_cm: { length: number; width: number; height: number };
  weight_grams: number;
  manufacturing_method: string;
  finishing_type: string;
  customisation_options: string[];
  care_safety_instructions: string;
  dispatch_estimate: string;
  amazon_url: string | null;
  amazon_asin: string | null;
  whatsapp_config: { prefill_template: string };
  publication_status: 'draft' | 'published' | 'archived';
  is_featured: number;
  display_order: number;
}

export interface MockVariant {
  id: string;
  product_id: string;
  sku: string;
  variant_name: string;
  price_modifier_paise: number;
  dimensions_cm: { length: number; width: number; height: number };
  color_finish: string;
  is_available: number;
}

export const MOCK_CATEGORIES: MockCategory[] = [
  {
    id: 'cat_spiritual',
    slug: 'spiritual-sacred',
    name: 'Spiritual & Sacred Sculptures',
    description: 'Deity figurines and temple architecture meticulously 3D printed and hand-finished with traditional Indian pigments.',
    display_order: 1,
    is_active: 1
  },
  {
    id: 'cat_decor',
    slug: 'home-decor',
    name: 'Artisanal Home Decor',
    description: 'Geometric planters, architectural lithophanes, and sculptural vases bridging algorithmic design and handcraft.',
    display_order: 2,
    is_active: 1
  },
  {
    id: 'cat_architectural',
    slug: 'architectural-models',
    name: 'Architectural Heritage Models',
    description: 'Precision scale replicas of historic Indian landmarks and temples.',
    display_order: 3,
    is_active: 1
  }
];

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'prod_ganesha_01',
    slug: 'ganesha-antique-bronze-hand-painted',
    name: 'Lord Ganesha Sculpture — Hand-Patinated Antique Bronze',
    description: 'Intricately modeled sacred sculpture printed in biodegradable PLA+ at 0.12mm layer height, wet-sanded and hand-painted with multi-layered metallic bronze acrylics and UV protective sealant.',
    category_id: 'cat_spiritual',
    tags: ['handmade finishing', 'spiritual art', 'multi-colour', 'eco-friendly pla'],
    base_price_paise: 249900, // ₹2,499.00
    currency: 'INR',
    is_made_to_order: 1,
    inventory_count: 5,
    production_lead_days: '3-5 business days',
    material: 'Biodegradable Premium PLA+ biopolymer with cold-cast bronze powder',
    dimensions_cm: { length: 12.0, width: 9.5, height: 18.0 },
    weight_grams: 380,
    manufacturing_method: 'Ultra-high precision FDM 3D printing (0.12mm layer resolution)',
    finishing_type: 'Triple wet-sanded, surface-primed, hand-patinated bronze and acrylic lacquer',
    customisation_options: ['Base inscription (up to 25 chars)', 'Choice of antique bronze, terracotta wash, or pure stone finish'],
    care_safety_instructions: 'Keep away from temperatures above 50°C. Clean gently with dry microfiber cloth. Indoor use only.',
    dispatch_estimate: 'Dispatched in 3-5 days from Ludhiana studio via insured courier',
    amazon_url: 'https://www.amazon.in/dp/B0BHAIRAVI1?tag=bhairavicreat-21&ref=bhairavi_web',
    amazon_asin: 'B0BHAIRAVI1',
    whatsapp_config: {
      prefill_template: 'Hello BHAIRAVI Creations! I am interested in ordering: Lord Ganesha Sculpture (₹2,499). Please confirm current lead time.'
    },
    publication_status: 'published',
    is_featured: 1,
    display_order: 1
  },
  {
    id: 'prod_lotus_planter_02',
    slug: 'geometric-lotus-planter-terracotta',
    name: 'Geometric Lotus Succulent Planter — Terracotta Wash',
    description: 'Parametric origami-inspired lotus planter engineered with internal drainage reservoir. Hand-finished with natural terracotta pigments.',
    category_id: 'cat_decor',
    tags: ['handmade finishing', 'customisation', 'botanical decor'],
    base_price_paise: 129900, // ₹1,299.00
    currency: 'INR',
    is_made_to_order: 0,
    inventory_count: 12,
    production_lead_days: '1-2 business days',
    material: 'Plant-based PLA with mineral stone fill',
    dimensions_cm: { length: 14.0, width: 14.0, height: 10.5 },
    weight_grams: 260,
    manufacturing_method: 'Additive FDM printing with watertight wall geometry',
    finishing_type: 'Hand-sponged terracotta acrylic wash with waterproof interior sealant',
    customisation_options: ['Drainage hole stopper included', 'Custom matte color palette'],
    care_safety_instructions: 'Safe for indoor succulents. Wash with mild soap and warm water (below 45°C).',
    dispatch_estimate: 'In stock — dispatches next business day',
    amazon_url: 'https://www.amazon.in/dp/B0BHAIRAVI2?tag=bhairavicreat-21&ref=bhairavi_web',
    amazon_asin: 'B0BHAIRAVI2',
    whatsapp_config: {
      prefill_template: 'Hello BHAIRAVI Creations! Inquiring about Geometric Lotus Planter (₹1,299).'
    },
    publication_status: 'published',
    is_featured: 1,
    display_order: 2
  },
  {
    id: 'prod_temple_replica_03',
    slug: 'konark-wheel-architectural-replica',
    name: 'Konark Sun Temple Wheel — Scale Heritage Model',
    description: 'High-fidelity scale reproduction of the 13th-century Konark Sun Temple chariot wheel, featuring 24 intricately sculpted spokes and hand-weathered sandstone patina.',
    category_id: 'cat_architectural',
    tags: ['handmade finishing', 'heritage replica', 'high-detail'],
    base_price_paise: 499900, // ₹4,999.00
    currency: 'INR',
    is_made_to_order: 1,
    inventory_count: 2,
    production_lead_days: '5-7 business days',
    material: '8K Photopolymer Resin with high-density core',
    dimensions_cm: { length: 22.0, width: 6.0, height: 22.0 },
    weight_grams: 620,
    manufacturing_method: 'Stereolithography (SLA) resin 3D printing at 0.05mm layer height',
    finishing_type: 'Hand-weathered natural sandstone wash with dry-brush detailing',
    customisation_options: ['Engraved wooden display plinth', 'Brass dedication plaque'],
    care_safety_instructions: 'Handle by the base plinth. Keep out of direct prolonged sunlight.',
    dispatch_estimate: 'Dispatched in 5-7 business days with custom wooden gift crate',
    amazon_url: null, // Studio exclusive, no Amazon listing
    amazon_asin: null,
    whatsapp_config: {
      prefill_template: 'Hello BHAIRAVI Creations! I wish to order the Konark Wheel Heritage Model (₹4,999). Please provide bespoke plaque options.'
    },
    publication_status: 'published',
    is_featured: 1,
    display_order: 3
  },
  {
    id: 'prod_draft_prototype_04',
    slug: 'modular-lithophane-lamp-draft',
    name: 'Custom Lithophane Ambient Lamp (Internal Draft)',
    description: 'Upcoming modular 3D-printed lithophane lamp fixture.',
    category_id: 'cat_decor',
    tags: ['customisation', 'lighting'],
    base_price_paise: 349900,
    currency: 'INR',
    is_made_to_order: 1,
    inventory_count: 0,
    production_lead_days: '7 business days',
    material: 'Translucent PLA and teakwood stand',
    dimensions_cm: { length: 15.0, width: 15.0, height: 25.0 },
    weight_grams: 550,
    manufacturing_method: 'FDM fine-line lithophane vertical printing',
    finishing_type: 'Hand-turned wooden base, LED assembly',
    customisation_options: ['Upload up to 4 custom photographs'],
    care_safety_instructions: 'Use only supplied 5V low-heat LED bulb.',
    dispatch_estimate: 'Draft item not currently available for dispatch',
    amazon_url: null,
    amazon_asin: null,
    whatsapp_config: { prefill_template: 'Draft enquiry' },
    publication_status: 'draft',
    is_featured: 0,
    display_order: 99
  }
];

export const MOCK_VARIANTS: MockVariant[] = [
  {
    id: 'var_ganesha_small',
    product_id: 'prod_ganesha_01',
    sku: 'BHR-GNSH-BRZ-S',
    variant_name: '6 Inch (Compact Shrine) — Antique Bronze',
    price_modifier_paise: 0, // ₹2,499.00
    dimensions_cm: { length: 12.0, width: 9.5, height: 18.0 },
    color_finish: 'Antique Bronze',
    is_available: 1
  },
  {
    id: 'var_ganesha_large',
    product_id: 'prod_ganesha_01',
    sku: 'BHR-GNSH-BRZ-L',
    variant_name: '9 Inch (Statement Altar) — Antique Bronze',
    price_modifier_paise: 150000, // +₹1,500.00 -> ₹3,999.00
    dimensions_cm: { length: 16.0, width: 13.0, height: 24.0 },
    color_finish: 'Antique Bronze',
    is_available: 1
  },
  {
    id: 'var_ganesha_terracotta',
    product_id: 'prod_ganesha_01',
    sku: 'BHR-GNSH-TER-S',
    variant_name: '6 Inch (Compact Shrine) — Earth Terracotta',
    price_modifier_paise: -30000, // -₹300.00 -> ₹2,199.00
    dimensions_cm: { length: 12.0, width: 9.5, height: 18.0 },
    color_finish: 'Earth Terracotta',
    is_available: 1
  }
];

export const MOCK_ENQUIRIES = [
  {
    id: 'BC-ENQ-202610-1001',
    customer_name: 'Aarav Sharma',
    contact_email: 'aarav.sharma@example.in',
    contact_phone: '+919876543210',
    preferred_contact_method: 'whatsapp',
    project_type: 'custom_figurine',
    design_description: 'Custom 3D printed family deity with traditional hand-painted ornamentation and brass finish highlights.',
    approximate_quantity: 1,
    budget_range_inr: '₹2,500 - ₹5,000',
    referenced_product_id: 'prod_ganesha_01',
    status: 'new',
    ip_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    created_at: '2026-10-31T05:00:00Z',
    updated_at: '2026-10-31T05:00:00Z'
  },
  {
    id: 'BC-ENQ-202610-1002',
    customer_name: 'Meera Patel',
    contact_email: 'meera.patel@example.in',
    contact_phone: '+919123456789',
    preferred_contact_method: 'email',
    project_type: 'corporate_gifting',
    design_description: '25 custom miniature 3D printed temple models for corporate Diwali gifting.',
    approximate_quantity: 25,
    budget_range_inr: '₹5,000+',
    referenced_product_id: 'prod_temple_replica_03',
    status: 'quoted',
    ip_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    created_at: '2026-10-30T10:15:00Z',
    updated_at: '2026-10-31T04:30:00Z'
  }
];

export const BRAND_DRAFT_COPY = {
  hero_headline: 'Thoughtfully created. Precisely printed. Finished by hand.',
  hero_subheadline: 'A family-run 3D-printing and handcrafted-products studio in India. Blending mathematical digital precision with timeless artisanal hand-finishing.',
  brand_colors: {
    canvas: '#FAF9F6',
    charcoal: '#1C1917',
    stone_border: '#E7E5E4',
    terracotta_accent: '#C2410C',
    amber_accent: '#9A3412'
  },
  craft_stages: [
    { step: 1, title: 'Parametric & 3D Modeling', desc: 'Sculpting high-density digital geometry.' },
    { step: 2, title: 'Precision Additive Printing', desc: 'Layer-by-layer micro-step formation in eco biopolymers.' },
    { step: 3, title: 'Artisanal Wet Sanding', desc: 'Eliminating print seams for a smooth tactile finish.' },
    { step: 4, title: 'Hand Painting & Sealing', desc: 'Multi-coat artist acrylics and UV protective sealant.' }
  ]
};
