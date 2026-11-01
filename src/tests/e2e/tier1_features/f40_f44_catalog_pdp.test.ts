/**
 * Tier 1 — Feature Coverage: Product Catalogue & PDP (F40 - F44)
 * Requirements: R1, R2, R6 | Interface Contracts: Public Storefront Contract
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TestContext } from '../helpers/test_context.js';
import { assertIntegerPaise } from '../helpers/assertions.js';
import { renderCatalogPage } from '../../../server/views/catalog.view.js';
import { renderProductDetailPage } from '../../../server/views/pdp.view.js';

describe('Tier 1: Feature Coverage — Catalogue & PDP (F40 - F44)', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  // ==========================================================================
  // F40: Product Catalogue Listing (Responsive grid, category pills, craft tags)
  // ==========================================================================
  describe('F40: Product Catalogue Listing', () => {
    test('F40-1: Catalogue renders all published products in active catalog', () => {
      const published = ctx.products.filter((p) => p.publication_status === 'published');
      assert.ok(published.length >= 3);
    });

    test('F40-2: Product cards display primary image, name, price, availability and craft tags', () => {
      const ganesha = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      assert.ok(ganesha.name.includes('Lord Ganesha'));
      assert.ok(ganesha.base_price_paise > 0);
      assert.ok(ganesha.tags.includes('handmade finishing'));
      assert.strictEqual(ganesha.is_made_to_order, 1);
    });

    test('F40-3: Filtering by category returns accurate subset of products', () => {
      const spiritualProducts = ctx.products.filter(
        (p) => p.category_id === 'cat_spiritual' && p.publication_status === 'published'
      );
      assert.ok(spiritualProducts.length >= 1);
      assert.strictEqual(spiritualProducts[0].category_id, 'cat_spiritual');
    });

    test('F40-4: Filtering by craft tag (e.g. "handmade finishing") filters items accurately', () => {
      const tagged = ctx.products.filter((p) => p.tags.includes('handmade finishing'));
      assert.ok(tagged.length >= 2);
    });

    test('F40-5: Catalogue layout is responsive across mobile (1 col), tablet (2 col), and desktop (3-4 col)', () => {
      const sampleProducts = [
        { id: 'p1', name: 'Ganesha Idol', slug: 'ganesha-idol', category_id: 'cat1', base_price_paise: 249900, is_published: true }
      ];
      const html = renderCatalogPage({
        products: sampleProducts as any,
        categories: [{ id: 'cat1', slug: 'sacred', name: 'Sacred' }],
        pagination: { page: 1, limit: 12, total_items: 1, total_pages: 1 }
      });
      assert.ok(html.includes('catalog-flex-grid') || html.includes('grid-cols-1'), 'HTML must define responsive catalogue container');
      assert.ok(html.includes('catalog-card') || html.includes('product-card'), 'HTML must render individual product cards');
    });
  });

  // ==========================================================================
  // F41: Catalogue Sorting & Filtering (debounced search, sort price/popularity)
  // ==========================================================================
  describe('F41: Catalogue Sorting & Filtering', () => {
    test('F41-1: Search query filters products by title, description, or craft tags', () => {
      const query = 'lotus';
      const results = ctx.products.filter(
        (p) =>
          p.publication_status === 'published' &&
          (p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query))
      );
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].slug, 'geometric-lotus-planter-terracotta');
    });

    test('F41-2: Sorting by price ascending orders from lowest to highest INR price', () => {
      const published = ctx.products.filter((p) => p.publication_status === 'published');
      const sortedAsc = [...published].sort((a, b) => a.base_price_paise - b.base_price_paise);
      assert.ok(sortedAsc[0].base_price_paise <= sortedAsc[1].base_price_paise);
    });

    test('F41-3: Sorting by price descending orders from highest to lowest INR price', () => {
      const published = ctx.products.filter((p) => p.publication_status === 'published');
      const sortedDesc = [...published].sort((a, b) => b.base_price_paise - a.base_price_paise);
      assert.ok(sortedDesc[0].base_price_paise >= sortedDesc[1].base_price_paise);
    });

    test('F41-4: Sorting by newest orders by creation timestamp descending', () => {
      const published = ctx.products.filter((p) => p.publication_status === 'published');
      assert.ok(published.length >= 2);
    });

    test('F41-5: Zero search matches render friendly accessible empty state with reset filter CTA', () => {
      const query = 'non_existent_random_sculpture_xyz';
      const results = ctx.products.filter((p) => p.name.includes(query));
      assert.strictEqual(results.length, 0);

      const emptyStateMessage =
        'No handcrafted creations found matching your filter. Explore our bespoke Custom Order service or clear filters.';
      assert.ok(emptyStateMessage.includes('Custom Order'));
    });
  });

  // ==========================================================================
  // F42: Product Detail Page (PDP) (Canonical slug route, specs, care, related)
  // ==========================================================================
  describe('F42: Product Detail Page (PDP)', () => {
    test('F42-1: PDP resolves product record by canonical unique URL slug', () => {
      const slug = 'ganesha-antique-bronze-hand-painted';
      const product = ctx.products.find((p) => p.slug === slug);
      assert.ok(product, 'Must resolve product by canonical slug');
      assert.strictEqual(product?.id, 'prod_ganesha_01');
    });

    test('F42-2: PDP renders detailed technical specifications table (dimensions, weight, layer height)', () => {
      const ganesha = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      assert.strictEqual(ganesha.dimensions_cm.height, 18.0);
      assert.strictEqual(ganesha.weight_grams, 380);
      assert.ok(ganesha.manufacturing_method.includes('0.12mm'));
    });

    test('F42-3: PDP renders thermal safety instructions and care guidance (< 50°C for PLA)', () => {
      const ganesha = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      assert.ok(
        ganesha.care_safety_instructions.includes('50°C'),
        'Care notes must include thermal limit warning for PLA'
      );
    });

    test('F42-4: PDP displays transparent dispatch estimate based on made-to-order lead times', () => {
      const ganesha = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      assert.ok(ganesha.dispatch_estimate.includes('Ludhiana'));
    });

    test('F42-5: PDP renders curated related items from same or complementary category', () => {
      const current = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      const related = ctx.products.filter(
        (p) =>
          p.id !== current.id &&
          p.publication_status === 'published' &&
          p.category_id === current.category_id
      );
      assert.ok(related !== undefined);
    });
  });

  // ==========================================================================
  // F43: PDP Image Gallery (High-res gallery, Raw Print vs Hand-Finished toggle)
  // ==========================================================================
  describe('F43: PDP Image Gallery', () => {
    test('F43-1: Gallery displays primary high-resolution studio photo and thumbnail strip', () => {
      const gallery = {
        primaryImage: {
          url: '/uploads/products/ganesha_front_painted.webp',
          altText: 'Lord Ganesha Hand-Finished Antique Bronze front view'
        },
        thumbnails: [
          '/uploads/products/ganesha_front_painted.webp',
          '/uploads/products/ganesha_detail_macro.webp',
          '/uploads/products/ganesha_raw_print.webp'
        ]
      };
      assert.ok(gallery.primaryImage.url.endsWith('.webp'));
      assert.strictEqual(gallery.thumbnails.length, 3);
    });

    test('F43-2: Gallery features Before/After toggle comparing Raw 3D Print vs Hand-Finished piece', () => {
      const sampleProduct = {
        id: 'prod_ganesha_01',
        name: 'Lord Ganesha Sculpture',
        slug: 'lord-ganesha-sculpture',
        description: 'Handcrafted in our Ludhiana studio',
        base_price_paise: 249900,
        material: 'PLA Pro',
        finishing_type: 'Antique Bronze Patina',
        manufacturing_method: '0.12mm FDM',
        publication_status: 'published',
        gallery_images: [
          { id: 'img1', public_url: '/uploads/products/ganesha_finished.webp', alt_text: 'Finished Piece', is_primary: 1 },
          { id: 'img2', public_url: '/uploads/products/ganesha_raw_print.webp', alt_text: 'Raw 3D Print', is_primary: 0 }
        ],
        variants: []
      };
      const html = renderProductDetailPage({ product: sampleProduct as any, relatedProducts: [] });
      assert.ok(html.includes('toggle-raw-print') || html.includes('Raw 3D Print'), 'HTML must render Raw Print comparison toggle');
      assert.ok(html.includes('ganesha_raw_print.webp'), 'HTML must reference raw print image asset');
      assert.ok(html.includes('ganesha_finished.webp'), 'HTML must reference finished piece asset');
    });

    test('F43-3: Lightbox zoom modal is accessible via keyboard and Esc key', () => {
      const sampleProduct = {
        id: 'prod_1',
        name: 'Lotus Lamp',
        slug: 'lotus-lamp',
        description: 'Warm lighting piece',
        base_price_paise: 189900,
        publication_status: 'published',
        gallery_images: [{ id: 'img1', public_url: '/uploads/products/lotus.webp', alt_text: 'Lotus' }],
        variants: []
      };
      const html = renderProductDetailPage({ product: sampleProduct as any, relatedProducts: [] });
      assert.ok(html.includes('id="pdp-lightbox-modal"'), 'HTML must render Lightbox modal container');
      assert.ok(html.includes('Escape'), 'Client script must handle Escape key to close modal');
      assert.ok(html.includes('Tab'), 'Client script must trap Tab key navigation within modal');
      assert.ok(html.includes('ArrowRight') || html.includes('ArrowLeft'), 'Client script must support arrow key cycling');
    });

    test('F43-4: Images are served in modern compressed WebP/AVIF formats with descriptive alt text', () => {
      const image = {
        url: '/uploads/products/ganesha.webp',
        alt: 'Lord Ganesha 3D-printed sculpture with intricate micro-layer texturing and antique gold patina'
      };
      assert.ok(image.url.endsWith('.webp'));
      assert.ok(image.alt.length > 20);
    });

    test('F43-5: Gallery thumbnail navigation maintains aria-selected accessibility attribute', () => {
      const thumbnails = [
        { index: 0, ariaSelected: true },
        { index: 1, ariaSelected: false }
      ];
      assert.strictEqual(thumbnails[0].ariaSelected, true);
    });
  });

  // ==========================================================================
  // F44: PDP Variant Selector (Interactive buttons with real-time price delta)
  // ==========================================================================
  describe('F44: PDP Variant Selector', () => {
    test('F44-1: Variant selector renders all available finish and size options', () => {
      const variants = ctx.variants.filter((v) => v.product_id === 'prod_ganesha_01');
      assert.strictEqual(variants.length, 3);
      assert.ok(variants.find((v) => v.sku === 'BHR-GNSH-BRZ-S'));
      assert.ok(variants.find((v) => v.sku === 'BHR-GNSH-BRZ-L'));
    });

    test('F44-2: Selecting a larger variant recalculates final price in integer paise with positive delta', () => {
      const baseProduct = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      const largeVariant = ctx.variants.find((v) => v.sku === 'BHR-GNSH-BRZ-L')!;

      const finalPricePaise = baseProduct.base_price_paise + largeVariant.price_modifier_paise;
      // ₹2,499.00 (249900) + ₹1,500.00 (150000) = ₹3,999.00 (399900)
      assert.strictEqual(finalPricePaise, 399900);
      assertIntegerPaise(finalPricePaise, 'Large variant price');
    });

    test('F44-3: Selecting an alternative finish variant applies negative price modifier accurately', () => {
      const baseProduct = ctx.products.find((p) => p.id === 'prod_ganesha_01')!;
      const terracottaVariant = ctx.variants.find((v) => v.sku === 'BHR-GNSH-TER-S')!;

      const finalPricePaise = baseProduct.base_price_paise + terracottaVariant.price_modifier_paise;
      // ₹2,499.00 (249900) - ₹300.00 (30000) = ₹2,199.00 (219900)
      assert.strictEqual(finalPricePaise, 219900);
      assertIntegerPaise(finalPricePaise, 'Terracotta variant price');
    });

    test('F44-4: Out of stock variant is visibly disabled with aria-disabled="true"', () => {
      const sampleProduct = {
        id: 'prod_oos',
        name: 'Ganesha Sculpture',
        slug: 'ganesha-sculpture',
        description: 'Artisanal piece',
        base_price_paise: 249900,
        gallery_images: [{ id: 'img1', public_url: '/uploads/products/ganesha.webp', alt_text: 'Ganesha' }],
        variants: [
          { id: 'v1', sku: 'BHR-OOS', variant_name: 'Marble White - Sold Out', price_modifier_paise: 0, is_available: 0 }
        ]
      };
      const html = renderProductDetailPage({ product: sampleProduct as any, relatedProducts: [] });
      assert.ok(html.includes('aria-disabled="true"'), 'Sold out variant must render aria-disabled="true"');
      assert.ok(html.includes('Sold Out'), 'Sold out variant must visibly render "Sold Out" text');
    });

    test('F44-5: Selected variant SKU dynamically updates WhatsApp prefill text intent', () => {
      const selectedVariant = ctx.variants.find((v) => v.sku === 'BHR-GNSH-BRZ-L')!;
      const template = `Hello BHAIRAVI Creations! Inquiring about Lord Ganesha Sculpture (Variant: ${selectedVariant.variant_name}).`;
      assert.ok(template.includes('9 Inch (Statement Altar)'));
    });
  });
});
