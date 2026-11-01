/// <reference lib="dom" />
/**
 * BHAIRAVI Creations Digital Platform
 * Client Safe Upload Drop Zone Component
 * Target: src/client/components/enquiry/upload_zone.ts
 */

export interface AttachedFile {
  file: File;
  id: string;
  name: string;
  sizeFormatted: string;
}

export interface UploadZoneOptions {
  maxFiles?: number;
  maxSizeBytes?: number;
  allowedExtensions?: string[];
  onFilesChanged: (files: File[]) => void;
}

export class SafeUploadZone {
  private files: AttachedFile[] = [];
  private maxFiles: number;
  private maxSizeBytes: number;
  private allowedExtensions: string[];
  private container: HTMLElement;

  constructor(containerId: string, private options: UploadZoneOptions) {
    this.maxFiles = options.maxFiles || 3;
    this.maxSizeBytes = options.maxSizeBytes || 10 * 1024 * 1024; // 10MB
    this.allowedExtensions = options.allowedExtensions || ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.stl'];

    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.render();
  }

  public getFiles(): File[] {
    return this.files.map((f) => f.file);
  }

  public reset(): void {
    this.files = [];
    this.render();
  }

  public validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size === 0) {
      return { valid: false, error: 'Empty file cannot be uploaded.' };
    }
    if (file.size > this.maxSizeBytes) {
      return { valid: false, error: `File '${file.name}' exceeds the 10MB size limit.` };
    }

    const name = file.name.toLowerCase();
    const extMatch = name.match(/\.[0-9a-z]+$/);
    const ext = extMatch ? extMatch[0] : '';

    if (!this.allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `File format '${ext}' is not supported. Please upload JPEG, PNG, WebP, PDF, or STL.`
      };
    }

    // Prohibit executables, scripts, or SVG vector payload files
    if (/\.(exe|sh|js|svg|html|bat|php|py|cmd|vbs)$/i.test(name)) {
      return { valid: false, error: 'Executable, script, or SVG vector files are strictly disallowed.' };
    }

    // Prohibit double extension attempts (e.g. model.stl.exe)
    const dotCount = (name.match(/\./g) || []).length;
    if (dotCount > 1) {
      const parts = name.split('.');
      const forbiddenSubExts = ['exe', 'sh', 'js', 'svg', 'html', 'bat', 'php', 'py'];
      if (parts.some((p, i) => i > 0 && forbiddenSubExts.includes(p))) {
        return { valid: false, error: 'Suspicious double-extension detected.' };
      }
    }

    return { valid: true };
  }

  private handleFiles(incoming: FileList | File[]): void {
    const errorContainer = this.container.querySelector('.upload-error-msg') as HTMLElement;
    if (errorContainer) errorContainer.textContent = '';

    if (this.files.length + incoming.length > this.maxFiles) {
      if (errorContainer) errorContainer.textContent = `You can attach a maximum of ${this.maxFiles} files.`;
      return;
    }

    for (let i = 0; i < incoming.length; i++) {
      const file = incoming[i];
      const val = this.validateFile(file);
      if (!val.valid) {
        if (errorContainer) errorContainer.textContent = val.error || 'Invalid file';
        return;
      }
      this.files.push({
        file,
        id: 'att_' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        sizeFormatted: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      });
    }

    this.render();
    this.options.onFilesChanged(this.getFiles());
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="upload-dropzone p-6 border-2 border-dashed border-[#E7E5E4] rounded-lg text-center bg-[#FAF9F6] transition-colors focus-within:ring-2 focus-within:ring-[#C2410C]"
           role="region" aria-label="Reference file upload zone">
        <svg class="mx-auto h-12 w-12 text-[#9A3412] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="text-sm font-medium text-[#1C1917]">
          Drag & drop reference photos or 3D STL files here, or
          <label for="bhr_file_input" class="text-[#C2410C] hover:text-[#9A3412] cursor-pointer underline ml-1 focus:outline-none">browse</label>
        </p>
        <p class="text-xs text-[#78716C] mt-1">Supports STL, JPEG, PNG, WebP, PDF up to 10MB (max 3 files)</p>
        <input id="bhr_file_input" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.stl" class="sr-only" aria-label="Upload reference photos or 3D CAD files" />
        <div class="upload-error-msg text-xs text-red-600 mt-2 font-medium" role="alert"></div>
      </div>

      ${
        this.files.length > 0
          ? `
        <ul class="mt-4 space-y-2" aria-label="Attached files">
          ${this.files
            .map(
              (f, idx) => `
            <li class="flex items-center justify-between p-3 bg-white border border-[#E7E5E4] rounded text-sm text-[#1C1917]">
              <span class="truncate max-w-xs font-mono text-xs">${f.name} (${f.sizeFormatted})</span>
              <button type="button" data-remove-index="${idx}" class="text-red-600 hover:text-red-800 text-xs font-medium ml-4 p-1 focus:outline-none" aria-label="Remove ${f.name}">
                Remove
              </button>
            </li>
          `
            )
            .join('')}
        </ul>
      `
          : ''
      }
    `;

    const dropzone = this.container.querySelector('.upload-dropzone') as HTMLElement;
    const input = this.container.querySelector('#bhr_file_input') as HTMLInputElement;

    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-[#C2410C]', 'bg-[#FFF7ED]');
      });

      dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-[#C2410C]', 'bg-[#FFF7ED]');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-[#C2410C]', 'bg-[#FFF7ED]');
        if (e.dataTransfer && e.dataTransfer.files) {
          this.handleFiles(e.dataTransfer.files);
        }
      });
    }

    if (input) {
      input.addEventListener('change', () => {
        if (input.files) {
          this.handleFiles(input.files);
        }
      });
    }

    this.container.querySelectorAll('button[data-remove-index]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-remove-index') || '0', 10);
        this.files.splice(idx, 1);
        this.render();
        this.options.onFilesChanged(this.getFiles());
      });
    });
  }
}
