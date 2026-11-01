/// <reference lib="dom" />
/**
 * BHAIRAVI Creations Digital Platform
 * Custom Order Enquiry Form & Client Validation Engine
 * Target: src/client/scripts/custom_order.client.ts
 */

import { telemetry } from '../tracking/telemetry.js';
import { SafeUploadZone } from '../components/enquiry/upload_zone.js';
import { renderConfirmationCard, attachConfirmationListeners } from '../components/enquiry/confirmation_card.js';

export function initCustomOrderClient(): void {
  if (typeof document === 'undefined') return;

  const form = document.getElementById('custom-order-form') as HTMLFormElement | null;
  const formContainer = document.getElementById('enquiry-form-container');
  if (!form || !formContainer) return;

  let hasStarted = false;
  let attachedFiles: File[] = [];

  // Initialize Safe Upload Zone
  let uploadZone: SafeUploadZone | null = null;
  const uploadZoneEl = document.getElementById('enquiry-upload-zone');
  if (uploadZoneEl) {
    uploadZone = new SafeUploadZone('enquiry-upload-zone', {
      maxFiles: 3,
      maxSizeBytes: 10 * 1024 * 1024,
      onFilesChanged: (files) => {
        attachedFiles = files;
      }
    });
  }

  // Track enquiry_form_start on first interaction
  form.addEventListener('focusin', () => {
    if (!hasStarted) {
      hasStarted = true;
      telemetry.trackEvent('enquiry_form_start', {
        page_path: '/custom-order',
        metadata: { form_name: 'custom_order_v1' }
      });
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('customer_name') as HTMLInputElement | null;
    const phoneInput = document.getElementById('contact_phone') as HTMLInputElement | null;
    const emailInput = document.getElementById('contact_email') as HTMLInputElement | null;
    const methodSelect = document.getElementById('preferred_contact_method') as HTMLSelectElement | null;
    const typeSelect = document.getElementById('project_type') as HTMLSelectElement | null;
    const descTextarea = document.getElementById('design_description') as HTMLTextAreaElement | null;
    const qtyInput = document.getElementById('approximate_quantity') as HTMLInputElement | null;
    const budgetSelect = document.getElementById('budget_range_inr') as HTMLSelectElement | null;
    const refProductInput = document.getElementById('referenced_product_id') as HTMLInputElement | null;
    const honeypotInput = document.getElementById('bhr_check_field') as HTMLInputElement | null;
    const renderedAtInput = document.getElementById('rendered_at') as HTMLInputElement | null;
    const submitBtn = document.getElementById('enquiry-submit-btn') as HTMLButtonElement | null;
    const errorAlert = document.getElementById('form-error-alert');

    function showError(msg: string) {
      if (errorAlert) {
        errorAlert.textContent = msg;
        errorAlert.classList.remove('hidden');
        errorAlert.style.display = 'block';
      } else {
        alert(msg);
      }
    }

    if (errorAlert) {
      errorAlert.classList.add('hidden');
      errorAlert.style.display = 'none';
    }

    // 1. Validate Customer Name
    const customerName = (nameInput?.value || '').trim();
    if (customerName.length < 2) {
      showError('Please provide a valid name (minimum 2 characters).');
      nameInput?.focus();
      return;
    }

    // 2. Validate Indian Phone Number (+91...)
    let contactPhone = (phoneInput?.value || '').trim();
    if (/^[6789]\d{9}$/.test(contactPhone)) {
      contactPhone = '+91' + contactPhone;
    } else if (/^91[6789]\d{9}$/.test(contactPhone)) {
      contactPhone = '+' + contactPhone;
    }
    if (!/^\+91[6789]\d{9}$/.test(contactPhone)) {
      showError('Please enter a valid 10-digit Indian mobile number (e.g. +91 98765 43210).');
      phoneInput?.focus();
      return;
    }

    // 3. Validate Contact Email if provided
    const contactEmail = (emailInput?.value || '').trim();
    if (contactEmail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      showError('Please enter a valid email address or leave it blank.');
      emailInput?.focus();
      return;
    }

    // 4. Validate Project Type
    const projectType = typeSelect?.value || 'custom_figurine';

    // 5. Validate Design Description
    const designDesc = (descTextarea?.value || '').trim();
    if (designDesc.length < 10) {
      showError('Please describe your design in a bit more detail (minimum 10 characters) for accurate craftsman feasibility.');
      descTextarea?.focus();
      return;
    }

    // 6. Validate Quantity
    const qty = parseInt(qtyInput?.value || '1', 10);
    if (isNaN(qty) || qty < 1) {
      showError('Approximate quantity must be at least 1.');
      qtyInput?.focus();
      return;
    }

    // 7. Render Duration / Anti-Bot Check
    const renderedAt = parseInt(renderedAtInput?.value || '0', 10);
    const elapsed = Date.now() - renderedAt;
    if (elapsed < 2500) {
      showError('Submission completed too quickly. Please review your details.');
      return;
    }

    // 8. Honeypot check
    const honeypot = (honeypotInput?.value || '').trim();

    // Prepare FormData
    const formData = new FormData();
    formData.append('customer_name', customerName);
    formData.append('contact_phone', contactPhone);
    if (contactEmail) formData.append('contact_email', contactEmail);
    formData.append('preferred_contact_method', methodSelect?.value || 'whatsapp');
    formData.append('project_type', projectType);
    formData.append('design_description', designDesc);
    formData.append('approximate_quantity', qty.toString());
    if (budgetSelect?.value) formData.append('budget_range_inr', budgetSelect.value);
    if (refProductInput?.value) formData.append('referenced_product_id', refProductInput.value);
    if (honeypot) formData.append('bhr_check_field', honeypot);
    formData.append('rendered_at', renderedAt.toString());

    // Attach first file if present
    if (attachedFiles.length > 0) {
      formData.append('attachment', attachedFiles[0]);
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Transmitting to Artisans...';
    }

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit enquiry. Please try again.');
      }

      const enquiryId = result.enquiry_id || `BC-ENQ-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const whatsappUrl = result.whatsapp_url || '';

      // Telemetry: enquiry_form_submit without PII
      telemetry.trackEvent('enquiry_form_submit', {
        page_path: '/custom-order',
        metadata: {
          enquiry_ref: enquiryId,
          project_type: projectType
        }
      });

      // Render Confirmation Card in place of form
      formContainer.innerHTML = renderConfirmationCard({
        enquiry_id: enquiryId,
        customer_name: customerName,
        project_type: projectType,
        approximate_quantity: qty,
        budget_range_inr: budgetSelect?.value,
        whatsapp_url: whatsappUrl
      });

      attachConfirmationListeners(formContainer, {
        enquiry_id: enquiryId,
        customer_name: customerName,
        project_type: projectType,
        approximate_quantity: qty,
        whatsapp_url: whatsappUrl
      });

      window.scrollTo({ top: formContainer.offsetTop - 80, behavior: 'smooth' });
    } catch (err: any) {
      showError(err.message || 'An unexpected network error occurred.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Custom Order Enquiry';
      }
    }
  });
}

// Auto-run if loaded directly in browser
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initCustomOrderClient();
  });
}
