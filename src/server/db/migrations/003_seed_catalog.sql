-- ============================================================================
-- BHAIRAVI CREATIONS - INITIAL SEED DATASET (003_seed_catalog.sql)
-- Categories, Authentic 3D-Printed Artisanal Catalog, Settings & Initial Admin
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SEED PRODUCT CATEGORIES (5 Core Categories)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO categories (id, slug, name, description, display_order, is_active) VALUES
(
    'cat_spiritual_deities',
    'spiritual-deities',
    'Spiritual & Sacred Deities',
    'Sacred Indian idols and spiritual motifs, 3D printed with micron-level precision and hand-embellished with traditional bronze, terracotta, and gold leaf finishes.',
    1,
    1
),
(
    'cat_home_decor',
    'home-decor',
    'Artisanal Home Decor',
    'Contemporary geometric accents, sculptural lighting, lithophane light fixtures, and wall panels combining additive design with handcrafted textures.',
    2,
    1
),
(
    'cat_planters_vases',
    'planters-vases',
    'Parametric Planters & Vases',
    'Architectural fluted planters, self-watering vessels, and organic form vases engineered from biodegradable biopolymers and finished with earthy stonewash patinas.',
    3,
    1
),
(
    'cat_architectural_models',
    'architectural-models',
    'Heritage & Architectural Replicas',
    'Meticulously researched scale replicas of ancient Indian temple architecture, haveli jharokhas, and iconic monuments with realistic weathered stone finishes.',
    4,
    1
),
(
    'cat_customized_gifts',
    'customized-gifts',
    'Customized Commissions & Keepsakes',
    'Bespoke 3D printed personal gifts, commemorative lithophanes, personalized desk organizers, and corporate trophies handcrafted to custom specifications.',
    5,
    1
);

-- ----------------------------------------------------------------------------
-- 2. SEED INITIAL SUPERADMIN USER
-- Default temporary credentials: username 'bhairavi_admin' / password 'ChangeMeImmediately123!'
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO admin_users (
    id,
    username,
    email,
    password_hash,
    role,
    is_active,
    failed_login_attempts
) VALUES (
    'usr_admin_00000000-0000-4000-8000-000000000001',
    'bhairavi_admin',
    'admin@bhairavicreations.com',
    '620cc4dd593fc09d407bec29a0717ebf2e59e60117d2a6a89aae53b01a6394a4',
    'superadmin',
    1,
    0
);

-- ----------------------------------------------------------------------------
-- 3. SEED SYSTEM SETTINGS & SITE CONTENT CONTROLS
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO system_settings (key, value, description, updated_by) VALUES
(
    'brand.hero_headline',
    'Thoughtfully created. Precisely printed. Finished by hand.',
    'Primary storefront hero statement (editable draft copy)',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'brand.hero_subheading',
    'Bridging modern 3D additive precision with traditional Indian hand-painted craftsmanship in our family-run Ludhiana studio.',
    'Secondary storefront hero tagline',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'brand.story_snippet',
    'Founded in Ludhiana, BHAIRAVI Creations began with a single 3D printer and a vision to merge precision additive manufacturing with heritage Indian art. Each creation is meticulously modeled, printed in biodegradable polymers, and individually hand-finished by our studio artisans.',
    'Storefront About Us introductory snippet',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'brand.craft_journey_steps',
    '[{"step": 1, "title": "Parametric 3D Modeling", "description": "Custom digital sculpting and structural optimization."}, {"step": 2, "title": "Additive Printing", "description": "0.12mm micro-layer deposition using premium biodegradable PLA+ and photopolymer resin."}, {"step": 3, "title": "Surface Smoothing", "description": "Triple-stage progressive wet sanding to eliminate layer seams."}, {"step": 4, "title": "Artisanal Finishing", "description": "Hand-painted acrylic patinas, metallic dry brushing, and UV protective sealing."}]',
    'The 4-stage craft journey narrative',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'whatsapp.business_phone',
    '919876543210',
    'Official WhatsApp business phone number (Indian E.164 without plus)',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'whatsapp.default_prefill',
    'Hello BHAIRAVI Creations! I am interested in inquiring about your handcrafted 3D printed collections.',
    'Default general enquiry message template',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'amazon.storefront_url',
    'https://www.amazon.in/shops/bhairavicreations',
    'Official Amazon India merchant storefront URL',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'store.default_currency',
    'INR',
    'Standard store currency',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'store.default_market',
    'India',
    'Primary operational market',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'store.dispatch_lead_days',
    '3-5 business days',
    'Standard production and dispatch turnaround',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'store.support_email',
    'contact@bhairavicreations.com',
    'Customer service email address',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'store.support_phone',
    '+91 98765 43210',
    'Customer service telephone helpline',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'store.studio_address',
    'BHAIRAVI Creations Studio, Model Town, Ludhiana, Punjab 141002, India',
    'Physical studio address',
    'usr_admin_00000000-0000-4000-8000-000000000001'
),
(
    'analytics.retention_days',
    '180',
    'Raw analytics event retention period in days',
    'usr_admin_00000000-0000-4000-8000-000000000001'
);

