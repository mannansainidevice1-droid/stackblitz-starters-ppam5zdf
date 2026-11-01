/**
 * BHAIRAVI Creations Digital Platform
 * Cryptographic Token Generation & Hashing Module
 * Target: src/server/auth/tokens.ts
 */

import crypto from 'node:crypto';

/**
 * Generates a 32-byte cryptographically secure random session token (64 hex characters).
 */
export function generateRawSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Derives the deterministic SHA-256 hash of a raw session token.
 * Only this hash is stored in the `admin_sessions` table.
 */
export function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken, 'utf-8').digest('hex');
}

/**
 * Resolves the daily rotating salt used for IP anonymization.
 * Respects process.env.IP_HASH_SALT if configured; otherwise generates a daily UTC salt.
 */
export function getDailySalt(): string {
  return process.env.IP_HASH_SALT || ('bhr_daily_salt_' + new Date().toISOString().slice(0, 10));
}

/**
 * Anonymizes client IP address using SHA-256 with a daily rotating salt.
 * Ensures customer and admin PII is never stored in telemetry, admin sessions, or audit logs.
 * Output is guaranteed to be a 64-character lowercase hexadecimal string.
 */
export function hashClientIp(clientIp: string, salt: string = getDailySalt()): string {
  return crypto.createHash('sha256').update(`${clientIp}:${salt}`, 'utf-8').digest('hex');
}
