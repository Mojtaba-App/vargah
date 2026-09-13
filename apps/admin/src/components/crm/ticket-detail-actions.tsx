'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@vargah/ui/components/input';
import { replyToTicket, submitSatisfactionSurvey, updateTicketStatus } from '@/actions/tickets';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { useActionFeedback } from '@/hooks/use-action-feedback';
import { TICKET_STATUS_LABELS, TicketStatus, type TicketStatus as TicketStatusType } from '@/lib/crm/tickets/constants';
import { formatJalali } from '@/lib/utils';

type Reply = {
  id: string;
  body: string;
  isInternal: boolean;
  authorName: string | null;
  createdAt: string;
};

type TicketDetailProps = {
  ticketId: string;
  status: TicketStatusType;
  replies: Reply[];
  hasSurvey: boolean;
  canManage: boolean;
};

export function TicketDetailActions({
  ticketId,
  status,
  replies,
  hasSurvey,
  canManage,
}: TicketDetailProps) {
  const router = useRouter();
  const { message, error, isPending, run } = useActionFeedback();
  const [replyMessage, setReplyMessage] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replyPending, setReplyPending] = useState(false);

  const handleReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage) return;
    setReplyMessage(null);
    setReplyError(null);
    setReplyPending(true);

    const fd = new FormData(event.currentTarget);
    try {
      await replyToTicket(ticketId, fd.get('body') as string, fd.get('internal') === 'on');
      setReplyMessage('پاسخ با موفقیت ارسال شد.');
      event.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'ارسال پاسخ ناموفق بود');
    } finally {
      setReplyPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {(message || error) && (
        <StatusBanner type={error ? 'error' : 'success'} message={error ?? message!} />
      )}

      {canManage && (
        <>
          <div className="flex flex-wrap gap-2">
            {status !== TicketStatus.IN_PROGRESS && (
              <LoadingButton
                size="sm"
                variant="outline"
                className="rounded-xl"
                loading={isPending}
                loadingText="..."
                onClick={() =>
                  run(
                    () => updateTicketStatus(ticketId, TicketStatus.IN_PROGRESS),
                    'پیگیری تیکت آغاز شد.',
                  )
                }
              >
                {TICKET_STATUS_LABELS.IN_PROGRESS}
              </LoadingButton>
            )}
            {status !== TicketStatus.RESOLVED && (
              <LoadingButton
                size="sm"
                className="rounded-xl"
                loading={isPending}
                loadingText="..."
                onClick={() =>
                  run(
                    () => updateTicketStatus(ticketId, TicketStatus.RESOLVED),
                    'تیکت به‌عنوان حل‌شده علامت خورد.',
                  )
                }
              >
                {TICKET_STATUS_LABELS.RESOLVED}
              </LoadingButton>
            )}
            {status !== TicketStatus.CLOSED && (
              <LoadingButton
                size="sm"
                variant="secondary"
                className="rounded-xl"
                loading={isPending}
                loadingText="..."
                onClick={() =>
                  run(() => updateTicketStatus(ticketId, TicketStatus.CLOSED), 'تیکت بسته شد.')
                }
              >
                {TICKET_STATUS_LABELS.CLOSED}
              </LoadingButton>
            )}
          </div>

          <form className="space-y-3 rounded-2xl border border-border p-4" onSubmit={handleReply}>
            {(replyMessage || replyError) && (
              <StatusBanner type={replyError ? 'error' : 'success'} message={replyError ?? replyMessage!} />
            )}
            <Textarea
              name="body"
              placeholder="پاسخ به مشتری..."
              rows={4}
              required
              disabled={replyPending}
              className="rounded-xl"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="internal" disabled={replyPending} />
              یادداشت داخلی (بدون ارسال به مشتری)
            </label>
            <LoadingButton type="submit" className="rounded-xl" loading={replyPending} loadingText="در حال ارسال...">
              ارسال پاسخ
            </LoadingButton>
          </form>
        </>
      )}

      <div className="space-y-3">
        <h4 className="font-semibold">گفتگو</h4>
        {replies.length === 0 && <p className="text-sm text-muted-foreground">هنوز پاسخی ثبت نشده.</p>}
        {replies.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-muted/20 p-3 text-sm">
            <div className="mb-1 flex justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {r.authorName ?? 'سیستم'}
                {r.isInternal ? ' (داخلی)' : ''}
              </span>
              <span>{formatJalali(r.createdAt, true)}</span>
            </div>
            <p className="whitespace-pre-wrap">{r.body}</p>
          </div>
        ))}
      </div>

      {canManage && status === TicketStatus.RESOLVED && !hasSurvey && <SurveyForm ticketId={ticketId} />}
    </div>
  );
}

function SurveyForm({ ticketId }: { ticketId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setPending(true);

    const fd = new FormData(event.currentTarget);
    try {
      await submitSatisfactionSurvey(
        ticketId,
        Number(fd.get('score')),
        (fd.get('comment') as string) || undefined,
      );
      setMessage('نظر شما ثبت شد. متشکریم!');
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ثبت نظر ناموفق بود');
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="space-y-3 rounded-2xl border border-dashed border-border p-4" onSubmit={handleSubmit}>
      {message && <StatusBanner type="success" message={message} />}
      {error && <StatusBanner type="error" message={error} />}
      <h4 className="font-semibold">رضایت‌سنجی (NPS)</h4>
      <p className="text-sm text-muted-foreground">از ۰ (نامحتمل) تا ۱۰ (بسیار محتمل)</p>
      <input
        name="score"
        type="number"
        min={0}
        max={10}
        required
        disabled={pending}
        className="w-20 rounded-md border border-border px-2 py-1"
      />
      <Textarea name="comment" placeholder="نظر اختیاری..." rows={2} disabled={pending} className="rounded-xl" />
      <LoadingButton type="submit" size="sm" variant="outline" className="rounded-xl" loading={pending} loadingText="در حال ثبت...">
        ثبت نظر
      </LoadingButton>
    </form>
  );
}
