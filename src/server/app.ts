/**
 * BHAIRAVI Creations Digital Platform
 * Main HTTP Dispatcher & REST API Application
 * Target: src/server/app.ts
 */

import http, { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import Database from 'better-sqlite3';
import { getDatabase } from './db/connection.js';
import { verifySession, createSession, revokeSession } from './auth/session.js';
import { evaluateLockoutState, handleFailedLogin, handleSuccessfulLogin } from './auth/lockout.js';
import crypto from 'node:crypto';
import { verifyPassword, DUMMY_PASSWORD_HASH } from './auth/password.js';
import { hashClientIp } from './auth/tokens.js';
import { hasPermission, canManageUsers, canExportPII, canMutateProducts, canMutateEnquiries, canViewAuditLogs, canExportData } from './auth/rbac.js';
import { getSessionTokenFromRequest, setSessionCookie, clearSessionCookie } from './middleware/cookies.js';
import { authRateLimiter, telemetryRateLimiter, aiAnalystRateLimiter } from './middleware/rate_limiter.js';
import { ProductService } from './services/product.service.js';
import { EnquiryService } from './services/enquiry.service.js';
import { KpiService } from './services/kpi.service.js';
import { DiagnosticsService } from './services/diagnostics.service.js';
import { AnalyticsService } from './services/analytics.service.js';
import { ExportService, ExportType, ExportFormat } from './services/export.service.js';
import { ReconciliationService } from './services/reconciliation.service.js';
import { AiAnalystService } from './services/ai_analyst.service.js';
import {
  validateImageMagicBytes,
  storeUploadFile,
  getUploadRootDirectory,
  MAX_PRODUCT_IMAGE_SIZE_BYTES
} from './services/upload.service.js';
import { generateArtisanalSvg } from './services/artisanal_svg.service.js';
import { SessionUser } from './auth/types.js';
import { renderHomePage } from './views/home.view.js';
import { renderCatalogPage } from './views/catalog.view.js';
import { renderProductDetailPage } from './views/pdp.view.js';
import { renderCustomOrderPage } from './views/custom_order.view.js';
import {
  renderAboutPage,
  renderContactPage,
  renderFaqPage,
  renderShippingPage,
  renderReturnsPage,
  renderPrivacyPage,
  renderTermsPage
} from './views/supporting.view.js';
import { renderNotFoundPage } from './views/not_found.view.js';
import { renderAdminPage } from './views/admin.view.js';

export interface AppRequest extends IncomingMessage {
  user?: SessionUser | null;
  rawSessionToken?: string | null;
  parsedBody?: any;
  rawBodyBuffer?: Buffer;
  bodyParseError?: Error | null;
  uploadedFiles?: Record<string, { buffer: Buffer; filename: string; mimeType: string }>;
}

/**
 * Standard JSON Response Sender.
 */
export function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(payload);
}

/**
 * Standard HTML Response Sender.
 */
export function sendHtml(res: ServerResponse, statusCode: number, html: string): void {
  const payload = Buffer.from(html, 'utf-8');
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': payload.length,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https://*.amazon.com https://*.amazon.in https://*.ssl-images-amazon.com; connect-src 'self';"
  });
  res.end(payload);
}

/**
 * Helper to parse multipart/form-data payload into fields and files.
 */
function parseMultipartFormData(
  bodyBuffer: Buffer,
  boundary: string
): { fields: Record<string, any>; files: Record<string, { buffer: Buffer; filename: string; mimeType: string }> } {
  const fields: Record<string, any> = {};
  const files: Record<string, { buffer: Buffer; filename: string; mimeType: string }> = {};

  const delimiter = Buffer.from(`\r\n--${boundary}`);
  const initialBoundary = Buffer.from(`--${boundary}`);
  let startIndex = 0;

  // Locate the very first boundary
  const firstBoundaryIndex = bodyBuffer.indexOf(initialBoundary, startIndex);
  if (firstBoundaryIndex === -1) return { fields, files };
  startIndex = firstBoundaryIndex + initialBoundary.length;

  while (startIndex < bodyBuffer.length) {
    // Check if end of multipart (followed by --)
    if (bodyBuffer[startIndex] === 0x2d && bodyBuffer[startIndex + 1] === 0x2d) {
      break;
    }

    // Skip \r\n after boundary line
    if (bodyBuffer[startIndex] === 0x0d && bodyBuffer[startIndex + 1] === 0x0a) {
      startIndex += 2;
    }

    // Find end of headers
    const headerEnd = bodyBuffer.indexOf(Buffer.from('\r\n\r\n'), startIndex);
    if (headerEnd === -1) break;

    const headersText = bodyBuffer.slice(startIndex, headerEnd).toString('utf-8');
    const contentStart = headerEnd + 4;

    // Search strictly for the complete boundary delimiter (\r\n--boundary)
    const nextDelimiter = bodyBuffer.indexOf(delimiter, contentStart);
    const partContent = nextDelimiter !== -1 ? bodyBuffer.slice(contentStart, nextDelimiter) : bodyBuffer.slice(contentStart);

    // Parse Content-Disposition
    const dispositionMatch = headersText.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
    if (dispositionMatch) {
      const fieldName = dispositionMatch[1];
      const filename = dispositionMatch[2];

      if (filename !== undefined && filename.trim() !== '') {
        const contentTypeMatch = headersText.match(/Content-Type:\s*([^\r\n]+)/i);
        const mimeType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
        files[fieldName] = {
          buffer: partContent,
          filename: filename.trim(),
          mimeType
        };
      } else if (filename === undefined) {
        fields[fieldName] = partContent.toString('utf-8');
      }
    }

    if (nextDelimiter === -1) break;
    startIndex = nextDelimiter + delimiter.length;
  }

  return { fields, files };
}

export const MAX_REQUEST_BODY_BYTES = 20 * 1024 * 1024; // 20MB stream ceiling

