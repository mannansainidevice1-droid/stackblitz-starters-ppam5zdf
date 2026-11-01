/**
 * BHAIRAVI Creations Digital Platform
 * 3-Tier Role-Based Access Control (RBAC) Module
 * Target: src/server/auth/rbac.ts
 */

import { AdminRole } from '../../shared/types.js';
import { Permission } from './types.js';

const ROLE_PERMISSIONS: Record<AdminRole, Set<Permission>> = {
  superadmin: new Set([
    'products:read',
    'products:mutate',
    'enquiries:read',
    'enquiries:mutate',
    'enquiries:export_pii',
    'users:manage',
    'settings:read',
    'settings:mutate',
    'audit:read',
    'analytics:read',
    'export:read'
  ]),
  admin: new Set([
    'products:read',
    'products:mutate',
    'enquiries:read',
    'enquiries:mutate',
    'settings:read',
    'analytics:read',
    'export:read'
  ]),
  viewer: new Set([
    'products:read',
    'settings:read',
    'analytics:read'
  ])
};

/**
 * Checks if a specific role possesses a permission.
 * Corrupted or unknown roles strictly default to false (least privilege).
 */
export function hasPermission(role: string, permission: Permission): boolean {
  if (role !== 'superadmin' && role !== 'admin' && role !== 'viewer') {
    return false;
  }
  return ROLE_PERMISSIONS[role as AdminRole]?.has(permission) ?? false;
}

export function canManageUsers(role: string): boolean {
  return role === 'superadmin';
}

export function canExportPII(role: string): boolean {
  return role === 'superadmin';
}

export function canMutateProducts(role: string): boolean {
  return role === 'superadmin' || role === 'admin';
}

export function canMutateEnquiries(role: string): boolean {
  return role === 'superadmin' || role === 'admin';
}

export function canViewAuditLogs(role: string): boolean {
  return role === 'superadmin';
}

export function canReadEnquiries(role: string): boolean {
  return hasPermission(role, 'enquiries:read');
}

export function canExportData(role: string): boolean {
  return hasPermission(role, 'export:read');
}
