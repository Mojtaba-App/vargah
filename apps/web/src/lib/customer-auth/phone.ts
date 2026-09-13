/** Normalize Iranian mobile to 09xxxxxxxxx */
export function normalizeIranPhone(input: string): string {
  const digits = input.replace(/\D/g, '');

  if (digits.startsWith('98') && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith('9') && digits.length === 10) {
    return `0${digits}`;
  }
  if (digits.startsWith('09') && digits.length === 11) {
    return digits;
  }

  throw new Error('شماره موبایل معتبر نیست. نمونه: 09123456789');
}

export function isValidIranPhone(input: string): boolean {
  try {
    normalizeIranPhone(input);
    return true;
  } catch {
    return false;
  }
}

export function maskPhone(phone: string): string {
  const normalized = phone.replace(/\D/g, '');
  if (normalized.length < 7) return phone;
  return `${normalized.slice(0, 4)}***${normalized.slice(-3)}`;
}

export function isPlaceholderCustomerEmail(email: string): boolean {
  return email.endsWith('@phone.vargah.local');
}
