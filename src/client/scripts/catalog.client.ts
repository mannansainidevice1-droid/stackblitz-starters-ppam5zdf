/// <reference lib="dom" />
/**
 * BHAIRAVI Creations Digital Platform
 * Catalogue Grid Filter, Search, and Sort Client Interactivity
 * Target: src/client/scripts/catalog.client.ts
 */

import { telemetry } from '../tracking/telemetry.js';

export interface CatalogState {
  searchQuery: string;
  selectedCategory: string;
  selectedTag: string;
  sortBy: string;
}

export function initCatalogClient(): void {
  if (typeof document === 'undefined') return;

  const searchInput = document.getElementById('catalog-search-input') as HTMLInputElement | null;
  const sortSelect = document.getElementById('catalog-sort-select') as HTMLSelectElement | null;
  const categoryPills = document.querySelectorAll<HTMLButtonElement>('.category-pill');
  const tagPills = document.querySelectorAll<HTMLButtonElement>('.tag-pill');
  const gridContainer = document.getElementById('product-grid');
  const emptyState = document.getElementById('empty-state');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');

  const state: CatalogState = {
    searchQuery: '',
    selectedCategory: 'all',
    selectedTag: 'all',
    sortBy: 'newest'
  };

  function getProductCards(): HTMLElement[] {
    if (!gridContainer) return [];
    return Array.from(gridContainer.querySelectorAll<HTMLElement>('.product-card'));
  }

  function filterAndSortProducts(): void {
    const cards = getProductCards();
    if (!cards.length) return;

    const query = state.searchQuery.trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
      const name = (card.getAttribute('data-product-name') || '').toLowerCase();
      const description = (card.getAttribute('data-product-desc') || '').toLowerCase();
      const tagsStr = (card.getAttribute('data-tags') || '').toLowerCase();
      const categorySlug = card.getAttribute('data-category-slug') || '';

      // 1. Search Query Match (literal plain text)
      let matchesSearch = true;
      if (query.length > 0) {
        matchesSearch = name.includes(query) || description.includes(query) || tagsStr.includes(query);
      }

      // 2. Category Match
      let matchesCategory = true;
      if (state.selectedCategory !== 'all') {
        matchesCategory = categorySlug === state.selectedCategory;
      }

      // 3. Tag Match
      let matchesTag = true;
      if (state.selectedTag !== 'all') {
        matchesTag = tagsStr.includes(state.selectedTag.toLowerCase());
      }

      const isVisible = matchesSearch && matchesCategory && matchesTag;
      if (isVisible) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // 4. Sort visible cards
    const sortedCards = [...cards].sort((a, b) => {
      const priceA = parseInt(a.getAttribute('data-price-paise') || '0', 10);
      const priceB = parseInt(b.getAttribute('data-price-paise') || '0', 10);
      const orderA = parseInt(a.getAttribute('data-display-order') || '0', 10);
      const orderB = parseInt(b.getAttribute('data-display-order') || '0', 10);
      const createdA = a.getAttribute('data-created-at') || '';
      const createdB = b.getAttribute('data-created-at') || '';

      if (state.sortBy === 'price_asc') {
        return priceA - priceB || orderA - orderB;
      } else if (state.sortBy === 'price_desc') {
        return priceB - priceA || orderA - orderB;
      } else if (state.sortBy === 'newest') {
        return createdB.localeCompare(createdA) || orderA - orderB;
      } else if (state.sortBy === 'popularity') {
        return orderA - orderB;
      }
      return orderA - orderB;
    });

    if (gridContainer) {
      sortedCards.forEach((card) => gridContainer.appendChild(card));
    }

    // 5. Toggle empty state
    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.classList.remove('hidden');
        emptyState.style.display = 'block';
      } else {
        emptyState.classList.add('hidden');
        emptyState.style.display = 'none';
      }
    }

    // Refresh telemetry observer for newly filtered/visible cards
    telemetry.observeProductCards(gridContainer || undefined);
  }

  // Bind Search with 250ms debounce
  if (searchInput) {
    let debounceTimer: any = null;
    searchInput.addEventListener('input', (e) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchQuery = (e.target as HTMLInputElement).value;
        filterAndSortProducts();
      }, 250);
    });
  }

  // Bind Sort Dropdown
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value;
      const validSorts = ['price_asc', 'price_desc', 'popularity', 'newest'];
      state.sortBy = validSorts.includes(val) ? val : 'newest';
      filterAndSortProducts();
    });
  }

  // Bind Category Pills
  categoryPills.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryPills.forEach((b) => {
        b.classList.remove('active', 'bg-[#1C1917]', 'text-white');
        b.classList.add('bg-stone-100', 'text-stone-700');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active', 'bg-[#1C1917]', 'text-white');
      btn.classList.remove('bg-stone-100', 'text-stone-700');
      btn.setAttribute('aria-pressed', 'true');

      state.selectedCategory = btn.getAttribute('data-category') || 'all';
      filterAndSortProducts();
    });
  });

  // Bind Tag Pills
  tagPills.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag') || 'all';
      if (state.selectedTag === tag && tag !== 'all') {
        state.selectedTag = 'all';
        btn.classList.remove('bg-[#C2410C]', 'text-white');
        btn.classList.add('bg-white', 'text-stone-700');
        btn.setAttribute('aria-pressed', 'false');
      } else {
        tagPills.forEach((b) => {
          b.classList.remove('bg-[#C2410C]', 'text-white');
          b.classList.add('bg-white', 'text-stone-700');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('bg-[#C2410C]', 'text-white');
        btn.classList.remove('bg-white', 'text-stone-700');
        btn.setAttribute('aria-pressed', 'true');
        state.selectedTag = tag;
      }
      filterAndSortProducts();
    });
  });

  // Bind Reset Filters
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      state.searchQuery = '';
      state.selectedCategory = 'all';
      state.selectedTag = 'all';
      state.sortBy = 'newest';

      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'newest';

      categoryPills.forEach((b) => {
        const isAll = b.getAttribute('data-category') === 'all';
        b.setAttribute('aria-pressed', isAll ? 'true' : 'false');
        if (isAll) {
          b.classList.add('active', 'bg-[#1C1917]', 'text-white');
          b.classList.remove('bg-stone-100', 'text-stone-700');
        } else {
          b.classList.remove('active', 'bg-[#1C1917]', 'text-white');
          b.classList.add('bg-stone-100', 'text-stone-700');
        }
      });

      tagPills.forEach((b) => {
        b.classList.remove('bg-[#C2410C]', 'text-white');
        b.classList.add('bg-white', 'text-stone-700');
        b.setAttribute('aria-pressed', 'false');
      });

      filterAndSortProducts();
    });
  }

  // Initial observe
  telemetry.observeProductCards(gridContainer || undefined);
}

// Auto-run if loaded directly in browser
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initCatalogClient();
  });
}
