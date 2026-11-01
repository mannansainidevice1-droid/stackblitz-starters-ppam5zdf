/**
 * BHAIRAVI Creations Digital Platform
 * Custom Order Enquiry Management & Timeline Service
 * Target: src/server/services/enquiry.service.ts
 */

import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import { EnquiryStatus, PreferredContactMethod, ProjectType } from '../../shared/types.js';
import { hashClientIp, getDailySalt } from '../auth/tokens.js';
import { validateHoneypot, validateRenderTimestamp } from '../middleware/anti_spam.js';
import { enquiryRateLimiter } from '../middleware/rate_limiter.js';
import { storeUploadFile, validateEnquiryAttachmentMagicBytes, MAX_ENQUIRY_ATTACHMENT_SIZE_BYTES } from './upload.service.js';

export interface SubmitEnquiryInput {
  customer_name: string;
  contact_phone: string;
  contact_email?: string | null;
  preferred_contact_method?: PreferredContactMethod;
  project_type: ProjectType;
  design_description: string;
  approximate_quantity?: number;
  budget_range_inr?: string | null;
  referenced_product_id?: string | null;
  bhr_check_field?: string;
  rendered_at?: number | string;
  attachmentBuffer?: Buffer;
  attachmentOriginalName?: string;
}

const ALLOWED_STATUS_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  new: ['contacted', 'closed'],
  contacted: ['quoted', 'closed'],
  quoted: ['converted', 'closed'],
  converted: ['closed'],
  closed: [] // Terminal state
};

export class EnquiryService {
  constructor(private db: Database.Database) {}

  public getDailySalt(): string {
    return getDailySalt();
  }

