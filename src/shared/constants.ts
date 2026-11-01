/**
 * BHAIRAVI Creations Digital Platform
 * Shared Brand Design Tokens, Draft Copy, and System Constants
 * Target: src/shared/constants.ts
 */

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
    {
      step: 1,
      title: 'Parametric & 3D Modeling',
      desc: 'Sculpting high-density digital geometry, parametric proportions, and structural lattice infills in CAD.'
    },
    {
      step: 2,
      title: 'Precision Additive Printing',
      desc: 'Layer-by-layer micro-step formation at 0.12mm layer height in high-grade PLA / PLA Pro filament.'
    },
    {
      step: 3,
      title: 'Artisanal Wet Sanding',
      desc: 'Progressive wet sanding to eliminate micro layer lines and seal seams before priming.'
    },
    {
      step: 4,
      title: 'Hand Painting & Sealing',
      desc: 'Multi-coat artist acrylics, authentic patinas, and UV protective sealant applied individually by hand.'
    }
  ]
};

export const STUDIO_DETAILS = {
  name: 'BHAIRAVI Creations',
  tagline: 'Handcrafted 3D Studio • Ludhiana',
  location: 'Ludhiana, Punjab, India',
  address: 'Ludhiana, Punjab 141001, India',
  gstin: '03AAAAA0000A1Z5',
  currency: 'INR (₹)',
  market: 'India',
  contact_email: 'contact@bhairavicreations.com',
  whatsapp_number: '917347278010',
  amazon_store_url: 'https://www.amazon.in/shops/bhairavicreations',
  amazon_associate_tag: 'bhairavicreat-21',
  working_hours: 'Monday – Saturday: 10:00 AM – 7:00 PM IST',
  lead_time_standard: '3 to 7 business days',
  lead_time_complex: '7 to 10 business days'
};

export const CUSTOM_COMMISSION_STEPS = [
  {
    step: 1,
    title: 'Share Your Idea or CAD Model',
    desc: 'Submit your sketches, reference photos, or 3D STL files along with desired dimensions and finish preferences.'
  },
  {
    step: 2,
    title: 'Feasibility Review & Fixed INR Quote',
    desc: 'Our studio artisans evaluate geometry, wall thickness, and print orientation, providing a transparent, fixed quote in INR within 24 hours.'
  },
  {
    step: 3,
    title: 'High-Resolution 3D Printing',
    desc: 'Executed with micro-step precision at 0.12mm layer height using premium durable PLA / PLA Pro.'
  },
  {
    step: 4,
    title: 'Artisanal Hand-Finishing & Insured Dispatch',
    desc: 'Triple wet-sanded, hand-painted with fine artist acrylics, sealed with UV protectant, and shipped via insured courier across India.'
  }
];

export const MANDATORY_ATTRIBUTION_DISCLAIMER =
  "Outbound Amazon and WhatsApp clicks represent high purchase intent; final checkout happens externally and is classified as 'Purchase Outcome Unknown'.";

export const EMPTY_SEARCH_MESSAGE =
  'No handcrafted creations found matching your filter. Explore our Custom Orders service or clear filters.';

export const DEFAULT_CARE_INSTRUCTIONS =
  'Keep away from temperatures above 50°C. Clean gently with dry microfiber cloth. Indoor use only.';

export const SUPPORTING_PAGES_META = {
  about: {
    title: 'About Our Studio | BHAIRAVI Creations',
    description: 'Learn about BHAIRAVI Creations, a family-run 3D printing and handcrafted art studio founded in Ludhiana, Punjab, India.'
  },
  contact: {
    title: 'Contact Us & Studio Visits | BHAIRAVI Creations',
    description: 'Get in touch with our founding artisans in Ludhiana, Punjab, India. Visit our studio or reach out via WhatsApp and email.'
  },
  faq: {
    title: 'Frequently Asked Questions | BHAIRAVI Creations',
    description: 'Questions about our 3D printing precision, hand-painted finishes, PLA care guidelines, and dispatch times.'
  },
  shipping: {
    title: 'Shipping & Delivery Policy (India) | BHAIRAVI Creations',
    description: 'Domestic courier delivery across all serviceable pin codes in India with reinforced protective packaging.'
  },
  returns: {
    title: 'Returns & Cancellation Policy | BHAIRAVI Creations',
    description: 'Our transparent 7-day transit damage replacement and custom order non-cancellability terms.'
  },
  privacy: {
    title: 'Privacy Policy (DPDP Act 2023) | BHAIRAVI Creations',
    description: 'Digital Personal Data Protection Act 2023 compliance. First-party anonymous analytics with zero PII harvesting.'
  },
  terms: {
    title: 'Terms of Service | BHAIRAVI Creations',
    description: 'Terms of service, INR currency pricing, 3D model copyright protection, and Ludhiana, Punjab jurisdiction.'
  }
};
