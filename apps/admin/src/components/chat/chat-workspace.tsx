'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { Input, Label, Select, Textarea } from '@vargah/ui/components/input';

import {
  assignChat,
  closeChat,
  pollChatInbox,
  reopenChat,
  replyToChat,
  type AdminChatConversationDto,
  type AdminChatMessageDto,
} from '@/actions/chat';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  CHAT_STATUS_LABELS,
  CHAT_STATUS_VARIANT,
  type ChatStatusFilter,
} from '@/lib/chat/constants';
import { cn, formatJalali } from '@/lib/utils';

const POLL_MS = 2000;

type StaffOption = { id: string; name: string | null };

type ChatWorkspaceProps = {
  initialConversations: AdminChatConversationDto[];
  staff: StaffOption[];
  canManage: boolean;
};

function MessageBubble({ message }: { message: AdminChatMessageDto }) {
  const isGuest = message.senderType === 'GUEST';
  const isSystem = message.senderType === 'SYSTEM';

  if (isSystem) {
    return (
      <p className="text-muted-foreground px-2 py-1 text-center text-[11px]">{message.body}</p>
    );
  }

  return (
    <div className={cn('flex', isGuest ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
          isGuest
            ? 'bg-muted text-foreground rounded-ss-md'
            : 'bg-primary text-primary-foreground rounded-se-md',
        )}
      >
        <p className="mb-0.5 text-[10px] opacity-80">
          {isGuest ? 'مهمان' : (message.agentName ?? 'کارشناس')}
        </p>
        <p className="whitespace-pre-wrap">{message.body}</p>
        <p className={cn('mt-1 text-[10px]', isGuest ? 'text-muted-foreground' : 'opacity-70')}>
          {formatJalali(message.createdAt, true)}
        </p>
      </div>
    </div>
  );
}

export function ChatWorkspace({ initialConversations, staff, canManage }: ChatWorkspaceProps) {
  const [statusFilter, setStatusFilter] = useState<ChatStatusFilter>('ALL');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations.find((c) => c.status === 'WAITING' || c.status === 'OPEN')?.id ??
      initialConversations[0]?.id ??
      null,
  );
  const [messages, setMessages] = useState<AdminChatMessageDto[]>([]);
  const [selected, setSelected] = useState<AdminChatConversationDto | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const refresh = useCallback(async () => {
    const result = await pollChatInbox({
      status: statusFilter,
      q: debouncedQuery,
      selectedId: selectedIdRef.current,
    });
    setConversations(result.conversations);
    if (result.selected) {
      setSelected(result.selected.conversation);
      setMessages(result.selected.messages);
    } else if (selectedIdRef.current) {
      setSelected(null);
      setMessages([]);
    }
  }, [statusFilter, debouncedQuery]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh().catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, selectedId]);

  const runAction = (fn: () => Promise<void>, successMessage?: string) => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        await fn();
        await refresh();
        if (successMessage) setNotice(successMessage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'عملیات ناموفق بود.');
      }
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="border-border bg-card flex min-h-[32rem] flex-col overflow-hidden rounded-2xl border">
        <div className="border-border space-y-2 border-b p-3">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ChatStatusFilter)}
            aria-label="فیلتر وضعیت"
          >
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="WAITING">در انتظار</option>
            <option value="OPEN">فعال</option>
            <option value="CLOSED">بسته</option>
          </Select>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو نام یا موبایل…"
            aria-label="جستجو"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">گفتگویی یافت نشد.</p>
          ) : (
            conversations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  'border-border hover:bg-muted/50 w-full border-b px-3 py-3 text-start transition-colors',
                  selectedId === item.id && 'bg-muted/70',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.guestName}</p>
                    <p className="text-muted-foreground truncate text-xs" dir="ltr">
                      {item.guestPhone}
                    </p>
                  </div>
                  <Badge variant={CHAT_STATUS_VARIANT[item.status]}>
                    {CHAT_STATUS_LABELS[item.status]}
                  </Badge>
                </div>
                {item.preview ? (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{item.preview}</p>
                ) : null}
                <p className="text-muted-foreground mt-1 text-[10px]">
                  {formatJalali(item.lastMessageAt, true)}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="border-border bg-card flex min-h-[32rem] flex-col overflow-hidden rounded-2xl border">
        {!selected ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm">
            یک گفتگو را از فهرست انتخاب کنید.
          </div>
        ) : (
          <>
            <header className="border-border flex flex-wrap items-start justify-between gap-3 border-b p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold">{selected.guestName}</h2>
                  <Badge variant={CHAT_STATUS_VARIANT[selected.status]}>
                    {CHAT_STATUS_LABELS[selected.status]}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-sm" dir="ltr">
                  {selected.guestPhone}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  مسئول: {selected.assigneeName ?? 'بدون مسئول'} ·{' '}
                  {selected.messageCount.toLocaleString('fa-IR')} پیام
                </p>
              </div>
              {canManage ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={selected.assignedToId ?? ''}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      runAction(async () => {
                        await assignChat(selected.id, value);
                      }, 'مسئول گفتگو به‌روز شد.');
                    }}
                    disabled={pending || selected.status === 'CLOSED'}
                    aria-label="مسئول گفتگو"
                    className="min-w-[10rem]"
                  >
                    <option value="">بدون مسئول</option>
                    {staff.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name ?? user.id}
                      </option>
                    ))}
                  </Select>
                  {selected.status === 'CLOSED' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        runAction(async () => {
                          await reopenChat(selected.id);
                        }, 'گفتگو دوباره باز شد.')
                      }
                    >
                      بازگشایی
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        runAction(async () => {
                          await closeChat(selected.id);
                        }, 'گفتگو بسته شد.')
                      }
                    >
                      بستن گفتگو
                    </Button>
                  )}
                </div>
              ) : null}
            </header>

            {(error || notice) && (
              <div className="space-y-2 px-4 pt-3">
                {error ? (
                  <StatusBanner type="error" message={error} onDismiss={() => setError(null)} />
                ) : null}
                {notice ? (
                  <StatusBanner type="success" message={notice} onDismiss={() => setNotice(null)} />
                ) : null}
              </div>
            )}

            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>

            {canManage && selected.status !== 'CLOSED' ? (
              <form
                className="border-border border-t p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = draft.trim();
                  if (!text) return;
                  const previous = draft;
                  setDraft('');
                  runAction(async () => {
                    try {
                      await replyToChat(selected.id, text);
                    } catch (err) {
                      setDraft(previous);
                      throw err;
                    }
                  });
                }}
              >
                <Label htmlFor="chat-reply">پاسخ</Label>
                <Textarea
                  id="chat-reply"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="mt-1"
                  placeholder="پاسخ خود را بنویسید…"
                  disabled={pending}
                />
                <div className="mt-3 flex justify-end">
                  <LoadingButton type="submit" loading={pending} disabled={!draft.trim()}>
                    ارسال پاسخ
                  </LoadingButton>
                </div>
              </form>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
