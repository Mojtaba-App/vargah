export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export type PasswordRule = {
  id: string;
  label: string;
  passed: boolean;
};

export type PasswordStrengthResult = {
  score: number;
  level: PasswordStrengthLevel;
  label: string;
  color: string;
  rules: PasswordRule[];
  isAcceptable: boolean;
};

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  '12345678',
  '123456789',
  'admin123',
  'admin1234',
  'qwerty123',
  'letmein',
  'welcome1',
]);

function levelFromScore(score: number): PasswordStrengthLevel {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'weak';
}

function labelFromLevel(level: PasswordStrengthLevel): string {
  switch (level) {
    case 'strong':
      return 'قوی';
    case 'good':
      return 'خوب';
    case 'fair':
      return 'متوسط';
    default:
      return 'ضعیف';
  }
}

function colorFromScore(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#dc2626';
}

/** ارزیابی قدرت رمز عبور برای UI و اعتبارسنجی سمت سرور */
export function evaluatePasswordStrength(
  password: string,
  context?: { email?: string | null },
): PasswordStrengthResult {
  const rules: PasswordRule[] = [
    {
      id: 'length8',
      label: 'حداقل ۸ کاراکتر',
      passed: password.length >= 8,
    },
    {
      id: 'length12',
      label: '۱۲ کاراکتر یا بیشتر (توصیه‌شده)',
      passed: password.length >= 12,
    },
    {
      id: 'lower',
      label: 'حداقل یک حرف کوچک',
      passed: /[a-z]/.test(password),
    },
    {
      id: 'upper',
      label: 'حداقل یک حرف بزرگ',
      passed: /[A-Z]/.test(password),
    },
    {
      id: 'digit',
      label: 'حداقل یک عدد',
      passed: /\d/.test(password),
    },
    {
      id: 'special',
      label: 'حداقل یک کاراکتر خاص (!@#$%...)',
      passed: /[^A-Za-z0-9]/.test(password),
    },
    {
      id: 'notCommon',
      label: 'غیر از رمزهای رایج',
      passed: password.length > 0 && !COMMON_PASSWORDS.has(password.toLowerCase()),
    },
    {
      id: 'notEmail',
      label: 'مختلف از بخش ایمیل',
      passed:
        !context?.email ||
        password.length === 0 ||
        !context.email.toLowerCase().includes(password.toLowerCase()),
    },
  ];

  let score = 0;
  if (rules[0].passed) score += 15;
  if (rules[1].passed) score += 15;
  if (rules[2].passed) score += 12;
  if (rules[3].passed) score += 12;
  if (rules[4].passed) score += 12;
  if (rules[5].passed) score += 14;
  if (rules[6].passed) score += 10;
  if (rules[7].passed) score += 10;

  const level = levelFromScore(score);
  const isAcceptable =
    rules[0].passed && rules[2].passed && rules[3].passed && rules[4].passed && rules[6].passed;

  return {
    score: Math.min(100, score),
    level,
    label: labelFromLevel(level),
    color: colorFromScore(score),
    rules,
    isAcceptable,
  };
}

export function generateSecurePassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*';
  const all = upper + lower + digits + special;

  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)]!;
  const required = [pick(upper), pick(lower), pick(digits), pick(special)];
  const rest = Array.from({ length: Math.max(8, length) - required.length }, () => pick(all));

  const combined = [...required, ...rest];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j]!, combined[i]!];
  }
  return combined.join('');
}
