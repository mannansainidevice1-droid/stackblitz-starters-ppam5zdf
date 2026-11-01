/**
 * BHAIRAVI Creations Digital Platform
 * HTTP Cookie Parsing & Header Serialization Middleware
 * Target: src/server/middleware/cookies.ts
 */

import { IncomingMessage, ServerResponse } from 'node:http';
import { parseSessionCookie, serializeSessionCookie, serializeClearCookie } from '../auth/session.js';

export function getSessionTokenFromRequest(req: IncomingMessage): string | null {
  const cookieHeader = req.headers['cookie'];
  return parseSessionCookie(cookieHeader);
}

export function setSessionCookie(res: ServerResponse, rawToken: string, expiresAt: Date): void {
  const cookie = serializeSessionCookie(rawToken, expiresAt);
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res: ServerResponse): void {
  const cookie = serializeClearCookie();
  res.setHeader('Set-Cookie', cookie);
}
