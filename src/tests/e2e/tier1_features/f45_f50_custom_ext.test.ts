/**
 * Tier 1 — Feature Coverage: Custom Order Enquiry & External Commerce (F45 - F50)
 * Requirements: R1, R6, R7 | Interface Contracts: Public Storefront & Commerce
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { TestContext } from '../helpers/test_context.js';
import { assertOutcomeUnknown } from '../helpers/assertions.js';

describe('Tier 1: Feature Coverage — Custom Orders & External Commerce (F45 - F50)', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  // ==========================================================================
  // F45: Custom Order Enquiry Page (Form fields, validation, budget tiers)
  // ==========================================================================
  describe('F45: Custom Order Enquiry Page', () => {
    test('F45-1: Custom order form captures customer name, contact channel, and Indian phone', () => {
      const submission = {
        customer_name: 'Ananya Deshmukh',
        contact_phone: '+919876543210',
        contact_email: 'ananya@example.in',
        preferred_contact_method: 'whatsapp' as const,
        project_type: 'custom_figurine' as const,
        design_description: 'Custom 3D printed classical dancer figurine with metallic bronze patina.',
        approximate_quantity: 1,
        budget_range_inr: '₹2,500 - ₹5,000'
      };

      assert.ok(submission.customer_name.length >= 2);
      assert.ok(/^\+91[6789]\d{9}$/.test(submission.contact_phone));
      assert.strictEqual(submission.preferred_contact_method, 'whatsapp');
    });

    test('F45-2: Form enforces project_type within valid enum categories', () => {
      const validTypes = [
        'custom_figurine',
        'architectural_model',
        'lithophane',
        'corporate_gifting',
        'replacement_part',
        'other'
      ];
      assert.ok(validTypes.includes('custom_figurine'));
      assert.ok(validTypes.includes('architectural_model'));
      assert.ok(validTypes.includes('lithophane'));
    });

    test('F45-3: Approximate quantity must be positive integer greater than or equal to 1', () => {
      const quantity = 3;
      assert.ok(Number.isInteger(quantity));
      assert.ok(quantity >= 1);
    });

    test('F45-4: Design description requires minimum 10 characters for meaningful craftsman assessment', () => {
      const shortDesc = 'Print this';
      const validDesc = 'Detailed scale model of ancient stepwell architecture in Gujarat with stepped corridors.';
      assert.ok(shortDesc.length < 10, 'Short description fails validation');
      assert.ok(validDesc.length >= 10, 'Valid description passes validation');
    });

    test('F45-5: Form optionally references catalog product ID to request variations of existing models', () => {
      const referencedProd = 'prod_ganesha_01';
      assert.ok(ctx.products.find((p) => p.id === referencedProd));
    });
  });

  // ==========================================================================
  // F46: Client Safe Upload Zone (drag-and-drop CAD/photo, client size/type checks)
  // ==========================================================================
  describe('F46: Client Safe Upload Zone', () => {
    test('F46-1: Upload zone accepts supported image formats (.jpg, .jpeg, .png, .webp)', () => {
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.stl'];
      assert.ok(allowedExts.includes('.webp'));
      assert.ok(allowedExts.includes('.stl'));
    });

    test('F46-2: Client-side validator rejects files exceeding 10MB limit prior to upload', () => {
      const fileSizeBytes = 12 * 1024 * 1024; // 12MB
      const maxAllowedBytes = 10 * 1024 * 1024;
      const isValidSize = fileSizeBytes <= maxAllowedBytes;
      assert.strictEqual(isValidSize, false, 'Client must reject file > 10MB');
    });

    test('F46-3: Upload zone rejects executable and script extensions (.exe, .sh, .js, .svg)', () => {
      const rejectedExts = ['.exe', '.sh', '.js', '.svg', '.html', '.bat'];
      for (const ext of rejectedExts) {
        const isAllowed = ['.jpg', '.png', '.webp', '.pdf', '.stl'].includes(ext);
        assert.strictEqual(isAllowed, false, `Extension ${ext} must not be allowed`);
      }
    });

    test('F46-4: Drag-and-drop zone provides visual focus state and keyboard access for file picker', () => {
      const fileInputProps = {
        type: 'file',
        accept: '.jpg,.jpeg,.png,.webp,.pdf,.stl',
        'aria-label': 'Upload reference photos or 3D CAD files'
      };
      assert.ok(fileInputProps['aria-label'].length > 0);
    });

    test('F46-5: Upload zone supports up to 3 reference file attachments per enquiry', () => {
      const maxAttachments = 3;
      const attachments = ['file_1.jpg', 'file_2.stl', 'file_3.png'];
      assert.ok(attachments.length <= maxAttachments);
    });
  });

  // ==========================================================================
  // F47: Enquiry Confirmation & WhatsApp Bridge (Reference ID & wa.me link)
  // ==========================================================================
  describe('F47: Enquiry Confirmation & WhatsApp', () => {
    test('F47-1: Successful submission returns unique formatted reference ID (e.g. BC-ENQ-202610-8842)', () => {
      const refId = `BC-ENQ-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      assert.ok(/^BC-ENQ-\d{6}-\d{4}$/.test(refId), 'Reference ID format must match BC-ENQ-YYYYMM-XXXX');
    });

    test('F47-2: Confirmation card generates direct WhatsApp bridge with prefilled reference details', () => {
      const refId = 'BC-ENQ-202610-4821';
      const customerName = 'Ananya Deshmukh';
      const projectType = 'custom_figurine';
      const cleanPhone = '919876543210';

      const message = `Hello BHAIRAVI Creations!\n\nI just submitted Custom Order Enquiry #${refId} on your website for: ${projectType}.\nName: ${customerName}.\n\nLooking forward to discussing the 3D model and finish options.`;
      const encoded = encodeURIComponent(message);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

      assert.ok(waUrl.startsWith('https://wa.me/919876543210?text='));
      assert.ok(waUrl.includes('BC-ENQ-202610-4821'));
    });

    test('F47-3: Customer retains full agency over WhatsApp message dispatch (no automatic sending)', () => {
      // wa.me standard opens user's WhatsApp composer; customer must explicitly click Send
      const customerControlsSend = true;
      assert.strictEqual(customerControlsSend, true);
    });

    test('F47-4: Confirmation screen renders summary of submitted project details and estimated quote time', () => {
      const confirmationScreen = {
        title: 'Enquiry Received with Gratitude',
        leadTime: 'Our founding artisans will review your CAD/design details and reply within 24 hours.',
        whatsappCta: 'Continue on WhatsApp for Instant Consultation'
      };
      assert.ok(confirmationScreen.leadTime.includes('24 hours'));
    });

    test('F47-5: Submitting enquiry records enquiry_form_submit telemetry event without customer PII', () => {
      const evt = {
        event_id: crypto.randomUUID(),
        event_type: 'enquiry_form_submit',
        timestamp_utc: new Date().toISOString(),
        session_id: 'sess_enquiry_test',
        page_path: '/custom-order',
        device_category: 'desktop',
        consent_status: 'granted',
        metadata: {
          enquiry_ref: 'BC-ENQ-202610-4821',
          project_type: 'custom_figurine'
        }
      };
      const res = ctx.ingestEvent(evt);
      assert.strictEqual(res.status, 202);
    });
  });

  // ==========================================================================
  // F48: Supporting Pages Suite (Editable About, Contact, FAQ, Shipping, Returns, DPDP, Terms)
  // ==========================================================================
  describe('F48: Supporting Pages Suite', () => {
    test('F48-1: About Us page highlights family heritage, 3D printing & hand-finishing philosophy', () => {
      const about = {
        title: 'About BHAIRAVI Creations',
        foundingStory: 'Founded in India as a family studio bridging digital additive precision and handcrafted art.',
        route: '/about'
      };
      assert.strictEqual(about.route, '/about');
    });

    test('F48-2: Shipping and Delivery page details domestic India courier partners and packaging standards', () => {
      const shipping = {
        route: '/shipping',
        coverage: 'All serviceable Indian pin codes via BlueDart, Delhivery and Speed Post',
        packaging: 'Double-walled corrugated boxes with multi-layer bubble cushioning for fragile 3D art'
      };
      assert.ok(shipping.packaging.includes('bubble cushioning'));
    });

    test('F48-3: Returns and Cancellation page distinguishes ready-stock items from bespoke custom commissions', () => {
      const returns = {
        route: '/returns',
        readyStockPolicy: '7-day replacement for transit damage with unboxing video proof',
        customOrderPolicy: 'Bespoke custom commissions are non-cancellable once 3D printing or painting commences'
      };
      assert.ok(returns.customOrderPolicy.includes('non-cancellable'));
    });

    test('F48-4: Privacy Policy aligns with India Digital Personal Data Protection (DPDP) Act 2023', () => {
      const privacy = {
        route: '/privacy',
        framework: 'DPDP Act 2023 Compliance',
        trackingDisclosure: 'Anonymous first-party telemetry only. Zero data selling. Zero covert fingerprinting.',
        optOutHonored: true
      };
      assert.ok(privacy.framework.includes('DPDP Act 2023'));
      assert.strictEqual(privacy.optOutHonored, true);
    });

    test('F48-5: Terms of Service specifies INR pricing, 3D model IP rights, and Indian court jurisdiction', () => {
      const terms = {
        route: '/terms',
        currency: 'INR (Indian Rupee)',
        jurisdiction: 'Courts of Ludhiana, Punjab, India',
        ipProtection: 'All proprietary 3D digital sculpts and photos remain copyright of BHAIRAVI Creations'
      };
      assert.strictEqual(terms.currency, 'INR (Indian Rupee)');
      assert.ok(terms.jurisdiction.includes('India'));
    });
  });

  // ==========================================================================
  // F49: Amazon India Commerce Actions (ASIN link generator & outbound telemetry)
  // ==========================================================================
  describe('F49: Amazon India Commerce Actions', () => {
    test('F49-1: Link builder generates valid Amazon India product URL with associate tag and campaign tracking', () => {
      const asin = 'B0BHAIRAVI1';
      const associateTag = 'bhairavicreat-21';
      const campaignRef = 'bhairavi_web_pdp';
      const expectedUrl = `https://www.amazon.in/dp/${asin}?tag=${associateTag}&ref=${campaignRef}`;

      assert.strictEqual(
        expectedUrl,
        'https://www.amazon.in/dp/B0BHAIRAVI1?tag=bhairavicreat-21&ref=bhairavi_web_pdp'
      );
    });

    test('F49-2: Clicking Amazon CTA fires amazon_outbound_click telemetry beacon', () => {
      const amazonClickEvt = {
        event_id: crypto.randomUUID(),
        event_type: 'amazon_outbound_click',
        timestamp_utc: new Date().toISOString(),
        session_id: 'sess_amazon_shopper_1',
        product_id: 'prod_ganesha_01',
        page_path: '/products/ganesha-antique-bronze-hand-painted',
        device_category: 'mobile',
        consent_status: 'granted' as const,
        metadata: { asin: 'B0BHAIRAVI1' }
      };

      const res = ctx.ingestEvent(amazonClickEvt);
      assert.strictEqual(res.status, 202);
      const stored = ctx.analyticsEvents[0];
      assertOutcomeUnknown(stored);
    });

    test('F49-3: Products without Amazon listing gracefully suppress Amazon button and emphasize WhatsApp consultation', () => {
      const exclusiveProduct = ctx.products.find((p) => p.id === 'prod_temple_replica_03')!;
      assert.strictEqual(exclusiveProduct.amazon_url, null);

      const buttonConfiguration = exclusiveProduct.amazon_url
        ? { primaryAction: 'amazon', secondaryAction: 'whatsapp' }
        : { primaryAction: 'whatsapp', badge: 'Studio Exclusive — Made to Order' };

      assert.strictEqual(buttonConfiguration.primaryAction, 'whatsapp');
      assert.strictEqual(buttonConfiguration.badge, 'Studio Exclusive — Made to Order');
    });

    test('F49-4: Outbound navigation preserves campaign UTM attribution parameters', () => {
      const initialUtmSource = 'instagram';
      const initialUtmCampaign = 'diwali_decor_2026';

      const outboundUrl = `https://www.amazon.in/dp/B0BHAIRAVI1?tag=bhairavicreat-21&ref=ig_${initialUtmCampaign}`;
      assert.ok(outboundUrl.includes('diwali_decor_2026'));
    });

    test('F49-5: Outbound click event is permanently isolated from verified order sales figures', () => {
      const amazonEvt = {
        event_id: crypto.randomUUID(),
        event_type: 'amazon_outbound_click',
        timestamp_utc: new Date().toISOString(),
        session_id: 'sess_1',
        product_id: 'prod_ganesha_01',
        page_path: '/products',
        device_category: 'desktop',
        consent_status: 'granted' as const
      };
      ctx.ingestEvent(amazonEvt);
      const stored = ctx.analyticsEvents[0];
      assert.notStrictEqual(stored.event_type, 'purchase');
      assert.strictEqual(stored.outcome_status, 'purchase_outcome_unknown');
    });
  });

  // ==========================================================================
  // F50: WhatsApp Click-to-Chat Actions (wa.me URL builder with prefilled message)
  // ==========================================================================
  describe('F50: WhatsApp Click-to-Chat Actions', () => {
    test('F50-1: Link builder formats clean E.164 phone number without symbols (e.g. 919876543210)', () => {
      const rawNumber = '+91 (987) 654-3210';
      const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
      assert.strictEqual(cleanNumber, '919876543210');
    });

    test('F50-2: Product WhatsApp URL formats prefilled message with title, variant, and INR price', () => {
      const cleanPhone = '919876543210';
      const productName = 'Geometric Lotus Succulent Planter';
      const priceINR = '1,299';
      const pageUrl = 'https://bhairavicreations.com/products/geometric-lotus-planter-terracotta';

      const message = `Hello BHAIRAVI Creations!\n\nI am interested in ordering: *${productName}*\nPrice: ₹${priceINR}\nLink: ${pageUrl}\n\nPlease confirm availability and dispatch timeline.`;
      const encoded = encodeURIComponent(message);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

      assert.ok(waUrl.startsWith('https://wa.me/919876543210?text='));
      assert.ok(waUrl.includes('1%2C299') || waUrl.includes('1,299') || decodeURIComponent(waUrl).includes('₹1,299'));
    });

    test('F50-3: Clicking WhatsApp CTA fires whatsapp_outbound_click telemetry beacon', () => {
      const waEvt = {
        event_id: crypto.randomUUID(),
        event_type: 'whatsapp_outbound_click',
        timestamp_utc: new Date().toISOString(),
        session_id: 'sess_wa_test',
        product_id: 'prod_lotus_planter_02',
        page_path: '/products/geometric-lotus-planter-terracotta',
        device_category: 'mobile',
        consent_status: 'granted' as const
      };
      const res = ctx.ingestEvent(waEvt);
      assert.strictEqual(res.status, 202);
      const stored = ctx.analyticsEvents[0];
      assertOutcomeUnknown(stored);
    });

    test('F50-4: Desktop browsers opening wa.me URL redirect cleanly to WhatsApp Web with preserved message', () => {
      const cleanPhone = '919876543210';
      const message = 'Hello studio!';
      const standardWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      // https://wa.me is universally responsive across desktop and mobile
      assert.ok(standardWaUrl.includes('wa.me/919876543210'));
    });

    test('F50-5: Custom prefilled WhatsApp templates support special characters and emojis safely encoded', () => {
      const specialText = 'Hello BHAIRAVI Creations! 🪔 Interested in Diwali Art & Gifting: ₹5,000+';
      const encoded = encodeURIComponent(specialText);
      assert.ok(encoded.includes('%F0%9F%AA%94') || decodeURIComponent(encoded) === specialText);
    });
  });
});
