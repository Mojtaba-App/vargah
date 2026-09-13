'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { Input, Label, Textarea } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';
import { DataTable } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/search-input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ConfirmDialog } from '@/components/ui/feedback/confirm-dialog';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { FieldHint, FieldMessage } from '@/components/ui/form/field-message';
import { deleteMediaAsset, updateMediaAsset } from '@/actions/media';
import { MediaUploadZone, type UploadedMedia } from '@/components/content/media-upload-zone';
import {
  formatFileSize,
  getMediaCategory,
  isImageMime,
  MEDIA_TYPE_LABELS,
  parseTagsInput,
  type MediaTypeFilter,
} from '@/lib/media/constants';
import { mediaUpdateSchema, type MediaUpdateValues } from '@/lib/schemas/media-form';
import { formatJalali, formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type MediaRow = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt: string | null;
  tags: string[];
  uploadedBy: string | null;
  createdAt: Date;
};

type MediaWorkspaceProps = {
  assets: MediaRow[];
};

type ViewMode = 'grid' | 'list';

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
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
      <p className="text-2xl font-bold tabular-nums">{typeof value === 'number' ? formatNumber(value) : value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Comp>
  );
}

function MediaPreview({ asset, className }: { asset: MediaRow; className?: string }) {
  if (isImageMime(asset.mimeType)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={asset.url} alt={asset.alt ?? asset.originalName} className={cn('object-cover', className)} />
    );
  }
  return (
    <div className={cn('flex items-center justify-center bg-muted text-2xl', className)}>
      {asset.mimeType === 'application/pdf' ? '📄' : '📎'}
    </div>
  );
}

