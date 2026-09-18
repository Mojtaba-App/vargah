'use client';

import { useId, useState, type ReactNode } from 'react';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { cn } from '@/lib/utils';

type SettingsAccordionSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  canEdit?: boolean;
  saving?: boolean;
  onSave?: () => void;
  saveLabel?: string;
  actions?: ReactNode;
  headerExtra?: ReactNode;
  feedback?: { type: 'success' | 'error'; message: string } | null;
  onDismissFeedback?: () => void;
  className?: string;
  children: ReactNode;
};

export function SettingsAccordionSection({
  title,
  description,
  defaultOpen = false,
  canEdit = false,
  saving = false,
  onSave,
  saveLabel = 'ذخیره این بخش',
  actions,
  headerExtra,
  feedback,
  onDismissFeedback,
  className,
  children,
}: SettingsAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={cn('border-border bg-card overflow-hidden rounded-2xl border', className)}>
      <div className="border-border/70 flex flex-wrap items-center gap-2 border-b px-4 py-3 sm:px-5">
        <button
          type="button"
          className="hover:bg-muted/30 focus-visible:ring-ring flex min-w-0 flex-1 items-start gap-3 rounded-xl text-start transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span
            className={cn(
              'border-border bg-muted/40 text-muted-foreground mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-lg border text-sm transition-transform',
              open && 'rotate-90',
            )}
            aria-hidden
          >
            ›
          </span>
          <span className="min-w-0 py-0.5">
            <span className="block text-base font-semibold sm:text-lg">{title}</span>
            {description ? (
              <span className="text-muted-foreground mt-0.5 block text-xs sm:text-sm">
                {description}
              </span>
            ) : null}
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {headerExtra}
          {actions}
          {canEdit && onSave ? (
            <LoadingButton
              type="button"
              size="sm"
              className="rounded-xl"
              loading={saving}
              loadingText="در حال ذخیره..."
              onClick={(event) => {
                event.stopPropagation();
                onSave();
              }}
            >
              {saveLabel}
            </LoadingButton>
          ) : null}
        </div>
      </div>

      {open ? (
        <div id={panelId} className="space-y-4 p-4 sm:p-6">
          {feedback ? (
            <StatusBanner
              type={feedback.type}
              message={feedback.message}
              onDismiss={feedback.type === 'error' ? undefined : onDismissFeedback}
            />
          ) : null}
          {children}
        </div>
      ) : null}
    </section>
  );
}
