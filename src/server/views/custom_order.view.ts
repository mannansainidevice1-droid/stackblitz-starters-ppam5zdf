/**
 * BHAIRAVI Creations Digital Platform
 * Premium Editorial Custom Order Enquiry Page SSR View (Features F45, F46, F47)
 * Target: src/server/views/custom_order.view.ts
 */

import { renderBaseLayout, escapeHtml } from './layout.view.js';
import { STUDIO_DETAILS } from '../../shared/constants.js';

export interface CustomOrderPageProps {
  referencedProduct?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export function renderCustomOrderPage(props: CustomOrderPageProps = {}): string {
  const { referencedProduct } = props;
  const renderedAt = Date.now();

  const content = `
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-3xl">
      <!-- Editorial Page Header -->
      <div class="text-center mb-10">
        <span class="inline-block text-xs font-bold uppercase tracking-widest text-[#2563EB] mb-2">
          Studio Commissions • Ludhiana, Punjab
        </span>
        <h1 class="font-display text-4xl sm:text-5xl font-black text-[#0B0F19] tracking-tight leading-tight">
          Custom Order Enquiry
        </h1>
        <p class="mt-3 text-base text-[#475569] leading-relaxed max-w-xl mx-auto">
          Commission a custom 3D-printed and hand-finished piece. From sacred idols and architectural heritage models to corporate gifting—our artisans transform your vision into reality.
        </p>
      </div>

      <!-- Interactive Custom Order Visual Cost & Time Estimator -->
      <div class="bento-card p-6 sm:p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm mb-8">
        <div class="flex items-center justify-between pb-4 border-b border-[#F1F5F9] mb-5">
          <div>
            <h2 class="font-display text-lg sm:text-xl font-bold text-[#0B0F19]">Interactive Commission Estimator</h2>
            <p class="text-xs text-[#64748B] mt-0.5">Explore estimated print time and budget according to scale and finishing complexity.</p>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            Live Calculator
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <!-- Controls Column -->
          <div class="md:col-span-2 space-y-5">
            <!-- Height Slider -->
            <div>
              <div class="flex items-center justify-between text-xs font-semibold text-[#0B0F19] mb-1.5">
                <label for="est-height-slider">Model Height / Scale</label>
                <span class="font-mono font-bold text-[#2563EB]" id="est-height-val">18 cm (7.1 in)</span>
              </div>
              <input type="range" id="est-height-slider" min="5" max="40" value="18" step="1"
                     class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB]" />
              <div class="flex justify-between text-[10px] text-[#94A3B8] mt-1">
                <span>5 cm (Miniature)</span>
                <span>18 cm (Tabletop)</span>
                <span>40 cm (Grand Sculptural)</span>
              </div>
            </div>

            <!-- Material & Finishing Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="est-material-select" class="form-label text-xs">Material Formulation</label>
                <select id="est-material-select" class="form-select text-xs cursor-pointer">
                  <option value="pla_standard" selected>High-Density PLA / PLA Pro</option>
                  <option value="wood_fill">Wood-Composite Pine Fiber (+₹500)</option>
                  <option value="carbon_fiber">Carbon-Fiber Core (+₹400)</option>
                  <option value="sla_resin">8K Ultra-Precision Resin (+₹700)</option>
                </select>
              </div>

              <div>
                <label for="est-finish-select" class="form-label text-xs">Artisanal Finishing Tier</label>
                <select id="est-finish-select" class="form-select text-xs cursor-pointer">
                  <option value="artisan_patina" selected>Master Artisan Patina (Gilded / Bronzed)</option>
                  <option value="sanded_primed">Triple Wet-Sanded &amp; Primed Only</option>
                  <option value="raw_print">Raw 3D Print (Unfinished 0.12mm)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Dynamic Output Card -->
          <div class="p-5 rounded-xl bg-[#FAF9F5] border border-[#CBD5E1] text-center space-y-3">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Estimated Budget Range</span>
            <div id="est-price-range" class="font-display text-2xl font-black text-[#0B0F19]">
              ₹2,400 - ₹3,100
            </div>
            <div class="text-[11px] text-[#64748B] space-y-1.5 pt-2 border-t border-[#E2E8F0]">
              <div class="flex justify-between"><span>Print Duration:</span><strong id="est-print-time" class="text-[#0B0F19]">~16-20 hrs</strong></div>
              <div class="flex justify-between"><span>Layer Detail:</span><strong class="text-[#0B0F19]">0.12mm (120μm)</strong></div>
              <div class="flex justify-between"><span>Estimated Weight:</span><strong id="est-weight" class="text-[#0B0F19]">~380 grams</strong></div>
            </div>
            <button type="button" id="est-apply-btn" class="btn btn-secondary btn-sm w-full mt-2 text-xs">
              Apply to Inquiry Form &darr;
            </button>
          </div>
        </div>
      </div>

      <!-- Main Bento Form Card -->
      <div id="enquiry-form-container" class="bento-card p-6 sm:p-10 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        
        <!-- Error Alert Container -->
        <div id="form-error-alert" class="hidden p-4 rounded-xl mb-6 bg-red-50 border border-red-200 text-sm font-medium text-red-700" role="alert"></div>

        <form id="custom-order-form" method="POST" action="/api/enquiries" enctype="multipart/form-data" novalidate>
          
          <!-- Anti-Spam Honeypots & Render Timestamp -->
          <div class="hidden" aria-hidden="true">
            <label for="bhr_check_field">Leave this empty:</label>
            <input type="text" id="bhr_check_field" name="bhr_check_field" tabindex="-1" autocomplete="off" />
            <input type="text" id="website_url" name="website_url" tabindex="-1" autocomplete="off" />
          </div>
          <input type="hidden" id="rendered_at" name="rendered_at" value="${renderedAt}" />
          ${
            referencedProduct
              ? `<input type="hidden" id="referenced_product_id" name="referenced_product_id" value="${escapeHtml(referencedProduct.id)}" />`
              : ''
          }

          <!-- Referenced Product Notice if applicable -->
          ${
            referencedProduct
              ? `
            <div class="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] mb-6 flex items-center justify-between text-xs">
              <span class="text-[#1E40AF]">
                Referencing catalogue model: <strong class="text-[#0B0F19]">${escapeHtml(referencedProduct.name)}</strong>
              </span>
              <a href="/products/${referencedProduct.slug}" class="font-bold text-[#2563EB] hover:underline">View Model &rarr;</a>
            </div>
          `
              : ''
          }

          <!-- 1. Customer Name & Contact Phone Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label for="customer_name" class="form-label">
                Your Full Name <span class="text-[#2563EB]">*</span>
              </label>
              <input
                type="text"
                id="customer_name"
                name="customer_name"
                required
                minlength="2"
                maxlength="100"
                placeholder="e.g. Ananya Deshmukh"
                class="form-input"
              />
            </div>

            <div>
              <label for="contact_phone" class="form-label">
                WhatsApp / Mobile Number <span class="text-[#2563EB]">*</span>
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                required
                placeholder="+91 98765 43210"
                class="form-input"
              />
              <span class="form-help">10-digit Indian mobile number</span>
            </div>
          </div>

          <!-- 2. Contact Email & Preferred Contact Channel Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label for="contact_email" class="form-label">
                Email Address <span class="text-[#94A3B8] font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                placeholder="ananya@example.in"
                class="form-input"
              />
            </div>

            <div>
              <label for="preferred_contact_method" class="form-label">
                Preferred Channel
              </label>
              <select
                id="preferred_contact_method"
                name="preferred_contact_method"
                class="form-select cursor-pointer">
                <option value="whatsapp" selected>WhatsApp (Fastest feasibility & photos)</option>
                <option value="phone">Direct Phone Call</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>

          <!-- 3. Project Type, Quantity & Budget Row -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            <div>
              <label for="project_type" class="form-label">
                Project Category <span class="text-[#2563EB]">*</span>
              </label>
              <select
                id="project_type"
                name="project_type"
                required
                class="form-select cursor-pointer">
                <option value="custom_figurine" selected>Custom Deity / Figurine</option>
                <option value="architectural_model">Architectural Heritage Model</option>
                <option value="lithophane">Custom Lithophane / Lamp</option>
                <option value="corporate_gifting">Corporate / Event Gifting</option>
                <option value="replacement_part">Precision Replacement Part</option>
                <option value="other">Other Custom Creation</option>
              </select>
            </div>

            <div>
              <label for="approximate_quantity" class="form-label">
                Quantity <span class="text-[#2563EB]">*</span>
              </label>
              <input
                type="number"
                id="approximate_quantity"
                name="approximate_quantity"
                min="1"
                max="10000"
                value="1"
                required
                class="form-input"
              />
            </div>

            <div>
              <label for="budget_range_inr" class="form-label">
                Target Budget (INR)
              </label>
              <select
                id="budget_range_inr"
                name="budget_range_inr"
                class="form-select cursor-pointer">
                <option value="Under ₹2,500">Under ₹2,500</option>
                <option value="₹2,500 - ₹5,000" selected>₹2,500 - ₹5,000</option>
                <option value="₹3,500 - ₹7,500">₹3,500 - ₹7,500</option>
                <option value="₹5,000 - ₹10,000">₹5,000 - ₹10,000</option>
                <option value="₹10,000+">₹10,000+</option>
              </select>
            </div>
          </div>

          <!-- 4. Design Description -->
          <div class="mb-6">
            <label for="design_description" class="form-label">
              Design & Finishing Description <span class="text-[#2563EB]">*</span>
            </label>
            <textarea
              id="design_description"
              name="design_description"
              rows="4"
              required
              minlength="10"
              maxlength="5000"
              placeholder="Describe dimensions, finishes (bronze patina, terracotta wash, artist acrylics), reference links, or specific display plinth requirements..."
              class="form-textarea leading-relaxed"></textarea>
            <span class="form-help">Minimum 10 characters required for accurate studio evaluation.</span>
          </div>

          <!-- 5. Client Safe Upload Drop Zone -->
          <div class="mb-8">
            <label class="form-label">
              Reference Photos or 3D STL CAD Files <span class="text-[#94A3B8] font-normal">(Optional)</span>
            </label>
            <div id="enquiry-upload-zone" class="p-6 border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] rounded-2xl text-center bg-[#FAF9F5] transition-colors">
              <svg class="w-8 h-8 text-[#94A3B8] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <p class="text-sm font-medium text-[#475569] mb-1">
                Drag & drop reference images or 3D STL files here (up to 10MB)
              </p>
              <p class="text-xs text-[#94A3B8] mb-3">Supported formats: JPG, PNG, WEBP, PDF, STL</p>
              <input type="file" id="bhr_file_input" name="attachment" accept=".jpg,.jpeg,.png,.webp,.pdf,.stl" class="text-xs text-[#64748B] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0B0F19] file:text-white hover:file:bg-[#2563EB] file:cursor-pointer cursor-pointer" />
            </div>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              id="enquiry-submit-btn"
              type="submit"
              class="btn btn-cobalt btn-lg w-full shadow-sm">
              Submit Custom Order Enquiry
            </button>
            <p class="text-xs text-[#64748B] text-center mt-3">
              Fixed upfront quotation delivered within 24 hours. Zero obligation until quote confirmation.
            </p>
          </div>
        </form>
      </div>
    </div>
  `;

  const extraScripts = `
    <script>
      (function() {
        var form = document.getElementById('custom-order-form');
        var container = document.getElementById('enquiry-form-container');
        if (!form || !container) return;

        // Interactive Live Visual Estimator Calculation
        var heightSlider = document.getElementById('est-height-slider');
        var heightVal = document.getElementById('est-height-val');
        var materialSelect = document.getElementById('est-material-select');
        var finishSelect = document.getElementById('est-finish-select');
        var priceRangeEl = document.getElementById('est-price-range');
        var printTimeEl = document.getElementById('est-print-time');
        var weightEl = document.getElementById('est-weight');
        var applyBtn = document.getElementById('est-apply-btn');

        function recalculateEstimate() {
          if (!heightSlider || !priceRangeEl) return;
          var h = parseInt(heightSlider.value, 10);
          var inVal = (h / 2.54).toFixed(1);
          if (heightVal) heightVal.textContent = h + ' cm (' + inVal + ' in)';

          var mat = materialSelect ? materialSelect.value : 'pla_standard';
          var fin = finishSelect ? finishSelect.value : 'artisan_patina';

          var scale = Math.pow(h / 18, 2.1);
          var baseHours = Math.round(16 * Math.pow(h / 18, 1.8));
          var baseWeightGrams = Math.round(380 * scale);

          var matCost = 0;
          var matLabel = 'High-Density PLA / PLA Pro';
          if (mat === 'wood_fill') { matCost = 500; matLabel = 'Wood-Composite Pine Fiber'; }
          else if (mat === 'carbon_fiber') { matCost = 400; matLabel = 'Carbon-Fiber Core'; }
          else if (mat === 'sla_resin') { matCost = 700; matLabel = '8K Ultra-Precision Resin'; }

          var finMult = 1.25;
          var finLabel = 'Master Artisan Hand-Patina';
          if (fin === 'sanded_primed') { finMult = 0.9; finLabel = 'Sanded & Primed (Paint-Ready)'; }
          else if (fin === 'raw_print') { finMult = 0.65; finLabel = 'Raw Unfinished 3D Print'; }

          var centerPrice = Math.round((1800 * scale + matCost) * finMult);
          var lowPrice = Math.round(centerPrice * 0.88 / 50) * 50;
          var highPrice = Math.round(centerPrice * 1.15 / 50) * 50;

          priceRangeEl.textContent = '₹' + lowPrice.toLocaleString('en-IN') + ' - ₹' + highPrice.toLocaleString('en-IN');
          if (printTimeEl) printTimeEl.textContent = '~' + Math.max(2, baseHours - 2) + '-' + (baseHours + 4) + ' hrs';
          if (weightEl) weightEl.textContent = '~' + Math.max(30, baseWeightGrams) + ' grams';

          return {
            h: h,
            lowPrice: lowPrice,
            highPrice: highPrice,
            matLabel: matLabel,
            finLabel: finLabel
          };
        }

        if (heightSlider) heightSlider.addEventListener('input', recalculateEstimate);
        if (materialSelect) materialSelect.addEventListener('change', recalculateEstimate);
        if (finishSelect) finishSelect.addEventListener('change', recalculateEstimate);

        if (applyBtn) {
          applyBtn.addEventListener('click', function() {
            var est = recalculateEstimate();
            if (!est) return;

            // Auto-select budget dropdown
            var budgetSelect = document.getElementById('budget_range_inr');
            if (budgetSelect) {
              if (est.highPrice < 2500) budgetSelect.value = 'Under ₹2,500';
              else if (est.highPrice <= 5000) budgetSelect.value = '₹2,500 - ₹5,000';
              else if (est.highPrice <= 7500) budgetSelect.value = '₹3,500 - ₹7,500';
              else if (est.highPrice <= 10000) budgetSelect.value = '₹5,000 - ₹10,000';
              else budgetSelect.value = '₹10,000+';
            }

            // Append into design description
            var descArea = document.getElementById('design_description');
            if (descArea) {
              var nl = String.fromCharCode(10);
              var specLines = [
                'Target Dimensions: ' + est.h + ' cm height.',
                'Material: ' + est.matLabel + '.',
                'Desired Finishing: ' + est.finLabel + '.',
                'Estimated Target Budget: ₹' + est.lowPrice.toLocaleString('en-IN') + ' - ₹' + est.highPrice.toLocaleString('en-IN') + '.'
              ];
              var specNote = specLines.join(nl);
              if (descArea.value.indexOf('Target Dimensions:') === -1) {
                descArea.value = specNote + nl + nl + descArea.value;
              }
              descArea.focus();
            }
          });
        }

        recalculateEstimate();

        var hasStarted = false;
        form.addEventListener('focusin', function() {
          if (!hasStarted && window.__bhr_send_event) {
            hasStarted = true;
            window.__bhr_send_event('enquiry_form_start', { metadata: { form_name: 'custom_order_v1' } });
          }
        });

        form.addEventListener('submit', async function(e) {
          e.preventDefault();
          var errAlert = document.getElementById('form-error-alert');
          var name = (document.getElementById('customer_name').value || '').trim();
          var phone = (document.getElementById('contact_phone').value || '').trim();
          var desc = (document.getElementById('design_description').value || '').trim();
          var renderedAt = parseInt(document.getElementById('rendered_at').value || '0', 10);
          var submitBtn = document.getElementById('enquiry-submit-btn');

          function fail(msg) {
            if (errAlert) {
              errAlert.textContent = msg;
              errAlert.classList.remove('hidden');
            } else {
              alert(msg);
            }
          }
          if (errAlert) errAlert.classList.add('hidden');

          if (name.length < 2) {
            fail('Please enter your full name (minimum 2 characters).');
            return;
          }

          var cleanPhoneDigits = phone.replace(/\D/g, '');
          if (cleanPhoneDigits.length === 10 && /^[6789]/.test(cleanPhoneDigits)) {
            phone = '+91' + cleanPhoneDigits;
          } else if (cleanPhoneDigits.length === 12 && cleanPhoneDigits.startsWith('91') && /^[6789]/.test(cleanPhoneDigits.slice(2))) {
            phone = '+' + cleanPhoneDigits;
          } else if (cleanPhoneDigits.length === 11 && cleanPhoneDigits.startsWith('0') && /^[6789]/.test(cleanPhoneDigits.slice(1))) {
            phone = '+91' + cleanPhoneDigits.slice(1);
          } else {
            fail('Please enter a valid 10-digit Indian mobile number.');
            return;
          }

          if (desc.length < 10) {
            fail('Please provide at least 10 characters describing your custom design.');
            return;
          }

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting to Ludhiana Studio...';
          }

          var elapsed = Date.now() - renderedAt;
          if (elapsed < 2600) {
            await new Promise(function(resolve) { setTimeout(resolve, 2600 - elapsed); });
          }

          var formData = new FormData(form);
          formData.set('contact_phone', phone);
          var pType = document.getElementById('project_type').value || 'custom_figurine';
          formData.set('project_type', pType);

          try {
            var res = await fetch('/api/enquiries', {
              method: 'POST',
              body: formData
            });
            var data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Failed to submit enquiry.');
            }

            var refId = data.enquiry_id || ('BC-ENQ-' + new Date().toISOString().slice(0,7).replace('-','') + '-' + Math.floor(1000 + Math.random()*9000));
            var cleanPhone = '${STUDIO_DETAILS.whatsapp_number}';
            var waText = encodeURIComponent('Hello BHAIRAVI Creations! I just submitted custom order enquiry #' + refId + ' (' + name + '). Looking forward to the quote!');
            var waChatUrl = 'https://wa.me/' + cleanPhone + '?text=' + waText;

            container.innerHTML = [
              '<div class="text-center py-8">',
                '<div class="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">',
                  '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>',
                '</div>',
                '<h2 class="font-display text-2xl font-black text-[#0B0F19] mb-2">Enquiry Received at Ludhiana Studio</h2>',
                '<p class="text-sm text-[#475569] max-w-md mx-auto mb-6">',
                  'Thank you, ' + name + '. Your commission enquiry has been registered under reference: <strong class="text-[#0B0F19] font-mono">' + refId + '</strong>.',
                '</p>',
                '<div class="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E2E8F0] max-w-md mx-auto text-left mb-6 text-xs text-[#475569] space-y-2">',
                  '<div><strong>Response Window:</strong> Within 24 business hours</div>',
                  '<div><strong>Studio Location:</strong> Ludhiana, Punjab (PIN 141001)</div>',
                  '<div><strong>Direct Support:</strong> +91 73472 78010</div>',
                '</div>',
                '<a href="' + waChatUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-lg">',
                  '<span>Confirm on WhatsApp (' + refId + ')</span>',
                '</a>',
              '</div>'
            ].join('');

            if (window.__bhr_send_event) {
              window.__bhr_send_event('custom_order_submit', { enquiry_id: refId, project_type: pType });
            }
          } catch (err) {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Submit Custom Order Enquiry';
            }
            fail(err.message || 'An error occurred while transmitting your enquiry.');
          }
        });
      })();
    </script>
  `;

  return renderBaseLayout({
    title: 'Custom Order Commission Enquiry',
    description: 'Commission a custom 3D-printed and hand-finished sculpture or architectural model from our Ludhiana studio.',
    canonicalPath: '/custom-order',
    activeNav: 'custom-order',
    content,
    extraScripts
  });
}
