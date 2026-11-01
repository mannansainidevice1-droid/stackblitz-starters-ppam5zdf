/**
 * BHAIRAVI Creations - Custom Invariant Assertion Library
 * Enforces mathematical and architectural contracts defined in PROJECT.md
 */

import assert from 'node:assert';

/**
 * Asserts that a currency value is strictly an integer representing Indian Paise (INR).
 * Never allows floating-point values or negative amounts.
 */
export function assertIntegerPaise(value: unknown, label: string = 'price'): void {
  assert(
    typeof value === 'number',
    `Expected ${label} to be a number, got ${typeof value} (${String(value)})`
  );
  assert(
    Number.isInteger(value),
    `Floating-point pricing violation: ${label} must be integer paise, received: ${value}`
  );
  assert(
    value >= 0,
    `Negative pricing violation: ${label} cannot be negative, received: ${value}`
  );
}

/**
 * Asserts that outbound events (Amazon or WhatsApp clicks) are tagged with
 * 'purchase_outcome_unknown' and never claim confirmed purchases.
 */
export function assertOutcomeUnknown(event: Record<string, any>): void {
  assert(
    event.outcome_status === 'purchase_outcome_unknown',
    `Attribution Integrity Breach: Outbound event must be tagged with outcome_status="purchase_outcome_unknown", got "${event.outcome_status}"`
  );
  assert(
    event.event_type !== 'purchase',
    `Security Invariant Breach: Outbound click event cannot be recorded as a verified "purchase"`
  );
}

/**
 * Recursively inspects any payload or data structure to ensure ZERO customer PII
 * (emails, Indian phone numbers, plaintext passwords, sensitive form text) is leaked.
 */
export function assertZeroPII(data: unknown, path: string = 'root'): void {
  if (data === null || data === undefined) return;

  const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/;
  const indianPhoneRegex = /(?:\+?91[\-\s]?)?[6789]\d{9}/;
  const passwordKeyRegex = /password|secret|token|hash/i;

  if (typeof data === 'string') {
    assert(
      !emailRegex.test(data),
      `PII Leakage Detected: Email found in payload at path "${path}": "${data}"`
    );
    const isIdOrUuid = path.endsWith('event_id') || path.endsWith('session_id') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data);
    if (!isIdOrUuid) {
      assert(
        !indianPhoneRegex.test(data.replace(/[\s-]/g, '')),
        `PII Leakage Detected: Phone number found in payload at path "${path}": "${data}"`
      );
    }
  } else if (Array.isArray(data)) {
    data.forEach((item, idx) => assertZeroPII(item, `${path}[${idx}]`));
  } else if (typeof data === 'object') {
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (passwordKeyRegex.test(key) && typeof val === 'string' && val.length > 0) {
        // Allow hashed tokens or redacted flags, forbid raw passwords
        if (!val.startsWith('$2') && !val.startsWith('$argon2') && val !== '[REDACTED]') {
          assert.fail(`Sensitive credential key exposed at path "${path}.${key}"`);
        }
      }
      assertZeroPII(val, `${path}.${key}`);
    }
  }
}

/**
 * Asserts that an exported CSV string conforms to RFC 4180 specification:
 * - Proper header alignment
 * - CRLF or LF line endings
 * - Correct quote escaping for embedded commas or quotes
 */
export function assertRFC4180CSV(csvContent: string, expectedHeaders: string[]): void {
  assert(typeof csvContent === 'string', 'Expected CSV content to be a string');
  assert(csvContent.trim().length > 0, 'CSV export content is empty');

  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  assert(lines.length >= 1, 'CSV export must contain at least a header row');

  // Verify headers
  const headerLine = lines[0];
  const actualHeaders = headerLine.split(',').map((h) => h.replace(/^"|"$/g, '').trim());

  for (const expected of expectedHeaders) {
    assert(
      actualHeaders.includes(expected),
      `CSV Header Mismatch: Missing expected column "${expected}". Found: [${actualHeaders.join(', ')}]`
    );
  }

  // Verify row column count matches header column count
  const headerColCount = actualHeaders.length;
  for (let i = 1; i < lines.length; i++) {
    // Basic RFC 4180 field tokenizer
    const row = lines[i];
    let inQuotes = false;
    let colCount = 1;
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '"') {
        inQuotes = !inQuotes;
      } else if (row[c] === ',' && !inQuotes) {
        colCount++;
      }
    }
    assert.strictEqual(
      colCount,
      headerColCount,
      `CSV Row Alignment Violation at line ${i + 1}: expected ${headerColCount} columns, parsed ${colCount}`
    );
  }
}

/**
 * Asserts 100% mathematical reconciliation invariant between raw event count
 * and aggregated daily rollups: Delta === 0.
 */
export function assertReconciliationZeroDrift(rawCount: number, rollupCount: number): void {
  const delta = Math.abs(rawCount - rollupCount);
  assert.strictEqual(
    delta,
    0,
    `Reconciliation Invariant Violation: Mathematical drift detected! Raw events count (${rawCount}) does not match aggregate rollup count (${rollupCount}). Delta = ${delta}`
  );
}

/**
 * Asserts that an AI Analyst response conforms strictly to the 3-tier epistemic contract:
 * tier_1_measured_facts, tier_2_derived_metrics, and tier_3_hypotheses_and_inferences.
 */
export function assertEpistemicSeparation(payload: Record<string, any>): void {
  assert(
    payload.epistemic_classification,
    'AI Analyst API Error: Missing "epistemic_classification" root object'
  );

  const { tier_1_measured_facts, tier_2_derived_metrics, tier_3_hypotheses_and_inferences } =
    payload.epistemic_classification;

  assert(
    tier_1_measured_facts && typeof tier_1_measured_facts === 'object',
    'AI Analyst API Error: Missing or invalid "tier_1_measured_facts"'
  );
  assert(
    tier_2_derived_metrics && typeof tier_2_derived_metrics === 'object',
    'AI Analyst API Error: Missing or invalid "tier_2_derived_metrics"'
  );
  assert(
    tier_3_hypotheses_and_inferences && typeof tier_3_hypotheses_and_inferences === 'object',
    'AI Analyst API Error: Missing or invalid "tier_3_hypotheses_and_inferences"'
  );

  // Invariant: Tier 2 must explicitly provide formula disclosure
  assert(
    tier_2_derived_metrics.formulas_applied || tier_2_derived_metrics.explicit_denominator !== undefined,
    'Epistemic Violation: Derived metrics must explicitly state formulas applied and denominators'
  );

  // Invariant: Tier 3 must include statistical heuristic disclaimer
  assert(
    typeof tier_3_hypotheses_and_inferences.disclaimer === 'string',
    'Epistemic Violation: Hypotheses tier must include clear non-audited heuristic disclaimer'
  );
}
