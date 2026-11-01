/**
 * BHAIRAVI Creations Digital Platform
 * Premium Global HTML5 Layout Shell & Design System
 * Target: src/server/views/layout.view.ts
 */

import { renderHeader } from './components/header.component.js';
import { renderFooter } from './components/footer.component.js';
import { escapeHtml } from './components/ui.component.js';

export { escapeHtml };

export interface LayoutOptions {
  title: string;
  description: string;
  canonicalPath: string;
  content: string;
  activeNav?: 'home' | 'products' | 'custom-order' | 'about' | 'contact' | 'faq';
  extraScripts?: string;
  extraStyles?: string;
}

export function renderBaseLayout(opts: LayoutOptions): string {
  const { title, description, canonicalPath, content, activeNav, extraScripts, extraStyles } = opts;
  const siteUrl = 'https://bhairavicreations.com';
  const fullTitle = `${title} | BHAIRAVI Creations`;

  return `<!DOCTYPE html>
<html lang="en" class="h-full scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${siteUrl}${canonicalPath}">

  <!-- Open Graph / Social Sharing Meta -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${siteUrl}${canonicalPath}">
  <meta property="og:site_name" content="BHAIRAVI Creations">
  <meta property="og:locale" content="en_IN">

  <!-- Clean Neo-Grotesque Typography & Fonts (Geist & Inter) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

  <!-- Core Storefront Stylesheet -->
  <link rel="stylesheet" href="/styles/storefront.css">

  <!-- Tailwind CDN for Layout & Responsive Variants -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            display: ['Geist', 'Inter', 'sans-serif'],
            sans: ['Inter', 'Geist', 'sans-serif']
          },
          colors: {
            canvas: '#FAF9F5',
            obsidian: '#0B0F19',
            charcoal: '#151B28',
            cobalt: {
              DEFAULT: '#2563EB',
              hover: '#1D4ED8'
            },
            amber: {
              DEFAULT: '#D97706',
              soft: '#FEF3C7'
            }
          }
        }
      }
    }
  </script>

  ${extraStyles || ''}
</head>
<body class="bg-[#FAF9F5] text-[#0F172A] font-sans min-h-screen flex flex-col antialiased selection:bg-[#2563EB] selection:text-white">
  <!-- Accessibility Skip Navigation Link -->
  <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0B0F19] focus:text-white focus:rounded-lg focus:shadow-xl">
    Skip to main content
  </a>

  <!-- Global Modular Header -->
  ${renderHeader({ activeNav })}

  <!-- Main Content Container -->
  <main id="main-content" class="flex-grow focus:outline-none" tabindex="-1">
    ${content}
  </main>

  <!-- Global Modular Footer -->
  ${renderFooter()}

  <!-- WhatsApp Multi-Item Quote Builder Drawer Backdrop -->
  <div id="quote-drawer-backdrop" class="fixed inset-0 bg-[#0B0F19]/40 backdrop-blur-sm z-50 hidden opacity-0 transition-opacity duration-300" aria-hidden="true"></div>

  <!-- WhatsApp Multi-Item Quote Builder Drawer -->
  <aside id="quote-drawer" class="fixed top-0 right-0 bottom-0 w-[420px] max-w-[92vw] bg-white border-l border-[#E2E8F0] z-50 flex flex-col shadow-2xl translate-x-full transition-transform duration-300 ease-in-out" aria-label="WhatsApp Quote Bag" aria-hidden="true">
    <div class="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#FAF9F5]">
      <div class="flex items-center gap-2.5">
        <span class="font-display text-lg font-black text-[#0B0F19]">WhatsApp Quote Bag</span>
        <span id="quote-drawer-pill-count" class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB]">0 items</span>
      </div>
      <button id="quote-drawer-close" type="button" class="p-2 rounded-lg border border-[#CBD5E1] text-[#64748B] hover:text-[#0B0F19] hover:bg-[#F1F5F9]" aria-label="Close Quote Bag">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Items List (Scrollable) -->
    <div id="quote-drawer-items" class="flex-grow overflow-y-auto p-5 space-y-3">
      <!-- Injected via JavaScript -->
    </div>

    <!-- Footer with Total and WhatsApp CTA -->
    <div id="quote-drawer-footer" class="p-5 border-t border-[#E2E8F0] bg-[#FAF9F5] space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Estimated Total (INR)</span>
        <span id="quote-drawer-total" class="font-display text-xl font-black text-[#0B0F19]">₹0</span>
      </div>
      <p class="text-[11px] text-[#64748B] leading-tight">
        Free nationwide express dispatch from Ludhiana atelier included with orders.
      </p>
      <button id="quote-drawer-send-btn" type="button" class="btn btn-whatsapp btn-lg w-full shadow-sm">
        <span>Request Quote on WhatsApp &rarr;</span>
      </button>
    </div>
  </aside>

  <!-- Interactive Client Navigation & Smart Scroll Controller -->
  <script>
    (function() {
      // 1. Mobile Menu Drawer Controller with Focus Trap
      const menuBtn = document.getElementById('mobile-menu-btn');
      const drawer = document.getElementById('mobile-nav-drawer');
      const backdrop = document.getElementById('mobile-drawer-backdrop');
      const closeBtn = document.getElementById('mobile-drawer-close');

      function openDrawer() {
        if (!drawer || !backdrop) return;
        backdrop.classList.remove('hidden');
        setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
        drawer.classList.remove('translate-x-full');
        drawer.setAttribute('aria-hidden', 'false');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }

      function closeDrawer() {
        if (!drawer || !backdrop) return;
        drawer.classList.add('translate-x-full');
        backdrop.classList.add('opacity-0');
        drawer.setAttribute('aria-hidden', 'true');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        setTimeout(() => {
          backdrop.classList.add('hidden');
          document.body.style.overflow = '';
        }, 300);
      }

      if (menuBtn) menuBtn.addEventListener('click', openDrawer);
      if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
      if (backdrop) backdrop.addEventListener('click', closeDrawer);

      // 2. WhatsApp Quote Bag Drawer Controller
      const qOpenBtn = document.getElementById('quote-drawer-open-btn');
      const qDrawer = document.getElementById('quote-drawer');
      const qBackdrop = document.getElementById('quote-drawer-backdrop');
      const qCloseBtn = document.getElementById('quote-drawer-close');
      const qItemsEl = document.getElementById('quote-drawer-items');
      const qTotalEl = document.getElementById('quote-drawer-total');
      const qPillCountEl = document.getElementById('quote-drawer-pill-count');
      const qBadgeCountEl = document.getElementById('quote-badge-count');
      const qSendBtn = document.getElementById('quote-drawer-send-btn');

      function openQuoteDrawer() {
        if (!qDrawer || !qBackdrop) return;
        qBackdrop.classList.remove('hidden');
        setTimeout(() => qBackdrop.classList.remove('opacity-0'), 10);
        qDrawer.classList.remove('translate-x-full');
        qDrawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }

      function closeQuoteDrawer() {
        if (!qDrawer || !qBackdrop) return;
        qDrawer.classList.add('translate-x-full');
        qBackdrop.classList.add('opacity-0');
        qDrawer.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
          qBackdrop.classList.add('hidden');
          document.body.style.overflow = '';
        }, 300);
      }

      if (qOpenBtn) qOpenBtn.addEventListener('click', openQuoteDrawer);
      if (qCloseBtn) qCloseBtn.addEventListener('click', closeQuoteDrawer);
      if (qBackdrop) qBackdrop.addEventListener('click', closeQuoteDrawer);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeDrawer();
          closeQuoteDrawer();
        }
      });

      // 3. Client Quote Bag State Engine
      function getQuoteBag() {
        try {
          return JSON.parse(localStorage.getItem('bhr_quote_bag') || '[]');
        } catch(e) {
          return [];
        }
      }

      function saveQuoteBag(bag) {
        try {
          localStorage.setItem('bhr_quote_bag', JSON.stringify(bag));
        } catch(e) {}
        renderQuoteBag();
      }

      window.addToQuoteBag = function(item) {
        const bag = getQuoteBag();
        const existingIdx = bag.findIndex(x => x.id === item.id && (x.variant || '') === (item.variant || ''));
        if (existingIdx !== -1) {
          bag[existingIdx].qty = (bag[existingIdx].qty || 1) + 1;
        } else {
          bag.push({
            id: item.id,
            name: item.name,
            slug: item.slug,
            pricePaise: item.pricePaise || 0,
            imageUrl: item.imageUrl || '/placeholder.svg',
            variant: item.variant || null,
            qty: 1
          });
        }
        saveQuoteBag(bag);
        openQuoteDrawer();

        if (window.__bhr_send_event) {
          window.__bhr_send_event('add_to_quote_bag', { product_id: item.id, product_name: item.name });
        }
      };

      window.updateQuoteBagQty = function(idx, delta) {
        const bag = getQuoteBag();
        if (bag[idx]) {
          bag[idx].qty = (bag[idx].qty || 1) + delta;
          if (bag[idx].qty <= 0) {
            bag.splice(idx, 1);
          }
          saveQuoteBag(bag);
        }
      };

      window.removeFromQuoteBag = function(idx) {
        const bag = getQuoteBag();
        if (bag[idx]) {
          bag.splice(idx, 1);
          saveQuoteBag(bag);
        }
      };

      function renderQuoteBag() {
        const bag = getQuoteBag();
        const totalItems = bag.reduce((sum, item) => sum + (item.qty || 1), 0);
        let totalPaise = 0;

        if (qBadgeCountEl) qBadgeCountEl.textContent = totalItems;
        if (qPillCountEl) qPillCountEl.textContent = totalItems + (totalItems === 1 ? ' item' : ' items');

        if (!qItemsEl) return;

        if (bag.length === 0) {
          qItemsEl.innerHTML = [
            '<div class="text-center py-12 px-4">',
              '<div class="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto mb-3">',
                '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>',
              '</div>',
              '<h3 class="font-display text-base font-bold text-[#0B0F19] mb-1">Your Quote Bag is Empty</h3>',
              '<p class="text-xs text-[#64748B] mb-5">Browse the catalogue to select creations for a consolidated artisan quotation.</p>',
              '<a href="/products" onclick="document.getElementById(\\'quote-drawer-close\\').click()" class="btn btn-secondary btn-sm">Explore Catalogue &rarr;</a>',
            '</div>'
          ].join('');
          if (qTotalEl) qTotalEl.textContent = '₹0';
          if (qSendBtn) qSendBtn.disabled = true;
          return;
        }

        if (qSendBtn) qSendBtn.disabled = false;

        let html = '';
        bag.forEach((item, idx) => {
          const itemPaise = (item.pricePaise || 0) * (item.qty || 1);
          totalPaise += itemPaise;
          const formattedUnit = '₹' + ((item.pricePaise || 0) / 100).toLocaleString('en-IN');
          const formattedSub = '₹' + (itemPaise / 100).toLocaleString('en-IN');

          html += [
            '<div class="flex items-center gap-3 p-3 rounded-xl bg-[#FAF9F5] border border-[#E2E8F0]">',
              '<img src="' + item.imageUrl + '" class="w-14 h-14 rounded-lg object-cover bg-white border border-[#CBD5E1] shrink-0" alt="' + item.name + '" />',
              '<div class="flex-grow min-w-0">',
                '<h4 class="font-bold text-xs text-[#0B0F19] truncate">' + item.name + '</h4>',
                (item.variant ? '<div class="text-[10px] text-[#2563EB] font-semibold truncate">' + item.variant + '</div>' : ''),
                '<div class="text-xs font-bold text-[#0B0F19] mt-0.5">' + formattedSub + '</div>',
                '<div class="text-[10px] text-[#94A3B8]">' + formattedUnit + ' each</div>',
              '</div>',
              '<div class="flex items-center gap-1.5 shrink-0">',
                '<button onclick="window.updateQuoteBagQty(' + idx + ', -1)" class="w-6 h-6 rounded bg-white border border-[#CBD5E1] flex items-center justify-center text-xs font-bold text-[#0B0F19] hover:bg-[#F1F5F9]">-</button>',
                '<span class="text-xs font-bold px-1 text-[#0B0F19]">' + (item.qty || 1) + '</span>',
                '<button onclick="window.updateQuoteBagQty(' + idx + ', 1)" class="w-6 h-6 rounded bg-white border border-[#CBD5E1] flex items-center justify-center text-xs font-bold text-[#0B0F19] hover:bg-[#F1F5F9]">+</button>',
                '<button onclick="window.removeFromQuoteBag(' + idx + ')" class="ml-1 text-xs text-red-500 hover:text-red-700 p-1" title="Remove">&times;</button>',
              '</div>',
            '</div>'
          ].join('');
        });

        qItemsEl.innerHTML = html;
        if (qTotalEl) qTotalEl.textContent = '₹' + (totalPaise / 100).toLocaleString('en-IN');
      }

      // 4. WhatsApp Consolidated Quote Transmitter
      if (qSendBtn) {
        qSendBtn.addEventListener('click', () => {
          const bag = getQuoteBag();
          if (bag.length === 0) return;

          let message = 'Hello BHAIRAVI Creations!\n\nI would like to request a consolidated quotation for the following 3D-printed creations:\n\n';
          let totalPaise = 0;

          bag.forEach((item, idx) => {
            const itemPaise = (item.pricePaise || 0) * (item.qty || 1);
            totalPaise += itemPaise;
            message += (idx + 1) + '. ' + item.name + ' (x' + (item.qty || 1) + ') - ₹' + ((item.pricePaise || 0) / 100).toLocaleString('en-IN') + ' each\n';
            if (item.variant) message += '   Finish/Option: ' + item.variant + '\n';
          });

          message += '\nTotal Estimated: ₹' + (totalPaise / 100).toLocaleString('en-IN') + '\n';
          message += 'Studio Location: Ludhiana, Punjab (PIN 141001)\n\n';
          message += 'Could you please confirm current production lead time and express dispatch availability?';

          const waUrl = 'https://wa.me/917347278010?text=' + encodeURIComponent(message);
          window.open(waUrl, '_blank', 'noopener,noreferrer');

          if (window.__bhr_send_event) {
            window.__bhr_send_event('whatsapp_quote_bag_submit', {
              items_count: bag.length,
              total_paise: totalPaise
            });
          }
        });
      }

      // Initial quote bag render on page load
      renderQuoteBag();

      // 5. Intelligent Smart Scroll Header (Hides down, Reveals up)
      const header = document.getElementById('site-header');
      let lastScrollY = window.scrollY;
      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
            if (header) {
              if (currentScrollY > 60) {
                header.classList.add('header-scrolled');
              } else {
                header.classList.remove('header-scrolled');
              }

              if (currentScrollY > 160 && currentScrollY > lastScrollY) {
                // Scrolling Down -> Hide Header
                header.classList.add('header-hidden');
              } else {
                // Scrolling Up -> Show Header
                header.classList.remove('header-hidden');
              }
            }
            lastScrollY = Math.max(0, currentScrollY);
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    })();
  </script>

  <!-- First-Party Analytics Telemetry Beacon -->
  <script src="/tracking/telemetry.js" defer></script>

  ${extraScripts || ''}
</body>
</html>`;
}
