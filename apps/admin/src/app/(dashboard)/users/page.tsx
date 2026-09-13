import { prisma } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { PaginationLinks, parsePageParam } from '@/components/ui/pagination-links';
import { UsersWorkspace } from '@/components/users/users-workspace';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { hasAnyPermissionAsync } from '@/lib/permissions-server';

const PAGE_SIZE = 50;

const ADMIN_ROLE_FILTER = [
  'SUPER_ADMIN',
  'PUBLISHER',
  'MANAGING_DIRECTOR',
  'EDITOR_IN_CHIEF',
  'COPY_EDITOR',
  'WRITER',
  'AD_MANAGER',
] as const;

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function UsersPage({ searchParams }: PageProps) {
  await requirePermission(PERMISSIONS.USER_VIEW);
  const session = await requireAuth();
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const skip = (page - 1) * PAGE_SIZE;

  const where = { role: { in: [...ADMIN_ROLE_FILTER] } };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
      },
    }),
  ]);

  const [canCreate, canDelete] = await Promise.all([
    hasAnyPermissionAsync(session.user.role, [PERMISSIONS.USER_MANAGE, PERMISSIONS.USER_CREATE]),
    hasAnyPermissionAsync(session.user.role, [PERMISSIONS.USER_MANAGE]),
  ]);

  const data = users.map((u) => ({
    ...u,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  }));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="کاربران پنل"
        description="مدیریت نقش‌ها، وضعیت و دسترسی کاربران ادمین"
      />
      <UsersWorkspace
        users={data}
        canCreate={canCreate}
        canDelete={canDelete}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
      <PaginationLinks
        page={page}
        totalPages={totalPages}
        total={total}
        basePath="/users"
        searchParams={params}
      />
    </div>
  );
}
