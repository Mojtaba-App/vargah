'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Label, Select, Textarea } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';
import { DataTable } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/search-input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { ModalDialog } from '@/components/ui/feedback/modal-dialog';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { ExportToolbar } from '@/components/ui/feedback/export-toolbar';
import { replyToTicket, updateTicketStatus } from '@/actions/tickets';
import {
  getTicketShortId,
  isTicketActive,
  TICKET_CUSTOMER_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_VARIANT,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_VARIANT,
  TicketCustomerType,
  TicketPriority,
  TicketStatus,
  type TicketCustomerFilter,
  type TicketPriorityFilter,
  type TicketStatusFilter,
} from '@/lib/crm/tickets/constants';
import { formatJalali, formatNumber, cn } from '@/lib/utils';

export type TicketReplyRow = {
  id: string;
  body: string;
  isInternal: boolean;
  authorName: string | null;
  createdAt: Date;
};

export type TicketRow = {
  id: string;
  subject: string;
  body: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerType: TicketCustomerType;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeName: string | null;
  subscriberId: string | null;
  advertiserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  _count: { replies: number };
  replies: TicketReplyRow[];
};

type TicketsWorkspaceProps = {
  tickets: TicketRow[];
  canManage: boolean;
};

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'surface-card rounded-2xl p-4 text-start transition-colors',
        onClick && 'hover:border-primary/40',
        active && 'border-primary ring-primary/20 ring-1',
      )}
    >
      <p className="text-2xl font-bold tabular-nums">{formatNumber(value)}</p>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </Comp>
  );
}

function TicketStatusSelect({
  ticketId,
  value,
  disabled,
  onUpdated,
}: {
  ticketId: string;
  value: TicketStatus;
  disabled?: boolean;
  onUpdated?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-w-[9rem]">
      <Select
        value={value}
        disabled={disabled || isPending}
        className="h-9 rounded-lg text-xs"
        onChange={(e) => {
          const next = e.target.value as TicketStatus;
          if (next === value) return;
          setError(null);
          startTransition(async () => {
            try {
              await updateTicketStatus(ticketId, next);
              onUpdated?.();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'تغییر وضعیت ناموفق بود');
            }
          });
        }}
      >
        {Object.entries(TICKET_STATUS_LABELS).map(([status, label]) => (
          <option key={status} value={status}>
            {label}
          </option>
        ))}
      </Select>
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </div>
  );
}

function QuickReplyDialog({
  ticket,
  open,
  onClose,
  onSent,
}: {
  ticket: TicketRow | null;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
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
  }, [open, ticket?.id]);

  if (!ticket) return null;

  const submit = () => {
    if (!body.trim()) {
      setError('متن پاسخ الزامی است');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await replyToTicket(ticket.id, body.trim(), isInternal);
        onSent();
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
      description={`${ticket.subject} — ${ticket.customerName}`}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={onClose}
            disabled={isPending}
          >
            انصراف
          </Button>
          <LoadingButton type="button" className="rounded-xl" loading={isPending} onClick={submit}>
            ارسال پاسخ
          </LoadingButton>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <StatusBanner type="error" message={error} />}
        <div>
          <Label required>متن پاسخ</Label>
          <Textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="پاسخ به مشتری..."
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
          یادداشت داخلی (بدون ارسال به مشتری)
        </label>
      </div>
    </ModalDialog>
  );
}

