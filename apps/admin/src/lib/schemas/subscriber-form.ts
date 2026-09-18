import { z } from 'zod';
import { SubscriptionStatus } from '@vargah/database/enums';

import {
  cityFieldSchema,
  provinceFieldSchema,
  refineProvinceCity,
} from '@/lib/schemas/location-fields';

export const subscriberFormSchema = z
  .object({
    name: z.string().trim().min(2, 'نام حداقل ۲ کاراکتر').max(100),
    email: z.string().trim().email('ایمیل نامعتبر است').max(200),
    phone: z
      .string()
      .max(20)
      .optional()
      .or(z.literal(''))
      .transform((v) => (v?.trim() ? v.trim() : undefined)),
    province: provinceFieldSchema,
    city: cityFieldSchema,
    address: z.string().max(500).optional().or(z.literal('')),
    status: z.nativeEnum(SubscriptionStatus),
    planType: z.string().max(50).optional().or(z.literal('')),
    expiresAt: z.string().optional().or(z.literal('')),
  })
  .superRefine(refineProvinceCity);

export type SubscriberFormValues = z.infer<typeof subscriberFormSchema>;
