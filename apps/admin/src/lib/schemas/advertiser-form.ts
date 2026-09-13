import { z } from 'zod';
import { AdCampaignStatus } from '@vargah/database/enums';

import { cityFieldSchema, provinceFieldSchema, refineProvinceCity } from '@/lib/schemas/location-fields';

export const advertiserFormSchema = z
  .object({
    companyName: z.string().trim().min(2, 'نام شرکت حداقل ۲ کاراکتر').max(150),
    contactName: z.string().trim().min(2, 'نام مسئول حداقل ۲ کاراکتر').max(100),
    email: z.string().trim().email('ایمیل نامعتبر است').max(200),
    phone: z.string().max(20).optional().or(z.literal('')),
    province: provinceFieldSchema,
    city: cityFieldSchema,
    address: z.string().max(500).optional().or(z.literal('')),
    notes: z.string().max(2000).optional().or(z.literal('')),
  })
  .superRefine(refineProvinceCity);

export const campaignFormSchema = z
  .object({
    advertiserId: z.string().cuid('شرکت را انتخاب کنید'),
    title: z.string().trim().min(2, 'عنوان حداقل ۲ کاراکتر').max(200),
    type: z.string().trim().min(1, 'نوع کمپین الزامی است').max(50),
    tariff: z.coerce.number().int('تعرفه باید عدد صحیح باشد').min(0, 'تعرفه نمی‌تواند منفی باشد'),
    startDate: z.string().min(1, 'تاریخ شروع الزامی است'),
    endDate: z.string().min(1, 'تاریخ پایان الزامی است'),
    status: z.nativeEnum(AdCampaignStatus),
    notes: z.string().max(2000).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return !Number.isNaN(start) && !Number.isNaN(end) && end >= start;
    },
    { message: 'تاریخ پایان باید بعد از تاریخ شروع باشد', path: ['endDate'] },
  );

export type AdvertiserFormValues = z.infer<typeof advertiserFormSchema>;
export type CampaignFormValues = z.infer<typeof campaignFormSchema>;
