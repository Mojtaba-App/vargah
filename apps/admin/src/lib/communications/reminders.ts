import {
  CommissionStatus,
  NotificationChannel,
  prisma,
  ReminderType,
  SubscriptionStatus,
} from '@vargah/database';
import { daysUntil, shouldSendExpiryReminder } from '@vargah/business/subscription';

import { dispatchFromTemplate, dispatchNotification, fireWebhooks } from './dispatcher';
import { DEFAULT_TEMPLATE_KEYS } from './templates';

async function alreadySent(type: ReminderType, entityType: string, entityId: string) {
  const log = await prisma.reminderLog.findUnique({
    where: { type_entityType_entityId: { type, entityType, entityId } },
  });
  return Boolean(log);
}

async function markSent(type: ReminderType, entityType: string, entityId: string) {
  await prisma.reminderLog.upsert({
    where: { type_entityType_entityId: { type, entityType, entityId } },
    create: { type, entityType, entityId },
    update: { sentAt: new Date() },
  });
}

export async function processSubscriptionReminders() {
  const subscribers = await prisma.subscriber.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      expiresAt: { not: null },
    },
  });

  let sent = 0;

  for (const sub of subscribers) {
    if (!sub.expiresAt) continue;
    const days = daysUntil(sub.expiresAt);
    const recipient = sub.email ?? sub.phone;
    if (!recipient) continue;

    const vars = {
      name: sub.name,
      days,
      expiryDate: sub.expiresAt.toLocaleDateString('fa-IR'),
      planType: sub.planType ?? 'اشتراک',
    };

    if (shouldSendExpiryReminder(days, 7) && !(await alreadySent(ReminderType.SUBSCRIPTION_EXPIRY_7D, 'Subscriber', sub.id))) {
      try {
        if (sub.email) {
          await dispatchFromTemplate(DEFAULT_TEMPLATE_KEYS.SUBSCRIPTION_EXPIRY_7D, sub.email, vars, {
            entity: 'Subscriber',
            entityId: sub.id,
          });
        }
        if (sub.phone) {
          await dispatchNotification({
            channel: NotificationChannel.SMS,
            recipient: sub.phone,
            body: `{{name}} عزیز، ۷ روز تا پایان اشتراک {{planType}} باقی مانده.`.replace(
              '{{name}}',
              sub.name,
            ).replace('{{planType}}', sub.planType ?? 'اشتراک'),
            relatedEntity: 'Subscriber',
            relatedEntityId: sub.id,
          });
        }
        await markSent(ReminderType.SUBSCRIPTION_EXPIRY_7D, 'Subscriber', sub.id);
        sent++;
      } catch (e) {
        console.error('Subscription 7d reminder failed', sub.id, e);
      }
    }

    if (shouldSendExpiryReminder(days, 1) && !(await alreadySent(ReminderType.SUBSCRIPTION_EXPIRY_1D, 'Subscriber', sub.id))) {
      try {
        if (sub.email) {
          await dispatchFromTemplate(DEFAULT_TEMPLATE_KEYS.SUBSCRIPTION_EXPIRY_1D, sub.email, vars, {
            entity: 'Subscriber',
            entityId: sub.id,
          });
        }
        if (sub.phone) {
          await dispatchNotification({
            channel: NotificationChannel.SMS,
            recipient: sub.phone,
            body: `${sub.name} عزیز، فردا اشتراک شما منقضی می‌شود.`,
            relatedEntity: 'Subscriber',
            relatedEntityId: sub.id,
          });
        }
        await markSent(ReminderType.SUBSCRIPTION_EXPIRY_1D, 'Subscriber', sub.id);
        sent++;
      } catch (e) {
        console.error('Subscription 1d reminder failed', sub.id, e);
      }
    }
  }

  return { sent };
}

export async function processCommissionDeadlineReminders() {
  const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const commissions = await prisma.articleCommission.findMany({
    where: {
      status: { in: [CommissionStatus.ASSIGNED, CommissionStatus.IN_WRITING, CommissionStatus.SUBMITTED] },
      dueDate: { lte: soon, gte: new Date() },
      deadlineNotifiedAt: null,
    },
    include: {
      assignee: { select: { email: true, name: true } },
      createdBy: { select: { email: true, name: true } },
    },
  });

  let sent = 0;

  for (const commission of commissions) {
    if (!commission.dueDate) continue;

    const days = daysUntil(commission.dueDate);
    const vars = {
      title: commission.title,
      days,
      dueDate: commission.dueDate.toLocaleDateString('fa-IR'),
      assigneeName: commission.assignee?.name ?? 'نویسنده',
    };

    if (commission.assignee?.email) {
      await dispatchFromTemplate(
        DEFAULT_TEMPLATE_KEYS.COMMISSION_DEADLINE,
        commission.assignee.email,
        vars,
        { entity: 'ArticleCommission', entityId: commission.id },
      );
    }

    await fireWebhooks('commission.deadline', {
      title: 'نزدیک شدن مهلت سفارش مطلب',
      message: `«${commission.title}» — ${days} روز تا مهلت`,
      metadata: { commissionId: commission.id, days },
    });

    await prisma.articleCommission.update({
      where: { id: commission.id },
      data: { deadlineNotifiedAt: new Date() },
    });

    if (!(await alreadySent(ReminderType.COMMISSION_DEADLINE, 'ArticleCommission', commission.id))) {
      await markSent(ReminderType.COMMISSION_DEADLINE, 'ArticleCommission', commission.id);
    }

    sent++;
  }

  return { sent };
}

export async function runAllReminders() {
  const subscription = await processSubscriptionReminders();
  const commission = await processCommissionDeadlineReminders();
  return {
    subscriptionReminders: subscription.sent,
    commissionReminders: commission.sent,
  };
}
