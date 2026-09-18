'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';

import { SubmitButton } from '@/components/ui/feedback/submit-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import type { ActionState } from '@/lib/action-state';
import { isNextRedirect } from '@/lib/action-state';
import { cn } from '@/lib/utils';

type ActionFormProps = {
  action: (formData: FormData) => Promise<void>;
  successMessage: string;
  className?: string;
  children: React.ReactNode;
  submitLabel?: string;
  submitLoadingText?: string;
  showSubmit?: boolean;
};

export function ActionForm({
  action,
  successMessage,
  className,
  children,
  submitLabel = 'ذخیره',
  submitLoadingText,
  showSubmit = true,
}: ActionFormProps) {
  const router = useRouter();

  const [state, formAction] = useActionState(async (_prev: ActionState, formData: FormData) => {
    try {
      await action(formData);
      router.refresh();
      return { success: true, message: successMessage };
    } catch (error) {
      if (isNextRedirect(error)) throw error;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطا در انجام عملیات',
      };
    }
  }, null);

  return (
    <form action={formAction} className={cn('space-y-3', className)}>
      {state?.message && <StatusBanner type="success" message={state.message} />}
      {state?.error && <StatusBanner type="error" message={state.error} />}
      {children}
      {showSubmit && <SubmitButton loadingText={submitLoadingText}>{submitLabel}</SubmitButton>}
    </form>
  );
}
