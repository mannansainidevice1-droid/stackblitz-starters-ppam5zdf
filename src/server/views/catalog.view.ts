/**
 * BHAIRAVI Creations Digital Platform
 * Product Catalogue SSR View (Features F40 & F41 + Reviewer 2 Finding 3)
 * Target: src/server/views/catalog.view.ts
 */

import { formatPaiseToInr } from '../../shared/pricing.js';
import { EMPTY_SEARCH_MESSAGE } from '../../shared/constants.js';
import { renderBaseLayout, escapeHtml } from './layout.view.js';

export interface CatalogPageProps {
  products: any[];
  categories: any[];
  pagination?: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
  activeCategory?: string;
  activeTag?: string;
  searchQuery?: string;
  activeSort?: string;
}

function buildCatalogUrl(params: {
  page?: number;
  category?: string;
  tag?: string;
  search?: string;
  sort?: string;
}): string {
  const q = new URLSearchParams();
  if (params.search && params.search.trim()) q.set('search', params.search.trim());
  if (params.category && params.category !== 'all') q.set('category', params.category);
  if (params.tag && params.tag !== 'all') q.set('tag', params.tag);
  if (params.sort && params.sort !== 'newest') q.set('sort', params.sort);
  if (params.page && params.page > 1) q.set('page', String(params.page));
  const qs = q.toString();
  return qs ? `/products?${qs}` : '/products';
}

