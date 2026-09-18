import { CommentStatus, prisma } from '@vargah/database';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';

import { CommentsModeration } from '@/components/content/comments-moderation';
import { PageHeader } from '@/components/ui/data-table';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function CommentsModerationPage({ searchParams }: PageProps) {
  await requirePermission(PERMISSIONS.COMMENT_VIEW);
  const session = await requireAuth();
  const params = await searchParams;

  const statusFilter =
    params.status === 'pending'
      ? CommentStatus.PENDING
      : params.status === 'approved'
        ? CommentStatus.APPROVED
        : params.status === 'rejected'
          ? CommentStatus.REJECTED
          : undefined;

  const comments = await prisma.articleComment.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    include: {
      article: { select: { id: true, title: true, slug: true } },
    },
  });

  const canModerate = await hasPermissionAsync(session.user.role, PERMISSIONS.COMMENT_MODERATE);

  return (
    <div className="space-y-6">
      <PageHeader title="نظرات مقالات" description="بررسی، تأیید یا رد نظرات ارسالی از سایت" />
      <CommentsModeration
        comments={comments.map((c) => ({
          id: c.id,
          authorName: c.authorName,
          content: c.content,
          status: c.status,
          createdAt: c.createdAt,
          article: c.article,
        }))}
        canModerate={canModerate}
      />
    </div>
  );
}
