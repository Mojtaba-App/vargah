'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Label, Select, Textarea } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';
import { DataTable } from '@/components/ui/data-table';
import { WorkspaceSearchField } from '@/components/ui/workspace-search-field';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { ModalDialog } from '@/components/ui/feedback/modal-dialog';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { ExportToolbar } from '@/components/ui/feedback/export-toolbar';
import {
  assignMessage,
  convertMessageToTicket,
  markMessageRead,
  replyToMessage,
  updateMessageStatus,
} from '@/actions/messages';
import {
  getAllowedMessageStatuses,
  isMessageActive,
  MESSAGE_STATUS_LABELS,
  MESSAGE_STATUS_VARIANT,
  MESSAGE_TYPE_DESCRIPTIONS,
  MESSAGE_TYPE_LABELS,
  MESSAGE_TYPE_VARIANT,
  MessageStatus,
  MessageType,
  type MessageStatusFilter,
  type MessageTypeFilter,
} from '@/lib/messages/constants';
import { publicAssetUrl } from '@/lib/articles/constants';
import { cn, formatJalali, formatNumber } from '@/lib/utils';

export type MessageReplyRow = {
  id: string;
  body: string;
  isInternal: boolean;
  emailSent: boolean;
  authorName: string | null;
  createdAt: Date;
};

export type MessageRow = {
  id: string;
  type: MessageType;
  status: MessageStatus;
  senderName: string;
  senderEmail: string | null;
  senderPhone: string | null;
  subject: string | null;
  body: string;
  assignedToId: string | null;
  assigneeName: string | null;
  createdAt: Date;
  updatedAt: Date;
  replies: MessageReplyRow[];
};

type MessageAttachment = { label: string; url: string; fileName?: string };

function parseMessageBody(body: string): { text: string; attachments: MessageAttachment[] } {
  const lines = body.split('\n');
  const attachments: MessageAttachment[] = [];
  const remaining: string[] = [];

  for (const line of lines) {
    const fileMatch = line.match(/^(رزومه|فایل مقاله|نمونه‌کار):\s*(.+)$/);
    if (fileMatch) {
      attachments.push({ label: fileMatch[1]!, url: fileMatch[2]!.trim() });
      continue;
    }
    const nameMatch = line.match(/^نام فایل:\s*(.+)$/);
    if (nameMatch && attachments.length > 0) {
      attachments[attachments.length - 1]!.fileName = nameMatch[1]!.trim();
      continue;
    }
    remaining.push(line);
  }

  return { text: remaining.join('\n').trim(), attachments };
}