  /**
   * Generates a direct WhatsApp click-to-chat bridge URL.
   */
  public generateWhatsAppUrl(enquiryId: string, customerName: string, projectType: string): string {
    const cleanPhone = (process.env.WHATSAPP_BUSINESS_NUMBER || '917347278010').replace(/\D/g, '');
    const message = `Hello BHAIRAVI Creations!\n\nI submitted Custom Order Enquiry #${enquiryId} for: ${projectType}.\nName: ${customerName}.\nLooking forward to discussing materials and finishing options.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Storefront public enquiry submission with anti-spam, honeypot, rate-limiting, and safe uploads.
   */
  public submitEnquiry(input: SubmitEnquiryInput, clientIp: string = '127.0.0.1', userAgent?: string) {
    const ipHash = hashClientIp(clientIp);

    // 1. IP Rate Limiting (max 5 submissions per hour)
    const rateCheck = enquiryRateLimiter.check(ipHash);
    if (!rateCheck.allowed) {
      return {
        status: 429,
        error: 'Too many custom order submissions from this connection. Please try again in an hour.'
      };
    }

    // 2. Invisible Honeypot Trap Inspection
    const isClean = validateHoneypot(input.bhr_check_field);
    if (!isClean) {
      // Bot tripped honeypot! Silently return synthetic 200 without DB write.
      const syntheticId = `BC-ENQ-${Date.now().toString().slice(-6)}`;
      return {
        status: 200,
        success: true,
        enquiry_id: syntheticId,
        status_label: 'new',
        whatsapp_url: `https://wa.me/${(process.env.WHATSAPP_BUSINESS_NUMBER || '917347278010').replace(/\D/g, '')}`,
        message: 'Thank you! Your custom order enquiry has been received.'
      };
    }

    // 3. Render Duration Validation (<2.5s automated script, >24h stale)
    const renderCheck = validateRenderTimestamp(input.rendered_at);
    if (!renderCheck.valid) {
      return {
        status: 422,
        error: renderCheck.reason || 'Form submission validation failed'
      };
    }

    // 4. Payload Field Validation
    const name = (input.customer_name || '').replace(/<[^>]*>?/gm, '').trim();
    if (name.length < 2 || name.length > 100) {
      return { status: 400, error: 'Customer name must be between 2 and 100 characters.' };
    }

    const phone = (input.contact_phone || '').trim();
    if (!/^\+?[0-9\s-]{10,18}$/.test(phone)) {
      return { status: 400, error: 'Please enter a valid contact phone number with at least 10 digits.' };
    }

    if (input.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contact_email.trim())) {
      return { status: 400, error: 'Please enter a valid email address.' };
    }

    const description = (input.design_description || '').trim();
    if (description.length < 10 || description.length > 5000) {
      return { status: 400, error: 'Design description must be between 10 and 5,000 characters.' };
    }

    const quantity = Math.max(1, input.approximate_quantity || 1);
    const preferredMethod = input.preferred_contact_method || 'whatsapp';
    const VALID_PROJECT_TYPES: ProjectType[] = [
      'custom_figurine',
      'architectural_model',
      'lithophane',
      'corporate_gifting',
      'replacement_part',
      'other'
    ];
    const rawType = input.project_type as ProjectType;
    const projectType: ProjectType = VALID_PROJECT_TYPES.includes(rawType) ? rawType : 'other';

    // 5. Attachment Security Verification (if provided)
    let attachmentRecord: {
      storagePath: string;
      originalFilename: string;
      fileSizeBytes: number;
      mimeType: string;
      sha256: string;
    } | null = null;

    if (input.attachmentBuffer && input.attachmentBuffer.length > 0) {
      if (input.attachmentBuffer.length > MAX_ENQUIRY_ATTACHMENT_SIZE_BYTES) {
        return { status: 413, error: 'Attachment file size exceeds maximum 10MB limit.' };
      }

      const magicCheck = validateEnquiryAttachmentMagicBytes(
        input.attachmentBuffer,
        input.attachmentOriginalName || ''
      );
      if (!magicCheck.valid) {
        return { status: 422, error: magicCheck.error || 'Invalid attachment file type.' };
      }

      const stored = storeUploadFile('enquiries', input.attachmentBuffer, magicCheck.extension || 'bin');
      attachmentRecord = {
        storagePath: stored.storagePath,
        originalFilename: (input.attachmentOriginalName || 'attachment').replace(/[\0\/\\]/g, ''),
        fileSizeBytes: input.attachmentBuffer.length,
        mimeType: magicCheck.detectedMime || 'application/octet-stream',
        sha256: stored.sha256
      };
    }

    // 6. Database Insertion within Atomic Transaction
    const enquiryId = `BC-ENQ-${Date.now().toString().slice(-4)}${crypto.randomInt(10, 99)}`;

    const transaction = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO enquiries (
          id, customer_name, contact_email, contact_phone, preferred_contact_method,
          project_type, design_description, approximate_quantity, budget_range_inr,
          referenced_product_id, status, ip_hash, user_agent, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, 'new', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `).run(
        enquiryId,
        name,
        input.contact_email?.trim() || null,
        phone,
        preferredMethod,
        projectType,
        description,
        quantity,
        input.budget_range_inr || null,
        input.referenced_product_id || null,
        ipHash,
        userAgent || null
      );

      if (attachmentRecord) {
        const attId = 'att_' + crypto.randomUUID();
        this.db.prepare(`
          INSERT INTO enquiry_attachments (
            id, enquiry_id, storage_path, original_filename, file_size_bytes, mime_type, file_sha256, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          attId,
          enquiryId,
          attachmentRecord.storagePath,
          attachmentRecord.originalFilename,
          attachmentRecord.fileSizeBytes,
          attachmentRecord.mimeType,
          attachmentRecord.sha256
        );
      }

      this.db.prepare(`
        INSERT INTO enquiry_timeline (
          id, enquiry_id, admin_user_id, action_type, previous_status, new_status, note, created_at
        ) VALUES (?, ?, NULL, 'status_change', NULL, 'new', 'Enquiry submitted via custom order form on storefront.', CURRENT_TIMESTAMP)
      `).run('tl_' + crypto.randomUUID(), enquiryId);
    });

    transaction();

    const whatsappUrl = this.generateWhatsAppUrl(enquiryId, name, projectType);

    return {
      status: 201,
      success: true,
      enquiry_id: enquiryId,
      status_label: 'new',
      whatsapp_url: whatsappUrl,
      message: 'Thank you! Your custom order enquiry has been received.'
    };
  }

  /**
   * Admin: List enquiries with status filtering, search, and pagination.
   */
  public listAdminEnquiries(params: {
    status?: string;
    project_type?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const sqlParams: any[] = [];

    if (params.status && params.status !== 'all') {
      conditions.push('e.status = ?');
      sqlParams.push(params.status);
    }
    if (params.project_type) {
      conditions.push('e.project_type = ?');
      sqlParams.push(params.project_type);
    }
    if (params.date_from) {
      conditions.push('e.created_at >= ?');
      sqlParams.push(params.date_from);
    }
    if (params.date_to) {
      conditions.push('e.created_at <= ?');
      sqlParams.push(params.date_to);
    }
    if (params.search) {
      conditions.push('(e.id LIKE ? OR e.customer_name LIKE ? OR e.contact_phone LIKE ? OR e.contact_email LIKE ? OR e.design_description LIKE ?)');
      const term = `%${params.search}%`;
      sqlParams.push(term, term, term, term, term);
    }

    const whereClause = conditions.join(' AND ');

    const countRow = this.db.prepare(`SELECT COUNT(*) as total FROM enquiries e WHERE ${whereClause}`).get(...sqlParams) as any;
    const totalItems = countRow ? countRow.total : 0;

    const rowsQuery = `
      SELECT 
        e.*,
        p.name as referenced_product_name,
        p.slug as referenced_product_slug,
        (SELECT COUNT(*) FROM enquiry_attachments ea WHERE ea.enquiry_id = e.id) as attachments_count,
        (SELECT COUNT(*) FROM enquiry_timeline et WHERE et.enquiry_id = e.id) as timeline_count
      FROM enquiries e
      LEFT JOIN products p ON e.referenced_product_id = p.id
      WHERE ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const data = this.db.prepare(rowsQuery).all(...sqlParams, limit, offset) as any[];

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / limit) || 1
      }
    };
  }

  /**
   * Admin: Get enquiry detail with attachments and full chronological timeline.
   */
  public getEnquiryById(id: string) {
    const enquiry = this.db.prepare(`
      SELECT 
        e.*,
        p.name as referenced_product_name,
        p.slug as referenced_product_slug
      FROM enquiries e
      LEFT JOIN products p ON e.referenced_product_id = p.id
      WHERE e.id = ?
    `).get(id) as any;

    if (!enquiry) return null;

    const attachments = this.db.prepare(`
      SELECT id, original_filename, file_size_bytes, mime_type, file_sha256, created_at
      FROM enquiry_attachments
      WHERE enquiry_id = ?
      ORDER BY created_at ASC
    `).all(id) as any[];

    const timeline = this.db.prepare(`
      SELECT 
        t.id,
        t.action_type,
        t.previous_status,
        t.new_status,
        t.note,
        t.created_at,
        u.username as admin_username,
        u.role as admin_role
      FROM enquiry_timeline t
      LEFT JOIN admin_users u ON t.admin_user_id = u.id
      WHERE t.enquiry_id = ?
      ORDER BY t.created_at ASC
    `).all(id) as any[];

    return {
      ...enquiry,
      attachments,
      timeline
    };
  }

  /**
   * Admin: Update enquiry status through valid state machine transitions.
   */
  public updateEnquiryStatus(
    id: string,
    newStatus: EnquiryStatus,
    note?: string,
    adminUserId?: string
  ) {
    const existing = this.db.prepare('SELECT id, status FROM enquiries WHERE id = ?').get(id) as any;
    if (!existing) {
      throw new Error(`Enquiry not found: '${id}'`);
    }

    const currentStatus = existing.status as EnquiryStatus;

    // Check transition rules
    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(`Disallowed status transition from '${currentStatus}' to '${newStatus}'.`);
    }

    const transaction = this.db.transaction(() => {
      this.db.prepare(`
        UPDATE enquiries 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(newStatus, id);

      this.db.prepare(`
        INSERT INTO enquiry_timeline (
          id, enquiry_id, admin_user_id, action_type, previous_status, new_status, note, created_at
        ) VALUES (?, ?, ?, 'status_change', ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        'tl_' + crypto.randomUUID(),
        id,
        adminUserId ?? null,
        currentStatus,
        newStatus,
        note || `Status updated from ${currentStatus} to ${newStatus}`
      );

      this.db.prepare(`
        INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id, changes_json)
        VALUES (?, ?, 'enquiry.status_change', 'enquiry', ?, ?)
      `).run(
        'audit_' + crypto.randomUUID(),
        adminUserId ?? null,
        id,
        JSON.stringify({ from: currentStatus, to: newStatus, note })
      );
    });

    transaction();

    return {
      success: true,
      enquiry_id: id,
      previous_status: currentStatus,
      new_status: newStatus
    };
  }

  /**
   * Admin: Add internal craftsmanship consultation notes (up to 10,000 characters).
   */
  public addInternalNote(id: string, noteText: string, adminUserId?: string) {
    const existing = this.db.prepare('SELECT id FROM enquiries WHERE id = ?').get(id);
    if (!existing) {
      throw new Error(`Enquiry not found: '${id}'`);
    }

    if (!noteText || noteText.trim().length === 0) {
      throw new Error('Note content cannot be empty.');
    }

    if (noteText.length > 10000) {
      throw new Error('Note exceeds maximum allowed length of 10,000 characters.');
    }

    const timelineId = 'tl_' + crypto.randomUUID();

    this.db.prepare(`
      INSERT INTO enquiry_timeline (
        id, enquiry_id, admin_user_id, action_type, previous_status, new_status, note, created_at
      ) VALUES (?, ?, ?, 'internal_note', NULL, NULL, ?, CURRENT_TIMESTAMP)
    `).run(timelineId, id, adminUserId ?? null, noteText);

    return {
      success: true,
      timeline_id: timelineId,
      message: 'Internal note added to enquiry timeline.'
    };
  }
}
