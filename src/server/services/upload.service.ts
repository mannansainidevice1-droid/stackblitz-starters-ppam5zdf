/**
 * BHAIRAVI Creations Digital Platform
 * Multi-Stage Upload Security Pipeline
 * Target: src/server/services/upload.service.ts
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_ENQUIRY_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface MagicByteValidationResult {
  valid: boolean;
  detectedMime?: string;
  extension?: string;
  error?: string;
}

export function getUploadRootDirectory(): string {
  if (process.env.UPLOAD_STORAGE_PATH) {
    return path.resolve(process.env.UPLOAD_STORAGE_PATH);
  }
  return path.resolve(process.cwd(), 'storage/uploads');
}

/**
 * Validates binary magic-byte signatures and scans against script vectors (Anti-XSS/SVG).
 */
export function validateImageMagicBytes(buffer: Buffer): MagicByteValidationResult {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: 'File buffer too small or empty to verify signature' };
  }

  // 1. Text-based script/SVG scanning (Anti-Polyglot & Anti-XSS)
  const headerText = buffer.slice(0, Math.min(buffer.length, 512)).toString('utf-8').toLowerCase();
  const dangerousPatterns = [
    '<svg', '<?xml', '<script', '<html', '<!doctype',
    'onload=', 'onerror=', 'javascript:', '<body', '<iframe'
  ];
  for (const pattern of dangerousPatterns) {
    if (headerText.includes(pattern)) {
      return {
        valid: false,
        error: `Security violation: Prohibited script/vector payload detected ('${pattern}'). SVG and HTML uploads are strictly disallowed.`
      };
    }
  }

  // 2. JPEG Verification: 0xFF, 0xD8, 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: 'image/jpeg', extension: 'jpg' };
  }

  // 3. PNG Verification: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: 'image/png', extension: 'png' };
  }

  // 4. WebP Verification: RIFF at offset 0, WEBP at offset 8
  if (
    buffer[0] === 0x52 && // 'R'
    buffer[1] === 0x49 && // 'I'
    buffer[2] === 0x46 && // 'F'
    buffer[3] === 0x46 && // 'F'
    buffer[8] === 0x57 && // 'W'
    buffer[9] === 0x45 && // 'E'
    buffer[10] === 0x42 && // 'B'
    buffer[11] === 0x50   // 'P'
  ) {
    return { valid: true, detectedMime: 'image/webp', extension: 'webp' };
  }

  return {
    valid: false,
    error: 'Invalid file signature: Only authentic JPEG, PNG, or WebP binary formats are permitted.'
  };
}

/**
 * Validates enquiry attachments including PDF and STL 3D models in addition to images.
 */
export function validateEnquiryAttachmentMagicBytes(buffer: Buffer, originalFilename: string = ''): MagicByteValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file buffer' };
  }

  // Strip null bytes and normalize filename
  const cleanFilename = originalFilename.replace(/\0/g, '').toLowerCase();

  // Categorically reject SVG
  if (cleanFilename.endsWith('.svg')) {
    return { valid: false, error: 'SVG files are strictly disallowed for security reasons.' };
  }

  // First try image validation
  const imageResult = validateImageMagicBytes(buffer);
  if (imageResult.valid) {
    return imageResult;
  }
  if (imageResult.error && imageResult.error.includes('Security violation')) {
    return imageResult;
  }

  // Check PDF signature: %PDF (0x25, 0x50, 0x44, 0x46)
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { valid: true, detectedMime: 'application/pdf', extension: 'pdf' };
  }

  // Check STL format:
  // ASCII STL starts with "solid " (case-insensitive)
  if (buffer.length >= 6) {
    const prefix = buffer.slice(0, 6).toString('ascii').toLowerCase();
    if (prefix === 'solid ') {
      return { valid: true, detectedMime: 'model/stl', extension: 'stl' };
    }
  }

  // Binary STL: 80 byte header + 4 byte integer triangle count
  if (buffer.length >= 84) {
    const numTriangles = buffer.readUInt32LE(80);
    const expectedBinarySize = 84 + numTriangles * 50;
    if (buffer.length === expectedBinarySize || cleanFilename.endsWith('.stl')) {
      return { valid: true, detectedMime: 'model/stl', extension: 'stl' };
    }
  }

  return {
    valid: false,
    error: 'Invalid attachment format: Only JPEG, PNG, WebP, PDF, or STL 3D model files are permitted.'
  };
}

/**
 * Stores a validated file buffer to disk under a newly generated UUID v4 filename.
 */
export function storeUploadFile(
  subfolder: 'products' | 'enquiries',
  buffer: Buffer,
  extension: string
): { storagePath: string; publicUrl: string; filename: string; sha256: string } {
  const uploadRoot = getUploadRootDirectory();
  const targetDir = path.resolve(uploadRoot, subfolder);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const fileId = crypto.randomUUID();
  const filename = `${fileId}.${extension.toLowerCase()}`;
  const fullPath = path.resolve(targetDir, filename);

  // Guarantee destination path is safely within upload root (defense against traversal)
  if (!fullPath.startsWith(uploadRoot)) {
    throw new Error('Path traversal security violation');
  }

  fs.writeFileSync(fullPath, buffer, { mode: 0o644 });

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const publicUrl = `/uploads/${subfolder}/${filename}`;

  return {
    storagePath: fullPath,
    publicUrl,
    filename,
    sha256
  };
}