-- ----------------------------------------------------------------------------
-- 4. SEED AUTHENTIC 3D-PRINTED ARTISANAL PRODUCTS (10 Core Products)
-- ----------------------------------------------------------------------------

-- PRODUCT 1: Vighnaharta Ganesha in Antique Bronze Patina
INSERT OR IGNORE INTO products (
    id, slug, name, description, category_id, tags,
    base_price_paise, currency, is_made_to_order, inventory_count,
    production_lead_days, material, dimensions_cm, weight_grams,
    manufacturing_method, finishing_type, customisation_options,
    care_safety_instructions, dispatch_estimate,
    amazon_url, amazon_asin, whatsapp_config, publication_status,
    is_featured, display_order
) VALUES (
    'prod_00000000-0000-4000-8000-000000000001',
    'ganesha-antique-bronze-patina',
    'Vighnaharta Ganesha in Antique Bronze Patina',
    'An exquisite contemporary idol of Lord Ganesha, combining sacred iconography with modern additive precision. 3D printed with ultra-fine 0.12mm layers in eco-friendly biopolymer, triple wet-sanded, and individually hand-painted with an antique bronze patina and subtle copper dry-brush highlights.',
    'cat_spiritual_deities',
    '["handmade finishing", "customisation", "multi-colour printing", "eco-friendly pla", "spiritual art"]',
    189900, 'INR', 1, 5,
    '3-5 business days',
    'High-Density Biodegradable PLA+ & Cold-Cast Bronze Primer',
    '{"length": 12.0, "width": 9.5, "height": 18.0}', 380,
    '0.12mm Ultra-Fine FDM Additive Layering',
    'Triple wet-sanded, acrylic antique bronze patina wash, matte protective lacquer seal',
    '[{"id": "opt_engraving", "name": "Custom Base Engraving (Name/Mantra)", "type": "text", "price_modifier_paise": 20000, "max_characters": 30}]',
    'Keep away from direct heat sources above 50°C. Clean gently with a dry or lightly dampened microfiber cloth. Do not use abrasive chemical cleaners.',
    'Dispatched in 3-5 days via Bluedart/Delhivery Express from Ludhiana',
    'https://www.amazon.in/dp/B09GNSH01A', 'B09GNSH01A',
    '{"prefill_template": "Hello BHAIRAVI Creations! I am inquiring about the Vighnaharta Ganesha in Antique Bronze Patina (₹1,899). Could you share details on current availability?"}',
    'published', 1, 1
);

-- PRODUCT 2: Dhyana Shiva Meditative Bust
INSERT OR IGNORE INTO products (
    id, slug, name, description, category_id, tags,
    base_price_paise, currency, is_made_to_order, inventory_count,
    production_lead_days, material, dimensions_cm, weight_grams,
    manufacturing_method, finishing_type, customisation_options,
    care_safety_instructions, dispatch_estimate,
    amazon_url, amazon_asin, whatsapp_config, publication_status,
    is_featured, display_order
) VALUES (
    'prod_00000000-0000-4000-8000-000000000002',
    'dhyana-shiva-meditative-bust',
    'Dhyana Shiva Meditative Bust with Cold-Cast Patina',
    'A serene sculpture capturing Lord Shiva in deep dhyana meditation. Engineered with structural honeycomb infill for balanced heft, coated in cold-cast marble resin, and hand-finished with an obsidian matte wash and silver crescent moon detailing.',
    'cat_spiritual_deities',
    '["handmade finishing", "customisation", "cold-cast resin", "spiritual art"]',
    249900, 'INR', 1, 3,
    '4-6 business days',
    'High-Density PLA+ Core with Cold-Cast Marble Resin Coating',
    '{"length": 14.0, "width": 11.0, "height": 22.0}', 520,
    '0.12mm FDM Additive Precision Core',
    'Cold-cast resin immersion, hand-rubbed obsidian wash, silver leaf accents',
    '[{"id": "opt_crescent", "name": "Moon Accent Finish", "type": "choice", "choices": ["Silver Leaf", "Gold Patina"], "price_modifier_paise": 0}]',
    'Indoor decorative use only. Dust lightly with a soft brush. Keep away from prolonged intense direct sunlight.',
    'Dispatched in 4-6 days from Ludhiana studio',
    'https://www.amazon.in/dp/B09SHV02B', 'B09SHV02B',
    '{"prefill_template": "Hello BHAIRAVI Creations! I would like to order the Dhyana Shiva Meditative Bust (₹2,499). Please let me know the custom dispatch timeline."}',
    'published', 1, 2
);

