/// <reference lib="dom" />
/**
 * BHAIRAVI Creations Digital Platform
 * Product Detail Page (PDP) Interactive Client Engine
 * Target: src/client/scripts/pdp.client.ts
 */

import { formatINR } from '../../shared/pricing.js';
import { telemetry } from '../tracking/telemetry.js';

export function initPdpClient(): void {
  if (typeof document === 'undefined') return;

  const pdpContainer = document.getElementById('pdp-container');
  if (!pdpContainer) return;

  const productId = pdpContainer.getAttribute('data-product-id') || '';
  const productName = pdpContainer.getAttribute('data-product-name') || '';
  const basePricePaise = parseInt(pdpContainer.getAttribute('data-base-price-paise') || '0', 10);
  const rawPrintUrl = pdpContainer.getAttribute('data-raw-print-url') || '';
  const handFinishedUrl = pdpContainer.getAttribute('data-finished-url') || '';

  const mainImage = document.getElementById('pdp-main-image') as HTMLImageElement | null;
  const thumbnails = document.querySelectorAll<HTMLButtonElement>('.gallery-thumb-btn');
  const toggleFinished = document.getElementById('toggle-hand-finished') as HTMLButtonElement | null;
  const toggleRaw = document.getElementById('toggle-raw-print') as HTMLButtonElement | null;
  const priceDisplay = document.getElementById('pdp-price-display');
  const dimsDisplay = document.getElementById('pdp-spec-dims');
  const waCta = document.querySelector<HTMLAnchorElement>('[data-commerce-action="whatsapp"]');
  const amazonCta = document.querySelector<HTMLAnchorElement>('[data-commerce-action="amazon"]');
  const variantBtns = document.querySelectorAll<HTMLButtonElement>('.variant-btn');

  // Lightbox Elements
  const lightboxModal = document.getElementById('pdp-lightbox-modal');
  const lightboxImg = document.getElementById('pdp-lightbox-image') as HTMLImageElement | null;
  const lightboxClose = document.getElementById('pdp-lightbox-close');
  let currentImageIndex = 0;
  const imageSources: string[] = [];

  thumbnails.forEach((t) => {
    const src = t.getAttribute('data-image-url');
    if (src) imageSources.push(src);
  });
  if (imageSources.length === 0 && mainImage) {
    imageSources.push(mainImage.src);
  }

  // 1. Thumbnail Strip Switching
  thumbnails.forEach((thumb, idx) => {
    thumb.addEventListener('click', () => {
      const imgUrl = thumb.getAttribute('data-image-url');
      const altText = thumb.getAttribute('data-alt-text') || productName;
      if (mainImage && imgUrl) {
        mainImage.src = imgUrl;
        mainImage.alt = altText;
        currentImageIndex = idx;
      }

      thumbnails.forEach((t) => {
        t.setAttribute('aria-selected', 'false');
        t.classList.remove('border-[#C2410C]', 'ring-2', 'ring-[#C2410C]');
        t.classList.add('border-stone-200');
      });
      thumb.setAttribute('aria-selected', 'true');
      thumb.classList.add('border-[#C2410C]', 'ring-2', 'ring-[#C2410C]');
      thumb.classList.remove('border-stone-200');

      telemetry.trackEvent('product_image_interaction', {
        product_id: productId,
        metadata: { action: 'select_thumbnail', index: idx, image_url: imgUrl }
      });
    });
  });

  // 2. Before/After Raw Print vs Hand-Finished Comparison Toggle
  if (toggleFinished && toggleRaw && rawPrintUrl && handFinishedUrl) {
    toggleFinished.addEventListener('click', () => {
      if (mainImage) mainImage.src = handFinishedUrl;
      toggleFinished.setAttribute('aria-pressed', 'true');
      toggleFinished.classList.add('bg-white', 'text-[#1C1917]', 'shadow-sm');
      toggleFinished.classList.remove('text-stone-600');

      toggleRaw.setAttribute('aria-pressed', 'false');
      toggleRaw.classList.remove('bg-white', 'text-[#1C1917]', 'shadow-sm');
      toggleRaw.classList.add('text-stone-600');

      telemetry.trackEvent('product_image_interaction', {
        product_id: productId,
        metadata: { action: 'toggle_raw_vs_finished', active_view: 'hand_finished' }
      });
    });

    toggleRaw.addEventListener('click', () => {
      if (mainImage) mainImage.src = rawPrintUrl;
      toggleRaw.setAttribute('aria-pressed', 'true');
      toggleRaw.classList.add('bg-white', 'text-[#1C1917]', 'shadow-sm');
      toggleRaw.classList.remove('text-stone-600');

      toggleFinished.setAttribute('aria-pressed', 'false');
      toggleFinished.classList.remove('bg-white', 'text-[#1C1917]', 'shadow-sm');
      toggleFinished.classList.add('text-stone-600');

      telemetry.trackEvent('product_image_interaction', {
        product_id: productId,
        metadata: { action: 'toggle_raw_vs_finished', active_view: 'raw_print' }
      });
    });
  }

  // 3. Lightbox Zoom Modal with Focus Trap & Keyboard Navigation
  function openLightbox(index: number = 0) {
    if (!lightboxModal || !lightboxImg) return;
    currentImageIndex = index;
    lightboxImg.src = imageSources[currentImageIndex] || (mainImage ? mainImage.src : '');
    lightboxModal.classList.remove('hidden');
    lightboxModal.style.display = 'flex';
    lightboxModal.setAttribute('aria-modal', 'true');
    lightboxClose?.focus();

    telemetry.trackEvent('product_image_interaction', {
      product_id: productId,
      metadata: { action: 'open_lightbox', image_url: lightboxImg.src }
    });
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.add('hidden');
    lightboxModal.style.display = 'none';
    lightboxModal.setAttribute('aria-modal', 'false');
    mainImage?.focus();
  }

  if (mainImage) {
    mainImage.style.cursor = 'zoom-in';
    mainImage.addEventListener('click', () => openLightbox(currentImageIndex));
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  window.addEventListener('keydown', (e) => {
    if (!lightboxModal || lightboxModal.classList.contains('hidden') || lightboxModal.style.display === 'none') {
      return;
    }
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      currentImageIndex = (currentImageIndex + 1) % imageSources.length;
      if (lightboxImg) lightboxImg.src = imageSources[currentImageIndex];
    } else if (e.key === 'ArrowLeft') {
      currentImageIndex = (currentImageIndex - 1 + imageSources.length) % imageSources.length;
      if (lightboxImg) lightboxImg.src = imageSources[currentImageIndex];
    } else if (e.key === 'Tab') {
      // Focus trap
      e.preventDefault();
      lightboxClose?.focus();
    }
  });

  // 4. Interactive Variant Selector & Real-Time Price Delta
  variantBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-disabled') === 'true' || btn.disabled) return;

      const modifier = parseInt(btn.getAttribute('data-price-modifier') || '0', 10);
      const effectivePaise = basePricePaise + modifier;

      if (effectivePaise < 0) {
        console.error('Invalid configuration: resulting price cannot be negative');
        return;
      }

      // Update UI active styles
      variantBtns.forEach((b) => {
        b.setAttribute('aria-pressed', 'false');
        b.classList.remove('border-[#C2410C]', 'bg-orange-50/40', 'ring-1', 'ring-[#C2410C]');
        b.classList.add('border-[#E7E5E4]', 'bg-white');
      });
      btn.setAttribute('aria-pressed', 'true');
      btn.classList.add('border-[#C2410C]', 'bg-orange-50/40', 'ring-1', 'ring-[#C2410C]');
      btn.classList.remove('border-[#E7E5E4]', 'bg-white');

      // Update displayed price
      if (priceDisplay) {
        priceDisplay.textContent = formatINR(effectivePaise);
      }

      // Update technical specifications table if dimensions exist
      const dimsRaw = btn.getAttribute('data-dimensions');
      if (dimsDisplay && dimsRaw) {
        try {
          const dims = JSON.parse(dimsRaw);
          if (dims.length && dims.width && dims.height) {
            dimsDisplay.textContent = `${dims.length} × ${dims.width} × ${dims.height} cm`;
          }
        } catch {
          // ignore parsing error
        }
      }

      const variantName = btn.getAttribute('data-variant-name') || '';
      const sku = btn.getAttribute('data-variant-sku') || '';

      // Update WhatsApp prefilled link
      if (waCta) {
        const cleanPhone = '917347278010';
        const pageUrl = window.location.href;
        const msg =
          `Hello BHAIRAVI Creations!\n\n` +
          `I am interested in ordering: *${productName}*\n` +
          `Variant: *${variantName}*\n` +
          `Price: ${formatINR(effectivePaise)}\n` +
          `Link: ${pageUrl}\n\n` +
          `Please confirm availability and dispatch timeline.`;
        waCta.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      }

      // Track customization interaction
      telemetry.trackEvent('customization_interaction', {
        product_id: productId,
        metadata: {
          variant_sku: sku,
          variant_name: variantName,
          new_price_paise: effectivePaise
        }
      });
    });
  });

  // 5. Commerce CTAs Telemetry Interceptors
  if (amazonCta) {
    amazonCta.addEventListener('click', () => {
      try {
        const asin = amazonCta.getAttribute('data-asin') || '';
        telemetry.trackEvent('amazon_outbound_click', {
          product_id: productId,
          metadata: { asin, destination_url: amazonCta.href }
        });
      } catch (err) {
        console.warn('Telemetry failed', err);
      }
    });
  }

  if (waCta) {
    waCta.addEventListener('click', () => {
      try {
        telemetry.trackEvent('whatsapp_outbound_click', {
          product_id: productId,
          metadata: { product_name: productName }
        });
      } catch (err) {
        console.warn('Telemetry failed', err);
      }
    });
  }

  // Track product_view on page entry
  telemetry.trackEvent('product_view', {
    product_id: productId,
    metadata: { product_name: productName, price_paise: basePricePaise }
  });
}

// Auto-run if loaded directly in browser
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initPdpClient();
  });
}
