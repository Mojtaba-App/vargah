'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from '@vargah/ui/components/button';
import { cn } from '@/lib/utils';

type ModalDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
};

export function ModalDialog({
  open,
  title,
  description,
  onClose,
  children,
  className,
  footer,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

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
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        'border-border bg-card fixed inset-0 z-50 m-auto max-h-[90vh] w-[min(100%-2rem,48rem)] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/50',
        'open:animate-in open:fade-in-0',
      )}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <div className="flex max-h-[90vh] flex-col">
        <div className="border-border flex items-start justify-between gap-3 border-b p-5">
          <div>
            <h2 id={titleId} className="text-lg font-bold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-muted-foreground mt-1 text-sm">
                {description}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-lg"
            onClick={onClose}
            aria-label="بستن پنجره"
          >
            ✕
          </Button>
        </div>
        <div className={cn('flex-1 overflow-y-auto p-5', className)}>{children}</div>
        {footer && <div className="border-border border-t p-4">{footer}</div>}
      </div>
    </dialog>
  );
}
