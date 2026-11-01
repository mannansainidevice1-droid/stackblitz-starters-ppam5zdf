/**
 * BHAIRAVI Creations Digital Platform
 * Session Management, Cookie Handling & Revocation Module
 * Target: src/server/auth/session.ts
 */

import Database from 'better-sqlite3';
import { generateRawSessionToken, hashSessionToken, hashClientIp } from './tokens.js';
import { SessionUser } from './types.js';

export const SESSION_COOKIE_NAME = 'bhr_session';
export const SESSION_DURATION_HOURS = 8;

/**
 * Serializes the Set-Cookie header for an active admin session.
 * Contract: HttpOnly; SameSite=Strict; Secure; Path=/
 */
export function serializeSessionCookie(rawToken: string, expiresAt: Date): string {
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  return `${SESSION_COOKIE_NAME}=${rawToken}; HttpOnly; SameSite=Strict; Secure; Path=/; Max-Age=${maxAgeSeconds}; Expires=${expiresAt.toUTCString()}`;
}

/**
 * Serializes the Set-Cookie header to clear the session cookie.
 */
export function serializeClearCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Strict; Secure; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`;
}

/**
 * Parses the raw session token from the incoming Cookie request header.
 */
export function parseSessionCookie(cookieHeader?: string | null): string | null {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      const val = trimmed.slice(SESSION_COOKIE_NAME.length + 1).trim();
      return val.length > 0 ? val : null;
    }
  }
  return null;
}

/**
 * Creates a new administrative session.
 * Stores ONLY the SHA-256 hash in SQLite admin_sessions.
 */
export function createSession(
  db: Database.Database,
  userId: string,
  options: { userAgent?: string; ipHash?: string; durationHours?: number } = {}
): { rawToken: string; cookie: string; expiresAt: Date } {
  const rawToken = generateRawSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const hours = options.durationHours ?? SESSION_DURATION_HOURS;
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000);

  // Defense-in-depth: Ensure ipHash is a valid 64-character hex digest
  let finalIpHash = options.ipHash ?? null;
  if (finalIpHash && !/^[0-9a-f]{64}$/i.test(finalIpHash)) {
    finalIpHash = hashClientIp(finalIpHash);
  }

  db.prepare(`
    INSERT INTO admin_sessions (id, admin_user_id, user_agent, ip_hash, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(tokenHash, userId, options.userAgent ?? null, finalIpHash, expiresAt.toISOString());

  const cookie = serializeSessionCookie(rawToken, expiresAt);
  return { rawToken, cookie, expiresAt };
}

/**
 * Verifies a session by resolving the rawToken via its SHA-256 hash.
 * Checks expiration, account active status, and lockout state.
 */
export function verifySession(
  db: Database.Database,
  rawToken?: string | null
): SessionUser | null {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length === 0) {
    return null; // Empty or whitespace cookie
  }

  const tokenHash = hashSessionToken(rawToken.trim());
  const row = db.prepare(`
    SELECT 
      s.id as session_id,
      s.expires_at,
      u.id as user_id,
      u.username,
      u.email,
      u.role,
      u.is_active,
      u.locked_until
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.id = ?
  `).get(tokenHash) as any;

  if (!row) return null;

  const now = new Date();

  // Expiration check (even 1ms expired)
  if (now > new Date(row.expires_at)) {
    db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(tokenHash);
    return null;
  }

  // Account active check
  if (row.is_active !== 1) {
    db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(tokenHash);
    return null;
  }

  // Account locked check
  if (row.locked_until && new Date(row.locked_until) > now) {
    db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(tokenHash);
    return null;
  }

  return {
    id: row.user_id,
    username: row.username,
    email: row.email,
    role: row.role
  };
}

/**
 * Revokes an individual session by raw token.
 */
export function revokeSession(db: Database.Database, rawToken: string): void {
  if (!rawToken) return;
  const tokenHash = hashSessionToken(rawToken);
  db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(tokenHash);
}

/**
 * Purges all active sessions for a user (e.g. upon account lockout or password change).
 */
export function revokeAllUserSessions(db: Database.Database, userId: string): void {
  db.prepare('DELETE FROM admin_sessions WHERE admin_user_id = ?').run(userId);
}