-- PRODUCT 3: Mandir Architectural Jali Wall Art Panel
INSERT OR IGNORE INTO products (
    id, slug, name, description, category_id, tags,
    base_price_paise, currency, is_made_to_order, inventory_count,
    production_lead_days, material, dimensions_cm, weight_grams,
    manufacturing_method, finishing_type, customisation_options,
    care_safety_instructions, dispatch_estimate,
    amazon_url, amazon_asin, whatsapp_config, publication_status,
    is_featured, display_order
) VALUES (
    'prod_00000000-0000-4000-8000-000000000003',
    'mandir-architectural-jali-wall-art',
    'Mandir Sacred Geometry Architectural Jali Panel',
    'Intricate geometric lattice inspired by traditional Indian temple screens and haveli jali windows. Perfectly suited as a puja room backdrop or backlit feature panel. Precision printed in matte alabaster biopolymer with hand-gilded antique gold border trims.',
    'cat_spiritual_deities',
    '["handmade finishing", "multi-colour printing", "customisation", "wall art"]',
    149900, 'INR', 1, 8,
    '3-5 business days',
    'Biodegradable Matte PLA with Hand-Applied Gold Leaf Edging',
    '{"length": 25.0, "width": 25.0, "height": 1.8}', 310,
    'High-Precision FDM 0.16mm Layer Matrix',
    'Hand-sanded edge beveling, antique gold acrylic leafing, satin sealant',
    '[{"id": "opt_mounting", "name": "Wall Mounting Brackets Included", "type": "boolean", "price_modifier_paise": 0}]',
    'Wipe with dry cloth only. Suitable for indoor sacred spaces and living rooms.',
    'Dispatched in 3-5 business days from Ludhiana',
    'https://www.amazon.in/dp/B09JAL03C', 'B09JAL03C',
    '{"prefill_template": "Hello BHAIRAVI Creations! I am interested in the Mandir Sacred Geometry Jali Panel (₹1,499). Can this be customized to specific dimensions?"}',
    'published', 1, 3
);

-- PRODUCT 4: Radha Krishna Divine Flute Lithophane Ambient Lamp
INSERT OR IGNORE INTO products (
    id, slug, name, description, category_id, tags,
    base_price_paise, currency, is_made_to_order, inventory_count,
    production_lead_days, material, dimensions_cm, weight_grams,
    manufacturing_method, finishing_type, customisation_options,
    care_safety_instructions, dispatch_estimate,
    amazon_url, amazon_asin, whatsapp_config, publication_status,
    is_featured, display_order
) VALUES (
    'prod_00000000-0000-4000-8000-000000000004',
    'radha-krishna-lithophane-ambient-lamp',
    'Radha Krishna Divine Flute Lithophane Ambient Lamp',
    'An ethereal curved lithophane night lamp that transforms when illuminated. Printed in translucent photopolymer with varying micron thicknesses to create intricate photographic shading. Mounted on a handcrafted faux-teakwood base with warm 3000K LED illumination.',
    'cat_home_decor',
    '["handmade finishing", "customisation", "lithophane", "warm lighting"]',
    219900, 'INR', 1, 4,
    '3-5 business days',
    'Optical Translucent Resin with Wood-Composite Base',
    '{"length": 13.0, "width": 13.0, "height": 20.0}', 440,
    '8K SLA High-Resolution Photopolymer Additive Printing',
    'Alcohol wash, UV chamber cure, hand-oiled teakwood base finish',
    '[{"id": "opt_cord", "name": "Power Connector Type", "type": "choice", "choices": ["USB-C Cable", "5V Wall Adapter"], "price_modifier_paise": 0}]',
    'Use only supplied 5V USB power adapter. Keep away from water. Clean lithophane curved shade with microfiber cloth.',
    'Dispatched in 3-5 days from Ludhiana',
    'https://www.amazon.in/dp/B09LIT04D', 'B09LIT04D',
    '{"prefill_template": "Hello BHAIRAVI Creations! I would like to inquire about the Radha Krishna Lithophane Lamp (₹2,199). Does it include the warm LED light source?"}',
    'published', 1, 4
);

