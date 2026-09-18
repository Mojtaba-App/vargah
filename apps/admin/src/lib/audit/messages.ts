import { getActionLabel, getEntityLabel } from '@/lib/audit/labels';

const CHANGE_FIELD_LABELS: Record<string, string> = {
  name: 'نام',
  title: 'عنوان',
  email: 'ایمیل',
  role: 'نقش',
  status: 'وضعیت',
  slug: 'نامک',
  number: 'شماره',
  tags: 'برچسب‌ها',
  permissions: 'دسترسی‌ها',
  field: 'فیلد',
  url: 'آدرس',
  originalName: 'نام فایل',
  section: 'بخش',
  assignedToId: 'مسئول',
  replied: 'پاسخ',
  reopened: 'بازگشایی',
  reason: 'دلیل',
};

const FIELD_VALUE_LABELS: Record<string, string> = {
  password: 'رمز عبور',
  avatar: 'تصویر پروفایل',
  profile: 'اطلاعات پروفایل',
};

function formatChangeValue(key: string, value: unknown): string {
  if (key === 'field' && typeof value === 'string') {
    return FIELD_VALUE_LABELS[value] ?? value;
  }
  if (key === 'tags' && Array.isArray(value)) {
    return value.join('، ');
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return '—';
}

export function formatChangesSummary(entity: string, changes: unknown): string | null {
  if (!changes || typeof changes !== 'object') return null;

  const record = changes as Record<string, unknown>;
  const parts: string[] = [];

  for (const [key, value] of Object.entries(record)) {
    const label = CHANGE_FIELD_LABELS[key] ?? key;
    parts.push(`${label}: ${formatChangeValue(key, value)}`);
  }

  if (parts.length === 0) return null;

  if (entity === 'User' && record.field === 'password') {
    return 'تغییر رمز عبور';
  }
  if (entity === 'User' && record.field === 'avatar') {
    return 'تغییر تصویر پروفایل';
  }
  if (entity === 'User' && record.field === 'profile') {
    return 'به‌روزرسانی پروفایل';
  }
  if (entity === 'RolePermissionConfig' && record.permissions) {
    return 'به‌روزرسانی ماتریس دسترسی‌ها';
  }

  return parts.slice(0, 3).join(' · ');
}

export function formatAuditMessage(input: {
  action: string;
  entity: string;
  changes?: unknown;
}): string {
  const action = getActionLabel(input.action);
  const entity = getEntityLabel(input.entity);
  const detail = formatChangesSummary(input.entity, input.changes);

  if (input.action === 'LOGIN') return 'ورود به پنل مدیریت';
  if (input.action === 'LOGOUT') return 'خروج از پنل مدیریت';

  if (detail) {
    if (input.action === 'CREATE') return `${entity} جدید — ${detail}`;
    if (input.action === 'DELETE') return `حذف ${entity} — ${detail}`;
    if (input.action === 'UPDATE') return `ویرایش ${entity} — ${detail}`;
    if (input.action === 'APPROVE') return `تأیید ${entity} — ${detail}`;
    if (input.action === 'REJECT') return `رد ${entity} — ${detail}`;
    if (input.action === 'PUBLISH') return `انتشار ${entity} — ${detail}`;
    return `${action} ${entity} — ${detail}`;
  }

  if (input.action === 'CREATE') return `ایجاد ${entity}`;
  if (input.action === 'DELETE') return `حذف ${entity}`;
  if (input.action === 'UPDATE') return `ویرایش ${entity}`;
  if (input.action === 'APPROVE') return `تأیید ${entity}`;
  if (input.action === 'REJECT') return `رد ${entity}`;
  if (input.action === 'PUBLISH') return `انتشار ${entity}`;

  return `${action} ${entity}`;
}

export function formatRelativeTime(date: Date | string): string {
  const target = new Date(date).getTime();
  const diffMs = Date.now() - target;
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'همین الان';
  if (minutes < 60) return `${minutes} دقیقه پیش`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعت پیش`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} روز پیش`;

  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date),
  );
}
