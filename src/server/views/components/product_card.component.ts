/**
 * BHAIRAVI Creations Digital Platform
 * Reusable Product Bento Card Component
 * Target: src/server/views/components/product_card.component.ts
 */

import { formatINR } from '../../../shared/pricing.js';
import { escapeHtml } from './ui.component.js';

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price_paise?: number;
  base_price_paise?: number;
  category_name?: string;
  category?: { name: string; slug: string };
  primary_image_url?: string;
  images?: Array<{ url: string; is_primary?: boolean }>;
  is_customizable?: boolean | number;
  stock_status?: string;
  amazon_url?: string;
  short_description?: string;
}

export function renderProductCard(product: ProductCardProps): string {
  const price = product.price_paise ?? product.base_price_paise ?? 0;
  const formattedPrice = formatINR(price);

  const categoryTitle = product.category?.name || product.category_name || 'Artisanal Piece';
  const imageUrl = product.primary_image_url || product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url || '/placeholder.svg';

  const isLowStock = product.stock_status === 'low_stock';
  const isOutOfStock = product.stock_status === 'out_of_stock';

  return `
  <article class="bento-product-card group relative flex flex-col bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#CBD5E1] hover:-translate-y-1" data-product-id="${escapeHtml(product.id)}">
    <!-- Image Wrap with Micro-Zoom -->
    <a href="/products/${escapeHtml(product.slug)}" class="card-img-link block relative aspect-[4/3] bg-[#F8FAFC] overflow-hidden" aria-label="View details for ${escapeHtml(product.name)}">
      <img src="${escapeHtml(imageUrl)}"
           alt="${escapeHtml(product.name)}"
           loading="lazy"
           onerror="this.onerror=null;this.src='/placeholder.svg';"
           class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />

      <!-- Floating Badges Top-Left -->
      <div class="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#0B0F19]/80 backdrop-blur-md text-white">
          ${escapeHtml(categoryTitle)}
        </span>
        ${isOutOfStock ? `
          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-red-600 text-white">
            Out of Stock
          </span>
        ` : isLowStock ? `
          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-white">
            Few Units Left
          </span>
        ` : ''}
      </div>
    </a>

    <!-- Card Content -->
    <div class="card-body p-5 flex flex-col flex-grow justify-between gap-4">
      <div>
        <h3 class="font-display text-lg font-bold text-[#0B0F19] group-hover:text-[#2563EB] transition-colors line-clamp-1 leading-snug">
          <a href="/products/${escapeHtml(product.slug)}">
            ${escapeHtml(product.name)}
          </a>
        </h3>
        <p class="mt-1 text-xs text-[#64748B] flex items-center gap-1.5">
          <span>0.12mm Micro-Layer SLA/FDM</span>
          <span>•</span>
          <span>Hand-Finished</span>
        </p>
      </div>

      <!-- Price & CTA Bar -->
      <div class="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
        <div>
          <span class="block text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold">Studio Price</span>
          <span class="font-sans text-lg font-black text-[#0B0F19]">
            ${escapeHtml(formattedPrice)}
          </span>
        </div>

        <a href="/products/${escapeHtml(product.slug)}"
           class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B0F19] hover:bg-[#2563EB] text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
           aria-label="View specifications for ${escapeHtml(product.name)}">
          <span>Explore</span>
          <svg class="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </div>
  </article>
  `;
}
