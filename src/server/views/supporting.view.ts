/**
 * BHAIRAVI Creations Digital Platform
 * Premium Editorial Supporting & Legal Pages SSR Views (Feature F48)
 * Routes: /about, /contact, /faq, /shipping, /returns, /privacy, /terms
 * Target: src/server/views/supporting.view.ts
 */

import { STUDIO_DETAILS } from '../../shared/constants.js';
import { renderBaseLayout } from './layout.view.js';

function renderPageContainer(tag: string, title: string, subtitle: string, bodyContent: string): string {
  return `
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-4xl">
      <!-- Editorial Page Header -->
      <header class="text-center mb-10 max-w-2xl mx-auto">
        <span class="inline-block text-xs font-bold uppercase tracking-widest text-[#2563EB] mb-2">
          ${tag}
        </span>
        <h1 class="font-display text-4xl sm:text-5xl font-black text-[#0B0F19] tracking-tight leading-tight">
          ${title}
        </h1>
        <p class="mt-3 text-base text-[#475569] leading-relaxed">
          ${subtitle}
        </p>
      </header>

      <!-- Bento Content Shell -->
      <article class="bento-card p-8 sm:p-12 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm text-sm sm:text-base text-[#334155] leading-relaxed space-y-6">
        ${bodyContent}
      </article>
    </div>
  `;
}

// 1. /about
export function renderAboutPage(): string {
  const body = `
    <h2 class="font-display text-2xl font-bold text-[#0B0F19] mb-4">
      Bridging Mathematical Additive Precision with Generational Artistry
    </h2>
    <p>
      Founded and operating in Ludhiana, Punjab, <strong>BHAIRAVI Creations</strong> is a family-run 3D-printing and handcrafted-products studio. We believe the future of decorative art lives at the intersection of modern additive manufacturing and patient human craft.
    </p>
    <p>
      While 3D printing delivers micro-step accuracy (0.12mm layer heights) that allows for geometric precision impossible with traditional casting molds, a raw 3D print is only half the creation. Every sculpture, sacred deity idol, and architectural replica leaving our workbench undergoes progressive wet sanding to eliminate micro layer lines, followed by multi-coat artist acrylics, authentic hand-patination, and UV protective sealing applied individually by hand.
    </p>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 pt-6 border-t border-[#F1F5F9]">
      <div class="p-5 rounded-xl bg-[#FAF9F5] border border-[#E2E8F0]">
        <h3 class="font-display text-base font-bold text-[#0B0F19] mb-2">High-Grade PLA & PLA Pro</h3>
        <p class="text-xs text-[#64748B] leading-relaxed">
          Non-toxic, safe for residential spaces, and producing zero harmful fumes. Dimensionally stable for intricate sacred art.
        </p>
      </div>
      <div class="p-5 rounded-xl bg-[#FAF9F5] border border-[#E2E8F0]">
        <h3 class="font-display text-base font-bold text-[#0B0F19] mb-2">Zero Drop-Shipping Honesty</h3>
        <p class="text-xs text-[#64748B] leading-relaxed">
          We never drop-ship mass-manufactured imports or present generic AI mockups as real products. Every piece is made in our Ludhiana atelier.
        </p>
      </div>
    </div>

    <h3 class="font-display text-xl font-bold text-[#0B0F19] mt-6 mb-2">Direct Founder Engagement</h3>
    <p>
      When you commission a custom 3D sculpture or inquire about our catalogue pieces, you are speaking directly with our founding artisans in Ludhiana—not an anonymous call center or automated chat bot.
    </p>
  `;

  return renderBaseLayout({
    title: 'About Us',
    description: 'Learn about BHAIRAVI Creations, a family-run 3D printing and handcrafted art studio founded in Ludhiana, Punjab, India.',
    canonicalPath: '/about',
    activeNav: 'about',
    content: renderPageContainer('Our Story & Craft', 'About BHAIRAVI Creations', 'Family heritage, 3D printing precision, and hand-painted artisanal finishing in Ludhiana.', body)
  });
}

