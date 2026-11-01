/**
 * BHAIRAVI Creations Digital Platform
 * 7 Supporting Pages SSR Views (Feature F48)
 * Routes: /about, /contact, /faq, /shipping, /returns, /privacy, /terms
 * Target: src/server/views/supporting.view.ts
 */

import { STUDIO_DETAILS } from '../../shared/constants.js';
import { renderBaseLayout } from './layout.view.js';

function renderCardShell(title: string, subtitle: string, bodyContent: string): string {
  return `
    <div class="container" style="padding-top: 48px; padding-bottom: 80px; max-width: 860px;">
      <div style="margin-bottom: 36px; text-align: center;">
        <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--terracotta);">
          BHAIRAVI Creations Studio
        </span>
        <h1 style="font-family: var(--font-serif); font-size: 34px; font-weight: 700; color: var(--charcoal); margin-top: 6px;">
          ${title}
        </h1>
        <p style="font-size: 15px; color: #78716C; margin-top: 8px;">
          ${subtitle}
        </p>
      </div>

      <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; padding: 40px; line-height: 1.7; color: #44403C; font-size: 15px;">
        ${bodyContent}
      </div>
    </div>
  `;
}

// 1. /about
export function renderAboutPage(): string {
  const body = `
    <h2 style="font-family: var(--font-serif); font-size: 22px; color: var(--charcoal); margin-bottom: 14px;">Bridging Additive Precision with Generational Artistry</h2>
    <p style="margin-bottom: 16px;">
      Founded in Ludhiana, Punjab, <strong>BHAIRAVI Creations</strong> is a family-run 3D-printing and handcrafted-products studio. We believe the future of decorative art lives at the intersection of modern additive manufacturing and patient human craft.
    </p>
    <p style="margin-bottom: 16px;">
      While 3D printing delivers micro-step accuracy (0.12mm layer heights) that allows for geometric precision impossible with traditional casting molds, a raw 3D print is only half the creation. Every sculpture, planter, and architectural replica leaving our workbench undergoes progressive wet sanding to eliminate micro layer lines, followed by multi-coat artist acrylics, authentic hand-patination, and UV protective sealing applied individually by hand.
    </p>
    
    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">High-Grade PLA & PLA Pro Materials</h3>
    <p style="margin-bottom: 16px;">
      We prioritize high-grade, durable PLA and PLA Pro for our decorative creations. They are non-toxic, safe for family homes, and produce zero harmful fumes.
    </p>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">Zero Drop-Shipping. Pure Craft Honesty.</h3>
    <p>
      We do not drop-ship mass-manufactured imports or present generic AI mockups as real products. Every piece featured on this digital platform was sculpted, printed, sanded, and painted inside our studio in Ludhiana, Punjab.
    </p>
  `;

  return renderBaseLayout({
    title: 'About Us',
    description: 'Learn about BHAIRAVI Creations, a family-run 3D printing and handcrafted art studio founded in Ludhiana, Punjab, India.',
    canonicalPath: '/about',
    activeNav: 'about',
    content: renderCardShell('About BHAIRAVI Creations', 'Family heritage, 3D printing precision, and hand-painted artisanal finishing.', body)
  });
}

