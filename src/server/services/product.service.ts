/**
 * BHAIRAVI Creations Digital Platform
 * Product Management Service & Relational Lifecycle
 * Target: src/server/services/product.service.ts
 */

import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { formatPaiseToInr, paiseToRupees } from '../../shared/pricing.js';
import { PublicationStatus } from '../../shared/types.js';

export interface CreateProductInput {
  name: string;
  slug?: string;
  description: string;
  category_id: string;
  tags?: string[] | string;
  base_price_paise: number;
  currency?: 'INR';
  is_made_to_order?: number;
  inventory_count?: number;
  production_lead_days?: string;
  material: string;
  dimensions_cm?: { length: number; width: number; height: number } | string;
  weight_grams?: number;
  manufacturing_method: string;
  finishing_type: string;
  customisation_options?: any[] | string;
  care_safety_instructions?: string;
  dispatch_estimate?: string;
  amazon_url?: string | null;
  amazon_asin?: string | null;
  whatsapp_config?: { prefill_template: string } | string;
  publication_status?: PublicationStatus;
  is_featured?: number;
  display_order?: number;
  variants?: Array<{
    sku: string;
    variant_name: string;
    price_modifier_paise?: number;
    dimensions_cm?: any;
    color_finish?: string | null;
    is_available?: number;
  }>;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

export class ProductService {
  constructor(private db: Database.Database) {}

  /**
   * Generates or normalizes a kebab-case URL slug.
   */
  public normalizeSlug(rawNameOrSlug: string): string {
    return rawNameOrSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }

  /**
   * Ensures slug uniqueness by appending a suffix if needed.
   */
  private ensureUniqueSlug(slug: string, excludeId?: string): string {
    let candidate = slug;
    let counter = 1;
    while (true) {
      const stmt = this.db.prepare(
        `SELECT id FROM products WHERE slug = ? ${excludeId ? 'AND id != ?' : ''}`
      );
      const row = excludeId ? stmt.get(candidate, excludeId) : stmt.get(candidate);
      if (!row) return candidate;
      candidate = `${slug}-${counter++}`;
    }
  }

