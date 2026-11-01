/**
 * BHAIRAVI Creations Digital Platform
 * Reusable Footer Component
 * Target: src/server/views/components/footer.component.ts
 */

import { STUDIO_DETAILS } from '../../../shared/constants.js';
import { escapeHtml } from './ui.component.js';

export function renderFooter(): string {
  const currentYear = new Date().getFullYear();

  return `
  <!-- Luxury Bento-Grid Semantic Footer -->
  <footer class="site-footer bg-[#0B0F19] text-[#CBD5E1] border-t border-[#1E293B] pt-16 pb-12 mt-auto" role="contentinfo">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 4-Column Bento Grid Layout -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#1E293B]">
        <!-- Col 1: Studio Identity & Craft Statement (2 cols on lg) -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex items-center gap-2">
            <span class="font-display text-2xl font-black text-white tracking-tight">
              ${escapeHtml(STUDIO_DETAILS.name)}
            </span>
            <span class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/30">
              Direct Studio
            </span>
          </div>
          <p class="text-sm text-[#94A3B8] max-w-sm leading-relaxed">
            High-precision parametric 3D printing and artisanal hand-finishing studio founded and operating in Ludhiana, Punjab. Every sculpture is crafted individually with mathematical precision and timeless patience.
          </p>
          <div class="pt-2 text-xs text-[#64748B] flex flex-col gap-1">
            <span>GSTIN: <strong class="text-[#CBD5E1]">${escapeHtml(STUDIO_DETAILS.gstin)}</strong> (State: 03 Punjab)</span>
            <span>Operating Currency: <strong class="text-[#CBD5E1]">INR (₹ Indian Rupee)</strong></span>
          </div>
        </div>

        <!-- Col 2: Studio Catalog -->
        <div class="space-y-3">
          <h4 class="font-display text-sm font-bold uppercase tracking-wider text-white">Catalogue</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/products" class="text-[#94A3B8] hover:text-[#60A5FA] transition-colors">All Sculptures</a></li>
            <li><a href="/products?category=deities-sacred-art" class="text-[#94A3B8] hover:text-[#60A5FA] transition-colors">Sacred Deities</a></li>
            <li><a href="/products?category=architectural-heritage" class="text-[#94A3B8] hover:text-[#60A5FA] transition-colors">Architectural Models</a></li>
            <li><a href="/products?category=contemporary-decor" class="text-[#94A3B8] hover:text-[#60A5FA] transition-colors">Contemporary Decor</a></li>
            <li><a href="/products?category=functional-art" class="text-[#94A3B8] hover:text-[#60A5FA] transition-colors">Functional Art</a></li>
          </ul>
        </div>

        <!-- Col 3: Custom Commissions & Craft -->
        <div class="space-y-3">
          <h4 class="font-display text-sm font-bold uppercase tracking-wider text-white">Custom Studio</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/custom-order" class="text-[#94A3B8] hover:text-[#60A5FA] transition-colors">Custom Order Enquiry</a></li>
            <li><a href="/#craft-journey" class="text-[#94A3B8] hover:text-[#60A5FA] transition-colors">4-Stage Craft Journey</a></li>
            <li><a href="/#studio-story" class="text-[#94A3B8] hover:text-[#60A5FA] transition-colors">Artisanal Workshop</a></li>
            <li><a href="/about" class="text-[#94A3B8] hover:text-[#60A5FA] transition-colors">About Our Family</a></li>
            <li><a href="/faq" class="text-[#94A3B8] hover:text-[#60A5FA] transition-colors">Material & Care Guide</a></li>
          </ul>
        </div>

        <!-- Col 4: Ludhiana Workshop Contact -->
        <div class="space-y-3">
          <h4 class="font-display text-sm font-bold uppercase tracking-wider text-white">Studio Line</h4>
          <address class="not-italic text-sm text-[#94A3B8] space-y-2">
            <p class="font-medium text-white">${escapeHtml(STUDIO_DETAILS.address)}</p>
            <p>
              Direct WhatsApp: <a href="https://wa.me/${STUDIO_DETAILS.whatsapp_number}" class="text-[#34D399] hover:underline font-semibold" target="_blank" rel="noopener">+91 73472 78010</a>
            </p>
            <p class="text-xs text-[#64748B]">Mon – Sat: 10:00 AM – 7:00 PM IST</p>
            <p class="pt-1">
              <a href="/contact" class="inline-flex items-center text-xs font-semibold text-[#60A5FA] hover:text-white transition-colors">
                Contact Studio Desk &rarr;
              </a>
            </p>
          </address>
        </div>
      </div>

      <!-- Footer Bottom: Legal & Privacy Trust -->
      <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span>&copy; ${currentYear} BHAIRAVI Creations. All rights reserved.</span>
          <span class="inline-flex items-center gap-1.5 text-[#34D399]">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clip-rule="evenodd"/>
            </svg>
            Zero-PII Privacy Enforced
          </span>
        </div>
        <nav class="flex flex-wrap items-center gap-4 sm:gap-6" aria-label="Legal Links">
          <a href="/shipping" class="hover:text-white transition-colors">Shipping Policy</a>
          <a href="/returns" class="hover:text-white transition-colors">Returns & Refunds</a>
          <a href="/privacy" class="hover:text-white transition-colors">Privacy Policy</a>
          <a href="/terms" class="hover:text-white transition-colors">Terms of Service</a>
          <a href="/admin" class="hover:text-[#60A5FA] transition-colors">Admin Portal</a>
        </nav>
      </div>
    </div>
  </footer>
  `;
}
