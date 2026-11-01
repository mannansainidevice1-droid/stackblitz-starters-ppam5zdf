/**
 * BHAIRAVI Creations Digital Platform
 * Premium Editorial Product Catalogue SSR View (Features F40 & F41)
 * Target: src/server/views/catalog.view.ts
 */

import { EMPTY_SEARCH_MESSAGE } from '../../shared/constants.js';
import { renderBaseLayout, escapeHtml } from './layout.view.js';
import { renderProductCard } from './components/product_card.component.js';

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
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <!-- Editorial Page Header -->
      <header class="mb-10 max-w-3xl">
        <span class="inline-block text-xs font-bold uppercase tracking-widest text-[#2563EB] mb-2">
          Handcrafted in Ludhiana
        </span>
        <h1 class="font-display text-4xl sm:text-5xl font-black text-[#0B0F19] tracking-tight leading-tight">
          Artisanal Catalogue
        </h1>
        <p class="mt-3 text-base sm:text-lg text-[#475569] leading-relaxed">
          Explore our collection of precision-sculpted 3D creations—each formed layer-by-layer at 0.12mm precision and finished by hand with artist acrylics and authentic patinas.
        </p>
      </header>

      <!-- Bento Filtering & Search Controls Bar -->
      <div class="bento-card p-5 sm:p-6 mb-10 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <!-- Search Input (5 cols on md) -->
          <div class="md:col-span-5 relative">
            <label for="catalog-search-input" class="sr-only">Search Catalogue</label>
            <input
              id="catalog-search-input"
              type="search"
              placeholder="Search by title, description, or craft tag..."
              value="${escapeHtml(searchQuery)}"
              class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#FAF9F5] text-sm text-[#0F172A] placeholder-[#94A3B8] focus:bg-white transition-colors"
            />
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Category Select (3 cols on md) -->
          <div class="md:col-span-3">
            <label for="catalog-category-select" class="sr-only">Filter by Category</label>
            <select
              id="catalog-category-select"
              class="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#FAF9F5] text-sm font-medium text-[#0F172A] focus:bg-white transition-colors cursor-pointer">
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

          <!-- Sort Select (2 cols on md) -->
          <div class="md:col-span-2">
            <label for="catalog-sort-select" class="sr-only">Sort Catalogue</label>
            <select
              id="catalog-sort-select"
              class="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#FAF9F5] text-sm font-medium text-[#0F172A] focus:bg-white transition-colors cursor-pointer">
              <option value="newest" ${activeSort === 'newest' ? 'selected' : ''}>Newest First</option>
              <option value="price_asc" ${activeSort === 'price_asc' ? 'selected' : ''}>Price: Low &rarr; High</option>
              <option value="price_desc" ${activeSort === 'price_desc' ? 'selected' : ''}>Price: High &rarr; Low</option>
              <option value="popularity" ${activeSort === 'popularity' ? 'selected' : ''}>Most Popular</option>
            </select>
          </div>

          <!-- Craft Tags Toggle (2 cols on md) -->
          <div class="md:col-span-2">
            <button
              id="toggle-craft-tags-btn"
              type="button"
              aria-expanded="false"
              aria-controls="craft-tags-panel"
              class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#FAF9F5] hover:bg-[#F1F5F9] text-xs font-bold text-[#0F172A] transition-colors">
              <span>Technique Tags</span>
              <svg class="w-3.5 h-3.5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Collapsible Craft Tags Panel -->
        <div id="craft-tags-panel" class="hidden pt-4 mt-4 border-t border-[#F1F5F9] flex flex-wrap items-center gap-2">
          <span class="text-xs font-bold text-[#64748B] mr-2">Filter Technique:</span>
          ${craftTags
            .map(
              (tag) => `
            <button
              type="button"
              class="tag-pill text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                activeTag === tag
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#2563EB]'
              }"
              data-tag="${escapeHtml(tag)}"
              aria-pressed="${activeTag === tag ? 'true' : 'false'}">
              # ${escapeHtml(tag)}
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Bento Product Grid -->
      <div id="product-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${products.map((product) => renderProductCard(product)).join('')}
      </div>

      <!-- Empty State -->
      <div id="empty-state" class="hidden text-center py-16 px-6 bg-white border border-[#E2E8F0] rounded-2xl max-w-lg mx-auto my-12">
        <div class="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 class="font-display text-xl font-bold text-[#0B0F19] mb-2">No Creations Found</h3>
        <p class="text-sm text-[#475569] leading-relaxed mb-6">
          ${escapeHtml(EMPTY_SEARCH_MESSAGE)}
        </p>
        <div class="flex items-center justify-center gap-3">
          <button id="reset-filters-btn" type="button" class="btn btn-secondary btn-sm">
            Clear Filters
          </button>
          <a href="/custom-order" class="btn btn-primary btn-sm">
            Commission Custom 3D Piece
          </a>
        </div>
      </div>

      <!-- Accessible Pagination Navigation -->
      ${
        pagination && pagination.total_pages > 1
          ? `
        <nav class="pagination-nav mt-16 flex flex-col items-center gap-4" aria-label="Catalogue pagination navigation">
          <div class="flex flex-wrap items-center justify-center gap-2">
            <!-- Previous Link -->
            ${
              pagination.page > 1
                ? `<a href="${buildCatalogUrl({ page: pagination.page - 1, category: activeCategory, tag: activeTag, search: searchQuery, sort: activeSort })}"
                      class="btn btn-secondary btn-sm"
                      aria-label="Previous Page (Page ${pagination.page - 1})">
                      &larr; Previous
                   </a>`
                : `<span class="btn btn-secondary btn-sm opacity-40 cursor-not-allowed" aria-disabled="true">&larr; Previous</span>`
            }

            <!-- Page Number Links -->
            <div class="flex items-center gap-1.5">
              ${Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .map((p) => {
                  const isCurrent = p === pagination.page;
                  return isCurrent
                    ? `<span class="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0B0F19] text-white text-xs font-bold" aria-current="page">${p}</span>`
                    : `<a href="${buildCatalogUrl({ page: p, category: activeCategory, tag: activeTag, search: searchQuery, sort: activeSort })}"
                          class="w-9 h-9 flex items-center justify-center rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-xs font-medium text-[#0F172A]"
                          aria-label="Go to page ${p}">
                          ${p}
                       </a>`;
                })
                .join('')}
            </div>

            <!-- Next Link -->
            ${
              pagination.page < pagination.total_pages
                ? `<a href="${buildCatalogUrl({ page: pagination.page + 1, category: activeCategory, tag: activeTag, search: searchQuery, sort: activeSort })}"
                      class="btn btn-secondary btn-sm"
                      aria-label="Next Page (Page ${pagination.page + 1})">
                      Next &rarr;
                   </a>`
                : `<span class="btn btn-secondary btn-sm opacity-40 cursor-not-allowed" aria-disabled="true">Next &rarr;</span>`
            }
          </div>

          <div class="text-xs text-[#64748B]">
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

        if (toggleTagsBtn && craftTagsPanel) {
          toggleTagsBtn.addEventListener('click', function() {
            var isHidden = craftTagsPanel.classList.contains('hidden');
            if (isHidden) {
              craftTagsPanel.classList.remove('hidden');
              craftTagsPanel.classList.add('flex');
              toggleTagsBtn.setAttribute('aria-expanded', 'true');
            } else {
              craftTagsPanel.classList.add('hidden');
              craftTagsPanel.classList.remove('flex');
              toggleTagsBtn.setAttribute('aria-expanded', 'false');
            }
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
              card.style.display = 'block';
              visible++;
            } else {
              card.style.display = 'none';
            }
          });

          if (emptyState) {
            if (visible === 0) {
              emptyState.classList.remove('hidden');
              grid.classList.add('hidden');
            } else {
              emptyState.classList.add('hidden');
              grid.classList.remove('hidden');
            }
          }
        }

        if (searchInput) {
          searchInput.addEventListener('input', function(e) {
            state.searchQuery = e.target.value;
            filterAndSort();
          });
        }

        if (categorySelect) {
          categorySelect.addEventListener('change', function(e) {
            state.category = e.target.value;
            filterAndSort();
          });
        }

        if (sortSelect) {
          sortSelect.addEventListener('change', function(e) {
            state.sort = e.target.value;
            // Sorting implementation
            if (!grid) return;
            var cards = Array.from(grid.querySelectorAll('.product-card'));
            cards.sort(function(a, b) {
              var priceA = Number(a.getAttribute('data-price-paise') || 0);
              var priceB = Number(b.getAttribute('data-price-paise') || 0);
              var dateA = new Date(a.getAttribute('data-created-at') || 0).getTime();
              var dateB = new Date(b.getAttribute('data-created-at') || 0).getTime();
              var orderA = Number(a.getAttribute('data-display-order') || 0);
              var orderB = Number(b.getAttribute('data-display-order') || 0);

              if (state.sort === 'price_asc') return priceA - priceB;
              if (state.sort === 'price_desc') return priceB - priceA;
              if (state.sort === 'newest') return (dateB - dateA) || (orderA - orderB);
              return orderA - orderB;
            });
            cards.forEach(function(c) { grid.appendChild(c); });
          });
        }

        tagPills.forEach(function(pill) {
          pill.addEventListener('click', function() {
            var tag = pill.getAttribute('data-tag');
            if (state.tag === tag) {
              state.tag = 'all';
              pill.classList.remove('bg-[#2563EB]', 'text-white', 'border-[#2563EB]');
              pill.classList.add('bg-white', 'text-[#475569]', 'border-[#CBD5E1]');
            } else {
              state.tag = tag;
              tagPills.forEach(function(p) {
                p.classList.remove('bg-[#2563EB]', 'text-white', 'border-[#2563EB]');
                p.classList.add('bg-white', 'text-[#475569]', 'border-[#CBD5E1]');
              });
              pill.classList.add('bg-[#2563EB]', 'text-white', 'border-[#2563EB]');
              pill.classList.remove('bg-white', 'text-[#475569]', 'border-[#CBD5E1]');
            }
            filterAndSort();
          });
        });

        if (resetBtn) {
          resetBtn.addEventListener('click', function() {
            state = { searchQuery: '', category: 'all', tag: 'all', sort: 'newest' };
            if (searchInput) searchInput.value = '';
            if (categorySelect) categorySelect.value = 'all';
            if (sortSelect) sortSelect.value = 'newest';
            tagPills.forEach(function(p) {
              p.classList.remove('bg-[#2563EB]', 'text-white', 'border-[#2563EB]');
              p.classList.add('bg-white', 'text-[#475569]', 'border-[#CBD5E1]');
            });
            filterAndSort();
          });
        }
      })();
    </script>
  `;

  return renderBaseLayout({
    title: 'Artisanal 3D Catalogue',
    description: 'Browse our collection of handcrafted 3D printed creations precision-formed in Ludhiana, Punjab.',
    canonicalPath: '/products',
    activeNav: 'products',
    content,
    extraScripts
  });
}
