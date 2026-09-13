'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IssueStatus } from '@vargah/database/enums';
import { Input, Label, Textarea, Select } from '@vargah/ui/components/input';
import { Card, CardContent } from '@vargah/ui/components/card';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';

import { createIssue, updateIssue } from '@/actions/issues';
import { IssueFileUpload } from '@/components/content/issue-file-upload';
import { IssueTocEditor } from '@/components/content/issue-toc-editor';
import { FieldMessage } from '@/components/ui/form/field-message';
import { JalaliDateTimeField } from '@/components/ui/form/jalali-datetime-field';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { isNextRedirect } from '@/lib/action-state';
import { ISSUE_STATUS_LABELS, getPublicIssueUrl } from '@/lib/issues/constants';
import { issueFormSchema, type IssueFormValues } from '@/lib/schemas/issue-form';

type ArticleOption = { id: string; title: string; readingTime: number };

type IssueFormProps = {
  mode: 'create' | 'edit';
  issueId?: string;
  defaultValues?: Partial<IssueFormValues> & { slug?: string };
  articles: ArticleOption[];
};

export function IssueForm({ mode, issueId, defaultValues, articles }: IssueFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueFormSchema) as import('react-hook-form').Resolver<IssueFormValues>,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      number: defaultValues?.number ?? 1,
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      pageCount: defaultValues?.pageCount ?? 0,
      status: defaultValues?.status ?? IssueStatus.DRAFT,
      publishedAt: defaultValues?.publishedAt ?? '',
      pdfUrl: defaultValues?.pdfUrl ?? '',
      coverImage: defaultValues?.coverImage ?? '',
      tableOfContents: defaultValues?.tableOfContents ?? [],
    },
  });

  const issueNumber = watch('number');
  const pdfUrl = watch('pdfUrl');
  const coverImage = watch('coverImage');
  const status = watch('status');
  const toc = watch('tableOfContents');

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    const formData = new FormData();
    formData.set('number', String(values.number));
    formData.set('title', values.title);
    formData.set('description', values.description ?? '');
    formData.set('pageCount', String(values.pageCount));
    formData.set('status', values.status);
    formData.set('publishedAt', values.publishedAt ?? '');
    formData.set('pdfUrl', values.pdfUrl ?? '');
    formData.set('coverImage', values.coverImage ?? '');
    formData.set('tableOfContents', JSON.stringify(values.tableOfContents));

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createIssue(formData);
        } else if (issueId) {
          await updateIssue(issueId, formData);
          router.refresh();
        }
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setServerError(err instanceof Error ? err.message : 'ذخیره ناموفق بود');
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
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm font-semibold">اطلاعات شماره</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="number" required>
                    شماره
                  </Label>
                  <Input
                    id="number"
                    type="number"
                    min={1}
                    disabled={isPending}
                    className="mt-2 rounded-xl"
                    aria-invalid={Boolean(errors.number)}
                    {...register('number')}
                  />
                  <FieldMessage message={errors.number?.message} />
                </div>
                <div>
                  <Label htmlFor="pageCount">تعداد صفحات</Label>
                  <Input
                    id="pageCount"
                    type="number"
                    min={0}
                    disabled={isPending}
                    className="mt-2 rounded-xl"
                    {...register('pageCount')}
                  />
                  <FieldMessage message={errors.pageCount?.message} />
                </div>
              </div>

              <div>
                <Label htmlFor="title" required>
                  عنوان شماره
                </Label>
                <Input
                  id="title"
                  disabled={isPending}
                  placeholder="مثال: شماره ۱۳ — ویژه‌نامه اقتصاد"
                  className="mt-2 rounded-xl"
                  aria-invalid={Boolean(errors.title)}
                  {...register('title')}
                />
                <FieldMessage message={errors.title?.message} />
              </div>

              <div>
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  rows={3}
                  disabled={isPending}
                  className="mt-2 rounded-xl"
                  {...register('description')}
                />
                <FieldMessage message={errors.description?.message} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm font-semibold">فایل‌ها</p>
              <Controller
                name="pdfUrl"
                control={control}
                render={({ field }) => (
                  <IssueFileUpload
                    type="pdf"
                    issueNumber={Number(issueNumber) || 0}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    disabled={isPending}
                    error={errors.pdfUrl?.message}
                  />
                )}
              />
              <Controller
                name="coverImage"
                control={control}
                render={({ field }) => (
                  <IssueFileUpload
                    type="cover"
                    issueNumber={Number(issueNumber) || 0}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    disabled={isPending}
                    error={errors.coverImage?.message}
                  />
                )}
              />
            </CardContent>
          </Card>

          <Controller
            name="tableOfContents"
            control={control}
            render={({ field }) => (
              <IssueTocEditor
                entries={field.value}
                articles={articles}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm font-semibold">انتشار</p>

              <div>
                <Label htmlFor="status">وضعیت</Label>
                <Select id="status" disabled={isPending} className="mt-2" {...register('status')}>
                  {Object.entries(ISSUE_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <Controller
                name="publishedAt"
                control={control}
                render={({ field }) => (
                  <JalaliDateTimeField
                    id="publishedAt"
                    label="تاریخ انتشار"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    disabled={isPending}
                    hint={
                      status === IssueStatus.SCHEDULED
                        ? 'برای زمان‌بندی، تاریخ آینده انتخاب کنید.'
                        : 'در صورت خالی بودن، هنگام انتشار خودکار تنظیم می‌شود.'
                    }
                  />
                )}
              />

              <div className="flex flex-wrap gap-2">
                <LoadingButton
                  type="submit"
                  className="rounded-xl"
                  loading={isPending}
                  loadingText="در حال ذخیره..."
                >
                  {mode === 'create' ? 'ایجاد شماره' : 'ذخیره تغییرات'}
                </LoadingButton>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={isPending}
                  onClick={() => router.push('/content/issues')}
                >
                  انصراف
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="space-y-3 pt-6 text-sm">
              <p className="font-semibold">خلاصه</p>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  وضعیت: <Badge variant="outline">{ISSUE_STATUS_LABELS[status]}</Badge>
                </p>
                <p>فهرست: {toc.length} آیتم</p>
                <p>PDF: {pdfUrl ? '✓' : '—'}</p>
                <p>کاور: {coverImage ? '✓' : '—'}</p>
              </div>
              {mode === 'edit' && defaultValues?.slug && status === IssueStatus.PUBLISHED && (
                <a
                  href={getPublicIssueUrl(defaultValues.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-primary hover:underline"
                >
                  مشاهده در سایت
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
