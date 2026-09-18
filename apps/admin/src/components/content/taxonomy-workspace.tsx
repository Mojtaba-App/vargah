'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSlug } from '@vargah/seo/slug';
import type { ColumnDef } from '@tanstack/react-table';
import { Input, Label, Textarea, Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/feedback/confirm-dialog';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { FieldMessage } from '@/components/ui/form/field-message';
import {
  createCategory,
  createTag,
  deleteCategory,
  deleteTag,
  updateCategory,
  updateTag,
} from '@/actions/categories';
import {
  categoryFormSchema,
  tagFormSchema,
  type CategoryFormValues,
  type TagFormValues,
} from '@/lib/schemas/taxonomy-form';
import { formatJalaliDate } from '@/lib/date/jalali';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  updatedAt: Date;
  parent: { name: string } | null;
  _count: { articles: number; children: number };
};

type TagRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  _count: { articles: number };
};

type TaxonomyWorkspaceProps = {
  categories: CategoryRow[];
  tags: TagRow[];
};

type Tab = 'categories' | 'tags';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card rounded-2xl p-4">
      <p className="text-2xl font-bold tabular-nums">{formatNumber(value)}</p>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </div>
  );
}

export function TaxonomyWorkspace({ categories, tags }: TaxonomyWorkspaceProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('categories');
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [editingTag, setEditingTag] = useState<TagRow | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<CategoryRow | null>(null);
  const [deleteTagTarget, setDeleteTagTarget] = useState<TagRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parentOptions = useMemo(
    () => categories.filter((c) => c.id !== editingCategory?.id),
    [categories, editingCategory?.id],
  );

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(
      categoryFormSchema,
    ) as import('react-hook-form').Resolver<CategoryFormValues>,
    defaultValues: { name: '', slug: '', description: '', parentId: '', sortOrder: 0 },
  });

  const tagForm = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema) as import('react-hook-form').Resolver<TagFormValues>,
    defaultValues: { name: '', slug: '' },
  });

  const resetCategoryForm = (row?: CategoryRow | null) => {
    if (row) {
      categoryForm.reset({
        name: row.name,
        slug: row.slug,
        description: row.description ?? '',
        parentId: row.parentId ?? '',
        sortOrder: row.sortOrder,
      });
      setEditingCategory(row);
    } else {
      categoryForm.reset({ name: '', slug: '', description: '', parentId: '', sortOrder: 0 });
      setEditingCategory(null);
    }
    setError(null);
    setMessage(null);
  };

  const resetTagForm = (row?: TagRow | null) => {
    if (row) {
      tagForm.reset({ name: row.name, slug: row.slug });
      setEditingTag(row);
    } else {
      tagForm.reset({ name: '', slug: '' });
      setEditingTag(null);
    }
    setError(null);
    setMessage(null);
  };

  const submitCategory = categoryForm.handleSubmit((values) => {
    const formData = new FormData();
    formData.set('name', values.name);
    formData.set('slug', values.slug ?? '');
    formData.set('description', values.description ?? '');
    formData.set('parentId', values.parentId ?? '');
    formData.set('sortOrder', String(values.sortOrder ?? 0));

    startTransition(async () => {
      try {
        if (editingCategory) {
          await updateCategory(editingCategory.id, formData);
          setMessage('دسته‌بندی به‌روزرسانی شد.');
        } else {
          await createCategory(formData);
          setMessage('دسته‌بندی ایجاد شد.');
          resetCategoryForm(null);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ذخیره ناموفق بود');
      }
    });
  });

  const submitTag = tagForm.handleSubmit((values) => {
    const formData = new FormData();
    formData.set('name', values.name);
    formData.set('slug', values.slug ?? '');

    startTransition(async () => {
      try {
        if (editingTag) {
          await updateTag(editingTag.id, formData);
          setMessage('برچسب به‌روزرسانی شد.');
        } else {
          await createTag(formData);
          setMessage('برچسب ایجاد شد.');
          resetTagForm(null);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ذخیره ناموفق بود');
      }
    });
  });

  const handleDeleteCategory = () => {
    if (!deleteCategoryTarget) return;
    startTransition(async () => {
      try {
        await deleteCategory(deleteCategoryTarget.id);
        setDeleteCategoryTarget(null);
        if (editingCategory?.id === deleteCategoryTarget.id) resetCategoryForm(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حذف ناموفق بود');
        setDeleteCategoryTarget(null);
      }
    });
  };

  const handleDeleteTag = () => {
    if (!deleteTagTarget) return;
    startTransition(async () => {
      try {
        await deleteTag(deleteTagTarget.id);
        setDeleteTagTarget(null);
        if (editingTag?.id === deleteTagTarget.id) resetTagForm(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حذف ناموفق بود');
        setDeleteTagTarget(null);
      }
    });
  };

  const categoryColumns: ColumnDef<CategoryRow>[] = [
    {
      accessorKey: 'name',
      header: 'دسته',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-muted-foreground text-xs" dir="ltr">
            /{row.original.slug}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'parent.name',
      header: 'والد',
      cell: ({ row }) => row.original.parent?.name ?? '—',
    },
    {
      accessorKey: 'sortOrder',
      header: 'ترتیب',
    },
    {
      accessorKey: '_count.articles',
      header: 'مقالات',
      cell: ({ row }) => formatNumber(row.original._count.articles),
    },
    {
      accessorKey: 'updatedAt',
      header: 'به‌روزرسانی',
      cell: ({ row }) => formatJalaliDate(row.original.updatedAt),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTab('categories');
              resetCategoryForm(row.original);
            }}
          >
            ویرایش
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setDeleteCategoryTarget(row.original)}
          >
            حذف
          </Button>
        </div>
      ),
    },
  ];

  const tagColumns: ColumnDef<TagRow>[] = [
    {
      accessorKey: 'name',
      header: 'برچسب',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-muted-foreground text-xs" dir="ltr">
            /{row.original.slug}
          </p>
        </div>
      ),
    },
    {
      accessorKey: '_count.articles',
      header: 'مقالات',
      cell: ({ row }) => formatNumber(row.original._count.articles),
    },
    {
      accessorKey: 'createdAt',
      header: 'ایجاد',
      cell: ({ row }) => formatJalaliDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTab('tags');
              resetTagForm(row.original);
            }}
          >
            ویرایش
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setDeleteTagTarget(row.original)}
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

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="دسته‌بندی‌ها" value={categories.length} />
        <StatCard label="برچسب‌ها" value={tags.length} />
        <StatCard
          label="مقالات دسته‌بندی‌شده"
          value={categories.reduce((sum, c) => sum + c._count.articles, 0)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={tab === 'categories' ? 'default' : 'outline'}
          className="rounded-xl"
          onClick={() => setTab('categories')}
        >
          دسته‌بندی‌ها
          <Badge variant="secondary" className="ms-2">
            {categories.length}
          </Badge>
        </Button>
        <Button
          type="button"
          variant={tab === 'tags' ? 'default' : 'outline'}
          className="rounded-xl"
          onClick={() => setTab('tags')}
        >
          برچسب‌ها
          <Badge variant="secondary" className="ms-2">
            {tags.length}
          </Badge>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl xl:sticky xl:top-4 xl:self-start">
          <CardContent className="space-y-4 pt-6">
            {tab === 'categories' ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{editingCategory ? 'ویرایش دسته' : 'دسته جدید'}</p>
                  {editingCategory && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => resetCategoryForm(null)}
                    >
                      انصراف
                    </Button>
                  )}
                </div>
                <form onSubmit={submitCategory} noValidate className="space-y-3">
                  <div>
                    <Label required>نام</Label>
                    <Input
                      className="mt-2 rounded-xl"
                      {...categoryForm.register('name', {
                        onBlur: (e) => {
                          if (!categoryForm.getValues('slug')) {
                            categoryForm.setValue('slug', createSlug(e.target.value, 'latin'));
                          }
                        },
                      })}
                    />
                    <FieldMessage message={categoryForm.formState.errors.name?.message} />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input
                      className="mt-2 rounded-xl"
                      dir="ltr"
                      {...categoryForm.register('slug')}
                    />
                    <FieldMessage message={categoryForm.formState.errors.slug?.message} />
                  </div>
                  <div>
                    <Label>توضیح</Label>
                    <Textarea
                      rows={2}
                      className="mt-2 rounded-xl"
                      {...categoryForm.register('description')}
                    />
                  </div>
                  <div>
                    <Label>دسته والد</Label>
                    <Select className="mt-2" {...categoryForm.register('parentId')}>
                      <option value="">بدون والد (ریشه)</option>
                      {parentOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>ترتیب نمایش</Label>
                    <Input
                      type="number"
                      min={0}
                      className="mt-2 rounded-xl"
                      {...categoryForm.register('sortOrder')}
                    />
                  </div>
                  <LoadingButton type="submit" loading={isPending} className="w-full rounded-xl">
                    {editingCategory ? 'ذخیره دسته' : 'افزودن دسته'}
                  </LoadingButton>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{editingTag ? 'ویرایش برچسب' : 'برچسب جدید'}</p>
                  {editingTag && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => resetTagForm(null)}
                    >
                      انصراف
                    </Button>
                  )}
                </div>
                <form onSubmit={submitTag} noValidate className="space-y-3">
                  <div>
                    <Label required>نام</Label>
                    <Input
                      className="mt-2 rounded-xl"
                      {...tagForm.register('name', {
                        onBlur: (e) => {
                          if (!tagForm.getValues('slug')) {
                            tagForm.setValue('slug', createSlug(e.target.value, 'latin'));
                          }
                        },
                      })}
                    />
                    <FieldMessage message={tagForm.formState.errors.name?.message} />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input className="mt-2 rounded-xl" dir="ltr" {...tagForm.register('slug')} />
                    <FieldMessage message={tagForm.formState.errors.slug?.message} />
                  </div>
                  <LoadingButton type="submit" loading={isPending} className="w-full rounded-xl">
                    {editingTag ? 'ذخیره برچسب' : 'افزودن برچسب'}
                  </LoadingButton>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <div className={cn('xl:col-span-2', tab === 'categories' ? 'block' : 'hidden')}>
          <DataTable
            columns={categoryColumns}
            data={categories}
            searchKey="name"
            searchPlaceholder="جستجوی دسته..."
          />
        </div>
        <div className={cn('xl:col-span-2', tab === 'tags' ? 'block' : 'hidden')}>
          <DataTable
            columns={tagColumns}
            data={tags}
            searchKey="name"
            searchPlaceholder="جستجوی برچسب..."
          />
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteCategoryTarget)}
        title="حذف دسته"
        description={`آیا از حذف «${deleteCategoryTarget?.name}» مطمئن هستید؟`}
        confirmLabel="حذف"
        variant="destructive"
        loading={isPending}
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteCategoryTarget(null)}
      />
      <ConfirmDialog
        open={Boolean(deleteTagTarget)}
        title="حذف برچسب"
        description={`آیا از حذف «${deleteTagTarget?.name}» مطمئن هستید؟`}
        confirmLabel="حذف"
        variant="destructive"
        loading={isPending}
        onConfirm={handleDeleteTag}
        onCancel={() => setDeleteTagTarget(null)}
      />
    </div>
  );
}