export function TicketsWorkspace({ tickets: initialTickets, canManage }: TicketsWorkspaceProps) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [selected, setSelected] = useState<TicketRow | null>(null);
  const [replyTarget, setReplyTarget] = useState<TicketRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriorityFilter>('ALL');
  const [customerFilter, setCustomerFilter] = useState<TicketCustomerFilter>('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailReply, setDetailReply] = useState('');
  const [detailInternal, setDetailInternal] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailPending, startDetailTransition] = useTransition();

  useEffect(() => {
    setTickets(initialTickets);
    if (selected) {
      const fresh = initialTickets.find((t) => t.id === selected.id);
      setSelected(fresh ?? null);
    }
  }, [initialTickets, selected?.id]);

  const stats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === TicketStatus.OPEN).length,
      inProgress: tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length,
      waiting: tickets.filter((t) => t.status === TicketStatus.WAITING_CUSTOMER).length,
      resolved: tickets.filter((t) => t.status === TicketStatus.RESOLVED).length,
      urgent: tickets.filter(
        (t) => t.priority === TicketPriority.URGENT && isTicketActive(t.status),
      ).length,
    }),
    [tickets],
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusFilter !== 'ALL' && ticket.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && ticket.priority !== priorityFilter) return false;
      if (customerFilter !== 'ALL' && ticket.customerType !== customerFilter) return false;
      if (!q) return true;
      const haystack = [
        ticket.subject,
        ticket.body,
        ticket.customerName,
        ticket.customerEmail ?? '',
        ticket.customerPhone ?? '',
        getTicketShortId(ticket.id),
        TICKET_CUSTOMER_TYPE_LABELS[ticket.customerType],
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tickets, statusFilter, priorityFilter, customerFilter, debouncedSearch]);

  const refresh = () => {
    setMessage('به‌روزرسانی شد.');
    router.refresh();
  };

  const submitDetailReply = () => {
    if (!selected || !detailReply.trim()) {
      setDetailError('متن پاسخ الزامی است');
      return;
    }
    setDetailError(null);
    startDetailTransition(async () => {
      try {
        await replyToTicket(selected.id, detailReply.trim(), detailInternal);
        setDetailReply('');
        setDetailInternal(false);
        setMessage('پاسخ ارسال شد.');
        router.refresh();
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : 'ارسال پاسخ ناموفق بود');
      }
    });
  };

  const columns: ColumnDef<TicketRow>[] = [
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          {canManage ? (
            <>
              <TicketStatusSelect
                ticketId={row.original.id}
                value={row.original.status}
                onUpdated={refresh}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={() => setReplyTarget(row.original)}
              >
                پاسخ
              </Button>
            </>
          ) : (
            <Badge variant="outline">فقط مشاهده</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'موضوع',
      cell: ({ row }) => (
        <button
          type="button"
          className="max-w-xs text-start"
          onClick={() => setSelected(row.original)}
        >
          <p className="text-primary font-medium hover:underline">{row.original.subject}</p>
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{row.original.body}</p>
        </button>
      ),
    },
    {
      id: 'customer',
      header: 'مشتری',
      cell: ({ row }) => (
        <div className="min-w-[8rem]">
          <p className="font-medium">{row.original.customerName}</p>
          <p className="text-muted-foreground text-xs">
            {TICKET_CUSTOMER_TYPE_LABELS[row.original.customerType]}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'اولویت',
      cell: ({ row }) => (
        <Badge variant={TICKET_PRIORITY_VARIANT[row.original.priority]}>
          {TICKET_PRIORITY_LABELS[row.original.priority]}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => (
        <Badge variant={TICKET_STATUS_VARIANT[row.original.status]}>
          {TICKET_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'replies',
      header: 'پاسخ‌ها',
      cell: ({ row }) => formatNumber(row.original._count.replies),
    },
    {
      accessorKey: 'assigneeName',
      header: 'مسئول',
      cell: ({ row }) => row.original.assigneeName ?? '—',
    },
    {
      accessorKey: 'createdAt',
      header: 'تاریخ',
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {formatJalali(row.original.createdAt, true)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {message && <StatusBanner type="success" message={message} className="rounded-xl" />}
      {error && <StatusBanner type="error" message={error} className="rounded-xl" />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard
          label="همه"
          value={stats.total}
          active={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
        />
        <StatCard
          label="باز"
          value={stats.open}
          active={statusFilter === TicketStatus.OPEN}
          onClick={() => setStatusFilter(TicketStatus.OPEN)}
        />
        <StatCard
          label="در حال پیگیری"
          value={stats.inProgress}
          active={statusFilter === TicketStatus.IN_PROGRESS}
          onClick={() => setStatusFilter(TicketStatus.IN_PROGRESS)}
        />
        <StatCard
          label="منتظر مشتری"
          value={stats.waiting}
          active={statusFilter === TicketStatus.WAITING_CUSTOMER}
          onClick={() => setStatusFilter(TicketStatus.WAITING_CUSTOMER)}
        />
        <StatCard
          label="حل‌شده"
          value={stats.resolved}
          active={statusFilter === TicketStatus.RESOLVED}
          onClick={() => setStatusFilter(TicketStatus.RESOLVED)}
        />
        <StatCard
          label="فوری فعال"
          value={stats.urgent}
          active={priorityFilter === TicketPriority.URGENT}
          onClick={() =>
            setPriorityFilter((p) => (p === TicketPriority.URGENT ? 'ALL' : TicketPriority.URGENT))
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            'ALL',
            TicketCustomerType.SUBSCRIBER,
            TicketCustomerType.ADVERTISER,
            TicketCustomerType.GUEST,
          ] as const
        ).map((type) => (
          <Button
            key={type}
            type="button"
            size="sm"
            variant={customerFilter === type ? 'default' : 'outline'}
            className="rounded-xl"
            onClick={() => setCustomerFilter(type)}
          >
            {type === 'ALL' ? 'همه مشتریان' : TICKET_CUSTOMER_TYPE_LABELS[type]}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          id="ticket-search"
          placeholder="جستجو در موضوع، مشتری، متن، شماره تیکت..."
          value={search}
          onChange={setSearch}
          aria-label="جستجوی تیکت"
          className="min-w-[16rem] flex-1"
        />
        <ExportToolbar
          title="گزارش تیکت‌های پشتیبانی"
          subtitle="خروجی مدیریتی CRM — تیکت‌های فیلترشده"
          filenameBase="tickets-report"
          columns={[
            { key: 'id', header: 'شماره', width: 12 },
            { key: 'subject', header: 'موضوع', width: 28 },
            { key: 'customer', header: 'مشتری', width: 18 },
            { key: 'customerType', header: 'نوع مشتری', width: 14 },
            { key: 'priority', header: 'اولویت', width: 12 },
            { key: 'status', header: 'وضعیت', width: 12 },
            { key: 'createdAt', header: 'تاریخ', width: 16 },
            { key: 'replies', header: 'پاسخ‌ها', width: 10 },
          ]}
          rows={filtered.map((row) => ({
            id: getTicketShortId(row.id),
            subject: row.subject,
            customer: row.customerName,
            customerType: TICKET_CUSTOMER_TYPE_LABELS[row.customerType],
            priority: TICKET_PRIORITY_LABELS[row.priority],
            status: TICKET_STATUS_LABELS[row.status],
            createdAt: formatJalali(row.createdAt, true),
            replies: row._count.replies,
          }))}
          onDone={setMessage}
          onError={setError}
        />
      </div>

      <div className="hidden md:block">
        <DataTable columns={columns} data={filtered} showSearch={false} />
      </div>

      <ul className="space-y-3 md:hidden" aria-label="فهرست تیکت‌ها">
        {filtered.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => setSelected(row)}
              className="surface-card hover:border-primary/40 w-full rounded-2xl p-4 text-start transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="leading-snug font-semibold">{row.subject}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    #{getTicketShortId(row.id)} — {row.customerName}
                  </p>
                </div>
                <Badge variant={TICKET_STATUS_VARIANT[row.status]}>
                  {TICKET_STATUS_LABELS[row.status]}
                </Badge>
              </div>
              <div className="text-muted-foreground mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant={TICKET_PRIORITY_VARIANT[row.priority]}>
                  {TICKET_PRIORITY_LABELS[row.priority]}
                </Badge>
                <span>{formatJalali(row.createdAt, true)}</span>
                <span>{formatNumber(row._count.replies)} پاسخ</span>
              </div>
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="border-border text-muted-foreground rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
            تیکتی یافت نشد.
          </li>
        )}
      </ul>

      {selected && (
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{selected.subject}</p>
                <p className="text-muted-foreground text-sm">
                  #{getTicketShortId(selected.id)} — {selected.customerName}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={TICKET_STATUS_VARIANT[selected.status]}>
                    {TICKET_STATUS_LABELS[selected.status]}
                  </Badge>
                  <Badge variant={TICKET_PRIORITY_VARIANT[selected.priority]}>
                    {TICKET_PRIORITY_LABELS[selected.priority]}
                  </Badge>
                  <Badge variant="outline">
                    {TICKET_CUSTOMER_TYPE_LABELS[selected.customerType]}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/crm/tickets/${selected.id}`}>
                  <Button size="sm" variant="outline" className="rounded-xl">
                    صفحه کامل
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setSelected(null)}
                >
                  بستن
                </Button>
              </div>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-muted-foreground">ایمیل</p>
                <p dir="ltr">{selected.customerEmail ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">تلفن</p>
                <p dir="ltr">{selected.customerPhone ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">مسئول</p>
                <p>{selected.assigneeName ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">ایجاد</p>
                <p>{formatJalali(selected.createdAt, true)}</p>
              </div>
            </div>

            {(selected.subscriberId || selected.advertiserId) && (
              <div className="flex flex-wrap gap-3 text-sm">
                {selected.subscriberId && (
                  <Link href="/crm/subscribers" className="text-primary hover:underline">
                    مشاهده مشترک
                  </Link>
                )}
                {selected.advertiserId && (
                  <Link href="/crm/advertisers" className="text-primary hover:underline">
                    مشاهده آگهی‌دهنده
                  </Link>
                )}
              </div>
            )}

            <div className="bg-muted/40 rounded-xl p-4 text-sm whitespace-pre-wrap">
              {selected.body}
            </div>

            {canManage && (
              <div className="border-border space-y-3 rounded-xl border p-4">
                <p className="font-semibold">پاسخ به تیکت</p>
                {detailError && <StatusBanner type="error" message={detailError} />}
                <Textarea
                  rows={4}
                  value={detailReply}
                  onChange={(e) => setDetailReply(e.target.value)}
                  placeholder="پاسخ به مشتری..."
                  className="rounded-xl"
                  disabled={isDetailPending}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={detailInternal}
                    onChange={(e) => setDetailInternal(e.target.checked)}
                    disabled={isDetailPending}
                  />
                  یادداشت داخلی
                </label>
                <LoadingButton
                  type="button"
                  className="rounded-xl"
                  loading={isDetailPending}
                  onClick={submitDetailReply}
                >
                  ارسال پاسخ
                </LoadingButton>
              </div>
            )}

            <div className="space-y-2">
              <p className="font-semibold">گفتگو ({formatNumber(selected.replies.length)})</p>
              {selected.replies.length === 0 ? (
                <p className="text-muted-foreground text-sm">هنوز پاسخی ثبت نشده.</p>
              ) : (
                <ul className="max-h-72 space-y-2 overflow-y-auto">
                  {selected.replies.map((reply) => (
                    <li
                      key={reply.id}
                      className="border-border bg-muted/20 rounded-xl border p-3 text-sm"
                    >
                      <div className="text-muted-foreground mb-1 flex flex-wrap justify-between gap-2 text-xs">
                        <span>
                          {reply.authorName ?? 'سیستم'}
                          {reply.isInternal ? ' (داخلی)' : ''}
                        </span>
                        <span>{formatJalali(reply.createdAt, true)}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{reply.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <QuickReplyDialog
        ticket={replyTarget}
        open={Boolean(replyTarget)}
        onClose={() => setReplyTarget(null)}
        onSent={refresh}
      />
    </div>
  );
}
