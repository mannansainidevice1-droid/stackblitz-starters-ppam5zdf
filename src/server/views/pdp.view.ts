/**
 * BHAIRAVI Creations Digital Platform
 * Premium Editorial Centered Hero Product Detail Page (PDP) SSR View
 * Target: src/server/views/pdp.view.ts
 */

import { formatINR, paiseToRupees } from '../../shared/pricing.js';
import { DEFAULT_CARE_INSTRUCTIONS, MANDATORY_ATTRIBUTION_DISCLAIMER, STUDIO_DETAILS } from '../../shared/constants.js';
import { renderBaseLayout, escapeHtml } from './layout.view.js';
import { renderProductCard } from './components/product_card.component.js';

export interface PdpPageProps {
  product: any;
  relatedProducts?: any[];
}

export function renderProductDetailPage(props: PdpPageProps): string {
  const { product, relatedProducts = [] } = props;

  const images: any[] = product.gallery_images || [];
  const primaryImage = images.find((img) => img.is_primary) || images[0] || {
    public_url: '/placeholder.svg',
    alt_text: product.name
  };
  const rawPrintImage = images.find(
    (img) => img.public_url && (img.public_url.includes('raw_print') || (img.alt_text && img.alt_text.toLowerCase().includes('raw print')))
  ) || {
    public_url: `/uploads/products/${product.slug}_raw_print.webp`,
    alt_text: `${product.name} (0.12mm Additive Core)`
  };
  const galleryList = images.length > 1 ? images : [primaryImage, rawPrintImage];

  const dims = product.dimensions_cm || {};
  const dimsFormatted =
    dims.length && dims.width && dims.height
      ? `${dims.length} × ${dims.width} × ${dims.height} cm`
      : 'Custom dimensions available upon request';

  const careNotes =
    product.care_safety_instructions && product.care_safety_instructions.trim().length > 0
      ? product.care_safety_instructions
      : DEFAULT_CARE_INSTRUCTIONS;

  const amazonUrl = product.commerce_actions?.amazon_url || product.amazon_url;
  const amazonAsin = product.commerce_actions?.amazon_asin || product.amazon_asin;
  const defaultWaMsg = `Hello BHAIRAVI Creations! Inquiring about ${product.name}.`;
  const defaultWaUrl = `https://wa.me/${STUDIO_DETAILS.whatsapp_number}?text=${encodeURIComponent(defaultWaMsg)}`;
  const waUrl = product.commerce_actions?.whatsapp_url || defaultWaUrl;

  const variants: any[] = product.variants || [];

  const content = `
    <div id="pdp-container"
         class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
         data-product-id="${product.id}"
         data-product-slug="${product.slug}"
         data-product-name="${escapeHtml(product.name)}"
         data-base-price-paise="${product.base_price_paise}"
         data-finished-url="${escapeHtml(primaryImage.public_url)}"
         data-raw-print-url="${rawPrintImage ? escapeHtml(rawPrintImage.public_url) : ''}"
         data-studio-phone="${STUDIO_DETAILS.whatsapp_number}">

      <!-- Breadcrumbs Navigation -->
      <nav aria-label="Breadcrumb" class="mb-8 text-xs font-medium text-[#64748B]">
        <ol class="flex items-center justify-center gap-2 flex-wrap">
          <li><a href="/" class="hover:text-[#0B0F19] transition-colors">Home</a></li>
          <li>/</li>
          <li><a href="/products" class="hover:text-[#0B0F19] transition-colors">Catalogue</a></li>
          <li>/</li>
          <li><a href="/products?category=${escapeHtml(product.category?.slug || '')}" class="hover:text-[#0B0F19] transition-colors">${escapeHtml(product.category?.name || 'Category')}</a></li>
          <li>/</li>
          <li class="text-[#0B0F19] font-bold" aria-current="page">${escapeHtml(product.name)}</li>
        </ol>
      </nav>

      <!-- 1. Centered Editorial Hero Stage -->
      <div class="pdp-hero-stage max-w-4xl mx-auto text-center mb-16">
        <!-- Category & Location Tag -->
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] mb-4">
          ${escapeHtml(product.category?.name || 'Studio Creation')} • Hand-Finished in Ludhiana
        </div>

        <!-- Product Title -->
        <h1 class="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#0B0F19] tracking-tight leading-tight mb-4">
          ${escapeHtml(product.name)}
        </h1>

        <!-- Price Display -->
        <div class="flex items-baseline justify-center gap-3 mb-8">
          <span id="pdp-price-display" class="font-display text-3xl sm:text-4xl font-extrabold text-[#0B0F19]">
            ${formatINR(product.base_price_paise)}
          </span>
          <span class="text-xs sm:text-sm text-[#64748B] font-medium">(Incl. all taxes & nationwide dispatch)</span>
        </div>

        <!-- Centered Main Image Viewport with Comparison Toggle -->
        <div class="relative max-w-3xl mx-auto bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
          <div class="aspect-[16/10] relative bg-[#F8FAFC] overflow-hidden">
            <img
              id="pdp-main-image"
              src="${escapeHtml(primaryImage.public_url)}"
              alt="${escapeHtml(primaryImage.alt_text || product.name)}"
              class="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 ease-out hover:scale-105"
              onerror="this.src='/placeholder.svg'"
            />
          </div>

          <!-- Raw Print vs Hand-Finished Toggle Pill -->
          ${
            rawPrintImage
              ? `
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <div class="inline-flex p-1 bg-white/95 backdrop-blur-md border border-[#CBD5E1] rounded-full shadow-lg" role="group" aria-label="Craftsmanship comparison">
                <button
                  id="toggle-hand-finished"
                  type="button"
                  aria-pressed="true"
                  class="px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-[#0B0F19] text-white">
                  Hand-Finished Piece
                </button>
                <button
                  id="toggle-raw-print"
                  type="button"
                  aria-pressed="false"
                  class="px-4 py-1.5 rounded-full text-xs font-medium text-[#475569] hover:text-[#0B0F19] transition-all bg-transparent">
                  Raw 3D Print
                </button>
              </div>
            </div>
          `
              : ''
          }
        </div>

        <!-- Thumbnail Gallery Strip -->
        <div class="flex items-center justify-center gap-3 mt-6 overflow-x-auto pb-2" role="tablist" aria-label="Product thumbnails">
          ${galleryList
            .map(
              (img, idx) => `
            <button
              type="button"
              role="tab"
              class="gallery-thumb-btn w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                idx === 0 ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30' : 'border-[#CBD5E1] hover:border-[#2563EB]'
              }"
              data-image-url="${escapeHtml(img.public_url)}"
              data-alt-text="${escapeHtml(img.alt_text || product.name)}"
              aria-selected="${idx === 0 ? 'true' : 'false'}">
              <img src="${escapeHtml(img.public_url)}" alt="${escapeHtml(img.alt_text || product.name)}" class="w-full h-full object-cover" onerror="this.src='/placeholder.svg'" />
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- 2. Bento Structured Content Grid -->
      <div class="max-w-4xl mx-auto space-y-8">
        <!-- Row 1: Narrative & Variant Edition Selector -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <!-- Artisanal Narrative -->
          <div class="bento-card p-6 sm:p-8 bg-white border border-[#E2E8F0] rounded-2xl">
            <h2 class="font-display text-xl font-bold text-[#0B0F19] mb-4">The Artisanal Narrative</h2>
            <p class="text-sm sm:text-base text-[#475569] leading-relaxed mb-6">
              ${escapeHtml(product.description)}
            </p>
            <div class="flex flex-wrap gap-2 pt-4 border-t border-[#F1F5F9]">
              <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569]">
                0.12mm Micro-Layers
              </span>
              <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569]">
                Hand-Painted Acrylics
              </span>
              <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569]">
                High-Grade PLA / PLA Pro
              </span>
            </div>
          </div>

          <!-- Variant Editions -->
          <div class="bento-card p-6 sm:p-8 bg-white border border-[#E2E8F0] rounded-2xl">
            <h2 class="font-display text-xl font-bold text-[#0B0F19] mb-4">Finish & Size Editions</h2>
            ${
              variants.length > 0
                ? `
              <div class="space-y-3">
                ${variants
                  .map((v, idx) => {
                    const isAvailable = v.is_available !== 0;
                    const deltaPaise = v.price_modifier_paise || 0;
                    let deltaStr = '₹0';
                    if (deltaPaise > 0) deltaStr = `+₹${paiseToRupees(deltaPaise)}`;
                    else if (deltaPaise < 0) deltaStr = `-₹${paiseToRupees(Math.abs(deltaPaise))}`;
                    const effectivePriceStr = formatINR(product.base_price_paise + deltaPaise);

                    return `
                    <button
                      type="button"
                      class="variant-btn w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        idx === 0
                          ? 'border-[#2563EB] bg-[#EFF6FF] text-[#0B0F19]'
                          : 'border-[#CBD5E1] bg-white hover:border-[#2563EB] text-[#475569]'
                      } ${!isAvailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}"
                      data-variant-id="${v.id}"
                      data-variant-sku="${v.sku}"
                      data-variant-name="${escapeHtml(v.variant_name)}"
                      data-price-modifier="${deltaPaise}"
                      data-dimensions="${escapeHtml(JSON.stringify(v.dimensions_cm || {}))}"
                      ${!isAvailable ? 'disabled aria-disabled="true"' : `aria-pressed="${idx === 0 ? 'true' : 'false'}"`}>
                      <div>
                        <span class="font-bold text-sm text-[#0B0F19] block">${escapeHtml(v.variant_name)}</span>
                        ${!isAvailable ? '<span class="text-xs text-red-600 font-semibold">Sold Out</span>' : ''}
                      </div>
                      <span class="text-xs font-bold ${deltaPaise > 0 ? 'text-[#2563EB]' : 'text-[#64748B]'}">
                        ${deltaStr} (${effectivePriceStr})
                      </span>
                    </button>
                  `;
                  })
                  .join('')}
              </div>
            `
                : `
              <p class="text-sm text-[#64748B]">
                Standard atelier edition. Bespoke sizing and custom patinas available through our custom commission portal.
              </p>
            `
            }
          </div>
        </div>

        <!-- Row 2: Commerce Actions & Direct Consultation -->
        <div class="bento-card p-6 sm:p-8 bg-white border border-[#E2E8F0] rounded-2xl text-center">
          <h2 class="font-display text-2xl font-bold text-[#0B0F19] mb-2">Acquire This Handcrafted Piece</h2>
          <p class="text-sm text-[#64748B] mb-6 max-w-lg mx-auto">
            Order ready units fulfilled through Amazon Prime or consult directly with our Ludhiana artisans on WhatsApp.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-xl mx-auto">
            <button type="button"
                    id="pdp-add-quote-btn"
                    class="w-full sm:w-auto flex-1 btn btn-secondary btn-lg shadow-sm">
              <svg class="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              <span>+ Add to Quote Bag</span>
            </button>

            ${
              amazonUrl
                ? `
              <a href="${escapeHtml(amazonUrl)}"
                 target="_blank"
                 rel="noopener noreferrer"
                 data-commerce-action="amazon"
                 data-asin="${escapeHtml(amazonAsin || '')}"
                 class="w-full sm:w-auto flex-1 btn btn-primary btn-lg shadow-sm">
                <span>Buy on Amazon India</span>
                <svg class="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            `
                : `
              <div class="w-full sm:w-auto flex-1 p-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-semibold text-[#D97706]">
                Studio Exclusive (Made to Order in Ludhiana)
              </div>
            `
            }

            <a href="${escapeHtml(waUrl)}"
               target="_blank"
               rel="noopener noreferrer"
               data-commerce-action="whatsapp"
               class="w-full sm:w-auto flex-1 btn btn-whatsapp btn-lg shadow-sm">
              <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          <p class="text-[11px] text-[#94A3B8] italic mt-4 max-w-md mx-auto">
            ${MANDATORY_ATTRIBUTION_DISCLAIMER}
          </p>
        </div>

        <!-- Row 3: Technical Specifications Matrix -->
        <div class="bento-card p-6 sm:p-8 bg-white border border-[#E2E8F0] rounded-2xl">
          <h2 class="font-display text-xl font-bold text-[#0B0F19] mb-6">Technical Specifications & Craft Details</h2>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div class="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#F1F5F9]">
              <dt class="text-xs uppercase font-bold text-[#64748B] mb-1">Dimensions</dt>
              <dd id="pdp-dimensions-val" class="font-bold text-[#0B0F19]">${escapeHtml(dimsFormatted)}</dd>
            </div>
            <div class="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#F1F5F9]">
              <dt class="text-xs uppercase font-bold text-[#64748B] mb-1">Print Resolution</dt>
              <dd class="font-bold text-[#0B0F19]">0.12mm (120 microns) Micro-Step Layering</dd>
            </div>
            <div class="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#F1F5F9]">
              <dt class="text-xs uppercase font-bold text-[#64748B] mb-1">Base Medium</dt>
              <dd class="font-bold text-[#0B0F19]">High-Grade PLA / PLA Pro Filament</dd>
            </div>
            <div class="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#F1F5F9]">
              <dt class="text-xs uppercase font-bold text-[#64748B] mb-1">Finishing Technique</dt>
              <dd class="font-bold text-[#0B0F19]">Wet Sanding, Acrylic Primer & Matte Acrylic Sealant</dd>
            </div>
            <div class="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#F1F5F9] sm:col-span-2">
              <dt class="text-xs uppercase font-bold text-[#64748B] mb-1">Care & Preservation</dt>
              <dd class="text-[#475569] leading-relaxed">${escapeHtml(careNotes)}</dd>
            </div>
          </dl>
        </div>

        <!-- Related Pieces -->
        ${
          relatedProducts.length > 0
            ? `
          <div class="pt-8">
            <h3 class="font-display text-2xl font-bold text-[#0B0F19] mb-6">More Creations from This Category</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${relatedProducts.map((p) => renderProductCard(p)).join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>
    </div>

    <!-- Lightbox Modal for Zoom Image View -->
    <div id="pdp-lightbox" class="fixed inset-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md hidden items-center justify-center p-4" aria-modal="true" role="dialog" aria-label="Expanded Image View">
      <button id="pdp-lightbox-close" type="button" class="absolute top-6 right-6 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors" aria-label="Close expanded view">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <img id="pdp-lightbox-img" src="" alt="Expanded View" class="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
    </div>
  `;

  const extraScripts = `
    <script>
      (function() {
        var container = document.getElementById('pdp-container');
        if (!container) return;

        var basePrice = Number(container.getAttribute('data-base-price-paise') || 0);
        var finishedUrl = container.getAttribute('data-finished-url') || '';
        var rawUrl = container.getAttribute('data-raw-print-url') || '';

        var mainImg = document.getElementById('pdp-main-image');
        var priceDisplay = document.getElementById('pdp-price-display');
        var dimsDisplay = document.getElementById('pdp-dimensions-val');
        var toggleFinished = document.getElementById('toggle-hand-finished');
        var toggleRaw = document.getElementById('toggle-raw-print');
        var variantBtns = document.querySelectorAll('.variant-btn');
        var thumbBtns = document.querySelectorAll('.gallery-thumb-btn');

        // Toggle Hand-Finished vs Raw Print
        if (toggleFinished && toggleRaw && rawUrl) {
          toggleFinished.addEventListener('click', function() {
            if (mainImg) mainImg.src = finishedUrl;
            toggleFinished.classList.add('bg-[#0B0F19]', 'text-white');
            toggleFinished.classList.remove('bg-transparent', 'text-[#475569]');
            toggleRaw.classList.remove('bg-[#0B0F19]', 'text-white');
            toggleRaw.classList.add('bg-transparent', 'text-[#475569]');
            toggleFinished.setAttribute('aria-pressed', 'true');
            toggleRaw.setAttribute('aria-pressed', 'false');
          });

          toggleRaw.addEventListener('click', function() {
            if (mainImg) mainImg.src = rawUrl;
            toggleRaw.classList.add('bg-[#0B0F19]', 'text-white');
            toggleRaw.classList.remove('bg-transparent', 'text-[#475569]');
            toggleFinished.classList.remove('bg-[#0B0F19]', 'text-white');
            toggleFinished.classList.add('bg-transparent', 'text-[#475569]');
            toggleRaw.setAttribute('aria-pressed', 'true');
            toggleFinished.setAttribute('aria-pressed', 'false');
          });
        }

        // Thumbnails
        thumbBtns.forEach(function(btn) {
          btn.addEventListener('click', function() {
            var url = btn.getAttribute('data-image-url');
            if (mainImg && url) mainImg.src = url;
            thumbBtns.forEach(function(b) {
              b.classList.remove('border-[#2563EB]', 'ring-2', 'ring-[#2563EB]/30');
              b.classList.add('border-[#CBD5E1]');
              b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('border-[#2563EB]', 'ring-2', 'ring-[#2563EB]/30');
            btn.classList.remove('border-[#CBD5E1]');
            btn.setAttribute('aria-selected', 'true');
          });
        });

        // Variant Selection
        variantBtns.forEach(function(btn) {
          btn.addEventListener('click', function() {
            if (btn.hasAttribute('disabled')) return;
            var modifier = Number(btn.getAttribute('data-price-modifier') || 0);
            var effectivePaise = basePrice + modifier;
            var formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(effectivePaise / 100);

            if (priceDisplay) priceDisplay.textContent = formatted;

            try {
              var dims = JSON.parse(btn.getAttribute('data-dimensions') || '{}');
              if (dimsDisplay && dims.length && dims.width && dims.height) {
                dimsDisplay.textContent = dims.length + ' × ' + dims.width + ' × ' + dims.height + ' cm';
              }
            } catch (e) {}

            variantBtns.forEach(function(b) {
              b.classList.remove('border-[#2563EB]', 'bg-[#EFF6FF]');
              b.classList.add('border-[#CBD5E1]', 'bg-white');
              b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('border-[#2563EB]', 'bg-[#EFF6FF]');
            btn.classList.remove('border-[#CBD5E1]', 'bg-white');
            btn.setAttribute('aria-pressed', 'true');
          });
        });

        // Add to Quote Bag Button
        var addQuoteBtn = document.getElementById('pdp-add-quote-btn');
        if (addQuoteBtn) {
          addQuoteBtn.addEventListener('click', function() {
            var activeVariantBtn = document.querySelector('.variant-btn[aria-pressed="true"]');
            var variantName = activeVariantBtn ? activeVariantBtn.getAttribute('data-variant-name') : null;
            var modifier = activeVariantBtn ? Number(activeVariantBtn.getAttribute('data-price-modifier') || 0) : 0;
            var currentPaise = basePrice + modifier;
            var pId = container.getAttribute('data-product-id') || '';
            var pSlug = container.getAttribute('data-product-slug') || '';
            var pName = container.getAttribute('data-product-name') || '';

            if (window.addToQuoteBag) {
              window.addToQuoteBag({
                id: pId,
                name: pName,
                slug: pSlug,
                pricePaise: currentPaise,
                imageUrl: finishedUrl || '/placeholder.svg',
                variant: variantName
              });
            }
          });
        }

        // Lightbox
        var lightbox = document.getElementById('pdp-lightbox');
        var lightboxImg = document.getElementById('pdp-lightbox-img');
        var lightboxClose = document.getElementById('pdp-lightbox-close');

        if (mainImg && lightbox && lightboxImg) {
          mainImg.addEventListener('click', function() {
            lightboxImg.src = mainImg.src;
            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');
            document.body.style.overflow = 'hidden';
          });

          function closeLightbox() {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
            document.body.style.overflow = '';
          }

          if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
          lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) closeLightbox();
          });
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) closeLightbox();
          });
        }
      })();
    </script>
  `;

  return renderBaseLayout({
    title: product.name,
    description: product.description ? product.description.slice(0, 160) : 'Handcrafted 3D printed piece by BHAIRAVI Creations.',
    canonicalPath: `/products/${product.slug}`,
    activeNav: 'products',
    content,
    extraScripts
  });
}