-- PRODUCT 5: Parametric Fibonacci Spiral Lotus Planter
INSERT OR IGNORE INTO products (
    id, slug, name, description, category_id, tags,
    base_price_paise, currency, is_made_to_order, inventory_count,
    production_lead_days, material, dimensions_cm, weight_grams,
    manufacturing_method, finishing_type, customisation_options,
    care_safety_instructions, dispatch_estimate,
    amazon_url, amazon_asin, whatsapp_config, publication_status,
    is_featured, display_order
) VALUES (
    'prod_00000000-0000-4000-8000-000000000005',
    'fibonacci-spiral-lotus-planter',
    'Parametric Fibonacci Spiral Lotus Planter with Drainage Tray',
    'A modern geometric planter designed using mathematical Fibonacci spiral curves mimicking opening lotus petals. Features a hidden twist-lock water drainage reservoir to prevent over-watering indoor succulents. Finished in an earthy terracotta wash.',
    'cat_planters_vases',
    '["handmade finishing", "parametric design", "biodegradable pla", "drainage tray"]',
    129900, 'INR', 1, 12,
    '2-4 business days',
    'Recycled Matte PLA+ with Concealed Twist-Lock Drainage Tray',
    '{"length": 16.0, "width": 16.0, "height": 14.0}', 260,
    'FDM Additive Printing with 4-Perimeter Watertight Shell',
    'Hand-sanded matte surface treatment, terracotta mineral wash',
    '[{"id": "opt_drain", "name": "Drainage Hole Configuration", "type": "choice", "choices": ["Internal Drainage with Tray", "Sealed Indoor Cachepot"], "price_modifier_paise": 0}]',
    'Ideal for succulents, cacti, and small indoor flora. Wash with lukewarm water. Do not expose to temperatures above 50°C.',
    'Dispatched in 2-4 days from Ludhiana studio',
    'https://www.amazon.in/dp/B09PLT05E', 'B09PLT05E',
    '{"prefill_template": "Hello BHAIRAVI Creations! I am interested in ordering the Fibonacci Spiral Lotus Planter (₹1,299). Please confirm color options."}',
    'published', 1, 5
);

-- PRODUCT 6: Fluted Minimalist Scandi-Indian Bud Vase
INSERT OR IGNORE INTO products (
    id, slug, name, description, category_id, tags,
    base_price_paise, currency, is_made_to_order, inventory_count,
    production_lead_days, material, dimensions_cm, weight_grams,
    manufacturing_method, finishing_type, customisation_options,
    care_safety_instructions, dispatch_estimate,
    amazon_url, amazon_asin, whatsapp_config, publication_status,
    is_featured, display_order
) VALUES (
    'prod_00000000-0000-4000-8000-000000000006',
    'fluted-minimalist-scandi-bud-vase',
    'Fluted Artisanal Bud Vase with Waterproof Resin Coating',
    'Minimalist fluted vase blending Scandinavian clean lines with Indian warm earth tones. Engineered with an internal hand-poured liquid epoxy barrier ensuring 100% watertight capability for fresh botanicals.',
    'cat_planters_vases',
    '["handmade finishing", "waterproof coated", "minimalist", "home styling"]',
    89900, 'INR', 1, 15,
    '2-3 business days',
    'Matte Stone PLA with Internal Waterproof Epoxy Seal',
    '{"length": 9.0, "width": 9.0, "height": 19.0}', 180,
    'Vase-Mode Continuous Extrusion with Reinforced Base',
    'Liquid epoxy interior waterproofing, exterior satin stone hand-buffing',
    '[{"id": "opt_color", "name": "Exterior Tone", "type": "choice", "choices": ["Alabaster White", "Warm Ochre Rust", "Sage Green"], "price_modifier_paise": 0}]',
    'Suitable for fresh cut stems with water or dried floral arrangements. Hand wash interior with cool water.',
    'Dispatched in 2-3 business days from Ludhiana',
    'https://www.amazon.in/dp/B09VAS06F', 'B09VAS06F',
    '{"prefill_template": "Hello BHAIRAVI Creations! I want to enquire about the Fluted Artisanal Bud Vase (₹899). Are the internal seals safe for fresh flowers with water?"}',
    'published', 0, 6
);

