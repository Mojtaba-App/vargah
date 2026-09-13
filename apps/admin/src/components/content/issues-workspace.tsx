'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { IssueStatus } from '@vargah/database/enums';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/feedback/confirm-dialog';
import { ExportToolbar } from '@/components/ui/feedback/export-toolbar';
import { deleteIssue } from '@/actions/issues';
import {
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_VARIANT,
  getPublicIssueUrl,
  parseIssueTocEntries,
} from '@/lib/issues/constants';
import { formatJalali } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type IssueRow = {
  id: string;
  number: number;
  title: string;
  slug: string;
  status: IssueStatus;
  pageCount: number;
  pdfUrl: string | null;
  coverImage: string | null;
  tableOfContents?: unknown | null;
  publishedAt: Date | null;
  updatedAt: Date;
  _count: { articles: number };
};

type StatusFilter = 'ALL' | IssueStatus;

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
        active && 'border-primary ring-1 ring-primary/20',
      )}
    >
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Comp>
  );
}

export function IssuesWorkspace({
  issues,
  canDelete,
}: {
  issues: IssueRow[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<IssueRow | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: issues.length };
    for (const issue of issues) {
      counts[issue.status] = (counts[issue.status] ?? 0) + 1;
    }
    return counts;
  }, [issues]);

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return issues;
    return issues.filter((issue) => issue.status === statusFilter);
  }, [issues, statusFilter]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    startDelete(async () => {
      try {
        await deleteIssue(deleteTarget.id);
      } catch {
        setDeleteTarget(null);
        router.refresh();
      }
    });
  };

  const columns: ColumnDef<IssueRow>[] = [
    {
      accessorKey: 'number',
      header: 'شماره',
      cell: ({ row }) => (
        <div className="flex min-w-[220px] items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
            {row.original.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.original.coverImage} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xs font-bold text-muted-foreground">
                #{row.original.number}
              </div>
            )}
          </div>
          <div>
            <Link
              href={`/content/issues/${row.original.id}`}
              className="font-medium text-primary hover:underline"
            >
              شماره {row.original.number}
            </Link>
            <p className="line-clamp-1 text-sm text-muted-foreground">{row.original.title}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => (
        <Badge variant={ISSUE_STATUS_VARIANT[row.original.status]}>
          {ISSUE_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'assets',
      header: 'فایل‌ها',
      cell: ({ row }) => (
        <div className="flex gap-2 text-xs">
          <span>{row.original.pdfUrl ? 'PDF ✓' : 'PDF —'}</span>
          <span>{row.original.coverImage ? 'کاور ✓' : 'کاور —'}</span>
        </div>
      ),
    },
    {
      id: 'toc',
      header: 'فهرست',
      cell: ({ row }) => {
        const tocCount = parseIssueTocEntries(row.original.tableOfContents ?? null).length;
        const articlesCount = row.original._count.articles;
        return `${Math.max(tocCount, articlesCount)} آیتم`;
      },
    },
    { accessorKey: 'pageCount', header: 'صفحات' },
    {
      accessorKey: 'publishedAt',
      header: 'انتشار',
      cell: ({ row }) => (row.original.publishedAt ? formatJalali(row.original.publishedAt) : '—'),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Link href={`/content/issues/${row.original.id}`}>
            <Button variant="ghost" size="sm">
              ویرایش
            </Button>
          </Link>
          {row.original.status === IssueStatus.PUBLISHED && (
            <a href={getPublicIssueUrl(row.original.slug)} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                مشاهده
              </Button>
            </a>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(row.original)}
            >
              حذف
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="همه"
          value={statusCounts.ALL ?? 0}
          active={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
        />
        {(Object.keys(ISSUE_STATUS_LABELS) as IssueStatus[]).map((status) => (
          <StatCard
            key={status}
            label={ISSUE_STATUS_LABELS[status]}
            value={statusCounts[status] ?? 0}
            active={statusFilter === status}
            onClick={() => setStatusFilter(status)}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <ExportToolbar
          title="گزارش شماره‌های نشریه"
          subtitle="شماره‌های فیلترشده"
          filenameBase="issues-report"
          columns={[
            { key: 'number', header: 'شماره', width: 8 },
            { key: 'title', header: 'عنوان', width: 28 },
            { key: 'status', header: 'وضعیت', width: 12 },
            { key: 'articles', header: 'مقالات', width: 10 },
            { key: 'pages', header: 'صفحات', width: 10 },
            { key: 'publishedAt', header: 'انتشار', width: 14 },
          ]}
          rows={filtered.map((row) => ({
            number: row.number,
            title: row.title,
            status: ISSUE_STATUS_LABELS[row.status],
            articles: row._count.articles,
            pages: row.pageCount,
            publishedAt: row.publishedAt ? formatJalali(row.publishedAt) : '',
          }))}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        getSearchText={(row) => `${row.number} ${row.title}`}
        searchPlaceholder="جستجوی شماره..."
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف شماره"
        description={`آیا از حذف «شماره ${deleteTarget?.number}» مطمئن هستید؟`}
        confirmLabel="حذف"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
