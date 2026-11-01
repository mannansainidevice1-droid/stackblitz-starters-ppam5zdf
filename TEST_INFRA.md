# Test Infrastructure & Specification (TEST_INFRA.md)
**Project**: BHAIRAVI Creations Digital Platform  
**Author**: E2E Test Suite Lead (`teamwork_test_writer_e2e`)  
**Target Path**: `/home/mannan/gemini-shi/a/TEST_INFRA.md`  
**Status**: ACTIVE / SPECIFICATION APPROVED  
**Date**: 2026-10-31  

---

## 1. Executive Summary & Testing Philosophy

The BHAIRAVI Creations platform requires an uncompromising, requirement-driven, opaque-box testing infrastructure. The test architecture is designed strictly from authoritative user requirements defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`, treating the application implementation as a black box.

### Core Testing Pillars:
1. **Opaque-Box Requirement Derivation**: Tests are derived directly from functional requirements (R1–R7) and acceptance criteria, never reverse-engineered from implementation quirks.
2. **Deterministic Mathematical Invariants**: Zero tolerance for floating-point currency drift (all prices in integer INR paise), zero tolerance for telemetry reconciliation drift ($\Delta = 0$ between immutable event log and aggregated rollups), and strict adherence to the "purchase outcome unknown" attribution mandate.
3. **Four Systematic Test Tiers**:
   - **Tier 1 — Feature Coverage**: Comprehensive unit/functional verification with $\ge 5$ test cases per feature covering F1 through F50 ($250+$ test cases).
   - **Tier 2 — Boundary & Corner Cases**: Rigorous edge conditions, input limit tests, malformed payloads, rate-limit thresholds, and negative test cases with $\ge 5$ tests per feature ($250+$ test cases).
   - **Tier 3 — Cross-Feature Interactions**: Pairwise integration tests validating contract interfaces across subsystems (telemetry + outbound links, enquiries + admin timeline, catalog + currency formatting, etc.).
   - **Tier 4 — Real-World Application Scenarios**: Multi-step realistic customer and administrator journeys testing full workflow integrity from end to end.
4. **Dual Runtime Execution Harness**: Tests are authored in TypeScript/JavaScript leveraging native `node:test` and `node:assert` (zero external framework lock-in) with an accompanying automated cross-runtime test runner (`run_tests.py` / `runner.ts`) capable of executing without external bundlers.

---

## 2. Directory Layout & Organization

All test files are organized under `src/tests/` co-located with project assets, maintaining strict separation between test suites and application source code:

```
/home/mannan/gemini-shi/a/
├── TEST_INFRA.md                               # This authoritative test infrastructure specification
├── TEST_READY.md                               # Test suite readiness & execution summary
├── src/
│   └── tests/
│       ├── helpers/                            # Shared test fixtures, harness, and custom assertions
│       │   ├── test_context.ts                 # In-memory mock server, DB connection & HTTP client fixtures
│       │   ├── assertions.ts                   # Custom invariant assertions (paise, RFC 4180, SHA256)
│       │   └── mock_data.ts                    # Canonical sample products, categories, events & enquiries
│       ├── e2e/
│       │   ├── tier1_features/                 # Tier 1: 50 Features (F1 - F50) Feature Coverage (>=5 tests/feat)
│       │   │   ├── f01_f05_datamodel.test.ts   # F1 Schema DDL, F2 Paise Pricing, F3 Migrations, F4 WAL, F5 Seed Data
│       │   │   ├── f06_f10_admin_crud.test.ts  # F6 Session Auth, F7 3-Tier RBAC, F8 Lockout Guard, F9 KPI API, F10 Product CRUD
│       │   │   ├── f11_f15_enquiry_sec.test.ts # F11 Enquiry Status, F12 Timeline Trail, F13 Safe Uploads, F14 Spam Guard, F15 Env
│       │   │   ├── f16_f20_telemetry.test.ts   # F16 Gateway, F17 Batch Ingestion, F18 Shield, F19 Clock Skew, F20 13 Core Events
│       │   │   ├── f21_f25_analytics.test.ts   # F21 Zero-PII, F22 Consent Opt-Out, F23 Outcome Unknown, F24 Funnels, F25 High-Interest
│       │   │   ├── f26_f30_exports.test.ts     # F26 Raw Export, F27 Rollups, F28 Permitted Enquiries, F29 Catalog Meta, F30 Quality Envelope
│       │   │   ├── f31_f33_reconciliation.test.ts # F31 100% Invariant, F32 AI Analyst API, F33 AI Query Guard
│       │   │   ├── f34_f39_storefront.test.ts  # F34 Brand Tokens, F35 Hero Copy, F36 Craft Journey, F37 Family Story, F38 Steps, F39 Footer
│       │   │   ├── f40_f44_catalog_pdp.test.ts # F40 Catalog Grid, F41 Search & Filter, F42 PDP Canonical, F43 Gallery, F44 Variants
│       │   │   └── f45_f50_custom_ext.test.ts  # F45 Custom Form, F46 Upload Zone, F47 WhatsApp Bridge, F48 Legal Pages, F49 Amazon, F50 WhatsApp
│       │   ├── tier2_boundaries/               # Tier 2: Boundary, Limit & Negative Cases (>=5 tests/feat)
│       │   │   ├── f01_f10_boundaries.test.ts  # F1-F10 Boundaries (Zero paise, SQL injections, invalid UUIDs, lockout limits)
│       │   │   ├── f11_f20_boundaries.test.ts  # F11-F20 Boundaries (Over-size files, malicious SVG/scripts, clock drift, flood limit)
│       │   │   ├── f21_f30_boundaries.test.ts  # F21-F30 Boundaries (PII strings, zero view funnels, RFC 4180 escapes, empty exports)
│       │   │   ├── f31_f40_boundaries.test.ts  # F31-F40 Boundaries (DST UTC skew, SQL injection in AI query, responsive breakpoint widths)
│       │   │   └── f41_f50_boundaries.test.ts  # F41-F50 Boundaries (Extreme searches, negative price deltas, invalid phone formats)
│       │   ├── tier3_interactions/             # Tier 3: Pairwise Cross-Feature Interactions
│       │   │   ├── telemetry_outbound.test.ts  # Outbound click -> Beacon fire -> Outcome Unknown tag
│       │   │   ├── enquiry_admin_lifecycle.test.ts # Custom submit -> Honeypot bypass check -> Status transition -> Timeline entry
│       │   │   ├── catalog_pricing_variants.test.ts # Admin price update -> Catalog reflection -> Variant delta recalculation
│       │   │   ├── ingestion_reconciliation.test.ts # Event stream ingestion -> Daily rollup worker -> Delta == 0 verification
│       │   │   ├── consent_sanitization_export.test.ts # Consent denied -> Data scrubbing -> Zero PII export guarantee
│       │   │   ├── upload_storage_security.test.ts # File upload -> Magic byte validation -> Isolated non-exec storage -> Admin review
│       │   │   ├── lockout_session_audit.test.ts # 5 failed logins -> Lockout trigger -> Session invalidation -> Audit trail log
│       │   │   ├── ai_analyst_epistemic.test.ts # AI agent query -> Read-only enforcement -> 3-tier epistemic separation response
│       │   │   ├── amazon_attribution_telemetry.test.ts # ASIN URL builder -> Campaign UTM preservation -> Outbound telemetry event
│       │   │   └── whatsapp_enquiry_handoff.test.ts # Custom enquiry submission -> Reference ID -> wa.me URL prefill template
│       │   ├── tier4_scenarios/                # Tier 4: Real-World Customer & Admin Journeys
│       │   │   ├── journey1_custom_order_enquiry.test.ts # Scenario 1: Bespoke Custom Figurine Commission Journey
│       │   │   ├── journey2_catalog_pdp_amazon.test.ts # Scenario 2: Artisanal Catalog Discovery to Amazon India Purchase
│       │   │   ├── journey3_telemetry_privacy_funnel.test.ts # Scenario 3: Privacy-Preserving Telemetry & Funnel Analysis
│       │   │   ├── journey4_admin_crud_workflow.test.ts # Scenario 4: Admin Governance, Product Lifecycle & Enquiry Handling
│       │   │   └── journey5_bi_export_reconciliation.test.ts # Scenario 5: Full BI Export, 100% Reconciliation & AI Analyst Inspection
│       │   └── runner.ts                       # Test Suite Execution Runner
│       └── run_tests.py                        # Automated Cross-Platform Test Harness
```

---

## 3. Test Tier Breakdown & Scope Matrix

| Tier | Category | Target Scope | Minimum Test Count | Coverage Objective |
| :--- | :--- | :--- | :---: | :--- |
| **Tier 1** | Feature Coverage | F1 through F50 | **265+ tests** ($\ge 5$ / feature) | Validates baseline happy paths, schema invariants, HTTP status codes, and functional contracts. |
| **Tier 2** | Boundary & Corner Cases | F1 through F50 | **250+ tests** ($\ge 5$ / feature) | Validates limits, negative values, malformed inputs, rate-limits, clock skew, and security edge defenses. |
| **Tier 3** | Cross-Feature Interactions | 10 Pairwise Subsystems | **50+ tests** | Validates asynchronous handoffs, data consistency between modules, attribution isolation, and audit trails. |
| **Tier 4** | Real-World Application Scenarios | 5 Multi-Stage Journeys | **25+ tests** | Exercises complete end-to-end customer and administrative operations against end-state database/API contracts. |
| **TOTAL** | **Full Systematic Suite** | **F1 to F50 + Journeys** | **590+ tests** | **100% Comprehensive Coverage across R1–R7 and Acceptance Criteria.** |

---

## 4. Environment Configuration & Secrets Management

The test infrastructure strictly adheres to zero hardcoded secrets. All test runners use deterministic environment variables supplied via `.env.test` or direct process environment injection:

```ini
# BHAIRAVI CREATIONS - TEST SUITE ENVIRONMENT CONFIGURATION
NODE_ENV=test
PORT=4001
HOST=127.0.0.1
DATABASE_URL=./data/bhairavi_test.db
SQLITE_WAL_ENABLED=true
SQLITE_BUSY_TIMEOUT_MS=5000
SESSION_SECRET=test_secret_cookie_signing_token_min_32_chars_long_12345
SUPERADMIN_DEFAULT_PASSWORD=SuperAdminPass2026!
ADMIN_LOCKOUT_MAX_ATTEMPTS=5
ADMIN_LOCKOUT_DURATION_MINUTES=15
UPLOAD_MAX_FILE_SIZE_BYTES=10485760
UPLOAD_STORAGE_PATH=./storage/test_uploads
RATE_LIMIT_EVENTS_PER_MINUTE=60
RATE_LIMIT_AUTH_PER_15_MINUTES=5
WHATSAPP_BUSINESS_NUMBER=919876543210
AMAZON_ASSOCIATE_TAG=bhairavicreat-21
AI_ANALYST_TOKEN=test_ai_analyst_scoped_bearer_token_2026
```

---

## 5. Execution Commands & CLI Runner Reference

The test suite can be run collectively, by tier, or by individual feature group.

### Collective Execution (All Tiers):
```bash
# Execute full test suite via TypeScript runner
npx tsx src/tests/runner.ts