export class PayloadTooLargeError extends Error {
  public statusCode: number = 413;
  constructor(message: string = 'Payload Too Large: Request body exceeds maximum allowed limit of 20MB') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

/**
 * Reads and parses request body (JSON or multipart/form-data) with running byte ceiling.
 */
export async function parseRequestBody(
  req: AppRequest,
  maxBytes: number = MAX_REQUEST_BODY_BYTES
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 1. Early Content-Length header verification
    const contentLengthHeader = req.headers['content-length'];
    if (contentLengthHeader) {
      const contentLength = parseInt(contentLengthHeader, 10);
      if (!isNaN(contentLength) && contentLength > maxBytes) {
        req.destroy();
        return reject(
          new PayloadTooLargeError(`Payload Too Large: Content-Length ${contentLength} exceeds limit of ${maxBytes} bytes`)
        );
      }
    }

    const chunks: Buffer[] = [];
    let receivedBytes = 0;
    let destroyed = false;

    req.on('data', (chunk: Buffer) => {
      if (destroyed) return;
      receivedBytes += chunk.length;

      if (receivedBytes > maxBytes) {
        destroyed = true;
        req.pause();
        req.destroy();
        return reject(
          new PayloadTooLargeError(`Payload Too Large: Stream exceeded limit of ${maxBytes} bytes`)
        );
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      if (destroyed) return;
      const buffer = Buffer.concat(chunks);
      req.rawBodyBuffer = buffer;
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        try {
          req.parsedBody = buffer.length > 0 ? JSON.parse(buffer.toString('utf-8')) : {};
        } catch (err: any) {
          req.parsedBody = undefined;
          req.bodyParseError = err;
        }
      } else if (contentType.includes('text/plain')) {
        try {
          req.parsedBody = buffer.length > 0 ? JSON.parse(buffer.toString('utf-8')) : {};
        } catch (err: any) {
          req.parsedBody = buffer.toString('utf-8');
        }
      } else if (contentType.includes('multipart/form-data')) {
        const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
        if (boundaryMatch) {
          const boundary = boundaryMatch[1].trim().replace(/^"|"$/g, '');
          const { fields, files } = parseMultipartFormData(buffer, boundary);
          req.parsedBody = fields;
          req.uploadedFiles = files;
        } else {
          req.parsedBody = {};
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(buffer.toString('utf-8'));
        const obj: Record<string, any> = {};
        for (const [k, v] of params.entries()) {
          obj[k] = v;
        }
        req.parsedBody = obj;
      } else {
        req.parsedBody = {};
      }

      resolve();
    });

    req.on('error', (err) => {
      if (destroyed) return;
      reject(err);
    });
  });
}

/**
 * Creates the HTTP Dispatcher function mounting all APIs.
 */
