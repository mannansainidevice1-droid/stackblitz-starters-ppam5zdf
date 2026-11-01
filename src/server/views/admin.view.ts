/**
 * BHAIRAVI Creations Digital Platform
 * Premium Editorial Admin Dashboard & Management Portal (Feature R3)
 * Target: src/server/views/admin.view.ts
 */

import { renderBaseLayout, escapeHtml } from './layout.view.js';
import { SessionUser } from '../auth/types.js';

export interface AdminPageProps {
  user?: SessionUser | null;
  error?: string | null;
  categories?: any[];
}

export function renderAdminPage(props: AdminPageProps = {}): string {
  const { user, categories = [] } = props;

  if (!user) {
    // Unauthenticated: Render Editorial Admin Login Interface
    const loginHtml = `
      <div class="min-h-[75vh] flex items-center justify-center py-16 px-4">
        <div class="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-8 sm:p-10 shadow-sm">
          <div class="text-center mb-8">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] mb-3">
              Internal Atelier Access Only
            </span>
            <h1 class="font-display text-3xl font-black text-[#0B0F19] tracking-tight">
              Admin Portal
            </h1>
            <p class="text-sm text-[#64748B] mt-2">
              Sign in to manage catalog items, process custom orders, and inspect studio diagnostics.
            </p>
          </div>

          <div id="login-error" class="hidden p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 mb-6" role="alert"></div>

          <form id="admin-login-form" class="space-y-5">
            <div>
              <label for="username" class="form-label">
                Username or Staff Email <span class="text-[#2563EB]">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                autocomplete="username"
                class="form-input"
                placeholder="admin or bhairavi_admin"
              />
            </div>

            <div>
              <label for="password" class="form-label">
                Password <span class="text-[#2563EB]">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autocomplete="current-password"
                class="form-input"
                placeholder="••••••••••••"
              />
            </div>

            <button type="submit" id="login-btn" class="btn btn-primary btn-lg w-full">
              Sign In to Dashboard
            </button>
          </form>

          <div class="mt-8 pt-6 border-t border-[#F1F5F9] text-center">
            <p class="text-xs text-[#94A3B8]">
              Protected by server-side rate-limiting and timing-safe authentication. Studio: Ludhiana, Punjab.
            </p>
          </div>
        </div>
      </div>

      <script>
        (function() {
          var form = document.getElementById('admin-login-form');
          var errDiv = document.getElementById('login-error');
          var btn = document.getElementById('login-btn');
          if (!form) return;

          form.addEventListener('submit', async function(e) {
            e.preventDefault();
            errDiv.classList.add('hidden');
            btn.disabled = true;
            btn.textContent = 'Verifying credentials...';

            var fd = new FormData(form);
            var body = Object.fromEntries(fd.entries());

            try {
              var res = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });
              var data = await res.json();

              if (!res.ok) {
                errDiv.textContent = data.error || 'Authentication failed.';
                errDiv.classList.remove('hidden');
                btn.disabled = false;
                btn.textContent = 'Sign In to Dashboard';
              } else {
                window.location.reload();
              }
            } catch (err) {
              errDiv.textContent = 'Network error during login.';
              errDiv.classList.remove('hidden');
              btn.disabled = false;
              btn.textContent = 'Sign In to Dashboard';
            }
          });
        })();
      </script>
    `;

    return renderBaseLayout({
      title: 'Admin Sign In',
      description: 'Internal BHAIRAVI Creations Administrative Login',
      canonicalPath: '/admin',
      content: loginHtml
    });
  }

  // Authenticated Admin Dashboard Interface
  const dashboardHtml = `
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Top Atelier Header Bar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#0B0F19] text-white">
              Studio Portal
            </span>
            <span class="text-xs font-semibold text-[#64748B]">Ludhiana, Punjab Atelier</span>
          </div>
          <h1 class="font-display text-2xl sm:text-3xl font-black text-[#0B0F19] mt-1.5 tracking-tight">
            Administrative Operations
          </h1>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0B0F19]">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>${escapeHtml(user.username || 'Admin')}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'superadmin' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-[#F1F5F9] text-[#64748B]'}">
              ${escapeHtml(user.role)}
            </span>
          </div>

          <a href="/products" target="_blank" class="btn btn-secondary btn-sm">
            <span>View Storefront &rarr;</span>
          </a>

          <button id="logout-btn" class="btn btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50">
            Sign Out
          </button>
        </div>
      </div>

      <!-- Navigation Tabs Bar -->
      <div class="flex items-center gap-2 mt-6 p-1.5 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] overflow-x-auto">
        <button onclick="switchTab('overview')" id="tab-overview" class="tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-[#64748B] hover:text-[#0B0F19]">
          Studio Overview &amp; KPIs
        </button>
        <button onclick="switchTab('products')" id="tab-products" class="tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-[#64748B] hover:text-[#0B0F19]">
          Product Catalogue (<span id="tab-prod-count">-</span>)
        </button>
        <button onclick="switchTab('enquiries')" id="tab-enquiries" class="tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-[#64748B] hover:text-[#0B0F19]">
          Custom Order Inquiries (<span id="tab-enq-count">-</span>)
        </button>
        <button onclick="switchTab('exports')" id="tab-exports" class="tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-[#64748B] hover:text-[#0B0F19]">
          BI Reports &amp; Data Exports
        </button>
      </div>

      <!-- TAB 1: OVERVIEW & KPIS -->
      <div id="content-overview" class="tab-content mt-8 space-y-8">
        <!-- 4 KPI Bento Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div class="bento-card p-6 bg-white border border-[#E2E8F0] rounded-2xl">
            <span class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Active Catalog Pieces</span>
            <div id="kpi-catalog-count" class="font-display text-3xl font-black text-[#0B0F19] mt-2">-</div>
            <p class="text-xs text-[#94A3B8] mt-1">Ready for 3D print dispatch</p>
          </div>

          <div class="bento-card p-6 bg-white border border-[#E2E8F0] rounded-2xl">
            <span class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Custom Order Inquiries</span>
            <div id="kpi-enquiries" class="font-display text-3xl font-black text-[#2563EB] mt-2">-</div>
            <p class="text-xs text-[#94A3B8] mt-1">Registered from storefront</p>
          </div>

          <div class="bento-card p-6 bg-white border border-[#E2E8F0] rounded-2xl">
            <span class="text-xs font-bold uppercase tracking-wider text-[#64748B]">WhatsApp Consultations</span>
            <div id="kpi-whatsapp-clicks" class="font-display text-3xl font-black text-emerald-600 mt-2">-</div>
            <p class="text-xs text-[#94A3B8] mt-1">Measured client chat intents</p>
          </div>

          <div class="bento-card p-6 bg-white border border-[#E2E8F0] rounded-2xl">
            <span class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Amazon Outbound Intends</span>
            <div id="kpi-amazon-clicks" class="font-display text-3xl font-black text-[#D97706] mt-2">-</div>
            <p class="text-xs text-[#94A3B8] mt-1">Tracked marketplace referrals</p>
          </div>
        </div>

        <!-- Attribution Integrity Notice -->
        <div class="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3 text-xs text-[#92400E]">
          <span class="text-base mt-0.5">ℹ️</span>
          <div>
            <strong class="font-bold text-[#78350F]">Attribution Integrity Guaranteed:</strong>
            <p class="mt-0.5 leading-relaxed">
              Outbound Amazon and WhatsApp links represent measured intent. Without direct post-checkout callbacks, external sales are strictly classified as <code class="font-mono bg-white px-1 py-0.5 rounded border border-[#FDE68A]">"purchase_outcome_unknown"</code> rather than fabricated conversion counts.
            </p>
          </div>
        </div>
      </div>

      <!-- TAB 2: PRODUCTS CATALOGUE -->
      <div id="content-products" class="tab-content mt-8 hidden space-y-6">
        <div class="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 class="font-display text-xl font-black text-[#0B0F19]">Product Catalogue</h2>
              <p class="text-xs text-[#64748B] mt-1">
                Add new pieces, update pricing, manage stock levels, and customize technical specs.
              </p>
            </div>
            <button onclick="openProductModal(null)" class="btn btn-primary btn-md">
              + Add New Creation
            </button>
          </div>

          <!-- Product Data Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider">
                  <th class="py-3 px-3">Item</th>
                  <th class="py-3 px-3">Category</th>
                  <th class="py-3 px-3">Base Price</th>
                  <th class="py-3 px-3">Inventory / Stock</th>
                  <th class="py-3 px-3">Status</th>
                  <th class="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="products-table-body" class="divide-y divide-[#F1F5F9]">
                <tr><td colspan="6" class="py-12 text-center text-[#94A3B8]">Loading catalogue creations...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: CUSTOM ORDER ENQUIRIES -->
      <div id="content-enquiries" class="tab-content mt-8 hidden space-y-6">
        <div class="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 class="font-display text-xl font-black text-[#0B0F19]">Custom Order Inquiries</h2>
              <p class="text-xs text-[#64748B] mt-1">
                Review client commission briefs, inspect reference attachments, and log craftsmanship notes.
              </p>
            </div>
          </div>

          <!-- Enquiries Rich Data Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider">
                  <th class="py-3 px-3">Ref &amp; Date</th>
                  <th class="py-3 px-3">Customer Contact</th>
                  <th class="py-3 px-3">Project &amp; Budget</th>
                  <th class="py-3 px-3">Design Description</th>
                  <th class="py-3 px-3">Reference / CAD</th>
                  <th class="py-3 px-3">Status</th>
                  <th class="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="enquiries-table-body" class="divide-y divide-[#F1F5F9]">
                <tr><td colspan="7" class="py-12 text-center text-[#94A3B8]">Loading custom order inquiries...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: BI EXPORTS -->
      <div id="content-exports" class="tab-content mt-8 hidden space-y-6">
        <div class="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 class="font-display text-xl font-black text-[#0B0F19] mb-2">Export Studio Business Data</h2>
          <p class="text-xs text-[#64748B] mb-6 leading-relaxed max-w-2xl">
            Download verified, mathematically reconcilable reports for AI models, audit logs, or spreadsheets. Complies strictly with RFC 4180 and CSV formula injection prevention.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E2E8F0] space-y-3">
              <span class="text-xs font-bold text-[#0B0F19]">Raw Analytics Events</span>
              <p class="text-xs text-[#64748B]">Sanitized event stream with zero-PII guarantee.</p>
              <div class="flex gap-2 pt-2">
                <a href="/api/admin/exports/events.csv" download class="btn btn-secondary btn-sm">CSV</a>
                <a href="/api/admin/exports/events.json" download class="btn btn-secondary btn-sm">JSON</a>
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E2E8F0] space-y-3">
              <span class="text-xs font-bold text-[#0B0F19]">Daily Product Rollups</span>
              <p class="text-xs text-[#64748B]">Reconciled daily product metrics (&Delta; = 0).</p>
              <div class="flex gap-2 pt-2">
                <a href="/api/admin/exports/rollups.csv" download class="btn btn-secondary btn-sm">CSV</a>
                <a href="/api/admin/exports/rollups.json" download class="btn btn-secondary btn-sm">JSON</a>
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E2E8F0] space-y-3">
              <span class="text-xs font-bold text-[#0B0F19]">Custom Order Inquiries</span>
              <p class="text-xs text-[#64748B]">Commission briefs with customer privacy guards.</p>
              <div class="flex gap-2 pt-2">
                <a href="/api/admin/exports/enquiries.csv" download class="btn btn-secondary btn-sm">CSV</a>
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E2E8F0] space-y-3">
              <span class="text-xs font-bold text-[#0B0F19]">Complete Catalog Snapshot</span>
              <p class="text-xs text-[#64748B]">All metadata with integer paise pricing.</p>
              <div class="flex gap-2 pt-2">
                <a href="/api/admin/exports/catalog.json" download class="btn btn-secondary btn-sm">JSON</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 1: ADD / EDIT PRODUCT -->
    <div id="product-modal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
        <div class="flex items-center justify-between pb-4 border-b border-[#F1F5F9] mb-5">
          <h2 id="product-modal-title" class="font-display text-xl font-black text-[#0B0F19]">Add Handcrafted Creation</h2>
          <button onclick="closeProductModal()" class="text-xl text-[#94A3B8] hover:text-[#0B0F19] transition-colors">&times;</button>
        </div>

        <form id="product-form" class="space-y-4">
          <input type="hidden" id="p-id" name="id" />

          <div>
            <label for="p-name" class="form-label">Piece Name / Title <span class="text-[#2563EB]">*</span></label>
            <input type="text" id="p-name" name="name" required class="form-input" placeholder="e.g. Vighnaharta Ganesha in Antique Bronze Patina" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="p-slug" class="form-label">URL Slug <span class="text-[#2563EB]">*</span></label>
              <input type="text" id="p-slug" name="slug" required class="form-input" placeholder="ganesha-antique-bronze" />
            </div>

            <div>
              <label for="p-price-inr" class="form-label">Price (INR ₹) <span class="text-[#2563EB]">*</span></label>
              <input type="number" id="p-price-inr" name="price_inr" step="0.01" min="0" required class="form-input" placeholder="1899.00" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="p-category" class="form-label">Category <span class="text-[#2563EB]">*</span></label>
              <select id="p-category" name="category_id" required class="form-select"></select>
            </div>

            <div>
              <label for="p-material" class="form-label">Material Core</label>
              <input type="text" id="p-material" name="material" value="High-Density Biodegradable PLA / PLA Pro" class="form-input" />
            </div>
          </div>

          <div>
            <label for="p-description" class="form-label">Editorial Description</label>
            <textarea id="p-description" name="description" rows="3" class="form-textarea" placeholder="Detailed craft description, layer resolution, finishing notes..."></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label for="p-weight" class="form-label">Weight (Grams)</label>
              <input type="number" id="p-weight" name="weight_grams" min="0" value="350" class="form-input" />
            </div>
            <div>
              <label for="p-inventory" class="form-label">Inventory Count</label>
              <input type="number" id="p-inventory" name="inventory_count" min="0" value="5" class="form-input" />
            </div>
            <div>
              <label for="p-lead-days" class="form-label">Production Lead Time</label>
              <input type="text" id="p-lead-days" name="production_lead_days" value="3-5 business days" class="form-input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="p-amazon-url" class="form-label">Amazon India URL (Optional)</label>
              <input type="url" id="p-amazon-url" name="amazon_url" placeholder="https://www.amazon.in/dp/..." class="form-input" />
            </div>
            <div>
              <label for="p-amazon-asin" class="form-label">Amazon ASIN</label>
              <input type="text" id="p-amazon-asin" name="amazon_asin" placeholder="B09XXXXXXX" class="form-input" />
            </div>
          </div>

          <!-- Toggles -->
          <div class="flex items-center gap-6 pt-2">
            <label class="flex items-center gap-2 text-xs font-semibold text-[#0B0F19] cursor-pointer">
              <input type="checkbox" id="p-made-to-order" name="is_made_to_order" class="rounded text-[#2563EB]" checked />
              <span>Allow "Made to Order"</span>
            </label>
            <label class="flex items-center gap-2 text-xs font-semibold text-[#0B0F19] cursor-pointer">
              <input type="checkbox" id="p-published" name="is_published" class="rounded text-[#2563EB]" checked />
              <span>Publish to Storefront</span>
            </label>
            <label class="flex items-center gap-2 text-xs font-semibold text-[#0B0F19] cursor-pointer">
              <input type="checkbox" id="p-featured" name="is_featured" class="rounded text-[#2563EB]" />
              <span>Featured on Homepage</span>
            </label>
          </div>

          <div class="flex justify-end gap-3 pt-5 border-t border-[#F1F5F9]">
            <button type="button" onclick="closeProductModal()" class="btn btn-secondary btn-md">Cancel</button>
            <button type="submit" id="save-product-btn" class="btn btn-primary btn-md">Save Creation</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: QUICK INVENTORY & AVAILABILITY -->
    <div id="stock-modal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-sm p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
          <h2 class="font-display text-lg font-black text-[#0B0F19]">Inventory Control</h2>
          <button onclick="closeStockModal()" class="text-xl text-[#94A3B8] hover:text-[#0B0F19]">&times;</button>
        </div>
        <form id="stock-form" class="space-y-4">
          <input type="hidden" id="stock-p-id" />
          <div>
            <label for="stock-inventory-count" class="form-label">Available Units on Hand</label>
            <input type="number" id="stock-inventory-count" min="0" required class="form-input" />
          </div>
          <div>
            <label class="flex items-center gap-2 text-xs font-semibold text-[#0B0F19] cursor-pointer">
              <input type="checkbox" id="stock-is-made-to-order" class="rounded text-[#2563EB]" />
              <span>Allow "Made to Order" when stock is 0</span>
            </label>
          </div>
          <div class="flex justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
            <button type="button" onclick="closeStockModal()" class="btn btn-secondary btn-sm">Cancel</button>
            <button type="submit" class="btn btn-primary btn-sm">Update Stock</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 3: CUSTOM ORDER FULL BRIEF & NOTES -->
    <div id="enquiry-modal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
        <div class="flex items-center justify-between pb-4 border-b border-[#F1F5F9] mb-5">
          <div class="flex items-center gap-3">
            <span id="enq-ref" class="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#F1F5F9] text-[#0B0F19]">#REF</span>
            <span id="enq-status-badge" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">STATUS</span>
          </div>
          <button onclick="closeEnquiryModal()" class="text-xl text-[#94A3B8] hover:text-[#0B0F19]">&times;</button>
        </div>

        <div class="space-y-5 text-xs text-[#475569]">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF9F5] border border-[#E2E8F0]">
            <div>
              <span class="text-[#94A3B8] uppercase tracking-wider font-bold text-[10px]">Client Name</span>
              <div id="enq-customer" class="font-bold text-sm text-[#0B0F19] mt-0.5">Customer Name</div>
            </div>
            <div>
              <span class="text-[#94A3B8] uppercase tracking-wider font-bold text-[10px]">Contact Info</span>
              <div id="enq-phone" class="font-semibold text-[#0B0F19] mt-0.5">Phone</div>
              <div id="enq-email" class="mt-0.5">Email</div>
            </div>
            <div>
              <span class="text-[#94A3B8] uppercase tracking-wider font-bold text-[10px]">Project Category</span>
              <div id="enq-category" class="font-bold text-[#0B0F19] mt-0.5">Category</div>
            </div>
            <div>
              <span class="text-[#94A3B8] uppercase tracking-wider font-bold text-[10px]">Budget &amp; Quantity</span>
              <div class="font-bold text-[#0B0F19] mt-0.5"><span id="enq-budget">-</span> • Qty: <span id="enq-quantity">1</span></div>
            </div>
          </div>

          <div id="enq-ref-prod-sec">
            <span class="text-[#94A3B8] uppercase tracking-wider font-bold text-[10px]">Referenced Catalogue Model</span>
            <div id="enq-ref-prod" class="font-bold text-[#2563EB] mt-0.5">None</div>
          </div>

          <div>
            <span class="text-[#94A3B8] uppercase tracking-wider font-bold text-[10px]">Customer Design Brief &amp; Finishing Specifications</span>
            <div id="enq-description" class="mt-1.5 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#0B0F19] whitespace-pre-wrap leading-relaxed"></div>
          </div>

          <div id="enq-attachments-section">
            <span class="text-[#94A3B8] uppercase tracking-wider font-bold text-[10px]">Uploaded Reference Files &amp; CAD</span>
            <div id="enq-attachments-list" class="mt-2 flex gap-3 flex-wrap"></div>
          </div>

          <!-- Workflow Status Transition Selector -->
          <div class="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span class="font-bold text-[#1E40AF]">Advance Order Stage:</span>
              <p class="text-[11px] text-[#3B82F6]">Strictly transitions forward according to studio policy.</p>
            </div>
            <div class="flex items-center gap-2">
              <select id="enq-status-select" class="form-select py-1.5 px-3 text-xs font-bold">
                <option value="new">NEW (Unreviewed)</option>
                <option value="contacted">CONTACTED</option>
                <option value="quoted">QUOTED</option>
                <option value="converted">CONVERTED (Order Placed)</option>
                <option value="closed">CLOSED / ARCHIVED</option>
              </select>
              <button onclick="updateEnquiryStatus()" class="btn btn-primary btn-sm">Update</button>
            </div>
          </div>

          <!-- Internal Atelier Notes & Timeline -->
          <div class="border-t border-[#F1F5F9] pt-4">
            <h4 class="font-bold text-xs uppercase tracking-wider text-[#0B0F19] mb-3">Atelier Timeline &amp; Notes</h4>
            <div id="enq-notes-list" class="space-y-2 mb-4"></div>

            <form id="enq-notes-form" class="flex gap-2">
              <input type="text" id="enq-new-note" placeholder="Add internal studio note (e.g. Quoted ₹3,200 on WhatsApp, 0.12mm bronze)..." class="form-input text-xs" />
              <button type="submit" class="btn btn-secondary btn-sm shrink-0">Log Note</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Client-side Admin Dashboard Engine -->
    <script>
      var CATEGORIES = ${JSON.stringify(categories)};
      var PROJECT_LABELS = {
        custom_figurine: 'Custom Deity / Figurine',
        architectural_model: 'Architectural Heritage Model',
        lithophane: 'Custom Lithophane / Lamp',
        corporate_gifting: 'Corporate / Event Gifting',
        replacement_part: 'Precision Replacement Part',
        other: 'Other Bespoke Creation'
      };

      var activeEnquiryId = null;

      function switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(function(b) {
          b.classList.remove('bg-white', 'text-[#0B0F19]', 'shadow-sm');
          b.classList.add('text-[#64748B]');
        });
        document.querySelectorAll('.tab-content').forEach(function(c) {
          c.classList.add('hidden');
        });

        var btn = document.getElementById('tab-' + tab);
        var content = document.getElementById('content-' + tab);
        if (btn) {
          btn.classList.add('bg-white', 'text-[#0B0F19]', 'shadow-sm');
          btn.classList.remove('text-[#64748B]');
        }
        if (content) content.classList.remove('hidden');

        if (tab === 'products') loadProducts();
        if (tab === 'enquiries') loadEnquiries();
      }

      async function loadKpis() {
        try {
          var res = await fetch('/api/admin/overview/kpis');
          if (res.ok) {
            var data = await res.json();
            var totals = data.totals || {};
            document.getElementById('kpi-catalog-count').innerText = totals.catalog_count || '10';
            document.getElementById('kpi-enquiries').innerText = totals.enquiries_submitted || 0;
            document.getElementById('kpi-whatsapp-clicks').innerText = totals.whatsapp_clicks || 0;
            document.getElementById('kpi-amazon-clicks').innerText = totals.amazon_clicks || 0;
          }
        } catch(e) {}
      }

      async function loadCategories() {
        if (CATEGORIES && CATEGORIES.length > 0) return;
        try {
          var res = await fetch('/api/admin/categories');
          if (res.ok) {
            var json = await res.json();
            CATEGORIES = json.data || [];
          }
        } catch(e) {}
      }

      async function loadProducts() {
        var tbody = document.getElementById('products-table-body');
        try {
          var res = await fetch('/api/admin/products');
          if (res.ok) {
            var json = await res.json();
            var products = json.data || [];
            window.__adminProducts = products;
            document.getElementById('tab-prod-count').textContent = products.length;

            if (products.length === 0) {
              tbody.innerHTML = '<tr><td colspan="6" class="py-12 text-center text-[#94A3B8]">No creations found in catalogue. Click "+ Add New Creation" above.</td></tr>';
              return;
            }

            tbody.innerHTML = products.map(function(p, idx) {
              var stockBadge = '';
              if (p.is_made_to_order) {
                stockBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">Made to Order</span>';
              } else if (p.inventory_count > 5) {
                stockBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">In Stock (' + p.inventory_count + ')</span>';
              } else if (p.inventory_count > 0) {
                stockBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">Low Stock (' + p.inventory_count + ')</span>';
              } else {
                stockBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700">Out of Stock</span>';
              }

              var visBadge = p.is_published 
                ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">Published</span>'
                : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">Draft</span>';

              var imgUrl = (p.gallery_images && p.gallery_images[0]?.public_url) || '/placeholder.svg';

              return '<tr class="hover:bg-[#FAF9F5] transition-colors">' +
                '<td class="py-3 px-3">' +
                  '<div class="flex items-center gap-3">' +
                    '<img src="' + imgUrl + '" class="w-10 h-10 rounded-lg object-cover bg-[#F1F5F9] border border-[#E2E8F0]" alt="' + p.name + '" />' +
                    '<div>' +
                      '<div class="font-bold text-[#0B0F19]">' + p.name + '</div>' +
                      '<div class="font-mono text-[10px] text-[#94A3B8]">/' + p.slug + '</div>' +
                    '</div>' +
                  '</div>' +
                '</td>' +
                '<td class="py-3 px-3 text-[#64748B] font-medium">' + (p.category?.name || '-') + '</td>' +
                '<td class="py-3 px-3 font-bold text-[#0B0F19]">₹' + (p.base_price_paise / 100).toFixed(2) + '</td>' +
                '<td class="py-3 px-3">' + stockBadge + '</td>' +
                '<td class="py-3 px-3">' + visBadge + '</td>' +
                '<td class="py-3 px-3 text-right">' +
                  '<div class="flex items-center justify-end gap-1.5">' +
                    '<a href="/products/' + p.slug + '" target="_blank" class="btn btn-ghost btn-sm">View</a>' +
                    '<button onclick="openProductModalByIndex(' + idx + ')" class="btn btn-secondary btn-sm">Edit</button>' +
                    '<button onclick="openStockModalByIndex(' + idx + ')" class="btn btn-secondary btn-sm">Stock</button>' +
                    '<button onclick="archiveProduct(\\'' + p.id + '\\')" class="btn btn-ghost btn-sm text-amber-600 hover:bg-amber-50">Archive</button>' +
                    '<button onclick="deleteProductByIndex(' + idx + ')" class="btn btn-ghost btn-sm text-red-600 hover:bg-red-50">Delete</button>' +
                  '</div>' +
                '</td>' +
              '</tr>';
            }).join('');
          }
        } catch(e) {
          tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-red-600">Failed to load catalogue.</td></tr>';
        }
      }

      function openProductModalByIndex(idx) {
        var p = window.__adminProducts && window.__adminProducts[idx];
        openProductModal(p);
      }

      function openStockModalByIndex(idx) {
        var p = window.__adminProducts && window.__adminProducts[idx];
        if (p) openStockModal(p.id, p.inventory_count, p.is_made_to_order ? 1 : 0);
      }

      function deleteProductByIndex(idx) {
        var p = window.__adminProducts && window.__adminProducts[idx];
        if (p) deleteProduct(p.id, p.name);
      }

      async function openProductModal(prod) {
        await loadCategories();
        var catSelect = document.getElementById('p-category');
        catSelect.innerHTML = CATEGORIES.map(function(c) {
          return '<option value="' + c.id + '">' + c.name + '</option>';
        }).join('');

        var modal = document.getElementById('product-modal');
        var title = document.getElementById('product-modal-title');
        var form = document.getElementById('product-form');
        form.reset();

        if (prod) {
          title.textContent = 'Edit Creation: ' + prod.name;
          document.getElementById('p-id').value = prod.id;
          document.getElementById('p-name').value = prod.name;
          document.getElementById('p-slug').value = prod.slug;
          document.getElementById('p-price-inr').value = (prod.base_price_paise / 100).toFixed(2);
          document.getElementById('p-category').value = prod.category_id || (CATEGORIES[0]?.id || '');
          document.getElementById('p-material').value = prod.material || 'High-Density Biodegradable PLA / PLA Pro';
          document.getElementById('p-description').value = prod.description || '';
          document.getElementById('p-weight').value = prod.weight_grams || 350;
          document.getElementById('p-inventory').value = prod.inventory_count || 0;
          document.getElementById('p-lead-days').value = prod.production_lead_days || '3-5 business days';
          document.getElementById('p-amazon-url').value = prod.amazon_url || '';
          document.getElementById('p-amazon-asin').value = prod.amazon_asin || '';
          document.getElementById('p-made-to-order').checked = Boolean(prod.is_made_to_order);
          document.getElementById('p-published').checked = Boolean(prod.is_published);
          document.getElementById('p-featured').checked = Boolean(prod.is_featured);
        } else {
          title.textContent = 'Add Handcrafted Creation';
          document.getElementById('p-id').value = '';
          document.getElementById('p-made-to-order').checked = true;
          document.getElementById('p-published').checked = true;
          document.getElementById('p-featured').checked = false;
        }

        modal.classList.remove('hidden');
      }

      function closeProductModal() {
        document.getElementById('product-modal').classList.add('hidden');
      }

      document.getElementById('product-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        var saveBtn = document.getElementById('save-product-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving Creation...';

        var id = document.getElementById('p-id').value;
        var inr = parseFloat(document.getElementById('p-price-inr').value || '0');
        var paise = Math.round(inr * 100);

        var payload = {
          name: document.getElementById('p-name').value.trim(),
          slug: document.getElementById('p-slug').value.trim(),
          category_id: document.getElementById('p-category').value,
          base_price_paise: paise,
          material: document.getElementById('p-material').value.trim(),
          description: document.getElementById('p-description').value.trim(),
          weight_grams: parseInt(document.getElementById('p-weight').value || '0', 10),
          inventory_count: parseInt(document.getElementById('p-inventory').value || '0', 10),
          production_lead_days: document.getElementById('p-lead-days').value.trim(),
          amazon_url: document.getElementById('p-amazon-url').value.trim() || null,
          amazon_asin: document.getElementById('p-amazon-asin').value.trim() || null,
          is_made_to_order: document.getElementById('p-made-to-order').checked ? 1 : 0,
          is_published: document.getElementById('p-published').checked ? 1 : 0,
          is_featured: document.getElementById('p-featured').checked ? 1 : 0
        };

        try {
          var res = await fetch(id ? '/api/admin/products/' + id : '/api/admin/products', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          var data = await res.json();
          if (res.ok && (data.success || data.product)) {
            closeProductModal();
            loadProducts();
          } else {
            alert(data.error || 'Failed to save creation.');
          }
        } catch(err) {
          alert('Network error while saving creation.');
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Creation';
        }
      });

      function openStockModal(id, count, isMadeToOrder) {
        document.getElementById('stock-p-id').value = id;
        document.getElementById('stock-inventory-count').value = count;
        document.getElementById('stock-is-made-to-order').checked = Boolean(isMadeToOrder);
        document.getElementById('stock-modal').classList.remove('hidden');
      }

      function closeStockModal() {
        document.getElementById('stock-modal').classList.add('hidden');
      }

      document.getElementById('stock-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        var id = document.getElementById('stock-p-id').value;
        var count = parseInt(document.getElementById('stock-inventory-count').value || '0', 10);
        var made = document.getElementById('stock-is-made-to-order').checked ? 1 : 0;

        try {
          var res = await fetch('/api/admin/products/' + id + '/availability', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inventory_count: count, is_made_to_order: made })
          });
          if (res.ok) {
            closeStockModal();
            loadProducts();
          } else {
            alert('Failed to update stock.');
          }
        } catch(err) {
          alert('Network error while updating stock.');
        }
      });

      async function archiveProduct(id) {
        if (!confirm('Archive this creation? It will be hidden from the storefront catalogue.')) return;
        try {
          var res = await fetch('/api/admin/products/' + id + '/status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'archived' })
          });
          if (res.ok) loadProducts();
          else alert('Failed to archive piece.');
        } catch(e) { alert('Network error.'); }
      }

      async function deleteProduct(id, name) {
        if (!confirm('Are you sure you want to permanently delete "' + name + '"?')) return;
        try {
          var res = await fetch('/api/admin/products/' + id, { method: 'DELETE' });
          if (res.ok) loadProducts();
          else alert('Failed to delete piece.');
        } catch(e) { alert('Network error.'); }
      }

      async function loadEnquiries() {
        var tbody = document.getElementById('enquiries-table-body');
        try {
          var res = await fetch('/api/admin/enquiries');
          if (res.ok) {
            var json = await res.json();
            var enquiries = json.data || [];
            window.__adminEnquiries = enquiries;
            document.getElementById('tab-enq-count').textContent = enquiries.length;

            if (enquiries.length === 0) {
              tbody.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-[#94A3B8]">No custom order inquiries submitted yet.</td></tr>';
              return;
            }

            tbody.innerHTML = enquiries.map(function(e, idx) {
              var catLabel = PROJECT_LABELS[e.project_type] || e.project_type || 'Custom Piece';
              var cleanPhoneDigits = (e.contact_phone || '').replace(/[^0-9]/g, '');
              
              var phoneHtml = '<a href="tel:' + e.contact_phone + '" class="font-bold text-[#0B0F19] hover:underline">' + e.contact_phone + '</a>';
              var waHtml = '<a href="https://wa.me/' + cleanPhoneDigits + '?text=' + encodeURIComponent('Hello ' + e.customer_name + '! Following up on your BHAIRAVI Creations custom order enquiry #' + e.id) + '" target="_blank" class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline">WhatsApp &rarr;</a>';
              
              var emailHtml = e.contact_email 
                ? '<div class="text-[11px] text-[#64748B]">' + e.contact_email + '</div>'
                : '<span title="No email provided (Phone/WhatsApp order)" class="inline-block text-[10px] font-extrabold bg-[#F1F5F9] text-[#64748B] px-1.5 py-0.5 rounded">A</span>';

              var statusColors = {
                new: 'bg-amber-50 text-amber-700 border-amber-200',
                contacted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                quoted: 'bg-purple-50 text-purple-700 border-purple-200',
                converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                closed: 'bg-slate-100 text-slate-600 border-slate-200'
              };
              var sc = statusColors[e.status] || 'bg-slate-100 text-slate-600 border-slate-200';

              var descShort = e.design_description || 'No description entered';
              if (descShort.length > 70) descShort = descShort.slice(0, 70) + '...';

              var attHtml = '<span class="text-[#94A3B8]">None</span>';
              if (e.attachments && e.attachments.length > 0) {
                var firstAtt = e.attachments[0];
                var isImg = /\\.(webp|jpg|jpeg|png)$/i.test(firstAtt.original_filename);
                if (isImg) {
                  attHtml = '<a href="' + firstAtt.public_url + '" target="_blank" class="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:underline">🖼️ Image</a>';
                } else {
                  attHtml = '<a href="' + firstAtt.public_url + '" target="_blank" download class="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:underline">📎 ' + (firstAtt.original_filename.slice(-7)) + '</a>';
                }
              }

              return '<tr class="hover:bg-[#FAF9F5] transition-colors">' +
                '<td class="py-3 px-3">' +
                  '<div class="font-mono text-xs font-bold text-[#0B0F19]">#' + e.id.slice(-6) + '</div>' +
                  '<div class="text-[10px] text-[#94A3B8]">' + new Date(e.created_at).toLocaleDateString() + '</div>' +
                '</td>' +
                '<td class="py-3 px-3">' +
                  '<div class="font-bold text-[#0B0F19]">' + e.customer_name + '</div>' +
                  '<div class="flex items-center gap-1.5 mt-0.5">' + phoneHtml + ' • ' + waHtml + ' ' + emailHtml + '</div>' +
                '</td>' +
                '<td class="py-3 px-3">' +
                  '<div class="font-bold text-[#0B0F19]">' + catLabel + '</div>' +
                  '<div class="text-[11px] text-[#64748B]">' + (e.budget_range_inr || 'Open') + ' • Qty: ' + (e.approximate_quantity || 1) + '</div>' +
                '</td>' +
                '<td class="py-3 px-3 max-w-[200px]">' +
                  '<div class="text-[#475569] leading-snug truncate" title="' + (e.design_description || '') + '">' + descShort + '</div>' +
                '</td>' +
                '<td class="py-3 px-3">' + attHtml + '</td>' +
                '<td class="py-3 px-3">' +
                  '<span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ' + sc + '">' +
                    e.status +
                  '</span>' +
                '</td>' +
                '<td class="py-3 px-3 text-right">' +
                  '<button onclick="openEnquiryModalByIndex(' + idx + ')" class="btn btn-secondary btn-sm">View Full Brief</button>' +
                '</td>' +
              '</tr>';
            }).join('');
          }
        } catch(e) {
          tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-red-600">Failed to load custom order inquiries.</td></tr>';
        }
      }

      function openEnquiryModalByIndex(idx) {
        var e = window.__adminEnquiries && window.__adminEnquiries[idx];
        if (e) openEnquiryModal(e.id);
      }

      async function openEnquiryModal(id) {
        activeEnquiryId = id;
        try {
          var res = await fetch('/api/admin/enquiries/' + id);
          if (!res.ok) throw new Error();
          var data = await res.json();
          var e = data.data;

          document.getElementById('enq-ref').textContent = '#' + e.id;
          document.getElementById('enq-customer').textContent = e.customer_name;
          
          var phoneEl = document.getElementById('enq-phone');
          var cleanPhone = (e.contact_phone || '').replace(/[^0-9]/g, '');
          phoneEl.innerHTML = '<a href="tel:' + e.contact_phone + '" class="text-[#2563EB] font-bold hover:underline">' + e.contact_phone + '</a>' +
            ' (<a href="https://wa.me/' + cleanPhone + '" target="_blank" class="text-emerald-600 font-bold hover:underline">WhatsApp</a>)';

          var emailEl = document.getElementById('enq-email');
          emailEl.innerHTML = e.contact_email 
            ? '<a href="mailto:' + e.contact_email + '" class="text-[#0B0F19] hover:underline">' + e.contact_email + '</a>'
            : '<span class="text-[10px] font-bold bg-[#F1F5F9] text-[#64748B] px-1.5 py-0.5 rounded">A (No Email Provided)</span>';

          document.getElementById('enq-category').textContent = PROJECT_LABELS[e.project_type] || e.project_type || 'Custom';
          document.getElementById('enq-budget').textContent = e.budget_range_inr || 'Open Consultation';
          document.getElementById('enq-quantity').textContent = e.approximate_quantity || 1;
          
          var refProdEl = document.getElementById('enq-ref-prod');
          if (e.referenced_product) {
            refProdEl.innerHTML = '<a href="/products/' + e.referenced_product.slug + '" target="_blank" class="font-bold text-[#2563EB] hover:underline">' + e.referenced_product.name + ' &rarr;</a>';
          } else {
            refProdEl.textContent = 'None (Original Brief)';
          }

          document.getElementById('enq-description').textContent = e.design_description || 'No description entered.';

          var attachList = document.getElementById('enq-attachments-list');
          var attachSec = document.getElementById('enq-attachments-section');
          if (e.attachments && e.attachments.length > 0) {
            attachSec.classList.remove('hidden');
            attachList.innerHTML = e.attachments.map(function(att) {
              var isImg = /\\.(webp|jpg|jpeg|png)$/i.test(att.original_filename);
              if (isImg) {
                return '<a href="' + att.public_url + '" target="_blank" class="block w-20 h-20 rounded-xl overflow-hidden border border-[#E2E8F0] hover:border-[#2563EB]">' +
                  '<img src="' + att.public_url + '" class="w-full h-full object-cover" alt="Attachment" />' +
                '</a>';
              } else {
                return '<a href="' + att.public_url + '" target="_blank" download class="inline-flex items-center gap-2 p-2.5 bg-[#FAF9F5] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0B0F19] hover:border-[#2563EB]">' +
                  '<span>📄 ' + att.original_filename + '</span>' +
                '</a>';
              }
            }).join('');
          } else {
            attachSec.classList.add('hidden');
          }

          var stBadge = document.getElementById('enq-status-badge');
          stBadge.textContent = e.status.toUpperCase();
          stBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ' + 
            (e.status === 'converted' ? 'bg-emerald-50 text-emerald-700' : (e.status === 'quoted' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'));

          document.getElementById('enq-status-select').value = e.status;

          renderNotes(e.timeline || []);

          document.getElementById('enquiry-modal').classList.remove('hidden');
        } catch(err) {
          alert('Failed to load inquiry details.');
        }
      }

      function renderNotes(timeline) {
        var notesList = document.getElementById('enq-notes-list');
        var notes = (timeline || []).filter(function(t) { return t.event_type === 'note_added' || t.internal_note; });
        if (notes.length === 0) {
          notesList.innerHTML = '<div class="text-xs text-[#94A3B8] italic">No studio notes recorded yet.</div>';
          return;
        }
        notesList.innerHTML = notes.map(function(n) {
          return '<div class="p-3 bg-[#FAF9F5] border border-[#E2E8F0] rounded-xl text-xs">' +
            '<div class="flex items-center justify-between text-[10px] text-[#94A3B8] font-bold mb-1">' +
              '<span>' + (n.actor_name || 'Staff Artisan') + '</span>' +
              '<span>' + new Date(n.created_at).toLocaleString() + '</span>' +
            '</div>' +
            '<div class="text-[#0B0F19] leading-relaxed">' + (n.internal_note || n.note || '') + '</div>' +
          '</div>';
        }).join('');
      }

      function closeEnquiryModal() {
        document.getElementById('enquiry-modal').classList.add('hidden');
        activeEnquiryId = null;
      }

      async function updateEnquiryStatus() {
        if (!activeEnquiryId) return;
        var newStatus = document.getElementById('enq-status-select').value;
        try {
          var res = await fetch('/api/admin/enquiries/' + activeEnquiryId + '/status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) {
            openEnquiryModal(activeEnquiryId);
            loadEnquiries();
          } else {
            var data = await res.json();
            alert(data.error || 'Invalid status transition according to policy.');
          }
        } catch(e) {
          alert('Network error while updating status.');
        }
      }

      document.getElementById('enq-notes-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!activeEnquiryId) return;
        var noteInput = document.getElementById('enq-new-note');
        var note = noteInput.value.trim();
        if (!note) return;

        try {
          var res = await fetch('/api/admin/enquiries/' + activeEnquiryId + '/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note: note })
          });
          if (res.ok) {
            noteInput.value = '';
            openEnquiryModal(activeEnquiryId);
          } else {
            alert('Failed to add note.');
          }
        } catch(e) {
          alert('Network error adding note.');
        }
      });

      document.getElementById('logout-btn').addEventListener('click', async function() {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
        window.location.reload();
      });

      // Initial tab setup
      switchTab('overview');
      loadKpis();
    </script>
  `;

  return renderBaseLayout({
    title: 'Atelier Admin Portal',
    description: 'BHAIRAVI Creations Administrative Dashboard & Studio Operations.',
    canonicalPath: '/admin',
    content: dashboardHtml
  });
}
