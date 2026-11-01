/**
 * BHAIRAVI Creations Digital Platform
 * Reusable Header & Navigation Component
 * Target: src/server/views/components/header.component.ts
 */

import { STUDIO_DETAILS } from '../../../shared/constants.js';
import { escapeHtml } from './ui.component.js';

export interface HeaderOptions {
  activeNav?: 'home' | 'products' | 'custom-order' | 'about' | 'contact' | 'faq';
}

export function renderHeader(opts: HeaderOptions = {}): string {
  const { activeNav } = opts;

  return `
  <!-- Intelligent Sticky Header -->
  <header id="site-header" class="site-header sticky top-0 z-50 transition-all duration-300 border-b border-[#E2E8F0] bg-[#FAF9F5]/90 backdrop-blur-md">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="header-inner flex items-center justify-between h-[72px]">
        <!-- Brand Mark -->
        <a href="/" class="brand-link flex items-baseline gap-2 group" aria-label="BHAIRAVI Creations Home">
          <span class="font-display text-2xl font-black tracking-tight text-[#0B0F19] group-hover:text-[#2563EB] transition-colors">
            ${escapeHtml(STUDIO_DETAILS.name)}
          </span>
          <span class="hidden md:inline-block font-sans text-[11px] font-bold uppercase tracking-wider text-[#D97706] pl-2 border-l border-[#CBD5E1]">
            Ludhiana Studio
          </span>
        </a>

        <!-- Desktop Navigation (lg:flex) -->
        <nav class="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Primary Navigation">
          <a href="/" class="nav-item ${activeNav === 'home' ? 'active' : ''}">Home</a>
          <a href="/products" class="nav-item ${activeNav === 'products' ? 'active' : ''}">Catalogue</a>
          <a href="/custom-order" class="nav-item ${activeNav === 'custom-order' ? 'active' : ''}">Custom Orders</a>
          <a href="/#craft-journey" class="nav-item">Craft Journey</a>
          <a href="/#studio-story" class="nav-item">Our Studio</a>
          <a href="/about" class="nav-item ${activeNav === 'about' ? 'active' : ''}">About</a>
          <a href="/contact" class="nav-item ${activeNav === 'contact' ? 'active' : ''}">Contact</a>
        </nav>

        <!-- Right Header Actions -->
        <div class="flex items-center gap-2.5 sm:gap-3">
          <!-- WhatsApp Quote Bag Trigger -->
          <button id="quote-drawer-open-btn"
                  type="button"
                  class="btn-quote-bag relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#2563EB] text-[#0B0F19] hover:text-[#2563EB] text-xs font-bold transition-all shadow-sm active:scale-95"
                  aria-label="Open WhatsApp Quote Bag">
            <svg class="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <span class="hidden sm:inline">Quote Bag</span>
            <span id="quote-badge-count" class="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#2563EB] text-white">0</span>
          </button>

          <a href="https://wa.me/${STUDIO_DETAILS.whatsapp_number}"
             target="_blank"
             rel="noopener noreferrer"
             data-tracking-cta="whatsapp_header"
             class="btn-header-wa inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
             aria-label="Direct WhatsApp Consultation with Artisan">
            <svg class="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
            </svg>
            <span class="hidden md:inline">Artisan Chat</span>
          </a>

          <!-- Mobile Hamburger Toggle -->
          <button id="mobile-menu-btn"
                  class="lg:hidden inline-flex items-center justify-center p-2 rounded-lg border border-[#CBD5E1] text-[#0B0F19] hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  type="button"
                  aria-expanded="false"
                  aria-controls="mobile-nav-drawer"
                  aria-label="Open Navigation Menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Mobile Drawer Backdrop -->
  <div id="mobile-drawer-backdrop" class="mobile-drawer-backdrop fixed inset-0 bg-[#0B0F19]/40 backdrop-blur-sm z-50 hidden opacity-0 transition-opacity duration-300" aria-hidden="true"></div>

  <!-- Mobile Navigation Drawer -->
  <aside id="mobile-nav-drawer" class="mobile-drawer fixed top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-[#FAF9F5] border-l border-[#E2E8F0] z-50 flex flex-col p-6 shadow-2xl translate-x-full transition-transform duration-300 ease-in-out" aria-label="Mobile Navigation" aria-hidden="true">
    <div class="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-6">
      <span class="font-display text-lg font-bold text-[#0B0F19]">Navigation</span>
      <button id="mobile-drawer-close"
              type="button"
              class="p-2 rounded-lg border border-[#CBD5E1] text-[#64748B] hover:text-[#0B0F19] hover:bg-[#F1F5F9]"
              aria-label="Close Navigation Menu">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <nav class="flex flex-col gap-2 flex-grow overflow-y-auto">
      <a href="/" class="mobile-nav-item ${activeNav === 'home' ? 'active' : ''}">Home</a>
      <a href="/products" class="mobile-nav-item ${activeNav === 'products' ? 'active' : ''}">Catalogue</a>
      <a href="/custom-order" class="mobile-nav-item ${activeNav === 'custom-order' ? 'active' : ''}">Custom Orders</a>
      <a href="/#craft-journey" class="mobile-nav-item">Craft Journey</a>
      <a href="/#studio-story" class="mobile-nav-item">Our Studio</a>
      <a href="/about" class="mobile-nav-item ${activeNav === 'about' ? 'active' : ''}">About Studio</a>
      <a href="/contact" class="mobile-nav-item ${activeNav === 'contact' ? 'active' : ''}">Contact Us</a>
      <a href="/faq" class="mobile-nav-item ${activeNav === 'faq' ? 'active' : ''}">FAQ & Care</a>
    </nav>

    <div class="pt-6 border-t border-[#E2E8F0] mt-auto">
      <div class="text-xs text-[#64748B] mb-2 font-medium">LUDHIANA STUDIO DIRECT LINE</div>
      <a href="tel:${STUDIO_DETAILS.whatsapp_number}" class="block text-sm font-bold text-[#0B0F19] hover:text-[#2563EB] mb-4">
        +91 73472 78010
      </a>
      <a href="https://wa.me/${STUDIO_DETAILS.whatsapp_number}"
         target="_blank"
         rel="noopener noreferrer"
         class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#059669] text-white text-sm font-semibold hover:bg-[#047857] transition-all">
        Message Artisan on WhatsApp
      </a>
    </div>
  </aside>
  `;
}
