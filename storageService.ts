import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { StoredFileMetadata, StorageCategory } from './src/types';

// =============================================================================
// PRODUCTION FIREBASE / GOOGLE CLOUD STORAGE CONFIGURATION & ENGINE
// =============================================================================

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  'f92690ef-aa06-4beb-9138-04e87b073ea6';

const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || process.env.GCS_CLIENT_EMAIL || '';

// Handle escaped newlines in private key string
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.GCS_PRIVATE_KEY || '';
const PRIVATE_KEY = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : '';

const BUCKET_NAME =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.GCS_BUCKET_NAME ||
  `${PROJECT_ID}.appspot.com`;

// Local directory for isolated fallback storage strictly during development without credentials
const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), 'storage_uploads');
if (!IS_PRODUCTION && !fs.existsSync(LOCAL_STORAGE_DIR)) {
  try {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  } catch (e) {}
}

// Allowed MIME types map with max size in bytes
export const ALLOWED_MIME_TYPES: Record<string, { category: StorageCategory; maxSize: number; ext: string }> = {
  // Images (Max 25MB)
  'image/jpeg': { category: 'profile', maxSize: 25 * 1024 * 1024, ext: 'jpg' },
  'image/png': { category: 'profile', maxSize: 25 * 1024 * 1024, ext: 'png' },
  'image/webp': { category: 'profile', maxSize: 25 * 1024 * 1024, ext: 'webp' },
  'image/gif': { category: 'whatsapp-media', maxSize: 25 * 1024 * 1024, ext: 'gif' },
  'image/svg+xml': { category: 'documents', maxSize: 10 * 1024 * 1024, ext: 'svg' },

  // Audio (Max 30MB)
  'audio/mpeg': { category: 'whatsapp-media', maxSize: 30 * 1024 * 1024, ext: 'mp3' },
  'audio/ogg': { category: 'whatsapp-media', maxSize: 30 * 1024 * 1024, ext: 'ogg' },
  'audio/wav': { category: 'whatsapp-media', maxSize: 30 * 1024 * 1024, ext: 'wav' },
  'audio/aac': { category: 'whatsapp-media', maxSize: 30 * 1024 * 1024, ext: 'aac' },
  'audio/mp4': { category: 'whatsapp-media', maxSize: 30 * 1024 * 1024, ext: 'm4a' },
  'audio/x-m4a': { category: 'whatsapp-media', maxSize: 30 * 1024 * 1024, ext: 'm4a' },
  'audio/webm': { category: 'whatsapp-media', maxSize: 30 * 1024 * 1024, ext: 'webm' },
  'audio/amr': { category: 'whatsapp-media', maxSize: 30 * 1024 * 1024, ext: 'amr' },

  // Video (Max 100MB)
  'video/mp4': { category: 'whatsapp-media', maxSize: 100 * 1024 * 1024, ext: 'mp4' },
  'video/webm': { category: 'whatsapp-media', maxSize: 100 * 1024 * 1024, ext: 'webm' },
  'video/quicktime': { category: 'whatsapp-media', maxSize: 100 * 1024 * 1024, ext: 'mov' },
  'video/3gpp': { category: 'whatsapp-media', maxSize: 50 * 1024 * 1024, ext: '3gp' },

  // Documents & Knowledge Base (Max 50MB)
  'application/pdf': { category: 'knowledge', maxSize: 50 * 1024 * 1024, ext: 'pdf' },
  'text/plain': { category: 'knowledge', maxSize: 20 * 1024 * 1024, ext: 'txt' },
  'text/markdown': { category: 'knowledge', maxSize: 20 * 1024 * 1024, ext: 'md' },
  'text/csv': { category: 'knowledge', maxSize: 30 * 1024 * 1024, ext: 'csv' },
  'application/json': { category: 'knowledge', maxSize: 20 * 1024 * 1024, ext: 'json' },
  'application/msword': { category: 'documents', maxSize: 30 * 1024 * 1024, ext: 'doc' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { category: 'knowledge', maxSize: 30 * 1024 * 1024, ext: 'docx' },
  'application/vnd.ms-excel': { category: 'documents', maxSize: 30 * 1024 * 1024, ext: 'xls' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { category: 'documents', maxSize: 30 * 1024 * 1024, ext: 'xlsx' },
};

class StorageService {
  private gcsStorage: Storage | null = null;
  private isFirebaseBucketReady = false;
  private initAttempted = false;

  constructor() {
    this.initStorageClient();
  }

  private initStorageClient() {
    if (this.initAttempted) return;
    this.initAttempted = true;

    try {
      if (CLIENT_EMAIL && PRIVATE_KEY) {
        // Explicit Service Account credentials
        this.gcsStorage = new Storage({
          projectId: PROJECT_ID,
          credentials: {
            client_email: CLIENT_EMAIL,
            private_key: PRIVATE_KEY,
          },
        });
        this.isFirebaseBucketReady = true;
        console.log(`[Firebase Storage] Initialized with Service Account: ${CLIENT_EMAIL} on bucket: ${BUCKET_NAME}`);
      } else {
        // Application Default Credentials (ADC) on Cloud Run / GCP container
        this.gcsStorage = new Storage({
          projectId: PROJECT_ID,
        });
        this.isFirebaseBucketReady = true;
        console.log(`[Firebase Storage] Initialized with ADC for project ${PROJECT_ID} on bucket: ${BUCKET_NAME}`);
      }
    } catch (err: any) {
      if (IS_PRODUCTION) {
        console.error(`[Firebase Storage FATAL] Failed to initialize Google Cloud Storage in production:`, err.message);
      } else {
        console.warn(`[Firebase Storage] Note: Development storage initialized with isolated workspace fallback:`, err.message);
      }
      this.isFirebaseBucketReady = false;
    }
  }

  public isConfigured(): boolean {
    return this.isFirebaseBucketReady && Boolean(this.gcsStorage);
  }

  public getBucketName(): string {
    return BUCKET_NAME;
  }

  public getProjectId(): string {
    return PROJECT_ID;
  }

  /**
   * Generates a secure, sanitized multi-tenant object path
   * Pattern: businesses/{businessId}/{category}/{subPath?}/{timestamp}_{randomHex}.{ext}
   * Completely immune to path traversal.
   */
  public generateTenantStoragePath(
    businessId: string,
    category: StorageCategory,
    originalFilename: string,
    subPath?: string
  ): { storagePath: string; sanitizedFilename: string } {
    // 1. Sanitize businessId and category to prevent path traversal
    const cleanBizId = businessId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanCategory = category.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanSubPath = subPath ? subPath.replace(/[^a-zA-Z0-9_-]/g, '_') : '';

    // 2. Extract safe extension
    const extMatch = originalFilename.match(/\.([a-zA-Z0-9]+)$/);
    const rawExt = extMatch ? extMatch[1].toLowerCase() : 'bin';
    const cleanExt = rawExt.replace(/[^a-z0-9]/g, '');

    // 3. Generate unique random filename
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(6).toString('hex');
    const sanitizedFilename = `${timestamp}_${randomHex}.${cleanExt}`;

    // 4. Assemble path
    let storagePath = `businesses/${cleanBizId}/${cleanCategory}`;
    if (cleanSubPath) {
      storagePath += `/${cleanSubPath}`;
    }
    storagePath += `/${sanitizedFilename}`;

    return { storagePath, sanitizedFilename };
  }

  /**
   * Uploads a file buffer with multi-tenant isolation
   * In PRODUCTION, uploads strictly to Firebase Cloud Storage.
   */
  public async uploadBuffer(params: {
    businessId: string;
    category: StorageCategory;
    originalFilename: string;
    mimeType: string;
    buffer: Buffer;
    customerId?: string;
    conversationId?: string;
    uploadedBy?: 'agent' | 'customer' | 'system' | 'admin';
    metadata?: Record<string, any>;
  }): Promise<StoredFileMetadata> {
    const {
      businessId,
      category,
      originalFilename,
      mimeType,
      buffer,
      customerId,
      conversationId,
      uploadedBy = 'agent',
      metadata = {},
    } = params;

    // 1. Validate MIME and File Size
    const mimeConfig = ALLOWED_MIME_TYPES[mimeType];
    if (!mimeConfig) {
      throw new Error(`UNSUPPORTED_MIME_TYPE: File type "${mimeType}" is not permitted for storage.`);
    }
    const maxAllowed = mimeConfig.maxSize;
    if (buffer.length > maxAllowed) {
      throw new Error(`File size (${(buffer.length / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed limit of ${(maxAllowed / (1024 * 1024)).toFixed(0)}MB for ${mimeType}.`);
    }

    // 2. Build tenant path
    const subPath = conversationId
      ? `conv_${conversationId.replace(/[^a-zA-Z0-9_-]/g, '')}`
      : customerId
      ? `cust_${customerId.replace(/[^a-zA-Z0-9_-]/g, '')}`
      : '';

    const { storagePath, sanitizedFilename } = this.generateTenantStoragePath(
      businessId,
      category,
      originalFilename,
      subPath
    );

    const fileId = `file_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // 3. Extract text if knowledge or document file for Gemini AI
    let extractedText: string | undefined;
    if (category === 'knowledge' || mimeType === 'application/pdf' || mimeType.startsWith('text/') || mimeType === 'application/json') {
      try {
        extractedText = await this.extractText(buffer, mimeType, originalFilename);
      } catch (err: any) {
        console.warn(`[StorageService] Text extraction notice for ${originalFilename}:`, err.message);
      }
    }

    // 4. Store in Firebase Cloud Storage (GCS)
    let storedInGcs = false;
    let gcsError: Error | null = null;

    if (this.gcsStorage) {
      try {
        const bucket = this.gcsStorage.bucket(BUCKET_NAME);
        const file = bucket.file(storagePath);

        await file.save(buffer, {
          contentType: mimeType,
          metadata: {
            businessId,
            category,
            originalFilename,
            uploadedBy,
            fileId,
            ...metadata,
          },
          resumable: false,
        });
        storedInGcs = true;
      } catch (err: any) {
        gcsError = err;
        console.warn(`[Firebase Storage] Cloud bucket write attempt notice:`, err.message);
      }
    }

    // CRITICAL ENFORCEMENT: If in Production, reject any local fallback
    if (IS_PRODUCTION && !storedInGcs) {
      throw new Error(
        `PRODUCTION_STORAGE_FAILED: Unable to persist object to Firebase Cloud Storage bucket (${BUCKET_NAME}). Cause: ${gcsError?.message || 'Bucket unreachable'}`
      );
    }

    // In local development mode without GCS credentials, write to local mirror
    if (!IS_PRODUCTION) {
      const localFilePath = path.join(LOCAL_STORAGE_DIR, storagePath);
      const localFileDir = path.dirname(localFilePath);
      if (!fs.existsSync(localFileDir)) {
        fs.mkdirSync(localFileDir, { recursive: true });
      }
      await fs.promises.writeFile(localFilePath, buffer);
    }

    // 5. Construct public/authenticated endpoints
    const publicUrl = `/api/storage/files/${fileId}/download`;
    const previewUrl = `/api/storage/files/${fileId}/preview`;

    const fileRecord: StoredFileMetadata = {
      id: fileId,
      fileId,
      businessId,
      category,
      customerId,
      conversationId,
      originalFilename,
      originalName: originalFilename,
      sanitizedFilename,
      storagePath,
      mimeType,
      contentType: mimeType,
      fileSize: buffer.length,
      size: buffer.length,
      publicUrl,
      previewUrl,
      fileUrl: previewUrl,
      createdAt: new Date().toISOString(),
      uploadedBy,
      status: 'active',
      extractedText,
      metadata: {
        ...metadata,
        backend: storedInGcs ? 'firebase_gcs' : 'local_dev_fallback',
        bucket: storedInGcs ? BUCKET_NAME : undefined,
      },
    };

    return fileRecord;
  }

  /**
   * Retrieves file binary buffer verifying businessId ownership
   */
  public async getFileBuffer(fileRecord: StoredFileMetadata, requestingBusinessId: string): Promise<Buffer> {
    // Strict Multi-tenant isolation verification
    if (fileRecord.businessId !== requestingBusinessId) {
      throw new Error('ACCESS_DENIED: Tenant ownership mismatch.');
    }

    // 1. Fetch from Firebase Cloud Storage bucket if configured
    if (this.gcsStorage) {
      try {
        const bucket = this.gcsStorage.bucket(BUCKET_NAME);
        const file = bucket.file(fileRecord.storagePath);
        const [contents] = await file.download();
        return contents;
      } catch (err: any) {
        if (IS_PRODUCTION) {
          throw new Error(`STORAGE_RETRIEVAL_FAILED: Failed to download object from Firebase Cloud Storage.`);
        }
      }
    }

    // 2. In dev mode only: check local mirror
    if (!IS_PRODUCTION) {
      const localPath = path.join(LOCAL_STORAGE_DIR, fileRecord.storagePath);
      if (fs.existsSync(localPath)) {
        return await fs.promises.readFile(localPath);
      }
    }

    throw new Error('FILE_NOT_FOUND: The requested object could not be located in storage.');
  }

  /**
   * Deletes a file with multi-tenant verification
   */
  public async deleteFile(fileRecord: StoredFileMetadata, requestingBusinessId: string): Promise<boolean> {
    // Strict Multi-tenant isolation verification
    if (fileRecord.businessId !== requestingBusinessId) {
      throw new Error('ACCESS_DENIED: Cannot delete file belonging to another organization.');
    }

    let deleted = false;

    // 1. Delete from Firebase Storage (GCS)
    if (this.gcsStorage) {
      try {
        const bucket = this.gcsStorage.bucket(BUCKET_NAME);
        const file = bucket.file(fileRecord.storagePath);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          deleted = true;
        }
      } catch (err: any) {
        if (IS_PRODUCTION) {
          console.error(`[Firebase Storage] Cloud bucket delete error:`, err.message);
        }
      }
    }

    // 2. In dev mode only: delete from local mirror
    if (!IS_PRODUCTION) {
      const localPath = path.join(LOCAL_STORAGE_DIR, fileRecord.storagePath);
      if (fs.existsSync(localPath)) {
        try {
          await fs.promises.unlink(localPath);
          deleted = true;
        } catch (e) {}
      }
    }

    return deleted;
  }

  /**
   * Extracts text from document buffers for Gemini AI knowledge grounding
   */
  public async extractText(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        const pdfParseModule = await import('pdf-parse');
        const pdfParser = (pdfParseModule as any).default || pdfParseModule;
        const data = await pdfParser(buffer);
        return data.text ? data.text.trim() : '';
      }

      if (
        mimeType.startsWith('text/') ||
        mimeType === 'application/json' ||
        filename.endsWith('.txt') ||
        filename.endsWith('.md') ||
        filename.endsWith('.csv') ||
        filename.endsWith('.json')
      ) {
        return buffer.toString('utf-8').trim();
      }

      if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        filename.endsWith('.docx')
      ) {
        const raw = buffer.toString('utf-8');
        const textParts = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (textParts) {
          return textParts.map(t => t.replace(/<[^>]+>/g, '')).join(' ').trim();
        }
      }
    } catch (e: any) {
      console.warn(`[StorageService] Text extraction notice for ${filename}:`, e.message);
    }
    return '';
  }
}

export const storageService = new StorageService();
