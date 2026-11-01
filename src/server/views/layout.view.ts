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
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDrawer();
      });

      // 2. Intelligent Smart Scroll Header (Hides down, Reveals up)
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
