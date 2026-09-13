'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Input, Label, Select, Textarea } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';
import { DataTable } from '@/components/ui/data-table';
import { WorkspaceSearchField } from '@/components/ui/workspace-search-field';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ConfirmDialog } from '@/components/ui/feedback/confirm-dialog';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { ModalDialog } from '@/components/ui/feedback/modal-dialog';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { JalaliDateField } from '@/components/ui/form/jalali-date-field';
import {
  createCalendarItem,
  createContributor,
  createTask,
  deleteCalendarItem,
  deleteTask,
  updateTaskStatus,
} from '@/actions/contributors';
import { createCommission } from '@/actions/commissions';
import { CommissionTransitionButtons } from '@/components/contributors/commission-transition-buttons';
import type { ContributorsWorkspaceData } from '@/lib/contributors/load-workspace-data';
import { jalaliDatePartsToIso, getTodayJalaliParts } from '@/lib/date/jalali';
import {
  ACTIVE_COMMISSION_STATUSES,
  ACTIVE_TASK_STATUSES,
  COMMISSION_STATUS_LABELS,
  COMMISSION_STATUS_VARIANT,
  CONTRIBUTOR_TYPE_LABELS,
  CONTRIBUTOR_TYPE_VARIANT,
  CommissionStatus,
  ContributorType,
  TAB_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_VARIANT,
  TaskStatus,
  type CommissionStatusFilter,
  type ContributorTypeFilter,
  type ContributorsTab,
  type TaskStatusFilter,
} from '@/lib/contributors/constants';
import { cn, formatJalali, formatNumber, formatPrice } from '@/lib/utils';

type ContributorsWorkspaceProps = ContributorsWorkspaceData & {
  canManage: boolean;
  defaultTab?: ContributorsTab;
};

function StatCard({
  label,
  value,
  hint,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-border bg-card p-4 text-start transition-colors',
        onClick && 'cursor-pointer hover:border-primary/40 hover:bg-muted/30',
        active && 'border-primary ring-1 ring-primary/20',
      )}
    >
      <p className="text-2xl font-bold tabular-nums">{typeof value === 'number' ? formatNumber(value) : value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </Comp>
  );
}

function TabBar({
  active,
  onChange,
  canManage,
}: {
  active: ContributorsTab;
  onChange: (tab: ContributorsTab) => void;
  canManage: boolean;
}) {
  const tabs: ContributorsTab[] = canManage
    ? ['profiles', 'commissions', 'tasks', 'calendar']
    : ['profiles', 'calendar'];

  return (
    <div className="flex flex-wrap gap-2 border-b border-border pb-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
            active === tab
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted',
          )}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}

const EMPTY_SEARCH_BY_TAB: Record<ContributorsTab, string> = {
  profiles: '',
  commissions: '',
  tasks: '',
  calendar: '',
};

