import { prisma } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { MessagesWorkspace } from '@/components/messages/messages-workspace';
import { MessagesNav } from '@/components/campaigns/messages-nav';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { MessageStatus } from '@/lib/messages/constants';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
export default async function MessagesPage() {
  await requirePermission(PERMISSIONS.MESSAGE_VIEW);
  const session = await requireAuth();

  const [messages, staff] = await Promise.all([
    prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        role: {
          in: [
            'SUPER_ADMIN',
            'PUBLISHER',
            'MANAGING_DIRECTOR',
            'EDITOR_IN_CHIEF',
            'COPY_EDITOR',
            'AD_MANAGER',
          ],
        },
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  const rows = messages.map((m) => ({
    id: m.id,
    type: m.type,
    status: m.status,
    senderName: m.senderName,
    senderEmail: m.senderEmail,
    senderPhone: m.senderPhone,
    subject: m.subject,
    body: m.body,
    assignedToId: m.assignedToId,
    assigneeName: m.assignedTo?.name ?? null,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    replies: m.replies.map((reply) => ({
      id: reply.id,
      body: reply.body,
      isInternal: reply.isInternal,
      emailSent: reply.emailSent,
      authorName: reply.author?.name ?? null,
      createdAt: reply.createdAt,
    })),
  }));

  const newCount = messages.filter((m) => m.status === MessageStatus.NEW).length;
  const canManage = await hasPermissionAsync(session.user.role, PERMISSIONS.MESSAGE_MANAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="صندوق پیام‌ها"
        description={`فرم‌های عمومی سایت (تماس، همکاری، آگهی) — مجزا از تیکت‌های CRM · ${newCount} پیام جدید از ${messages.length} پیام`}
      />
      <MessagesNav />
      <MessagesWorkspace messages={rows} staff={staff} canManage={canManage} />
    </div>
  );
}
