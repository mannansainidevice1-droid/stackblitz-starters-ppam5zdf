/**
 * BHAIRAVI Creations Digital Platform
 * Admin Authentication & Session Types
 * Target: src/server/auth/types.ts
 */

import { AdminRole } from '../../shared/types.js';

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
}

export interface ActiveSession {
  sessionId: string; // SHA-256 hash
  userId: string;
  role: AdminRole;
  expiresAt: Date;
}

export interface LoginResult {
  status: 200 | 401 | 423 | 429;
  token?: string;
  cookie?: string;
  user?: SessionUser;
  error?: string;
}

export type Permission =
  | 'products:read'
  | 'products:mutate'
  | 'enquiries:read'
  | 'enquiries:mutate'
  | 'enquiries:export_pii'
  | 'users:manage'
  | 'settings:read'
  | 'settings:mutate'
  | 'audit:read'
  | 'analytics:read'
  | 'export:read';
