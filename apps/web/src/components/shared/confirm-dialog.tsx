'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@vargah/ui/components/button';

import { cn } from '@/lib/utils';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'تأیید',
  cancelLabel = 'انصراف',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'border-border bg-card fixed inset-0 z-[80] m-auto w-[min(100%-2rem,28rem)] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/50',
      )}
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) onCancel();
      }}
      onClose={onCancel}
    >
      <div className="p-6">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            className="rounded-xl"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? 'در حال انجام...' : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
