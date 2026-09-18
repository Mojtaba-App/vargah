'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { UserRole, UserStatus } from '@vargah/database/enums';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { DataTable } from '@/components/ui/data-table';
import { deleteAdminUser } from '@/actions/users';
import { ReasonConfirmDialog } from '@/components/ui/feedback/reason-confirm-dialog';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { ExportToolbar } from '@/components/ui/feedback/export-toolbar';
import { isNextRedirect } from '@/lib/action-state';
import { getActionErrorMessage } from '@/lib/settings/errors';
import { isFullAccessRole, ROLE_LABELS } from '@/lib/permissions';
import { canActorManageTarget } from '@/lib/users/policy';
import { formatJalali } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
};

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'فعال',
  INACTIVE: 'غیرفعال',
  SUSPENDED: 'معلق',
};

const STATUS_VARIANT: Record<UserStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  ACTIVE: 'default',
  INACTIVE: 'secondary',
  SUSPENDED: 'destructive',
};

const USER_DELETE_REASONS = [
  'حساب دیگر مورد نیاز نیست',
  'اشتباه در ایجاد کاربر',
  'جایگزینی با حساب جدید',
  'خروج از سازمان / پایان همکاری',
  'نقض سیاست امنیتی',
] as const;

type UsersWorkspaceProps = {
  users: UserRow[];
  canCreate: boolean;
  canDelete: boolean;
  currentUserId: string;
  currentUserRole: UserRole;
};

type RoleFilter = 'ALL' | UserRole;
type StatusFilter = 'ALL' | UserStatus;

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'surface-card rounded-2xl p-4 text-start transition-colors',
        onClick && 'hover:border-primary/40',
        active && 'border-primary ring-primary/20 ring-1',
      )}
    >
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </Comp>
  );
}

