'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArticleStatus } from '@vargah/database/enums';
import { Input, Label, Textarea, Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Card, CardContent } from '@vargah/ui/components/card';
import { Badge } from '@vargah/ui/components/badge';
import { estimateReadingMinutes, formatReadingTimeLabel } from '@vargah/business/reading-time';

import { ArticleImageField } from '@/components/content/article-image-field';
import { ArticleSeoSection } from '@/components/content/article-seo-section';
import type { MediaPickerAsset } from '@/components/content/media-picker-dialog';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { buildArticleFormData } from '@/components/content/article-form';
import { deleteArticle, updateArticle } from '@/actions/articles';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { ConfirmDialog } from '@/components/ui/feedback/confirm-dialog';
import { FieldMessage } from '@/components/ui/form/field-message';
import { JalaliDateTimeField } from '@/components/ui/form/jalali-datetime-field';
import { isNextRedirect } from '@/lib/action-state';
import {
  ARTICLE_STATUS_LABELS,
  ARTICLE_STATUS_OPTIONS,
  ARTICLE_STATUS_VARIANT,
  WORKFLOW_STAGE_LABELS,
  getPublicArticleUrl,
} from '@/lib/articles/constants';
import {
  articleUpdateFormSchema,
  type ArticleCreateFormValues,
  type ArticleUpdateFormValues,
} from '@/lib/schemas/article-form';
import { formatJalali, formatNumber } from '@/lib/utils';

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: ArticleStatus;
  workflowStage: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  coverImage: string | null;
  categoryId: string | null;
  isFeatured: boolean;
  isEditorsPick: boolean;
  readingTime: number;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type Version = {
  id: string;
  version: number;
  note: string | null;
  createdAt: Date;
  author: { name: string | null };
};

type Category = { id: string; name: string };