export function ContributorsWorkspace({
  contributors: initialContributors,
  commissions: initialCommissions,
  tasks: initialTasks,
  calendar: initialCalendar,
  eligibleUsers,
  writers,
  issues,
  canManage,
  defaultTab = 'profiles',
}: ContributorsWorkspaceProps) {
  const router = useRouter();
  const [tab, setTab] = useState<ContributorsTab>(defaultTab);
  const [contributors, setContributors] = useState(initialContributors);
  const [commissions, setCommissions] = useState(initialCommissions);
  const [tasks, setTasks] = useState(initialTasks);
  const [calendar, setCalendar] = useState(initialCalendar);
  const [searchByTab, setSearchByTab] = useState(EMPTY_SEARCH_BY_TAB);
  const debouncedProfilesSearch = useDebouncedValue(searchByTab.profiles);
  const debouncedCommissionsSearch = useDebouncedValue(searchByTab.commissions);
  const debouncedTasksSearch = useDebouncedValue(searchByTab.tasks);
  const debouncedCalendarSearch = useDebouncedValue(searchByTab.calendar);
  const [typeFilter, setTypeFilter] = useState<ContributorTypeFilter>('ALL');
  const [commissionFilter, setCommissionFilter] = useState<CommissionStatusFilter>('ALL');
  const [taskFilter, setTaskFilter] = useState<TaskStatusFilter>('ALL');
  const [selectedContributor, setSelectedContributor] = useState<(typeof contributors)[0] | null>(null);
  const [selectedCommission, setSelectedCommission] = useState<(typeof commissions)[0] | null>(null);
  const [selectedTask, setSelectedTask] = useState<(typeof tasks)[0] | null>(null);
  const [selectedCalendar, setSelectedCalendar] = useState<(typeof calendar)[0] | null>(null);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [createCommissionOpen, setCreateCommissionOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createCalendarOpen, setCreateCalendarOpen] = useState(false);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<(typeof tasks)[0] | null>(null);
  const [deleteCalendarTarget, setDeleteCalendarTarget] = useState<(typeof calendar)[0] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setContributors(initialContributors);
    setCommissions(initialCommissions);
    setTasks(initialTasks);
    setCalendar(initialCalendar);
  }, [initialContributors, initialCommissions, initialTasks, initialCalendar]);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  const minDueDate = useMemo(
    () => jalaliDatePartsToIso(getTodayJalaliParts(), 'start'),
    [],
  );

  const refresh = () => {
    setMessage('به‌روزرسانی شد.');
    router.refresh();
  };

  const profileStats = useMemo(
    () => ({
      total: contributors.length,
      writers: contributors.filter((c) => c.type === ContributorType.WRITER).length,
      journalists: contributors.filter((c) => c.type === ContributorType.JOURNALIST).length,
      designers: contributors.filter((c) => c.type === ContributorType.DESIGNER).length,
      photographers: contributors.filter((c) => c.type === ContributorType.PHOTOGRAPHER).length,
    }),
    [contributors],
  );

  const commissionStats = useMemo(
    () => ({
      total: commissions.length,
      active: commissions.filter((c) => ACTIVE_COMMISSION_STATUSES.includes(c.status)).length,
      inReview: commissions.filter((c) => c.status === CommissionStatus.IN_REVIEW).length,
      overdue: commissions.filter((c) => c.isOverdue).length,
      approved: commissions.filter((c) => c.status === CommissionStatus.APPROVED).length,
    }),
    [commissions],
  );

  const taskStats = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter((t) => ACTIVE_TASK_STATUSES.includes(t.status)).length,
      inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
      overdue: tasks.filter((t) => t.isOverdue).length,
      approved: tasks.filter((t) => t.status === TaskStatus.APPROVED).length,
    }),
    [tasks],
  );

  const calendarStats = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return {
      total: calendar.length,
      thisWeek: calendar.filter((c) => c.dueDate.getTime() - now <= weekMs && c.dueDate.getTime() >= now).length,
      overdue: calendar.filter((c) => c.isOverdue).length,
    };
  }, [calendar]);

  const filteredContributors = useMemo(() => {
    const q = debouncedProfilesSearch.trim().toLowerCase();
    return contributors.filter((c) => {
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
      if (!q) return true;
      return [c.userName, c.userEmail, CONTRIBUTOR_TYPE_LABELS[c.type]].join(' ').toLowerCase().includes(q);
    });
  }, [contributors, typeFilter, debouncedProfilesSearch]);

  const filteredCommissions = useMemo(() => {
    const q = debouncedCommissionsSearch.trim().toLowerCase();
    return commissions.filter((c) => {
      if (commissionFilter === 'OVERDUE') return c.isOverdue;
      if (commissionFilter !== 'ALL' && c.status !== commissionFilter) return false;
      if (!q) return true;
      return [c.title, c.description, c.assigneeName, c.contributorName].join(' ').toLowerCase().includes(q);
    });
  }, [commissions, commissionFilter, debouncedCommissionsSearch]);

  const filteredTasks = useMemo(() => {
    const q = debouncedTasksSearch.trim().toLowerCase();
    return tasks.filter((t) => {
      if (taskFilter === 'OVERDUE') return t.isOverdue;
      if (taskFilter !== 'ALL' && t.status !== taskFilter) return false;
      if (!q) return true;
      return [t.title, t.contributorName, t.assignedToName].join(' ').toLowerCase().includes(q);
    });
  }, [tasks, taskFilter, debouncedTasksSearch]);

  const filteredCalendar = useMemo(() => {
    const q = debouncedCalendarSearch.trim().toLowerCase();
    return calendar.filter((c) => {
      if (!q) return true;
      return [c.title, c.description, c.userName].join(' ').toLowerCase().includes(q);
    });
  }, [calendar, debouncedCalendarSearch]);

  const contributorColumns: ColumnDef<(typeof contributors)[0]>[] = [
    {
      accessorKey: 'userName',
      header: 'نام',
      cell: ({ row }) => (
        <button type="button" className="text-start" onClick={() => setSelectedContributor(row.original)}>
          <p className="font-medium text-primary hover:underline">{row.original.userName ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{row.original.userEmail ?? '—'}</p>
        </button>
      ),
    },
    {
      accessorKey: 'type',
      header: 'نوع',
      cell: ({ row }) => (
        <Badge variant={CONTRIBUTOR_TYPE_VARIANT[row.original.type]}>
          {CONTRIBUTOR_TYPE_LABELS[row.original.type]}
        </Badge>
      ),
    },
    {
      accessorKey: 'feePerWord',
      header: 'حق‌التحریر',
      cell: ({ row }) =>
        row.original.feePerWord ? `${formatPrice(row.original.feePerWord)} ت/کلمه` : '—',
    },
    {
      id: 'workload',
      header: 'بار کاری',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatNumber(row.original.commissionCount)} سفارش · {formatNumber(row.original.taskCount)} وظیفه
        </span>
      ),
    },
    {
      accessorKey: 'avgRating',
      header: 'امتیاز',
      cell: ({ row }) =>
        row.original.avgRating ? `${row.original.avgRating.toFixed(1)} / ۵` : '—',
    },
    {
      accessorKey: 'joinedAt',
      header: 'شروع همکاری',
      cell: ({ row }) => formatJalali(row.original.joinedAt),
    },
  ];

  const commissionColumns: ColumnDef<(typeof commissions)[0]>[] = [
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) =>
        canManage ? (
          <CommissionTransitionButtons
            commissionId={row.original.id}
            status={row.original.status}
            onSuccess={refresh}
            onError={setError}
          />
        ) : (
          <Badge variant="outline">فقط مشاهده</Badge>
        ),
    },
    {
      accessorKey: 'title',
      header: 'سوژه',
      cell: ({ row }) => (
        <button type="button" className="max-w-xs text-start" onClick={() => setSelectedCommission(row.original)}>
          <p className="font-medium text-primary hover:underline">{row.original.title}</p>
          {row.original.isOverdue && (
            <Badge variant="destructive" className="mt-1">
              سررسید گذشته
            </Badge>
          )}
        </button>
      ),
    },
    {
      accessorKey: 'status',
      header: 'مرحله',
      cell: ({ row }) => (
        <Badge variant={COMMISSION_STATUS_VARIANT[row.original.status]}>
          {COMMISSION_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    { accessorKey: 'assigneeName', header: 'نویسنده', cell: ({ row }) => row.original.assigneeName ?? '—' },
    {
      accessorKey: 'dueDate',
      header: 'مهلت',
      cell: ({ row }) => (row.original.dueDate ? formatJalali(row.original.dueDate) : '—'),
    },
  ];

  const taskColumns: ColumnDef<(typeof tasks)[0]>[] = [
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) =>
        canManage ? (
          <div className="flex flex-wrap gap-2">
            <Select
              value={row.original.status}
              className="h-9 min-w-[8rem] rounded-lg text-xs"
              onChange={(e) => {
                const next = e.target.value as TaskStatus;
                startTransition(async () => {
                  try {
                    await updateTaskStatus(row.original.id, next);
                    refresh();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'تغییر وضعیت ناموفق بود');
                  }
                });
              }}
            >
              {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg"
              onClick={() => setDeleteTaskTarget(row.original)}
            >
              حذف
            </Button>
          </div>
        ) : null,
    },
    {
      accessorKey: 'title',
      header: 'عنوان',
      cell: ({ row }) => (
        <button type="button" onClick={() => setSelectedTask(row.original)}>
          <span className="font-medium text-primary hover:underline">{row.original.title}</span>
        </button>
      ),
    },
    { accessorKey: 'contributorName', header: 'همکار', cell: ({ row }) => row.original.contributorName ?? '—' },
    {
      accessorKey: 'issueNumber',
      header: 'شماره',
      cell: ({ row }) => (row.original.issueNumber ? `#${row.original.issueNumber}` : '—'),
    },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => (
        <Badge variant={TASK_STATUS_VARIANT[row.original.status]}>
          {TASK_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'مهلت',
      cell: ({ row }) => (row.original.dueDate ? formatJalali(row.original.dueDate) : '—'),
    },
  ];

  const calendarColumns: ColumnDef<(typeof calendar)[0]>[] = [
    {
      accessorKey: 'title',
      header: 'عنوان',
      cell: ({ row }) => (
        <button type="button" onClick={() => setSelectedCalendar(row.original)}>
          <span className="font-medium text-primary hover:underline">{row.original.title}</span>
        </button>
      ),
    },
    { accessorKey: 'userName', header: 'مسئول', cell: ({ row }) => row.original.userName ?? '—' },
    {
      accessorKey: 'dueDate',
      header: 'مهلت',
      cell: ({ row }) => (
        <div>
          <span>{formatJalali(row.original.dueDate)}</span>
          {row.original.isOverdue && (
            <Badge variant="destructive" className="ms-2">
              گذشته
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'توضیح',
      cell: ({ row }) => (
        <p className="line-clamp-2 max-w-xs text-sm text-muted-foreground">{row.original.description ?? '—'}</p>
      ),
    },
    ...(canManage
      ? [
          {
            id: 'delete',
            header: '',
            cell: ({ row }: { row: { original: (typeof calendar)[0] } }) => (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={() => setDeleteCalendarTarget(row.original)}
              >
                حذف
              </Button>
            ),
          } as ColumnDef<(typeof calendar)[0]>,
        ]
      : []),
  ];

  const handleCreateProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createContributor({
          userId: fd.get('userId') as string,
          type: fd.get('type') as ContributorType,
          bio: (fd.get('bio') as string) || undefined,
          feePerWord: fd.get('feePerWord') ? Number(fd.get('feePerWord')) : undefined,
          bankInfo: (fd.get('bankInfo') as string) || undefined,
        });
        setCreateProfileOpen(false);
        setMessage('پروفایل همکار ایجاد شد.');
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ایجاد پروفایل ناموفق بود');
      }
    });
  };

  const handleCreateCommission = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createCommission({
          title: fd.get('title') as string,
          description: (fd.get('description') as string) || undefined,
          assigneeId: (fd.get('assigneeId') as string) || undefined,
          contributorId: (fd.get('contributorId') as string) || undefined,
          issueId: (fd.get('issueId') as string) || undefined,
          dueDate: (fd.get('dueDate') as string) || undefined,
        });
        setCreateCommissionOpen(false);
        setMessage('سفارش مطلب ایجاد شد.');
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ایجاد سفارش ناموفق بود');
      }
    });
  };

  const handleCreateTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createTask({
          contributorId: fd.get('contributorId') as string,
          title: fd.get('title') as string,
          description: (fd.get('description') as string) || undefined,
          assignedToId: fd.get('assignedToId') as string,
          issueId: (fd.get('issueId') as string) || undefined,
          dueDate: (fd.get('dueDate') as string) || undefined,
        });
        setCreateTaskOpen(false);
        setMessage('وظیفه ایجاد شد.');
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ایجاد وظیفه ناموفق بود');
      }
    });
  };

  const handleCreateCalendar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createCalendarItem({
          title: fd.get('title') as string,
          description: (fd.get('description') as string) || undefined,
          dueDate: fd.get('dueDate') as string,
          userId: fd.get('userId') as string,
          issueId: (fd.get('issueId') as string) || undefined,
        });
        setCreateCalendarOpen(false);
        setMessage('رویداد تقویم ثبت شد.');
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ثبت رویداد ناموفق بود');
      }
    });
  };

  return (
    <div className="space-y-6">
      {(message || error) && (
        <StatusBanner type={error ? 'error' : 'success'} message={error ?? message!} />
      )}

      <TabBar active={tab} onChange={setTab} canManage={canManage} />

      {tab === 'profiles' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="کل همکاران" value={profileStats.total} active={typeFilter === 'ALL'} onClick={() => setTypeFilter('ALL')} />
            <StatCard label="نویسندگان" value={profileStats.writers} active={typeFilter === ContributorType.WRITER} onClick={() => setTypeFilter(ContributorType.WRITER)} />
            <StatCard label="خبرنگاران" value={profileStats.journalists} active={typeFilter === ContributorType.JOURNALIST} onClick={() => setTypeFilter(ContributorType.JOURNALIST)} />
            <StatCard label="طراحان" value={profileStats.designers} active={typeFilter === ContributorType.DESIGNER} onClick={() => setTypeFilter(ContributorType.DESIGNER)} />
            <StatCard label="عکاسان" value={profileStats.photographers} active={typeFilter === ContributorType.PHOTOGRAPHER} onClick={() => setTypeFilter(ContributorType.PHOTOGRAPHER)} />
          </div>
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <WorkspaceSearchField
                  id="profile-search"
                  value={searchByTab.profiles}
                  onChange={(value) => setSearchByTab((prev) => ({ ...prev, profiles: value }))}
                  placeholder="نام، ایمیل..."
                />
                {canManage && (
                  <Button type="button" className="rounded-xl" onClick={() => setCreateProfileOpen(true)}>
                    پروفایل جدید
                  </Button>
                )}
              </div>
              <DataTable columns={contributorColumns} data={filteredContributors} showSearch={false} />
            </CardContent>
          </Card>
        </>
      )}

      {tab === 'commissions' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="کل سفارش‌ها" value={commissionStats.total} active={commissionFilter === 'ALL'} onClick={() => setCommissionFilter('ALL')} />
            <StatCard label="فعال" value={commissionStats.active} onClick={() => setCommissionFilter(CommissionStatus.IN_WRITING)} />
            <StatCard label="در بازبینی" value={commissionStats.inReview} active={commissionFilter === CommissionStatus.IN_REVIEW} onClick={() => setCommissionFilter(CommissionStatus.IN_REVIEW)} />
            <StatCard label="سررسید گذشته" value={commissionStats.overdue} active={commissionFilter === 'OVERDUE'} onClick={() => setCommissionFilter('OVERDUE')} />
          </div>
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <WorkspaceSearchField
                  id="commission-search"
                  value={searchByTab.commissions}
                  onChange={(value) => setSearchByTab((prev) => ({ ...prev, commissions: value }))}
                  placeholder="سوژه، نویسنده..."
                />
                {canManage && (
                  <Button type="button" className="rounded-xl" onClick={() => setCreateCommissionOpen(true)}>
                    سفارش جدید
                  </Button>
                )}
              </div>
              <DataTable columns={commissionColumns} data={filteredCommissions} showSearch={false} />
            </CardContent>
          </Card>
        </>
      )}

      {tab === 'tasks' && canManage && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="کل وظایف" value={taskStats.total} active={taskFilter === 'ALL'} onClick={() => setTaskFilter('ALL')} />
            <StatCard label="فعال" value={taskStats.active} />
            <StatCard label="در حال انجام" value={taskStats.inProgress} active={taskFilter === TaskStatus.IN_PROGRESS} onClick={() => setTaskFilter(TaskStatus.IN_PROGRESS)} />
            <StatCard label="سررسید گذشته" value={taskStats.overdue} active={taskFilter === 'OVERDUE'} onClick={() => setTaskFilter('OVERDUE')} />
          </div>
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <WorkspaceSearchField
                  id="task-search"
                  value={searchByTab.tasks}
                  onChange={(value) => setSearchByTab((prev) => ({ ...prev, tasks: value }))}
                  placeholder="عنوان، همکار..."
                />
                <Button type="button" className="rounded-xl" onClick={() => setCreateTaskOpen(true)}>
                  وظیفه جدید
                </Button>
              </div>
              <DataTable columns={taskColumns} data={filteredTasks} showSearch={false} />
            </CardContent>
          </Card>
        </>
      )}

      {tab === 'calendar' && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="کل رویدادها" value={calendarStats.total} />
            <StatCard label="این هفته" value={calendarStats.thisWeek} />
            <StatCard label="سررسید گذشته" value={calendarStats.overdue} />
          </div>
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <WorkspaceSearchField
                  id="calendar-search"
                  value={searchByTab.calendar}
                  onChange={(value) => setSearchByTab((prev) => ({ ...prev, calendar: value }))}
                  placeholder="عنوان، مسئول..."
                />
                {canManage && (
                  <Button type="button" className="rounded-xl" onClick={() => setCreateCalendarOpen(true)}>
                    رویداد جدید
                  </Button>
                )}
              </div>
              <DataTable columns={calendarColumns} data={filteredCalendar} showSearch={false} />
            </CardContent>
          </Card>
        </>
      )}

      {/* Profile detail panel */}
      {selectedContributor && (
        <Card className="rounded-2xl border-primary/20">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">{selectedContributor.userName}</h3>
                <p className="text-sm text-muted-foreground">{selectedContributor.userEmail}</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setSelectedContributor(null)}>
                بستن
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={CONTRIBUTOR_TYPE_VARIANT[selectedContributor.type]}>
                {CONTRIBUTOR_TYPE_LABELS[selectedContributor.type]}
              </Badge>
              {selectedContributor.avgRating && (
                <Badge variant="secondary">امتیاز {selectedContributor.avgRating.toFixed(1)} / ۵</Badge>
              )}
            </div>
            {selectedContributor.bio && <p className="text-sm text-muted-foreground">{selectedContributor.bio}</p>}
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>حق‌التحریر: {selectedContributor.feePerWord ? `${formatPrice(selectedContributor.feePerWord)} ت/کلمه` : '—'}</p>
              <p>شروع همکاری: {formatJalali(selectedContributor.joinedAt)}</p>
              <p>سفارش‌ها: {formatNumber(selectedContributor.commissionCount)}</p>
              <p>وظایف: {formatNumber(selectedContributor.taskCount)}</p>
            </div>
            {selectedContributor.recentRatings.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">آخرین امتیازها</p>
                {selectedContributor.recentRatings.map((r, i) => (
                  <div key={i} className="rounded-xl border border-border bg-muted/20 p-2 text-sm">
                    <span className="font-bold">{r.score}/۵</span>
                    {r.note && <span className="text-muted-foreground"> — {r.note}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Commission detail panel */}
      {selectedCommission && (
        <Card className="rounded-2xl border-primary/20">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">{selectedCommission.title}</h3>
                <p className="text-sm text-muted-foreground">سردبیر: {selectedCommission.createdByName}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/contributors/workflow/${selectedCommission.id}`}>
                  <Button type="button" variant="outline" size="sm" className="rounded-xl">
                    صفحه جزئیات
                  </Button>
                </Link>
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setSelectedCommission(null)}>
                  بستن
                </Button>
              </div>
            </div>
            <Badge variant={COMMISSION_STATUS_VARIANT[selectedCommission.status]}>
              {COMMISSION_STATUS_LABELS[selectedCommission.status]}
            </Badge>
            {selectedCommission.description && (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedCommission.description}</p>
            )}
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>نویسنده: {selectedCommission.assigneeName ?? '—'}</p>
              <p>همکار: {selectedCommission.contributorName ?? '—'}</p>
              <p>مهلت: {selectedCommission.dueDate ? formatJalali(selectedCommission.dueDate) : '—'}</p>
            </div>
            {canManage && (
              <CommissionTransitionButtons
                commissionId={selectedCommission.id}
                status={selectedCommission.status}
                onSuccess={refresh}
                onError={setError}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Task detail panel */}
      {selectedTask && (
        <Card className="rounded-2xl border-primary/20">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-lg font-bold">{selectedTask.title}</h3>
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setSelectedTask(null)}>
                بستن
              </Button>
            </div>
            <Badge variant={TASK_STATUS_VARIANT[selectedTask.status]}>
              {TASK_STATUS_LABELS[selectedTask.status]}
            </Badge>
            {selectedTask.description && (
              <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
            )}
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>همکار: {selectedTask.contributorName ?? '—'}</p>
              <p>مسئول: {selectedTask.assignedToName ?? '—'}</p>
              <p>شماره: {selectedTask.issueNumber ? `#${selectedTask.issueNumber}` : '—'}</p>
              <p>مهلت: {selectedTask.dueDate ? formatJalali(selectedTask.dueDate) : '—'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar detail panel */}
      {selectedCalendar && (
        <Card className="rounded-2xl border-primary/20">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-lg font-bold">{selectedCalendar.title}</h3>
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setSelectedCalendar(null)}>
                بستن
              </Button>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>مسئول: {selectedCalendar.userName ?? '—'}</p>
              <p>مهلت: {formatJalali(selectedCalendar.dueDate)}</p>
            </div>
            {selectedCalendar.description && (
              <p className="text-sm text-muted-foreground">{selectedCalendar.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <ModalDialog open={createProfileOpen} title="پروفایل همکار جدید" onClose={() => setCreateProfileOpen(false)}>
        <form onSubmit={handleCreateProfile} className="space-y-4">
          <div>
            <Label required>کاربر</Label>
            <Select name="userId" required className="mt-2 rounded-xl" disabled={isPending}>
              <option value="">انتخاب کاربر...</option>
              {eligibleUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>نوع همکاری</Label>
            <Select name="type" required className="mt-2 rounded-xl" disabled={isPending}>
              {Object.entries(CONTRIBUTOR_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="feePerWord">حق‌التحریر (تومان/کلمه)</Label>
            <Input id="feePerWord" name="feePerWord" type="number" min={0} dir="ltr" className="mt-2 rounded-xl" disabled={isPending} />
          </div>
          <div>
            <Label htmlFor="bio">بیوگرافی</Label>
            <Textarea id="bio" name="bio" rows={3} className="mt-2 rounded-xl" disabled={isPending} />
          </div>
          <div className="flex gap-2">
            <LoadingButton type="submit" loading={isPending} className="rounded-xl">
              ایجاد پروفایل
            </LoadingButton>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCreateProfileOpen(false)}>
              انصراف
            </Button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={createCommissionOpen} title="سفارش مطلب جدید" onClose={() => setCreateCommissionOpen(false)}>
        <form onSubmit={handleCreateCommission} className="space-y-4">
          <div>
            <Label required>عنوان سوژه</Label>
            <Input name="title" required className="mt-2 rounded-xl" disabled={isPending} />
          </div>
          <div>
            <Label>شرح</Label>
            <Textarea name="description" rows={3} className="mt-2 rounded-xl" disabled={isPending} />
          </div>
          <div>
            <Label>نویسنده</Label>
            <Select name="assigneeId" className="mt-2 rounded-xl" disabled={isPending}>
              <option value="">بعداً تخصیص</option>
              {writers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>پروفایل همکار</Label>
            <Select name="contributorId" className="mt-2 rounded-xl" disabled={isPending}>
              <option value="">—</option>
              {contributors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.userName} ({CONTRIBUTOR_TYPE_LABELS[c.type]})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>شماره مجله</Label>
            <Select name="issueId" className="mt-2 rounded-xl" disabled={isPending}>
              <option value="">—</option>
              {issues.map((i) => (
                <option key={i.id} value={i.id}>
                  #{i.number} — {i.title}
                </option>
              ))}
            </Select>
          </div>
          <JalaliDateField
            id="commission-due-date"
            name="dueDate"
            label="مهلت تحویل"
            disabled={isPending}
            minDate={minDueDate}
            hint="اختیاری — از امروز به بعد، تا پایان روز شمسی"
          />
          <div className="flex gap-2">
            <LoadingButton type="submit" loading={isPending} className="rounded-xl">
              ایجاد سفارش
            </LoadingButton>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCreateCommissionOpen(false)}>
              انصراف
            </Button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={createTaskOpen} title="وظیفه جدید" onClose={() => setCreateTaskOpen(false)}>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <Label required>عنوان</Label>
            <Input name="title" required className="mt-2 rounded-xl" disabled={isPending} />
          </div>
          <div>
            <Label required>همکار</Label>
            <Select name="contributorId" required className="mt-2 rounded-xl" disabled={isPending}>
              <option value="">انتخاب...</option>
              {contributors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.userName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>مسئول پیگیری</Label>
            <Select name="assignedToId" required className="mt-2 rounded-xl" disabled={isPending}>
              <option value="">انتخاب...</option>
              {writers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>شماره</Label>
            <Select name="issueId" className="mt-2 rounded-xl" disabled={isPending}>
              <option value="">—</option>
              {issues.map((i) => (
                <option key={i.id} value={i.id}>
                  #{i.number}
                </option>
              ))}
            </Select>
          </div>
          <JalaliDateField
            id="task-due-date"
            name="dueDate"
            label="مهلت انجام"
            disabled={isPending}
            minDate={minDueDate}
            hint="اختیاری — از امروز به بعد، تا پایان روز شمسی"
          />
          <div className="flex gap-2">
            <LoadingButton type="submit" loading={isPending} className="rounded-xl">
              ایجاد وظیفه
            </LoadingButton>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCreateTaskOpen(false)}>
              انصراف
            </Button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog open={createCalendarOpen} title="رویداد تقویم" onClose={() => setCreateCalendarOpen(false)}>
        <form onSubmit={handleCreateCalendar} className="space-y-4">
          <div>
            <Label required>عنوان</Label>
            <Input name="title" required className="mt-2 rounded-xl" disabled={isPending} />
          </div>
          <div>
            <Label required>مسئول</Label>
            <Select name="userId" required className="mt-2 rounded-xl" disabled={isPending}>
              <option value="">انتخاب...</option>
              {writers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>
          <JalaliDateField
            id="calendar-due-date"
            name="dueDate"
            label="مهلت تحویل"
            required
            disabled={isPending}
            minDate={minDueDate}
            hint="الزامی — از امروز به بعد، تا پایان روز شمسی"
          />
          <div>
            <Label>توضیح</Label>
            <Textarea name="description" rows={2} className="mt-2 rounded-xl" disabled={isPending} />
          </div>
          <div className="flex gap-2">
            <LoadingButton type="submit" loading={isPending} className="rounded-xl">
              ثبت رویداد
            </LoadingButton>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCreateCalendarOpen(false)}>
              انصراف
            </Button>
          </div>
        </form>
      </ModalDialog>

      <ConfirmDialog
        open={!!deleteTaskTarget}
        title="حذف وظیفه"
        description={`آیا از حذف «${deleteTaskTarget?.title}» مطمئن هستید؟`}
        confirmLabel="حذف"
        onConfirm={() => {
          if (!deleteTaskTarget) return;
          startTransition(async () => {
            try {
              await deleteTask(deleteTaskTarget.id);
              setDeleteTaskTarget(null);
              refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'حذف ناموفق بود');
            }
          });
        }}
        onCancel={() => setDeleteTaskTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteCalendarTarget}
        title="حذف رویداد"
        description={`آیا از حذف «${deleteCalendarTarget?.title}» مطمئن هستید؟`}
        confirmLabel="حذف"
        onConfirm={() => {
          if (!deleteCalendarTarget) return;
          startTransition(async () => {
            try {
              await deleteCalendarItem(deleteCalendarTarget.id);
              setDeleteCalendarTarget(null);
              refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'حذف ناموفق بود');
            }
          });
        }}
        onCancel={() => setDeleteCalendarTarget(null)}
      />
    </div>
  );
}