function MessageBodyContent({ body }: { body: string }) {
  const { text, attachments } = parseMessageBody(body);

  return (
    <div className="space-y-4">
      {text ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p> : null}
      {attachments.length > 0 ? (
        <div className="border-border space-y-2 border-t pt-3">
          <p className="text-muted-foreground text-xs font-semibold">پیوست‌ها</p>
          <ul className="space-y-2">
            {attachments.map((item) => {
              const href = publicAssetUrl(item.url);
              const isUpload = item.url.startsWith('/uploads/') || /^https?:\/\//i.test(item.url);
              return (
                <li key={`${item.label}-${item.url}`} className="text-sm">
                  <span className="text-muted-foreground">{item.label}: </span>
                  {isUpload ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium hover:underline"
                      dir="ltr"
                    >
                      {item.fileName || 'دانلود فایل'}
                    </a>
                  ) : (
                    <span dir="ltr">{item.url}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

type StaffOption = { id: string; name: string | null };

type MessagesWorkspaceProps = {
  messages: MessageRow[];
  staff: StaffOption[];
  canManage: boolean;
};

function StatCard({
  label,
  value,
  hint,
  active,
  onClick,
}: {
  label: string;
  value: number;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'border-border bg-card rounded-2xl border p-4 text-start transition-colors',
        onClick && 'hover:border-primary/40 hover:bg-muted/30 cursor-pointer',
        active && 'border-primary ring-primary/20 ring-1',
      )}
    >
      <p className="text-2xl font-bold tabular-nums">{formatNumber(value)}</p>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
      {hint && <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>}
    </Comp>
  );
}

function MessageStatusSelect({
  messageId,
  value,
  disabled,
  onUpdated,
}: {
  messageId: string;
  value: MessageStatus;
  disabled?: boolean;
  onUpdated?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const allowed = getAllowedMessageStatuses(value);

  return (
    <div className="min-w-[8.5rem]">
      <Select
        value={value}
        disabled={disabled || isPending}
        className="h-9 rounded-lg text-xs"
        onChange={(e) => {
          const next = e.target.value as MessageStatus;
          if (next === value) return;
          setError(null);
          startTransition(async () => {
            try {
              await updateMessageStatus(messageId, next);
              onUpdated?.();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'تغییر وضعیت ناموفق بود');
            }
          });
        }}
      >
        {allowed.map((status) => (
          <option key={status} value={status}>
            {MESSAGE_STATUS_LABELS[status]}
          </option>
        ))}
      </Select>
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </div>
  );
}

function MessageQuickReplyDialog({
  target,
  open,
  onClose,
  onSent,
}: {
  target: MessageRow | null;
  open: boolean;
  onClose: () => void;
  onSent: (notice: string) => void;
}) {
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setBody('');
      setIsInternal(false);
      setError(null);
    }
  }, [open, target?.id]);

  if (!target) return null;

  const submit = () => {
    if (body.trim().length < 3) {
      setError('متن پاسخ حداقل ۳ کاراکتر باشد.');
      return;
    }
    if (target.status === MessageStatus.ARCHIVED) {
      setError('پیام آرشیو شده است. ابتدا از آرشیو خارج کنید.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await replyToMessage(target.id, body.trim(), { isInternal });
        const notice = result.warning
          ? result.warning
          : isInternal
            ? 'یادداشت داخلی ثبت شد.'
            : result.emailSent
              ? 'پاسخ ارسال و وضعیت به «پاسخ‌داده» تغییر کرد.'
              : 'پاسخ ثبت و وضعیت به «پاسخ‌داده» تغییر کرد.';
        onSent(notice);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ارسال پاسخ ناموفق بود');
      }
    });
  };

  return (
    <ModalDialog
      open={open}
      title="پاسخ سریع"
      description={`${target.subject ?? 'بدون موضوع'} — ${target.senderName}`}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isPending}
            onClick={onClose}
          >
            انصراف
          </Button>
          <LoadingButton type="button" className="rounded-xl" loading={isPending} onClick={submit}>
            {isInternal ? 'ثبت یادداشت' : 'ارسال پاسخ'}
          </LoadingButton>
        </div>
      }
    >
      <div className="space-y-3">
        {error && <StatusBanner type="error" message={error} />}
        {!target.senderEmail && !isInternal && (
          <p className="rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            ایمیلی ثبت نشده؛ پاسخ فقط در پنل ذخیره می‌شود.
          </p>
        )}
        <div>
          <Label required>متن پاسخ</Label>
          <Textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="پاسخ به فرستنده..."
            className="mt-2 rounded-xl"
            disabled={isPending}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            disabled={isPending}
          />
          یادداشت داخلی (بدون ارسال ایمیل)
        </label>
      </div>
    </ModalDialog>
  );
}

function MessageReplyPanel({
  message,
  canManage,
  onDone,
}: {
  message: MessageRow;
  canManage: boolean;
  onDone: (notice: string) => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localOk, setLocalOk] = useState<string | null>(null);

  useEffect(() => {
    setBody('');
    setIsInternal(false);
    setLocalError(null);
    setLocalOk(null);
  }, [message.id]);

  const archived = message.status === MessageStatus.ARCHIVED;
  const canReply = canManage && !archived;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canReply) return;
    setLocalError(null);
    setLocalOk(null);
    setPending(true);
    try {
      const result = await replyToMessage(message.id, body, { isInternal });
      const notice = result.warning
        ? result.warning
        : isInternal
          ? 'یادداشت داخلی ثبت شد.'
          : result.emailSent
            ? 'پاسخ ارسال و وضعیت به «پاسخ‌داده» تغییر کرد.'
            : 'پاسخ ثبت و وضعیت به «پاسخ‌داده» تغییر کرد.';
      setLocalOk(notice);
      onDone(notice);
      setBody('');
      setIsInternal(false);
      router.refresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'ارسال پاسخ ناموفق بود');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="border-border space-y-4 border-t pt-4">
      {canReply ? (
        <form className="border-border space-y-3 rounded-xl border p-4" onSubmit={handleSubmit}>
          <div>
            <p className="font-semibold">پاسخ به پیام</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {message.senderEmail
                ? 'با ارسال، ایمیل برای فرستنده فرستاده می‌شود و وضعیت به «پاسخ‌داده» تغییر می‌کند.'
                : 'ایمیلی ثبت نشده؛ پاسخ فقط در پنل ذخیره و وضعیت به «پاسخ‌داده» تغییر می‌کند.'}
            </p>
          </div>
          {(localOk || localError) && (
            <StatusBanner
              type={localError ? 'error' : 'success'}
              message={localError ?? localOk!}
            />
          )}
          <Textarea
            id={`reply-${message.id}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            required
            minLength={3}
            maxLength={8000}
            disabled={pending}
            placeholder="پاسخ به فرستنده..."
            className="rounded-xl"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isInternal}
              disabled={pending}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            یادداشت داخلی (بدون ارسال ایمیل و بدون تغییر به پاسخ‌داده)
          </label>
          <LoadingButton
            type="submit"
            className="rounded-xl"
            loading={pending}
            loadingText="در حال ارسال..."
          >
            {isInternal ? 'ثبت یادداشت' : 'ارسال پاسخ'}
          </LoadingButton>
        </form>
      ) : archived ? (
        <p className="text-muted-foreground text-sm">
          این پیام آرشیو شده است. برای پاسخ، ابتدا آن را از آرشیو خارج کنید.
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="font-semibold">گفتگو ({formatNumber(message.replies.length)})</p>
        {message.replies.length === 0 ? (
          <p className="text-muted-foreground text-sm">هنوز پاسخی ثبت نشده است.</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {message.replies.map((reply) => (
              <li
                key={reply.id}
                className={cn(
                  'rounded-xl border p-3 text-sm',
                  reply.isInternal
                    ? 'border-amber-200/70 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20'
                    : 'border-border bg-muted/20',
                )}
              >
                <div className="text-muted-foreground mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>
                    {reply.authorName ?? 'کارشناس'}
                    {reply.isInternal ? ' · یادداشت داخلی' : ' · پاسخ به فرستنده'}
                    {!reply.isInternal && reply.emailSent ? ' · ایمیل ارسال شد' : null}
                    {!reply.isInternal && !reply.emailSent ? ' · بدون ایمیل' : null}
                  </span>
                  <span>{formatJalali(reply.createdAt, true)}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{reply.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function MessagesWorkspace({
  messages: initialMessages,
  staff,
  canManage,
}: MessagesWorkspaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [selected, setSelected] = useState<MessageRow | null>(null);
  const [typeFilter, setTypeFilter] = useState<MessageTypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<MessageStatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [replyTarget, setReplyTarget] = useState<MessageRow | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
    if (selected) {
      const fresh = initialMessages.find((m) => m.id === selected.id);
      setSelected(fresh ?? null);
    }
  }, [initialMessages, selected?.id]);

  const openMessage = (row: MessageRow) => {
    setSelected(row);
    setError(null);
    if (canManage && row.status === MessageStatus.NEW) {
      startTransition(async () => {
        try {
          await markMessageRead(row.id);
          router.refresh();
        } catch {
          /* view still works */
        }
      });
    }
  };

  const stats = useMemo(
    () => ({
      total: messages.length,
      new: messages.filter((m) => m.status === MessageStatus.NEW).length,
      active: messages.filter((m) => isMessageActive(m.status)).length,
      contact: messages.filter((m) => m.type === MessageType.CONTACT).length,
      collaboration: messages.filter((m) => m.type === MessageType.COLLABORATION).length,
      advertisement: messages.filter((m) => m.type === MessageType.ADVERTISEMENT).length,
      archived: messages.filter((m) => m.status === MessageStatus.ARCHIVED).length,
    }),
    [messages],
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return messages.filter((m) => {
      if (typeFilter !== 'ALL' && m.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        m.senderName,
        m.senderEmail ?? '',
        m.senderPhone ?? '',
        m.subject ?? '',
        m.body,
        MESSAGE_TYPE_LABELS[m.type],
        MESSAGE_STATUS_LABELS[m.status],
        m.assigneeName ?? '',
        ...m.replies.map((r) => r.body),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [messages, typeFilter, statusFilter, debouncedSearch]);

  const refresh = (notice?: string) => {
    if (notice) setMessage(notice);
    else setMessage('به‌روزرسانی شد.');
    router.refresh();
  };

  const runAction = (action: () => Promise<unknown>, success: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        setMessage(success);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'عملیات ناموفق بود');
      }
    });
  };

  const columns = useMemo<ColumnDef<MessageRow>[]>(
    () => [
      {
        id: 'actions',
        header: 'عملیات',
        cell: ({ row }) =>
          canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <MessageStatusSelect
                messageId={row.original.id}
                value={row.original.status}
                onUpdated={() => refresh('وضعیت به‌روزرسانی شد.')}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={row.original.status === MessageStatus.ARCHIVED}
                onClick={() => setReplyTarget(row.original)}
              >
                پاسخ
              </Button>
            </div>
          ) : (
            <Badge variant={MESSAGE_STATUS_VARIANT[row.original.status]}>
              {MESSAGE_STATUS_LABELS[row.original.status]}
            </Badge>
          ),
      },
      {
        id: 'replies',
        header: 'پاسخ‌ها',
        cell: ({ row }) => formatNumber(row.original.replies.length),
      },
      {
        accessorKey: 'type',
        header: 'نوع',
        cell: ({ row }) => (
          <Badge variant={MESSAGE_TYPE_VARIANT[row.original.type]}>
            {MESSAGE_TYPE_LABELS[row.original.type]}
          </Badge>
        ),
      },
      {
        id: 'sender',
        header: 'فرستنده',
        cell: ({ row }) => (
          <button
            type="button"
            className="max-w-xs text-start"
            onClick={() => openMessage(row.original)}
          >
            <p className="text-primary font-medium hover:underline">{row.original.senderName}</p>
            {row.original.subject && (
              <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                {row.original.subject}
              </p>
            )}
            <div className="mt-1 flex flex-wrap gap-1">
              {row.original.status === MessageStatus.NEW && <Badge variant="default">جدید</Badge>}
              {row.original.replies.length > 0 && (
                <Badge variant="outline">{formatNumber(row.original.replies.length)} پاسخ</Badge>
              )}
            </div>
          </button>
        ),
      },
      {
        id: 'contact',
        header: 'تماس',
        cell: ({ row }) => (
          <div className="text-muted-foreground text-xs" dir="ltr">
            {row.original.senderEmail && <p>{row.original.senderEmail}</p>}
            {row.original.senderPhone && <p>{row.original.senderPhone}</p>}
            {!row.original.senderEmail && !row.original.senderPhone && '—'}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'وضعیت',
        cell: ({ row }) => (
          <Badge variant={MESSAGE_STATUS_VARIANT[row.original.status]}>
            {MESSAGE_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        id: 'assignee',
        header: 'مسئول',
        cell: ({ row }) => row.original.assigneeName ?? '—',
      },
      {
        accessorKey: 'createdAt',
        header: 'تاریخ',
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap">
            {formatJalali(row.original.createdAt, true)}
          </span>
        ),
      },
    ],
    [canManage],
  );

  return (
    <div className="space-y-6">
      {(message || error) && (
        <StatusBanner
          type={error ? 'error' : 'success'}
          message={error ?? message!}
          onDismiss={() => {
            setMessage(null);
            setError(null);
          }}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="پیام‌های جدید"
          value={stats.new}
          hint={`${formatNumber(stats.active)} در صف پیگیری`}
          active={statusFilter === MessageStatus.NEW}
          onClick={() => setStatusFilter(MessageStatus.NEW)}
        />
        <StatCard
          label="فرم تماس"
          value={stats.contact}
          active={typeFilter === MessageType.CONTACT}
          onClick={() => setTypeFilter(MessageType.CONTACT)}
        />
        <StatCard
          label="همکاری"
          value={stats.collaboration}
          active={typeFilter === MessageType.COLLABORATION}
          onClick={() => setTypeFilter(MessageType.COLLABORATION)}
        />
        <StatCard
          label="آگهی"
          value={stats.advertisement}
          active={typeFilter === MessageType.ADVERTISEMENT}
          onClick={() => setTypeFilter(MessageType.ADVERTISEMENT)}
        />
      </div>

      <Card className="rounded-2xl">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <WorkspaceSearchField
              id="message-search"
              value={search}
              onChange={setSearch}
              placeholder="نام، ایمیل، موضوع، متن، پاسخ‌ها..."
            />
            <div className="flex flex-wrap gap-2">
              <ExportToolbar
                title="گزارش پیام‌ها"
                subtitle="صندوق پیام‌های فیلترشده"
                filenameBase="messages-report"
                columns={[
                  { key: 'type', header: 'نوع', width: 14 },
                  { key: 'status', header: 'وضعیت', width: 12 },
                  { key: 'sender', header: 'فرستنده', width: 18 },
                  { key: 'email', header: 'ایمیل', width: 22 },
                  { key: 'subject', header: 'موضوع', width: 28 },
                  { key: 'replies', header: 'پاسخ‌ها', width: 10 },
                  { key: 'createdAt', header: 'تاریخ', width: 16 },
                ]}
                rows={filtered.map((row) => ({
                  type: MESSAGE_TYPE_LABELS[row.type],
                  status: MESSAGE_STATUS_LABELS[row.status],
                  sender: row.senderName,
                  email: row.senderEmail,
                  subject: row.subject,
                  replies: row.replies.length,
                  createdAt: formatJalali(row.createdAt, true),
                }))}
                onDone={setMessage}
                onError={setError}
              />
              <button
                type="button"
                onClick={() => {
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs transition-colors',
                  typeFilter === 'ALL' && statusFilter === 'ALL'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50',
                )}
              >
                همه ({formatNumber(stats.total)})
              </button>
              {(['NEW', 'READ', 'REPLIED', 'ARCHIVED'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-xs transition-colors',
                    statusFilter === status
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  {MESSAGE_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <DataTable columns={columns} data={filtered} showSearch={false} />
          </div>

          <ul className="space-y-3 md:hidden" aria-label="فهرست پیام‌ها">
            {filtered.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelected(row)}
                  className="border-border bg-card hover:border-primary/40 w-full rounded-2xl border p-4 text-start transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="leading-snug font-semibold">{row.subject ?? 'بدون موضوع'}</p>
                      <p className="text-muted-foreground mt-1 text-sm">{row.senderName}</p>
                    </div>
                    <Badge variant={MESSAGE_STATUS_VARIANT[row.status]}>
                      {MESSAGE_STATUS_LABELS[row.status]}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge variant={MESSAGE_TYPE_VARIANT[row.type]}>
                      {MESSAGE_TYPE_LABELS[row.type]}
                    </Badge>
                    <span>{formatJalali(row.createdAt, true)}</span>
                  </div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="border-border text-muted-foreground rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
                پیامی یافت نشد.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {selected && (
        <Card className="border-primary/20 rounded-2xl">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={MESSAGE_TYPE_VARIANT[selected.type]}>
                    {MESSAGE_TYPE_LABELS[selected.type]}
                  </Badge>
                  <Badge variant={MESSAGE_STATUS_VARIANT[selected.status]}>
                    {MESSAGE_STATUS_LABELS[selected.status]}
                  </Badge>
                </div>
                <h3 className="mt-2 text-lg font-bold">{selected.subject ?? 'بدون موضوع'}</h3>
                <p className="text-muted-foreground text-sm">
                  {MESSAGE_TYPE_DESCRIPTIONS[selected.type]}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setSelected(null)}
              >
                بستن
              </Button>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-muted-foreground">فرستنده</p>
                <p className="font-medium">{selected.senderName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">ایمیل</p>
                <p className="font-medium" dir="ltr">
                  {selected.senderEmail ? (
                    <a
                      href={`mailto:${selected.senderEmail}`}
                      className="text-primary hover:underline"
                    >
                      {selected.senderEmail}
                    </a>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">موبایل</p>
                <p className="font-medium" dir="ltr">
                  {selected.senderPhone ? (
                    <a
                      href={`tel:${selected.senderPhone}`}
                      className="text-primary hover:underline"
                    >
                      {selected.senderPhone}
                    </a>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">تاریخ</p>
                <p className="font-medium">{formatJalali(selected.createdAt, true)}</p>
              </div>
            </div>

            <div className="border-border bg-muted/20 rounded-2xl border p-4">
              <p className="mb-2 text-sm font-semibold">متن پیام دریافتی</p>
              <MessageBodyContent body={selected.body} />
            </div>

            {canManage && (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-[12rem]">
                  <Label>مسئول پیگیری</Label>
                  <Select
                    value={selected.assignedToId ?? ''}
                    className="mt-2 rounded-xl"
                    disabled={isPending}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      runAction(
                        () => assignMessage(selected.id, value),
                        'مسئول پیگیری به‌روزرسانی شد.',
                      );
                    }}
                  >
                    <option value="">بدون تخصیص</option>
                    {staff.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selected.status === MessageStatus.NEW && (
                    <LoadingButton
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      loading={isPending}
                      onClick={() =>
                        runAction(
                          () => updateMessageStatus(selected.id, MessageStatus.READ),
                          'پیام خوانده شد.',
                        )
                      }
                    >
                      علامت خوانده‌شده
                    </LoadingButton>
                  )}
                  {selected.status === MessageStatus.ARCHIVED ? (
                    <LoadingButton
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      loading={isPending}
                      onClick={() =>
                        runAction(
                          () => updateMessageStatus(selected.id, MessageStatus.READ),
                          'پیام از آرشیو خارج شد.',
                        )
                      }
                    >
                      خروج از آرشیو
                    </LoadingButton>
                  ) : (
                    <LoadingButton
                      size="sm"
                      variant="secondary"
                      className="rounded-xl"
                      loading={isPending}
                      onClick={() =>
                        runAction(
                          () => updateMessageStatus(selected.id, MessageStatus.ARCHIVED),
                          'پیام آرشیو شد.',
                        )
                      }
                    >
                      آرشیو
                    </LoadingButton>
                  )}
                  {selected.type !== MessageType.INTERNAL &&
                    selected.status !== MessageStatus.ARCHIVED && (
                      <LoadingButton
                        size="sm"
                        className="rounded-xl"
                        loading={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            setError(null);
                            try {
                              const ticketId = await convertMessageToTicket(selected.id);
                              setMessage('تیکت ایجاد شد و پیام پاسخ‌داده علامت خورد.');
                              router.push(`/crm/tickets/${ticketId}`);
                            } catch (err) {
                              setError(
                                err instanceof Error ? err.message : 'تبدیل به تیکت ناموفق بود',
                              );
                            }
                          })
                        }
                      >
                        تبدیل به تیکت
                      </LoadingButton>
                    )}
                </div>
              </div>
            )}

            <MessageReplyPanel
              message={selected}
              canManage={canManage}
              onDone={(notice) => setMessage(notice)}
            />
          </CardContent>
        </Card>
      )}

      <MessageQuickReplyDialog
        target={replyTarget}
        open={Boolean(replyTarget)}
        onClose={() => setReplyTarget(null)}
        onSent={(notice) => {
          setMessage(notice);
          router.refresh();
        }}
      />
    </div>
  );
}
