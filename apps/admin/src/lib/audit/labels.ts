import type { AuditAction } from '@vargah/database/enums';

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'ایجاد',
  UPDATE: 'ویرایش',
  DELETE: 'حذف',
  LOGIN: 'ورود',
  LOGOUT: 'خروج',
  PUBLISH: 'انتشار',
  APPROVE: 'تأیید',
  REJECT: 'رد',
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Article: 'مقاله',
  ArticleComment: 'نظر مقاله',
  User: 'کاربر',
  Category: 'دسته‌بندی',
  Tag: 'برچسب',
  Issue: 'شماره مجله',
  MediaAsset: 'فایل رسانه',
  SiteSetting: 'تنظیمات سایت',
  Ticket: 'تیکت پشتیبانی',
  Message: 'پیام تماس',
  MessageTemplate: 'قالب پیام',
  WebhookEndpoint: 'وب‌هوک',
  ReminderJob: 'یادآور خودکار',
  ArticleCommission: 'سفارش نویسنده',
  RolePermissionConfig: 'سطح دسترسی',
  Subscriber: 'مشترک',
  Advertiser: 'آگهی‌دهنده',
  AdCampaign: 'کمپین تبلیغاتی',
  Payment: 'پرداخت',
  discount_code: 'کد تخفیف',
  ChatConversation: 'چت آنلاین',
  BulkCampaign: 'ارسال دسته‌ای',
  Contributor: 'همکار',
  ContributorTask: 'وظیفه همکار',
  EditorialCalendar: 'تقویم تحریریه',
};

export function getActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action as AuditAction] ?? action;
}

export function getEntityLabel(entity: string): string {
  return AUDIT_ENTITY_LABELS[entity] ?? entity;
}

export const AUDIT_ACTION_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CREATE: 'default',
  UPDATE: 'secondary',
  DELETE: 'destructive',
  LOGIN: 'outline',
  LOGOUT: 'outline',
  PUBLISH: 'default',
  APPROVE: 'default',
  REJECT: 'destructive',
};
