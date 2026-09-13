export type MediaTypeFilter = 'ALL' | 'IMAGE' | 'DOCUMENT' | 'OTHER';

export const MEDIA_TYPE_LABELS: Record<MediaTypeFilter, string> = {
  ALL: 'همه',
  IMAGE: 'تصاویر',
  DOCUMENT: 'اسناد',
  OTHER: 'سایر',
};

export const MEDIA_UPLOAD = {
  maxSize: 25 * 1024 * 1024,
  accept:
    'image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx',
  allowedTypes: new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  imageExtensions: new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']),
  documentExtensions: new Set(['pdf', 'txt', 'doc', 'docx']),
} as const;

export function normalizeClientMime(mime: string): string {
  const value = mime.trim().toLowerCase();
  if (value === 'image/jpg' || value === 'image/pjpeg') return 'image/jpeg';
  if (value === 'image/x-png') return 'image/png';
  return value;
}

export function isAllowedMediaMime(mime: string): boolean {
  return MEDIA_UPLOAD.allowedTypes.has(normalizeClientMime(mime));
}

export function isAllowedMediaFile(file: File): boolean {
  const mime = normalizeClientMime(file.type);
  if (mime && isAllowedMediaMime(mime)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return MEDIA_UPLOAD.imageExtensions.has(ext) || MEDIA_UPLOAD.documentExtensions.has(ext);
}

export function getMediaCategory(mimeType: string): Exclude<MediaTypeFilter, 'ALL'> {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType.includes('word') ||
    mimeType.includes('document')
  ) {
    return 'DOCUMENT';
  }
  return 'OTHER';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}

export function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function parseTagsInput(input: string): string[] {
  return input
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}
