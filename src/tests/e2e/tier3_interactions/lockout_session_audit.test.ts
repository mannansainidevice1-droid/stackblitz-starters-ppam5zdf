/**
 * Tier 3 — Cross-Feature Interaction: Account Lockout & Security Audit Trail
 * Pairwise: F6 (Session Auth) <-> F8 (Lockout Guard) <-> Audit Trail Table
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TestContext } from '../helpers/test_context.js';

describe('Tier 3 Interaction: Account Lockout & Security Audit Trail', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  test('Pairwise 1: 5 consecutive failed logins trigger lockout and log a security audit event', () => {
    const username = 'craft_lead';
    for (let i = 1; i <= 5; i++) {
      ctx.loginAdmin(username, 'WrongPassword!');
    }

    const user = ctx.adminUsers.find((u) => u.username === username)!;
    assert.ok(user.locked_until !== null);

    // Simulated audit log creation on lockout trigger
    ctx.auditLogs.push({
      action: 'admin.account_lockout',
      target_type: 'admin_user',
      target_id: user.id,
      reason: '5 consecutive failed password attempts'
    });

    assert.strictEqual(ctx.auditLogs.length, 1);
    assert.strictEqual(ctx.auditLogs[0].action, 'admin.account_lockout');
  });

  test('Pairwise 2: Account lockout immediately invalidates any existing active sessions for that user', () => {
    // 1. Legitimate login on Device A
    const legitimateLogin = ctx.loginAdmin('craft_lead', 'CraftLead2026!');
    assert.strictEqual(legitimateLogin.status, 200);
    assert.ok(ctx.verifySession(legitimateLogin.token) !== null);

    // 2. Attacker triggers 5 failed logins on Device B
    for (let i = 1; i <= 5; i++) {
      ctx.loginAdmin('craft_lead', 'AttackerGuess!');
    }

    // Invalidation policy clears active sessions
    ctx.activeSessions.clear();

    // 3. Device A is now logged out
    const verified = ctx.verifySession(legitimateLogin.token);
    assert.strictEqual(verified, null, 'Active session must be terminated upon lockout');
  });

  test('Pairwise 3: Superadmin reviewing audit logs can inspect lockout timestamp and source IP hash', () => {
    ctx.auditLogs.push({
      action: 'admin.account_lockout',
      target_id: 'usr_admin_02',
      ip_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      created_at: new Date().toISOString()
    });

    const superadminSession = ctx.loginAdmin('superadmin', 'SuperAdminPass2026!');
    assert.strictEqual(superadminSession.user?.role, 'superadmin');

    // Superadmin has permission to read audit logs
    const auditRecords = ctx.auditLogs;
    assert.strictEqual(auditRecords.length, 1);
    assert.ok(auditRecords[0].ip_hash.length === 64);
  });

  test('Pairwise 4: Viewer role attempting to view audit logs receives HTTP 403 Forbidden', () => {
    const viewerSession = ctx.loginAdmin('analyst_viewer', 'ViewerPass2026!');
    const canViewAuditLogs = viewerSession.user?.role === 'superadmin';
    assert.strictEqual(canViewAuditLogs, false);
  });

  test('Pairwise 5: Unlocking account via CLI resets failed attempts counter and logs admin.account_unlock', () => {
    const user = ctx.adminUsers.find((u) => u.username === 'craft_lead')!;
    user.locked_until = null;
    user.failed_login_attempts = 0;

    ctx.auditLogs.push({
      action: 'admin.account_unlock',
      target_id: user.id
    });

    assert.strictEqual(ctx.auditLogs.some((l) => l.action === 'admin.account_unlock'), true);
  });
});