export function MediaWorkspace({ assets: initialAssets }: MediaWorkspaceProps) {
  const router = useRouter();
  const [assets, setAssets] = useState(initialAssets);
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>('ALL');

  useEffect(() => {
    setAssets(initialAssets);
  }, [initialAssets]);
  const [tagFilter, setTagFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<MediaRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const asset of assets) {
      for (const tag of asset.tags) tagSet.add(tag);
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [assets]);

  const stats = useMemo(() => {
    const images = assets.filter((a) => getMediaCategory(a.mimeType) === 'IMAGE').length;
    const documents = assets.filter((a) => getMediaCategory(a.mimeType) === 'DOCUMENT').length;
    const totalSize = assets.reduce((sum, a) => sum + a.size, 0);
    return { total: assets.length, images, documents, totalSize };
  }, [assets]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return assets.filter((asset) => {
      if (typeFilter !== 'ALL' && getMediaCategory(asset.mimeType) !== typeFilter) return false;
      if (tagFilter !== 'ALL' && !asset.tags.includes(tagFilter)) return false;
      if (!q) return true;
      const haystack = [
        asset.originalName,
        asset.filename,
        asset.alt ?? '',
        asset.mimeType,
        ...asset.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [assets, typeFilter, tagFilter, debouncedSearch]);

  const editForm = useForm<MediaUpdateValues>({
    resolver: zodResolver(mediaUpdateSchema) as import('react-hook-form').Resolver<MediaUpdateValues>,
    defaultValues: { alt: '', tags: [] },
  });

  const openEditor = (asset: MediaRow) => {
    setSelected(asset);
    setCopied(false);
    setError(null);
    editForm.reset({
      alt: asset.alt ?? '',
      tags: asset.tags,
    });
  };

  const handleUploaded = (uploaded: UploadedMedia) => {
    const row: MediaRow = {
      id: uploaded.id,
      filename: uploaded.url.split('/').pop()?.split('?')[0] ?? uploaded.originalName,
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      url: uploaded.url,
      alt: uploaded.alt,
      tags: uploaded.tags,
      uploadedBy: null,
      createdAt: new Date(uploaded.createdAt),
    };
    setAssets((prev) => [row, ...prev]);
    setMessage(`«${uploaded.originalName}» آپلود شد.`);
    openEditor(row);
    router.refresh();
  };

  const saveMetadata = editForm.handleSubmit((values) => {
    if (!selected) return;
    const formData = new FormData();
    formData.set('alt', values.alt ?? '');
    formData.set('tags', JSON.stringify(values.tags ?? []));

    startTransition(async () => {
      try {
        await updateMediaAsset(selected.id, formData);
        const tags = values.tags ?? [];
        const alt = values.alt || null;
        setAssets((prev) =>
          prev.map((a) => (a.id === selected.id ? { ...a, alt, tags } : a)),
        );
        setSelected((prev) => (prev ? { ...prev, alt, tags } : prev));
        setMessage('اطلاعات فایل ذخیره شد.');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ذخیره ناموفق بود');
      }
    });
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteMediaAsset(deleteTarget.id);
        setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        if (selected?.id === deleteTarget.id) setSelected(null);
        setDeleteTarget(null);
        setMessage('فایل حذف شد.');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حذف ناموفق بود');
        setDeleteTarget(null);
      }
    });
  };

  const copyUrl = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('کپی لینک ناموفق بود');
    }
  };

  const tagsInputValue = (editForm.watch('tags') ?? []).join('، ');

  const columns: ColumnDef<MediaRow>[] = [
    {
      accessorKey: 'originalName',
      header: 'فایل',
      cell: ({ row }) => (
        <button type="button" className="flex items-center gap-2 text-start" onClick={() => openEditor(row.original)}>
          <MediaPreview asset={row.original} className="h-10 w-10 rounded-lg" />
          <span className="font-medium">{row.original.originalName}</span>
        </button>
      ),
    },
    { accessorKey: 'mimeType', header: 'نوع' },
    {
      accessorKey: 'size',
      header: 'حجم',
      cell: ({ row }) => formatFileSize(row.original.size),
    },
    {
      accessorKey: 'tags',
      header: 'برچسب‌ها',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.tags.length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            row.original.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'تاریخ',
      cell: ({ row }) => formatJalali(row.original.createdAt),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditor(row.original)}>
            ویرایش
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setDeleteTarget(row.original)}
          >
            حذف
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {message && <StatusBanner type="success" message={message} />}
      {error && <StatusBanner type="error" message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="کل فایل‌ها" value={stats.total} active={typeFilter === 'ALL'} onClick={() => setTypeFilter('ALL')} />
        <StatCard
          label="تصاویر"
          value={stats.images}
          active={typeFilter === 'IMAGE'}
          onClick={() => setTypeFilter('IMAGE')}
        />
        <StatCard
          label="اسناد"
          value={stats.documents}
          active={typeFilter === 'DOCUMENT'}
          onClick={() => setTypeFilter('DOCUMENT')}
        />
        <StatCard label="فضای مصرفی" value={formatFileSize(stats.totalSize)} />
      </div>

      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <p className="mb-4 font-semibold">آپلود فایل جدید</p>
          <MediaUploadZone onUploaded={handleUploaded} disabled={isPending} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'IMAGE', 'DOCUMENT', 'OTHER'] as MediaTypeFilter[]).map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={typeFilter === type ? 'default' : 'outline'}
              className="rounded-xl"
              onClick={() => setTypeFilter(type)}
            >
              {MEDIA_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            className="rounded-xl"
            onClick={() => setViewMode('grid')}
          >
            شبکه
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'outline'}
            className="rounded-xl"
            onClick={() => setViewMode('list')}
          >
            لیست
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          id="media-search"
          placeholder="جستجو در نام، alt، برچسب و نوع..."
          value={search}
          onChange={setSearch}
          aria-label="جستجوی رسانه"
        />
        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            aria-label="فیلتر برچسب"
          >
            <option value="ALL">همه برچسب‌ها</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className={cn('space-y-4', selected ? 'xl:col-span-2' : 'xl:col-span-3')}>
          {filtered.length === 0 ? (
            <div className="surface-card rounded-2xl p-12 text-center text-muted-foreground">
              {assets.length === 0 ? 'هنوز فایلی آپلود نشده است.' : 'نتیجه‌ای یافت نشد.'}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((asset) => (
                <div
                  key={asset.id}
                  className={cn(
                    'surface-card overflow-hidden rounded-2xl transition-colors',
                    selected?.id === asset.id && 'border-primary ring-1 ring-primary/20',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openEditor(asset)}
                    className="w-full text-start hover:bg-muted/20"
                  >
                    <MediaPreview asset={asset} className="aspect-video w-full" />
                    <div className="space-y-2 p-3 pb-2">
                      <p className="truncate text-sm font-medium">{asset.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(asset.size)} · {formatJalali(asset.createdAt)}
                      </p>
                      {asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {asset.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{asset.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 border-t border-border/60 px-2 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex-1 rounded-lg"
                      onClick={() => openEditor(asset)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex-1 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget(asset)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} showSearch={false} />
          )}
        </div>

        {selected && (
          <Card className="rounded-2xl xl:sticky xl:top-4 xl:self-start">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">جزئیات فایل</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  بستن
                </Button>
              </div>

              <MediaPreview asset={selected} className="aspect-video w-full rounded-xl" />

              <div className="space-y-1 text-sm">
                <p className="font-medium">{selected.originalName}</p>
                <p className="text-muted-foreground">{selected.mimeType}</p>
                <p className="text-muted-foreground">{formatFileSize(selected.size)}</p>
                <p className="text-muted-foreground">{formatJalali(selected.createdAt, true)}</p>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => void copyUrl()}>
                  {copied ? 'کپی شد ✓' : 'کپی لینک'}
                </Button>
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted"
                >
                  باز کردن
                </a>
              </div>

              <form onSubmit={saveMetadata} noValidate className="space-y-3">
                <div>
                  <Label>متن جایگزین (alt)</Label>
                  <Textarea rows={2} className="mt-2 rounded-xl" {...editForm.register('alt')} />
                  <FieldMessage message={editForm.formState.errors.alt?.message} />
                </div>
                <div>
                  <Label>برچسب‌ها</Label>
                  <Input
                    className="mt-2 rounded-xl"
                    value={tagsInputValue}
                    onChange={(e) => editForm.setValue('tags', parseTagsInput(e.target.value), { shouldDirty: true })}
                    placeholder="برچسب۱، برچسب۲"
                  />
                  <FieldHint>با ویرگول (،) جدا کنید — حداکثر ۲۰ برچسب</FieldHint>
                  <FieldMessage message={editForm.formState.errors.tags?.message} />
                </div>
                <LoadingButton type="submit" loading={isPending} className="w-full rounded-xl">
                  ذخیره اطلاعات
                </LoadingButton>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full rounded-xl"
                  disabled={isPending}
                  onClick={() => setDeleteTarget(selected)}
                >
                  حذف فایل
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف فایل"
        description={`آیا از حذف «${deleteTarget?.originalName}» مطمئن هستید؟ این عمل قابل بازگشت نیست.`}
        confirmLabel="حذف"
        variant="destructive"
        loading={isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
