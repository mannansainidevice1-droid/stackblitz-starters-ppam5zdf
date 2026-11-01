/// <reference lib="dom" />
/**
 * BHAIRAVI Creations Digital Platform
 * Amazon India & WhatsApp Commerce Action Helpers
 * Target: src/client/components/commerce/outbound_ctas.ts
 */

import { formatINR } from '../../../shared/pricing.js';
import { MANDATORY_ATTRIBUTION_DISCLAIMER } from '../../../shared/constants.js';
import { telemetry } from '../../tracking/telemetry.js';

export { MANDATORY_ATTRIBUTION_DISCLAIMER };

export interface ProductCommerceData {
  id: string;
  name: string;
  slug: string;
  base_price_paise: number;
  amazon_asin?: string | null;
  amazon_url?: string | null;
  whatsapp_config?: { prefill_template?: string } | string;
}

export function buildAmazonUrl(product: ProductCommerceData, campaignRef: string = 'bhairavi_web_pdp'): string | null {
  if (!product.amazon_asin && !product.amazon_url) return null;
  const asin = product.amazon_asin || (product.amazon_url?.match(/\/dp\/([A-Z0-9]{10})/i)?.[1]);
  if (!asin) return product.amazon_url || null;

  let refTag = campaignRef;
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const campaign = params.get('utm_campaign');
    if (campaign) {
      refTag = `ig_${campaign}`;
    }
  }

  return `https://www.amazon.in/dp/${asin}?tag=bhairavicreat-21&ref=${refTag}`;
}

export function buildProductWhatsAppUrl(product: ProductCommerceData, selectedVariantName?: string): string {
  const cleanPhone = '919876543210';
  const priceFormatted = formatINR(product.base_price_paise);
  const variantText = selectedVariantName ? `\nVariant: *${selectedVariantName}*` : '';
  const pageUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://bhairavicreations.com/products/${product.slug}`;

  const message =
    `Hello BHAIRAVI Creations!\n\n` +
    `I am interested in ordering: *${product.name}*${variantText}\n` +
    `Price: ${priceFormatted}\n` +
    `Link: ${pageUrl}\n\n` +
    `Please confirm availability and dispatch timeline.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function renderCommerceButtons(product: ProductCommerceData, selectedVariantName?: string): string {
  const amazonUrl = buildAmazonUrl(product);
  const waUrl = buildProductWhatsAppUrl(product, selectedVariantName);

  return `
    <div class="commerce-actions space-y-3" data-product-id="${product.id}">
      ${
        amazonUrl
          ? `
        <a href="${amazonUrl}"
           target="_blank"
           rel="noopener noreferrer"
           data-commerce-action="amazon"
           data-product-id="${product.id}"
           class="btn-amazon flex items-center justify-center w-full px-6 py-3.5 text-black font-semibold rounded-md shadow-sm transition-colors"
           style="min-height: 48px;">
          <span class="mr-2">Buy on Amazon India</span>
          <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      `
          : `
        <div class="p-3 bg-[#FAF9F6] border border-[#E7E5E4] rounded text-center">
          <span class="inline-block px-2.5 py-0.5 text-xs font-semibold bg-[#FEF3C7] text-[#92400E] rounded-full mb-1">
            Studio Exclusive — Made to Order
          </span>
          <p class="text-xs text-[#78716C]">Handcrafted in limited batches directly from our Ludhiana workshop.</p>
        </div>
      `
      }

      <a href="${waUrl}"
         target="_blank"
         rel="noopener noreferrer"
         data-commerce-action="whatsapp"
         data-product-id="${product.id}"
         class="btn-whatsapp flex items-center justify-center w-full px-6 py-3.5 text-white font-semibold rounded-md shadow-sm transition-colors"
         style="min-height: 48px;">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
        </svg>
        <span>Enquire on WhatsApp</span>
      </a>

      <p class="text-[11px] text-[#78716C] text-center italic mt-2 leading-tight">
        ${MANDATORY_ATTRIBUTION_DISCLAIMER}
      </p>
    </div>
  `;
}

export function bindCommerceClickInterceptors(container: HTMLElement, product: ProductCommerceData): void {
  const amazonBtn = container.querySelector('[data-commerce-action="amazon"]');
  if (amazonBtn) {
    amazonBtn.addEventListener('click', () => {
      try {
        telemetry.trackEvent('amazon_outbound_click', {
          product_id: product.id,
          metadata: { asin: product.amazon_asin }
        });
      } catch (err) {
        console.warn('Telemetry error', err);
      }
    });
  }

  const waBtn = container.querySelector('[data-commerce-action="whatsapp"]');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      try {
        telemetry.trackEvent('whatsapp_outbound_click', {
          product_id: product.id
        });
      } catch (err) {
        console.warn('Telemetry error', err);
      }
    });
  }
}