// 2. /contact
export function renderContactPage(): string {
  const body = `
    <h2 style="font-family: var(--font-serif); font-size: 24px; color: var(--charcoal); margin-bottom: 12px;">Get in Touch with Our Studio</h2>
    <p style="margin-bottom: 24px; color: #57534E;">
      Have a question about our catalogue pieces or want to discuss a custom 3D printing project? Reach out directly to our artisans in Ludhiana.
    </p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 32px;">
      <div style="background: #FAF9F6; border: 1px solid var(--stone-border); border-radius: 12px; padding: 20px;">
        <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #059669; margin-bottom: 6px;">WhatsApp Artisan Desk</div>
        <p style="font-size: 14px; color: #57534E; margin-bottom: 12px;">Quick responses for custom inquiries, progress updates, and sizing advice.</p>
        <a href="https://wa.me/${STUDIO_DETAILS.whatsapp_number}" target="_blank" rel="noopener noreferrer" style="color: #059669; font-weight: 700; text-decoration: underline; font-size: 15px;">
          +91 73472 78010 &rarr;
        </a>
      </div>

      <div style="background: #FAF9F6; border: 1px solid var(--stone-border); border-radius: 12px; padding: 20px;">
        <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--terracotta); margin-bottom: 6px;">Email Inquiries</div>
        <p style="font-size: 14px; color: #57534E; margin-bottom: 12px;">For detailed design briefs, 3D STL CAD files, and corporate gifting.</p>
        <a href="mailto:${STUDIO_DETAILS.contact_email}" style="color: var(--terracotta); font-weight: 700; text-decoration: underline; font-size: 15px;">
          ${STUDIO_DETAILS.contact_email} &rarr;
        </a>
      </div>

      <div style="background: #FAF9F6; border: 1px solid var(--stone-border); border-radius: 12px; padding: 20px;">
        <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--charcoal); margin-bottom: 6px;">Studio Location</div>
        <p style="font-size: 14px; color: #57534E; margin-bottom: 8px;">Ludhiana, Punjab, India</p>
        <p style="font-size: 13px; color: #78716C;">Online orders dispatched across all serviceable PIN codes in India.</p>
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="/custom-order" class="btn-primary" style="min-height: 48px;">
        Submit a Custom Order Enquiry &rarr;
      </a>
    </div>
  `;

  return renderBaseLayout({
    title: 'Contact Us',
    description: 'Get in touch with our founding artisans in Ludhiana, Punjab, India. Visit our studio or reach out via WhatsApp and email.',
    canonicalPath: '/contact',
    activeNav: 'contact',
    content: renderCardShell('Contact Our Studio', 'Ludhiana, Punjab, India', body)
  });
}