-- PRODUCT 7: Konark Sun Temple Wheel Replica
INSERT OR IGNORE INTO products (
    id, slug, name, description, category_id, tags,
    base_price_paise, currency, is_made_to_order, inventory_count,
    production_lead_days, material, dimensions_cm, weight_grams,
    manufacturing_method, finishing_type, customisation_options,
    care_safety_instructions, dispatch_estimate,
    amazon_url, amazon_asin, whatsapp_config, publication_status,
    is_featured, display_order
) VALUES (
    'prod_00000000-0000-4000-8000-000000000007',
    'konark-sun-temple-wheel-replica',
    'Konark Sun Temple Surya Chakra Heritage Scale Replica',
    'A museum-grade miniature recreation of the iconic 13th-century Konark Sun Temple wheel (sundial). Captures all 8 major spokes and 8 minor spokes with carved beadings and medallion friezes. Finished with an authentic hand-rubbed weathered sandstone patina.',
    'cat_architectural_models',
    '["handmade finishing", "architectural model", "heritage replica", "high detail"]',
    349900, 'INR', 1, 2,
    '5-7 business days',
    'Composite Mineral PLA+ with Weathered Sandstone Patina',
    '{"length": 22.0, "width": 6.5, "height": 24.5}', 680,
    'High-Density 0.12mm FDM with Multi-Part Precision Assembly',
    'Hand-textured rock face, multi-layer iron ochre weathering, matte rock sealant',
    '[{"id": "opt_plaque", "name": "Custom Brass Information Plaque", "type": "text", "price_modifier_paise": 25000, "max_characters": 50}]',
    'High-detail collectible model. Handle by the reinforced base mount. Dust with a dry makeup brush.',
    'Dispatched in 5-7 days from Ludhiana studio',
    'https://www.amazon.in/dp/B09KNK07G', 'B09KNK07G',
    '{"prefill_template": "Hello BHAIRAVI Creations! I am deeply interested in the Konark Sun Temple Surya Chakra Replica (₹3,499). Could you share close-up photos of the sandstone finish?"}',
    'published', 1, 7
);

-- PRODUCT 8: Rajasthani Haveli Jharokha Miniature Wall Shrine
INSERT OR IGNORE INTO products (
    id, slug, name, description, category_id, tags,
    base_price_paise, currency, is_made_to_order, inventory_count,
    production_lead_days, material, dimensions_cm, weight_grams,
    manufacturing_method, finishing_type, customisation_options,
    care_safety_instructions, dispatch_estimate,
    amazon_url, amazon_asin, whatsapp_config, publication_status,
    is_featured, display_order
) VALUES (
    'prod_00000000-0000-4000-8000-000000000008',
    'rajasthani-haveli-jharokha-frame',
    'Intricate Rajasthani Haveli Jharokha Miniature Wall Shrine',
    'Scale architectural model of an ornate Rajput haveli overhanging balcony (jharokha). Features carved pillars, cusped arches, and a recessed alcove for sacred photos or small deity idols. Printed in real wood-fiber biopolymer that can be stained and carved.',
    'cat_architectural_models',
    '["handmade finishing", "customisation", "heritage replica", "wood-fill pla"]',
    279900, 'INR', 1, 3,
    '4-6 business days',
    'Wood-Fill Bio-Composite (30% Recycled Pine Wood Fiber, 70% PLA)',
    '{"length": 18.0, "width": 5.0, "height": 26.0}', 490,
    '0.16mm Layer Extrusion with Real Wood Fiber Texture',
    'Hand-sanded grain exposure, dark walnut oil stain, antique brass latch accents',
    '[{"id": "opt_stain", "name": "Wood Stain Finish", "type": "choice", "choices": ["Antique Walnut", "Golden Teak", "Distressed White Wash"], "price_modifier_paise": 0}]',
    'Real wood-fill composite. Keep away from humid bathrooms or damp walls. Clean with wood furniture polish.',
    'Dispatched in 4-6 business days from Ludhiana',
    'https://www.amazon.in/dp/B09JHR08H', 'B09JHR08H',
    '{"prefill_template": "Hello BHAIRAVI Creations! I want to enquire about the Rajasthani Haveli Jharokha Miniature (₹2,799). What is the maximum size deity photo that fits in the alcove?"}',
    'published', 0, 8
);

