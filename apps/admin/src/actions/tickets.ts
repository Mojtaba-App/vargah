'use server';

import { recordAuditLog } from '@/lib/audit/record';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  AuditAction,
  prisma,
  TicketCustomerType,
  TicketPriority,
  TicketStatus,
} from '@vargah/database';
import { satisfactionSurveySchema, ticketSchema } from '@vargah/security/schemas';
import { sanitizePlainText } from '@vargah/security/sanitize';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { dispatchFromTemplate, fireWebhooks } from '@/lib/communications/dispatcher';
import { DEFAULT_TEMPLATE_KEYS } from '@/lib/communications/templates';
import { verifyCsrfFromRequest } from '@/lib/security/request';

const updateStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(TicketStatus),
});
const assignSchema = z.object({
  id: z.string().cuid(),
  assignedToId: z.string().cuid(),
});
const replySchema = z.object({
  id: z.string().cuid(),
  body: z.string().min(1).max(10000),
  isInternal: z.boolean().optional(),
});

export async function createTicket(data: {
  subject: string;
  body: string;
  customerType: TicketCustomerType;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  subscriberId?: string;
  advertiserId?: string;
  priority?: TicketPriority;
}) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.TICKET_MANAGE);

  const parsed = ticketSchema.parse({
    subject: data.subject,
    body: data.body,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
  });

  const ticket = await prisma.ticket.create({
    data: {
      subject: sanitizePlainText(parsed.subject),
      body: sanitizePlainText(parsed.body),
      customerType: data.customerType,
      customerName: sanitizePlainText(parsed.customerName),
      customerEmail: parsed.customerEmail,
      customerPhone: parsed.customerPhone,
      subscriberId: data.subscriberId,
      advertiserId: data.advertiserId,
      priority: data.priority ?? TicketPriority.NORMAL,
      status: TicketStatus.OPEN,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'Ticket',
    entityId: ticket.id,
  });

  await fireWebhooks('ticket.created', {
    title: 'تیکت جدید',
    message: `${data.customerName}: ${data.subject}`,
    metadata: { ticketId: ticket.id },
  });

  revalidatePath('/crm/tickets');
  return ticket.id;
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.TICKET_MANAGE);
  const parsed = updateStatusSchema.parse({ id, status });

  const ticket = await prisma.ticket.update({
    where: { id: parsed.id },
    data: {
      status: parsed.status,
      resolvedAt:
        parsed.status === TicketStatus.RESOLVED || parsed.status === TicketStatus.CLOSED
          ? new Date()
          : undefined,
    },
  });

  if (parsed.status === TicketStatus.RESOLVED && ticket.customerEmail) {
    await dispatchFromTemplate(
      DEFAULT_TEMPLATE_KEYS.TICKET_RESOLVED,
      ticket.customerEmail,
      { name: ticket.customerName, subject: ticket.subject },
      { entity: 'Ticket', entityId: ticket.id },
    ).catch(() => undefined);
  }

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Ticket',
    entityId: parsed.id,
  });

  revalidatePath('/crm/tickets');
  revalidatePath(`/crm/tickets/${parsed.id}`);
}

export async function assignTicket(id: string, assignedToId: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.TICKET_MANAGE);
  const parsed = assignSchema.parse({ id, assignedToId });
  await prisma.ticket.update({
    where: { id: parsed.id },
    data: { assignedToId: parsed.assignedToId, status: TicketStatus.IN_PROGRESS },
  });
  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Ticket',
    entityId: parsed.id,
  });
  revalidatePath('/crm/tickets');
  revalidatePath(`/crm/tickets/${parsed.id}`);
}

export async function replyToTicket(id: string, body: string, isInternal = false) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.TICKET_MANAGE);
  const parsed = replySchema.parse({ id, body, isInternal });

  const sanitizedBody = sanitizePlainText(parsed.body);
  if (!sanitizedBody.trim()) throw new Error('متن پاسخ الزامی است');

  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: parsed.id } });

  await prisma.ticketReply.create({
    data: {
      ticketId: parsed.id,
      authorId: session.user.id,
      body: sanitizedBody,
      isInternal: parsed.isInternal ?? false,
    },
  });

  if (!parsed.isInternal && ticket.customerEmail) {
    await dispatchFromTemplate(
      DEFAULT_TEMPLATE_KEYS.TICKET_REPLY,
      ticket.customerEmail,
      { name: ticket.customerName, subject: ticket.subject, body: sanitizedBody },
      { entity: 'Ticket', entityId: parsed.id },
    ).catch(() => undefined);
  }

  await prisma.ticket.update({
    where: { id: parsed.id },
    data: { status: parsed.isInternal ? undefined : TicketStatus.WAITING_CUSTOMER },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Ticket',
    entityId: parsed.id,
    changes: { reply: parsed.isInternal ? 'internal' : 'customer' },
  });

  revalidatePath('/crm/tickets');
  revalidatePath(`/crm/tickets/${parsed.id}`);
}

export async function submitSatisfactionSurvey(ticketId: string, score: number, comment?: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.TICKET_MANAGE);

  const parsed = satisfactionSurveySchema.parse({ ticketId, score, comment });

  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: parsed.ticketId } });

  const existing = await prisma.satisfactionSurvey.findFirst({ where: { ticketId: parsed.ticketId } });
  if (existing) throw new Error('برای این تیکت قبلاً نظرسنجی ثبت شده است');

  await prisma.satisfactionSurvey.create({
    data: {
      ticketId: parsed.ticketId,
      score: parsed.score,
      comment: parsed.comment ? sanitizePlainText(parsed.comment) : undefined,
      customerName: ticket.customerName,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'SatisfactionSurvey',
    entityId: parsed.ticketId,
  });

  revalidatePath(`/crm/tickets/${parsed.ticketId}`);
  revalidatePath('/crm/surveys');
}
