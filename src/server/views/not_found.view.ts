/**
 * BHAIRAVI Creations Digital Platform
 * Premium Editorial 404 Not Found SSR View
 * Target: src/server/views/not_found.view.ts
 */

import { renderBaseLayout, escapeHtml } from './layout.view.js';

export function renderNotFoundPage(message: string = 'The requested creation or page could not be located in our studio catalogue.'): string {
  const content = `
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center max-w-lg">
      <div class="w-16 h-16 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-display font-black text-xl flex items-center justify-center mx-auto mb-6 shadow-sm">
        404
      </div>
      <h1 class="font-display text-3xl sm:text-4xl font-black text-[#0B0F19] mb-4">
        Creation Not Located
      </h1>
      <p class="text-sm sm:text-base text-[#475569] leading-relaxed mb-8">
        ${escapeHtml(message)}
      </p>
      <div class="flex items-center justify-center gap-4 flex-wrap">
        <a href="/" class="btn btn-primary btn-md">
          Return to Studio Home
        </a>
        <a href="/products" class="btn btn-secondary btn-md">
          Explore Catalogue
        </a>
      </div>
    </div>
  `;

  return renderBaseLayout({
    title: 'Creation Not Found',
    description: 'The requested page or handcrafted creation is currently unavailable in our studio catalogue.',
    canonicalPath: '/404',
    content
  });
}