export function renderCatalogPage(props: CatalogPageProps): string {
  const {
    products = [],
    categories = [],
    pagination = { page: 1, limit: 12, total_items: products.length, total_pages: 1 },
    activeCategory = 'all',
    activeTag = 'all',
    searchQuery = '',
    activeSort = 'newest'
  } = props;

  const craftTags = ['handmade finishing', 'customisation', 'multi-colour printing'];

  const content = `
    <div class="container" style="padding-top: 48px; padding-bottom: 80px;">
      <!-- Page Header -->
      <div style="margin-bottom: 36px;">
        <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--terracotta);">
          Artisanal Collection
        </span>
        <h1 style="font-family: var(--font-serif); font-size: 38px; font-weight: 700; color: var(--charcoal); margin-top: 6px; letter-spacing: -0.01em;">
          Product Catalogue
        </h1>
        <p style="font-size: 15px; color: #78716C; margin-top: 8px; max-width: 680px; line-height: 1.6;">
          Explore our handcrafted 3D printed creations—each piece precision-formed at 0.12mm layer height and individually painted by hand in our Ludhiana studio.
        </p>
      </div>

      <!-- Contemporary Controls Bar: Search, Category Dropdown, Sort & Collapsible Craft Tags -->
      <div class="catalogue-controls" style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; padding: 20px 24px; margin-bottom: 36px; box-shadow: 0 1px 3px rgba(28, 25, 23, 0.04);">
        <!-- Search and Primary Controls Row -->
        <div style="display: flex; gap: 16px; justify-content: space-between; flex-wrap: wrap; align-items: center;">
          
          <!-- Search Input -->
          <div style="flex: 2 1 300px; position: relative;">
            <input
              id="catalog-search-input"
              type="search"
              placeholder="Search by title, description, or craft tag..."
              value="${escapeHtml(searchQuery)}"
              style="width: 100%; padding: 11px 16px 11px 40px; font-size: 14px; border: 1px solid var(--stone-border); border-radius: 10px; background: #FAF9F6; color: var(--charcoal); outline: none; transition: border-color 0.15s ease;"
              aria-label="Search product catalogue"
            />
            <svg style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #A8A29E;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Category Navigation Dropdown -->
          <div style="flex: 1 1 200px; display: flex; align-items: center; gap: 8px;">
            <label for="catalog-category-select" style="font-size: 13px; font-weight: 600; color: #57534E; white-space: nowrap;">Category:</label>
            <select
              id="catalog-category-select"
              aria-label="Filter products by category"
              style="width: 100%; padding: 10px 14px; font-size: 13px; font-weight: 500; border: 1px solid var(--stone-border); border-radius: 10px; background: #FAF9F6; color: var(--charcoal); outline: none; cursor: pointer;">
              <option value="all" ${activeCategory === 'all' ? 'selected' : ''}>All Categories</option>
              ${categories
                .map(
                  (cat) => `
                <option value="${escapeHtml(cat.slug)}" ${activeCategory === cat.slug ? 'selected' : ''}>
                  ${escapeHtml(cat.name)}
                </option>
              `
                )
                .join('')}
            </select>
          </div>

          <!-- Sort Select -->
          <div style="flex: 1 1 180px; display: flex; align-items: center; gap: 8px;">
            <label for="catalog-sort-select" style="font-size: 13px; font-weight: 600; color: #57534E; white-space: nowrap;">Sort By:</label>
            <select
              id="catalog-sort-select"
              aria-label="Sort product catalogue"
              style="width: 100%; padding: 10px 14px; font-size: 13px; font-weight: 500; border: 1px solid var(--stone-border); border-radius: 10px; background: #FAF9F6; color: var(--charcoal); outline: none; cursor: pointer;">
              <option value="newest" ${activeSort === 'newest' ? 'selected' : ''}>Newest First</option>
              <option value="price_asc" ${activeSort === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
              <option value="price_desc" ${activeSort === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
              <option value="popularity" ${activeSort === 'popularity' ? 'selected' : ''}>Most Popular</option>
            </select>
          </div>

          <!-- Craft Tags Toggle Button -->
          <div>
            <button
              id="toggle-craft-tags-btn"
              type="button"
              aria-expanded="false"
              aria-controls="craft-tags-panel"
              style="padding: 10px 16px; font-size: 13px; font-weight: 600; border-radius: 10px; border: 1px solid var(--stone-border); background: #FAF9F6; color: var(--charcoal); cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
              <span>Craft Tags</span>
              <span style="font-size: 10px; color: #78716C;">&dtrif;</span>
            </button>
          </div>
        </div>

        <!-- Collapsible Craft Tags Panel -->
        <div id="craft-tags-panel" style="display: none; padding-top: 16px; margin-top: 16px; border-top: 1px solid var(--stone-border); display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <span style="font-size: 12px; font-weight: 600; color: #78716C; margin-right: 4px;">Filter by Technique:</span>
          ${craftTags
            .map(
              (tag) => `
            <button
              type="button"
              class="tag-pill ${activeTag === tag ? 'bg-[#C2410C] text-white' : 'bg-white text-stone-700'}"
              data-tag="${escapeHtml(tag)}"
              aria-pressed="${activeTag === tag ? 'true' : 'false'}"
              style="padding: 6px 14px; font-size: 12px; font-weight: 500; border-radius: 8px; border: 1px solid var(--stone-border); cursor: pointer; transition: all 0.15s ease;">
              # ${escapeHtml(tag)}
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Modern Flexbox Product Cards (Fluid Proportions with Generous Whitespace) -->
      <div id="product-grid" class="catalog-flex-grid" style="display: flex; flex-wrap: wrap; gap: 28px; justify-content: flex-start;">
        ${products
          .map((product) => {
            const tagsList = Array.isArray(product.tags)
              ? product.tags
              : typeof product.tags === 'string'
              ? JSON.parse(product.tags)
              : [];
            const tagsStr = tagsList.join(', ');
            const isSoldOut = !product.is_made_to_order && product.inventory_count <= 0;

            return `
            <article
              class="product-card catalog-card"
              data-product-id="${product.id}"
              data-product-slug="${product.slug}"
              data-product-name="${escapeHtml(product.name)}"
              data-product-desc="${escapeHtml(product.description || '')}"
              data-category-slug="${escapeHtml(product.category?.slug || '')}"
              data-tags="${escapeHtml(tagsStr)}"
              data-price-paise="${product.base_price_paise}"
              data-created-at="${product.created_at || ''}"
              data-display-order="${product.display_order || 0}"
              data-track-impression="product_impression"
              style="flex: 1 1 320px; max-width: 100%; display: flex; flex-direction: column; background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(28, 25, 23, 0.04);">
              
              <!-- Image Viewport (Clean, Uncluttered — No Repetitive 'Made to Order' Badge) -->
              <div class="card-image-wrap" style="aspect-ratio: 4/3; background: #F5F5F4; position: relative; overflow: hidden;">
                <img
                  src="${product.primary_image?.public_url || '/assets/images/placeholder_studio_piece.webp'}"
                  alt="${escapeHtml(product.primary_image?.alt_text || product.name)}"
                  loading="lazy"
                  style="width: 100%; height: 100%; object-fit: cover;"
                  onerror="this.src='/assets/images/placeholder_studio_piece.webp'"
                />
                ${
                  isSoldOut
                    ? `
                  <span style="position: absolute; top: 12px; left: 12px; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; background: rgba(220, 38, 38, 0.9); color: #FFFFFF;">
                    Sold Out
                  </span>
                `
                    : ''
                }
              </div>

              <!-- Product Details with Generous Whitespace -->
              <div style="padding: 24px; display: flex; flex-direction: column; flex-grow: 1;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #78716C; margin-bottom: 6px;">
                  ${escapeHtml(product.category?.name || 'Handcrafted')}
                </span>
                <h3 style="font-family: var(--font-serif); font-size: 18px; font-weight: 600; color: var(--charcoal); margin-bottom: 10px; line-height: 1.35;">
                  <a href="/products/${product.slug}" data-track-click="product_click" style="color: inherit;">
                    ${escapeHtml(product.name)}
                  </a>
                </h3>

                <!-- Craft Tags -->
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 18px;">
                  ${tagsList
                    .slice(0, 3)
                    .map(
                      (tag: string) => `
                    <span style="font-size: 11px; font-weight: 500; background: #FAF9F6; border: 1px solid var(--stone-border); padding: 3px 8px; border-radius: 6px; color: #57534E;">
                      ${escapeHtml(tag)}
                    </span>
                  `
                    )
                    .join('')}
                </div>

                <!-- Price & Navigation CTA -->
                <div style="margin-top: auto; padding-top: 16px; border-top: 1px solid var(--stone-border); display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 18px; font-weight: 700; color: var(--charcoal); letter-spacing: -0.01em;">
                    ${formatPaiseToInr(product.base_price_paise)}
                  </span>
                  <a href="/products/${product.slug}" style="font-size: 13px; font-weight: 600; color: var(--terracotta); display: inline-flex; align-items: center; gap: 4px;">
                    View Piece &rarr;
                  </a>
                </div>
              </div>
            </article>
          `;
          })
          .join('')}
      </div>

      <!-- Empty Search State -->
      <div id="empty-state" class="hidden" style="display: none; text-align: center; padding: 64px 20px; background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; max-width: 600px; margin: 40px auto 0 auto;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: #F5F5F4; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; color: #78716C;">
          <svg style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 style="font-family: var(--font-serif); font-size: 20px; font-weight: 600; color: var(--charcoal); margin-bottom: 8px;">
          No Handcrafted Creations Found
        </h3>
        <p style="font-size: 14px; color: #57534E; line-height: 1.6; margin-bottom: 24px;">
          ${escapeHtml(EMPTY_SEARCH_MESSAGE)}
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button id="reset-filters-btn" type="button" class="btn-secondary" style="min-height: 44px; padding: 10px 20px;">
            Clear Filters
          </button>
          <a href="/custom-order" class="btn-primary" style="min-height: 44px; padding: 10px 20px;">
            Commission a Custom 3D Print
          </a>
        </div>
      </div>

      <!-- Accessible Pagination Navigation (Reviewer 2 Finding 3) -->
      ${
        pagination && pagination.total_pages > 1
          ? `
        <nav class="pagination-nav" aria-label="Catalogue pagination navigation" style="margin-top: 56px; display: flex; flex-direction: column; align-items: center; gap: 14px;">
          <div class="pagination-group" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: center;">
            <!-- Previous Link -->
            ${
              pagination.page > 1
                ? `<a href="${buildCatalogUrl({ page: pagination.page - 1, category: activeCategory, tag: activeTag, search: searchQuery, sort: activeSort })}"
                      class="pagination-btn pagination-prev"
                      aria-label="Go to previous page (Page ${pagination.page - 1})">
                      &larr; Previous
                   </a>`
                : `<span class="pagination-btn pagination-disabled" aria-disabled="true" aria-label="Previous page (disabled)">&larr; Previous</span>`
            }

            <!-- Page Number Links -->
            <div style="display: flex; gap: 6px; align-items: center;">
              ${Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .map((p) => {
                  const isCurrent = p === pagination.page;
                  return isCurrent
                    ? `<span class="pagination-num active" aria-current="page" style="min-width: 42px; height: 42px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; background: var(--charcoal); color: #FFFFFF; border-radius: 8px;">${p}</span>`
                    : `<a href="${buildCatalogUrl({ page: p, category: activeCategory, tag: activeTag, search: searchQuery, sort: activeSort })}"
                          class="pagination-num"
                          aria-label="Go to page ${p}"
                          style="min-width: 42px; height: 42px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; background: #FFFFFF; color: var(--charcoal); border: 1px solid var(--stone-border); border-radius: 8px; text-decoration: none;">
                          ${p}
                       </a>`;
                })
                .join('')}
            </div>

            <!-- Next Link -->
            ${
              pagination.page < pagination.total_pages
                ? `<a href="${buildCatalogUrl({ page: pagination.page + 1, category: activeCategory, tag: activeTag, search: searchQuery, sort: activeSort })}"
                      class="pagination-btn pagination-next"
                      aria-label="Go to next page (Page ${pagination.page + 1})">
                      Next &rarr;
                   </a>`
                : `<span class="pagination-btn pagination-disabled" aria-disabled="true" aria-label="Next page (disabled)">Next &rarr;</span>`
            }
          </div>

          <!-- Pagination Summary Text -->
          <div class="pagination-summary" style="font-size: 13px; color: #78716C; text-align: center;">
            Showing <strong>${(pagination.page - 1) * pagination.limit + 1}</strong>&ndash;<strong>${Math.min(
              pagination.page * pagination.limit,
              pagination.total_items
            )}</strong> of <strong>${pagination.total_items}</strong> handcrafted creations
          </div>
        </nav>
      `
          : ''
      }
    </div>
  `;

  const extraScripts = `
    <script>
      (function() {
        var searchInput = document.getElementById('catalog-search-input');
        var categorySelect = document.getElementById('catalog-category-select');
        var sortSelect = document.getElementById('catalog-sort-select');
        var toggleTagsBtn = document.getElementById('toggle-craft-tags-btn');
        var craftTagsPanel = document.getElementById('craft-tags-panel');
        var tagPills = document.querySelectorAll('.tag-pill');
        var grid = document.getElementById('product-grid');
        var emptyState = document.getElementById('empty-state');
        var resetBtn = document.getElementById('reset-filters-btn');

        var state = {
          searchQuery: ${JSON.stringify(searchQuery)},
          category: ${JSON.stringify(activeCategory)},
          tag: ${JSON.stringify(activeTag)},
          sort: ${JSON.stringify(activeSort)}
        };

        // Collapsible craft tags panel
        if (toggleTagsBtn && craftTagsPanel) {
          toggleTagsBtn.addEventListener('click', function() {
            var isHidden = craftTagsPanel.style.display === 'none';
            craftTagsPanel.style.display = isHidden ? 'flex' : 'none';
            toggleTagsBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
          });
        }

        function filterAndSort() {
          if (!grid) return;
          var cards = Array.from(grid.querySelectorAll('.product-card'));
          var q = state.searchQuery.trim().toLowerCase();
          var visible = 0;

          cards.forEach(function(card) {
            var name = (card.getAttribute('data-product-name') || '').toLowerCase();
            var desc = (card.getAttribute('data-product-desc') || '').toLowerCase();
            var tags = (card.getAttribute('data-tags') || '').toLowerCase();
            var cat = card.getAttribute('data-category-slug') || '';

            var matchesQ = q.length === 0 || (name.indexOf(q) !== -1 || desc.indexOf(q) !== -1 || tags.indexOf(q) !== -1);
            var matchesCat = state.category === 'all' || cat === state.category;
            var matchesTag = state.tag === 'all' || tags.indexOf(state.tag.toLowerCase()) !== -1;

            if (matchesQ && matchesCat && matchesTag) {
              card.style.display = 'flex';
              visible++;
            } else {
              card.style.display = 'none';
            }
          });

          cards.sort(function(a, b) {
            var pA = parseInt(a.getAttribute('data-price-paise') || '0', 10);
            var pB = parseInt(b.getAttribute('data-price-paise') || '0', 10);
            var oA = parseInt(a.getAttribute('data-display-order') || '0', 10);
            var oB = parseInt(b.getAttribute('data-display-order') || '0', 10);
            var cA = a.getAttribute('data-created-at') || '';
            var cB = b.getAttribute('data-created-at') || '';
            var idA = a.getAttribute('data-product-id') || '';
            var idB = b.getAttribute('data-product-id') || '';

            if (state.sort === 'price_asc') return (pA - pB) || (oA - oB) || idA.localeCompare(idB);
            if (state.sort === 'price_desc') return (pB - pA) || (oA - oB) || idA.localeCompare(idB);
            if (state.sort === 'newest') return (cB.localeCompare(cA)) || (oA - oB) || idA.localeCompare(idB);
            return (oA - oB) || idA.localeCompare(idB);
          });

          cards.forEach(function(c) { grid.appendChild(c); });

          if (emptyState) {
            emptyState.style.display = visible === 0 ? 'block' : 'none';
          }
        }

        // Search Input with Debounce & Enter navigation
        if (searchInput) {
          var timer = null;
          searchInput.addEventListener('input', function(e) {
            clearTimeout(timer);
            timer = setTimeout(function() {
              state.searchQuery = e.target.value;
              filterAndSort();
            }, 250);
          });

          searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
              var q = encodeURIComponent(searchInput.value.trim());
              var url = '/products?search=' + q;
              if (state.category !== 'all') url += '&category=' + encodeURIComponent(state.category);
              if (state.sort !== 'newest') url += '&sort=' + encodeURIComponent(state.sort);
              window.location.href = url;
            }
          });
        }

        // Category dropdown change
        if (categorySelect) {
          categorySelect.addEventListener('change', function(e) {
            state.category = e.target.value;
            filterAndSort();
          });
        }

        // Sort select change
        if (sortSelect) {
          sortSelect.addEventListener('change', function(e) {
            state.sort = e.target.value;
            filterAndSort();
          });
        }

        // Craft tag pills
        tagPills.forEach(function(btn) {
          btn.addEventListener('click', function() {
            var tag = btn.getAttribute('data-tag') || 'all';
            if (state.tag === tag) {
              state.tag = 'all';
              btn.classList.remove('bg-[#C2410C]', 'text-white');
              btn.classList.add('bg-white', 'text-stone-700');
              btn.setAttribute('aria-pressed', 'false');
            } else {
              tagPills.forEach(function(b) {
                b.classList.remove('bg-[#C2410C]', 'text-white');
                b.classList.add('bg-white', 'text-stone-700');
                b.setAttribute('aria-pressed', 'false');
              });
              btn.classList.add('bg-[#C2410C]', 'text-white');
              btn.classList.remove('bg-white', 'text-stone-700');
              btn.setAttribute('aria-pressed', 'true');
              state.tag = tag;
            }
            filterAndSort();
          });
        });

        // Reset button
        if (resetBtn) {
          resetBtn.addEventListener('click', function() {
            state.searchQuery = '';
            state.category = 'all';
            state.tag = 'all';
            state.sort = 'newest';
            if (searchInput) searchInput.value = '';
            if (categorySelect) categorySelect.value = 'all';
            if (sortSelect) sortSelect.value = 'newest';
            tagPills.forEach(function(b) {
              b.classList.remove('bg-[#C2410C]', 'text-white');
              b.classList.add('bg-white', 'text-stone-700');
              b.setAttribute('aria-pressed', 'false');
            });
            filterAndSort();
          });
        }
      })();
    </script>
  `;

  return renderBaseLayout({
    title: 'Product Catalogue',
    description: 'Browse our complete catalogue of handcrafted 3D printed sculptures, decor, and models.',
    canonicalPath: '/products',
    activeNav: 'products',
    content,
    extraScripts
  });
}
