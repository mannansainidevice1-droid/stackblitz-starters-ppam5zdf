/**
 * BHAIRAVI Creations Digital Platform
 * 404 Not Found SSR View
 * Target: src/server/views/not_found.view.ts
 */

import { renderBaseLayout, escapeHtml } from './layout.view.js';

export function renderNotFoundPage(message: string = 'The requested creation or page could not be located in our studio catalogue.'): string {
  const content = `
    <div class="container" style="padding-top: 80px; padding-bottom: 96px; text-align: center; max-width: 600px;">
      <div style="width: 64px; height: 64px; border-radius: 50%; background: #F5F5F4; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; color: #78716C; font-size: 24px; font-weight: 700;">
        404
      </div>
      <h1 style="font-family: var(--font-serif); font-size: 32px; font-weight: 700; color: var(--charcoal); margin-bottom: 12px;">
        Page or Creation Not Found
      </h1>
      <p style="font-size: 15px; color: #57534E; line-height: 1.6; margin-bottom: 32px;">
        ${escapeHtml(message)}
      </p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <a href="/" class="btn-primary" style="min-height: 48px; padding: 12px 24px;">
          Return to Studio Home
        </a>
        <a href="/products" class="btn-secondary" style="min-height: 48px; padding: 12px 24px;">
          Explore Active Catalogue
        </a>
      </div>
    </div>
  `;

  return renderBaseLayout({
    title: 'Page Not Found',
    description: 'The requested page or handcrafted creation is currently unavailable in our studio.',
    canonicalPath: '/404',
    content
  });
}