export function ArticleEditForm({
  article,
  categories,
  versions,
  canDelete,
  mediaAssets,
}: {
  article: Article;
  categories: Category[];
  versions: Version[];
  canDelete: boolean;
  mediaAssets: MediaPickerAsset[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [seoOpen, setSeoOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ArticleUpdateFormValues>({
    resolver: zodResolver(articleUpdateFormSchema),
    mode: 'onTouched',
    defaultValues: {
      title: article.title,
      excerpt: article.excerpt ?? '',
      content: article.content,
      categoryId: article.categoryId ?? '',
      coverImage: article.coverImage ?? '',
      metaTitle: article.metaTitle ?? '',
      metaDescription: article.metaDescription ?? '',
      ogImage: article.ogImage ?? '',
      scheduledAt: article.scheduledAt?.toISOString() ?? '',
      status: article.status,
      isFeatured: article.isFeatured,
      isEditorsPick: article.isEditorsPick,
    },
  });

  useEffect(() => {
    reset({
      title: article.title,
      excerpt: article.excerpt ?? '',
      content: article.content,
      categoryId: article.categoryId ?? '',
      coverImage: article.coverImage ?? '',
      metaTitle: article.metaTitle ?? '',
      metaDescription: article.metaDescription ?? '',
      ogImage: article.ogImage ?? '',
      scheduledAt: article.scheduledAt?.toISOString() ?? '',
      status: article.status,
      isFeatured: article.isFeatured,
      isEditorsPick: article.isEditorsPick,
    });
  }, [article, reset]);

  const title = watch('title');
  const content = watch('content');
  const excerpt = watch('excerpt');
  const coverImage = watch('coverImage');
  const metaTitle = watch('metaTitle');
  const metaDescription = watch('metaDescription');
  const ogImage = watch('ogImage');
  const status = watch('status');

  const readingMinutes = useMemo(() => estimateReadingMinutes(content), [content]);

  const onSubmit = handleSubmit((values) => {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await updateArticle(article.id, buildArticleFormData(values));
        setMessage('تغییرات مقاله با موفقیت ذخیره شد.');
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setError(err instanceof Error ? err.message : 'ذخیره تغییرات ناموفق بود');
      }
    });
  });

  const handleDelete = () => {
    startDelete(async () => {
      await deleteArticle(article.id);
      router.push('/content/articles');
      router.refresh();
    });
  };

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="grid gap-6 xl:grid-cols-3">
        {message && <StatusBanner type="success" message={message} className="xl:col-span-3" />}
        {error && <StatusBanner type="error" message={error} className="xl:col-span-3" />}

        <div className="space-y-6 xl:col-span-2">
          <Card className="rounded-2xl">
            <CardContent className="space-y-5 pt-6">
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label htmlFor="title" required>
                    عنوان مقاله
                  </Label>
                  <span className="text-muted-foreground text-xs">{title?.length ?? 0}/300</span>
                </div>
                <Input
                  id="title"
                  disabled={isPending}
                  className="rounded-xl text-lg"
                  aria-invalid={Boolean(errors.title)}
                  {...register('title')}
                />
                <FieldMessage message={errors.title?.message} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label htmlFor="excerpt">خلاصه / لید</Label>
                  <span className="text-muted-foreground text-xs">{excerpt?.length ?? 0}/1000</span>
                </div>
                <Textarea
                  id="excerpt"
                  rows={3}
                  disabled={isPending}
                  className="rounded-xl"
                  aria-invalid={Boolean(errors.excerpt)}
                  {...register('excerpt')}
                />
                <FieldMessage message={errors.excerpt?.message} />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <Label required>محتوای مقاله</Label>
                  <Badge variant="secondary" className="text-xs">
                    {formatReadingTimeLabel(readingMinutes)}
                  </Badge>
                </div>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      content={field.value}
                      onChange={field.onChange}
                      disabled={isPending}
                      mediaAssets={mediaAssets}
                    />
                  )}
                />
                <FieldMessage message={errors.content?.message} />
              </div>
            </CardContent>
          </Card>

          <ArticleSeoSection
            open={seoOpen}
            onToggle={() => setSeoOpen((v) => !v)}
            register={register as unknown as UseFormRegister<ArticleCreateFormValues>}
            errors={errors}
            disabled={isPending}
            mediaAssets={mediaAssets}
            previewTitle={metaTitle || title || ''}
            previewDescription={metaDescription || excerpt || ''}
            coverImage={coverImage ?? ''}
            ogImage={ogImage ?? ''}
            onOgImageChange={(url) => setValue('ogImage', url)}
          />
        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm font-semibold">انتشار</p>

              <div>
                <Label htmlFor="status">وضعیت</Label>
                <Select
                  id="status"
                  disabled={isPending}
                  className="mt-2 rounded-xl"
                  {...register('status')}
                >
                  {ARTICLE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="categoryId">دسته‌بندی</Label>
                <Select
                  id="categoryId"
                  disabled={isPending}
                  className="mt-2 rounded-xl"
                  {...register('categoryId')}
                >
                  <option value="">بدون دسته</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>

              <Controller
                name="scheduledAt"
                control={control}
                render={({ field }) => (
                  <JalaliDateTimeField
                    id="scheduledAt"
                    label="زمان‌بندی انتشار"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" disabled={isPending} {...register('isFeatured')} />
                مقاله ویژه
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" disabled={isPending} {...register('isEditorsPick')} />
                انتخاب سردبیر
              </label>

              <LoadingButton
                type="submit"
                size="lg"
                className="w-full rounded-xl"
                loading={isPending}
                loadingText="در حال ذخیره..."
              >
                ذخیره تغییرات
              </LoadingButton>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <Controller
                name="coverImage"
                control={control}
                render={({ field }) => (
                  <ArticleImageField
                    label="تصویر کاور"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    disabled={isPending}
                    error={errors.coverImage?.message}
                    hint="نسبت ۱۶:۹ پیشنهاد می‌شود (حدود ۱۲۰۰×۶۷۵). در صفحه اصلی، آرشیو و کارت مقالات نمایش داده می‌شود."
                    mediaAssets={mediaAssets}
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="space-y-3 pt-6 text-sm">
              <h3 className="font-semibold">اطلاعات مقاله</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant={ARTICLE_STATUS_VARIANT[status]}>
                  {ARTICLE_STATUS_LABELS[status]}
                </Badge>
                <Badge variant="outline">
                  {WORKFLOW_STAGE_LABELS[
                    article.workflowStage as keyof typeof WORKFLOW_STAGE_LABELS
                  ] ?? article.workflowStage}
                </Badge>
              </div>
              <dl className="text-muted-foreground space-y-2">
                <div className="flex justify-between gap-3">
                  <dt>Slug</dt>
                  <dd dir="ltr" className="text-foreground">
                    {article.slug}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>زمان مطالعه</dt>
                  <dd className="text-foreground">{formatReadingTimeLabel(readingMinutes)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>ایجاد</dt>
                  <dd className="text-foreground">{formatJalali(article.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>به‌روزرسانی</dt>
                  <dd className="text-foreground">{formatJalali(article.updatedAt)}</dd>
                </div>
                {article.publishedAt && (
                  <div className="flex justify-between gap-3">
                    <dt>انتشار</dt>
                    <dd className="text-foreground">{formatJalali(article.publishedAt)}</dd>
                  </div>
                )}
              </dl>
              {status === ArticleStatus.PUBLISHED && (
                <a
                  href={getPublicArticleUrl(article.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex text-sm hover:underline"
                >
                  مشاهده در سایت
                </a>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <h3 className="mb-3 font-semibold">تاریخچه نسخه‌ها</h3>
              <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
                {versions.map((version) => (
                  <li key={version.id} className="border-border rounded-lg border p-2">
                    <p className="font-medium">نسخه {formatNumber(version.version)}</p>
                    <p className="text-muted-foreground">
                      {version.author.name ?? '—'} — {formatJalali(version.createdAt)}
                    </p>
                    {version.note && (
                      <p className="text-muted-foreground text-xs">{version.note}</p>
                    )}
                  </li>
                ))}
                {versions.length === 0 && (
                  <p className="text-muted-foreground">نسخه‌ای ثبت نشده.</p>
                )}
              </ul>
            </CardContent>
          </Card>

          {canDelete && (
            <Card className="border-destructive/30 rounded-2xl">
              <CardContent className="space-y-3 pt-6">
                <h3 className="text-destructive font-semibold">منطقه خطر</h3>
                <p className="text-muted-foreground text-sm">حذف دائمی مقاله و تمام نسخه‌های آن.</p>
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-xl"
                  onClick={() => setConfirmDelete(true)}
                >
                  حذف مقاله
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="حذف مقاله"
        description={`آیا از حذف «${article.title}» مطمئن هستید؟`}
        confirmLabel="حذف"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