-- PRODUCT 9: Custom 360 Photo Lithophane Night Lamp (Bespoke Commission)
INSERT OR IGNORE INTO products (
    id, slug, name, description, category_id, tags,
    base_price_paise, currency, is_made_to_order, inventory_count,
    production_lead_days, material, dimensions_cm, weight_grams,
    manufacturing_method, finishing_type, customisation_options,
    care_safety_instructions, dispatch_estimate,
    amazon_url, amazon_asin, whatsapp_config, publication_status,
    is_featured, display_order
) VALUES (
    'prod_00000000-0000-4000-8000-000000000009',
    'cylindrical-360-photo-lithophane-lamp',
    'Custom 360 Panoramic Memory Photo Lithophane Lamp',
    'A fully personalized commemorative cylinder lamp customized with your personal family photos or wedding portraits. Translucent high-precision polymer reveals high-definition monochrome photographic memories when the internal lamp is switched on.',
    'cat_customized_gifts',
    '["handmade finishing", "customisation", "personalized gift", "lithophane"]',
    199900, 'INR', 1, 0,
    '4-6 business days',
    'Optical Translucent Resin Shade with Solid Handcrafted Wooden Base',
    '{"length": 11.5, "width": 11.5, "height": 17.5}', 360,
    'High-Resolution Stereolithography Additive Manufacturing',
    'Digital CAD photograph projection, ultrasonic resin wash, hand-turned wooden base',
    '[{"id": "opt_photos", "name": "Upload 3-4 High Resolution Photos", "type": "file_upload", "price_modifier_paise": 0}, {"id": "opt_cordless", "name": "Rechargeable Cordless Battery Base", "type": "boolean", "price_modifier_paise": 45000}]',
    'Includes USB cable and warm 5V LED lamp. Clean acrylic cylindrical shade with soft dry cloth.',
    'Custom printed and dispatched in 4-6 business days from Ludhiana',
    NULL, NULL,
    '{"prefill_template": "Hello BHAIRAVI Creations! I want to order a Custom 360 Panoramic Lithophane Lamp (₹1,999) with my family photographs. How can I share high-resolution images?"}',
    'published', 1, 9
);

-- PRODUCT 10: Geometric Modular Desk Organizer & Card Dock
INSERT OR IGNORE INTO products (
    id, slug, name, description, category_id, tags,
    base_price_paise, currency, is_made_to_order, inventory_count,
    production_lead_days, material, dimensions_cm, weight_grams,
    manufacturing_method, finishing_type, customisation_options,
    care_safety_instructions, dispatch_estimate,
    amazon_url, amazon_asin, whatsapp_config, publication_status,
    is_featured, display_order
) VALUES (
    'prod_00000000-0000-4000-8000-000000000010',
    'geometric-desk-sculpture-card-dock',
    'Parametric Multi-Compartment Artisanal Desk Sculpture & Visiting Card Dock',
    'Sculptural desk organizer featuring angular faceted compartments for fountain pens, smartphone dock with charging cable pass-through, and business card slots. Weighted with internal mineral core and lined with protective felt base pads.',
    'cat_customized_gifts',
    '["handmade finishing", "customisation", "corporate gifting", "matte finish"]',
    119900, 'INR', 1, 10,
    '2-4 business days',
    'High-Density Matte Biopolymer with Internal Mineral Ballast & Felt Footing',
    '{"length": 17.0, "width": 10.0, "height": 7.5}', 290,
    'High-Infill FDM with Chamfered Wall Structure',
    'Hand-beveled edges, textured stone matte finish, precision adhesive felt installation',
    '[{"id": "opt_corp_logo", "name": "Corporate Logo Debossing", "type": "text", "price_modifier_paise": 15000, "max_characters": 25}]',
    'Clean with dry cloth. Weighted base keeps smartphone stable during one-handed use.',
    'Dispatched in 2-4 days from Ludhiana studio',
    'https://www.amazon.in/dp/B09DSK10J', 'B09DSK10J',
    '{"prefill_template": "Hello BHAIRAVI Creations! I am inquiring about bulk corporate ordering for the Parametric Desk Sculpture (₹1,199). Could you provide a quotation for 50 units with custom logo debossing?"}',
    'published', 0, 10
);

-- ----------------------------------------------------------------------------
-- 5. SEED PRODUCT VARIANTS (SKUs with Price Deltas)
-- ----------------------------------------------------------------------------

