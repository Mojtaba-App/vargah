'use server';

import { revalidatePath } from 'next/cache';
import { prisma, AuditAction, AdCampaignStatus, PaymentStatus, PaymentType } from '@vargah/database';

import { recordAuditLog } from '@/lib/audit/record';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { advertiserFormSchema, campaignFormSchema } from '@/lib/schemas/advertiser-form';
import { verifyCsrfFromRequest } from '@/lib/security/request';
import { subscriberCityUpdate } from '@vargah/business/subscriber-location';

function parseAdvertiserForm(formData: FormData) {
  return advertiserFormSchema.parse({
    companyName: formData.get('companyName'),
    contactName: formData.get('contactName'),
    email: formData.get('email'),
    phone: formData.get('phone') || '',
    province: formData.get('province') || '',
    city: formData.get('city') || '',
    address: formData.get('address') || '',
    notes: formData.get('notes') || '',
  });
}

function parseCampaignForm(formData: FormData) {
  return campaignFormSchema.parse({
    advertiserId: formData.get('advertiserId'),
    title: formData.get('title'),
    type: formData.get('type'),
    tariff: formData.get('tariff') || '0',
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    status: formData.get('status') || AdCampaignStatus.DRAFT,
    notes: formData.get('notes') || '',
  });
}

export async function createAdvertiser(formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ADVERTISER_MANAGE);
  const parsed = parseAdvertiserForm(formData);
  const location = subscriberCityUpdate(parsed.province, parsed.city);

  const advertiser = await prisma.advertiser.create({
    data: {
      companyName: parsed.companyName,
      contactName: parsed.contactName,
      email: parsed.email,
      phone: parsed.phone || null,
      province: location.province,
      city: location.city,
      cityId: location.cityId,
      address: parsed.address || null,
      notes: parsed.notes || null,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'Advertiser',
    entityId: advertiser.id,
    changes: { companyName: parsed.companyName, email: parsed.email },
  });

  revalidatePath('/crm/advertisers');
}

export async function updateAdvertiser(id: string, formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ADVERTISER_MANAGE);
  const parsed = parseAdvertiserForm(formData);
  const location = subscriberCityUpdate(parsed.province, parsed.city);

  const existing = await prisma.advertiser.findUnique({ where: { id } });
  if (!existing) throw new Error('آگهی‌دهنده یافت نشد');

  await prisma.advertiser.update({
    where: { id },
    data: {
      companyName: parsed.companyName,
      contactName: parsed.contactName,
      email: parsed.email,
      phone: parsed.phone || null,
      province: location.province,
      city: location.city,
      cityId: location.cityId,
      address: parsed.address || null,
      notes: parsed.notes || null,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Advertiser',
    entityId: id,
    changes: { companyName: parsed.companyName },
  });

  revalidatePath('/crm/advertisers');
}

export async function deleteAdvertiser(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ADVERTISER_MANAGE);

  const advertiser = await prisma.advertiser.findUnique({
    where: { id },
    include: { _count: { select: { payments: true, tickets: true } } },
  });
  if (!advertiser) throw new Error('آگهی‌دهنده یافت نشد');

  if (advertiser._count.payments > 0) {
    throw new Error('آگهی‌دهنده دارای پرداخت ثبت‌شده است و قابل حذف نیست');
  }

  await prisma.advertiser.delete({ where: { id } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'Advertiser',
    entityId: id,
    changes: { companyName: advertiser.companyName },
  });

  revalidatePath('/crm/advertisers');
}

export async function createCampaign(formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ADVERTISER_MANAGE);
  const parsed = parseCampaignForm(formData);

  const advertiser = await prisma.advertiser.findUnique({ where: { id: parsed.advertiserId } });
  if (!advertiser) throw new Error('شرکت یافت نشد');

  const campaign = await prisma.adCampaign.create({
    data: {
      advertiserId: parsed.advertiserId,
      title: parsed.title,
      type: parsed.type,
      tariff: parsed.tariff,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      status: parsed.status,
      notes: parsed.notes || null,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'AdCampaign',
    entityId: campaign.id,
    changes: { title: parsed.title, tariff: parsed.tariff, status: parsed.status },
  });

  revalidatePath('/crm/advertisers');
}

export async function updateCampaign(id: string, formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ADVERTISER_MANAGE);
  const parsed = parseCampaignForm(formData);

  const existing = await prisma.adCampaign.findUnique({ where: { id } });
  if (!existing) throw new Error('کمپین یافت نشد');

  await prisma.adCampaign.update({
    where: { id },
    data: {
      advertiserId: parsed.advertiserId,
      title: parsed.title,
      type: parsed.type,
      tariff: parsed.tariff,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      status: parsed.status,
      notes: parsed.notes || null,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'AdCampaign',
    entityId: id,
    changes: { title: parsed.title, status: parsed.status, tariff: parsed.tariff },
  });

  revalidatePath('/crm/advertisers');
}

export async function deleteCampaign(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ADVERTISER_MANAGE);

  const campaign = await prisma.adCampaign.findUnique({
    where: { id },
    include: { _count: { select: { payments: true } } },
  });
  if (!campaign) throw new Error('کمپین یافت نشد');

  if (campaign._count.payments > 0) {
    throw new Error('کمپین دارای پرداخت است و قابل حذف نیست');
  }

  await prisma.adCampaign.delete({ where: { id } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'AdCampaign',
    entityId: id,
    changes: { title: campaign.title },
  });

  revalidatePath('/crm/advertisers');
}

export async function updateCampaignStatus(id: string, status: AdCampaignStatus) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ADVERTISER_MANAGE);

  const campaign = await prisma.adCampaign.findUnique({ where: { id } });
  if (!campaign) throw new Error('کمپین یافت نشد');

  await prisma.adCampaign.update({ where: { id }, data: { status } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'AdCampaign',
    entityId: id,
    changes: { status },
  });

  revalidatePath('/crm/advertisers');
}

export async function recordCampaignPayment(campaignId: string, amount: number) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ADVERTISER_MANAGE);

  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: { advertiser: true },
  });
  if (!campaign) throw new Error('کمپین یافت نشد');
  if (amount <= 0) throw new Error('مبلغ نامعتبر است');

  await prisma.payment.create({
    data: {
      amount,
      type: PaymentType.ADVERTISEMENT,
      status: PaymentStatus.PAID,
      advertiserId: campaign.advertiserId,
      campaignId: campaign.id,
      description: `پرداخت کمپین «${campaign.title}»`,
      paidAt: new Date(),
      gateway: 'manual',
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'Payment',
    entityId: campaignId,
    changes: { amount, campaign: campaign.title },
  });

  revalidatePath('/crm/advertisers');
  revalidatePath('/finance');
}
