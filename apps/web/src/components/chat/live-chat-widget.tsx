'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@vargah/ui/components/button';
import { Input, Label, Textarea } from '@vargah/ui/components/input';
import { isValidIranPhone } from '@vargah/security/phone';

import {
  endGuestChatSession,
  getGuestChatState,
  pollGuestChatMessages,
  sendGuestChatMessage,
  startGuestChat,
  type ChatConversationDto,
  type ChatFieldErrors,
  type ChatMessageDto,
} from '@/actions/chat';
import { cn } from '@/lib/utils';

const POLL_MS = 2500;
const CHAT_NOTICED_KEY = 'vargah_chat_icon_noticed_v2';
const MAX_NAME = 80;
const MAX_BODY = 2000;
const FALLBACK_ERROR = 'لطفاً اطلاعات را بررسی کنید و دوباره تلاش کنید.';

function toPublicChatError(message: string | undefined | null): string {
  const trimmed = message?.trim() ?? '';
  if (!trimmed) return FALLBACK_ERROR;
  if (/^[A-Z][A-Z0-9_]+$/.test(trimmed)) return FALLBACK_ERROR;
  if (/zod|prisma|failed|invalid|error|exception|stack|csrf|token|sql/i.test(trimmed)) {
    return FALLBACK_ERROR;
  }
  return trimmed;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function MessageBubble({ message }: { message: ChatMessageDto }) {
  const isGuest = message.senderType === 'GUEST';
  const isSystem = message.senderType === 'SYSTEM';

  if (isSystem) {
    return (
      <p className="px-2 py-1 text-center text-[11px] text-muted-foreground">{message.body}</p>
    );
  }

  return (
    <div className={cn('flex', isGuest ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
          isGuest
            ? 'rounded-ss-md bg-muted text-foreground'
            : 'rounded-se-md bg-primary text-primary-foreground',
        )}
      >
        {!isGuest && message.agentName ? (
          <p className="mb-0.5 text-[10px] opacity-80">{message.agentName}</p>
        ) : null}
        <p className="whitespace-pre-wrap">{message.body}</p>
        <p className={cn('mt-1 text-[10px]', isGuest ? 'text-muted-foreground' : 'opacity-70')}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-destructive">
      {message}
    </p>
  );
}

function validateStartForm(input: {
  name: string;
  phone: string;
  message: string;
}): ChatFieldErrors | null {
  const fields: ChatFieldErrors = {};
  const name = input.name.trim();
  const phone = input.phone.trim();
  const message = input.message.trim();

  if (!name) fields.name = 'پر کردن نام لازم است.';
  else if (name.length < 2) fields.name = 'نام حداقل ۲ کاراکتر باشد.';
  else if (name.length > MAX_NAME) fields.name = 'نام حداکثر ۸۰ کاراکتر باشد.';

  if (!phone) fields.phone = 'پر کردن شماره موبایل لازم است.';
  else if (!isValidIranPhone(phone)) {
    fields.phone = 'شماره موبایل معتبر نیست. نمونه: 09123456789';
  }

  if (message.length > MAX_BODY) {
    fields.message = 'پیام حداکثر ۲۰۰۰ کاراکتر باشد.';
  }

  return Object.keys(fields).length > 0 ? fields : null;
}

export function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [booting, setBooting] = useState(true);
  const [conversation, setConversation] = useState<ChatConversationDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ChatFieldErrors>({});
  const [draftError, setDraftError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [unread, setUnread] = useState(0);
  const [attract, setAttract] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  const lastMessageIdRef = useRef<string | null>(null);
  openRef.current = open;
  lastMessageIdRef.current = messages[messages.length - 1]?.id ?? null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (sessionStorage.getItem(CHAT_NOTICED_KEY) === '1') return;
    setAttract(true);
  }, []);

  const clearFieldError = (key: keyof ChatFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const state = await getGuestChatState();
        if (cancelled) return;
        setConversation(state.conversation);
        setMessages(state.messages);
      } catch {
        /* ignore boot errors */
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, open, scrollToBottom]);

  useEffect(() => {
    if (!conversation) return;

    const tick = async () => {
      try {
        const result = await pollGuestChatMessages(lastMessageIdRef.current);
        if (result.closed) {
          setConversation(null);
          setMessages([]);
          setError('گفتگو توسط پشتیبانی بسته شد.');
          return;
        }
        if (result.conversation) {
          setConversation(result.conversation);
        }
        if (result.messages.length > 0) {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            const fresh = result.messages.filter((m) => !known.has(m.id));
            if (fresh.length === 0) return prev;
            if (!openRef.current) {
              const agentNew = fresh.filter((m) => m.senderType === 'AGENT').length;
              if (agentNew > 0) setUnread((u) => u + agentNew);
            }
            return [...prev, ...fresh];
          });
        }
      } catch {
        /* keep previous */
      }
    };

    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => window.clearInterval(id);
  }, [conversation?.id]);

  const handleStartInvalid = (event: React.FormEvent<HTMLFormElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }
    event.preventDefault();

    const key =
      target.id === 'chat-guest-name'
        ? 'name'
        : target.id === 'chat-guest-phone'
          ? 'phone'
          : target.id === 'chat-guest-first'
            ? 'message'
            : null;
    if (!key) return;

    let message = 'لطفاً این فیلد را کامل کنید.';
    if (target.validity.valueMissing) {
      message =
        key === 'name'
          ? 'پر کردن نام لازم است.'
          : key === 'phone'
            ? 'پر کردن شماره موبایل لازم است.'
            : 'لطفاً این فیلد را کامل کنید.';
    } else if (target.validity.tooShort) {
      message = key === 'name' ? 'نام حداقل ۲ کاراکتر باشد.' : 'متن واردشده کوتاه است.';
    } else if (target.validity.tooLong) {
      message =
        key === 'name'
          ? 'نام حداکثر ۸۰ کاراکتر باشد.'
          : key === 'message'
            ? 'پیام حداکثر ۲۰۰۰ کاراکتر باشد.'
            : 'متن واردشده طولانی است.';
    } else if (target.validity.patternMismatch && key === 'phone') {
      message = 'شماره موبایل معتبر نیست. نمونه: 09123456789';
    }

    setError(null);
    setFieldErrors((prev) => ({ ...prev, [key]: message }));
    target.focus();
  };

  const handleStart = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setDraftError(null);

    const localFields = validateStartForm({ name, phone, message: firstMessage });
    if (localFields) {
      setFieldErrors(localFields);
      setError(
        toPublicChatError(
          localFields.name || localFields.phone || localFields.message || FALLBACK_ERROR,
        ),
      );
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      try {
        const result = await startGuestChat({
          name,
          phone,
          message: firstMessage.trim() || undefined,
        });
        if (!result.ok) {
          setFieldErrors(result.fields ?? {});
          setError(toPublicChatError(result.message));
          return;
        }
        setConversation(result.conversation);
        setMessages(result.messages);
        setFirstMessage('');
        setUnread(0);
        setError(null);
        setFieldErrors({});
      } catch (err) {
        setError(
          toPublicChatError(err instanceof Error ? err.message : FALLBACK_ERROR),
        );
      }
    });
  };

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      setDraftError('لطفاً پیام خود را بنویسید.');
      return;
    }
    if (text.length > MAX_BODY) {
      setDraftError('پیام حداکثر ۲۰۰۰ کاراکتر باشد.');
      return;
    }

    setError(null);
    setDraftError(null);
    setDraft('');
    startTransition(async () => {
      try {
        const result = await sendGuestChatMessage(text);
        if (!result.ok) {
          setDraft(text);
          setDraftError(result.fields?.body ? toPublicChatError(result.fields.body) : null);
          setError(toPublicChatError(result.message));
          return;
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === result.message.id)) return prev;
          return [...prev, result.message];
        });
      } catch (err) {
        setDraft(text);
        setError(
          toPublicChatError(err instanceof Error ? err.message : FALLBACK_ERROR),
        );
      }
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      await endGuestChatSession();
      setConversation(null);
      setMessages([]);
      setError(null);
      setFieldErrors({});
      setDraftError(null);
      setUnread(0);
    });
  };

  return (
    <div className="pointer-events-none fixed bottom-5 start-5 z-[70] flex flex-col items-start gap-3">
      {open ? (
        <div
          className="pointer-events-auto flex h-[min(32rem,calc(100vh-6rem))] w-[min(100vw-1.5rem,22rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          role="dialog"
          aria-label="گفتگوی آنلاین"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="min-w-0">
              <p className="text-sm font-bold">گفتگوی آنلاین وارگه</p>
              <p className="text-[11px] opacity-80">
                {conversation
                  ? conversation.status === 'WAITING'
                    ? 'در انتظار کارشناس'
                    : 'متصل به پشتیبانی'
                  : 'نام و موبایل را وارد کنید'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-sm opacity-90 hover:bg-white/15"
              aria-label="بستن"
            >
              بستن
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {booting ? (
              <p className="p-4 text-sm text-muted-foreground">در حال بارگذاری…</p>
            ) : !conversation ? (
              <form
                onSubmit={handleStart}
                onInvalid={handleStartInvalid}
                noValidate
                className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
              >
                <p className="text-xs leading-relaxed text-muted-foreground">
                  برای شروع گفتگو نام و شماره موبایل خود را وارد کنید تا کارشناسان پاسخ دهند.
                </p>
                {error ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
                <div>
                  <Label htmlFor="chat-guest-name" required>
                    نام
                  </Label>
                  <Input
                    id="chat-guest-name"
                    name="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearFieldError('name');
                      if (error) setError(null);
                    }}
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={MAX_NAME}
                    disabled={pending}
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'chat-guest-name-error' : undefined}
                    className="mt-1"
                  />
                  <FieldError id="chat-guest-name-error" message={fieldErrors.name} />
                </div>
                <div>
                  <Label htmlFor="chat-guest-phone" required>
                    موبایل
                  </Label>
                  <Input
                    id="chat-guest-phone"
                    name="phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearFieldError('phone');
                      if (error) setError(null);
                    }}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="09123456789"
                    required
                    pattern="^(\+98|0)?9\d{9}$"
                    title="شماره موبایل معتبر نیست. نمونه: 09123456789"
                    disabled={pending}
                    dir="ltr"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? 'chat-guest-phone-error' : undefined}
                    className="mt-1 text-start"
                  />
                  <FieldError id="chat-guest-phone-error" message={fieldErrors.phone} />
                </div>
                <div>
                  <Label htmlFor="chat-guest-first">پیام</Label>
                  <Textarea
                    id="chat-guest-first"
                    name="message"
                    value={firstMessage}
                    onChange={(e) => {
                      setFirstMessage(e.target.value);
                      clearFieldError('message');
                      if (error) setError(null);
                    }}
                    rows={3}
                    maxLength={MAX_BODY}
                    disabled={pending}
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? 'chat-guest-first-error' : undefined}
                    className="mt-1"
                  />
                  <FieldError id="chat-guest-first-error" message={fieldErrors.message} />
                </div>
                <Button type="submit" disabled={pending} className="mt-auto w-full">
                  {pending ? 'در حال اتصال…' : 'شروع گفتگو'}
                </Button>
              </form>
            ) : (
              <>
                <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </div>
                {error ? (
                  <p
                    role="alert"
                    className="mx-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
                <form onSubmit={handleSend} className="border-t border-border p-3">
                  <div className="flex gap-2">
                    <Input
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        if (draftError) setDraftError(null);
                        if (error) setError(null);
                      }}
                      placeholder="پیام خود را بنویسید…"
                      maxLength={MAX_BODY}
                      disabled={pending}
                      aria-invalid={Boolean(draftError)}
                      aria-describedby={draftError ? 'chat-draft-error' : undefined}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={pending || !draft.trim()} size="sm">
                      ارسال
                    </Button>
                  </div>
                  <FieldError id="chat-draft-error" message={draftError ?? undefined} />
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    شروع گفتگوی جدید
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            if (next && attract) {
              setAttract(false);
              try {
                sessionStorage.setItem(CHAT_NOTICED_KEY, '1');
              } catch {
                /* ignore */
              }
            }
            return next;
          });
          setUnread(0);
        }}
        className={cn(
          'pointer-events-auto relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          attract && !open
            ? 'chat-fab-attention'
            : 'transition-[transform,box-shadow] hover:scale-[1.03]',
        )}
        aria-label={open ? 'بستن گفتگو' : 'باز کردن گفتگوی آنلاین'}
        aria-expanded={open}
      >
        <ChatBubbleIcon className="size-6" />
        {unread > 0 && !open ? (
          <span className="absolute -top-0.5 -end-0.5 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? '۹+' : unread.toLocaleString('fa-IR')}
          </span>
        ) : null}
      </button>
    </div>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-3.8 2.85A.75.75 0 0 1 5 18.25V6.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9 9h6M9 12h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