-- Product 1 Variants (Ganesha)
INSERT OR IGNORE INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise, dimensions_cm, color_finish, is_available) VALUES
('var_01_brz_6in', 'prod_00000000-0000-4000-8000-000000000001', 'BHR-GNS-BRZ-6IN', '6-inch Antique Bronze Patina', 0, '{"length": 12.0, "width": 9.5, "height": 18.0}', 'Antique Bronze', 1),
('var_01_brz_8in', 'prod_00000000-0000-4000-8000-000000000001', 'BHR-GNS-BRZ-8IN', '8-inch Antique Bronze Patina (Large)', 60000, '{"length": 15.0, "width": 12.0, "height": 23.0}', 'Antique Bronze', 1),
('var_01_ter_6in', 'prod_00000000-0000-4000-8000-000000000001', 'BHR-GNS-TER-6IN', '6-inch Terracotta Heritage Wash', -10000, '{"length": 12.0, "width": 9.5, "height": 18.0}', 'Terracotta Wash', 1);

-- Product 2 Variants (Shiva)
INSERT OR IGNORE INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise, dimensions_cm, color_finish, is_available) VALUES
('var_02_obs_std', 'prod_00000000-0000-4000-8000-000000000002', 'BHR-SHV-OBS-STD', 'Standard Obsidian Charcoal Finish', 0, '{"length": 14.0, "width": 11.0, "height": 22.0}', 'Obsidian Charcoal', 1),
('var_02_mrb_std', 'prod_00000000-0000-4000-8000-000000000002', 'BHR-SHV-MRB-STD', 'Cold-Cast White Marble Patina', 50000, '{"length": 14.0, "width": 11.0, "height": 22.0}', 'Cold-Cast Marble', 1);

-- Product 4 Variants (Radha Krishna Lamp)
INSERT OR IGNORE INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise, dimensions_cm, color_finish, is_available) VALUES
('var_04_wrm_std', 'prod_00000000-0000-4000-8000-000000000004', 'BHR-LMP-WRM-STD', 'Warm White 3000K LED with Teakwood Base', 0, '{"length": 13.0, "width": 13.0, "height": 20.0}', 'Warm 3000K', 1),
('var_04_dim_std', 'prod_00000000-0000-4000-8000-000000000004', 'BHR-LMP-DIM-STD', 'Dimmable Dual-Tone LED (Warm / Natural)', 30000, '{"length": 13.0, "width": 13.0, "height": 20.0}', 'Dual-Tone Dimmable', 1);

-- Product 5 Variants (Lotus Planter)
INSERT OR IGNORE INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise, dimensions_cm, color_finish, is_available) VALUES
('var_05_ter_med', 'prod_00000000-0000-4000-8000-000000000005', 'BHR-PLT-TER-MED', 'Terracotta Matte Sand (Medium 16cm)', 0, '{"length": 16.0, "width": 16.0, "height": 14.0}', 'Terracotta Sand', 1),
('var_05_slt_med', 'prod_00000000-0000-4000-8000-000000000005', 'BHR-PLT-SLT-MED', 'Slate Grey Stone Wash (Medium 16cm)', 0, '{"length": 16.0, "width": 16.0, "height": 14.0}', 'Slate Grey', 1),
('var_05_ter_lrg', 'prod_00000000-0000-4000-8000-000000000005', 'BHR-PLT-TER-LRG', 'Terracotta Matte Sand (Large 21cm)', 50000, '{"length": 21.0, "width": 21.0, "height": 18.5}', 'Terracotta Sand', 1);

-- Product 7 Variants (Konark Wheel)
INSERT OR IGNORE INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise, dimensions_cm, color_finish, is_available) VALUES
('var_07_snd_std', 'prod_00000000-0000-4000-8000-000000000007', 'BHR-KNR-SND-STD', 'Weathered Sandstone Patina (24cm)', 0, '{"length": 22.0, "width": 6.5, "height": 24.5}', 'Weathered Sandstone', 1),
('var_07_brz_std', 'prod_00000000-0000-4000-8000-000000000007', 'BHR-KNR-BRZ-STD', 'Museum Bronze Patina (24cm)', 40000, '{"length": 22.0, "width": 6.5, "height": 24.5}', 'Museum Bronze', 1);

