/** تشخیص MIME از magic bytes — بدون اعتماد به file.type کلاینت */

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];
const GIF87 = [0x47, 0x49, 0x46, 0x38, 0x37];
const GIF89 = [0x47, 0x49, 0x46, 0x38, 0x39];
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIG = [0x57, 0x45, 0x42, 0x50];
const PDF = [0x25, 0x50, 0x44, 0x46];
const ICO = [0x00, 0x00, 0x01, 0x00];
const OLE = [0xd0, 0xcf, 0x11, 0xe0];
const ZIP_LOCAL = [0x50, 0x4b, 0x03, 0x04];

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  return sig.every((b, i) => bytes[i] === b);
}

/** یکسان‌سازی MIMEهای متداول مرورگر / سیستم‌عامل */
export function normalizeMimeType(mime: string): string {
  const value = mime.trim().toLowerCase();
  if (!value) return '';
  if (value === 'image/jpg' || value === 'image/pjpeg') return 'image/jpeg';
  if (value === 'image/x-png') return 'image/png';
  if (value === 'image/x-icon' || value === 'image/vnd.microsoft.icon') return 'image/x-icon';
  return value;
}

export function detectMimeFromBuffer(buffer: Uint8Array): string | null {
  if (startsWith(buffer, JPEG)) return 'image/jpeg';
  if (startsWith(buffer, PNG)) return 'image/png';
  if (startsWith(buffer, GIF87) || startsWith(buffer, GIF89)) return 'image/gif';
  if (
    startsWith(buffer, WEBP_RIFF) &&
    buffer.length >= 12 &&
    startsWith(buffer.subarray(8, 12), WEBP_SIG)
  ) {
    return 'image/webp';
  }
  if (startsWith(buffer, PDF)) return 'application/pdf';
  if (startsWith(buffer, ICO)) return 'image/x-icon';
  if (startsWith(buffer, OLE)) return 'application/msword';
  if (startsWith(buffer, ZIP_LOCAL)) {
    // DOCX/XLSX/PPTX هم ZIP هستند — تشخیص دقیق‌تر در لایه آپلود با پسوند
    return 'application/zip';
  }
  return null;
}

export function extensionForMime(mime: string): string {
  switch (normalizeMimeType(mime)) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'application/pdf':
      return '.pdf';
    case 'text/plain':
      return '.txt';
    case 'application/msword':
      return '.doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '.docx';
    default:
      return '';
  }
}

/**
 * اعتبارسنجی محتوا در برابر MIME اعلام‌شده.
 * خروجی: MIME نهایی ذخیره‌سازی (ترجیح با magic bytes).
 */
export function assertBufferMatchesMime(buffer: Uint8Array, declaredMime: string): string {
  const declared = normalizeMimeType(declaredMime);
  const detected = detectMimeFromBuffer(buffer);

  if (detected === 'application/zip') {
    if (
      declared === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      declared === 'application/zip'
    ) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
  }

  if (detected) {
    if (declared && declared !== detected) {
      // DOC اعلام‌شده ولی OLE تشخیص داده شده
      if (detected === 'application/msword' && declared === 'application/msword') {
        return detected;
      }
      throw new Error('نوع فایل با محتوای واقعی مطابقت ندارد');
    }
    return detected === 'application/zip'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : detected;
  }

  if (declared.startsWith('text/')) return declared;

  // اسناد بدون signature قابل‌اطمینان در این لایه
  if (declared && !declared.startsWith('image/')) return declared;

  throw new Error('نوع فایل قابل تشخیص نیست');
}
