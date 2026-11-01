/**
 * BHAIRAVI Creations Digital Platform
 * Integer INR Pricing Engine & Indian Numbering System Formatter
 * Target: src/shared/pricing.ts
 *
 * Implements Feature F2: Integer INR paise pricing model.
 */

export type Paise = number;

export interface PriceBreakdown {
  paise: Paise;
  rupees: number;
  formatted: string;
  formattedCompact: string;
}

/**
 * Asserts that a value is a valid, non-negative integer paise amount.
 */
export function assertPaise(value: unknown): asserts value is Paise {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new TypeError(
      `Invalid paise amount: '${value}'. Must be a non-negative integer representing paise.`
    );
  }
}

/**
 * Checks if a value is a valid non-negative integer paise.
 */
export function isValidPaise(value: unknown): value is Paise {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/**
 * Converts integer paise to floating-point rupees.
 * E.g. 149900 -> 1499.00
 */
export function paiseToRupees(paise: Paise): number {
  assertPaise(paise);
  return paise / 100;
}

/**
 * Converts decimal rupees into integer paise, rounding to the nearest paisa.
 * E.g. 1499.50 -> 149950
 */
export function rupeesToPaise(rupees: number): Paise {
  if (typeof rupees !== 'number' || Number.isNaN(rupees) || rupees < 0) {
    throw new TypeError(`Invalid rupees value: '${rupees}'. Must be a non-negative number.`);
  }
  return Math.round(rupees * 100);
}

/**
 * Formats integer paise into standard Indian Rupee presentation (en-IN).
 * Uses the Indian numbering system (thousands, then lakhs, then crores).
 * E.g. 149900 -> "₹1,499", 149950 -> "₹1,499.50", 12500000 -> "₹1,25,000"
 */
export function formatINR(
  paise: Paise,
  options: { showZeroPaise?: boolean } = {}
): string {
  assertPaise(paise);
  const rupees = paise / 100;
  const hasSubRupee = paise % 100 !== 0;

  const minFractionDigits = options.showZeroPaise ? 2 : hasSubRupee ? 2 : 0;
  const maxFractionDigits = 2;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  }).format(rupees);
}

/**
 * Computes total price from a base price and an optional variant modifier.
 */
export function calculateEffectivePrice(
  basePricePaise: Paise,
  modifierPaise: number = 0
): Paise {
  assertPaise(basePricePaise);
  if (!Number.isInteger(modifierPaise)) {
    throw new TypeError(`Variant price modifier must be an integer: '${modifierPaise}'`);
  }

  const effective = basePricePaise + modifierPaise;
  if (effective < 0) {
    throw new RangeError(
      `Effective price cannot be negative: base ${basePricePaise} + modifier ${modifierPaise} = ${effective}`
    );
  }
  return effective;
}

/**
 * Returns a complete PriceBreakdown object for templates and APIs.
 */
export function getPriceBreakdown(paise: Paise): PriceBreakdown {
  assertPaise(paise);
  return {
    paise,
    rupees: paise / 100,
    formatted: formatINR(paise),
    formattedCompact: formatINR(paise, { showZeroPaise: false }),
  };
}

export const formatPaiseToInr = formatINR;

