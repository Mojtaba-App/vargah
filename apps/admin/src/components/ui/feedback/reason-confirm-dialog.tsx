'use client';

import { useEffect, useRef, useState } from 'react';
import { Label, Textarea } from '@vargah/ui/components/input';

import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { cn } from '@/lib/utils';

export const DEFAULT_DELETE_REASONS = [
  'لایه دیگر استفاده نمی‌شود',
  'فایل اشتباه آپلود شده',
  'جایگزینی با لایه جدید',
  'اطلاعات جغرافیایی منسوخ شده',
] as const;

type ReasonConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  reasons?: readonly string[];
  loading?: boolean;
  /** خطای سرور پس از تلاش ناموفق حذف */
  serverError?: string | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export function ReasonConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'حذف قطعی',
  cancelLabel = 'انصراف',
  reasons = DEFAULT_DELETE_REASONS,
  loading = false,
  serverError = null,
  onConfirm,
  onCancel,
}: ReasonConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedReason, setSelectedReason] = useState<string>(reasons[0] ?? '');
  const [customReason, setCustomReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelectedReason(reasons[0] ?? 'other');
    setCustomReason('');
    setValidationError(null);
  }, [open, reasons]);

  const resolvedReason =
    selectedReason === 'other' ? customReason.trim() : selectedReason.trim();

  function handleConfirm() {
    if (!resolvedReason) {
      setValidationError('دلیل حذف الزامی است');
      return;
    }
    if (resolvedReason.length < 3) {
      setValidationError('دلیل حذف حداقل ۳ کاراکتر باشد');
      return;
    }
    setValidationError(null);
    onConfirm(resolvedReason);
  }

  const displayError = validationError || serverError;

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed inset-0 z-50 m-auto w-[min(100%-2rem,30rem)] rounded-2xl border border-border bg-card p-0 shadow-2xl backdrop:bg-black/50',
      )}
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) onCancel();
      }}
      onClose={() => {
        if (!loading) onCancel();
      }}
    >
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-bold text-destructive">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          <p className="mt-2 rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            این عمل قابل بازگشت نیست.
          </p>
        </div>

        <div className="space-y-2">
          <Label>دلیل حذف</Label>
          <div className="space-y-2">
            {reasons.map((reason) => (
              <label
                key={reason}
                className="flex cursor-pointer items-start gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="delete-reason"
                  className="mt-1"
                  checked={selectedReason === reason}
                  disabled={loading}
                  onChange={() => setSelectedReason(reason)}
                />
                <span>{reason}</span>
              </label>
            ))}
            <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm">
              <input
                type="radio"
                name="delete-reason"
                className="mt-1"
                checked={selectedReason === 'other'}
                disabled={loading}
                onChange={() => setSelectedReason('other')}
              />
              <span>دلیل دیگر</span>
            </label>
          </div>
        </div>

        {selectedReason === 'other' && (
          <div className="space-y-2">
            <Label htmlFor="custom-delete-reason">توضیح دستی</Label>
            <Textarea
              id="custom-delete-reason"
              rows={3}
              disabled={loading}
              value={customReason}
              placeholder="دلیل حذف را بنویسید..."
              onChange={(event) => setCustomReason(event.target.value)}
              className="rounded-xl"
            />
          </div>
        )}

        {displayError && (
          <p className="text-sm text-destructive" role="alert">
            {displayError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <LoadingButton
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelLabel}
          </LoadingButton>
          <LoadingButton
            type="button"
            variant="destructive"
            className="rounded-xl"
            loading={loading}
            loadingText="در حال حذف..."
            onClick={handleConfirm}
          >
            {confirmLabel}
          </LoadingButton>
        </div>
      </div>
    </dialog>
  );
}
