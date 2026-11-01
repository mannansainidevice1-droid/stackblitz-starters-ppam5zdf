/**
 * BHAIRAVI Creations Digital Platform
 * Honeypot & Submission Timing Anti-Spam Gatekeeper
 * Target: src/server/middleware/anti_spam.ts
 */

export function validateHoneypot(honeypotField?: string | null): boolean {
  if (!honeypotField) return true; // Clean
  return honeypotField.trim().length === 0;
}

export function validateRenderTimestamp(
  renderedAt: number | string | undefined | null
): { valid: boolean; reason?: string } {
  if (renderedAt === undefined || renderedAt === null || renderedAt === '') {
    return { valid: false, reason: 'Missing render timestamp' };
  }

  const renderTime = typeof renderedAt === 'string' ? Number(renderedAt) : renderedAt;
  if (isNaN(renderTime)) {
    return { valid: false, reason: 'Invalid render timestamp format' };
  }

  const now = Date.now();
  const durationMs = now - renderTime;

  // Too fast (< 2.5s / 2500ms) indicates automated bot script
  if (durationMs < 2500) {
    return { valid: false, reason: 'Automated script detected: submission completed in < 2.5s' };
  }

  // Stale replay (> 24 hours / 86400000ms) indicates session expiration
  if (durationMs > 86400000) {
    return { valid: false, reason: 'Submission timestamp expired (> 24h)' };
  }

  return { valid: true };
}
