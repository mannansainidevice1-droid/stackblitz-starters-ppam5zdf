/**
 * BHAIRAVI Creations Digital Platform
 * Reusable UI Components & Design System Elements
 * Target: src/server/views/components/ui.component.ts
 */

export function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ButtonOptions {
  text: string;
  href?: string;
  variant?: 'primary' | 'secondary' | 'cobalt' | 'ghost' | 'whatsapp' | 'amazon' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  extraClass?: string;
  iconSvg?: string;
  attributes?: string;
  ariaLabel?: string;
}

export function renderButton(opts: ButtonOptions): string {
  const {
    text,
    href,
    variant = 'primary',
    size = 'md',
    type = 'button',
    extraClass = '',
    iconSvg = '',
    attributes = '',
    ariaLabel = ''
  } = opts;

  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn-md';
  const combinedClass = `btn ${variantClass} ${sizeClass} ${extraClass}`.trim();
  const ariaAttr = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : '';

  const innerContent = `${iconSvg ? `<span class="btn-icon" aria-hidden="true">${iconSvg}</span>` : ''}<span>${escapeHtml(text)}</span>`;

  if (href) {
    return `<a href="${href}" class="${combinedClass}"${ariaAttr} ${attributes}>${innerContent}</a>`;
  }
  return `<button type="${type}" class="${combinedClass}"${ariaAttr} ${attributes}>${innerContent}</button>`;
}

export interface BadgeOptions {
  text: string;
  variant?: 'neutral' | 'cobalt' | 'amber' | 'emerald' | 'charcoal';
  size?: 'sm' | 'md';
  extraClass?: string;
}

export function renderBadge(text: string, variant: BadgeOptions['variant'] = 'neutral', extraClass = ''): string {
  const variantClasses: Record<string, string> = {
    neutral: 'bg-stone-100 text-stone-800 border-stone-200',
    cobalt: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    charcoal: 'bg-slate-900 text-white border-slate-900'
  };

  const styleClass = variantClasses[variant] || variantClasses.neutral;
  return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border uppercase ${styleClass} ${extraClass}">${escapeHtml(text)}</span>`;
}

export interface SectionHeaderOptions {
  title: string;
  subtitle?: string;
  tag?: string;
  centered?: boolean;
  extraClass?: string;
}

export function renderSectionHeader(opts: SectionHeaderOptions): string {
  const { title, subtitle, tag, centered = false, extraClass = '' } = opts;
  const alignClass = centered ? 'text-center mx-auto items-center' : 'text-left';

  return `
    <header class="section-header flex flex-col ${alignClass} max-w-3xl mb-12 ${extraClass}">
      ${tag ? `<span class="section-tag inline-block uppercase text-xs font-bold tracking-widest text-[#2563EB] mb-3">${escapeHtml(tag)}</span>` : ''}
      <h2 class="section-title text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0B0F19] leading-tight">
        ${escapeHtml(title)}
      </h2>
      ${subtitle ? `<p class="section-subtitle mt-4 text-base sm:text-lg text-[#475569] leading-relaxed">${escapeHtml(subtitle)}</p>` : ''}
    </header>
  `;
}