// 2. /contact
export function renderContactPage(): string {
  const body = `
    <h2 class="font-display text-2xl font-bold text-[#0B0F19] mb-2">Get in Touch with Our Studio</h2>
    <p class="text-[#64748B] mb-8">
      Have a question about our catalogue pieces or want to discuss a custom 3D printing project? Reach out directly to our artisans in Ludhiana.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- WhatsApp Desk -->
      <div class="p-5 rounded-xl bg-[#FAF9F5] border border-[#E2E8F0] flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-[#059669] block mb-1">WhatsApp Desk</span>
          <h3 class="font-display text-base font-bold text-[#0B0F19] mb-2">Artisan Consultation</h3>
          <p class="text-xs text-[#64748B] mb-4">Fast feasibility checks, photos of pieces in progress, and size recommendations.</p>
        </div>
        <a href="https://wa.me/${STUDIO_DETAILS.whatsapp_number}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm w-full">
          Chat on WhatsApp &rarr;
        </a>
      </div>

      <!-- Email Desk -->
      <div class="p-5 rounded-xl bg-[#FAF9F5] border border-[#E2E8F0] flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-[#2563EB] block mb-1">Email Inquiries</span>
          <h3 class="font-display text-base font-bold text-[#0B0F19] mb-2">Direct Mail</h3>
          <p class="text-xs text-[#64748B] mb-4">For CAD design files, corporate gifting proposals, and formal tenders.</p>
        </div>
        <a href="mailto:${STUDIO_DETAILS.contact_email}" class="btn btn-secondary btn-sm w-full">
          Send Email &rarr;
        </a>
      </div>

      <!-- Workshop Coordinates -->
      <div class="p-5 rounded-xl bg-[#FAF9F5] border border-[#E2E8F0] flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-[#D97706] block mb-1">Atelier Location</span>
          <h3 class="font-display text-base font-bold text-[#0B0F19] mb-2">Ludhiana, Punjab</h3>
          <p class="text-xs text-[#64748B] mb-4">${STUDIO_DETAILS.address} (PIN: 141001). Dispatch across all Indian states.</p>
        </div>
        <span class="text-xs font-semibold text-[#0B0F19]">Hours: Mon–Sat 10am–7pm</span>
      </div>
    </div>

    <div class="pt-6 border-t border-[#F1F5F9] text-center">
      <a href="/custom-order" class="btn btn-primary btn-md">
        <span>Commission a Custom 3D Sculpture &rarr;</span>
      </a>
    </div>
  `;

  return renderBaseLayout({
    title: 'Contact Studio',
    description: 'Get in touch with our founding artisans in Ludhiana, Punjab, India. Visit our studio or reach out via WhatsApp and email.',
    canonicalPath: '/contact',
    activeNav: 'contact',
    content: renderPageContainer('Studio Direct Desk', 'Contact Our Artisans', 'Ludhiana, Punjab, India (PIN 141001)', body)
  });
}

