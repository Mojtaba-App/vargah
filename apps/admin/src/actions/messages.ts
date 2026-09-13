'use server';

import { revalidatePath } from 'next/cache';
import {
  AuditAction,
  MessageStatus as PrismaMessageStatus,
  prisma,
  TicketCustomerType,
  TicketPriority,
  TicketStatus,
} from '@vargah/database';

import { recordAuditLog } from '@/lib/audit/record';
import { requirePermission } from '@/lib/auth-utils';
import { dispatchFromTemplate } from '@/lib/communications/dispatcher';
import { DEFAULT_TEMPLATE_KEYS } from '@/lib/communications/templates';
import {
  assertMessageStatusTransition,
  MessageStatus,
  type MessageStatus as MessageStatusType,
} from '@/lib/messages/constants';
import { PERMISSIONS } from '@/lib/permissions';
import { sanitizePlainText } from '@vargah/security/sanitize';
import { verifyCsrfFromRequest } from '@/lib/security/request';

function revalidateMessages() {
  revalidatePath('/messages');
  revalidatePath('/');
}

export async function updateMessageStatus(id: string, status: MessageStatusType) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.MESSAGE_MANAGE);

  const current = await prisma.message.findUniqueOrThrow({
    where: { id },
    select: { status: true },
  });

  assertMessageStatusTransition(current.status as MessageStatusType, status);

  if (status === MessageStatus.REPLIED) {
    throw new Error('برای علامت «پاسخ‌داده» باید از فرم ارسال پاسخ استفاده کنید.');
  }

  await prisma.message.update({
    where: { id },
    data: { status: status as PrismaMessageStatus },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Message',
    entityId: id,
    changes: { status, from: current.status },
  });

  revalidateMessages();
  return { ok: true as const };
}

export async function assignMessage(id: string, assignedToId: string | null) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.MESSAGE_MANAGE);

  await prisma.message.update({
    where: { id },
    data: { assignedToId: assignedToId || null },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Message',
    entityId: id,
    changes: { assignedToId },
  });

  revalidateMessages();
  return { ok: true as const };
}

export async function markMessageRead(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.MESSAGE_MANAGE);

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message || message.status !== PrismaMessageStatus.NEW) {
    return { ok: true as const, changed: false };
  }

  await prisma.message.update({
    where: { id },
    data: { status: PrismaMessageStatus.READ },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Message',
    entityId: id,
    changes: { status: MessageStatus.READ },
  });

  revalidateMessages();
  return { ok: true as const, changed: true };
}

export async function replyToMessage(
  id: string,
  body: string,
  options?: { isInternal?: boolean },
) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.MESSAGE_MANAGE);

  const sanitizedBody = sanitizePlainText(body);
  if (sanitizedBody.trim().length < 3) {
    throw new Error('متن پاسخ حداقل ۳ کاراکتر باشد.');
  }
  if (sanitizedBody.length > 8000) {
    throw new Error('متن پاسخ طولانی است.');
  }

  const isInternal = Boolean(options?.isInternal);
  const message = await prisma.message.findUniqueOrThrow({ where: { id } });

  if (message.status === PrismaMessageStatus.ARCHIVED) {
    throw new Error('پیام آرشیو شده است. ابتدا از آرشیو خارج کنید.');
  }

  let emailSent = false;
  let emailWarning: string | null = null;

  if (!isInternal) {
    if (!message.senderEmail) {
      emailWarning = 'ایمیلی برای فرستنده ثبت نشده؛ پاسخ فقط در پنل ذخیره شد.';
    } else {
      try {
        await dispatchFromTemplate(
          DEFAULT_TEMPLATE_KEYS.MESSAGE_REPLY,
          message.senderEmail,
          {
            name: message.senderName,
            subject: message.subject ?? 'پیام شما',
            body: sanitizedBody,
          },
          { entity: 'Message', entityId: id },
        );
        emailSent = true;
      } catch {
        emailWarning =
          'پاسخ ذخیره شد، اما ارسال ایمیل ناموفق بود. تنظیمات SMTP را بررسی کنید.';
      }
    }
  }

  await prisma.messageReply.create({
    data: {
      messageId: id,
      authorId: session.user.id,
      body: sanitizedBody,
      isInternal,
      emailSent,
    },
  });

  if (!isInternal) {
    await prisma.message.update({
      where: { id },
      data: { status: PrismaMessageStatus.REPLIED },
    });
  } else if (message.status === PrismaMessageStatus.NEW) {
    await prisma.message.update({
      where: { id },
      data: { status: PrismaMessageStatus.READ },
    });
  }

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Message',
    entityId: id,
    changes: {
      reply: isInternal ? 'internal' : 'customer',
      emailSent,
      status: isInternal ? undefined : MessageStatus.REPLIED,
    },
  });

  revalidateMessages();
  return {
    ok: true as const,
    emailSent,
    warning: emailWarning,
  };
}

export async function convertMessageToTicket(messageId: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.MESSAGE_MANAGE);

  const message = await prisma.message.findUniqueOrThrow({
    where: { id: messageId },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
        select: { body: true, isInternal: true, createdAt: true, author: { select: { name: true } } },
      },
    },
  });

  if (message.status === PrismaMessageStatus.ARCHIVED) {
    throw new Error('پیام آرشیو شده را نمی‌توان به تیکت تبدیل کرد.');
  }

  const customerType =
    message.type === 'ADVERTISEMENT'
      ? TicketCustomerType.ADVERTISER
      : TicketCustomerType.GUEST;

  const replyTranscript = message.replies
    .map((reply) => {
      const who = reply.author?.name ?? 'کارشناس';
      const kind = reply.isInternal ? 'یادداشت داخلی' : 'پاسخ';
      return `[${kind} — ${who}]\n${reply.body}`;
    })
    .join('\n\n');

  const ticketBody = [sanitizePlainText(message.body), replyTranscript]
    .filter(Boolean)
    .join('\n\n---\n\n');

  const ticket = await prisma.ticket.create({
    data: {
      subject: sanitizePlainText(message.subject ?? `پیام ${message.senderName}`),
      body: ticketBody,
      customerType,
      customerName: sanitizePlainText(message.senderName),
      customerEmail: message.senderEmail,
      customerPhone: message.senderPhone,
      status: TicketStatus.OPEN,
      priority: TicketPriority.NORMAL,
      assignedToId: message.assignedToId,
    },
  });

  await prisma.message.update({
    where: { id: messageId },
    data: { status: PrismaMessageStatus.REPLIED },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'Ticket',
    entityId: ticket.id,
    changes: { fromMessageId: messageId },
  });

  revalidateMessages();
  revalidatePath('/crm/tickets');
  revalidatePath(`/crm/tickets/${ticket.id}`);

  return ticket.id;
}

export async function archiveMessage(id: string) {
  return updateMessageStatus(id, MessageStatus.ARCHIVED);
}

export async function unarchiveMessage(id: string) {
  return updateMessageStatus(id, MessageStatus.READ);
}
