/**
 * BHAIRAVI Creations Digital Platform
 * Global HTML5 Layout Shell & Design System
 * Target: src/server/views/layout.view.ts
 */

import { BRAND_DRAFT_COPY, STUDIO_DETAILS } from '../../shared/constants.js';

export interface LayoutOptions {
  title: string;
  description: string;
  canonicalPath: string;
  content: string;
  activeNav?: 'home' | 'products' | 'custom-order' | 'about' | 'contact' | 'faq';
  extraScripts?: string;
  extraStyles?: string;
}

export function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderBaseLayout(opts: LayoutOptions): string {
  const { title, description, canonicalPath, content, activeNav, extraScripts, extraStyles } = opts;
  const siteUrl = 'https://bhairavicreations.com';
  const fullTitle = `${title} | BHAIRAVI Creations`;

  return `<!DOCTYPE html>
<html lang="en" class="h-full">
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

  <!-- Core Theme & Layout Stylesheet -->
  <style>
    :root {
      --canvas: ${BRAND_DRAFT_COPY.brand_colors.canvas};
      --charcoal: ${BRAND_DRAFT_COPY.brand_colors.charcoal};
      --stone-border: ${BRAND_DRAFT_COPY.brand_colors.stone_border};
      --terracotta: ${BRAND_DRAFT_COPY.brand_colors.terracotta_accent};
      --amber: ${BRAND_DRAFT_COPY.brand_colors.amber_accent};
      --font-serif: "Playfair Display", "Georgia", "Cambria", serif;
      --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--canvas);
      color: var(--charcoal);
      font-family: var(--font-sans);
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    /* WCAG AAA Accessible Focus Outline */
    a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
      outline: 2px solid var(--amber) !important;
      outline-offset: 3px !important;
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
    }

    /* Header */
    header.site-header {
      background: rgba(250, 249, 246, 0.96);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--stone-border);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .header-inner {
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-mark {
      font-family: var(--font-serif);
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--charcoal);
    }
    .brand-submark {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--terracotta);
      display: block;
      font-family: var(--font-sans);
    }

    .brand-link, .brand-mark, .brand-submark {
      white-space: nowrap;
    }

    nav.site-nav {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-shrink: 0;
    }
    .nav-link {
      font-size: 14px;
      font-weight: 500;
      color: var(--charcoal);
      white-space: nowrap;
      transition: color 0.15s ease;
      padding: 6px 4px;
    }
    .nav-link:hover, .nav-link.active {
      color: var(--terracotta);
      font-weight: 600;
    }

    .btn-header-wa {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: #059669;
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      min-height: 40px;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background 0.15s ease;
    }
    .btn-header-wa:hover {
      background: #047857;
    }

    /* Mobile Hamburger & Drawer Styles */
    .mobile-menu-toggle {
      display: none;
      background: transparent;
      border: 1px solid var(--stone-border);
      border-radius: 6px;
      padding: 8px 10px;
      cursor: pointer;
      color: var(--charcoal);
      align-items: center;
      justify-content: center;
      min-width: 44px;
      min-height: 40px;
    }

    .mobile-drawer-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      z-index: 90;
      backdrop-filter: blur(2px);
    }
    .mobile-drawer-backdrop.open {
      display: block;
    }

    .mobile-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 280px;
      max-width: 85vw;
      background: #FAF9F6;
      border-left: 1px solid var(--stone-border);
      z-index: 100;
      transform: translateX(100%);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      padding: 24px;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.08);
    }
    .mobile-drawer.open {
      transform: translateX(0);
    }

    .mobile-drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--stone-border);
      margin-bottom: 20px;
    }

    .mobile-nav-links {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex-grow: 1;
    }
    .mobile-nav-link {
      font-size: 16px;
      font-weight: 600;
      color: var(--charcoal);
      padding: 10px 12px;
      border-radius: 8px;
      white-space: nowrap;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .mobile-nav-link:hover, .mobile-nav-link.active {
      background: #F5F5F4;
      color: var(--terracotta);
    }

    /* Buttons */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px;
      min-height: 48px;
      background: var(--charcoal);
      color: #FFFFFF;
      font-weight: 600;
      font-size: 15px;
      border-radius: 8px;
      transition: background 0.15s ease;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .btn-primary:hover {
      background: #292524;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px;
      min-height: 48px;
      background: transparent;
      color: var(--charcoal);
      font-weight: 600;
      font-size: 15px;
      border-radius: 8px;
      border: 1px solid var(--stone-border);
      transition: background 0.15s ease;
      cursor: pointer;
    }
    .btn-secondary:hover {
      background: #F5F5F4;
    }

    /* Responsive Grid for Catalogue */
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .gap-6 { gap: 1.5rem; }
    @media (min-width: 640px) { .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1024px) { .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    @media (min-width: 1280px) { .xl\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

    /* Footer */
    footer.site-footer {
      border-top: 1px solid var(--stone-border);
      background: #F5F5F4;
      padding: 56px 0 32px 0;
      margin-top: auto;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 36px;
      margin-bottom: 40px;
    }
    .footer-col h4 {
      font-family: var(--font-serif);
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 14px;
      color: var(--charcoal);
    }
    .footer-col ul {
      list-style: none;
    }
    .footer-col li {
      margin-bottom: 8px;
    }
    .footer-col a {
      font-size: 13px;
      color: #57534E;
      transition: color 0.15s ease;
    }
    .footer-col a:hover {
      color: var(--terracotta);
    }
    .footer-bottom {
      border-top: 1px solid var(--stone-border);
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #78716C;
      flex-wrap: wrap;
      gap: 12px;
    }

    @media (max-width: 992px) {
      nav.site-nav {
        display: none;
      }
      .mobile-menu-toggle {
        display: inline-flex;
      }
    }

    @media (max-width: 768px) {
      .footer-grid {
        grid-template-columns: 1fr;
        gap: 28px;
      }
    }
  </style>

  ${extraStyles || ''}
</head>
<body class="bg-[#FAF9F6] text-[#1C1917] antialiased">
  <!-- Global Navigation Header -->
  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="brand-link" aria-label="BHAIRAVI Creations Home">
        <span class="brand-mark">${escapeHtml(STUDIO_DETAILS.name)}</span>
        <span class="brand-submark">${escapeHtml(STUDIO_DETAILS.tagline)}</span>
      </a>

      <!-- Desktop Navigation (Hidden <= 992px) -->
      <nav class="site-nav" aria-label="Main Navigation">
        <a href="/" class="nav-link ${activeNav === 'home' ? 'active' : ''}">Home</a>
        <a href="/products" class="nav-link ${activeNav === 'products' ? 'active' : ''}">Catalogue</a>
        <a href="/custom-order" class="nav-link ${activeNav === 'custom-order' ? 'active' : ''}">Custom Orders</a>
        <a href="/#craft-journey" class="nav-link">Craft Journey</a>
        <a href="/#studio-story" class="nav-link">Our Studio</a>
        <a href="/about" class="nav-link ${activeNav === 'about' ? 'active' : ''}">About</a>
        <a href="/contact" class="nav-link ${activeNav === 'contact' ? 'active' : ''}">Contact</a>
      </nav>

      <div class="header-actions" style="display: flex; align-items: center; gap: 10px;">
        <a href="https://wa.me/${STUDIO_DETAILS.whatsapp_number}"
           target="_blank"
           rel="noopener noreferrer"
           data-tracking-cta="whatsapp_header"
           class="btn-header-wa">
          <svg style="width: 16px; height: 16px;" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
          </svg>
          <span class="hidden sm:inline">WhatsApp Artisan</span>
        </a>

        <!-- Mobile Menu Hamburger Button -->
        <button id="mobile-menu-btn"
                class="mobile-menu-toggle"
                type="button"
                aria-expanded="false"
                aria-controls="mobile-nav-drawer"
                aria-label="Toggle navigation menu">
          <svg style="width: 22px; height: 22px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile Drawer Backdrop & Drawer -->
  <div id="mobile-drawer-backdrop" class="mobile-drawer-backdrop" aria-hidden="true"></div>
  <aside id="mobile-nav-drawer" class="mobile-drawer" aria-label="Mobile Navigation Drawer" aria-hidden="true">
    <div class="mobile-drawer-header">
      <span style="font-family: var(--font-serif); font-size: 18px; font-weight: 700; color: var(--charcoal);">Menu</span>
      <button id="mobile-drawer-close"
              type="button"
              aria-label="Close navigation menu"
              style="background: transparent; border: none; font-size: 26px; cursor: pointer; color: var(--charcoal); line-height: 1;">
        &times;
      </button>
    </div>
    <nav class="mobile-nav-links">
      <a href="/" class="mobile-nav-link ${activeNav === 'home' ? 'active' : ''}">Home</a>
      <a href="/products" class="mobile-nav-link ${activeNav === 'products' ? 'active' : ''}">Catalogue</a>
      <a href="/custom-order" class="mobile-nav-link ${activeNav === 'custom-order' ? 'active' : ''}">Custom Orders</a>
      <a href="/#craft-journey" class="mobile-nav-link">Craft Journey</a>
      <a href="/#studio-story" class="mobile-nav-link">Our Studio</a>
      <a href="/about" class="mobile-nav-link ${activeNav === 'about' ? 'active' : ''}">About</a>
      <a href="/contact" class="mobile-nav-link ${activeNav === 'contact' ? 'active' : ''}">Contact</a>
    </nav>
    <div style="margin-top: auto; padding-top: 16px; border-top: 1px solid var(--stone-border);">
      <a href="https://wa.me/${STUDIO_DETAILS.whatsapp_number}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp" style="width: 100%; display: flex; justify-content: center;">
        WhatsApp Artisan Desk
      </a>
    </div>
  </aside>

  <!-- Page Content Slot -->
  <main id="main-content" class="flex-grow">
    ${content}
  </main>

  <!-- Professional Footer (Feature F39) -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <span class="brand-mark">${escapeHtml(STUDIO_DETAILS.name)}</span>
          <p style="margin-top: 10px; font-size: 13px; color: #78716C; max-width: 320px; line-height: 1.5;">
            A family-run 3D-printing and handcrafted-products studio in Ludhiana, Punjab. Bridging digital additive precision with timeless artisanal hand-finishing.
          </p>
          <div style="margin-top: 14px; font-size: 12px; color: #78716C; line-height: 1.6;">
            <strong>Studio:</strong> ${escapeHtml(STUDIO_DETAILS.address)}<br>
            <strong>Market:</strong> ${escapeHtml(STUDIO_DETAILS.market)} | <strong>Default Currency:</strong> ${escapeHtml(STUDIO_DETAILS.currency)}<br>
            <strong>GSTIN:</strong> ${escapeHtml(STUDIO_DETAILS.gstin)} | <strong>Contact:</strong> ${escapeHtml(STUDIO_DETAILS.contact_email)}
          </div>
        </div>

        <div class="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><a href="/products">Product Catalogue</a></li>
            <li><a href="/custom-order">Custom Orders</a></li>
            <li><a href="/#craft-journey">4-Stage Craft Process</a></li>
            <li><a href="/#studio-story">Studio Story</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Studio & Support</h4>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Contact Our Studio</a></li>
            <li><a href="/faq">Frequently Asked Questions</a></li>
            <li><a href="/shipping">Shipping and Delivery</a></li>
            <li><a href="/returns">Returns & Cancellation</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Trust & Legal</h4>
          <ul>
            <li><a href="/privacy">Privacy Policy (DPDP Act 2023)</a></li>
            <li><a href="/terms">Terms of Service</a></li>
            <li>
              <a href="${STUDIO_DETAILS.amazon_store_url}"
                 target="_blank"
                 rel="noopener noreferrer"
                 data-tracking-cta="amazon_footer">
                Amazon India Storefront
              </a>
            </li>
            <li>
              <a href="https://wa.me/${STUDIO_DETAILS.whatsapp_number}"
                 target="_blank"
                 rel="noopener noreferrer"
                 data-tracking-cta="whatsapp_footer">
                Direct WhatsApp Consultation
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom flex flex-col md:flex-row justify-between">
        <div>© 2026 BHAIRAVI Creations. All rights reserved. Handcrafted in India.</div>
        <div>Zero fake reviews • Zero fabricated claims • Pure craft integrity</div>
      </div>
    </div>
  </footer>

  <!-- First-Party Storefront Telemetry Dispatcher -->
  <script>
    (function() {
      // 1. Session ID management
      var sessKey = 'bhr_session_id';
      var sid = sessionStorage.getItem(sessKey);
      if (!sid) {
        sid = 'sess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
        sessionStorage.setItem(sessKey, sid);
      }

      // 2. Dispatch helper
      function sendEvent(type, payload) {
        payload = payload || {};
        var outcomeStatus = 'not_applicable';
        if (type === 'amazon_outbound_click' || type === 'whatsapp_outbound_click') {
          outcomeStatus = 'purchase_outcome_unknown';
        }

        var eventRecord = {
          event_id: 'evt_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
          event_type: type,
          timestamp_utc: new Date().toISOString(),
          session_id: sid,
          page_path: window.location.pathname,
          referrer_category: 'direct',
          device_category: window.innerWidth < 768 ? 'mobile' : (window.innerWidth < 1024 ? 'tablet' : 'desktop'),
          consent_status: (navigator.doNotTrack === '1' || localStorage.getItem('bhr_consent_status') === 'denied') ? 'denied' : 'granted',
          outcome_status: outcomeStatus,
          metadata: payload.metadata || {}
        };

        if (eventRecord.consent_status === 'denied') return;

        var json = JSON.stringify(eventRecord);
        if (navigator.sendBeacon) {
          var blob = new Blob([json], { type: 'application/json' });
          navigator.sendBeacon('/api/v1/analytics/events', blob);
        } else {
          try {
            fetch('/api/v1/analytics/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: json,
              keepalive: true
            }).catch(function() {});
          } catch(e) {}
        }
      }

      // Expose globally for interactive scripts
      window.__bhr_send_event = sendEvent;

      // 3. Emit page_view
      sendEvent('page_view', { metadata: { title: document.title } });

      // 4. Global Outbound Click Interceptors
      document.addEventListener('click', function(e) {
        var link = e.target.closest('a');
        if (!link || !link.href) return;

        if (link.href.indexOf('amazon.in') !== -1) {
          sendEvent('amazon_outbound_click', {
            metadata: {
              destination_url: link.href,
              source_cta: link.getAttribute('data-tracking-cta') || 'link'
            }
          });
        } else if (link.href.indexOf('wa.me') !== -1) {
          sendEvent('whatsapp_outbound_click', {
            metadata: {
              source_cta: link.getAttribute('data-tracking-cta') || 'link'
            }
          });
        }
      });
    })();

    // Mobile Drawer Interactions
    (function() {
      var btn = document.getElementById('mobile-menu-btn');
      var drawer = document.getElementById('mobile-nav-drawer');
      var backdrop = document.getElementById('mobile-drawer-backdrop');
      var closeBtn = document.getElementById('mobile-drawer-close');
      if (!btn || !drawer || !backdrop) return;

      function openDrawer() {
        drawer.classList.add('open');
        backdrop.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
        if (closeBtn) closeBtn.focus();
      }

      function closeDrawer() {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }

      btn.addEventListener('click', openDrawer);
      if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
      backdrop.addEventListener('click', closeDrawer);

      window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && drawer.classList.contains('open')) {
          closeDrawer();
        }
      });
    })();
  </script>

  ${extraScripts || ''}
</body>
</html>`;
}