// 3. /faq
export function renderFaqPage(): string {
  const faqs = [
    {
      q: 'Are 3D-printed layer lines visible on the finished product?',
      a: 'No. We print with ultra-fine 0.12mm layer resolutions and subject every piece to progressive multi-stage wet sanding. This eliminates micro-stepping ridges, creating a stone-smooth surface prior to primer application and acrylic hand-painting.'
    },
    {
      q: 'What are the thermal limits and care instructions for PLA creations?',
      a: 'Our PLA and PLA Pro creations must be kept away from temperatures exceeding 50°C (122°F). Do not display in closed vehicles under direct summer sunlight or place near heat sources. For cleaning, gently wipe with a dry or lightly dampened microfiber cloth. Avoid chemical solvent cleaners.'
    },
    {
      q: 'How long does a custom 3D commission take to sculpt and dispatch?',
      a: 'Standard custom commissions require 3 to 7 business days to sculpt, print, sand, and paint. Complex architectural models or custom lithophane lamp assemblies typically require 7 to 10 business days. Transparent timelines are provided in our upfront INR quotation.'
    },
    {
      q: 'Do you deliver across India?',
      a: 'Yes. We ship to over 19,000 serviceable PIN codes across India via insured courier partners (BlueDart, Delhivery, Speed Post) in heavy-duty double-walled corrugated packaging with multi-layer bubble cushioning.'
    },
    {
      q: 'Can I request custom dimensions or a specific color patina?',
      a: 'Yes. Every model in our catalogue can be scaled to fit your altar, shelf, or plinth, and our painters can apply antique bronze, terracotta wash, stone granite, or custom multi-tone acrylic finishes.'
    }
  ];

  const body = `
    <div class="space-y-4">
      ${faqs
        .map(
          (item) => `
        <details class="group p-5 rounded-xl bg-[#FAF9F5] border border-[#E2E8F0] open:bg-white transition-all cursor-pointer">
          <summary class="font-display text-base font-bold text-[#0B0F19] list-none flex items-center justify-between gap-4">
            <span>${item.q}</span>
            <span class="w-6 h-6 rounded-full bg-[#E2E8F0] group-open:bg-[#2563EB] group-open:text-white text-[#64748B] flex items-center justify-center text-xs shrink-0 transition-all">
              &darr;
            </span>
          </summary>
          <div class="pt-4 text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9] mt-3">
            ${item.a}
          </div>
        </details>
      `
        )
        .join('')}
    </div>
  `;

  return renderBaseLayout({
    title: 'Frequently Asked Questions',
    description: 'Frequently asked questions about 3D printing accuracy, hand finishes, PLA care guidelines, and dispatch.',
    canonicalPath: '/faq',
    activeNav: 'faq',
    content: renderPageContainer('Care & Production Guide', 'Frequently Asked Questions', 'Materials, care guidelines, custom commissions, and transit standards.', body)
  });
}

// 4. /shipping
export function renderShippingPage(): string {
  const body = `
    <h2 class="font-display text-2xl font-bold text-[#0B0F19] mb-4">Pan-India Delivery & Protective Packaging</h2>
    <p>
      Because our handcrafted 3D creations contain intricate geometry, we never compromise on transit safety. Every item is packed with double-walled corrugated boxes with multi-layer bubble cushioning designed specifically for fragile 3D sculptures.
    </p>

    <h3 class="font-display text-xl font-bold text-[#0B0F19] mt-6 mb-2">Courier Partners & Coverage</h3>
    <p>
      We partner with leading Indian domestic logistics networks including <strong>BlueDart, Delhivery, and India Post Speed Post</strong> to service all serviceable Indian pin codes.
    </p>

    <h3 class="font-display text-xl font-bold text-[#0B0F19] mt-6 mb-2">Shipping Charges & Delivery Timelines</h3>
    <ul class="list-disc pl-5 space-y-2 mt-2">
      <li><strong>Standard Orders:</strong> Free insured nationwide shipping on all catalog orders above ₹999.</li>
      <li><strong>Transit Time:</strong> 2 to 5 business days depending on destination PIN code.</li>
      <li><strong>Tracking:</strong> Complete real-time tracking link dispatched via WhatsApp/SMS upon package handover.</li>
    </ul>
  `;

  return renderBaseLayout({
    title: 'Shipping Policy',
    description: 'BHAIRAVI Creations nationwide shipping policies, packaging standards, and estimated transit times across India.',
    canonicalPath: '/shipping',
    content: renderPageContainer('Logistics Standards', 'Shipping Policy', 'Pan-India insured packaging, carrier networks, and transit times.', body)
  });
}

