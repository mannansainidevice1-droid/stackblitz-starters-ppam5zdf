/**
 * BHAIRAVI Creations Digital Platform
 * Premium Editorial Home Page SSR View (Features F34–F39)
 * Target: src/server/views/home.view.ts
 */

import { BRAND_DRAFT_COPY, STUDIO_DETAILS, CUSTOM_COMMISSION_STEPS } from '../../shared/constants.js';
import { renderBaseLayout, escapeHtml } from './layout.view.js';
import { renderProductCard } from './components/product_card.component.js';
import { renderSectionHeader } from './components/ui.component.js';

export interface HomePageProps {
  settings?: Record<string, string>;
  featuredProducts?: any[];
}

export function renderHomePage(props: HomePageProps = {}): string {
  const { settings = {}, featuredProducts = [] } = props;

  const heroHeadline =
    settings['brand.hero_headline'] ||
    BRAND_DRAFT_COPY.hero_headline ||
    'Thoughtfully created. Precisely printed. Finished by hand.';

  const heroSubheadline =
    settings['brand.hero_subheadline'] ||
    BRAND_DRAFT_COPY.hero_subheadline ||
    'A family-run 3D-printing and handcrafted-products studio in Ludhiana, Punjab. Blending mathematical digital precision with timeless artisanal hand-finishing.';

  const content = `
    <!-- Section 1: Editorial Luxury Hero Section (Feature F35) -->
    <section class="hero-section relative overflow-hidden py-16 sm:py-24 border-b border-[#E2E8F0] bg-gradient-to-b from-[#FAF9F5] via-[#F5F4EE] to-[#FAF9F5]">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
        <!-- Studio Origin Badge -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] mb-8">
          <span class="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
          Family Artisanal Studio • Ludhiana, Punjab
        </div>

        <!-- Editorial Headline -->
        <h1 class="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#0B0F19] leading-[1.1] mb-6">
          ${escapeHtml(heroHeadline)}
        </h1>

        <!-- Subheading -->
        <p class="font-sans text-base sm:text-lg md:text-xl text-[#475569] leading-relaxed max-w-2xl mx-auto mb-10">
          ${escapeHtml(heroSubheadline)}
        </p>

        <!-- Primary Call-to-Action Group -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/products" class="w-full sm:w-auto btn btn-primary btn-lg shadow-sm">
            <span>Explore Catalogue</span>
            <svg class="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </a>
          <a href="/custom-order" class="w-full sm:w-auto btn btn-secondary btn-lg">
            <span>Custom Order Enquiry</span>
          </a>
        </div>

        <!-- Studio Metric Bento Strip -->
        <div class="mt-16 pt-10 border-t border-[#E2E8F0] grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div class="bento-metric p-4 rounded-xl bg-white/70 border border-[#E2E8F0]">
            <span class="block font-display text-2xl font-black text-[#0B0F19]">0.12mm</span>
            <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Layer Precision</span>
          </div>
          <div class="bento-metric p-4 rounded-xl bg-white/70 border border-[#E2E8F0]">
            <span class="block font-display text-2xl font-black text-[#0B0F19]">100%</span>
            <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Hand-Finished</span>
          </div>
          <div class="bento-metric p-4 rounded-xl bg-white/70 border border-[#E2E8F0]">
            <span class="block font-display text-2xl font-black text-[#0B0F19]">Ludhiana</span>
            <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Founded & Built</span>
          </div>
          <div class="bento-metric p-4 rounded-xl bg-white/70 border border-[#E2E8F0]">
            <span class="block font-display text-2xl font-black text-[#2563EB]">Zero-PII</span>
            <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Privacy Shield</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 2: Curated Featured Showcase (Feature F38) -->
    ${
      featuredProducts.length > 0
        ? `
      <section class="py-20 border-b border-[#E2E8F0] bg-white">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-widest text-[#2563EB] block mb-2">Artisanal Highlights</span>
              <h2 class="font-display text-3xl sm:text-4xl font-extrabold text-[#0B0F19]">Curated Masterpieces</h2>
            </div>
            <a href="/products" class="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8]">
              <span>View Full Catalogue</span>
              <svg class="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${featuredProducts.map((p) => renderProductCard(p)).join('')}
          </div>
        </div>
      </section>
    `
        : ''
    }

    <!-- Section 3: 4-Stage Craft Journey Visual Narrative (Feature F36) -->
    <section id="craft-journey" class="py-20 border-b border-[#E2E8F0] bg-[#FAF9F5]">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        ${renderSectionHeader({
          tag: 'Process & Mastery',
          title: 'The 4-Stage Craft Journey',
          subtitle: 'How our family workshop in Ludhiana unites mathematical additive precision with patient, human hand-finishing.',
          centered: true
        })}

        <!-- Interactive 4-Stage Stepper Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="craft-stepper">
          ${BRAND_DRAFT_COPY.craft_stages
            .map(
              (stage, idx) => `
            <div class="craft-stage-card bento-card relative flex flex-col justify-between cursor-pointer transition-all duration-300 ${idx === 0 ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 bg-white' : 'hover:border-[#CBD5E1] bg-white'}"
                 data-stage-index="${idx}"
                 onclick="window.selectCraftStage && window.selectCraftStage(${idx})">
              <div>
                <div class="w-10 h-10 rounded-xl ${idx === 0 ? 'bg-[#2563EB] text-white' : 'bg-[#EFF6FF] text-[#2563EB]'} font-display font-extrabold text-base flex items-center justify-center mb-5 transition-colors stage-badge">
                  0${stage.step}
                </div>
                <h3 class="font-display text-lg font-bold text-[#0B0F19] mb-2.5">
                  ${escapeHtml(stage.title)}
                </h3>
                <p class="text-xs text-[#475569] leading-relaxed">
                  ${escapeHtml(stage.desc)}
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] font-bold text-[#2563EB]">
                <span>Stage 0${stage.step}</span>
                <span>Inspect Stage &rarr;</span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Dynamic Craft Stage Deep-Dive Panel -->
        <div id="craft-stage-detail" class="mt-8 p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div class="md:col-span-2 space-y-3">
              <span id="detail-stage-pill" class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFF6FF] text-[#2563EB]">
                Stage 01 • Digital Phase
              </span>
              <h3 id="detail-stage-title" class="font-display text-2xl font-black text-[#0B0F19]">
                ${escapeHtml(BRAND_DRAFT_COPY.craft_stages[0].title)}
              </h3>
              <p id="detail-stage-desc" class="text-sm text-[#475569] leading-relaxed">
                ${escapeHtml(BRAND_DRAFT_COPY.craft_stages[0].desc)}
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[#F1F5F9] text-xs">
                <div>
                  <span class="text-[#94A3B8] font-bold text-[10px] uppercase block">Primary Tooling</span>
                  <strong id="detail-stage-tool" class="text-[#0B0F19]">Parametric CAD &amp; Blender</strong>
                </div>
                <div>
                  <span class="text-[#94A3B8] font-bold text-[10px] uppercase block">Studio Standard</span>
                  <strong id="detail-stage-standard" class="text-[#0B0F19]">Manifold Watertight Mesh</strong>
                </div>
                <div>
                  <span class="text-[#94A3B8] font-bold text-[10px] uppercase block">Inspection Gate</span>
                  <strong id="detail-stage-gate" class="text-[#0B0F19]">Structural Honeycomb Check</strong>
                </div>
              </div>
            </div>

            <!-- Visual Stage Badge Preview -->
            <div class="p-6 rounded-2xl bg-[#FAF9F5] border border-[#CBD5E1] text-center space-y-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Studio Workmanship</span>
              <div class="font-display text-3xl font-black text-[#0B0F19]">100%</div>
              <p class="text-xs text-[#64748B]">Individually sculpted and hand-finished in Ludhiana, Punjab.</p>
              <a href="/custom-order" class="btn btn-primary btn-sm w-full mt-3">Start Custom Project &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 4: Family Studio Origin Story (Feature F37) -->
    <section id="studio-story" class="py-20 border-b border-[#E2E8F0] bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <!-- Text Narrative (7 cols) -->
          <div class="lg:col-span-7 space-y-6">
            <span class="text-xs font-bold uppercase tracking-widest text-[#2563EB] block">Founded in Ludhiana, Punjab</span>
            <h2 class="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#0B0F19] leading-tight">
              A Family Studio Dedicated to Additive Artistry
            </h2>
            <p class="text-base sm:text-lg text-[#475569] leading-relaxed">
              BHAIRAVI Creations was born in Ludhiana out of a profound passion for sculpture and digital craft. Rather than treating 3D printing as mass production, we approach each machine as a modern sculptor's chisel.
            </p>
            <p class="text-base text-[#475569] leading-relaxed">
              Every piece begins as high-density CAD geometry, formed layer-by-layer at 0.12mm in PLA / PLA Pro. From there, human hands take over: hours of progressive wet sanding, sealing, multi-layered acrylics, and genuine patinas until the sculpture carries weight, warmth, and soul.
            </p>

            <div class="pt-4 flex flex-wrap gap-3">
              <a href="/about" class="btn btn-secondary btn-md">Read Our Full Story</a>
              <a href="https://wa.me/${STUDIO_DETAILS.whatsapp_number}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-md">
                Chat with Founders
              </a>
            </div>
          </div>

          <!-- Bento Detail Callout (5 cols) -->
          <div class="lg:col-span-5 space-y-4">
            <div class="bento-card bg-[#F8FAFC]">
              <span class="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">Studio Workshop</span>
              <h4 class="font-display text-lg font-bold text-[#0B0F19] mb-2">${escapeHtml(STUDIO_DETAILS.address)}</h4>
              <p class="text-xs text-[#475569]">GSTIN: ${escapeHtml(STUDIO_DETAILS.gstin)} (State Code 03 Punjab)</p>
            </div>
            <div class="bento-card bg-[#F8FAFC]">
              <span class="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">Standard Studio Dispatch</span>
              <h4 class="font-display text-lg font-bold text-[#0B0F19] mb-2">3 to 7 Business Days</h4>
              <p class="text-xs text-[#475569]">Individually made to order. Carefully inspected and securely packaged in shock-absorbent eco-padding.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 5: Custom Order Commission Process -->
    <section class="py-20 border-b border-[#E2E8F0] bg-[#FAF9F5]">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        ${renderSectionHeader({
          tag: 'Tailored Commissions',
          title: 'Custom 3D Sculptures & Architectural Models',
          subtitle: 'From personal deity idols to corporate gifting and precision replacement parts, our studio transforms your vision into tangible reality.',
          centered: true
        })}

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${CUSTOM_COMMISSION_STEPS.map(
            (step) => `
            <div class="bento-card flex flex-col justify-between">
              <div>
                <span class="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#EFF6FF] text-[#2563EB] mb-4">
                  Step 0${step.step}
                </span>
                <h3 class="font-display text-xl font-bold text-[#0B0F19] mb-3">${escapeHtml(step.title)}</h3>
                <p class="text-sm text-[#475569] leading-relaxed">${escapeHtml(step.desc)}</p>
              </div>
            </div>
          `
          ).join('')}
        </div>

        <div class="mt-12 text-center">
          <a href="/custom-order" class="btn btn-cobalt btn-lg shadow-sm">
            <span>Start a Custom Order Enquiry</span>
            <svg class="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </a>
        </div>
      </div>
    </section>

    <!-- Section 6: Verified Amazon & WhatsApp Trust Channels (Feature F39) -->
    <section class="py-20 bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Amazon Trust Card -->
          <div class="bento-card p-8 sm:p-10 flex flex-col justify-between border-2 border-[#CBD5E1] hover:border-[#0B0F19]">
            <div>
              <div class="flex items-center gap-3 mb-4">
                <span class="w-3 h-3 rounded-full bg-[#FF9900]"></span>
                <h3 class="font-display text-xl font-black text-[#0B0F19]">Amazon India Official Storefront</h3>
              </div>
              <p class="text-sm sm:text-base text-[#475569] leading-relaxed mb-6">
                Prefer Amazon Prime logistics? Explore our verified catalogue fulfilled directly with 1–2 day shipping and standard Amazon payment protections.
              </p>
            </div>
            <a href="${STUDIO_DETAILS.amazon_store_url}"
               target="_blank"
               rel="noopener noreferrer"
               data-tracking-cta="amazon_card"
               class="btn btn-primary btn-md w-full">
              <span>Visit Amazon Storefront &rarr;</span>
            </a>
          </div>

          <!-- WhatsApp Direct Consultation Card -->
          <div class="bento-card p-8 sm:p-10 flex flex-col justify-between border-2 border-[#CBD5E1] hover:border-[#059669]">
            <div>
              <div class="flex items-center gap-3 mb-4">
                <span class="w-3 h-3 rounded-full bg-[#059669]"></span>
                <h3 class="font-display text-xl font-black text-[#0B0F19]">Direct WhatsApp Artisan Line</h3>
              </div>
              <p class="text-sm sm:text-base text-[#475569] leading-relaxed mb-6">
                Have custom dimension requirements, special paint finishes, or corporate orders? Speak directly with the artisans crafting your pieces in Ludhiana.
              </p>
            </div>
            <a href="https://wa.me/${STUDIO_DETAILS.whatsapp_number}"
               target="_blank"
               rel="noopener noreferrer"
               data-tracking-cta="whatsapp_card"
               class="btn btn-whatsapp btn-md w-full">
              <span>Open WhatsApp Consultation (+91 73472 78010)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  `;

  const extraScripts = `
    <script>
      (function() {
        var stages = [
          {
            pill: 'Stage 01 • Digital Phase',
            title: 'Digital Sculpting & Parametric Design',
            desc: 'Every creation originates as precision CAD geometry or high-definition digital sculpture, optimized for structural integrity and mathematical harmony.',
            tool: 'Parametric CAD & Blender',
            standard: 'Manifold Watertight Mesh',
            gate: 'Structural Honeycomb Check'
          },
          {
            pill: 'Stage 02 • Additive Core',
            title: '0.12mm Ultra-Fine Additive Layering',
            desc: 'Printed on calibrated high-precision machines using biodegradable PLA / PLA Pro. Microscopic 0.12mm layer slicing ensures subtle organic curves without stair-stepping.',
            tool: '0.4mm Hardened Steel Nozzle (215°C)',
            standard: '0.12mm (120μm) Layer Height',
            gate: 'Layer Adhesion & Dial Caliper Verification'
          },
          {
            pill: 'Stage 03 • Hand Preparation',
            title: 'Progressive Triple Wet-Sanding',
            desc: 'Mechanical raw prints undergo hours of careful hand preparation: progressively wet-sanded across 400, 600, and 800 grits to erase extrusion seams and achieve smooth stone texture.',
            tool: 'Silicon Carbide Wet Sandpaper (400-800)',
            standard: 'Tactile Silk-Matte Surface',
            gate: '5000K Oblique Light Seam Inspection'
          },
          {
            pill: 'Stage 04 • Artisanal Mastery',
            title: 'Artisanal Patina, Gilding & Sealant',
            desc: 'Multi-layer acrylic washes, genuine copper dry-brushing, antique bronze patinas, and gold leafing are applied by hand, finished with a UV-resistant matte protective seal.',
            tool: 'Cold-Cast Patinas & Acrylic Washes',
            standard: 'Hand-Gilded Museum Quality',
            gate: 'UV & Touch-Safe Matte Sealant'
          }
        ];

        window.selectCraftStage = function(idx) {
          var stage = stages[idx];
          if (!stage) return;

          var cards = document.querySelectorAll('.craft-stage-card');
          cards.forEach(function(card, cIdx) {
            var badge = card.querySelector('.stage-badge');
            if (cIdx === idx) {
              card.classList.add('border-[#2563EB]', 'ring-2', 'ring-[#2563EB]/20');
              card.classList.remove('hover:border-[#CBD5E1]');
              if (badge) {
                badge.classList.add('bg-[#2563EB]', 'text-white');
                badge.classList.remove('bg-[#EFF6FF]', 'text-[#2563EB]');
              }
            } else {
              card.classList.remove('border-[#2563EB]', 'ring-2', 'ring-[#2563EB]/20');
              card.classList.add('hover:border-[#CBD5E1]');
              if (badge) {
                badge.classList.remove('bg-[#2563EB]', 'text-white');
                badge.classList.add('bg-[#EFF6FF]', 'text-[#2563EB]');
              }
            }
          });

          var pill = document.getElementById('detail-stage-pill');
          var title = document.getElementById('detail-stage-title');
          var desc = document.getElementById('detail-stage-desc');
          var tool = document.getElementById('detail-stage-tool');
          var std = document.getElementById('detail-stage-standard');
          var gate = document.getElementById('detail-stage-gate');

          if (pill) pill.textContent = stage.pill;
          if (title) title.textContent = stage.title;
          if (desc) desc.textContent = stage.desc;
          if (tool) tool.textContent = stage.tool;
          if (std) std.textContent = stage.standard;
          if (gate) gate.textContent = stage.gate;
        };
      })();
    </script>
  `;

  return renderBaseLayout({
    title: 'Handcrafted 3D Printing Studio Ludhiana',
    description: heroSubheadline,
    canonicalPath: '/',
    activeNav: 'home',
    content,
    extraScripts
  });
}