export function UsersWorkspace({
  users,
  canCreate,
  canDelete,
  currentUserId,
  currentUserRole,
}: UsersWorkspaceProps) {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const visibleRoles = useMemo(() => {
    const all: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.PUBLISHER,
      UserRole.MANAGING_DIRECTOR,
      UserRole.EDITOR_IN_CHIEF,
      UserRole.COPY_EDITOR,
      UserRole.WRITER,
      UserRole.AD_MANAGER,
    ];
    if (currentUserRole !== UserRole.SUPER_ADMIN) {
      return all.filter((role) => role !== UserRole.SUPER_ADMIN);
    }
    return all;
  }, [currentUserRole]);

  const visibleUsers = useMemo(() => {
    return users.filter((user) => {
      if (
        currentUserRole !== UserRole.SUPER_ADMIN &&
        user.role === UserRole.SUPER_ADMIN &&
        user.id !== currentUserId
      ) {
        return false;
      }
      return true;
    });
  }, [users, currentUserRole, currentUserId]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: visibleUsers.length };
    for (const user of visibleUsers) {
      counts[user.role] = (counts[user.role] ?? 0) + 1;
    }
    return counts;
  }, [visibleUsers]);

  const filtered = useMemo(() => {
    return visibleUsers.filter((user) => {
      if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && user.status !== statusFilter) return false;
      return true;
    });
  }, [visibleUsers, roleFilter, statusFilter]);

  const handleDelete = (reason: string) => {
    if (!deleteTarget || isDeleting) return;
    const target = deleteTarget;
    setDeleteError(null);
    setDeleteSuccess(null);

    startDelete(async () => {
      try {
        await deleteAdminUser(target.id, reason);
        setDeleteTarget(null);
        setDeleteSuccess(`کاربر «${target.name ?? target.email ?? target.id}» حذف شد.`);
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setDeleteError(getActionErrorMessage(err, 'حذف کاربر ناموفق بود'));
      }
    });
  };

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: 'name',
      header: 'کاربر',
      cell: ({ row }) => {
        const canManage = canActorManageTarget(
          currentUserRole,
          row.original.role,
          currentUserId,
          row.original.id,
        );
        return (
          <div className="min-w-[200px]">
            {canManage ? (
              <Link
                href={`/users/${row.original.id}`}
                className="text-primary font-medium hover:underline"
              >
                {row.original.name ?? '—'}
              </Link>
            ) : (
              <p className="font-medium">{row.original.name ?? '—'}</p>
            )}
            <p className="text-muted-foreground mt-0.5 text-xs" dir="ltr">
              {row.original.email}
            </p>
            {row.original.phone && (
              <p className="text-muted-foreground text-xs" dir="ltr">
                {row.original.phone}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'نقش',
      cell: ({ row }) => <Badge>{ROLE_LABELS[row.original.role]}</Badge>,
    },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'پیامک',
      cell: ({ row }) => (row.original.phone ? '✅' : '—'),
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'آخرین ورود',
      cell: ({ row }) => (row.original.lastLoginAt ? formatJalali(row.original.lastLoginAt) : '—'),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => {
        const canManage = canActorManageTarget(
          currentUserRole,
          row.original.role,
          currentUserId,
          row.original.id,
        );
        return (
          <div className="flex flex-wrap gap-1">
            {canManage ? (
              <Link href={`/users/${row.original.id}`}>
                <Button variant="ghost" size="sm">
                  ویرایش
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="sm" disabled title="ویرایش این نقش برای شما مجاز نیست">
                ویرایش
              </Button>
            )}
            {canDelete &&
              canManage &&
              row.original.id !== currentUserId &&
              !isFullAccessRole(row.original.role) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteSuccess(null);
                    setDeleteTarget(row.original);
                  }}
                >
                  حذف
                </Button>
              )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {deleteSuccess && (
        <StatusBanner
          type="success"
          message={deleteSuccess}
          onDismiss={() => setDeleteSuccess(null)}
        />
      )}
      {deleteError && (
        <StatusBanner type="error" message={deleteError} onDismiss={() => setDeleteError(null)} />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard
          label="همه کاربران"
          value={roleCounts.ALL ?? 0}
          active={roleFilter === 'ALL'}
          onClick={() => setRoleFilter('ALL')}
        />
        {visibleRoles.map((role) => (
          <StatCard
            key={role}
            label={ROLE_LABELS[role]}
            value={roleCounts[role] ?? 0}
            active={roleFilter === role}
            onClick={() => setRoleFilter(role)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-muted-foreground text-sm" htmlFor="statusFilter">
          وضعیت:
        </label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="border-border bg-background rounded-xl border px-3 py-2 text-sm"
        >
          <option value="ALL">همه</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <ExportToolbar
          title="گزارش کاربران پنل"
          subtitle="کاربران فیلترشده مدیریت"
          filenameBase="admin-users-report"
          columns={[
            { key: 'name', header: 'نام', width: 18 },
            { key: 'email', header: 'ایمیل', width: 24 },
            { key: 'phone', header: 'تلفن', width: 14 },
            { key: 'role', header: 'نقش', width: 14 },
            { key: 'status', header: 'وضعیت', width: 12 },
            { key: 'lastLogin', header: 'آخرین ورود', width: 16 },
          ]}
          rows={filtered.map((row) => ({
            name: row.name,
            email: row.email,
            phone: row.phone,
            role: ROLE_LABELS[row.role] ?? row.role,
            status: STATUS_LABELS[row.status],
            lastLogin: row.lastLoginAt ? formatJalali(row.lastLoginAt, true) : '',
          }))}
        />
        {canCreate && (
          <Link href="/users/new" className="ms-auto">
            <Button className="rounded-xl">+ کاربر جدید</Button>
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['name', 'email']}
        searchPlaceholder="جستجوی نام یا ایمیل..."
      />

      <ReasonConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف کاربر"
        description={`آیا از حذف «${deleteTarget?.name ?? deleteTarget?.email ?? 'این کاربر'}» مطمئن هستید؟ سوابق محتوا به حساب شما منتقل می‌شود.`}
        confirmLabel="حذف قطعی"
        reasons={USER_DELETE_REASONS}
        loading={isDeleting}
        serverError={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