# Execute full test suite via Python cross-platform runner
python3 src/tests/run_tests.py

# Run standard Node.js test runner across all test files
node --test src/tests/**/*.test.ts
```

### Targeted Execution by Tier:
```bash
# Tier 1 only (Feature Coverage F1 - F50)
python3 src/tests/run_tests.py --tier 1
# or
node --test src/tests/e2e/tier1_features/*.test.ts

# Tier 2 only (Boundary & Corner Cases)
python3 src/tests/run_tests.py --tier 2
# or
node --test src/tests/e2e/tier2_boundaries/*.test.ts

# Tier 3 only (Pairwise Cross-Feature Interactions)
python3 src/tests/run_tests.py --tier 3
# or
node --test src/tests/e2e/tier3_interactions/*.test.ts

# Tier 4 only (Real-World Scenarios)
python3 src/tests/run_tests.py --tier 4
# or
node --test src/tests/e2e/tier4_scenarios/*.test.ts
```

### Targeted Execution by Feature Group:
```bash
# Data Model & Storage (F1 - F5)
node --test src/tests/e2e/tier1_features/f01_f05_datamodel.test.ts

# Telemetry & Ingestion (F16 - F20)
node --test src/tests/e2e/tier1_features/f16_f20_telemetry.test.ts

# Reconciliation Invariant (F31)
node --test src/tests/e2e/tier1_features/f31_f33_reconciliation.test.ts
```

---

## 6. Fixtures, Isolation Model & Invariant Assertions

### 6.1 Database Isolation & WAL Concurrency
Every test suite initializes an isolated, ephemeral SQLite test database (`data/bhairavi_test.db` or in-memory `:memory:`) with WAL pragmas enabled (`PRAGMA journal_mode = WAL`, `PRAGMA foreign_keys = ON`). Test suites run database migrations prior to suite execution and truncate tables during teardown.

### 6.2 Authoritative Domain Assertions (`assertions.ts`)
The test harness provides specialized assertion utilities enforcing project invariants:
1. `assertIntegerPaise(value: unknown, fieldName: string)`: Asserts that currency amounts are strictly non-negative integers representing INR paise (no floating point representation).
2. `assertOutcomeUnknown(event: AnalyticsEvent)`: Asserts that outbound events (`amazon_outbound_click`, `whatsapp_outbound_click`) carry `outcome_status: 'purchase_outcome_unknown'` and never claim verified sales.
3. `assertZeroPII(payload: unknown)`: Recursively scans payloads, URLs, and metadata to verify absence of email addresses, phone numbers, passwords, and raw messages.
4. `assertRFC4180CSV(csvString: string, expectedColumns: string[])`: Verifies CSV syntax conformance including CRLF line endings, header alignment, and proper quote escaping of commas and quotes.
5. `assertReconciliationZeroDrift(rawCount: number, rollupCount: number)`: Asserts that $\Delta = |\text{rawCount} - \text{rollupCount}| === 0$.

---

## 7. Pass / Fail Acceptance Criteria Traceability Matrix

Every acceptance criterion from `ORIGINAL_REQUEST.md` maps directly to verifiable automated assertions:

| Acceptance Criterion | Primary Verifying Test Suite | Key Invariant Asserted |
| :--- | :--- | :--- |
| **AC-1**: Browse & search catalogue | `f40_f44_catalog_pdp.test.ts` | Filter subset matches category, debounced query matches title/tag |
| **AC-2**: Accurate PDP specs & CTAs | `f40_f44_catalog_pdp.test.ts` | Slug resolves specs, dimensions, materials, Amazon URL, WhatsApp link |
| **AC-3**: Outbound click telemetry | `telemetry_outbound.test.ts` | Beacon fires on CTA click; records `purchase_outcome_unknown` |
| **AC-4**: Custom order validated submit | `f45_f50_custom_ext.test.ts` | Multipart POST validates inputs, stores attachments, generates ref ID |
| **AC-5**: Responsive & accessible UI | `f34_f39_storefront.test.ts` | WCAG contrast ratio $> 7:1$, semantic HTML, keyboard accessible |
| **AC-6**: Telemetry schema & shield | `f16_f20_telemetry.test.ts` | Rejects malformed JSON (400), invalid type (422), client purchase (403) |
| **AC-7**: Dashboard real DB records | `f06_f10_admin_crud.test.ts` | KPIs dynamically query real database counts (zero static mocks) |
| **AC-8**: Explicit numerators/denoms | `f21_f25_analytics.test.ts` | Every conversion rate returns documented numerator, denominator & formula |
| **AC-9**: Attribution integrity | `f21_f25_analytics.test.ts` | Outbound clicks labeled `purchase_outcome_unknown`; UI disclaimer present |
| **AC-10**: Zero customer PII in analytics | `consent_sanitization_export.test.ts` | Customer name/phone/email completely absent from analytics tables & APIs |
| **AC-11**: Admin auth access prevention | `f06_f10_admin_crud.test.ts` | Unauthenticated requests to `/admin/*` and exports return 401 Unauthorized |
| **AC-12**: Full product CRUD | `journey4_admin_crud_workflow.test.ts` | Admin creates, edits, publishes, archives; public view updates synchronously |
| **AC-13**: Enquiry lifecycle & notes | `enquiry_admin_lifecycle.test.ts` | Status transitions (`new` -> `contacted` -> `quoted` -> `converted`) & timeline log |
| **AC-14**: Filtered CSV/JSON exports | `f26_f30_exports.test.ts` | RFC 4180 CSV & JSON adherence for events, rollups, enquiries & catalog |
| **AC-15**: 100% Reconciliation ($\Delta = 0$) | `journey5_bi_export_reconciliation.test.ts` | Aggregated rollup count equals raw event count with zero variance |
| **AC-16**: Clean build & tests pass | `run_tests.py` / `runner.ts` | All test suites complete with zero errors and exit code 0 |
| **AC-17**: Strict `.env.example` secrets | `f11_f15_enquiry_sec.test.ts` | Zero hardcoded API keys or passwords; `.env.example` verified |
| **AC-18**: Comprehensive documentation | `TEST_READY.md` & `README.md` | Verification and step-by-step instructions documented |

---

## 8. Continuous Integration & Invalidation Conditions

1. **Test Failure Policy**: Any failure in Tier 1, Tier 2, Tier 3, or Tier 4 blocks deployment.
2. **Reconciliation Drift Invalidation**: If any test run produces $\Delta \ne 0$ between the immutable event log and aggregated daily rollups, the build is invalidated with `ERR_RECONCILIATION_DRIFT`.
3. **Attribution Breach Invalidation**: If an outbound click is classified as a confirmed purchase or recorded without the `purchase_outcome_unknown` tag, the build is invalidated with `ERR_ATTRIBUTION_BREACH`.
4. **PII Leakage Invalidation**: If any customer email, phone, or message body is discovered in analytics tables or exports, the build is invalidated with `ERR_PII_LEAKAGE`.
