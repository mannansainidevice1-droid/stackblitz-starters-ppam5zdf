-- ============================================================================
-- BHAIRAVI CREATIONS - 001_initial_schema.sql
-- 11 Core Normalized Domain Tables, Referential Integrity & Indexes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Categories Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ----------------------------------------------------------------------------
-- 2. Core Products Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    tags TEXT NOT NULL DEFAULT '[]',
    base_price_paise INTEGER NOT NULL CHECK(base_price_paise = CAST(base_price_paise AS INTEGER) AND base_price_paise >= 0),
    currency TEXT NOT NULL DEFAULT 'INR' CHECK(currency = 'INR'),
    is_made_to_order INTEGER NOT NULL DEFAULT 1 CHECK(is_made_to_order IN (0, 1)),
    inventory_count INTEGER NOT NULL DEFAULT 0 CHECK(inventory_count >= 0),
    production_lead_days TEXT NOT NULL DEFAULT '3-5 business days',
    material TEXT NOT NULL,
    dimensions_cm TEXT NOT NULL DEFAULT '{}',
    weight_grams INTEGER NOT NULL DEFAULT 350 CHECK(weight_grams > 0),
    manufacturing_method TEXT NOT NULL,
    finishing_type TEXT NOT NULL,
    customisation_options TEXT NOT NULL DEFAULT '[]',
    care_safety_instructions TEXT NOT NULL,
    dispatch_estimate TEXT NOT NULL DEFAULT 'Dispatched in 3-5 days from Ludhiana, Punjab',
    amazon_url TEXT,
    amazon_asin TEXT,
    whatsapp_config TEXT NOT NULL DEFAULT '{}',
    publication_status TEXT NOT NULL DEFAULT 'draft' CHECK(publication_status IN ('draft', 'published', 'archived')),
    is_featured INTEGER NOT NULL DEFAULT 0 CHECK(is_featured IN (0, 1)),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ----------------------------------------------------------------------------
-- 3. Product Images Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    alt_text TEXT NOT NULL,
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
    display_order INTEGER NOT NULL DEFAULT 0,
    file_size_bytes INTEGER NOT NULL CHECK(file_size_bytes > 0),
    mime_type TEXT NOT NULL CHECK(mime_type IN ('image/webp', 'image/jpeg', 'image/png')),
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ----------------------------------------------------------------------------
-- 4. Product Variants Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL UNIQUE,
    variant_name TEXT NOT NULL,
    price_modifier_paise INTEGER NOT NULL DEFAULT 0 CHECK(price_modifier_paise = CAST(price_modifier_paise AS INTEGER)),
    dimensions_cm TEXT DEFAULT '{}',
    color_finish TEXT,
    is_available INTEGER NOT NULL DEFAULT 1 CHECK(is_available IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ----------------------------------------------------------------------------
-- 5. Customer Enquiries & Custom Orders Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT NOT NULL,
    preferred_contact_method TEXT NOT NULL DEFAULT 'whatsapp' CHECK(preferred_contact_method IN ('whatsapp', 'phone', 'email')),
    project_type TEXT NOT NULL CHECK(project_type IN ('custom_figurine', 'architectural_model', 'lithophane', 'corporate_gifting', 'replacement_part', 'other')),
    design_description TEXT NOT NULL,
    approximate_quantity INTEGER NOT NULL DEFAULT 1 CHECK(approximate_quantity >= 1),
    budget_range_inr TEXT,
    referenced_product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'quoted', 'converted', 'closed')),
    ip_hash TEXT NOT NULL,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ----------------------------------------------------------------------------
-- 6. Enquiry Attachments Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiry_attachments (
    id TEXT PRIMARY KEY,
    enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL CHECK(file_size_bytes > 0),
    mime_type TEXT NOT NULL,
    file_sha256 TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ----------------------------------------------------------------------------
-- 7. Admin Users Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('superadmin', 'admin', 'viewer')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
    failed_login_attempts INTEGER NOT NULL DEFAULT 0 CHECK(failed_login_attempts >= 0),
    locked_until TEXT,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ----------------------------------------------------------------------------
-- 8. Enquiry Timeline & Internal Notes Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiry_timeline (
    id TEXT PRIMARY KEY,
    enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
    admin_user_id TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK(action_type IN ('status_change', 'internal_note', 'contact_logged', 'quote_sent')),
    previous_status TEXT CHECK(previous_status IS NULL OR previous_status IN ('new', 'contacted', 'quoted', 'converted', 'closed')),
    new_status TEXT CHECK(new_status IS NULL OR new_status IN ('new', 'contacted', 'quoted', 'converted', 'closed')),
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ----------------------------------------------------------------------------
-- 9. Admin Sessions Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY, -- SHA-256 hash of raw session token
    admin_user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    user_agent TEXT,
    ip_hash TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ----------------------------------------------------------------------------
-- 10. Audit Logs Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    changes_json TEXT,
    ip_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ----------------------------------------------------------------------------
-- 11. System Settings & Site Content Controls Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ----------------------------------------------------------------------------
-- Performance & Search Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(publication_status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(base_price_paise);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_enquiries_phone ON enquiries(contact_phone);
CREATE INDEX IF NOT EXISTS idx_enquiry_attachments_enquiry ON enquiry_attachments(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_timeline_enquiry ON enquiry_timeline(enquiry_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(admin_user_id, created_at);
