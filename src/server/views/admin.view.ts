/**
 * BHAIRAVI Creations Digital Platform
 * Admin Dashboard & Authentication SSR View (Feature R3)
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
    // Unauthenticated: Render Admin Login Interface
    const loginHtml = `
      <div style="min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 48px 16px; background: #FAF9F6;">
        <div style="width: 100%; max-width: 440px; background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 16px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          <div style="text-align: center; margin-bottom: 28px;">
            <span style="display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--terracotta); background: #FFEDD5; border-radius: 9999px; margin-bottom: 12px;">
              Internal Access Only
            </span>
            <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 700; color: var(--charcoal); margin-bottom: 8px;">
              Admin Portal
            </h1>
            <p style="font-size: 14px; color: #78716C;">
              Sign in to manage the catalog, review customer enquiries, and monitor analytics.
            </p>
          </div>

          <div id="login-error" style="display: none; padding: 12px; border-radius: 8px; background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; font-size: 13px; margin-bottom: 20px;"></div>

          <form id="admin-login-form" style="display: flex; flex-direction: column; gap: 18px;">
            <div>
              <label for="username" style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 6px;">Username or Email</label>
              <input type="text" id="username" name="username" required autocomplete="username"
                     style="width: 100%; padding: 10px 14px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px; outline: none;"
                     placeholder="admin" />
            </div>

            <div>
              <label for="password" style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 6px;">Password</label>
              <input type="password" id="password" name="password" required autocomplete="current-password"
                     style="width: 100%; padding: 10px 14px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px; outline: none;"
                     placeholder="••••••••••••" />
            </div>

            <button type="submit" id="login-btn" class="btn-primary" style="width: 100%; min-height: 44px; margin-top: 8px; font-size: 14px;">
              Sign In to Dashboard
            </button>
          </form>

          <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--stone-border); text-align: center;">
            <p style="font-size: 12px; color: #A8A29E;">
              Protected by server-side rate-limiting and timing-safe authentication.
            </p>
          </div>
        </div>
      </div>

      <script>
        const form = document.getElementById('admin-login-form');
        const errDiv = document.getElementById('login-error');
        const btn = document.getElementById('login-btn');

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          errDiv.style.display = 'none';
          btn.disabled = true;
          btn.innerText = 'Verifying credentials...';

          const fd = new FormData(form);
          const body = Object.fromEntries(fd.entries());

          try {
            const res = await fetch('/api/admin/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!res.ok) {
              errDiv.innerText = data.error || 'Authentication failed.';
              errDiv.style.display = 'block';
              btn.disabled = false;
              btn.innerText = 'Sign In to Dashboard';
            } else {
              window.location.reload();
            }
          } catch (err) {
            errDiv.innerText = 'Network error during login.';
            errDiv.style.display = 'block';
            btn.disabled = false;
            btn.innerText = 'Sign In to Dashboard';
          }
        });
      </script>
    `;

    return renderBaseLayout({
      title: 'Admin Login',
      description: 'Sign in to BHAIRAVI Creations Administrative Dashboard.',
      canonicalPath: '/admin',
      content: loginHtml
    });
  }

  // Authenticated Admin Dashboard Interface
  const dashboardHtml = `
    <div class="container" style="padding-top: 36px; padding-bottom: 80px;">
      <!-- Dashboard Top Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <h1 style="font-family: var(--font-serif); font-size: 32px; font-weight: 700; color: var(--charcoal); margin: 0;">
              Artisanal Studio Dashboard
            </h1>
            <span style="font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 9999px; background: #E0E7FF; color: #3730A3;">
              ${escapeHtml(user.role.toUpperCase())}
            </span>
          </div>
          <p style="font-size: 14px; color: #78716C; margin-top: 4px;">
            Studio operations, live catalog control, customer commissions & mathematical BI rollups.
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          <span style="font-size: 13px; color: #57534E;">Signed in as <strong>${escapeHtml(user.username)}</strong></span>
          <button id="logout-btn" class="btn-secondary" style="padding: 6px 14px; font-size: 13px; min-height: 36px;">
            Sign Out
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="margin-bottom: 28px;">
        <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--stone-border); padding-bottom: 8px; overflow-x: auto;">
          <button onclick="switchTab('overview')" class="tab-btn" id="tab-overview" style="padding: 8px 18px; font-size: 14px; font-weight: 600; border-radius: 8px; border: none; background: #FFFFFF; color: var(--charcoal); cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            Overview &amp; KPIs
          </button>
          <button onclick="switchTab('products')" class="tab-btn" id="tab-products" style="padding: 8px 18px; font-size: 14px; font-weight: 600; border-radius: 8px; border: none; background: transparent; color: #78716C; cursor: pointer;">
            Product Catalog
          </button>
          <button onclick="switchTab('enquiries')" class="tab-btn" id="tab-enquiries" style="padding: 8px 18px; font-size: 14px; font-weight: 600; border-radius: 8px; border: none; background: transparent; color: #78716C; cursor: pointer;">
            Custom Enquiries
          </button>
          <button onclick="switchTab('exports')" class="tab-btn" id="tab-exports" style="padding: 8px 18px; font-size: 14px; font-weight: 600; border-radius: 8px; border: none; background: transparent; color: #78716C; cursor: pointer;">
            BI Data Exports (AI-Ready)
          </button>
        </div>

        <!-- TAB 1: OVERVIEW & KPIS -->
        <div id="content-overview" class="tab-content">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px; margin-top: 24px;">
            <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 12px; padding: 20px;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #78716C; margin-bottom: 6px;">Total Views</div>
              <div id="kpi-views" style="font-size: 28px; font-weight: 700; color: var(--charcoal);">-</div>
              <div style="font-size: 11px; color: #A8A29E; margin-top: 4px;">Storefront page impressions</div>
            </div>

            <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 12px; padding: 20px;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #78716C; margin-bottom: 6px;">Product Detail Views</div>
              <div id="kpi-pdp" style="font-size: 28px; font-weight: 700; color: var(--charcoal);">-</div>
              <div style="font-size: 11px; color: #A8A29E; margin-top: 4px;">Full PDP reads</div>
            </div>

            <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 12px; padding: 20px;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #78716C; margin-bottom: 6px;">Amazon Clicks</div>
              <div id="kpi-amazon" style="font-size: 28px; font-weight: 700; color: #D97706;">-</div>
              <div style="font-size: 11px; color: #A8A29E; margin-top: 4px;">High intent (outcome unknown)</div>
            </div>

            <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 12px; padding: 20px;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #78716C; margin-bottom: 6px;">WhatsApp Inquiries</div>
              <div id="kpi-whatsapp" style="font-size: 28px; font-weight: 700; color: #059669;">-</div>
              <div style="font-size: 11px; color: #A8A29E; margin-top: 4px;">Outbound consultations</div>
            </div>

            <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 12px; padding: 20px;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #78716C; margin-bottom: 6px;">Custom Commissions</div>
              <div id="kpi-enquiries" style="font-size: 28px; font-weight: 700; color: var(--terracotta);">-</div>
              <div style="font-size: 11px; color: #A8A29E; margin-top: 4px;">Submitted order requests</div>
            </div>
          </div>

          <!-- Epistemic Integrity Alert -->
          <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 12px; padding: 18px; margin-bottom: 32px;">
            <div style="display: flex; gap: 12px; align-items: flex-start;">
              <span style="font-size: 20px;">ℹ️</span>
              <div>
                <strong style="color: #92400E; font-size: 14px;">Attribution Integrity Active</strong>
                <p style="font-size: 13px; color: #78350F; margin-top: 4px; line-height: 1.5;">
                  Outbound Amazon and WhatsApp clicks represent measured customer intent. Without external API verification, they are strictly classified as <em>"Purchase Outcome Unknown"</em> rather than fabricated conversion rates.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: PRODUCTS -->
        <div id="content-products" class="tab-content" style="display: none; margin-top: 24px;">
          <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 12px; padding: 24px; overflow-x: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
              <div>
                <h2 style="font-size: 18px; font-weight: 700; color: var(--charcoal); margin: 0;">Product Catalog</h2>
                <p style="font-size: 13px; color: #78716C; margin-top: 2px;">Manage published creations, inventory stock levels, and technical specifications.</p>
              </div>
              <button onclick="openProductModal(null)" class="btn-primary" style="padding: 8px 18px; font-size: 13px; min-height: 38px;">
                + Add Product
              </button>
            </div>
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
              <thead>
                <tr style="border-bottom: 2px solid var(--stone-border); color: #78716C;">
                  <th style="padding: 12px 8px;">Name</th>
                  <th style="padding: 12px 8px;">Category</th>
                  <th style="padding: 12px 8px;">Price (INR)</th>
                  <th style="padding: 12px 8px;">Stock Status</th>
                  <th style="padding: 12px 8px;">Visibility</th>
                  <th style="padding: 12px 8px;">Actions</th>
                </tr>
              </thead>
              <tbody id="products-table-body">
                <tr><td colspan="6" style="padding: 24px; text-align: center; color: #A8A29E;">Loading catalog...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB 3: ENQUIRIES -->
        <div id="content-enquiries" class="tab-content" style="display: none; margin-top: 24px;">
          <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 12px; padding: 24px; overflow-x: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <h2 style="font-size: 18px; font-weight: 700; color: var(--charcoal); margin: 0;">Custom Order Enquiries</h2>
                <p style="font-size: 13px; color: #78716C; margin-top: 2px;">Review client commission briefs, inspect attachments, and log craftsmanship notes.</p>
              </div>
            </div>
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
              <thead>
                <tr style="border-bottom: 2px solid var(--stone-border); color: #78716C;">
                  <th style="padding: 12px 8px;">Date</th>
                  <th style="padding: 12px 8px;">Customer</th>
                  <th style="padding: 12px 8px;">Project Category</th>
                  <th style="padding: 12px 8px;">Contact Details</th>
                  <th style="padding: 12px 8px;">Status</th>
                  <th style="padding: 12px 8px;">Actions</th>
                </tr>
              </thead>
              <tbody id="enquiries-table-body">
                <tr><td colspan="6" style="padding: 24px; text-align: center; color: #A8A29E;">Loading enquiries...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB 4: BI EXPORTS -->
        <div id="content-exports" class="tab-content" style="display: none; margin-top: 24px;">
          <div style="background: #FFFFFF; border: 1px solid var(--stone-border); border-radius: 12px; padding: 28px;">
            <h2 style="font-size: 18px; font-weight: 700; color: var(--charcoal); margin-bottom: 12px;">Export Business Data</h2>
            <p style="font-size: 14px; color: #78716C; margin-bottom: 24px;">
              Download verified, reconcilable business intelligence reports for external AI agents or spreadsheet analysis. All files adhere strictly to RFC 4180 with CSV formula injection protection.
            </p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
              <div style="border: 1px solid var(--stone-border); border-radius: 10px; padding: 20px;">
                <h3 style="font-size: 15px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">Raw Analytics Events</h3>
                <p style="font-size: 12px; color: #78716C; margin-bottom: 16px;">Immutable event log with zero-PII sanitization.</p>
                <div style="display: flex; gap: 8px;">
                  <a href="/api/admin/exports/events.csv" download class="btn-secondary" style="font-size: 12px; padding: 6px 12px;">CSV</a>
                  <a href="/api/admin/exports/events.json" download class="btn-secondary" style="font-size: 12px; padding: 6px 12px;">JSON</a>
                </div>
              </div>

              <div style="border: 1px solid var(--stone-border); border-radius: 10px; padding: 20px;">
                <h3 style="font-size: 15px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">Daily Aggregated Rollups</h3>
                <p style="font-size: 12px; color: #78716C; margin-bottom: 16px;">Mathematically reconciled daily product metrics (&Delta; = 0).</p>
                <div style="display: flex; gap: 8px;">
                  <a href="/api/admin/exports/rollups.csv" download class="btn-secondary" style="font-size: 12px; padding: 6px 12px;">CSV</a>
                  <a href="/api/admin/exports/rollups.json" download class="btn-secondary" style="font-size: 12px; padding: 6px 12px;">JSON</a>
                </div>
              </div>

              <div style="border: 1px solid var(--stone-border); border-radius: 10px; padding: 20px;">
                <h3 style="font-size: 15px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">Customer Enquiries</h3>
                <p style="font-size: 12px; color: #78716C; margin-bottom: 16px;">Permitted enquiry export with customer privacy guards.</p>
                <div style="display: flex; gap: 8px;">
                  <a href="/api/admin/exports/enquiries.csv" download class="btn-secondary" style="font-size: 12px; padding: 6px 12px;">CSV</a>
                </div>
              </div>

              <div style="border: 1px solid var(--stone-border); border-radius: 10px; padding: 20px;">
                <h3 style="font-size: 15px; font-weight: 600; color: var(--charcoal); margin-bottom: 6px;">Product Catalog Snapshot</h3>
                <p style="font-size: 12px; color: #78716C; margin-bottom: 16px;">Complete metadata with integer paise pricing.</p>
                <div style="display: flex; gap: 8px;">
                  <a href="/api/admin/exports/catalog.json" download class="btn-secondary" style="font-size: 12px; padding: 6px 12px;">JSON</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 1: ADD / EDIT PRODUCT -->
    <div id="product-modal" style="display: none; position: fixed; inset: 0; z-index: 110; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); align-items: center; justify-content: center; padding: 20px;">
      <div style="background: #FFFFFF; border-radius: 16px; border: 1px solid var(--stone-border); width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 id="product-modal-title" style="font-family: var(--font-serif); font-size: 22px; font-weight: 700; color: var(--charcoal); margin: 0;">Add Creation</h2>
          <button onclick="closeProductModal()" style="background: transparent; border: none; font-size: 24px; cursor: pointer; color: #78716C;">&times;</button>
        </div>
        <form id="product-form" style="display: flex; flex-direction: column; gap: 16px;">
          <input type="hidden" id="p-id" name="id" />
          
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 4px;">Piece Title *</label>
            <input type="text" id="p-name" name="name" required style="width: 100%; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px;" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 4px;">URL Slug *</label>
              <input type="text" id="p-slug" name="slug" required style="width: 100%; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px;" />
            </div>
            <div>
              <label style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 4px;">Price (INR ₹) *</label>
              <input type="number" id="p-price-inr" name="price_inr" step="0.01" min="0" required style="width: 100%; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 4px;">Category *</label>
              <select id="p-category" name="category_id" required style="width: 100%; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px; background: #FFF;">
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 4px;">Material</label>
              <input type="text" id="p-material" name="material" value="PLA / PLA Pro" style="width: 100%; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px;" />
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 4px;">Description</label>
            <textarea id="p-description" name="description" rows="3" style="width: 100%; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px;"></textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 4px;">Weight (Grams)</label>
              <input type="number" id="p-weight" name="weight_grams" min="0" style="width: 100%; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px;" />
            </div>
            <div>
              <label style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 4px;">Inventory Count</label>
              <input type="number" id="p-inventory" name="inventory_count" min="0" value="0" style="width: 100%; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px;" />
            </div>
            <div>
              <label style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 4px;">Lead Time (Days)</label>
              <input type="text" id="p-lead-days" name="production_lead_days" value="3-5 business days" style="width: 100%; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 4px;">Amazon India URL</label>
              <input type="url" id="p-amazon-url" name="amazon_url" placeholder="https://www.amazon.in/dp/..." style="width: 100%; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px;" />
            </div>
            <div>
              <label style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 4px;">Amazon ASIN</label>
              <input type="text" id="p-amazon-asin" name="amazon_asin" placeholder="B09XXXXXXX" style="width: 100%; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px;" />
            </div>
          </div>

          <div style="display: flex; gap: 24px; margin-top: 6px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
              <input type="checkbox" id="p-made-to-order" name="is_made_to_order" checked />
              <span>Made to Order</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
              <input type="checkbox" id="p-published" name="is_published" checked />
              <span>Publish to Storefront</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
              <input type="checkbox" id="p-featured" name="is_featured" />
              <span>Featured Creation</span>
            </label>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; border-top: 1px solid var(--stone-border); padding-top: 16px;">
            <button type="button" onclick="closeProductModal()" class="btn-secondary" style="padding: 8px 16px; font-size: 13px;">Cancel</button>
            <button type="submit" id="save-product-btn" class="btn-primary" style="padding: 8px 20px; font-size: 13px;">Save Creation</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: QUICK STOCK TOGGLE -->
    <div id="stock-modal" style="display: none; position: fixed; inset: 0; z-index: 110; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); align-items: center; justify-content: center; padding: 20px;">
      <div style="background: #FFFFFF; border-radius: 16px; border: 1px solid var(--stone-border); width: 100%; max-width: 400px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-family: var(--font-serif); font-size: 20px; font-weight: 700; color: var(--charcoal); margin: 0;">Stock &amp; Availability</h2>
          <button onclick="closeStockModal()" style="background: transparent; border: none; font-size: 24px; cursor: pointer; color: #78716C;">&times;</button>
        </div>
        <form id="stock-form" style="display: flex; flex-direction: column; gap: 14px;">
          <input type="hidden" id="stock-p-id" />
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #44403C; margin-bottom: 4px;">Inventory Units on Hand</label>
            <input type="number" id="stock-inventory-count" min="0" required style="width: 100%; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 14px;" />
          </div>
          <div>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
              <input type="checkbox" id="stock-is-made-to-order" />
              <span>Allow "Made to Order" when stock is zero</span>
            </label>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px;">
            <button type="button" onclick="closeStockModal()" class="btn-secondary" style="padding: 6px 14px; font-size: 13px;">Cancel</button>
            <button type="submit" class="btn-primary" style="padding: 6px 18px; font-size: 13px;">Update Stock</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 3: ENQUIRY DETAILS MODAL -->
    <div id="enquiry-modal" style="display: none; position: fixed; inset: 0; z-index: 110; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); align-items: center; justify-content: center; padding: 20px;">
      <div style="background: #FFFFFF; border-radius: 16px; border: 1px solid var(--stone-border); width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <span id="enq-ref" style="font-size: 11px; font-weight: 700; color: var(--terracotta); text-transform: uppercase;"></span>
            <h2 id="enq-customer" style="font-family: var(--font-serif); font-size: 22px; font-weight: 700; color: var(--charcoal); margin: 2px 0 0 0;"></h2>
          </div>
          <button onclick="closeEnquiryModal()" style="background: transparent; border: none; font-size: 24px; cursor: pointer; color: #78716C;">&times;</button>
        </div>

        <!-- Meta Summary Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #FAF9F6; border: 1px solid var(--stone-border); border-radius: 10px; padding: 14px; margin-bottom: 20px; font-size: 13px;">
          <div><strong>Contact Phone:</strong> <span id="enq-phone"></span></div>
          <div><strong>Email:</strong> <span id="enq-email"></span></div>
          <div><strong>Project Category:</strong> <span id="enq-category"></span></div>
          <div><strong>Target Budget:</strong> <span id="enq-budget"></span></div>
          <div><strong>Quantity:</strong> <span id="enq-quantity"></span></div>
          <div><strong>Referenced Creation:</strong> <span id="enq-ref-prod"></span></div>
        </div>

        <!-- Full Customer Design & Finishing Description -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; color: var(--charcoal); margin-bottom: 6px;">Customer Design Description</h3>
          <div id="enq-description" style="background: #FAF9F6; border: 1px solid var(--stone-border); border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: var(--charcoal);">
          </div>
        </div>

        <!-- Attachments Section -->
        <div id="enq-attachments-section" style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; color: var(--charcoal); margin-bottom: 8px;">CAD Models &amp; Design References</h3>
          <div id="enq-attachments-list" style="display: flex; gap: 12px; flex-wrap: wrap;"></div>
        </div>

        <!-- Status Workflow Transition -->
        <div style="background: #F5F5F4; border-radius: 10px; padding: 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <span style="font-size: 12px; font-weight: 600; color: #57534E; display: block;">Current Workflow Stage</span>
            <span id="enq-status-badge" style="font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 6px; display: inline-block; margin-top: 4px;"></span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <select id="enq-status-select" style="padding: 7px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 13px; background: #FFF; font-weight: 600;">
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="quoted">Quoted</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
            <button onclick="updateEnquiryStatus()" class="btn-primary" style="padding: 7px 14px; font-size: 13px; min-height: 36px;">Update Status</button>
          </div>
        </div>

        <!-- Internal Craftsmanship Notes History & Add Form -->
        <div>
          <h3 style="font-size: 14px; font-weight: 700; color: var(--charcoal); margin-bottom: 10px;">Internal Artisan Notes</h3>
          <div id="enq-notes-list" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; max-height: 180px; overflow-y: auto;">
          </div>
          <form id="enq-notes-form" style="display: flex; gap: 8px;">
            <input type="text" id="enq-new-note" placeholder="Log material estimate, CAD review note, or dispatch tracking..." style="flex-grow: 1; padding: 8px 12px; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 13px;" required />
            <button type="submit" class="btn-secondary" style="padding: 8px 16px; font-size: 13px; white-space: nowrap;">Add Note</button>
          </form>
        </div>
      </div>
    </div>

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
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.style.background = 'transparent';
          b.style.color = '#78716C';
          b.style.boxShadow = 'none';
        });
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        document.getElementById('tab-' + tab).style.background = '#FFFFFF';
        document.getElementById('tab-' + tab).style.color = 'var(--charcoal)';
        document.getElementById('tab-' + tab).style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        document.getElementById('content-' + tab).style.display = 'block';

        if (tab === 'products') loadProducts();
        if (tab === 'enquiries') loadEnquiries();
      }

      async function loadKpis() {
        try {
          const res = await fetch('/api/admin/overview/kpis');
          if (res.ok) {
            const data = await res.json();
            const totals = data.totals || {};
            document.getElementById('kpi-views').innerText = totals.total_views || 0;
            document.getElementById('kpi-pdp').innerText = totals.pdp_views || 0;
            document.getElementById('kpi-amazon').innerText = totals.amazon_clicks || 0;
            document.getElementById('kpi-whatsapp').innerText = totals.whatsapp_clicks || 0;
            document.getElementById('kpi-enquiries').innerText = totals.enquiries_submitted || 0;
          }
        } catch {}
      }

      async function loadCategories() {
        if (CATEGORIES && CATEGORIES.length > 0) return CATEGORIES;
        try {
          const res = await fetch('/api/admin/categories');
          if (res.ok) {
            const data = await res.json();
            CATEGORIES = data.data || [];
          }
        } catch {}
        return CATEGORIES;
      }

      async function loadProducts() {
        const tbody = document.getElementById('products-table-body');
        try {
          const res = await fetch('/api/admin/products');
          if (res.ok) {
            const json = await res.json();
            const products = json.data || [];
            if (products.length === 0) {
              tbody.innerHTML = '<tr><td colspan="6" style="padding: 24px; text-align: center; color: #78716C;">No creations found in catalog.</td></tr>';
              return;
            }
            tbody.innerHTML = products.map(p => {
              var stockBadge = '';
              if (p.is_made_to_order) {
                stockBadge = '<span style="background: #E0E7FF; color: #3730A3; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">Made to Order</span>';
              } else if (p.inventory_count > 5) {
                stockBadge = '<span style="background: #DEF7EC; color: #03543F; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">In Stock (' + p.inventory_count + ')</span>';
              } else if (p.inventory_count > 0) {
                stockBadge = '<span style="background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">Low Stock (' + p.inventory_count + ')</span>';
              } else {
                stockBadge = '<span style="background: #FDE8E8; color: #9B1C1C; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">Out of Stock</span>';
              }

              var visBadge = p.is_published 
                ? '<span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #DEF7EC; color: #03543F; font-weight: 600;">Published</span>'
                : '<span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #F3F4F6; color: #374151; font-weight: 600;">Draft</span>';

              var escapedP = JSON.stringify(p).replace(/"/g, '&quot;');

              return '<tr style="border-bottom: 1px solid var(--stone-border);">' +
                '<td style="padding: 12px 8px; font-weight: 600;">' + p.name + '</td>' +
                '<td style="padding: 12px 8px; color: #78716C;">' + (p.category?.name || '-') + '</td>' +
                '<td style="padding: 12px 8px; font-weight: 600;">₹' + (p.base_price_paise / 100).toFixed(2) + '</td>' +
                '<td style="padding: 12px 8px;">' + stockBadge + '</td>' +
                '<td style="padding: 12px 8px;">' + visBadge + '</td>' +
                '<td style="padding: 12px 8px;">' +
                  '<div style="display: flex; gap: 8px; align-items: center;">' +
                    '<a href="/products/' + p.slug + '" target="_blank" style="color: var(--charcoal); font-size: 12px; font-weight: 600;">View</a>' +
                    '<button onclick="openProductModal(' + escapedP + ')" style="background: transparent; border: 1px solid var(--stone-border); border-radius: 4px; padding: 3px 8px; font-size: 12px; font-weight: 600; cursor: pointer;">Edit</button>' +
                    '<button onclick="openStockModal(\\'' + p.id + '\\', ' + p.inventory_count + ', ' + (p.is_made_to_order ? 1 : 0) + ')" style="background: transparent; border: 1px solid var(--stone-border); border-radius: 4px; padding: 3px 8px; font-size: 12px; font-weight: 600; cursor: pointer;">Stock</button>' +
                    '<button onclick="archiveProduct(\\'' + p.id + '\\')" style="background: transparent; border: 1px solid #FECACA; color: #B91C1C; border-radius: 4px; padding: 3px 8px; font-size: 12px; font-weight: 600; cursor: pointer;">Archive</button>' +
                    '<button onclick="deleteProduct(\\'' + p.id + '\\', \\'' + p.name.replace(/'/g, "\\\\'") + '\\')" style="background: #FEE2E2; border: 1px solid #FCA5A5; color: #991B1B; border-radius: 4px; padding: 3px 8px; font-size: 12px; font-weight: 600; cursor: pointer;">Delete</button>' +
                  '</div>' +
                '</td>' +
              '</tr>';
            }).join('');
          }
        } catch {
          tbody.innerHTML = '<tr><td colspan="6" style="padding: 16px; text-align: center; color: red;">Failed to load catalog.</td></tr>';
        }
      }

      async function openProductModal(prod) {
        await loadCategories();
        var catSelect = document.getElementById('p-category');
        catSelect.innerHTML = CATEGORIES.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');

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
          document.getElementById('p-material').value = prod.material || 'PLA / PLA Pro';
          document.getElementById('p-description').value = prod.description || '';
          document.getElementById('p-weight').value = prod.weight_grams || 0;
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

        modal.style.display = 'flex';
      }

      function closeProductModal() {
        document.getElementById('product-modal').style.display = 'none';
      }

      document.getElementById('product-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        var saveBtn = document.getElementById('save-product-btn');
        saveBtn.disabled = true;
        saveBtn.innerText = 'Saving...';

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
            alert(data.error || 'Failed to save product.');
          }
        } catch(err) {
          alert('Network error while saving product.');
        } finally {
          saveBtn.disabled = false;
          saveBtn.innerText = 'Save Creation';
        }
      });

      function openStockModal(id, count, isMadeToOrder) {
        document.getElementById('stock-p-id').value = id;
        document.getElementById('stock-inventory-count').value = count;
        document.getElementById('stock-is-made-to-order').checked = Boolean(isMadeToOrder);
        document.getElementById('stock-modal').style.display = 'flex';
      }

      function closeStockModal() {
        document.getElementById('stock-modal').style.display = 'none';
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
            alert('Failed to update availability.');
          }
        } catch(err) {
          alert('Network error while updating stock.');
        }
      });

      async function archiveProduct(id) {
        if (!confirm('Archive this piece? It will be hidden from the storefront catalogue.')) return;
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
        const tbody = document.getElementById('enquiries-table-body');
        try {
          const res = await fetch('/api/admin/enquiries');
          if (res.ok) {
            const json = await res.json();
            const enquiries = json.data || [];
            if (enquiries.length === 0) {
              tbody.innerHTML = '<tr><td colspan="6" style="padding: 24px; text-align: center; color: #78716C;">No customer enquiries submitted yet.</td></tr>';
              return;
            }
            tbody.innerHTML = enquiries.map(e => {
              var catLabel = PROJECT_LABELS[e.project_type] || e.project_type || 'Custom Piece';
              var phoneHtml = '<a href="tel:' + e.contact_phone + '" style="color: var(--charcoal); font-weight: 600; text-decoration: underline;">' + e.contact_phone + '</a>';
              var emailHtml = e.contact_email 
                ? '<div style="font-size: 11px; color: #78716C;">' + e.contact_email + '</div>'
                : '<span title="No email provided (Phone/WhatsApp only)" style="display: inline-block; font-size: 10px; font-weight: 700; background: #E5E7EB; color: #4B5563; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">A</span>';

              var statusColors = {
                new: { bg: '#FEF3C7', fg: '#92400E' },
                contacted: { bg: '#E0E7FF', fg: '#3730A3' },
                quoted: { bg: '#EDE9FE', fg: '#5B21B6' },
                converted: { bg: '#DEF7EC', fg: '#03543F' },
                closed: { bg: '#F3F4F6', fg: '#4B5563' }
              };
              var sc = statusColors[e.status] || { bg: '#F3F4F6', fg: '#4B5563' };

              return '<tr style="border-bottom: 1px solid var(--stone-border);">' +
                '<td style="padding: 12px 8px; color: #78716C; font-size: 12px;">' + new Date(e.created_at).toLocaleDateString() + '</td>' +
                '<td style="padding: 12px 8px; font-weight: 600;">' + e.customer_name + '</td>' +
                '<td style="padding: 12px 8px; color: #57534E;">' + catLabel + '</td>' +
                '<td style="padding: 12px 8px; font-size: 13px;">' + phoneHtml + emailHtml + '</td>' +
                '<td style="padding: 12px 8px;">' +
                  '<span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: ' + sc.bg + '; color: ' + sc.fg + '; font-weight: 600; text-transform: uppercase;">' +
                    e.status +
                  '</span>' +
                '</td>' +
                '<td style="padding: 12px 8px;">' +
                  '<button onclick="openEnquiryModal(\\'' + e.id + '\\')" class="btn-secondary" style="font-size: 12px; padding: 4px 10px;">View Details</button>' +
                '</td>' +
              '</tr>';
            }).join('');
          }
        } catch {
          tbody.innerHTML = '<tr><td colspan="6" style="padding: 16px; text-align: center; color: red;">Failed to load enquiries.</td></tr>';
        }
      }

      async function openEnquiryModal(id) {
        activeEnquiryId = id;
        try {
          var res = await fetch('/api/admin/enquiries/' + id);
          if (!res.ok) throw new Error();
          var data = await res.json();
          var e = data.data;

          document.getElementById('enq-ref').textContent = '#' + e.id.slice(0, 13);
          document.getElementById('enq-customer').textContent = e.customer_name;
          
          var phoneEl = document.getElementById('enq-phone');
          phoneEl.innerHTML = '<a href="tel:' + e.contact_phone + '" style="color: var(--terracotta); font-weight: 700;">' + e.contact_phone + '</a>' +
            ' (<a href="https://wa.me/' + e.contact_phone.replace(/[^0-9]/g, '') + '" target="_blank" style="color: #059669; font-weight: 600;">WhatsApp</a>)';

          var emailEl = document.getElementById('enq-email');
          emailEl.innerHTML = e.contact_email 
            ? '<a href="mailto:' + e.contact_email + '" style="color: var(--charcoal);">' + e.contact_email + '</a>'
            : '<span style="font-size: 11px; font-weight: 700; background: #E5E7EB; color: #4B5563; padding: 2px 6px; border-radius: 4px;">A (No Email Provided)</span>';

          document.getElementById('enq-category').textContent = PROJECT_LABELS[e.project_type] || e.project_type || 'Custom';
          document.getElementById('enq-budget').textContent = e.budget_range_inr || 'Open to Consultation';
          document.getElementById('enq-quantity').textContent = e.approximate_quantity || 1;
          
          var refProdEl = document.getElementById('enq-ref-prod');
          if (e.referenced_product) {
            refProdEl.innerHTML = '<a href="/products/' + e.referenced_product.slug + '" target="_blank" style="color: var(--terracotta); text-decoration: underline;">' + e.referenced_product.name + '</a>';
          } else {
            refProdEl.textContent = 'None (Original Brief)';
          }

          document.getElementById('enq-description').textContent = e.design_description || 'No description entered.';

          var attachList = document.getElementById('enq-attachments-list');
          var attachSec = document.getElementById('enq-attachments-section');
          if (e.attachments && e.attachments.length > 0) {
            attachSec.style.display = 'block';
            attachList.innerHTML = e.attachments.map(att => {
              var isImg = /\.(webp|jpg|jpeg|png)$/i.test(att.original_filename);
              if (isImg) {
                return '<a href="' + att.public_url + '" target="_blank" style="display: block; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid var(--stone-border);">' +
                  '<img src="' + att.public_url + '" style="width: 100%; height: 100%; object-fit: cover;" alt="Attachment" />' +
                '</a>';
              } else {
                return '<a href="' + att.public_url + '" target="_blank" download style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; background: #FAF9F6; border: 1px solid var(--stone-border); border-radius: 8px; font-size: 12px; color: var(--charcoal); font-weight: 600;">' +
                  '<span>📄 ' + att.original_filename + '</span>' +
                '</a>';
              }
            }).join('');
          } else {
            attachSec.style.display = 'none';
          }

          var stBadge = document.getElementById('enq-status-badge');
          stBadge.textContent = e.status.toUpperCase();
          stBadge.style.background = e.status === 'converted' ? '#DEF7EC' : (e.status === 'quoted' ? '#EDE9FE' : '#FEF3C7');
          stBadge.style.color = e.status === 'converted' ? '#03543F' : (e.status === 'quoted' ? '#5B21B6' : '#92400E');

          document.getElementById('enq-status-select').value = e.status;

          renderNotes(e.timeline || []);

          document.getElementById('enquiry-modal').style.display = 'flex';
        } catch(err) {
          alert('Failed to load enquiry details.');
        }
      }

      function renderNotes(timeline) {
        var notesList = document.getElementById('enq-notes-list');
        var notes = (timeline || []).filter(t => t.event_type === 'note_added' || t.internal_note);
        if (notes.length === 0) {
          notesList.innerHTML = '<div style="font-size: 12px; color: #A8A29E; font-style: italic;">No artisan notes recorded yet.</div>';
          return;
        }
        notesList.innerHTML = notes.map(n => 
          '<div style="background: #FAF9F6; border: 1px solid var(--stone-border); border-radius: 6px; padding: 8px 12px; font-size: 13px;">' +
            '<div style="display: flex; justify-content: space-between; font-size: 11px; color: #78716C; margin-bottom: 2px;">' +
              '<strong>' + (n.actor_name || 'Artisan') + '</strong>' +
              '<span>' + new Date(n.created_at).toLocaleString() + '</span>' +
            '</div>' +
            '<div style="color: var(--charcoal);">' + (n.internal_note || n.note || '') + '</div>' +
          '</div>'
        ).join('');
      }

      function closeEnquiryModal() {
        document.getElementById('enquiry-modal').style.display = 'none';
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
            alert(data.error || 'Invalid status transition.');
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

      document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
        window.location.reload();
      });

      // Initial load
      document.getElementById('tab-overview').style.background = '#FFFFFF';
      document.getElementById('tab-overview').style.color = 'var(--charcoal)';
      loadKpis();
    </script>
  `;

  return renderBaseLayout({
    title: 'Admin Management Dashboard',
    description: 'BHAIRAVI Creations Administrative Dashboard.',
    canonicalPath: '/admin',
    content: dashboardHtml
  });
}