-- Product 9 Variants (Custom 360 Lamp)
INSERT OR IGNORE INTO product_variants (id, product_id, sku, variant_name, price_modifier_paise, dimensions_cm, color_finish, is_available) VALUES
('var_09_usb_std', 'prod_00000000-0000-4000-8000-000000000009', 'BHR-CST-LMP-USB', 'Standard USB-Powered Warm Light', 0, '{"length": 11.5, "width": 11.5, "height": 17.5}', 'Warm Light (USB)', 1),
('var_09_bat_std', 'prod_00000000-0000-4000-8000-000000000009', 'BHR-CST-LMP-BAT', 'Rechargeable Battery Powered Cordless Base', 45000, '{"length": 11.5, "width": 11.5, "height": 17.5}', 'Cordless Battery', 1);

-- ----------------------------------------------------------------------------
-- 6. SEED PRODUCT IMAGES (Accessible Gallery Records)
-- ----------------------------------------------------------------------------

INSERT OR IGNORE INTO product_images (id, product_id, storage_path, public_url, alt_text, is_primary, display_order, file_size_bytes, mime_type) VALUES
('img_01_primary', 'prod_00000000-0000-4000-8000-000000000001', 'storage/uploads/products/ganesha_bronze_front.webp', '/uploads/products/ganesha_bronze_front.webp', 'Vighnaharta Ganesha in Antique Bronze Patina showing intricate ornaments and hand-painted copper highlights', 1, 1, 142800, 'image/webp'),
('img_01_detail', 'prod_00000000-0000-4000-8000-000000000001', 'storage/uploads/products/ganesha_bronze_macro.webp', '/uploads/products/ganesha_bronze_macro.webp', 'Macro close-up of Ganesha idol showing smooth 0.12mm layer transitions and wet-sanded artisanal patina', 0, 2, 168400, 'image/webp'),

('img_02_primary', 'prod_00000000-0000-4000-8000-000000000002', 'storage/uploads/products/shiva_dhyana_front.webp', '/uploads/products/shiva_dhyana_front.webp', 'Dhyana Shiva Meditative Bust in obsidian charcoal finish with hand-detailed silver crescent moon', 1, 1, 154200, 'image/webp'),

('img_03_primary', 'prod_00000000-0000-4000-8000-000000000003', 'storage/uploads/products/mandir_jali_panel.webp', '/uploads/products/mandir_jali_panel.webp', 'Mandir architectural jali lattice wall panel with hand-gilded antique gold border trims', 1, 1, 198500, 'image/webp'),

('img_04_primary', 'prod_00000000-0000-4000-8000-000000000004', 'storage/uploads/products/radha_krishna_lamp_lit.webp', '/uploads/products/radha_krishna_lamp_lit.webp', 'Radha Krishna lithophane night lamp illuminated with warm 3000K LED light revealing delicate photographic details', 1, 1, 215400, 'image/webp'),

('img_05_primary', 'prod_00000000-0000-4000-8000-000000000005', 'storage/uploads/products/lotus_planter_terracotta.webp', '/uploads/products/lotus_planter_terracotta.webp', 'Fibonacci spiral lotus planter in terracotta mineral finish with succulent arrangement', 1, 1, 187600, 'image/webp'),

('img_06_primary', 'prod_00000000-0000-4000-8000-000000000006', 'storage/uploads/products/fluted_bud_vase.webp', '/uploads/products/fluted_bud_vase.webp', 'Fluted minimalist bud vase in alabaster white with fresh botanicals', 1, 1, 134200, 'image/webp'),

('img_07_primary', 'prod_00000000-0000-4000-8000-000000000007', 'storage/uploads/products/konark_wheel_model.webp', '/uploads/products/konark_wheel_model.webp', 'Konark Sun Temple wheel replica showing 16 spokes and weathered sandstone finish', 1, 1, 246800, 'image/webp'),

('img_08_primary', 'prod_00000000-0000-4000-8000-000000000008', 'storage/uploads/products/haveli_jharokha_wood.webp', '/uploads/products/haveli_jharokha_wood.webp', 'Rajasthani haveli jharokha miniature wall shrine in wood-fill composite with dark walnut finish', 1, 1, 221000, 'image/webp'),

('img_09_primary', 'prod_00000000-0000-4000-8000-000000000009', 'storage/uploads/products/custom_360_lithophane.webp', '/uploads/products/custom_360_lithophane.webp', 'Custom 360-degree cylindrical lithophane lamp showcasing personalized customer portraits', 1, 1, 230500, 'image/webp'),

('img_10_primary', 'prod_00000000-0000-4000-8000-000000000010', 'storage/uploads/products/desk_organizer_gray.webp', '/uploads/products/desk_organizer_gray.webp', 'Parametric desk organizer and smartphone dock in industrial charcoal finish', 1, 1, 167300, 'image/webp');
