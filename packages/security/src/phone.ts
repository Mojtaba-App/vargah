/** Normalize Iranian mobile to 09xxxxxxxxx */
export function normalizeIranPhone(input: string): string {
  const ascii = input
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  const digits = ascii.replace(/\D/g, '');

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

/** Admin panel uses SMS OTP at login when a mobile number is registered. */
export function hasAdminSmsVerification(phone: string | null | undefined): boolean {
  return Boolean(phone?.trim());
}

export function isEmailIdentifier(input: string): boolean {
  return input.trim().includes('@');
}

export function normalizeAdminLoginIdentifier(
  input: string,
): { kind: 'email'; value: string } | { kind: 'username'; value: string } {
  const trimmed = input.trim();
  if (isEmailIdentifier(trimmed)) {
    return { kind: 'email', value: trimmed.toLowerCase() };
  }
  return { kind: 'username', value: normalizeUsername(trimmed) };
}

export function normalizeUsername(input: string): string {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, '');
  if (!/^[a-z0-9._-]{3,32}$/.test(normalized)) {
    throw new Error('نام کاربری نامعتبر است');
  }
  return normalized;
}

export function isValidUsername(input: string): boolean {
  try {
    normalizeUsername(input);
    return true;
  } catch {
    return false;
  }
}

/** @deprecated Admin login uses email/username — not phone */
export function normalizeLoginIdentifier(
  input: string,
): { kind: 'email'; value: string } | { kind: 'phone'; value: string } {
  const trimmed = input.trim();
  if (isEmailIdentifier(trimmed)) {
    return { kind: 'email', value: trimmed.toLowerCase() };
  }
  return { kind: 'phone', value: normalizeIranPhone(trimmed) };
}
