/**
 * BHAIRAVI Creations Digital Platform
 * Brute-Force & Lockout Guard Module
 * Target: src/server/auth/lockout.ts
 */

import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import { revokeAllUserSessions } from './session.js';
import { hashClientIp } from './tokens.js';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface LockoutCheckResult {
  isLocked: boolean;
  lockedUntil?: string;
  error?: string;
}

/**
 * Evaluates whether an account is currently locked out.
 * Automatically clears expired lockout status if the 15-minute window has elapsed.
 */
export function evaluateLockoutState(
  db: Database.Database,
  user: { id: string; failed_login_attempts: number; locked_until: string | null }
): LockoutCheckResult {
  const now = new Date();
  if (user.locked_until) {
    const lockTime = new Date(user.locked_until);
    if (lockTime > now) {
      // Account remains locked
      return {
        isLocked: true,
        lockedUntil: user.locked_until,
        error: 'Account locked: 5 consecutive failed attempts. Locked for 15 minutes.'
      };
    } else {
      // Lockout window has elapsed, unlock automatically
      db.prepare(`
        UPDATE admin_users 
        SET failed_login_attempts = 0, locked_until = NULL 
        WHERE id = ?
      `).run(user.id);
      user.locked_until = null;
      user.failed_login_attempts = 0;
    }
  }
  return { isLocked: false };
}

/**
 * Handles a failed login attempt.
 * Increments failed attempt count and triggers account lockout at 5 failures.
 */
export function handleFailedLogin(
  db: Database.Database,
  user: { id: string; failed_login_attempts: number },
  clientIpHash?: string
): { status: 401 | 423; error: string } {
  const newAttempts = user.failed_login_attempts + 1;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();

    // 1. Lock the account
    db.prepare(`
      UPDATE admin_users 
      SET failed_login_attempts = ?, locked_until = ? 
      WHERE id = ?
    `).run(newAttempts, lockedUntil, user.id);

    // 2. Terminate all active sessions for this user
    revokeAllUserSessions(db, user.id);

    // Defense-in-depth: Ensure clientIpHash is a valid 64-character hex digest
    let finalIpHash = clientIpHash ?? null;
    if (finalIpHash && !/^[0-9a-f]{64}$/i.test(finalIpHash)) {
      finalIpHash = hashClientIp(finalIpHash);
    }

    // 3. Insert security audit log
    db.prepare(`
      INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id, changes_json, ip_hash)
      VALUES (?, ?, 'admin.account_lockout', 'admin_user', ?, ?, ?)
    `).run(
      'audit_' + crypto.randomUUID(),
      user.id,
      user.id,
      JSON.stringify({ reason: '5 consecutive failed password attempts', locked_until: lockedUntil }),
      finalIpHash
    );

    return {
      status: 423,
      error: 'Account locked: 5 consecutive failed attempts. Locked for 15 minutes.'
    };
  }

  // Attempts 1-4
  db.prepare(`UPDATE admin_users SET failed_login_attempts = ? WHERE id = ?`).run(newAttempts, user.id);
  return { status: 401, error: 'Invalid username or password' };
}

/**
 * Clears lockout counters upon successful authentication.
 */
export function handleSuccessfulLogin(db: Database.Database, userId: string): void {
  db.prepare(`
    UPDATE admin_users 
    SET failed_login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(userId);
}

/**
 * Administratively unlocks a user account (e.g. by superadmin or CLI).
 */
export function unlockAccount(db: Database.Database, userId: string, actorAdminId?: string): void {
  db.prepare(`
    UPDATE admin_users 
    SET failed_login_attempts = 0, locked_until = NULL 
    WHERE id = ?
  `).run(userId);

  db.prepare(`
    INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id, changes_json)
    VALUES (?, ?, 'admin.account_unlock', 'admin_user', ?, ?)
  `).run(
    'audit_' + crypto.randomUUID(),
    actorAdminId ?? null,
    userId,
    JSON.stringify({ action: 'admin.account_unlock' })
  );
}
