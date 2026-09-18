import { z } from 'zod';

/** پیام‌های داخلی که هرگز نباید به کاربر برسند */
const INTERNAL_ERROR_RE =
  /^[A-Z][A-Z0-9_]+$|zod|prisma|failed|invalid|error|exception|stack|csrf|token|sql|database|econn|timeout|enoent|unauthorized|forbidden/i;

export function isPublicPersianMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (INTERNAL_ERROR_RE.test(trimmed)) return false;
  return true;
}

export function toPublicUserError(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    const message = error.issues[0]?.message?.trim();
    if (message && isPublicPersianMessage(message)) return message;
    return fallback;
  }
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message === 'CSRF_VALIDATION_FAILED') {
      return 'نشست امنیتی منقضی شده است. صفحه را تازه کنید و دوباره تلاش کنید.';
    }
    if (isPublicPersianMessage(message)) return message;
  }
  return fallback;
}

export function zodFieldErrors<T extends string>(
  error: z.ZodError,
  allowed: readonly T[],
): Partial<Record<T, string>> {
  const allowedSet = new Set<string>(allowed);
  const fields: Partial<Record<T, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && allowedSet.has(key) && !fields[key as T]) {
      fields[key as T] = issue.message;
    }
  }
  return fields;
}

export type FormActionFailure<T extends string = string> = {
  ok: false;
  message: string;
  fields?: Partial<Record<T, string>>;
};

export type FormActionSuccess<T extends object = object> = {
  ok: true;
} & T;

export type FormActionResult<F extends string = string, S extends object = object> =
  FormActionSuccess<S> | FormActionFailure<F>;
