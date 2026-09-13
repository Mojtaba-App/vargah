import { NotificationChannel } from '@prisma/client';

import type { SeedContext } from './types';

export async function seedTemplates({ prisma }: SeedContext) {
  const templates = [
    {
      key: 'subscription_expiry_7d',
      name: 'یادآور ۷ روز مانده اشتراک',
      channel: NotificationChannel.EMAIL,
      subject: 'اشتراک {{name}} — {{days}} روز مانده',
      body: '{{name}} عزیز، {{days}} روز تا پایان اشتراک {{planType}} باقی مانده ({{expiryDate}}).',
    },
    {
      key: 'subscription_expiry_1d',
      name: 'یادآور ۱ روز مانده اشتراک',
      channel: NotificationChannel.EMAIL,
      subject: 'فردا اشتراک منقضی می‌شود',
      body: '{{name}} عزیز، فردا ({{expiryDate}}) اشتراک شما منقضی می‌شود.',
    },
    {
      key: 'commission_deadline',
      name: 'یادآور Deadline سفارش مطلب',
      channel: NotificationChannel.EMAIL,
      subject: 'مهلت تحویل: {{title}}',
      body: '{{assigneeName}}، {{days}} روز تا مهلت تحویل «{{title}}» ({{dueDate}}) باقی مانده.',
    },
    {
      key: 'ticket_reply',
      name: 'پاسخ تیکت',
      channel: NotificationChannel.EMAIL,
      subject: 'پاسخ: {{subject}}',
      body: '{{name}} عزیز،\n\n{{body}}\n\nبا تشکر، تیم وارگه',
    },
    {
      key: 'message_reply',
      name: 'پاسخ صندوق پیام',
      channel: NotificationChannel.EMAIL,
      subject: 'پاسخ: {{subject}}',
      body: '{{name}} عزیز،\n\n{{body}}\n\nبا تشکر، تیم وارگه',
    },
    {
      key: 'ticket_resolved',
      name: 'بستن تیکت',
      channel: NotificationChannel.EMAIL,
      subject: 'درخواست شما حل شد: {{subject}}',
      body: '{{name}} عزیز، درخواست «{{subject}}» حل شد. از ۰ تا ۱۰ چقدر راضی بودید؟',
    },
  ];

  for (const t of templates) {
    await prisma.messageTemplate.upsert({
      where: { key: t.key },
      update: { name: t.name, channel: t.channel, subject: t.subject, body: t.body },
      create: t,
    });
  }

  const smsTemplates = [
    {
      key: 'otp_verification',
      name: 'کد تأیید (OTP)',
      channel: NotificationChannel.SMS,
      body: 'کد تأیید وارگه: {{code}}\nاعتبار: {{minutes}} دقیقه',
      variables: ['code', 'minutes'],
    },
    {
      key: 'subscription_expiry_7d_sms',
      name: 'یادآور ۷ روز اشتراک (پیامک)',
      channel: NotificationChannel.SMS,
      body: '{{name}} عزیز، {{days}} روز تا پایان اشتراک «{{plan}}» باقی مانده. تمدید: {{link}}',
      variables: ['name', 'days', 'plan', 'link'],
    },
    {
      key: 'ticket_reply_sms',
      name: 'پاسخ تیکت (پیامک)',
      channel: NotificationChannel.SMS,
      body: '{{name}} عزیز، پاسخ جدید برای «{{subject}}» ثبت شد. {{link}}',
      variables: ['name', 'subject', 'link'],
    },
  ];

  for (const t of smsTemplates) {
    await prisma.messageTemplate.upsert({
      where: { key: t.key },
      update: {
        name: t.name,
        channel: t.channel,
        body: t.body,
        variables: t.variables,
      },
      create: t,
    });
  }

  console.log('   ✉️  templates — الگوهای ایمیل و پیامک');
}
