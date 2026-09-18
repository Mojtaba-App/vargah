export const CAPTCHA_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CAPTCHA_LENGTH = 5;

export function normalizeCaptchaAnswer(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function isCaptchaAnswerShape(value: string): boolean {
  return new RegExp(`^[${CAPTCHA_ALPHABET}]{${CAPTCHA_LENGTH}}$`).test(
    normalizeCaptchaAnswer(value),
  );
}