export function createApp(database?: Database.Database) {
  const db = database ?? getDatabase();
  const productService = new ProductService(db);
  const enquiryService = new EnquiryService(db);
  const kpiService = new KpiService(db);
  const diagnosticsService = new DiagnosticsService(db);
  const analyticsService = new AnalyticsService(db);
  const exportService = new ExportService(db);
  const reconciliationService = new ReconciliationService(db);
  const aiAnalystService = new AiAnalystService(db);

  return async function requestHandler(req: AppRequest, res: ServerResponse) {
    try {
      // 1. Parse URL & Query
      const host = req.headers.host || 'localhost:4001';
      const parsedUrl = new URL(req.url || '/', `http://${host}`);
      const pathname = parsedUrl.pathname;
      const method = req.method?.toUpperCase() || 'GET';

      // 2. Extract Session Token & Resolve User
      const rawToken = getSessionTokenFromRequest(req);
      req.rawSessionToken = rawToken;
      if (rawToken) {
        req.user = verifySession(db, rawToken);
      } else {
        req.user = null;
      }

      // 3. Static File Serving for Uploaded Assets: GET /uploads/products/:file and /uploads/enquiries/:file
      if ((method === 'GET' || method === 'HEAD') && (pathname.startsWith('/uploads/') || (req.url && req.url.startsWith('/uploads/')))) {
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length === 3 && (parts[1] === 'products' || parts[1] === 'enquiries')) {
          const subfolder = parts[1];
          const filename = parts[2];

          // Validate filename format: alphanumeric / UUID + extension (anti-traversal)
          if (!/^[0-9a-zA-Z_-]+\.(jpg|jpeg|png|webp|svg|pdf|stl)$/i.test(filename)) {
            sendJson(res, 404, { success: false, error: 'File not found' });
            return;
          }

          const uploadRoot = getUploadRootDirectory();
          const filePath = path.resolve(uploadRoot, subfolder, filename);

          if (!filePath.startsWith(uploadRoot) || !fs.existsSync(filePath)) {
            const isImage = /\.(webp|jpg|jpeg|png|svg)$/i.test(filename);
            if (isImage) {
              const svg = generateArtisanalSvg(filename);
              res.writeHead(200, {
                'Content-Type': 'image/svg+xml; charset=utf-8',
                'Content-Length': Buffer.byteLength(svg),
                'Cache-Control': 'public, max-age=86400',
                'X-Content-Type-Options': 'nosniff'
              });
              res.end(svg);
              return;
            }
            sendJson(res, 404, { success: false, error: 'File not found' });
            return;
          }

          const ext = path.extname(filename).toLowerCase();
          const mimeMap: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.stl': 'model/stl'
          };
          const mimeType = mimeMap[ext] || 'application/octet-stream';

          const fileData = fs.readFileSync(filePath);
          res.writeHead(200, {
            'Content-Type': mimeType,
            'Content-Length': fileData.length,
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; sandbox"
          });
          res.end(fileData);
          return;
        } else {
          sendJson(res, 404, { success: false, error: 'File not found' });
          return;
        }
      }

      // 4. Parse Request Body if POST/PUT/PATCH/DELETE
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        try {
          await parseRequestBody(req);
        } catch (err: any) {
          if (err instanceof PayloadTooLargeError || err.statusCode === 413) {
            sendJson(res, 413, { success: false, error: err.message || 'Payload Too Large' });
            return;
          }
          throw err;
        }
      }

      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';

      // ========================================================================
      // FIRST-PARTY TELEMETRY & ANALYTICS INGESTION GATEWAY (Features F16-F23)
      // ========================================================================

      // POST /api/v1/analytics/events — Single Event Ingestion
      if (method === 'POST' && pathname === '/api/v1/analytics/events') {
        const cl = req.headers['content-length'] ? parseInt(req.headers['content-length'] as string, 10) : 0;
        if (cl > 16 * 1024 || (req.rawBodyBuffer && req.rawBodyBuffer.length > 16 * 1024)) {
          sendJson(res, 413, { success: false, error: 'Payload Too Large: Single event exceeds 16KB limit' });
          return;
        }

        const rateCheck = telemetryRateLimiter.check(clientIp);
        if (!rateCheck.allowed) {
          res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
          sendJson(res, 429, { success: false, error: rateCheck.error || 'Rate limit exceeded: max 60 requests per minute.' });
          return;
        }

        if (req.bodyParseError) {
          sendJson(res, 400, { success: false, error: 'Bad Request: Malformed JSON payload' });
          return;
        }

        const dntHeader = (req.headers['dnt'] as string) || undefined;
        const isPrivileged = Boolean(req.user && (req.user.role === 'superadmin' || req.user.role === 'admin'));
        const result = analyticsService.ingestEvent(req.parsedBody || {}, isPrivileged, dntHeader);

        if (result.status === 204) {
          res.writeHead(204);
          res.end();
          return;
        }

        sendJson(res, result.status, result);
        return;
      }

      // POST /api/v1/analytics/events/batch — Batch Event Ingestion (Beacon flush)
      if (method === 'POST' && pathname === '/api/v1/analytics/events/batch') {
        const cl = req.headers['content-length'] ? parseInt(req.headers['content-length'] as string, 10) : 0;
        if (cl > 64 * 1024 || (req.rawBodyBuffer && req.rawBodyBuffer.length > 64 * 1024)) {
          sendJson(res, 413, { success: false, error: 'Payload Too Large: Batch exceeds 64KB limit' });
          return;
        }

        const rateCheck = telemetryRateLimiter.check(clientIp);
        if (!rateCheck.allowed) {
          res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
          sendJson(res, 429, { success: false, error: rateCheck.error || 'Rate limit exceeded: max 60 requests per minute.' });
          return;
        }

        if (req.bodyParseError) {
          sendJson(res, 400, { success: false, error: 'Bad Request: Malformed JSON payload' });
          return;
        }

        const dntHeader = (req.headers['dnt'] as string) || undefined;
        const isPrivileged = Boolean(req.user && (req.user.role === 'superadmin' || req.user.role === 'admin'));
        const result = analyticsService.ingestBatch(req.parsedBody, isPrivileged, dntHeader);

        sendJson(res, result.status, result);
        return;
      }

      // ========================================================================
      // READ-ONLY AI ANALYST REST API (Features F32 & F33)
      // ========================================================================
      if (pathname.startsWith('/api/v1/ai-analyst')) {
        // 1. Body Size Ceiling Guard: 32 KB
        const cl = req.headers['content-length'] ? parseInt(req.headers['content-length'] as string, 10) : 0;
        if (cl > 32 * 1024 || (req.rawBodyBuffer && req.rawBodyBuffer.length > 32 * 1024)) {
          sendJson(res, 413, { success: false, error: 'Payload Too Large: AI Analyst request exceeds 32KB' });
          return;
        }

        // 2. Strict Read-Only Method Enforcement: HTTP 405 Method Not Allowed
        if (method !== 'GET') {
          res.setHeader('Allow', 'GET');
          sendJson(res, 405, {
            success: false,
            error: `Method Not Allowed: AI Analyst endpoints are strictly read-only. Received ${method}.`
          });
          return;
        }

        // 3. Scoped Bearer Token Authentication
        const authHeader = req.headers['authorization'] || '';
        if (!authHeader.startsWith('Bearer ')) {
          sendJson(res, 401, {
            success: false,
            error: 'Unauthorized: Missing or malformed Bearer token in Authorization header.'
          });
          return;
        }

        const providedToken = authHeader.slice(7).trim();
        const expectedToken = process.env.AI_ANALYST_TOKEN || 'test_ai_analyst_scoped_bearer_token_2026';

        let tokenValid = false;
        if (providedToken.length === expectedToken.length) {
          try {
            tokenValid = crypto.timingSafeEqual(Buffer.from(providedToken), Buffer.from(expectedToken));
          } catch {
            tokenValid = false;
          }
        }

        if (!tokenValid) {
          sendJson(res, 401, {
            success: false,
            error: 'Unauthorized: Invalid or expired AI Analyst Bearer token.'
          });
          return;
        }

        // 4. Sliding Window Rate Limiter (30 req/min)
        const rateKey = `ai_analyst_${clientIp}`;
        const rateCheck = aiAnalystRateLimiter.check(rateKey);
        if (!rateCheck.allowed) {
          res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
          sendJson(res, 429, {
            success: false,
            error: rateCheck.error || 'AI Analyst rate limit exceeded: maximum 30 requests per minute.'
          });
          return;
        }

        // 5. SQL Injection Parameter Guard with Safe URL-Decoding & Expanded Pattern
        const rawQuery = parsedUrl.search || '';
        let decodedQuery = rawQuery;
        try {
          // Normalise + to space, then decode percent-encoded sequences
          decodedQuery = decodeURIComponent(rawQuery.replace(/\+/g, ' '));
        } catch {
          // Reject malformed percent-encoding with 422
          sendJson(res, 422, {
            success: false,
            error: 'Unprocessable Entity: Query parameter contains disallowed characters or SQL injection patterns.'
          });
          return;
        }

        // Expanded pattern: quotes, semicolon, keywords including OR, comments (--, #, /* */), and raw percent tokens
        const sqlInjectionPattern = /('|"|;|\b(UNION|SELECT|DROP|ALTER|TRUNCATE|INSERT|UPDATE|DELETE|OR)\b|--|#|\/\*|\*\/|%27|%22|%23)/i;
        if (sqlInjectionPattern.test(rawQuery) || sqlInjectionPattern.test(decodedQuery)) {
          sendJson(res, 422, {
            success: false,
            error: 'Unprocessable Entity: Query parameter contains disallowed characters or SQL injection patterns.'
          });
          return;
        }

        // Whitelist allowed query parameters for AI Analyst routes (Defense-in-depth)
        const allowedParams = new Set(['start', 'end', 'product_id']);
        for (const key of parsedUrl.searchParams.keys()) {
          if (!allowedParams.has(key)) {
            sendJson(res, 422, {
              success: false,
              error: `Unprocessable Entity: Unrecognized query parameter '${key}'.`
            });
            return;
          }
        }

        // 6. Query Parameter Extraction & Validation
        const startParam = parsedUrl.searchParams.get('start') || undefined;
        const endParam = parsedUrl.searchParams.get('end') || undefined;
        const productParam = parsedUrl.searchParams.get('product_id') || undefined;

        const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;
        if (startParam && !isoRegex.test(startParam)) {
          sendJson(res, 422, { success: false, error: "Invalid 'start' timestamp format; must be ISO 8601 UTC." });
          return;
        }
        if (endParam && !isoRegex.test(endParam)) {
          sendJson(res, 422, { success: false, error: "Invalid 'end' timestamp format; must be ISO 8601 UTC." });
          return;
        }
        if (productParam && !/^[a-zA-Z0-9_-]+$/.test(productParam)) {
          sendJson(res, 422, { success: false, error: "Invalid 'product_id'; must be alphanumeric identifier." });
          return;
        }

        // 7. Route Handlers
        if (pathname === '/api/v1/ai-analyst/catalog-summary') {
          const summary = aiAnalystService.getCatalogSummary();
          sendJson(res, 200, summary);
          return;
        }

        if (pathname === '/api/v1/ai-analyst/performance-facts') {
          const facts = aiAnalystService.getPerformanceFacts({ start: startParam, end: endParam, product_id: productParam });
          sendJson(res, 200, facts);
          return;
        }

        if (pathname === '/api/v1/ai-analyst/conversion-insights') {
          const insights = aiAnalystService.getConversionInsights({ start: startParam, end: endParam, product_id: productParam });
          sendJson(res, 200, insights);
          return;
        }

        if (pathname === '/api/v1/ai-analyst/schema-docs') {
          const docs = aiAnalystService.getSchemaDocs();
          sendJson(res, 200, docs);
          return;
        }

        sendJson(res, 404, { success: false, error: `AI Analyst route not found: ${pathname}` });
        return;
      }

      // ========================================================================
      // PUBLIC STOREFRONT ROUTES & CLIENT ASSETS
      // ========================================================================

      // Static Client Assets: Stylesheet
      if ((method === 'GET' || method === 'HEAD') && (pathname === '/styles/storefront.css' || pathname === '/styles/theme.css')) {
        const cssPath = path.resolve(process.cwd(), 'src/client/styles/storefront.css');
        if (fs.existsSync(cssPath)) {
          const css = fs.readFileSync(cssPath);
          res.writeHead(200, {
            'Content-Type': 'text/css; charset=utf-8',
            'Content-Length': css.length,
            'X-Content-Type-Options': 'nosniff'
          });
          res.end(css);
          return;
        }
      }

      // Static Client Assets: Images & SVG Placeholders
      if ((method === 'GET' || method === 'HEAD') && (pathname.startsWith('/assets/images/') || pathname === '/placeholder.svg')) {
        const filename = pathname === '/placeholder.svg' ? 'placeholder.svg' : pathname.replace('/assets/images/', '');
        const svg = generateArtisanalSvg(filename);
        res.writeHead(200, {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Content-Length': Buffer.byteLength(svg),
          'Cache-Control': 'public, max-age=86400',
          'X-Content-Type-Options': 'nosniff'
        });
        res.end(svg);
        return;
      }

      // Static Client Assets: Telemetry Script
      if ((method === 'GET' || method === 'HEAD') && (pathname === '/tracking/telemetry.js' || pathname === '/scripts/telemetry.js')) {
        const jsVanillaPath = path.resolve(process.cwd(), 'src/client/tracking/telemetry.js');
        const jsTsPath = path.resolve(process.cwd(), 'src/client/tracking/telemetry.ts');
        let js = '';
        if (fs.existsSync(jsVanillaPath)) {
          js = fs.readFileSync(jsVanillaPath, 'utf-8');
        } else if (fs.existsSync(jsTsPath)) {
          js = fs.readFileSync(jsTsPath, 'utf-8');
        }
        res.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Content-Length': Buffer.byteLength(js),
          'X-Content-Type-Options': 'nosniff'
        });
        res.end(js);
        return;
      }

      // GET / — Storefront Home Page (Features F34–F39)
      if ((method === 'GET' || method === 'HEAD') && (pathname === '/' || pathname === '')) {
        let settingsMap: Record<string, string> = {};
        try {
          const rows = db.prepare('SELECT key, value FROM system_settings').all() as { key: string; value: string }[];
          settingsMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));
        } catch {
          // ignore
        }
        let featured: any[] = [];
        try {
          featured = productService.listPublicProducts({ is_featured: 1, limit: 4 }).data;
        } catch {
          // ignore
        }
        const html = renderHomePage({ settings: settingsMap, featuredProducts: featured });
        sendHtml(res, 200, html);
        return;
      }

      // GET /products — Product Catalogue Listing Page (Features F40 & F41)
      if ((method === 'GET' || method === 'HEAD') && pathname === '/products') {
        const category = parsedUrl.searchParams.get('category') || undefined;
        const tag = parsedUrl.searchParams.get('tag') || undefined;
        const search = parsedUrl.searchParams.get('search') || undefined;
        const sort = parsedUrl.searchParams.get('sort') || undefined;
        const is_featured = parsedUrl.searchParams.get('is_featured') ? Number(parsedUrl.searchParams.get('is_featured')) : undefined;
        const page = parsedUrl.searchParams.get('page') ? Number(parsedUrl.searchParams.get('page')) : undefined;
        const limit = parsedUrl.searchParams.get('limit') ? Number(parsedUrl.searchParams.get('limit')) : undefined;

        const result = productService.listPublicProducts({ category, tag, search, sort, is_featured, page, limit });

        if (req.headers.accept?.includes('application/json')) {
          sendJson(res, 200, result);
          return;
        }

        let allCategories: any[] = [];
        try {
          allCategories = db.prepare('SELECT id, slug, name FROM categories WHERE is_active = 1 ORDER BY display_order ASC').all();
        } catch {
          // ignore
        }

        const html = renderCatalogPage({
          products: result.data,
          categories: allCategories,
          pagination: result.pagination,
          activeCategory: category || 'all',
          activeTag: tag || 'all',
          searchQuery: search || '',
          activeSort: sort || 'newest'
        });
        sendHtml(res, 200, html);
        return;
      }

      // GET /products/:slug — Product Detail Page (PDP) (Features F42–F44)
      if ((method === 'GET' || method === 'HEAD') && pathname.startsWith('/products/') && !pathname.startsWith('/products/api')) {
        const slug = pathname.slice('/products/'.length).trim();
        if (slug) {
          const product = productService.getPublishedProductBySlug(slug);
          if (!product) {
            if (req.headers.accept?.includes('application/json')) {
              sendJson(res, 404, { success: false, error: 'Product not found or currently unavailable' });
            } else {
              sendHtml(res, 404, renderNotFoundPage(`Product "${slug}" not found or currently unavailable.`));
            }
            return;
          }

          let relatedProducts: any[] = [];
          try {
            const relResult = productService.listPublicProducts({
              category: product.category?.slug,
              limit: 4
            });
            relatedProducts = relResult.data.filter((p: any) => p.id !== product.id).slice(0, 3);
          } catch {
            // ignore
          }

          if (req.headers.accept?.includes('application/json')) {
            sendJson(res, 200, { success: true, data: product, related: relatedProducts });
            return;
          }

          const html = renderProductDetailPage({ product, relatedProducts });
          sendHtml(res, 200, html);
          return;
        }
      }

      // GET /custom-order — Custom Order Enquiry Page (Features F45–F47)
      if ((method === 'GET' || method === 'HEAD') && pathname === '/custom-order') {
        const refSlug = parsedUrl.searchParams.get('ref') || undefined;
        let referencedProduct: any = null;
        if (refSlug) {
          try {
            const prod = productService.getPublishedProductBySlug(refSlug);
            if (prod) {
              referencedProduct = { id: prod.id, name: prod.name, slug: prod.slug };
            }
          } catch {
            // ignore
          }
        }
        const html = renderCustomOrderPage({ referencedProduct });
        sendHtml(res, 200, html);
        return;
      }

      // Supporting Pages Suite (Feature F48)
      if ((method === 'GET' || method === 'HEAD') && pathname === '/about') {
        sendHtml(res, 200, renderAboutPage());
        return;
      }
      if ((method === 'GET' || method === 'HEAD') && pathname === '/contact') {
        sendHtml(res, 200, renderContactPage());
        return;
      }
      if ((method === 'GET' || method === 'HEAD') && pathname === '/faq') {
        sendHtml(res, 200, renderFaqPage());
        return;
      }
      if ((method === 'GET' || method === 'HEAD') && pathname === '/shipping') {
        sendHtml(res, 200, renderShippingPage());
        return;
      }
      if ((method === 'GET' || method === 'HEAD') && pathname === '/returns') {
        sendHtml(res, 200, renderReturnsPage());
        return;
      }
      if ((method === 'GET' || method === 'HEAD') && pathname === '/privacy') {
        sendHtml(res, 200, renderPrivacyPage());
        return;
      }
      if ((method === 'GET' || method === 'HEAD') && pathname === '/terms') {
        sendHtml(res, 200, renderTermsPage());
        return;
      }

      // GET /admin — Administrative Portal & Dashboard UI (Feature R3)
      if ((method === 'GET' || method === 'HEAD') && (pathname === '/admin' || pathname === '/admin/')) {
        let categories: any[] = [];
        try {
          categories = db.prepare('SELECT id, slug, name, display_order FROM categories WHERE is_active = 1 ORDER BY display_order ASC').all();
        } catch {}
        sendHtml(res, 200, renderAdminPage({ user: req.user, categories }));
        return;
      }

      // GET /api/products — Public Catalog Listing (Published only)
      if (method === 'GET' && pathname === '/api/products') {
        const category = parsedUrl.searchParams.get('category') || undefined;
        const tag = parsedUrl.searchParams.get('tag') || undefined;
        const search = parsedUrl.searchParams.get('search') || undefined;
        const sort = parsedUrl.searchParams.get('sort') || undefined;
        const is_featured = parsedUrl.searchParams.get('is_featured') ? Number(parsedUrl.searchParams.get('is_featured')) : undefined;
        const page = parsedUrl.searchParams.get('page') ? Number(parsedUrl.searchParams.get('page')) : undefined;
        const limit = parsedUrl.searchParams.get('limit') ? Number(parsedUrl.searchParams.get('limit')) : undefined;

        const result = productService.listPublicProducts({ category, tag, search, sort, is_featured, page, limit });
        sendJson(res, 200, result);
        return;
      }

      // GET /api/products/:slug — Public Product Detail (Published only)
      if (method === 'GET' && pathname.startsWith('/api/products/')) {
        const slug = pathname.slice('/api/products/'.length).trim();
        if (slug) {
          const product = productService.getPublishedProductBySlug(slug);
          if (!product) {
            sendJson(res, 404, { success: false, error: 'Product not found or currently unavailable' });
            return;
          }
          sendJson(res, 200, { success: true, data: product });
          return;
        }
      }

      // POST /api/enquiries — Custom Order Enquiry Submission with Honeypot & Safe Upload
      if (method === 'POST' && pathname === '/api/enquiries') {
        const body = req.parsedBody || {};
        let attachmentBuffer: Buffer | undefined;
        let attachmentOriginalName: string | undefined;

        if (req.uploadedFiles && req.uploadedFiles['attachment']) {
          attachmentBuffer = req.uploadedFiles['attachment'].buffer;
          attachmentOriginalName = req.uploadedFiles['attachment'].filename;
        } else if (body.attachment_base64 && typeof body.attachment_base64 === 'string') {
          attachmentBuffer = Buffer.from(body.attachment_base64, 'base64');
          attachmentOriginalName = body.attachment_filename || 'attachment.bin';
        }

        const submission = enquiryService.submitEnquiry(
          {
            customer_name: body.customer_name,
            contact_phone: body.contact_phone,
            contact_email: body.contact_email,
            preferred_contact_method: body.preferred_contact_method,
            project_type: body.project_type,
            design_description: body.design_description,
            approximate_quantity: body.approximate_quantity ? Number(body.approximate_quantity) : undefined,
            budget_range_inr: body.budget_range_inr,
            referenced_product_id: body.referenced_product_id,
            bhr_check_field: body.bhr_check_field,
            rendered_at: body.rendered_at,
            attachmentBuffer,
            attachmentOriginalName
          },
          clientIp,
          req.headers['user-agent']
        );

        sendJson(res, submission.status, submission);
        return;
      }

      // ========================================================================
      // ADMIN AUTHENTICATION ROUTES
      // ========================================================================

      // POST /api/admin/auth/login
      if (method === 'POST' && pathname === '/api/admin/auth/login') {
        const body = req.parsedBody || {};
        const username = (body.username || '').trim();
        const password = body.password || '';

        // IP Rate limit check: 5 attempts per 15 minutes
        const rateCheck = authRateLimiter.check(clientIp);
        if (!rateCheck.allowed) {
          sendJson(res, 429, { error: rateCheck.error || 'Too many login attempts. Throttled for 15 minutes.' });
          return;
        }

        if (!username || !password) {
          sendJson(res, 400, { error: 'Username and password are required' });
          return;
        }

        const user = db.prepare('SELECT * FROM admin_users WHERE username = ? OR email = ?').get(username, username) as any;
        if (!user) {
          // Verify dummy scrypt hash to equalize response timing against user enumeration
          verifyPassword(password, DUMMY_PASSWORD_HASH);
          sendJson(res, 401, { error: 'Invalid username or password' });
          return;
        }

        // Account lockout evaluation
        const lockoutCheck = evaluateLockoutState(db, user);
        if (lockoutCheck.isLocked) {
          sendJson(res, 423, { error: lockoutCheck.error });
          return;
        }

        const clientIpHashed = hashClientIp(clientIp);

        // Password verification
        const valid = verifyPassword(password, user.password_hash);
        if (!valid) {
          const failResult = handleFailedLogin(db, user, clientIpHashed);
          sendJson(res, failResult.status, { error: failResult.error });
          return;
        }

        // Success: Reset lockout counters
        handleSuccessfulLogin(db, user.id);

        // Create new session & Set cookie
        const { rawToken, expiresAt } = createSession(db, user.id, {
          userAgent: req.headers['user-agent'],
          ipHash: clientIpHashed
        });
        setSessionCookie(res, rawToken, expiresAt);

        sendJson(res, 200, {
          success: true,
          token: rawToken,
          cookie: `bhr_session=${rawToken}; HttpOnly; SameSite=Strict; Secure; Path=/`,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
        return;
      }

      // POST /api/admin/auth/logout
      if (method === 'POST' && pathname === '/api/admin/auth/logout') {
        if (req.rawSessionToken) {
          revokeSession(db, req.rawSessionToken);
        }
        clearSessionCookie(res);
        sendJson(res, 200, { success: true, message: 'Logged out successfully' });
        return;
      }

      // GET /api/admin/auth/me
      if (method === 'GET' && pathname === '/api/admin/auth/me') {
        if (!req.user) {
          sendJson(res, 401, { error: 'Unauthorized: Session missing or invalid' });
          return;
        }
        sendJson(res, 200, { success: true, user: req.user });
        return;
      }

      // ========================================================================
      // ADMIN PROTECTED ROUTES (Require Valid Session)
      // ========================================================================
      if (pathname.startsWith('/api/admin/')) {
        // Enforce Authentication
        if (!req.user) {
          sendJson(res, 401, { error: 'Unauthorized: Private admin route requires valid bhr_session cookie' });
          return;
        }

        const userRole = req.user.role;

        // Enforce Viewer Read-Only Mutation Restriction: HTTP 403 Forbidden
        if (userRole === 'viewer' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          sendJson(res, 403, { error: 'Forbidden: Viewer role has read-only access and cannot perform mutations' });
          return;
        }

        // --------------------------------------------------------------------
        // ADMIN AUDIT LOGS: GET /api/admin/audit-logs (Superadmin Only)
        // --------------------------------------------------------------------
        if (pathname === '/api/admin/audit-logs') {
          if (!canViewAuditLogs(userRole)) {
            sendJson(res, 403, { error: 'Forbidden: Only superadmin may view audit logs' });
            return;
          }
          const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
          sendJson(res, 200, { success: true, data: logs });
          return;
        }

        // --------------------------------------------------------------------
        // ADMIN OVERVIEW KPIS & DIAGNOSTICS
        // --------------------------------------------------------------------
        if (method === 'GET' && pathname === '/api/admin/overview/kpis') {
          const start = parsedUrl.searchParams.get('start') || undefined;
          const end = parsedUrl.searchParams.get('end') || undefined;
          const kpis = kpiService.getOverviewKpis({ start, end });
          sendJson(res, 200, kpis);
          return;
        }

        if (method === 'GET' && pathname === '/api/admin/overview/diagnostics') {
          const start = parsedUrl.searchParams.get('start') || undefined;
          const end = parsedUrl.searchParams.get('end') || undefined;
          const diag = diagnosticsService.getDiagnostics({ start, end });
          sendJson(res, 200, diag);
          return;
        }

        // --------------------------------------------------------------------
        // ADMIN BI DATA EXPORTS: GET /api/admin/exports/:type
        // --------------------------------------------------------------------
        if (method === 'GET' && pathname.startsWith('/api/admin/exports/')) {
          if (!hasPermission(userRole, 'export:read')) {
            sendJson(res, 403, { error: 'Forbidden: Viewer role does not have export:read privileges' });
            return;
          }

          const exportType = pathname.slice('/api/admin/exports/'.length).trim() as ExportType;
          const validTypes: ExportType[] = [
            'raw_events',
            'product_metrics',
            'conversion_funnels',
            'permitted_enquiries',
            'product_catalog'
          ];
          if (!validTypes.includes(exportType)) {
            sendJson(res, 400, { error: `Invalid export type: ${exportType}` });
            return;
          }

          const format = (parsedUrl.searchParams.get('format') || 'csv').toLowerCase() as ExportFormat;
          if (!['csv', 'json', 'ndjson'].includes(format)) {
            sendJson(res, 400, { error: `Invalid export format: ${format}` });
            return;
          }

          try {
            const exportResult = exportService.generateExport(exportType, format, {
              start_date: parsedUrl.searchParams.get('start_date') || undefined,
              end_date: parsedUrl.searchParams.get('end_date') || undefined,
              product_id: parsedUrl.searchParams.get('product_id') || undefined,
              event_type: parsedUrl.searchParams.get('event_type') || undefined,
              referrer: parsedUrl.searchParams.get('referrer') || undefined,
              status: parsedUrl.searchParams.get('status') || undefined,
              category_id: parsedUrl.searchParams.get('category_id') || undefined
            });

            const env = exportResult.qualityEnvelope;
            res.setHeader('X-Export-Type', env.export_type);
            res.setHeader('X-Export-Generated-At', env.generated_at_utc);
            res.setHeader('X-Export-Timezone', env.timezone);
            res.setHeader('X-Export-Total-Records', String(env.total_records));
            res.setHeader('X-Export-Completeness-Score', String(env.completeness_score));
            res.setHeader('X-Export-Clock-Skew-Flagged', String(env.clock_skew_flagged_count));
            res.setHeader('X-Export-Unverified-Outcomes', String(env.unverified_outcome_count));
            res.setHeader('X-Export-Checksum', env.reconciliation_checksum);
            if (format === 'csv') {
              res.setHeader('Content-Disposition', `attachment; filename="${exportType}_export_${Date.now()}.csv"`);
            }

            res.writeHead(200, {
              'Content-Type': exportResult.contentType,
              'Content-Length': Buffer.byteLength(exportResult.payload),
              'X-Content-Type-Options': 'nosniff'
            });
            res.end(exportResult.payload);
          } catch (err: any) {
            sendJson(res, 400, { error: err.message });
          }
          return;
        }

        // --------------------------------------------------------------------
        // ADMIN RECONCILIATION INVARIANT ENGINE (Delta = 0)
        // --------------------------------------------------------------------
        if (method === 'GET' && pathname === '/api/admin/reconciliation/verify') {
          if (!hasPermission(userRole, 'export:read')) {
            sendJson(res, 403, { error: 'Forbidden: Insufficient privileges for reconciliation verification' });
            return;
          }

          const startDate = parsedUrl.searchParams.get('start_date') || '2020-01-01';
          const endDate = parsedUrl.searchParams.get('end_date') || new Date().toISOString();
          const productId = parsedUrl.searchParams.get('product_id') || undefined;

          const reconResult = reconciliationService.verifyReconciliation(startDate, endDate, productId);
          const reconStatus = reconResult.reconciled ? 200 : 409;
          sendJson(res, reconStatus, reconResult);
          return;
        }

        if (method === 'POST' && pathname === '/api/admin/reconciliation/rollup') {
          if (!hasPermission(userRole, 'export:read')) {
            sendJson(res, 403, { error: 'Forbidden: Insufficient privileges for rollup aggregation' });
            return;
          }

          const targetDate = req.parsedBody?.date || new Date().toISOString().slice(0, 10);
          const rollups = analyticsService.aggregateDailyRollups(targetDate);
          sendJson(res, 200, { success: true, rollup_date: targetDate, rollups });
          return;
        }

        // --------------------------------------------------------------------
        // ADMIN PRODUCT MANAGEMENT ROUTES
        // --------------------------------------------------------------------
        // GET /api/admin/categories
        if (method === 'GET' && pathname === '/api/admin/categories') {
          const categories = db.prepare('SELECT id, slug, name, display_order FROM categories WHERE is_active = 1 ORDER BY display_order ASC').all();
          sendJson(res, 200, { success: true, data: categories });
          return;
        }

        // GET /api/admin/products
        if (method === 'GET' && pathname === '/api/admin/products') {
          const status = parsedUrl.searchParams.get('status') || undefined;
          const category_id = parsedUrl.searchParams.get('category_id') || undefined;
          const search = parsedUrl.searchParams.get('search') || undefined;
          const is_featured = parsedUrl.searchParams.get('is_featured') ? Number(parsedUrl.searchParams.get('is_featured')) : undefined;
          const sort_by = parsedUrl.searchParams.get('sort_by') || undefined;
          const sort_order = (parsedUrl.searchParams.get('sort_order') as any) || undefined;
          const page = parsedUrl.searchParams.get('page') ? Number(parsedUrl.searchParams.get('page')) : undefined;
          const limit = parsedUrl.searchParams.get('limit') ? Number(parsedUrl.searchParams.get('limit')) : undefined;

          const result = productService.listAdminProducts({ status, category_id, search, is_featured, sort_by, sort_order, page, limit });
          sendJson(res, 200, result);
          return;
        }

        // POST /api/admin/products (Create)
        if (method === 'POST' && pathname === '/api/admin/products') {
          if (!canMutateProducts(userRole)) {
            sendJson(res, 403, { error: 'Forbidden' });
            return;
          }
          try {
            const result = productService.createProduct(req.parsedBody || {}, req.user.id);
            sendJson(res, 201, result);
          } catch (err: any) {
            sendJson(res, 400, { error: err.message || 'Product creation failed' });
          }
          return;
        }

        // Product ID sub-routes
        const productDetailMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)$/);
        if (productDetailMatch) {
          const productId = productDetailMatch[1];

          // GET /api/admin/products/:id
          if (method === 'GET') {
            const product = productService.getProductById(productId);
            if (!product) {
              sendJson(res, 404, { error: `Product not found: '${productId}'` });
              return;
            }
            sendJson(res, 200, { success: true, data: product });
            return;
          }

          // PUT /api/admin/products/:id
          if (method === 'PUT') {
            if (!canMutateProducts(userRole)) {
              sendJson(res, 403, { error: 'Forbidden' });
              return;
            }
            try {
              const result = productService.updateProduct(productId, req.parsedBody || {}, req.user.id);
              sendJson(res, 200, result);
            } catch (err: any) {
              const status = err.message.includes('not found') ? 404 : 400;
              sendJson(res, status, { error: err.message });
            }
            return;
          }

          // DELETE /api/admin/products/:id
          if (method === 'DELETE') {
            if (!canMutateProducts(userRole)) {
              sendJson(res, 403, { error: 'Forbidden' });
              return;
            }
            try {
              const result = productService.deleteProduct(productId, req.user.id);
              sendJson(res, 200, result);
            } catch (err: any) {
              const status = err.message.includes('not found') ? 404 : 400;
              sendJson(res, status, { error: err.message });
            }
            return;
          }
        }

        // PATCH /api/admin/products/:id/status
        const statusMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)\/status$/);
        if (method === 'PATCH' && statusMatch) {
          if (!canMutateProducts(userRole)) {
            sendJson(res, 403, { error: 'Forbidden' });
            return;
          }
          try {
            const status = req.parsedBody?.status;
            const result = productService.setPublicationStatus(statusMatch[1], status, req.user.id);
            sendJson(res, 200, result);
          } catch (err: any) {
            const code = err.message.includes('not found') ? 404 : 400;
            sendJson(res, code, { error: err.message });
          }
          return;
        }

        // PATCH /api/admin/products/:id/featured
        const featMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)\/featured$/);
        if (method === 'PATCH' && featMatch) {
          if (!canMutateProducts(userRole)) {
            sendJson(res, 403, { error: 'Forbidden' });
            return;
          }
          try {
            const result = productService.setFeatured(featMatch[1], req.parsedBody?.is_featured);
            sendJson(res, 200, result);
          } catch (err: any) {
            sendJson(res, 400, { error: err.message });
          }
          return;
        }

        // PATCH /api/admin/products/:id/availability
        const availMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)\/availability$/);
        if (method === 'PATCH' && availMatch) {
          if (!canMutateProducts(userRole)) {
            sendJson(res, 403, { error: 'Forbidden' });
            return;
          }
          try {
            const result = productService.setAvailability(availMatch[1], req.parsedBody || {});
            sendJson(res, 200, result);
          } catch (err: any) {
            sendJson(res, 400, { error: err.message });
          }
          return;
        }

        // POST /api/admin/products/:id/images (Upload Product Image)
        const uploadImgMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)\/images$/);
        if (method === 'POST' && uploadImgMatch) {
          if (!canMutateProducts(userRole)) {
            sendJson(res, 403, { error: 'Forbidden' });
            return;
          }

          const productId = uploadImgMatch[1];
          let fileBuffer: Buffer | undefined;
          let altText = req.parsedBody?.alt_text;
          const isPrimary = req.parsedBody?.is_primary ? 1 : 0;

          if (req.uploadedFiles && req.uploadedFiles['file']) {
            fileBuffer = req.uploadedFiles['file'].buffer;
          } else if (req.parsedBody?.file_base64 && typeof req.parsedBody.file_base64 === 'string') {
            fileBuffer = Buffer.from(req.parsedBody.file_base64, 'base64');
          }

          if (!fileBuffer || fileBuffer.length === 0) {
            sendJson(res, 400, { error: 'No image file uploaded' });
            return;
          }

          if (fileBuffer.length > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
            sendJson(res, 413, { error: 'File size exceeds maximum 5MB limit' });
            return;
          }

          const magicCheck = validateImageMagicBytes(fileBuffer);
          if (!magicCheck.valid) {
            sendJson(res, 422, { error: magicCheck.error || 'Invalid image file signature' });
            return;
          }

          try {
            const stored = storeUploadFile('products', fileBuffer, magicCheck.extension || 'webp');
            const imgRecord = productService.addProductImage(productId, {
              storagePath: stored.storagePath,
              publicUrl: stored.publicUrl,
              altText,
              isPrimary,
              fileSizeBytes: fileBuffer.length,
              mimeType: magicCheck.detectedMime as any
            });
            sendJson(res, 201, imgRecord);
          } catch (err: any) {
            sendJson(res, 400, { error: err.message });
          }
          return;
        }

        // DELETE /api/admin/products/:id/images/:imageId
        const delImgMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)\/images\/([^/]+)$/);
        if (method === 'DELETE' && delImgMatch) {
          if (!canMutateProducts(userRole)) {
            sendJson(res, 403, { error: 'Forbidden' });
            return;
          }
          try {
            const result = productService.deleteProductImage(delImgMatch[1], delImgMatch[2]);
            sendJson(res, 200, result);
          } catch (err: any) {
            sendJson(res, 400, { error: err.message });
          }
          return;
        }

        // PATCH /api/admin/products/:id/images/:imageId/primary
        const primImgMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)\/images\/([^/]+)\/primary$/);
        if (method === 'PATCH' && primImgMatch) {
          if (!canMutateProducts(userRole)) {
            sendJson(res, 403, { error: 'Forbidden' });
            return;
          }
          try {
            const result = productService.setPrimaryImage(primImgMatch[1], primImgMatch[2]);
            sendJson(res, 200, result);
          } catch (err: any) {
            sendJson(res, 400, { error: err.message });
          }
          return;
        }

        // --------------------------------------------------------------------
        // ADMIN ENQUIRY MANAGEMENT ROUTES
        // --------------------------------------------------------------------
        // GET /api/admin/enquiries
        if (method === 'GET' && pathname === '/api/admin/enquiries') {
          if (!hasPermission(userRole, 'enquiries:read')) {
            sendJson(res, 403, { error: 'Forbidden: Insufficient privileges to view enquiries' });
            return;
          }
          const status = parsedUrl.searchParams.get('status') || undefined;
          const project_type = parsedUrl.searchParams.get('project_type') || undefined;
          const search = parsedUrl.searchParams.get('search') || undefined;
          const date_from = parsedUrl.searchParams.get('date_from') || undefined;
          const date_to = parsedUrl.searchParams.get('date_to') || undefined;
          const page = parsedUrl.searchParams.get('page') ? Number(parsedUrl.searchParams.get('page')) : undefined;
          const limit = parsedUrl.searchParams.get('limit') ? Number(parsedUrl.searchParams.get('limit')) : undefined;

          const result = enquiryService.listAdminEnquiries({ status, project_type, search, date_from, date_to, page, limit });
          sendJson(res, 200, result);
          return;
        }

        // GET /api/admin/enquiries/:id
        const enqDetailMatch = pathname.match(/^\/api\/admin\/enquiries\/([^/]+)$/);
        if (method === 'GET' && enqDetailMatch) {
          if (!hasPermission(userRole, 'enquiries:read')) {
            sendJson(res, 403, { error: 'Forbidden: Insufficient privileges to view enquiries' });
            return;
          }
          const enquiry = enquiryService.getEnquiryById(enqDetailMatch[1]);
          if (!enquiry) {
            sendJson(res, 404, { error: `Enquiry not found: '${enqDetailMatch[1]}'` });
            return;
          }
          sendJson(res, 200, { success: true, data: enquiry });
          return;
        }

        // PATCH /api/admin/enquiries/:id/status
        const enqStatusMatch = pathname.match(/^\/api\/admin\/enquiries\/([^/]+)\/status$/);
        if (method === 'PATCH' && enqStatusMatch) {
          if (!canMutateEnquiries(userRole)) {
            sendJson(res, 403, { error: 'Forbidden' });
            return;
          }
          const enqId = enqStatusMatch[1];
          const newStatus = req.parsedBody?.status;
          const note = req.parsedBody?.note;

          try {
            const result = enquiryService.updateEnquiryStatus(enqId, newStatus, note, req.user.id);
            sendJson(res, 200, result);
          } catch (err: any) {
            const status = err.message.includes('Disallowed') ? 422 : 400;
            sendJson(res, status, { error: err.message });
          }
          return;
        }

        // POST /api/admin/enquiries/:id/notes
        const enqNoteMatch = pathname.match(/^\/api\/admin\/enquiries\/([^/]+)\/notes$/);
        if (method === 'POST' && enqNoteMatch) {
          if (!canMutateEnquiries(userRole)) {
            sendJson(res, 403, { error: 'Forbidden' });
            return;
          }
          const enqId = enqNoteMatch[1];
          const noteText = req.parsedBody?.note;

          try {
            const result = enquiryService.addInternalNote(enqId, noteText, req.user.id);
            sendJson(res, 201, result);
          } catch (err: any) {
            sendJson(res, 400, { error: err.message });
          }
          return;
        }
      }

      // 5. Default 404 Route
      if (!pathname.startsWith('/api/')) {
        if (req.headers.accept?.includes('text/html') || (!pathname.startsWith('/uploads/') && !pathname.includes('.'))) {
          sendHtml(res, 404, renderNotFoundPage());
          return;
        }
        sendJson(res, 404, { success: false, error: 'File not found' });
        return;
      }
      sendJson(res, 404, { success: false, error: `Route not found: ${method} ${pathname}` });
    } catch (err: any) {
      if (err instanceof PayloadTooLargeError || err.statusCode === 413) {
        sendJson(res, 413, { success: false, error: err.message || 'Payload Too Large' });
        return;
      }
      console.error('Internal server error:', err);
      sendJson(res, 500, { success: false, error: 'Internal Server Error' });
    }
  };
}

/**
 * Creates and starts a standalone HTTP server.
 */
export function createServer(port: number = 4001, database?: Database.Database): http.Server {
  const handler = createApp(database);
  const server = http.createServer(handler);
  return server;
}