// 5. /returns
export function renderReturnsPage(): string {
  const body = `
    <h2 class="font-display text-2xl font-bold text-[#0B0F19] mb-4">Artisanal Craft Guarantee & Transit Damage Protection</h2>
    <p>
      We take immense pride in every creation that leaves our workbench. If your piece arrives damaged during transit, we provide an immediate, zero-hassle replacement or refund.
    </p>

    <h3 class="font-display text-xl font-bold text-[#0B0F19] mt-6 mb-2">Transit Damage Claims (48-Hour Window)</h3>
    <p>
      Inspect your piece upon arrival. If damage occurred during shipping:
    </p>
    <ol class="list-decimal pl-5 space-y-2 mt-2">
      <li>Photograph the outer packaging and damaged areas within 48 hours of delivery.</li>
      <li>Send the photos to our WhatsApp desk (+91 73472 78010) or email us at <code>contact@bhairavicreations.com</code>.</li>
      <li>We will fast-track an immediate priority replacement or initiate a full refund.</li>
    </ol>
  `;

  return renderBaseLayout({
    title: 'Returns & Refunds',
    description: 'Learn about our 48-hour transit damage replacement guarantee and return policies for handcrafted 3D creations.',
    canonicalPath: '/returns',
    content: renderPageContainer('Buyer Assurance', 'Returns & Refunds Policy', 'Our 48-hour transit damage replacement guarantee and artisanal commitment.', body)
  });
}

// 6. /privacy
export function renderPrivacyPage(): string {
  const body = `
    <h2 class="font-display text-2xl font-bold text-[#0B0F19] mb-4">Digital Personal Data Protection (DPDP) Act 2023 Compliance</h2>
    <p>
      BHAIRAVI Creations operates under strict Zero-PII (Personally Identifiable Information) retention standards in full compliance with the Indian Digital Personal Data Protection Act, 2023.
    </p>

    <h3 class="font-display text-xl font-bold text-[#0B0F19] mt-6 mb-2">Data We Collect & How We Use It</h3>
    <ul class="list-disc pl-5 space-y-2 mt-2">
      <li><strong>Custom Order Inquiries:</strong> Contact phone numbers and design descriptions are used exclusively to evaluate feasibility and provide INR quotations.</li>
      <li><strong>IP Anonymization:</strong> IP addresses are hashed using daily cryptographically rotated salts via SHA-256. Raw IP addresses are never persisted.</li>
      <li><strong>Zero-Tracking Cookies:</strong> We do not deploy invasive third-party cross-site marketing trackers.</li>
    </ul>
  `;

  return renderBaseLayout({
    title: 'Privacy Policy',
    description: 'Learn how BHAIRAVI Creations protects your personal data in accordance with the Indian DPDP Act 2023.',
    canonicalPath: '/privacy',
    content: renderPageContainer('Data Ethics & Compliance', 'Privacy Policy', 'Zero-PII design and DPDP Act 2023 compliance.', body)
  });
}

// 7. /terms
export function renderTermsPage(): string {
  const body = `
    <h2 class="font-display text-2xl font-bold text-[#0B0F19] mb-4">Terms & Conditions of Service</h2>
    <p>
      Welcome to BHAIRAVI Creations. By browsing our digital storefront or commissioning custom 3D orders, you agree to these terms.
    </p>

    <h3 class="font-display text-xl font-bold text-[#0B0F19] mt-6 mb-2">Intellectual Property & Copyright</h3>
    <p>
      All sculpts, original 3D models, digital photography, and artisanal finishing methods published on this website are the intellectual property of BHAIRAVI Creations. Unauthorized reproduction or commercial resale of our digital CAD files is strictly prohibited.
    </p>

    <h3 class="font-display text-xl font-bold text-[#0B0F19] mt-6 mb-2">Governing Jurisdiction</h3>
    <p>
      Any disputes arising out of or related to our services shall be subject to the exclusive jurisdiction of the competent courts in Ludhiana, Punjab, India.
    </p>
  `;

  return renderBaseLayout({
    title: 'Terms of Service',
    description: 'Terms and conditions governing the use of BHAIRAVI Creations digital platform and custom 3D printing orders.',
    canonicalPath: '/terms',
    content: renderPageContainer('Legal Agreement', 'Terms of Service', 'Platform usage guidelines, intellectual property rights, and governing jurisdiction.', body)
  });
}
