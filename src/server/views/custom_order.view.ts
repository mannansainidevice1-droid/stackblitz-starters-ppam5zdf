/**
 * BHAIRAVI Creations Digital Platform
 * Custom Order Enquiry Page SSR View (Features F45, F46, F47)
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
    <div class="container" style="padding-top: 48px; padding-bottom: 80px; max-width: 800px;">
      <!-- Page Header -->
      <div style="text-align: center; margin-bottom: 40px;">
        <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--terracotta);">
          Artisanal 3D Custom Orders
        </span>
        <h1 style="font-family: var(--font-serif); font-size: 36px; font-weight: 700; color: var(--charcoal); margin-top: 6px;">
          Custom Order Enquiry
        </h1>
        <p style="font-size: 15px; color: #57534E; margin-top: 8px; line-height: 1.6;">
          Commission a unique 3D-printed and hand-finished piece. From classical sculptures and architectural models to custom lithophanes and corporate gifting—our Ludhiana artisans bring your vision to life.
        </p>
      </div>

      <!-- Main Form Container -->
      <div id="enquiry-form-container" style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; padding: 36px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        
        <!-- Error Alert Container -->
        <div id="form-error-alert" class="hidden" style="display: none; background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; padding: 12px 16px; border-radius: 8px; font-size: 14px; margin-bottom: 24px;" role="alert"></div>

        <form id="custom-order-form" method="POST" action="/api/enquiries" enctype="multipart/form-data" novalidate>
          
          <!-- Anti-Spam Honeypots & Render Timestamp -->
          <div style="display: none; position: absolute; left: -9999px;" aria-hidden="true">
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
            <div style="background: #FAF9F6; border: 1px solid var(--stone-border); border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 13px; color: #57534E;">
                Referencing catalogue model: <strong>${escapeHtml(referencedProduct.name)}</strong>
              </span>
              <a href="/products/${referencedProduct.slug}" style="font-size: 12px; color: var(--terracotta); font-weight: 600;">View Model &rarr;</a>
            </div>
          `
              : ''
          }

          <!-- 1. Customer Name & Contact Phone Row -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div>
              <label for="customer_name" style="display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">
                Your Name <span style="color: var(--terracotta);">*</span>
              </label>
              <input
                type="text"
                id="customer_name"
                name="customer_name"
                required
                minlength="2"
                maxlength="100"
                placeholder="e.g. Ananya Deshmukh"
                style="width: 100%; padding: 11px 14px; font-size: 14px; border: 1px solid var(--stone-border); border-radius: 8px; background: #FAF9F6; color: var(--charcoal);"
              />
            </div>

            <div>
              <label for="contact_phone" style="display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">
                WhatsApp / Mobile Number <span style="color: var(--terracotta);">*</span>
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                required
                placeholder="+91 98765 43210"
                style="width: 100%; padding: 11px 14px; font-size: 14px; border: 1px solid var(--stone-border); border-radius: 8px; background: #FAF9F6; color: var(--charcoal);"
              />
              <span style="font-size: 11px; color: #78716C; margin-top: 4px; display: block;">10-digit Indian mobile number</span>
            </div>
          </div>

          <!-- 2. Contact Email & Preferred Contact Channel Row -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div>
              <label for="contact_email" style="display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">
                Email Address <span style="color: #78716C; font-weight: normal;">(Optional)</span>
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                placeholder="ananya@example.in"
                style="width: 100%; padding: 11px 14px; font-size: 14px; border: 1px solid var(--stone-border); border-radius: 8px; background: #FAF9F6; color: var(--charcoal);"
              />
            </div>

            <div>
              <label for="preferred_contact_method" style="display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">
                Preferred Contact Channel
              </label>
              <select
                id="preferred_contact_method"
                name="preferred_contact_method"
                style="width: 100%; padding: 11px 14px; font-size: 14px; border: 1px solid var(--stone-border); border-radius: 8px; background: #FAF9F6; color: var(--charcoal); cursor: pointer;">
                <option value="whatsapp" selected>WhatsApp (Fastest feasibility & photos)</option>
                <option value="phone">Phone Call</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>

          <!-- 3. Project Type, Quantity & Budget Row -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div>
              <label for="project_type" style="display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">
                Project Category <span style="color: var(--terracotta);">*</span>
              </label>
              <select
                id="project_type"
                name="project_type"
                required
                style="width: 100%; padding: 11px 14px; font-size: 14px; border: 1px solid var(--stone-border); border-radius: 8px; background: #FAF9F6; color: var(--charcoal); cursor: pointer;">
                <option value="custom_figurine" selected>Custom Deity / Figurine</option>
                <option value="architectural_model">Architectural Heritage Model</option>
                <option value="lithophane">Custom Lithophane / Lamp</option>
                <option value="corporate_gifting">Corporate / Event Gifting</option>
                <option value="replacement_part">Precision Replacement Part</option>
                <option value="other">Other Bespoke Creation</option>
              </select>
            </div>

            <div>
              <label for="approximate_quantity" style="display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">
                Quantity <span style="color: var(--terracotta);">*</span>
              </label>
              <input
                type="number"
                id="approximate_quantity"
                name="approximate_quantity"
                min="1"
                max="10000"
                value="1"
                required
                style="width: 100%; padding: 11px 14px; font-size: 14px; border: 1px solid var(--stone-border); border-radius: 8px; background: #FAF9F6; color: var(--charcoal);"
              />
            </div>

            <div>
              <label for="budget_range_inr" style="display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">
                Target Budget (INR)
              </label>
              <select
                id="budget_range_inr"
                name="budget_range_inr"
                style="width: 100%; padding: 11px 14px; font-size: 14px; border: 1px solid var(--stone-border); border-radius: 8px; background: #FAF9F6; color: var(--charcoal); cursor: pointer;">
                <option value="Under ₹2,500">Under ₹2,500</option>
                <option value="₹2,500 - ₹5,000" selected>₹2,500 - ₹5,000</option>
                <option value="₹3,500 - ₹7,500">₹3,500 - ₹7,500</option>
                <option value="₹5,000 - ₹10,000">₹5,000 - ₹10,000</option>
                <option value="₹10,000+">₹10,000+</option>
              </select>
            </div>
          </div>

          <!-- 4. Design Description -->
          <div style="margin-bottom: 24px;">
            <label for="design_description" style="display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">
              Design & Finishing Description <span style="color: var(--terracotta);">*</span>
            </label>
            <textarea
              id="design_description"
              name="design_description"
              rows="4"
              required
              minlength="10"
              maxlength="5000"
              placeholder="Please describe dimensions, finish (bronze, terracotta wash, hand-painted acrylics), reference links, or specific display plinth requirements..."
              style="width: 100%; padding: 12px 14px; font-size: 14px; border: 1px solid var(--stone-border); border-radius: 8px; background: #FAF9F6; color: var(--charcoal); line-height: 1.5;"></textarea>
            <span style="font-size: 11px; color: #78716C; margin-top: 4px; display: block;">Minimum 10 characters required for accurate studio evaluation.</span>
          </div>

          <!-- 5. Client Safe Upload Drop Zone (Feature F46) -->
          <div style="margin-bottom: 28px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">
              Reference Photos or 3D STL CAD Files <span style="color: #78716C; font-weight: normal;">(Optional)</span>
            </label>
            <div id="enquiry-upload-zone">
              <!-- Upload zone will be hydrated by client script -->
              <div class="upload-dropzone" style="border: 2px dashed var(--stone-border); border-radius: 8px; padding: 24px; text-align: center; background: #FAF9F6;">
                <p style="font-size: 14px; color: #57534E;">
                  Drag & drop reference files or STL models here (up to 10MB)
                </p>
                <input type="file" id="bhr_file_input" name="attachment" accept=".jpg,.jpeg,.png,.webp,.pdf,.stl" style="margin-top: 12px; font-size: 13px;" />
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              id="enquiry-submit-btn"
              type="submit"
              class="btn-primary"
              style="width: 100%; min-height: 48px; font-size: 16px;">
              Submit Custom Order Enquiry
            </button>
            <p style="font-size: 12px; color: #78716C; text-align: center; margin-top: 12px;">
              Fixed upfront quote provided within 24 hours. No obligation to proceed until you approve the quote.
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
              errAlert.style.display = 'block';
            } else {
              alert(msg);
            }
          }
          if (errAlert) errAlert.style.display = 'none';

          if (name.length < 2) {
            fail('Please enter your name (minimum 2 characters).');
            return;
          }

          if (/^[6789]\\d{9}$/.test(phone)) {
            phone = '+91' + phone;
          } else if (/^91[6789]\\d{9}$/.test(phone)) {
            phone = '+' + phone;
          }
          if (!/^\\+91[6789]\\d{9}$/.test(phone)) {
            fail('Please enter a valid 10-digit Indian phone number.');
            return;
          }

          if (desc.length < 10) {
            fail('Please provide at least 10 characters describing your custom design.');
            return;
          }

          if (Date.now() - renderedAt < 2500) {
            fail('Submission completed too quickly.');
            return;
          }

          var formData = new FormData(form);
          formData.set('contact_phone', phone);
          var pType = document.getElementById('project_type').value || 'custom_figurine';
          formData.set('project_type', pType);

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Transmitting to Artisans...';
          }

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
            var msg = "Hello BHAIRAVI Creations!\\n\\nI submitted Custom Order Enquiry #" + refId + " for: " + pType + ".\\nName: " + name + ".\\nLooking forward to discussing materials and finishing options.";
            var waUrl = "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(msg);

            if (window.__bhr_send_event) {
              window.__bhr_send_event('enquiry_form_submit', {
                metadata: { enquiry_ref: refId, project_type: pType }
              });
            }

            container.innerHTML = 
              '<div class="confirmation-card" style="text-align: center; padding: 32px 16px;">' +
                '<div style="width: 56px; height: 56px; border-radius: 50%; background: #ECFDF5; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; color: #059669; font-size: 28px;">✓</div>' +
                '<h2 style="font-family: var(--font-serif); font-size: 26px; font-weight: 700; color: #1C1917; margin-bottom: 8px;">Enquiry Received with Gratitude</h2>' +
                '<p style="font-size: 14px; color: #78716C; margin-bottom: 24px;">Our founding artisans will review your CAD/design details and reply within 24 hours.</p>' +
                '<div style="background: #FAF9F6; border: 1px solid var(--stone-border); border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: left; max-width: 440px; margin-left: auto; margin-right: auto; font-size: 13px;">' +
                  '<div><strong>Reference Code:</strong> ' + refId + '</div>' +
                  '<div><strong>Customer Name:</strong> ' + name + '</div>' +
                  '<div><strong>Project Type:</strong> ' + pType + '</div>' +
                '</div>' +
                '<a id="bhr_wa_bridge_cta" href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="btn-whatsapp" style="display: inline-flex; width: 100%; max-width: 440px; min-height: 48px; font-size: 15px;">' +
                  'Continue on WhatsApp for Instant Consultation' +
                '</a>' +
                '<p style="font-size: 11px; color: #78716C; margin-top: 10px;">Clicking above opens WhatsApp with your project reference prefilled. You remain in complete control of sending the message.</p>' +
              '</div>';

            var waBtn = document.getElementById('bhr_wa_bridge_cta');
            if (waBtn) {
              waBtn.addEventListener('click', function() {
                if (window.__bhr_send_event) {
                  window.__bhr_send_event('whatsapp_outbound_click', { metadata: { enquiry_ref: refId } });
                }
              });
            }
          } catch(err) {
            fail(err.message || 'An unexpected error occurred.');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Submit Custom Order Enquiry';
            }
          }
        });
      })();
    </script>
  `;

  return renderBaseLayout({
    title: 'Custom Order Enquiry',
    description: 'Commission a custom 3D-printed and hand-finished sculpture or architectural model from our Ludhiana studio.',
    canonicalPath: '/custom-order',
    activeNav: 'custom-order',
    content,
    extraScripts
  });
}
