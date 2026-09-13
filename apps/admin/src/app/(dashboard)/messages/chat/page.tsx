import { prisma } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { ChatWorkspace } from '@/components/chat/chat-workspace';
import { MessagesNav } from '@/components/campaigns/messages-nav';
import { listChatConversations } from '@/actions/chat';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';

export default async function LiveChatPage() {
  const session = await requirePermission(PERMISSIONS.CHAT_VIEW);

  const [conversations, staff, canManage] = await Promise.all([
    listChatConversations({ status: 'ALL' }),
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
    hasPermissionAsync(session.user.role, PERMISSIONS.CHAT_MANAGE),
  ]);

  const waitingCount = conversations.filter((c) => c.status === 'WAITING').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="چت آنلاین"
        description={`گفتگوی زنده با بازدیدکنندگان سایت · ${waitingCount.toLocaleString('fa-IR')} گفتگو در انتظار`}
      />
      <MessagesNav />
      <ChatWorkspace
        initialConversations={conversations}
        staff={staff}
        canManage={canManage}
      />
    </div>
  );
}
