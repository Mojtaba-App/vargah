import { z } from 'zod';
import { evaluatePasswordStrength } from '../password-strength';

const adminRoleSchema = z.enum([
  'SUPER_ADMIN',
  'PUBLISHER',
  'MANAGING_DIRECTOR',
  'EDITOR_IN_CHIEF',
  'COPY_EDITOR',
  'WRITER',
  'AD_MANAGER',
]);

const userStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);

const optionalEmailSchema = z
  .union([z.string().trim().email('ایمیل نامعتبر است').max(255), z.literal(''), z.null()])
  .transform((value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.toLowerCase() : null;
  });

const usernameFormSchema = z
  .union([z.string().trim().max(32), z.literal(''), z.null()])
  .transform((value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim().toLowerCase();
    return trimmed.length > 0 ? trimmed : null;
  })
  .refine((value) => value === null || /^[a-z0-9._-]{3,32}$/.test(value), {
    message: 'نام کاربری ۳–۳۲ کاراکتر؛ فقط حروف انگلیسی، عدد، . _ -',
  });

const phoneFormSchema = z
  .string()
  .max(20, 'شماره موبایل حداکثر ۲۰ رقم')
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || /^(\+98|0)?9\d{9}$/.test(v.replace(/[\s-]/g, '')), {
    message: 'فرمت موبایل معتبر نیست (مثال: 09121234567)',
  });

const requiredPhoneFormSchema = z
  .string()
  .trim()
  .min(1, 'شماره موبایل الزامی است')
  .max(20, 'شماره موبایل حداکثر ۲۰ رقم')
  .refine((v) => /^(\+98|0)?9\d{9}$/.test(v.replace(/[\s-]/g, '')), {
    message: 'فرمت موبایل معتبر نیست (مثال: 09121234567)',
  });

function requireEmailOrUsername(
  data: { email: string | null; username: string | null },
  ctx: z.RefinementCtx,
) {
  if (!data.email && !data.username) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'حداقل یکی از ایمیل یا نام کاربری برای ورود الزامی است',
      path: ['username'],
    });
  }
}

export const adminUserCreateFormSchema = z
  .object({
    name: z.string().trim().min(2, 'نام حداقل ۲ کاراکتر').max(100, 'نام حداکثر ۱۰۰ کاراکتر'),
    email: optionalEmailSchema,
    username: usernameFormSchema,
    phone: requiredPhoneFormSchema,
    role: adminRoleSchema,
    status: userStatusSchema,
    password: z.string().min(8, 'رمز عبور حداقل ۸ کاراکتر').max(128),
    passwordConfirm: z.string().min(8, 'تأیید رمز الزامی است').max(128),
  })
  .superRefine((data, ctx) => {
    requireEmailOrUsername(data, ctx);

    const strength = evaluatePasswordStrength(data.password, {
      email: data.email ?? data.username ?? undefined,
    });
    if (!strength.isAcceptable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'رمز عبور باید شامل حروف بزرگ، کوچک و عدد باشد',
        path: ['password'],
      });
    }
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'تأیید رمز عبور مطابقت ندارد',
        path: ['passwordConfirm'],
      });
    }
  });

export const adminUserCreateSchema = adminUserCreateFormSchema.transform((data) => ({
  ...data,
  phone: data.phone.trim(),
}));

export const adminUserUpdateSchema = z
  .object({
    name: z.string().trim().min(2, 'نام حداقل ۲ کاراکتر').max(100, 'نام حداکثر ۱۰۰ کاراکتر'),
    email: optionalEmailSchema,
    username: usernameFormSchema,
    phone: phoneFormSchema,
    role: adminRoleSchema,
    status: userStatusSchema,
  })
  .superRefine((data, ctx) => {
    requireEmailOrUsername(data, ctx);
  })
  .transform((data) => ({
    ...data,
    phone: data.phone?.trim() ? data.phone.trim() : null,
  }));

export const adminUserPasswordSchema = z
  .object({
    password: z.string().min(8).max(128),
    passwordConfirm: z.string().min(8).max(128),
  })
  .superRefine((data, ctx) => {
    const strength = evaluatePasswordStrength(data.password);
    if (!strength.isAcceptable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'رمز عبور انتخاب‌شده به اندازه کافی قوی نیست',
        path: ['password'],
      });
    }
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'تأیید رمز عبور مطابقت ندارد',
        path: ['passwordConfirm'],
      });
    }
  });

export const rolePermissionsUpdateSchema = z.object({
  role: adminRoleSchema,
  permissions: z.array(z.string().min(3).max(64)),
});

export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