// 3. /faq
export function renderFaqPage(): string {
  const body = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div>
        <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin-bottom: 6px;">Are 3D-printed layer lines visible on the finished product?</h3>
        <p>No. We print with ultra-fine 0.12mm layer resolutions and subject every piece to progressive multi-stage wet sanding. This eliminates micro-stepping ridges, creating a tactile stone-smooth surface prior to primer application and acrylic hand-painting.</p>
      </div>

      <div style="border-top: 1px solid #F5F5F4; padding-top: 16px;">
        <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin-bottom: 6px;">What are the thermal limits and care instructions for PLA creations?</h3>
        <p>Our PLA and PLA Pro creations must be kept away from temperatures exceeding <strong>50°C (122°F)</strong>. Do not display in closed cars under direct summer sunlight or place near heaters. For cleaning, gently wipe with a dry or lightly dampened microfiber cloth. Avoid acetone or chemical solvent cleaners.</p>
      </div>

      <div style="border-top: 1px solid #F5F5F4; padding-top: 16px;">
        <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin-bottom: 6px;">How long does a custom 3D order take?</h3>
        <p>Standard custom orders take <strong>3 to 7 business days</strong> to sculpt, print, sand, and paint. Complex architectural models or custom lithophane lamp assemblies typically require <strong>7 to 10 business days</strong>. Transparent timelines are provided in our upfront INR quote.</p>
      </div>

      <div style="border-top: 1px solid #F5F5F4; padding-top: 16px;">
        <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin-bottom: 6px;">Do you deliver across India?</h3>
        <p>Yes. We ship to over 19,000 serviceable PIN codes across India via insured courier partners (BlueDart, Delhivery, Speed Post) in heavy-duty double-walled corrugated packaging with multi-layer bubble cushioning.</p>
      </div>
    </div>
  `;

  return renderBaseLayout({
    title: 'Frequently Asked Questions',
    description: 'Frequently asked questions about 3D printing accuracy, hand finishes, PLA care guidelines, and dispatch.',
    canonicalPath: '/faq',
    activeNav: 'faq',
    content: renderCardShell('Frequently Asked Questions', 'Materials, care guidelines, custom commissions, and transit standards.', body)
  });
}

// 4. /shipping
export function renderShippingPage(): string {
  const body = `
    <h2 style="font-family: var(--font-serif); font-size: 22px; color: var(--charcoal); margin-bottom: 14px;">Pan-India Delivery & Packaging Standards</h2>
    <p style="margin-bottom: 16px;">
      Because our handcrafted 3D creations contain intricate geometry, we never cut corners on transit safety. Every item is packed with double-walled corrugated boxes with multi-layer bubble cushioning designed specifically for fragile 3D art.
    </p>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">Courier Partners & Coverage</h3>
    <p style="margin-bottom: 16px;">
      We partner with leading Indian domestic logistics networks including <strong>BlueDart, Delhivery, and India Post Speed Post</strong> to service all serviceable Indian pin codes.
    </p>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">Shipping Charges & Delivery Timelines</h3>
    <ul style="padding-left: 20px; margin-bottom: 16px;">
      <li style="margin-bottom: 8px;"><strong>Ready-Stock Creations:</strong> Dispatched within 24–48 hours from our Ludhiana studio. Transit typically takes 2–4 business days to metro cities and 4–7 business days to regional locations.</li>
      <li style="margin-bottom: 8px;"><strong>Custom Orders:</strong> Dispatched in 3–7 business days after craft completion.</li>
      <li style="margin-bottom: 8px;"><strong>Shipping Rates:</strong> Flat ₹99 across India for orders under ₹1,499. Free domestic courier delivery on all orders of ₹1,499 and above.</li>
    </ul>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">Tracking & Insurance</h3>
    <p>
      Upon courier pickup, a tracking ID and live tracking link are immediately provided via WhatsApp and email. All dispatches carry transit insurance against loss or catastrophic breakage.
    </p>
  `;

  return renderBaseLayout({
    title: 'Shipping & Delivery Policy',
    description: 'Domestic India courier coverage via BlueDart, Delhivery, and Speed Post in reinforced protective packaging.',
    canonicalPath: '/shipping',
    content: renderCardShell('Shipping and Delivery Policy', 'Pan-India coverage, insured packaging, and transparent timelines.', body)
  });
}

// 5. /returns
export function renderReturnsPage(): string {
  const body = `
    <h2 style="font-family: var(--font-serif); font-size: 22px; color: var(--charcoal); margin-bottom: 14px;">Clear Distinction Between Ready-Stock & Custom Orders</h2>
    <p style="margin-bottom: 16px;">
      At BHAIRAVI Creations, we stand behind our craftsmanship. Because custom creations involve hours of dedicated CAD modeling, 3D printing, and individual hand-finishing, our return policies reflect the nature of artisanal work:
    </p>

    <div style="background: #FAF9F6; border: 1px solid var(--stone-border); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <h3 style="font-size: 16px; font-weight: 600; color: var(--charcoal); margin-bottom: 8px;">1. Ready-Stock Creations (7-Day Replacement for Transit Damage)</h3>
      <p style="font-size: 14px; color: #57534E;">
        If a ready-stock item arrives broken or damaged during courier transit, we offer a <strong>7-day replacement</strong>. To process a transit replacement claim, please share an unboxing video recorded at the time of package opening within 48 hours of delivery to our WhatsApp desk. A complimentary replacement will be expedited immediately.
      </p>
    </div>

    <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <h3 style="font-size: 16px; font-weight: 600; color: #9A3412; margin-bottom: 8px;">2. Custom Orders (Non-Cancellable Once Production Commences)</h3>
      <p style="font-size: 14px; color: #9A3412;">
        Custom orders are non-cancellable once 3D printing or hand-painting commences. Before printing, our artisans provide full 3D renders and photos for approval. In the rare event of transit damage to a custom commission, we will repair or re-print the piece at zero additional cost.
      </p>
    </div>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">Pre-Dispatch Cancellation</h3>
    <p>
      For catalogue orders cancelled prior to courier handover, a 100% refund is processed back to the original payment source within 5 to 7 banking days.
    </p>
  `;

  return renderBaseLayout({
    title: 'Returns & Cancellation Policy',
    description: '7-day transit damage replacement for ready stock and custom order non-cancellability terms.',
    canonicalPath: '/returns',
    content: renderCardShell('Returns & Cancellation', 'Fair, transparent transit replacements and craft integrity guarantees.', body)
  });
}

// 6. /privacy
export function renderPrivacyPage(): string {
  const body = `
    <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 16px; margin-bottom: 24px; color: #065F46; font-size: 13px;">
      <strong>DPDP Act 2023 Compliance:</strong> This policy is authored in strict accordance with the <em>Digital Personal Data Protection Act, 2023</em> of the Republic of India.
    </div>

    <h2 style="font-family: var(--font-serif); font-size: 22px; color: var(--charcoal); margin-bottom: 14px;">Data Fiduciary Commitment</h2>
    <p style="margin-bottom: 16px;">
      <strong>BHAIRAVI Creations</strong> ("we", "our", or "us"), operating out of Ludhiana, Punjab, India, acts as the Data Fiduciary for personal data collected through this digital platform. We are committed to transparency, minimal collection, and zero third-party monetization.
    </p>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">Anonymous First-Party Telemetry Only</h3>
    <p style="margin-bottom: 16px;">
      Our digital storefront tracks product impressions, clicks, and conversion funnels exclusively using privacy-preserving <strong>first-party telemetry</strong>. We do not use third-party advertising cookies, Google Analytics, or covert browser fingerprinting. Telemetry payloads never contain passwords, payment card information, or private WhatsApp message bodies.
    </p>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">Custom Order Enquiry Data</h3>
    <p style="margin-bottom: 16px;">
      When you submit a custom order enquiry, we collect your name, phone number, and optional email solely to provide technical feasibility reviews, CAD assessments, and fixed INR quotations. We do not sell, rent, or trade your contact information to any marketing broker.
    </p>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">Rights of the Data Principal</h3>
    <p style="margin-bottom: 16px;">
      Under the DPDP Act 2023, you hold the right to access, correct, update, and request erasure of your personal data. You may also withdraw consent or opt-out of non-essential analytics at any time.
    </p>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">Grievance Redressal Officer</h3>
    <p>
      For privacy questions or data erasure requests, please contact our designated Grievance Officer at:<br>
      <strong>Email:</strong> <a href="mailto:grievance@bhairavicreations.com" style="color: var(--terracotta); text-decoration: underline;">grievance@bhairavicreations.com</a><br>
      <strong>Physical Address:</strong> ${STUDIO_DETAILS.address}
    </p>
  `;

  return renderBaseLayout({
    title: 'Privacy Policy (DPDP Act 2023)',
    description: 'Digital Personal Data Protection Act 2023 compliance. First-party anonymous analytics with zero PII harvesting.',
    canonicalPath: '/privacy',
    content: renderCardShell('Privacy Policy (DPDP Act 2023)', 'Data fiduciary disclosures, anonymous telemetry, and data principal rights.', body)
  });
}

// 7. /terms
export function renderTermsPage(): string {
  const body = `
    <h2 style="font-family: var(--font-serif); font-size: 22px; color: var(--charcoal); margin-bottom: 14px;">Terms of Service & Studio Policies</h2>
    <p style="margin-bottom: 16px;">
      Welcome to BHAIRAVI Creations. By browsing our digital storefront, purchasing through our verified channels, or commissioning custom 3D prints, you agree to the following terms:
    </p>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">1. Currency & Pricing</h3>
    <p style="margin-bottom: 16px;">
      All prices displayed on this storefront are denominated strictly in <strong>Indian Rupees (INR / ₹)</strong> and are inclusive of applicable Goods and Services Tax (GST) unless explicitly noted otherwise. Prices are subject to dynamic update via our admin system without retroactive effect on accepted orders.
    </p>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">2. Intellectual Property Rights</h3>
    <p style="margin-bottom: 16px;">
      All proprietary 3D digital sculptures, original CAD models, product photographs, artisanal copy, and brand marks are the exclusive intellectual property of BHAIRAVI Creations, protected under Indian Copyright and Trademark laws. Unauthorized redistribution, commercial 3D scanning, or resale of our digital models is strictly prohibited.
    </p>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">3. Customer CAD & Design Warranties</h3>
    <p style="margin-bottom: 16px;">
      When uploading CAD files (.stl) or reference imagery for custom orders, you represent and warrant that you hold the legal copyright, license, or authorization to reproduce the design. BHAIRAVI Creations categorically refuses to print weapons, defamatory content, or designs that infringe third-party intellectual property.
    </p>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">4. Product Usage & Limitations</h3>
    <p style="margin-bottom: 16px;">
      Our 3D creations are intended for indoor decorative and exhibition purposes. Unless specifically manufactured in food-grade or structural engineering resins, creations must not be used for direct food contact or load-bearing automotive applications. Keep PLA pieces away from temperatures exceeding 50°C.
    </p>

    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 24px 0 10px 0;">5. Governing Law & Exclusive Jurisdiction</h3>
    <p>
      These Terms of Service are governed by and construed in accordance with the substantive laws of the Republic of India. Any disputes arising out of or in connection with this platform shall be subject to the exclusive jurisdiction of the competent courts of <strong>Ludhiana, Punjab, India</strong>.
    </p>
  `;

  return renderBaseLayout({
    title: 'Terms of Service',
    description: 'Terms of service, INR currency pricing, 3D model copyright protection, and Ludhiana, Punjab jurisdiction.',
    canonicalPath: '/terms',
    content: renderCardShell('Terms of Service', 'Commercial terms, copyright protections, and Indian court jurisdiction.', body)
  });
}
