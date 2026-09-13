'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { ArticleStatus } from '@vargah/database/enums';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/feedback/confirm-dialog';
import { ExportToolbar } from '@/components/ui/feedback/export-toolbar';
import { deleteArticle } from '@/actions/articles';
import {
  ARTICLE_STATUS_LABELS,
  ARTICLE_STATUS_VARIANT,
  WORKFLOW_STAGE_LABELS,
  getPublicArticleUrl,
} from '@/lib/articles/constants';
import { formatJalali, formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  workflowStage: string;
  coverImage: string | null;
  isFeatured: boolean;
  isEditorsPick: boolean;
  readingTime: number;
  publishedAt: Date | null;
  updatedAt: Date;
  author: { name: string | null };
  category: { id: string; name: string } | null;
  issue: { number: number; title: string } | null;
  _count: { pageViews: number };
};

type CategoryOption = { id: string; name: string };

type ArticlesWorkspaceProps = {
  articles: ArticleRow[];
  categories: CategoryOption[];
  canDelete: boolean;
};

type StatusFilter = 'ALL' | ArticleStatus;

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
      <p className="text-2xl font-bold tabular-nums">{formatNumber(value)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Comp>
  );
}

export function ArticlesWorkspace({ articles, categories, canDelete }: ArticlesWorkspaceProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [deleteTarget, setDeleteTarget] = useState<ArticleRow | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: articles.length };
    for (const article of articles) {
      counts[article.status] = (counts[article.status] ?? 0) + 1;
    }
    return counts;
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      if (statusFilter !== 'ALL' && article.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && article.category?.id !== categoryFilter) return false;
      return true;
    });
  }, [articles, statusFilter, categoryFilter]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    startDelete(async () => {
      await deleteArticle(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const columns: ColumnDef<ArticleRow>[] = [
    {
      accessorKey: 'title',
      header: 'مقاله',
      cell: ({ row }) => (
        <div className="flex min-w-[220px] items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
            {row.original.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.original.coverImage} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                بدون تصویر
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/content/articles/${row.original.id}`}
              className="line-clamp-2 font-medium text-primary hover:underline"
            >
              {row.original.title}
            </Link>
            <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">
              /{row.original.slug}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {row.original.isFeatured && (
                <Badge variant="default" className="text-[10px]">
                  ویژه
                </Badge>
              )}
              {row.original.isEditorsPick && (
                <Badge variant="outline" className="text-[10px]">
                  انتخاب سردبیر
                </Badge>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => (
        <Badge variant={ARTICLE_STATUS_VARIANT[row.original.status]}>
          {ARTICLE_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'workflowStage',
      header: 'گردش کار',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {WORKFLOW_STAGE_LABELS[row.original.workflowStage as keyof typeof WORKFLOW_STAGE_LABELS] ??
            row.original.workflowStage}
        </span>
      ),
    },
    {
      accessorKey: 'author.name',
      header: 'نویسنده',
      cell: ({ row }) => row.original.author.name ?? '—',
    },
    {
      accessorKey: 'category.name',
      header: 'دسته',
      cell: ({ row }) => row.original.category?.name ?? '—',
    },
    {
      accessorKey: '_count.pageViews',
      header: 'بازدید',
      cell: ({ row }) => formatNumber(row.original._count.pageViews),
    },
    {
      accessorKey: 'publishedAt',
      header: 'انتشار',
      cell: ({ row }) =>
        row.original.publishedAt ? formatJalali(row.original.publishedAt) : '—',
    },
    {
      accessorKey: 'updatedAt',
      header: 'به‌روزرسانی',
      cell: ({ row }) => formatJalali(row.original.updatedAt),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Link href={`/content/articles/${row.original.id}`}>
            <Button variant="ghost" size="sm">
              ویرایش
            </Button>
          </Link>
          {row.original.status === ArticleStatus.PUBLISHED && (
            <a href={getPublicArticleUrl(row.original.slug)} target="_blank" rel="noopener noreferrer">
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          label="همه مقالات"
          value={statusCounts.ALL ?? 0}
          active={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
        />
        <StatCard
          label="منتشرشده"
          value={statusCounts[ArticleStatus.PUBLISHED] ?? 0}
          active={statusFilter === ArticleStatus.PUBLISHED}
          onClick={() => setStatusFilter(ArticleStatus.PUBLISHED)}
        />
        <StatCard
          label="پیش‌نویس"
          value={statusCounts[ArticleStatus.DRAFT] ?? 0}
          active={statusFilter === ArticleStatus.DRAFT}
          onClick={() => setStatusFilter(ArticleStatus.DRAFT)}
        />
        <StatCard
          label="در بازبینی"
          value={statusCounts[ArticleStatus.IN_REVIEW] ?? 0}
          active={statusFilter === ArticleStatus.IN_REVIEW}
          onClick={() => setStatusFilter(ArticleStatus.IN_REVIEW)}
        />
        <StatCard
          label="زمان‌بندی"
          value={statusCounts[ArticleStatus.SCHEDULED] ?? 0}
          active={statusFilter === ArticleStatus.SCHEDULED}
          onClick={() => setStatusFilter(ArticleStatus.SCHEDULED)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground" htmlFor="categoryFilter">
          فیلتر دسته:
        </label>
        <select
          id="categoryFilter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">همه دسته‌ها</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground">
          {formatNumber(filtered.length)} مورد نمایش داده می‌شود
        </p>
        <ExportToolbar
          title="گزارش مقالات"
          subtitle="فهرست مقالات فیلترشده"
          filenameBase="articles-report"
          columns={[
            { key: 'title', header: 'عنوان', width: 28 },
            { key: 'status', header: 'وضعیت', width: 12 },
            { key: 'stage', header: 'مرحله', width: 14 },
            { key: 'category', header: 'دسته', width: 14 },
            { key: 'author', header: 'نویسنده', width: 14 },
            { key: 'views', header: 'بازدید', width: 10 },
            { key: 'publishedAt', header: 'انتشار', width: 14 },
          ]}
          rows={filtered.map((row) => ({
            title: row.title,
            status: ARTICLE_STATUS_LABELS[row.status],
            stage: WORKFLOW_STAGE_LABELS[row.workflowStage as keyof typeof WORKFLOW_STAGE_LABELS] ?? row.workflowStage,
            category: row.category?.name,
            author: row.author.name,
            views: row._count.pageViews,
            publishedAt: row.publishedAt ? formatJalali(row.publishedAt) : '',
          }))}
        />
      </div>

      <DataTable columns={columns} data={filtered} searchKey="title" searchPlaceholder="جستجوی عنوان..." />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف مقاله"
        description={`آیا از حذف «${deleteTarget?.title}» مطمئن هستید؟ این عمل قابل بازگشت نیست.`}
        confirmLabel="حذف"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
