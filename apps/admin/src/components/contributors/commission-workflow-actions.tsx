'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Label, Select, Textarea } from '@vargah/ui/components/input';
import { rateContributor } from '@/actions/commissions';
import { assignCommissionWriterAction } from '@/actions/contributors';
import { CommissionTransitionButtons } from '@/components/contributors/commission-transition-buttons';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { JalaliDateField } from '@/components/ui/form/jalali-date-field';
import { getTodayJalaliParts, jalaliDatePartsToIso } from '@/lib/date/jalali';
import { useActionFeedback } from '@/hooks/use-action-feedback';
import {
  COMMISSION_STATUS_LABELS,
  CommissionStatus,
  type CommissionStatus as CommissionStatusType,
} from '@/lib/contributors/constants';

type Writer = { id: string; name: string | null };
type ContributorOption = { id: string; userName: string | null };

type CommissionActionsProps = {
  commissionId: string;
  status: CommissionStatusType;
  contributorId: string | null;
  assigneeId: string | null;
  writers: Writer[];
  contributors: ContributorOption[];
  canManage: boolean;
};

export function CommissionWorkflowActions({
  commissionId,
  status,
  contributorId,
  assigneeId,
  writers,
  contributors,
  canManage,
}: CommissionActionsProps) {
  const router = useRouter();
  const { message, error, isPending, run, clear, setMessage, setError } = useActionFeedback();
  const [ratingPending, startRating] = useTransition();
  const [assignPending, startAssign] = useTransition();
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const minDueDate = jalaliDatePartsToIso(getTodayJalaliParts(), 'start');

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground">
        مرحله فعلی: {COMMISSION_STATUS_LABELS[status]}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {(message || error) && (
        <StatusBanner type={error ? 'error' : 'success'} message={error ?? message!} />
      )}
      {(ratingMessage || ratingError) && (
        <StatusBanner type={ratingError ? 'error' : 'success'} message={ratingError ?? ratingMessage!} />
      )}
      {assignError && <StatusBanner type="error" message={assignError} />}

      <div>
        <p className="mb-2 text-sm text-muted-foreground">مرحله فعلی: {COMMISSION_STATUS_LABELS[status]}</p>
        <CommissionTransitionButtons
          commissionId={commissionId}
          status={status}
          onSuccess={() => {
            clear();
            setMessage('وضعیت کمیسیون به‌روزرسانی شد.');
            router.refresh();
          }}
          onError={setError}
        />
      </div>

      {status === CommissionStatus.TOPIC_DEFINED && !assigneeId && (
        <form
          className="space-y-3 rounded-2xl border border-border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            setAssignError(null);
            startAssign(async () => {
              try {
                await assignCommissionWriterAction(
                  commissionId,
                  fd.get('assigneeId') as string,
                  fd.get('contributorId') as string,
                  (fd.get('dueDate') as string) || undefined,
                );
                router.refresh();
              } catch (err) {
                setAssignError(err instanceof Error ? err.message : 'تخصیص ناموفق بود');
              }
            });
          }}
        >
          <h4 className="font-semibold">تخصیص نویسنده</h4>
          <div>
            <Label required>نویسنده</Label>
            <Select name="assigneeId" required className="mt-2 rounded-xl" disabled={assignPending}>
              <option value="">انتخاب...</option>
              {writers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>پروفایل همکار</Label>
            <Select name="contributorId" required className="mt-2 rounded-xl" disabled={assignPending}>
              <option value="">انتخاب...</option>
              {contributors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.userName}
                </option>
              ))}
            </Select>
          </div>
          <JalaliDateField
            id="assign-due-date"
            name="dueDate"
            label="مهلت تحویل"
            disabled={assignPending}
            minDate={minDueDate}
            hint="اختیاری — از امروز به بعد، تا پایان روز شمسی"
          />
          <LoadingButton type="submit" size="sm" className="rounded-xl" loading={assignPending} loadingText="در حال تخصیص...">
            تخصیص
          </LoadingButton>
        </form>
      )}

      {status === CommissionStatus.APPROVED && contributorId && (
        <form
          className="space-y-3 rounded-2xl border border-dashed border-border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            setRatingMessage(null);
            setRatingError(null);
            startRating(async () => {
              try {
                await rateContributor({
                  contributorId,
                  commissionId,
                  score: Number(fd.get('score')),
                  note: (fd.get('note') as string) || undefined,
                });
                setRatingMessage('امتیاز با موفقیت ثبت شد.');
                event.currentTarget.reset();
              } catch (err) {
                setRatingError(err instanceof Error ? err.message : 'ثبت امتیاز ناموفق بود');
              }
            });
          }}
        >
          <h4 className="font-semibold">امتیاز کیفیت همکار</h4>
          <Input name="score" type="number" min={1} max={5} required placeholder="۱ تا ۵" disabled={ratingPending} className="rounded-xl" />
          <Textarea name="note" rows={2} placeholder="یادداشت (اختیاری)" disabled={ratingPending} className="rounded-xl" />
          <LoadingButton type="submit" size="sm" variant="outline" className="rounded-xl" loading={ratingPending} loadingText="در حال ثبت...">
            ثبت امتیاز
          </LoadingButton>
        </form>
      )}
    </div>
  );
}
