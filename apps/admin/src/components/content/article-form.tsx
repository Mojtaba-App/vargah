'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Label, Textarea, Select } from '@vargah/ui/components/input';
import { Card, CardContent } from '@vargah/ui/components/card';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { estimateReadingMinutes, formatReadingTimeLabel } from '@vargah/business/reading-time';

import { createArticle } from '@/actions/articles';
import { ArticleImageField } from '@/components/content/article-image-field';
import { ArticleSeoSection } from '@/components/content/article-seo-section';
import type { MediaPickerAsset } from '@/components/content/media-picker-dialog';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { FieldMessage } from '@/components/ui/form/field-message';
import { JalaliDateTimeField } from '@/components/ui/form/jalali-datetime-field';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { isNextRedirect } from '@/lib/action-state';
import { articleCreateFormSchema, type ArticleCreateFormValues } from '@/lib/schemas/article-form';
import { cn } from '@/lib/utils';

type Category = { id: string; name: string };

export function ArticleForm({
  categories,
  mediaAssets,
}: {
  categories: Category[];
  mediaAssets: MediaPickerAsset[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [seoOpen, setSeoOpen] = useState(false);
  const [metaTitleTouched, setMetaTitleTouched] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<ArticleCreateFormValues>({
    resolver: zodResolver(articleCreateFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      categoryId: '',
      coverImage: '',
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
      scheduledAt: '',
      isFeatured: false,
      isEditorsPick: false,
    },
  });

  const title = watch('title');
  const content = watch('content');
  const excerpt = watch('excerpt');
  const coverImage = watch('coverImage');
  const metaTitle = watch('metaTitle');
  const metaDescription = watch('metaDescription');
  const ogImage = watch('ogImage');
  const scheduledAt = watch('scheduledAt');

  const readingMinutes = useMemo(() => estimateReadingMinutes(content), [content]);

  useEffect(() => {
    if (!metaTitleTouched && title) {
      setValue('metaTitle', title.slice(0, 200));
    }
  }, [title, metaTitleTouched, setValue]);

  useEffect(() => {
    if (!metaTitleTouched && !metaTitle && excerpt) {
      setValue('metaDescription', excerpt.slice(0, 500));
    }
  }, [excerpt, metaTitle, metaTitleTouched, setValue]);

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    const formData = buildArticleFormData(values);

    startTransition(async () => {
      try {
        await createArticle(formData);
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setServerError(err instanceof Error ? err.message : 'ذخیره مقاله ناموفق بود');
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {serverError && <StatusBanner type="error" message={serverError} />}
      {isSubmitted && Object.keys(errors).length > 0 && (
        <StatusBanner type="error" message="لطفاً خطاهای فرم را برطرف کنید." />
      )}

      <div className="grid gap-6 xl:grid-cols-3">
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
                  placeholder="عنوان جذاب و گویا برای خوانندگان..."
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
                  placeholder="۲–۳ جمله خلاصه — در لیست مقالات، کارت‌ها و نتایج جستجو نمایش داده می‌شود"
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
            register={register}
            errors={errors}
            disabled={isPending}
            mediaAssets={mediaAssets}
            previewTitle={metaTitle || title || ''}
            previewDescription={metaDescription || excerpt || ''}
            coverImage={coverImage ?? ''}
            ogImage={ogImage ?? ''}
            onOgImageChange={(url) => setValue('ogImage', url)}
            onMetaTitleChange={() => setMetaTitleTouched(true)}
          />
        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm font-semibold">انتشار</p>

              <div>
                <Label htmlFor="categoryId">دسته‌بندی</Label>
                <Select
                  id="categoryId"
                  disabled={isPending}
                  className="mt-2 rounded-xl"
                  {...register('categoryId')}
                >
                  <option value="">بدون دسته</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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
                    hint={
                      scheduledAt
                        ? 'مقاله به‌صورت زمان‌بندی‌شده ذخیره می‌شود.'
                        : 'خالی = پیش‌نویس (قابل انتشار بعدی)'
                    }
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
                className="w-full rounded-xl"
                size="lg"
                loading={isPending}
                loadingText="در حال ذخیره..."
              >
                {scheduledAt ? 'زمان‌بندی مقاله' : 'ذخیره پیش‌نویس'}
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
                    hint="نسبت ۱۶:۹ پیشنهاد می‌شود (حدود ۱۲۰۰×۶۷۵). JPG/PNG/WebP — از کتابخانه انتخاب یا آپلود کنید."
                    mediaAssets={mediaAssets}
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card className={cn('rounded-2xl border-dashed')}>
            <CardContent className="text-muted-foreground space-y-2 pt-6 text-sm">
              <p className="text-foreground font-medium">راهنمای سریع</p>
              <ul className="list-inside list-disc space-y-1">
                <li>زمان مطالعه بر اساس محتوا به‌صورت خودکار محاسبه می‌شود</li>
                <li>تصاویر را از کتابخانه رسانه انتخاب کنید</li>
                <li>پس از ذخیره به صفحه ویرایش منتقل می‌شوید</li>
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 rounded-xl"
                onClick={() => router.back()}
              >
                انصراف
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

export function buildArticleFormData(values: ArticleCreateFormValues & { status?: string }) {
  const formData = new FormData();
  formData.set('title', values.title);
  formData.set('excerpt', values.excerpt ?? '');
  formData.set('content', values.content);
  formData.set('categoryId', values.categoryId ?? '');
  formData.set('coverImage', values.coverImage ?? '');
  formData.set('metaTitle', values.metaTitle ?? '');
  formData.set('metaDescription', values.metaDescription ?? '');
  formData.set('ogImage', values.ogImage ?? '');
  if (values.scheduledAt) formData.set('scheduledAt', values.scheduledAt);
  if (values.status) formData.set('status', values.status);
  if (values.isFeatured) formData.set('isFeatured', 'on');
  if (values.isEditorsPick) formData.set('isEditorsPick', 'on');
  return formData;
}
