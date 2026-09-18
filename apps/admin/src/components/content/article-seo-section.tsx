'use client';

import { Input, Label, Textarea } from '@vargah/ui/components/input';
import { Card, CardContent } from '@vargah/ui/components/card';
import { FieldHint, FieldMessage } from '@/components/ui/form/field-message';
import { ArticleImageField } from '@/components/content/article-image-field';
import type { MediaPickerAsset } from '@/components/content/media-picker-dialog';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ArticleCreateFormValues } from '@/lib/schemas/article-form';

type ArticleSeoSectionProps = {
  open: boolean;
  onToggle: () => void;
  register: UseFormRegister<ArticleCreateFormValues>;
  errors: FieldErrors<ArticleCreateFormValues>;
  disabled?: boolean;
  mediaAssets: MediaPickerAsset[];
  previewTitle: string;
  previewDescription: string;
  coverImage: string;
  ogImage: string;
  onOgImageChange: (url: string) => void;
  onMetaTitleChange?: () => void;
};

export function ArticleSeoSection({
  open,
  onToggle,
  register,
  errors,
  disabled,
  mediaAssets,
  previewTitle,
  previewDescription,
  coverImage,
  ogImage,
  onOgImageChange,
  onMetaTitleChange,
}: ArticleSeoSectionProps) {
  const displayTitle = previewTitle.trim() || 'عنوان مقاله در نتایج جستجو';
  const displayDesc =
    previewDescription.trim() ||
    'توضیح کوتاه مقاله که در گوگل و شبکه‌های اجتماعی نمایش داده می‌شود.';
  const previewImage = ogImage || coverImage;

  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-sm font-semibold"
          onClick={onToggle}
        >
          <span>تنظیمات سئو و پیش‌نمایش</span>
          <span className="text-muted-foreground">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div className="mt-4 space-y-4">
            <div className="border-border bg-muted/20 rounded-xl border p-4">
              <p className="text-muted-foreground mb-2 text-xs font-medium">پیش‌نمایش گوگل</p>
              <p className="truncate text-base text-[#1a0dab]">{displayTitle}</p>
              <p className="mt-0.5 truncate text-xs text-[#006621]" dir="ltr">
                example.com › articles › ...
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-[#545454]">{displayDesc}</p>
            </div>

            {previewImage && isPreviewable(previewImage) && (
              <div className="border-border overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImage}
                  alt="پیش‌نمایش OG"
                  className="aspect-[1.91/1] w-full object-cover"
                />
              </div>
            )}

            <div>
              <Label htmlFor="metaTitle">عنوان سئو (Meta Title)</Label>
              <Input
                id="metaTitle"
                disabled={disabled}
                className="mt-2 rounded-xl"
                aria-invalid={Boolean(errors.metaTitle)}
                {...register('metaTitle', { onChange: onMetaTitleChange })}
              />
              <FieldMessage message={errors.metaTitle?.message} />
              <FieldHint>
                به‌صورت خودکار از عنوان پر می‌شود؛ برای گوگل حداکثر ~۶۰ کاراکتر توصیه می‌شود.
              </FieldHint>
            </div>

            <div>
              <Label htmlFor="metaDescription">توضیح سئو (Meta Description)</Label>
              <Textarea
                id="metaDescription"
                rows={3}
                disabled={disabled}
                className="mt-2 rounded-xl"
                aria-invalid={Boolean(errors.metaDescription)}
                {...register('metaDescription')}
              />
              <FieldMessage message={errors.metaDescription?.message} />
              <FieldHint>
                خلاصه‌ای که در نتایج جستجو نمایش داده می‌شود (حداکثر ~۱۶۰ کاراکتر).
              </FieldHint>
            </div>

            <ArticleImageField
              label="تصویر Open Graph (شبکه‌های اجتماعی)"
              value={ogImage}
              onChange={onOgImageChange}
              disabled={disabled}
              error={errors.ogImage?.message}
              hint="در صورت خالی بودن، از تصویر کاور استفاده می‌شود."
              mediaAssets={mediaAssets}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function isPreviewable(url: string) {
  return url.startsWith('/') || /^https?:\/\//i.test(url);
}
