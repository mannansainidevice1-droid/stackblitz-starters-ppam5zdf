/**
 * BHAIRAVI Creations Digital Platform
 * Modern Centered Hero Product Detail Page (PDP) SSR View
 * Target: src/server/views/pdp.view.ts
 */

import { formatPaiseToInr, paiseToRupees } from '../../shared/pricing.js';
import { DEFAULT_CARE_INSTRUCTIONS, MANDATORY_ATTRIBUTION_DISCLAIMER, STUDIO_DETAILS } from '../../shared/constants.js';
import { renderBaseLayout, escapeHtml } from './layout.view.js';

export interface PdpPageProps {
  product: any;
  relatedProducts?: any[];
}

export function renderProductDetailPage(props: PdpPageProps): string {
  const { product, relatedProducts = [] } = props;

  // Primary and raw print images
  const images: any[] = product.gallery_images || [];
  const primaryImage = images.find((img) => img.is_primary) || images[0] || {
    public_url: '/assets/images/placeholder_studio_piece.webp',
    alt_text: product.name
  };
  const rawPrintImage = images.find(
    (img) => img.public_url && (img.public_url.includes('raw_print') || (img.alt_text && img.alt_text.toLowerCase().includes('raw print')))
  );

  // Dimensions & Care Instructions
  const dims = product.dimensions_cm || {};
  const dimsFormatted =
    dims.length && dims.width && dims.height
      ? `${dims.length} × ${dims.width} × ${dims.height} cm`
      : 'Bespoke custom dimensions available upon request';

  const careNotes =
    product.care_safety_instructions && product.care_safety_instructions.trim().length > 0
      ? product.care_safety_instructions
      : DEFAULT_CARE_INSTRUCTIONS;

  // Commerce Actions
  const amazonUrl = product.commerce_actions?.amazon_url || product.amazon_url;
  const amazonAsin = product.commerce_actions?.amazon_asin || product.amazon_asin;
  const defaultWaMsg = `Hello BHAIRAVI Creations! Inquiring about ${product.name}.`;
  const defaultWaUrl = `https://wa.me/${STUDIO_DETAILS.whatsapp_number}?text=${encodeURIComponent(defaultWaMsg)}`;
  const waUrl = product.commerce_actions?.whatsapp_url || defaultWaUrl;

  const variants: any[] = product.variants || [];

  const content = `
    <div id="pdp-container"
         class="container"
         data-product-id="${product.id}"
         data-product-slug="${product.slug}"
         data-product-name="${escapeHtml(product.name)}"
         data-base-price-paise="${product.base_price_paise}"
         data-finished-url="${escapeHtml(primaryImage.public_url)}"
         data-raw-print-url="${rawPrintImage ? escapeHtml(rawPrintImage.public_url) : ''}"
         data-studio-phone="${STUDIO_DETAILS.whatsapp_number}"
         style="padding-top: 36px; padding-bottom: 80px;">

      <!-- Breadcrumbs Navigation -->
      <nav aria-label="Breadcrumb" style="margin-bottom: 24px; font-size: 13px; color: #78716C;">
        <ol style="display: flex; gap: 8px; list-style: none; flex-wrap: wrap; align-items: center; justify-content: center;">
          <li><a href="/" style="color: inherit;">Home</a></li>
          <li>/</li>
          <li><a href="/products" style="color: inherit;">Catalogue</a></li>
          <li>/</li>
          <li><a href="/products?category=${escapeHtml(product.category?.slug || '')}" style="color: inherit;">${escapeHtml(product.category?.name || 'Category')}</a></li>
          <li>/</li>
          <li style="color: var(--charcoal); font-weight: 500;" aria-current="page">${escapeHtml(product.name)}</li>
        </ol>
      </nav>

      <!-- 1. Modern Centered Hero Stage (Focal Showcase) -->
      <div class="pdp-hero-stage" style="text-align: center; max-width: 900px; margin: 0 auto 48px auto;">
        
        <!-- Category & Badges -->
        <div style="margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: var(--terracotta);">
            ${escapeHtml(product.category?.name || 'Artisanal Studio Creation')}
          </span>
        </div>

        <!-- Product Title -->
        <h1 style="font-family: var(--font-serif); font-size: 40px; font-weight: 700; color: var(--charcoal); line-height: 1.2; margin-bottom: 12px; letter-spacing: -0.01em;">
          ${escapeHtml(product.name)}
        </h1>

        <!-- Price Display -->
        <div style="display: flex; justify-content: center; align-items: baseline; gap: 10px; margin-bottom: 28px;">
          <span id="pdp-price-display" style="font-size: 32px; font-weight: 700; color: var(--charcoal); letter-spacing: -0.02em;">
            ${formatPaiseToInr(product.base_price_paise)}
          </span>
          <span style="font-size: 14px; color: #78716C;">(Inclusive of all taxes & nationwide shipping)</span>
        </div>

        <!-- Centered Main Image Viewport -->
        <div style="max-width: 860px; margin: 0 auto; background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 20px; overflow: hidden; box-shadow: 0 12px 32px rgba(28, 25, 23, 0.06); position: relative;">
          <div style="aspect-ratio: 16/10; position: relative; overflow: hidden; background: #F5F5F4;">
            <img
              id="pdp-main-image"
              src="${escapeHtml(primaryImage.public_url)}"
              alt="${escapeHtml(primaryImage.alt_text || product.name)}"
              style="width: 100%; height: 100%; object-fit: cover; cursor: zoom-in; transition: transform 0.3s ease;"
              onerror="this.src='/assets/images/placeholder_studio_piece.webp'"
            />
          </div>

          <!-- Raw Print vs Hand-Finished Toggle Pill -->
          ${
            rawPrintImage
              ? `
            <div style="position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 10;">
              <div style="display: inline-flex; padding: 4px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); border: 1px solid var(--stone-border); border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" role="group" aria-label="Craftsmanship comparison">
                <button
                  id="toggle-hand-finished"
                  type="button"
                  aria-pressed="true"
                  style="border: none; padding: 8px 18px; font-size: 12px; font-weight: 600; cursor: pointer; border-radius: 9999px; background: var(--charcoal); color: #FFFFFF; transition: all 0.15s ease;">
                  Hand-Finished Piece
                </button>
                <button
                  id="toggle-raw-print"
                  type="button"
                  aria-pressed="false"
                  style="border: none; padding: 8px 18px; font-size: 12px; font-weight: 500; cursor: pointer; border-radius: 9999px; background: transparent; color: #57534E; transition: all 0.15s ease;">
                  Raw 3D Print
                </button>
              </div>
            </div>
          `
              : ''
          }
        </div>

        <!-- Centered Thumbnail Strip underneath hero -->
        ${
          images.length > 1
            ? `
          <div style="display: flex; gap: 14px; justify-content: center; margin-top: 24px; overflow-x: auto; padding-bottom: 8px;" role="tablist" aria-label="Product thumbnails">
            ${images
              .map(
                (img, idx) => `
              <button
                type="button"
                role="tab"
                class="gallery-thumb-btn ${idx === 0 ? 'border-[#C2410C] ring-2 ring-[#C2410C]' : 'border-stone-200'}"
                data-image-url="${escapeHtml(img.public_url)}"
                data-alt-text="${escapeHtml(img.alt_text || product.name)}"
                aria-selected="${idx === 0 ? 'true' : 'false'}"
                style="width: 72px; height: 72px; border-radius: 12px; overflow: hidden; border: 2px solid; padding: 0; background: #F5F5F4; cursor: pointer; flex-shrink: 0;">
                <img src="${escapeHtml(img.public_url)}" alt="${escapeHtml(img.alt_text || product.name)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/assets/images/placeholder_studio_piece.webp'" />
              </button>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>

      <!-- 2. Clean Organized Content Grid Underneath Hero -->
      <div style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 40px;">
        
        <!-- Row A: Narrative & Variant Selection -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 36px; align-items: start;">
          <!-- Editorial Description -->
          <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(28, 25, 23, 0.04);">
            <h2 style="font-family: var(--font-serif); font-size: 20px; font-weight: 600; color: var(--charcoal); margin-bottom: 14px;">
              The Artisanal Narrative
            </h2>
            <p style="font-size: 15px; color: #57534E; line-height: 1.7; margin-bottom: 24px;">
              ${escapeHtml(product.description)}
            </p>
            
            <!-- Studio Craft Highlights -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 11px; font-weight: 600; background: #FAF9F6; border: 1px solid var(--stone-border); padding: 5px 10px; border-radius: 6px; color: #57534E;">
                0.12mm Ultra-Fine Layers
              </span>
              <span style="font-size: 11px; font-weight: 600; background: #FAF9F6; border: 1px solid var(--stone-border); padding: 5px 10px; border-radius: 6px; color: #57534E;">
                Hand-Painted Pigments
              </span>
              <span style="font-size: 11px; font-weight: 600; background: #FAF9F6; border: 1px solid var(--stone-border); padding: 5px 10px; border-radius: 6px; color: #57534E;">
                PLA / PLA Pro
              </span>
            </div>
          </div>

          <!-- Variant Edition Selector -->
          <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(28, 25, 23, 0.04);">
            <h2 style="font-family: var(--font-serif); font-size: 20px; font-weight: 600; color: var(--charcoal); margin-bottom: 14px;">
              Finish & Size Editions
            </h2>
            ${
              variants.length > 0
                ? `
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${variants
                  .map((v, idx) => {
                    const isAvailable = v.is_available !== 0;
                    const deltaPaise = v.price_modifier_paise || 0;
                    let deltaStr = '₹0';
                    if (deltaPaise > 0) deltaStr = `+₹${paiseToRupees(deltaPaise)}`;
                    else if (deltaPaise < 0) deltaStr = `-₹${paiseToRupees(Math.abs(deltaPaise))}`;
                    const effectivePriceStr = formatPaiseToInr(product.base_price_paise + deltaPaise);

                    return `
                    <button
                      type="button"
                      class="variant-btn ${idx === 0 ? 'border-[#C2410C] bg-orange-50/40 ring-1 ring-[#C2410C]' : 'border-[#E7E5E4] bg-white'}"
                      data-variant-id="${v.id}"
                      data-variant-sku="${v.sku}"
                      data-variant-name="${escapeHtml(v.variant_name)}"
                      data-price-modifier="${deltaPaise}"
                      data-dimensions="${escapeHtml(JSON.stringify(v.dimensions_cm || {}))}"
                      ${!isAvailable ? 'aria-disabled="true" disabled' : `aria-pressed="${idx === 0 ? 'true' : 'false'}"`}
                      style="text-align: left; padding: 14px 18px; border: 1px solid; border-radius: 10px; cursor: ${isAvailable ? 'pointer' : 'not-allowed'}; opacity: ${isAvailable ? '1' : '0.5'};">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 14px; font-weight: 600; color: var(--charcoal);">${escapeHtml(v.variant_name)}</span>
                        <span style="font-size: 13px; font-weight: 600; color: ${deltaPaise > 0 ? 'var(--terracotta)' : '#78716C'};">
                          ${deltaStr} (${effectivePriceStr})
                        </span>
                      </div>
                      ${!isAvailable ? '<span style="font-size: 11px; font-weight: 600; color: #DC2626; display: block; margin-top: 4px;">Sold Out</span>' : ''}
                    </button>
                  `;
                  })
                  .join('')}
              </div>
            `
                : `
              <p style="font-size: 14px; color: #78716C;">
                Standard studio edition. Custom sizing and bespoke colourways available via custom order.
              </p>
            `
            }
          </div>
        </div>

        <!-- Row B: Purchase Channels & Direct Consultation -->
        <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; padding: 32px; box-shadow: 0 4px 16px rgba(28, 25, 23, 0.04);">
          <div style="text-align: center; max-width: 600px; margin: 0 auto 24px auto;">
            <h2 style="font-family: var(--font-serif); font-size: 22px; font-weight: 700; color: var(--charcoal); margin-bottom: 6px;">
              Acquire This Piece
            </h2>
            <p style="font-size: 14px; color: #78716C;">
              Choose fast Amazon India Prime checkout for ready inventory or chat directly with our studio artisans.
            </p>
          </div>

          <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; max-width: 720px; margin: 0 auto;">
            ${
              amazonUrl
                ? `
              <a href="${escapeHtml(amazonUrl)}"
                 target="_blank"
                 rel="noopener noreferrer"
                 data-commerce-action="amazon"
                 data-asin="${escapeHtml(amazonAsin || '')}"
                 class="btn-amazon"
                 style="flex: 1 1 280px; min-height: 52px; font-size: 15px; border-radius: 10px;">
                <span style="margin-right: 8px;">Buy on Amazon India</span>
                <svg style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            `
                : `
              <div style="flex: 1 1 280px; padding: 14px; background: #FAF9F6; border: 1px solid var(--stone-border); border-radius: 10px; text-align: center;">
                <span style="font-size: 12px; font-weight: 600; color: #92400E;">Studio Exclusive Piece</span>
                <p style="font-size: 12px; color: #78716C; margin-top: 2px;">Handcrafted to order directly from our Ludhiana workshop.</p>
              </div>
            `
            }

            <a href="${escapeHtml(waUrl)}"
               target="_blank"
               rel="noopener noreferrer"
               data-commerce-action="whatsapp"
               class="btn-whatsapp"
               style="flex: 1 1 280px; min-height: 52px; font-size: 15px; border-radius: 10px;">
              <svg style="width: 18px; height: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
              <span>Consult on WhatsApp</span>
            </a>
          </div>

          <p style="font-size: 11px; color: #78716C; text-align: center; font-style: italic; margin-top: 16px; line-height: 1.4;">
            ${MANDATORY_ATTRIBUTION_DISCLAIMER}
          </p>
        </div>

        <!-- Row C: Technical Specifications Matrix -->
        <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(28, 25, 23, 0.04);">
          <h2 style="font-family: var(--font-serif); font-size: 20px; font-weight: 600; color: var(--charcoal); margin-bottom: 20px;">
            Technical Specifications & Craft Details
          </h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
            <div style="border-bottom: 1px solid #F5F5F4; padding-bottom: 10px;">
              <span style="font-size: 12px; color: #78716C; display: block;">Dimensions</span>
              <span id="pdp-spec-dims" style="font-size: 14px; font-weight: 600; color: var(--charcoal);">${escapeHtml(dimsFormatted)}</span>
            </div>
            <div style="border-bottom: 1px solid #F5F5F4; padding-bottom: 10px;">
              <span style="font-size: 12px; color: #78716C; display: block;">Weight</span>
              <span style="font-size: 14px; font-weight: 600; color: var(--charcoal);">${product.weight_grams} grams</span>
            </div>
            <div style="border-bottom: 1px solid #F5F5F4; padding-bottom: 10px;">
              <span style="font-size: 12px; color: #78716C; display: block;">Additive Manufacturing</span>
              <span style="font-size: 14px; color: var(--charcoal);">${escapeHtml(product.manufacturing_method || '0.12mm Ultra-Fine Additive Layering')}</span>
            </div>
            <div style="border-bottom: 1px solid #F5F5F4; padding-bottom: 10px;">
              <span style="font-size: 12px; color: #78716C; display: block;">Surface Finishing</span>
              <span style="font-size: 14px; color: var(--charcoal);">${escapeHtml(product.finishing_type || 'Triple wet-sanded, surface-primed, hand-painted')}</span>
            </div>
            <div style="border-bottom: 1px solid #F5F5F4; padding-bottom: 10px;">
              <span style="font-size: 12px; color: #78716C; display: block;">Base Material</span>
              <span style="font-size: 14px; color: var(--charcoal);">${escapeHtml(product.material || 'Eco-friendly biodegradable PLA Pro')}</span>
            </div>
            <div style="border-bottom: 1px solid #F5F5F4; padding-bottom: 10px;">
              <span style="font-size: 12px; color: #78716C; display: block;">Production Lead Time</span>
              <span style="font-size: 14px; color: var(--charcoal);">${escapeHtml(product.production_lead_days || '3-5 business days')}</span>
            </div>
            <div style="border-bottom: 1px solid #F5F5F4; padding-bottom: 10px;">
              <span style="font-size: 12px; color: #78716C; display: block;">Dispatch & Insured Transit</span>
              <span style="font-size: 14px; color: var(--charcoal);">${escapeHtml(product.dispatch_estimate || 'Dispatched from Ludhiana studio across India via insured courier')}</span>
            </div>
            <div style="border-bottom: 1px solid #F5F5F4; padding-bottom: 10px;">
              <span style="font-size: 12px; color: #78716C; display: block;">Thermal Advisory & Care</span>
              <span style="font-size: 13px; font-weight: 500; color: #9A3412;">${escapeHtml(careNotes)}</span>
            </div>
          </div>
        </div>

        <!-- Row D: Curated Related Creations -->
        ${
          relatedProducts.length > 0
            ? `
          <div style="margin-top: 40px; padding-top: 36px; border-top: 1px solid var(--stone-border);">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--terracotta);">
                Studio Recommendations
              </span>
              <h2 style="font-family: var(--font-serif); font-size: 26px; font-weight: 700; color: var(--charcoal); margin-top: 4px;">
                Related Creations
              </h2>
            </div>

            <div class="catalog-flex-grid" style="display: flex; flex-wrap: wrap; gap: 24px;">
              ${relatedProducts
                .map(
                  (rel) => `
                <article class="product-card catalog-card" data-product-id="${rel.id}" style="flex: 1 1 260px; max-width: 100%; background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column;">
                  <div class="card-image-wrap" style="aspect-ratio: 4/3; background: #F5F5F4; position: relative;">
                    <img src="${rel.primary_image?.public_url || '/assets/images/placeholder_studio_piece.webp'}"
                         alt="${escapeHtml(rel.primary_image?.alt_text || rel.name)}"
                         loading="lazy"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         onerror="this.src='/assets/images/placeholder_studio_piece.webp'" />
                  </div>
                  <div style="padding: 18px; display: flex; flex-direction: column; flex-grow: 1;">
                    <h3 style="font-family: var(--font-serif); font-size: 16px; font-weight: 600; color: var(--charcoal); margin-bottom: 8px;">
                      <a href="/products/${rel.slug}" style="color: inherit;">${escapeHtml(rel.name)}</a>
                    </h3>
                    <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--stone-border); display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 16px; font-weight: 700; color: var(--charcoal);">${formatPaiseToInr(rel.base_price_paise)}</span>
                      <a href="/products/${rel.slug}" style="font-size: 12px; font-weight: 600; color: var(--terracotta);">View &rarr;</a>
                    </div>
                  </div>
                </article>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>
    </div>

    <!-- Lightbox Zoom Modal (Features F43-3, F43-B4 with Focus Trap & Arrow Cycling) -->
    <div id="pdp-lightbox-modal"
         class="hidden"
         role="dialog"
         aria-modal="true"
         aria-label="Image Zoom Modal"
         style="display: none; position: fixed; inset: 0; z-index: 100; background: rgba(0, 0, 0, 0.92); backdrop-filter: blur(8px); align-items: center; justify-content: center; padding: 24px;">
      <button
        id="pdp-lightbox-close"
        type="button"
        aria-label="Close zoom modal"
        style="position: absolute; top: 20px; right: 20px; background: transparent; border: none; color: #FFFFFF; font-size: 36px; cursor: pointer; padding: 8px; line-height: 1;">
        &times;
      </button>
      <img id="pdp-lightbox-image" src="" alt="${escapeHtml(product.name)} Zoom" style="max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);" />
    </div>
  `;

  const extraScripts = `
    <script>
      (function() {
        var container = document.getElementById('pdp-container');
        if (!container) return;

        var productId = container.getAttribute('data-product-id');
        var productName = container.getAttribute('data-product-name');
        var basePricePaise = parseInt(container.getAttribute('data-base-price-paise') || '0', 10);
        var finishedUrl = container.getAttribute('data-finished-url');
        var rawUrl = container.getAttribute('data-raw-print-url');
        var studioPhone = container.getAttribute('data-studio-phone') || '917347278010';

        var mainImg = document.getElementById('pdp-main-image');
        var thumbs = Array.from(document.querySelectorAll('.gallery-thumb-btn'));
        var toggleFin = document.getElementById('toggle-hand-finished');
        var toggleRaw = document.getElementById('toggle-raw-print');
        var priceDisplay = document.getElementById('pdp-price-display');
        var dimsDisplay = document.getElementById('pdp-spec-dims');
        var waCta = document.querySelector('[data-commerce-action="whatsapp"]');
        var variantBtns = document.querySelectorAll('.variant-btn');

        var modal = document.getElementById('pdp-lightbox-modal');
        var modalImg = document.getElementById('pdp-lightbox-image');
        var modalClose = document.getElementById('pdp-lightbox-close');

        var currentImageIndex = 0;

        function setMainImage(index) {
          if (!thumbs[index]) return;
          currentImageIndex = index;
          var th = thumbs[index];
          var src = th.getAttribute('data-image-url');
          if (mainImg && src) mainImg.src = src;
          if (modalImg && modal && modal.style.display !== 'none' && src) modalImg.src = src;

          thumbs.forEach(function(t) {
            t.setAttribute('aria-selected', 'false');
            t.classList.remove('border-[#C2410C]', 'ring-2', 'ring-[#C2410C]');
            t.classList.add('border-stone-200');
          });
          th.setAttribute('aria-selected', 'true');
          th.classList.add('border-[#C2410C]', 'ring-2', 'ring-[#C2410C]');
          th.classList.remove('border-stone-200');
        }

        thumbs.forEach(function(th, idx) {
          th.addEventListener('click', function() {
            setMainImage(idx);
          });
        });

        // Before/After Craftsmanship Comparison Toggle
        if (toggleFin && toggleRaw && finishedUrl && rawUrl) {
          toggleFin.addEventListener('click', function() {
            if (mainImg) mainImg.src = finishedUrl;
            toggleFin.setAttribute('aria-pressed', 'true');
            toggleFin.style.background = 'var(--charcoal)';
            toggleFin.style.color = '#FFFFFF';
            toggleRaw.setAttribute('aria-pressed', 'false');
            toggleRaw.style.background = 'transparent';
            toggleRaw.style.color = '#57534E';
          });
          toggleRaw.addEventListener('click', function() {
            if (mainImg) mainImg.src = rawUrl;
            toggleRaw.setAttribute('aria-pressed', 'true');
            toggleRaw.style.background = 'var(--charcoal)';
            toggleRaw.style.color = '#FFFFFF';
            toggleFin.setAttribute('aria-pressed', 'false');
            toggleFin.style.background = 'transparent';
            toggleFin.style.color = '#57534E';
          });
        }

        // Accessible Lightbox with Focus Trap & Keyboard Arrows
        function openModal() {
          if (!modal || !modalImg || !mainImg) return;
          modalImg.src = mainImg.src;
          modal.style.display = 'flex';
          if (modalClose) modalClose.focus();
        }

        function closeModal() {
          if (!modal) return;
          modal.style.display = 'none';
          if (mainImg) mainImg.focus();
        }

        if (mainImg) {
          mainImg.setAttribute('tabindex', '0');
          mainImg.setAttribute('role', 'button');
          mainImg.setAttribute('aria-label', 'Open full-resolution image lightbox');
          mainImg.addEventListener('click', openModal);
          mainImg.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openModal();
            }
          });
        }

        if (modalClose) {
          modalClose.addEventListener('click', closeModal);
        }

        window.addEventListener('keydown', function(e) {
          if (!modal || modal.style.display === 'none') return;

          if (e.key === 'Escape') {
            closeModal();
          } else if (e.key === 'Tab') {
            e.preventDefault();
            if (modalClose) modalClose.focus();
          } else if (e.key === 'ArrowRight') {
            if (thumbs.length > 0) {
              var nextIdx = (currentImageIndex + 1) % thumbs.length;
              setMainImage(nextIdx);
            }
          } else if (e.key === 'ArrowLeft') {
            if (thumbs.length > 0) {
              var prevIdx = (currentImageIndex - 1 + thumbs.length) % thumbs.length;
              setMainImage(prevIdx);
            }
          }
        });

        // Variant Selection & WhatsApp CTA Updating (Preserves configured studio phone number)
        variantBtns.forEach(function(btn) {
          btn.addEventListener('click', function() {
            if (btn.getAttribute('aria-disabled') === 'true' || btn.disabled) return;
            var mod = parseInt(btn.getAttribute('data-price-modifier') || '0', 10);
            var eff = basePricePaise + mod;
            if (eff < 0) return;

            variantBtns.forEach(function(b) {
              b.setAttribute('aria-pressed', 'false');
              b.classList.remove('border-[#C2410C]', 'bg-orange-50/40', 'ring-1', 'ring-[#C2410C]');
              b.classList.add('border-[#E7E5E4]', 'bg-white');
            });
            btn.setAttribute('aria-pressed', 'true');
            btn.classList.add('border-[#C2410C]', 'bg-orange-50/40', 'ring-1', 'ring-[#C2410C]');
            btn.classList.remove('border-[#E7E5E4]', 'bg-white');

            var formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(eff / 100);
            if (priceDisplay) priceDisplay.textContent = formatted;

            var vDims = btn.getAttribute('data-dimensions');
            if (dimsDisplay && vDims) {
              try {
                var d = JSON.parse(vDims);
                if (d.length && d.width && d.height) {
                  dimsDisplay.textContent = d.length + ' × ' + d.width + ' × ' + d.height + ' cm';
                }
              } catch(e) {}
            }

            var vName = btn.getAttribute('data-variant-name') || '';
            if (waCta) {
              var msg = "Hello BHAIRAVI Creations! Inquiring about " + productName + " (Variant: " + vName + ").";
              waCta.href = "https://wa.me/" + encodeURIComponent(studioPhone) + "?text=" + encodeURIComponent(msg);
            }
          });
        });
      })();
    </script>
  `;

  return renderBaseLayout({
    title: product.name,
    description: product.description,
    canonicalPath: `/products/${product.slug}`,
    activeNav: 'products',
    content,
    extraScripts
  });
}
