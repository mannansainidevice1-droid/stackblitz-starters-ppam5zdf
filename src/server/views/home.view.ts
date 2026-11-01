/**
 * BHAIRAVI Creations Digital Platform
 * Home Page SSR View (Features F34–F39)
 * Target: src/server/views/home.view.ts
 */

import { BRAND_DRAFT_COPY, STUDIO_DETAILS, CUSTOM_COMMISSION_STEPS } from '../../shared/constants.js';
import { formatPaiseToInr } from '../../shared/pricing.js';
import { renderBaseLayout, escapeHtml } from './layout.view.js';

export interface HomePageProps {
  settings?: Record<string, string>;
  featuredProducts?: any[];
}

export function renderHomePage(props: HomePageProps = {}): string {
  const { settings = {}, featuredProducts = [] } = props;

  const heroHeadline =
    settings['brand.hero_headline'] ||
    BRAND_DRAFT_COPY.hero_headline ||
    'Thoughtfully created. Precisely printed. Finished by hand.';

  const heroSubheadline =
    settings['brand.hero_subheadline'] ||
    BRAND_DRAFT_COPY.hero_subheadline ||
    'A family-run 3D-printing and handcrafted-products studio in India. Blending mathematical digital precision with timeless artisanal hand-finishing.';

  const content = `
    <!-- Section 1: Hero Section (Feature F35) -->
    <section class="hero-section" style="padding: 72px 0 64px 0; border-bottom: 1px solid var(--stone-border); background: linear-gradient(180deg, #FAF9F6 0%, #F5F5F4 100%);">
      <div class="container text-center" style="max-width: 900px; margin: 0 auto;">
        <span style="display: inline-block; padding: 4px 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--terracotta); background: #FFEDD5; border-radius: 9999px; margin-bottom: 20px;">
          Family-Run Artisanal 3D Studio • Ludhiana, India
        </span>
        <h1 class="text-2xl sm:text-4xl lg:text-5xl font-serif tracking-tight" style="font-family: var(--font-serif); font-size: clamp(28px, 5vw, 52px); font-weight: 700; color: var(--charcoal); line-height: 1.15; margin-bottom: 20px;">
          ${escapeHtml(heroHeadline)}
        </h1>
        <p style="font-size: clamp(16px, 2vw, 19px); color: #57534E; line-height: 1.6; max-width: 720px; margin: 0 auto 36px auto;">
          ${escapeHtml(heroSubheadline)}
        </p>

        <!-- Dual Call-to-Action Buttons (min 48px touch height) -->
        <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          <a href="/products" class="btn-primary" style="min-height: 48px; padding: 14px 32px;">
            Explore Catalogue
          </a>
          <a href="/custom-order" class="btn-secondary" style="min-height: 48px; padding: 14px 32px;">
            Custom Order Enquiry
          </a>
        </div>
      </div>
    </section>

    <!-- Section 2: 4-Stage Craft Journey Visual Narrative (Feature F36) -->
    <section id="craft-journey" style="padding: 80px 0; border-bottom: 1px solid var(--stone-border);">
      <div class="container max-w-7xl mx-auto px-4 overflow-hidden">
        <div style="text-align: center; max-width: 680px; margin: 0 auto 56px auto;">
          <h2 style="font-family: var(--font-serif); font-size: 32px; font-weight: 700; color: var(--charcoal); margin-bottom: 12px;">
            The 4-Stage Craft Journey
          </h2>
          <p style="font-size: 16px; color: #78716C;">
            How our family studio unites mathematical additive manufacturing with patient, human artistry.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px;">
          ${BRAND_DRAFT_COPY.craft_stages
            .map(
              (stage) => `
            <div class="craft-stage-card" style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 12px; padding: 28px; position: relative; display: flex; flex-direction: column;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #FFEDD5; color: var(--terracotta); font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px;">
                0${stage.step}
              </div>
              <h3 style="font-family: var(--font-serif); font-size: 19px; font-weight: 600; color: var(--charcoal); margin-bottom: 10px;">
                ${escapeHtml(stage.title)}
              </h3>
              <p style="font-size: 14px; color: #57534E; line-height: 1.5; flex-grow: 1;">
                ${escapeHtml(stage.desc)}
              </p>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </section>

    <!-- Section 3: Family Studio Origin Story (Feature F37) -->
    <section id="studio-story" style="padding: 80px 0; border-bottom: 1px solid var(--stone-border); background: #FAF9F6;">
      <div class="container">
        <article style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 48px; align-items: center;">
          <div>
            <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--terracotta);">
              Authentic Indian Craft Heritage
            </span>
            <h2 style="font-family: var(--font-serif); font-size: 32px; font-weight: 700; color: var(--charcoal); margin: 12px 0 20px 0; line-height: 1.25;">
              Crafted in Our Ludhiana Family Studio
            </h2>
            <p style="font-size: 15px; color: #57534E; line-height: 1.7; margin-bottom: 16px;">
              Founded in Ludhiana, Punjab, BHAIRAVI Creations was born from a singular passion: bridging modern 3D printing precision with authentic Indian craftsmanship. Every piece is thoughtfully sculpted, printed with fine detail, and finished by hand.
            </p>
            <p style="font-size: 15px; color: #57534E; line-height: 1.7; margin-bottom: 16px;">
              While our 3D printers create the microscopic layer foundations at 0.12mm layer height, every stroke of color and texture is painted individually by hand using artists pigments, traditional patinas, and non-toxic UV sealants.
            </p>
            <p style="font-size: 15px; color: #57534E; line-height: 1.7;">
              We craft with high-grade PLA and PLA Pro for durable, safe, non-toxic decor for family living spaces. Zero fake reviews, zero fabricated claims—just genuine craft integrity.
            </p>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; padding: 24px; text-align: center;">
            <div style="aspect-ratio: 4/3; background: #F5F5F4; border-radius: 12px; overflow: hidden; margin-bottom: 16px; display: flex; align-items: center; justify-content: center;">
              <img src="/assets/images/studio-workbench.webp"
                   alt="Ludhiana family studio workbench with precision 3D printer and hand-painting tools"
                   loading="lazy"
                   style="width: 100%; height: 100%; object-fit: cover;"
                   onerror="this.src='/assets/images/placeholder_studio_piece.webp'" />
            </div>
            <div style="font-size: 13px; color: #78716C; font-style: italic;">
              Artisanal hand-finishing bench at our studio in Ludhiana, Punjab
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- Section 4: 4-Step Custom Order Commission Roadmap (Feature F38) -->
    <section id="custom-roadmap" style="padding: 80px 0; border-bottom: 1px solid var(--stone-border);">
      <div class="container">
        <div style="text-align: center; max-width: 680px; margin: 0 auto 56px auto;">
          <h2 style="font-family: var(--font-serif); font-size: 32px; font-weight: 700; color: var(--charcoal); margin-bottom: 12px;">
            Custom Orders
          </h2>
          <p style="font-size: 16px; color: #78716C;">
            From digital concept to insured delivery. Fixed upfront pricing with transparent lead times.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-bottom: 40px;">
          ${CUSTOM_COMMISSION_STEPS.map(
            (step) => `
            <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 12px; padding: 24px;">
              <div style="font-size: 12px; font-weight: 700; color: var(--terracotta); text-transform: uppercase; margin-bottom: 8px;">
                Step 0${step.step}
              </div>
              <h3 style="font-family: var(--font-serif); font-size: 18px; font-weight: 600; color: var(--charcoal); margin-bottom: 10px;">
                ${escapeHtml(step.title)}
              </h3>
              <p style="font-size: 14px; color: #57534E; line-height: 1.5;">
                ${escapeHtml(step.desc)}
              </p>
            </div>
          `
          ).join('')}
        </div>

        <div style="background: #FFEDD5; border: 1px solid #FED7AA; border-radius: 12px; padding: 20px; max-width: 760px; margin: 0 auto 32px auto; text-align: center;">
          <p style="font-size: 14px; color: #9A3412; font-weight: 500;">
            Standard turnaround is 3 to 7 business days. Complex architectural models or lithophane multi-lamp assemblies may require 7–10 days.
          </p>
        </div>

        <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          <a href="/custom-order" class="btn-primary" style="min-height: 48px;">
            Start Custom Order
          </a>
          <a href="https://wa.me/${STUDIO_DETAILS.whatsapp_number}"
             target="_blank"
             rel="noopener noreferrer"
             data-tracking-cta="whatsapp_roadmap"
             class="btn-secondary"
             style="min-height: 48px;">
            Chat with Artisan on WhatsApp
          </a>
        </div>
      </div>
    </section>

    <!-- Section 5: Featured Creations Showcase -->
    ${
      featuredProducts.length > 0
        ? `
      <section class="featured-showcase" style="padding: 80px 0; border-bottom: 1px solid var(--stone-border); background: #FAF9F6;">
        <div class="container">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; flex-wrap: wrap; gap: 16px;">
            <div>
              <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--terracotta);">
                Signature Pieces
              </span>
              <h2 style="font-family: var(--font-serif); font-size: 32px; font-weight: 700; color: var(--charcoal); margin-top: 6px;">
                Featured Creations
              </h2>
            </div>
            <a href="/products" style="font-size: 14px; font-weight: 600; color: var(--terracotta);">
              View Full Catalogue &rarr;
            </a>
          </div>

          <div class="catalog-flex-grid" style="display: flex; flex-wrap: wrap; gap: 28px; justify-content: flex-start;">
            ${featuredProducts
              .map(
                (p) => {
                  const isSoldOut = !p.is_made_to_order && p.inventory_count <= 0;
                  return `
              <article class="product-card catalog-card" data-product-id="${p.id}" style="flex: 1 1 320px; max-width: 100%; background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(28, 25, 23, 0.04);">
                <div class="card-image-wrap" style="aspect-ratio: 4/3; background: #F5F5F4; position: relative; overflow: hidden;">
                  <img src="${p.primary_image?.public_url || '/assets/images/placeholder_studio_piece.webp'}"
                       alt="${escapeHtml(p.primary_image?.alt_text || p.name)}"
                       loading="lazy"
                       style="width: 100%; height: 100%; object-fit: cover;"
                       onerror="this.src='/assets/images/placeholder_studio_piece.webp'" />
                  ${
                    isSoldOut
                      ? `
                    <span style="position: absolute; top: 12px; left: 12px; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; background: rgba(220, 38, 38, 0.9); color: #FFFFFF;">
                      Sold Out
                    </span>
                  `
                      : ''
                  }
                </div>
                <div style="padding: 24px; display: flex; flex-direction: column; flex-grow: 1;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #78716C; margin-bottom: 6px;">
                    ${escapeHtml(p.category?.name || 'Handcrafted')}
                  </div>
                  <h3 style="font-family: var(--font-serif); font-size: 18px; font-weight: 600; color: var(--charcoal); margin-bottom: 10px; line-height: 1.35;">
                    <a href="/products/${p.slug}" style="color: inherit;">
                      ${escapeHtml(p.name)}
                    </a>
                  </h3>
                  <div style="margin-top: auto; padding-top: 16px; border-top: 1px solid var(--stone-border); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 18px; font-weight: 700; color: var(--charcoal); letter-spacing: -0.01em;">
                      ${formatPaiseToInr(p.base_price_paise)}
                    </span>
                    <a href="/products/${p.slug}" style="font-size: 13px; font-weight: 600; color: var(--terracotta); display: inline-flex; align-items: center; gap: 4px;">
                      View Piece &rarr;
                    </a>
                  </div>
                </div>
              </article>
            `;
                }
              )
              .join('')}
          </div>
        </div>
      </section>
    `
        : ''
    }

    <!-- Section 6: Verified Amazon & WhatsApp Trust Channels (Feature F39) -->
    <section class="trust-channels-section" style="padding: 80px 0;">
      <div class="container">
        <div style="text-align: center; max-width: 680px; margin: 0 auto 48px auto;">
          <h2 style="font-family: var(--font-serif); font-size: 32px; font-weight: 700; color: var(--charcoal); margin-bottom: 12px;">
            Verified Commerce & Direct Consultation
          </h2>
          <p style="font-size: 16px; color: #78716C;">
            Choose fast Amazon Prime delivery for ready-stock pieces or speak directly with our studio artisans.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 28px;">
          <!-- Amazon Trust Card -->
          <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; padding: 32px; display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <span style="font-weight: 700; font-size: 18px; color: #111111;">Amazon India Storefront</span>
            </div>
            <p style="font-size: 14px; color: #57534E; line-height: 1.6; margin-bottom: 24px; flex-grow: 1;">
              Shop our curated ready-stock creations fulfilled via Amazon Prime across India with 1–2 day shipping.
            </p>
            <a href="${STUDIO_DETAILS.amazon_store_url}"
               target="_blank"
               rel="noopener noreferrer"
               data-tracking-cta="amazon_card"
               class="btn-amazon"
               style="width: 100%;">
              Visit Amazon Storefront &rarr;
            </a>
          </div>

          <!-- WhatsApp Trust Card -->
          <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; padding: 32px; display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <span style="font-weight: 700; font-size: 18px; color: #059669;">WhatsApp Direct Consultation</span>
            </div>
            <p style="font-size: 14px; color: #57534E; line-height: 1.6; margin-bottom: 24px; flex-grow: 1;">
              Speak directly with our founding artisans about custom dimensions, finishes, and corporate gifting.
            </p>
            <a href="https://wa.me/${STUDIO_DETAILS.whatsapp_number}"
               target="_blank"
               rel="noopener noreferrer"
               data-tracking-cta="whatsapp_card"
               class="btn-whatsapp"
               style="width: 100%;">
              Open WhatsApp Chat &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  `;

  return renderBaseLayout({
    title: 'Handcrafted 3D Printing Studio Ludhiana',
    description: heroSubheadline,
    canonicalPath: '/',
    activeNav: 'home',
    content
  });
}
