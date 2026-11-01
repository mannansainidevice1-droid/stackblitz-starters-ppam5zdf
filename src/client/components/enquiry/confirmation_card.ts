/// <reference lib="dom" />
/**
 * BHAIRAVI Creations Digital Platform
 * Custom Order Confirmation Card & WhatsApp Bridge Component
 * Target: src/client/components/enquiry/confirmation_card.ts
 */

import { telemetry } from '../../tracking/telemetry.js';

export interface ConfirmationData {
  enquiry_id: string;
  customer_name: string;
  project_type: string;
  approximate_quantity: number;
  budget_range_inr?: string;
  whatsapp_url: string;
}

export function buildEnquiryWhatsAppUrl(enquiryId: string, customerName: string, projectType: string): string {
  const cleanPhone = '917347278010';
  const text = `Hello BHAIRAVI Creations!\n\nI submitted Custom Order Enquiry #${enquiryId} for: ${projectType}.\nName: ${customerName}.\nLooking forward to discussing materials and finishing options.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function renderConfirmationCard(data: ConfirmationData): string {
  const waUrl = data.whatsapp_url || buildEnquiryWhatsAppUrl(data.enquiry_id, data.customer_name, data.project_type);

  return `
    <div class="confirmation-card bg-white border border-[#E7E5E4] rounded-lg p-8 shadow-sm max-w-2xl mx-auto text-center" role="alert" aria-live="polite">
      <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#ECFDF5] mb-4">
        <svg class="h-8 w-8 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 class="text-2xl font-serif font-bold text-[#1C1917] mb-2">Enquiry Received with Gratitude</h2>
      <p class="text-sm text-[#78716C] mb-6">
        Our founding artisans will review your CAD/design details and reply within 24 hours.
      </p>

      <div class="bg-[#FAF9F6] border border-[#E7E5E4] rounded-md p-4 mb-6 text-left">
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-[#78716C] block">Reference Code:</span>
            <span class="font-mono font-bold text-[#1C1917] text-sm">${data.enquiry_id}</span>
          </div>
          <div>
            <span class="text-[#78716C] block">Customer Name:</span>
            <span class="font-medium text-[#1C1917]">${data.customer_name}</span>
          </div>
          <div>
            <span class="text-[#78716C] block">Project Category:</span>
            <span class="capitalize text-[#1C1917]">${data.project_type.replace(/_/g, ' ')}</span>
          </div>
          <div>
            <span class="text-[#78716C] block">Quantity & Budget:</span>
            <span class="text-[#1C1917]">${data.approximate_quantity} units ${data.budget_range_inr ? `(${data.budget_range_inr})` : ''}</span>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <a id="bhr_wa_bridge_cta"
           href="${waUrl}"
           target="_blank"
           rel="noopener noreferrer"
           class="inline-flex items-center justify-center w-full px-6 py-3.5 border border-transparent text-base font-medium rounded-md text-white bg-[#059669] hover:bg-[#047857] shadow transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#059669]">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
          </svg>
          Continue on WhatsApp for Instant Consultation
        </a>

        <p class="text-xs text-[#78716C]">
          Clicking above opens WhatsApp with your project reference prefilled. You remain in complete control of sending the message.
        </p>
      </div>
    </div>
  `;
}

export function attachConfirmationListeners(container: HTMLElement, data: ConfirmationData): void {
  const waBtn = container.querySelector('#bhr_wa_bridge_cta');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      try {
        telemetry.trackEvent('whatsapp_outbound_click', {
          metadata: { enquiry_id: data.enquiry_id }
        });
      } catch (e) {
        console.warn('Telemetry error', e);
      }
    });
  }
}
