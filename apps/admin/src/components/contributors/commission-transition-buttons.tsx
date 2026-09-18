'use client';

import { useState, useTransition } from 'react';
import { Textarea } from '@vargah/ui/components/input';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { ModalDialog } from '@/components/ui/feedback/modal-dialog';
import { transitionCommission } from '@/actions/commissions';
import {
  COMMISSION_STATUS_LABELS,
  COMMISSION_TRANSITIONS,
  CommissionStatus,
  type CommissionStatus as CommissionStatusType,
} from '@/lib/contributors/constants';

type Props = {
  commissionId: string;
  status: CommissionStatusType;
  disabled?: boolean;
  size?: 'sm' | 'default';
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function CommissionTransitionButtons({
  commissionId,
  status,
  disabled,
  size = 'sm',
  onSuccess,
  onError,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const nextSteps = COMMISSION_TRANSITIONS[status] ?? [];

  const runTransition = (step: CommissionStatusType, note?: string) => {
    startTransition(async () => {
      try {
        await transitionCommission(commissionId, step, note);
        setRejectOpen(false);
        setReviewNote('');
        onSuccess?.();
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'تغییر وضعیت ناموفق بود');
      }
    });
  };

  if (nextSteps.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {nextSteps.map((step) =>
          step === CommissionStatus.REJECTED ? (
            <LoadingButton
              key={step}
              size={size}
              variant="outline"
              className="rounded-xl"
              loading={pending}
              disabled={disabled}
              onClick={() => setRejectOpen(true)}
            >
              {COMMISSION_STATUS_LABELS[step]}
            </LoadingButton>
          ) : (
            <LoadingButton
              key={step}
              size={size}
              variant="default"
              className="rounded-xl"
              loading={pending}
              disabled={disabled}
              onClick={() => runTransition(step)}
            >
              {COMMISSION_STATUS_LABELS[step]}
            </LoadingButton>
          ),
        )}
      </div>

      <ModalDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="رد کمیسیون"
        description="دلیل رد را برای پیگیری بعدی ثبت کنید (اختیاری)."
      >
        <div className="space-y-4">
          <Textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={3}
            placeholder="یادداشت بازبینی..."
            className="rounded-xl"
            maxLength={2000}
          />
          <div className="flex justify-end gap-2">
            <LoadingButton
              variant="outline"
              className="rounded-xl"
              onClick={() => setRejectOpen(false)}
              disabled={pending}
            >
              انصراف
            </LoadingButton>
            <LoadingButton
              variant="destructive"
              className="rounded-xl"
              loading={pending}
              onClick={() =>
                runTransition(CommissionStatus.REJECTED, reviewNote.trim() || undefined)
              }
            >
              تأیید رد
            </LoadingButton>
          </div>
        </div>
      </ModalDialog>
    </>
  );
}
