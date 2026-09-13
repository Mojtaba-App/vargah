import { z } from 'zod';
import { isValidIranProvince, isValidIranProvinceCity } from '@vargah/business/iran-locations';

export const provinceFieldSchema = z.string().max(100).optional().or(z.literal(''));
export const cityFieldSchema = z.string().max(100).optional().or(z.literal(''));

export function refineProvinceCity(
  data: { province?: string; city?: string },
  ctx: z.RefinementCtx,
) {
  const province = (data.province ?? '').trim();
  const city = (data.city ?? '').trim();

  if (city && !province) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['province'],
      message: 'ابتدا استان را انتخاب کنید',
    });
    return;
  }

  if (province && !isValidIranProvince(province)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['province'],
      message: 'استان نامعتبر است',
    });
  }

  if (province && city && !isValidIranProvinceCity(province, city)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['city'],
      message: 'شهر با استان انتخاب‌شده مطابقت ندارد',
    });
  }
}