  /**
   * Admin: List products with filtering and pagination.
   */
  public listAdminProducts(params: {
    status?: string;
    category_id?: string;
    search?: string;
    is_featured?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const sqlParams: any[] = [];

    if (params.status && params.status !== 'all') {
      conditions.push('p.publication_status = ?');
      sqlParams.push(params.status);
    }
    if (params.category_id) {
      conditions.push('p.category_id = ?');
      sqlParams.push(params.category_id);
    }
    if (params.is_featured !== undefined) {
      conditions.push('p.is_featured = ?');
      sqlParams.push(params.is_featured);
    }
    if (params.search) {
      conditions.push('(p.name LIKE ? OR p.slug LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)');
      const term = `%${params.search}%`;
      sqlParams.push(term, term, term, term);
    }

    const whereClause = conditions.join(' AND ');

    // Total count
    const countRow = this.db.prepare(`SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`).get(...sqlParams) as any;
    const totalItems = countRow ? countRow.total : 0;

    // Sorting
    const allowedSortFields: Record<string, string> = {
      display_order: 'p.display_order',
      base_price_paise: 'p.base_price_paise',
      created_at: 'p.created_at',
      name: 'p.name'
    };
    const sortField = allowedSortFields[params.sort_by || 'display_order'] || 'p.display_order';
    const sortOrder = (params.sort_order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const itemsQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) as variant_count,
        (SELECT json_object('id', id, 'public_url', public_url, 'alt_text', alt_text) 
         FROM product_images pi 
         WHERE pi.product_id = p.id 
         ORDER BY pi.is_primary DESC, pi.display_order ASC LIMIT 1) as primary_image_json
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const rows = this.db.prepare(itemsQuery).all(...sqlParams, limit, offset) as any[];

    const data = rows.map((r) => ({
      ...r,
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags,
      dimensions_cm: typeof r.dimensions_cm === 'string' ? JSON.parse(r.dimensions_cm) : r.dimensions_cm,
      customisation_options: typeof r.customisation_options === 'string' ? JSON.parse(r.customisation_options) : r.customisation_options,
      whatsapp_config: typeof r.whatsapp_config === 'string' ? JSON.parse(r.whatsapp_config) : r.whatsapp_config,
      formatted_price: formatPaiseToInr(r.base_price_paise),
      primary_image: r.primary_image_json ? JSON.parse(r.primary_image_json) : null
    }));

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / limit) || 1
      }
    };
  }

  /**
   * Public: List only published products with filtering and sorting.
   */
  public listPublicProducts(params: {
    category?: string;
    tag?: string;
    search?: string;
    sort?: string;
    is_featured?: number;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(48, Math.max(1, params.limit || 12));
    const offset = (page - 1) * limit;

    const conditions: string[] = ["p.publication_status = 'published'"];
    const sqlParams: any[] = [];

    if (params.category) {
      conditions.push('(c.slug = ? OR c.id = ?)');
      sqlParams.push(params.category, params.category);
    }
    if (params.tag) {
      conditions.push("p.tags LIKE ?");
      sqlParams.push(`%"${params.tag}"%`);
    }
    if (params.is_featured !== undefined) {
      conditions.push('p.is_featured = ?');
      sqlParams.push(params.is_featured);
    }
    if (params.search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)');
      const term = `%${params.search}%`;
      sqlParams.push(term, term, term);
    }

    const whereClause = conditions.join(' AND ');

    const countRow = this.db.prepare(`
      SELECT COUNT(*) as total 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE ${whereClause}
    `).get(...sqlParams) as any;
    const totalItems = countRow ? countRow.total : 0;

    let orderBy = 'p.display_order ASC, p.created_at DESC, p.id ASC';
    if (params.sort === 'price_asc') {
      orderBy = 'p.base_price_paise ASC, p.display_order ASC, p.id ASC';
    } else if (params.sort === 'price_desc') {
      orderBy = 'p.base_price_paise DESC, p.display_order ASC, p.id ASC';
    } else if (params.sort === 'newest') {
      orderBy = 'p.created_at DESC, p.display_order ASC, p.id ASC';
    } else if (params.sort === 'popularity' || params.sort === 'featured') {
      orderBy = 'p.is_featured DESC, p.display_order ASC, p.id ASC';
    }

    const itemsQuery = `
      SELECT 
        p.id,
        p.slug,
        p.name,
        p.description,
        p.tags,
        p.base_price_paise,
        p.currency,
        p.is_made_to_order,
        p.inventory_count,
        p.production_lead_days,
        p.material,
        p.is_featured,
        p.display_order,
        p.created_at,
        c.slug as category_slug,
        c.name as category_name,
        (SELECT json_object('public_url', public_url, 'alt_text', alt_text) 
         FROM product_images pi 
         WHERE pi.product_id = p.id 
         ORDER BY pi.is_primary DESC, pi.display_order ASC LIMIT 1) as primary_image_json,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_available = 1) as active_variant_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const rows = this.db.prepare(itemsQuery).all(...sqlParams, limit, offset) as any[];

    const data = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      category: {
        slug: r.category_slug,
        name: r.category_name
      },
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags,
      base_price_paise: r.base_price_paise,
      formatted_price: formatPaiseToInr(r.base_price_paise),
      currency: r.currency,
      is_made_to_order: r.is_made_to_order,
      material: r.material,
      primary_image: r.primary_image_json ? JSON.parse(r.primary_image_json) : null,
      has_variants: r.active_variant_count > 0,
      is_featured: r.is_featured
    }));

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / limit) || 1
      }
    };
  }

  /**
   * Get product by ID (Admin full view).
   */
  public getProductById(id: string) {
    const product = this.db.prepare(`
      SELECT p.*, c.slug as category_slug, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id) as any;

    if (!product) return null;

    const images = this.db.prepare(`
      SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC
    `).all(id) as any[];

    const variants = this.db.prepare(`
      SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC
    `).all(id) as any[];

    const formattedVariants = variants.map((v) => {
      const effectivePaise = product.base_price_paise + v.price_modifier_paise;
      return {
        ...v,
        dimensions_cm: v.dimensions_cm ? JSON.parse(v.dimensions_cm) : {},
        effective_price_paise: effectivePaise,
        formatted_price: formatPaiseToInr(effectivePaise)
      };
    });

    return {
      ...product,
      category: {
        id: product.category_id,
        slug: product.category_slug,
        name: product.category_name
      },
      tags: typeof product.tags === 'string' ? JSON.parse(product.tags) : product.tags,
      dimensions_cm: typeof product.dimensions_cm === 'string' ? JSON.parse(product.dimensions_cm) : product.dimensions_cm,
      customisation_options: typeof product.customisation_options === 'string' ? JSON.parse(product.customisation_options) : product.customisation_options,
      whatsapp_config: typeof product.whatsapp_config === 'string' ? JSON.parse(product.whatsapp_config) : product.whatsapp_config,
      formatted_price: formatPaiseToInr(product.base_price_paise),
      images,
      variants: formattedVariants
    };
  }

  /**
   * Public: Get published product detail by slug.
   */
  public getPublishedProductBySlug(slug: string) {
    const product = this.db.prepare(`
      SELECT p.*, c.slug as category_slug, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.publication_status = 'published'
    `).get(slug) as any;

    if (!product) return null;

    const images = this.db.prepare(`
      SELECT public_url, alt_text, is_primary, display_order
      FROM product_images 
      WHERE product_id = ? 
      ORDER BY is_primary DESC, display_order ASC
    `).all(product.id) as any[];

    const variants = this.db.prepare(`
      SELECT id, sku, variant_name, price_modifier_paise, dimensions_cm, color_finish, is_available
      FROM product_variants 
      WHERE product_id = ? AND is_available = 1 
      ORDER BY id ASC
    `).all(product.id) as any[];

    const formattedVariants = variants.map((v) => {
      const effectivePaise = product.base_price_paise + v.price_modifier_paise;
      const deltaPaise = v.price_modifier_paise;
      let deltaFormatted = '₹0';
      if (deltaPaise > 0) deltaFormatted = `+₹${paiseToRupees(deltaPaise)}`;
      else if (deltaPaise < 0) deltaFormatted = `-₹${paiseToRupees(Math.abs(deltaPaise))}`;

      return {
        id: v.id,
        sku: v.sku,
        variant_name: v.variant_name,
        price_modifier_paise: v.price_modifier_paise,
        effective_price_paise: effectivePaise,
        formatted_price: formatPaiseToInr(effectivePaise),
        formatted_delta: deltaFormatted,
        color_finish: v.color_finish,
        dimensions_cm: v.dimensions_cm ? JSON.parse(v.dimensions_cm) : {}
      };
    });

    // Commerce Action URLs
    const waConfig = typeof product.whatsapp_config === 'string' ? JSON.parse(product.whatsapp_config) : product.whatsapp_config;
    const cleanPhone = (process.env.WHATSAPP_BUSINESS_NUMBER || '919876543210').replace(/\D/g, '');
    const prefillMsg = waConfig?.prefill_template || `Hello BHAIRAVI Creations! I am inquiring about the ${product.name} (${formatPaiseToInr(product.base_price_paise)}).`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(prefillMsg)}`;

    let amazonUrl = product.amazon_url;
    if (amazonUrl && process.env.AMAZON_ASSOCIATE_TAG) {
      const tag = process.env.AMAZON_ASSOCIATE_TAG;
      amazonUrl = amazonUrl.includes('?') ? `${amazonUrl}&tag=${tag}&ref=bhairavi_web` : `${amazonUrl}?tag=${tag}&ref=bhairavi_web`;
    }

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: {
        slug: product.category_slug,
        name: product.category_name
      },
      tags: typeof product.tags === 'string' ? JSON.parse(product.tags) : product.tags,
      base_price_paise: product.base_price_paise,
      formatted_price: formatPaiseToInr(product.base_price_paise),
      currency: product.currency,
      is_made_to_order: product.is_made_to_order,
      inventory_count: product.inventory_count,
      production_lead_days: product.production_lead_days,
      material: product.material,
      dimensions_cm: typeof product.dimensions_cm === 'string' ? JSON.parse(product.dimensions_cm) : product.dimensions_cm,
      weight_grams: product.weight_grams,
      manufacturing_method: product.manufacturing_method,
      finishing_type: product.finishing_type,
      care_safety_instructions: product.care_safety_instructions,
      dispatch_estimate: product.dispatch_estimate,
      customisation_options: typeof product.customisation_options === 'string' ? JSON.parse(product.customisation_options) : product.customisation_options,
      gallery_images: images,
      variants: formattedVariants,
      commerce_actions: {
        amazon_url: amazonUrl,
        amazon_asin: product.amazon_asin,
        whatsapp_url: whatsappUrl
      }
    };
  }

  /**
   * Create a new product with variants inside an atomic transaction.
   */
  public createProduct(input: CreateProductInput, adminUserId?: string) {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Product name is required');
    }

    if (input.base_price_paise === undefined || input.base_price_paise === null || input.base_price_paise < 0 || !Number.isInteger(input.base_price_paise)) {
      throw new Error('Product base_price_paise must be a non-negative integer');
    }

    // Verify category exists
    const category = this.db.prepare('SELECT id FROM categories WHERE id = ?').get(input.category_id);
    if (!category) {
      throw new Error(`Category not found: '${input.category_id}'`);
    }

    // Normalize or auto-generate slug
    const rawSlug = input.slug && input.slug.trim().length > 0 ? input.slug : input.name;
    const baseSlug = this.normalizeSlug(rawSlug);
    const finalSlug = this.ensureUniqueSlug(baseSlug);

    const productId = 'prod_' + crypto.randomUUID();
    const tagsJson = Array.isArray(input.tags) ? JSON.stringify(input.tags) : (typeof input.tags === 'string' ? input.tags : '[]');
    const dimensionsJson = typeof input.dimensions_cm === 'object' ? JSON.stringify(input.dimensions_cm) : (input.dimensions_cm || '{}');
    const customisationJson = Array.isArray(input.customisation_options) ? JSON.stringify(input.customisation_options) : (input.customisation_options || '[]');
    const waJson = typeof input.whatsapp_config === 'object' ? JSON.stringify(input.whatsapp_config) : (input.whatsapp_config || '{}');

    const insertProductStmt = this.db.prepare(`
      INSERT INTO products (
        id, slug, name, description, category_id, tags, base_price_paise, currency,
        is_made_to_order, inventory_count, production_lead_days, material, dimensions_cm,
        weight_grams, manufacturing_method, finishing_type, customisation_options,
        care_safety_instructions, dispatch_estimate, amazon_url, amazon_asin,
        whatsapp_config, publication_status, is_featured, display_order,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);

    const insertVariantStmt = this.db.prepare(`
      INSERT INTO product_variants (
        id, product_id, sku, variant_name, price_modifier_paise, dimensions_cm, color_finish, is_available,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const insertAuditStmt = this.db.prepare(`
      INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id, changes_json)
      VALUES (?, ?, 'product.create', 'product', ?, ?)
    `);

    // Execute atomic transaction
    const transaction = this.db.transaction(() => {
      insertProductStmt.run(
        productId,
        finalSlug,
        input.name.trim(),
        input.description || '',
        input.category_id,
        tagsJson,
        input.base_price_paise,
        'INR',
        input.is_made_to_order ?? 1,
        input.inventory_count ?? 0,
        input.production_lead_days ?? '3-5 business days',
        input.material || 'PLA+',
        dimensionsJson,
        input.weight_grams ?? 350,
        input.manufacturing_method || 'FDM 0.12mm',
        input.finishing_type || 'Hand-finished',
        customisationJson,
        input.care_safety_instructions || 'Keep away from direct heat sources.',
        input.dispatch_estimate || 'Dispatched in 3-5 days from Ludhiana, Punjab',
        input.amazon_url ?? null,
        input.amazon_asin ?? null,
        waJson,
        input.publication_status ?? 'draft',
        input.is_featured ?? 0,
        input.display_order ?? 0
      );

      // Insert variants if provided
      if (input.variants && Array.isArray(input.variants)) {
        for (const v of input.variants) {
          const varId = 'var_' + crypto.randomUUID();
          const varDims = typeof v.dimensions_cm === 'object' ? JSON.stringify(v.dimensions_cm) : (v.dimensions_cm || '{}');
          const modifier = v.price_modifier_paise ?? 0;
          if (input.base_price_paise + modifier < 0) {
            throw new Error(`Variant effective price cannot be negative: sku '${v.sku}'`);
          }
          insertVariantStmt.run(
            varId,
            productId,
            v.sku,
            v.variant_name,
            modifier,
            varDims,
            v.color_finish ?? null,
            v.is_available ?? 1
          );
        }
      }

      insertAuditStmt.run(
        'audit_' + crypto.randomUUID(),
        adminUserId ?? null,
        productId,
        JSON.stringify({ name: input.name, slug: finalSlug, price: input.base_price_paise })
      );
    });

    transaction();

    return {
      success: true,
      message: 'Product created successfully',
      data: {
        id: productId,
        slug: finalSlug,
        publication_status: input.publication_status ?? 'draft'
      }
    };
  }

  /**
   * Update an existing product.
   */
  public updateProduct(id: string, input: UpdateProductInput, adminUserId?: string) {
    const existing = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!existing) {
      throw new Error(`Product not found: '${id}'`);
    }

    if (input.base_price_paise !== undefined) {
      if (input.base_price_paise < 0 || !Number.isInteger(input.base_price_paise)) {
        throw new Error('base_price_paise must be a non-negative integer');
      }
    }

    let updatedSlug = existing.slug;
    if (input.slug && input.slug !== existing.slug) {
      const normalized = this.normalizeSlug(input.slug);
      updatedSlug = this.ensureUniqueSlug(normalized, id);
    }

    if (input.category_id && input.category_id !== existing.category_id) {
      const cat = this.db.prepare('SELECT id FROM categories WHERE id = ?').get(input.category_id);
      if (!cat) throw new Error(`Category not found: '${input.category_id}'`);
    }

    const name = input.name !== undefined ? input.name.trim() : existing.name;
    const description = input.description !== undefined ? input.description : existing.description;
    const category_id = input.category_id !== undefined ? input.category_id : existing.category_id;
    const base_price_paise = input.base_price_paise !== undefined ? input.base_price_paise : existing.base_price_paise;
    const is_made_to_order = input.is_made_to_order !== undefined ? input.is_made_to_order : existing.is_made_to_order;
    const inventory_count = input.inventory_count !== undefined ? input.inventory_count : existing.inventory_count;
    const production_lead_days = input.production_lead_days !== undefined ? input.production_lead_days : existing.production_lead_days;
    const material = input.material !== undefined ? input.material : existing.material;
    const weight_grams = input.weight_grams !== undefined ? input.weight_grams : existing.weight_grams;
    const manufacturing_method = input.manufacturing_method !== undefined ? input.manufacturing_method : existing.manufacturing_method;
    const finishing_type = input.finishing_type !== undefined ? input.finishing_type : existing.finishing_type;
    const care_safety_instructions = input.care_safety_instructions !== undefined ? input.care_safety_instructions : existing.care_safety_instructions;
    const dispatch_estimate = input.dispatch_estimate !== undefined ? input.dispatch_estimate : existing.dispatch_estimate;
    const amazon_url = input.amazon_url !== undefined ? input.amazon_url : existing.amazon_url;
    const amazon_asin = input.amazon_asin !== undefined ? input.amazon_asin : existing.amazon_asin;
    const publication_status = input.publication_status !== undefined ? input.publication_status : existing.publication_status;
    const is_featured = input.is_featured !== undefined ? input.is_featured : existing.is_featured;
    const display_order = input.display_order !== undefined ? input.display_order : existing.display_order;

    const tagsJson = input.tags !== undefined ? (Array.isArray(input.tags) ? JSON.stringify(input.tags) : input.tags) : existing.tags;
    const dimensionsJson = input.dimensions_cm !== undefined ? (typeof input.dimensions_cm === 'object' ? JSON.stringify(input.dimensions_cm) : input.dimensions_cm) : existing.dimensions_cm;
    const customisationJson = input.customisation_options !== undefined ? (Array.isArray(input.customisation_options) ? JSON.stringify(input.customisation_options) : input.customisation_options) : existing.customisation_options;
    const waJson = input.whatsapp_config !== undefined ? (typeof input.whatsapp_config === 'object' ? JSON.stringify(input.whatsapp_config) : input.whatsapp_config) : existing.whatsapp_config;

    const updateStmt = this.db.prepare(`
      UPDATE products SET
        slug = ?, name = ?, description = ?, category_id = ?, tags = ?, base_price_paise = ?,
        is_made_to_order = ?, inventory_count = ?, production_lead_days = ?, material = ?,
        dimensions_cm = ?, weight_grams = ?, manufacturing_method = ?, finishing_type = ?,
        customisation_options = ?, care_safety_instructions = ?, dispatch_estimate = ?,
        amazon_url = ?, amazon_asin = ?, whatsapp_config = ?, publication_status = ?,
        is_featured = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const insertAuditStmt = this.db.prepare(`
      INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id, changes_json)
      VALUES (?, ?, 'product.update', 'product', ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      updateStmt.run(
        updatedSlug, name, description, category_id, tagsJson, base_price_paise,
        is_made_to_order, inventory_count, production_lead_days, material,
        dimensionsJson, weight_grams, manufacturing_method, finishing_type,
        customisationJson, care_safety_instructions, dispatch_estimate,
        amazon_url, amazon_asin, waJson, publication_status,
        is_featured, display_order, id
      );

      insertAuditStmt.run(
        'audit_' + crypto.randomUUID(),
        adminUserId ?? null,
        id,
        JSON.stringify({ before: { name: existing.name, price: existing.base_price_paise }, after: { name, price: base_price_paise } })
      );
    });

    transaction();

    return {
      success: true,
      message: 'Product updated successfully',
      data: { id, slug: updatedSlug, base_price_paise }
    };
  }

  /**
   * Delete product and clean up associated image files from disk.
   */
  public deleteProduct(id: string, adminUserId?: string) {
    const existing = this.db.prepare('SELECT id, name FROM products WHERE id = ?').get(id) as any;
    if (!existing) {
      throw new Error(`Product not found: '${id}'`);
    }

    // Unlink image files from disk
    const images = this.db.prepare('SELECT storage_path FROM product_images WHERE product_id = ?').all(id) as any[];
    for (const img of images) {
      if (img.storage_path && fs.existsSync(img.storage_path)) {
        try {
          fs.unlinkSync(img.storage_path);
        } catch {
          // ignore unlink error
        }
      }
    }

    const transaction = this.db.transaction(() => {
      this.db.prepare('DELETE FROM products WHERE id = ?').run(id);

      this.db.prepare(`
        INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id, changes_json)
        VALUES (?, ?, 'product.delete', 'product', ?, ?)
      `).run('audit_' + crypto.randomUUID(), adminUserId ?? null, id, JSON.stringify({ name: existing.name }));
    });

    transaction();

    return { success: true, message: 'Product and associated assets deleted successfully' };
  }

  /**
   * Transition publication status.
   */
  public setPublicationStatus(id: string, status: PublicationStatus, adminUserId?: string) {
    if (status !== 'draft' && status !== 'published' && status !== 'archived') {
      throw new Error(`Invalid publication status: '${status}'`);
    }

    const existing = this.db.prepare('SELECT id, publication_status FROM products WHERE id = ?').get(id) as any;
    if (!existing) throw new Error(`Product not found: '${id}'`);

    const prev = existing.publication_status;
    this.db.prepare('UPDATE products SET publication_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

    this.db.prepare(`
      INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id, changes_json)
      VALUES (?, ?, 'product.status_change', 'product', ?, ?)
    `).run('audit_' + crypto.randomUUID(), adminUserId ?? null, id, JSON.stringify({ from: prev, to: status }));

    return {
      success: true,
      product_id: id,
      previous_status: prev,
      new_status: status
    };
  }

  /**
   * Toggle featured flag.
   */
  public setFeatured(id: string, isFeatured: number) {
    const flag = isFeatured ? 1 : 0;
    const result = this.db.prepare('UPDATE products SET is_featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(flag, id);
    if (result.changes === 0) throw new Error(`Product not found: '${id}'`);
    return { success: true, product_id: id, is_featured: flag };
  }

  /**
   * Update made-to-order & inventory availability.
   */
  public setAvailability(id: string, availability: { is_made_to_order?: number; inventory_count?: number; production_lead_days?: string }) {
    const existing = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!existing) throw new Error(`Product not found: '${id}'`);

    const isMadeToOrder = availability.is_made_to_order !== undefined ? (availability.is_made_to_order ? 1 : 0) : existing.is_made_to_order;
    const inventoryCount = availability.inventory_count !== undefined ? Math.max(0, availability.inventory_count) : existing.inventory_count;
    const leadDays = availability.production_lead_days !== undefined ? availability.production_lead_days : existing.production_lead_days;

    this.db.prepare(`
      UPDATE products 
      SET is_made_to_order = ?, inventory_count = ?, production_lead_days = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(isMadeToOrder, inventoryCount, leadDays, id);

    return {
      success: true,
      product_id: id,
      is_made_to_order: isMadeToOrder,
      inventory_count: inventoryCount,
      production_lead_days: leadDays
    };
  }

  /**
   * Associate an uploaded image record with a product.
   */
  public addProductImage(
    productId: string,
    imageData: {
      storagePath: string;
      publicUrl: string;
      altText?: string;
      isPrimary?: number;
      displayOrder?: number;
      fileSizeBytes: number;
      mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    }
  ) {
    const product = this.db.prepare('SELECT id, name FROM products WHERE id = ?').get(productId) as any;
    if (!product) throw new Error(`Product not found: '${productId}'`);

    const imageId = 'img_' + crypto.randomUUID();
    const isPrimary = imageData.isPrimary ? 1 : 0;
    const altText = imageData.altText || product.name;

    const transaction = this.db.transaction(() => {
      if (isPrimary === 1) {
        this.db.prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?').run(productId);
      }

      let order = imageData.displayOrder;
      if (order === undefined) {
        const maxOrderRow = this.db.prepare('SELECT MAX(display_order) as max_order FROM product_images WHERE product_id = ?').get(productId) as any;
        order = (maxOrderRow?.max_order ?? 0) + 1;
      }

      this.db.prepare(`
        INSERT INTO product_images (
          id, product_id, storage_path, public_url, alt_text, is_primary, display_order, file_size_bytes, mime_type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        imageId, productId, imageData.storagePath, imageData.publicUrl, altText, isPrimary, order, imageData.fileSizeBytes, imageData.mimeType
      );
    });

    transaction();

    return {
      success: true,
      data: {
        id: imageId,
        product_id: productId,
        public_url: imageData.publicUrl,
        alt_text: altText,
        is_primary: isPrimary
      }
    };
  }

  /**
   * Delete a product image.
   */
  public deleteProductImage(productId: string, imageId: string) {
    const img = this.db.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?').get(imageId, productId) as any;
    if (!img) throw new Error(`Product image not found: '${imageId}'`);

    if (img.storage_path && fs.existsSync(img.storage_path)) {
      try {
        fs.unlinkSync(img.storage_path);
      } catch {}
    }

    const transaction = this.db.transaction(() => {
      this.db.prepare('DELETE FROM product_images WHERE id = ?').run(imageId);

      // If deleted image was primary, promote lowest display_order image
      if (img.is_primary === 1) {
        const nextImg = this.db.prepare('SELECT id FROM product_images WHERE product_id = ? ORDER BY display_order ASC LIMIT 1').get(productId) as any;
        if (nextImg) {
          this.db.prepare('UPDATE product_images SET is_primary = 1 WHERE id = ?').run(nextImg.id);
        }
      }
    });

    transaction();

    return { success: true, message: 'Image deleted successfully' };
  }

  /**
   * Set primary image for a product.
   */
  public setPrimaryImage(productId: string, imageId: string) {
    const img = this.db.prepare('SELECT id FROM product_images WHERE id = ? AND product_id = ?').get(imageId, productId);
    if (!img) throw new Error(`Product image not found: '${imageId}'`);

    const transaction = this.db.transaction(() => {
      this.db.prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?').run(productId);
      this.db.prepare('UPDATE product_images SET is_primary = 1 WHERE id = ?').run(imageId);
    });

    transaction();

    return { success: true, product_id: productId, primary_image_id: imageId };
  }
}
