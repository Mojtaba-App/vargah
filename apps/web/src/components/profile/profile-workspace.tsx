'use client';

import { useMemo, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Input, Label, Textarea } from '@vargah/ui/components/input';
import { Badge } from '@vargah/ui/components/badge';
import { Card } from '@vargah/ui/components/card';

import type { CustomerProfile } from '@/actions/profile';
import {
  createCustomerTicket,
  updateCustomerAddress,
  updateCustomerProfile,
} from '@/actions/profile';
import { useCustomerAuth } from '@/components/auth/customer-auth-provider';
import { ProvinceCityField } from '@/components/forms/province-city-field';
import { ProfileAvatarEditor } from '@/components/profile/profile-avatar-editor';
import { ProfilePurchaseHistory } from '@/components/profile/profile-purchase-history';
import {
  useCustomerSubscriptionView,
  useDeliveryContactPhone,
} from '@/components/profile/profile-subscription-utils';
import { ProfileTabNav, type ProfileTabId } from '@/components/profile/profile-tab-nav';
import { FormActionButton } from '@/components/shared/form-action-button';
import { CustomerAvatar } from '@/components/shared/customer-avatar';
import { useSubscriptionCart } from '@/components/subscription/subscription-cart-provider';
import { isPlaceholderCustomerEmail, maskPhone } from '@/lib/customer-auth/phone';
import { formatJalaliDate } from '@/lib/date';
import { cn, formatPrice } from '@/lib/utils';

const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: 'باز',
  IN_PROGRESS: 'در حال پیگیری',
  RESOLVED: 'حل‌شده',
  CLOSED: 'بسته',
};

type ProfileWorkspaceProps = {
  profile: CustomerProfile | null;
};

export function ProfileWorkspace({ profile }: ProfileWorkspaceProps) {
  const { openLogin, isAuthenticated } = useCustomerAuth();
  const { itemCount } = useSubscriptionCart();
  const searchParams = useSearchParams();
  const initialTab = parseProfileTab(searchParams.get('tab'));
  const [tab, setTab] = useState<ProfileTabId>(initialTab);

  useEffect(() => {
    setTab(parseProfileTab(searchParams.get('tab')));
  }, [searchParams]);

  if (!isAuthenticated || !profile) {
    return (
      <Card className="mx-auto max-w-lg overflow-hidden p-0 text-center">
        <div className="from-primary/15 bg-gradient-to-br to-transparent px-8 pt-10 pb-8">
          <div className="bg-background mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl shadow-sm">
            <span className="text-2xl">👤</span>
          </div>
          <h2 className="text-xl font-bold">پروفایل کاربری</h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            برای مدیریت اشتراک، آدرس، سوابق خرید و پشتیبانی با شماره موبایل وارد شوید.
          </p>
          <FormActionButton className="mt-6" type="button" onClick={() => openLogin('profile')}>
            ورود / ثبت‌نام
          </FormActionButton>
        </div>
      </Card>
    );
  }

  const historyCount = profile.payments.filter((p) => p.status !== 'pending').length;
  const tabCounts = {
    payments: historyCount + (itemCount > 0 ? 1 : 0),
    tickets: profile.tickets.length,
  };

  return (
    <ProfileWorkspaceContent profile={profile} tab={tab} setTab={setTab} tabCounts={tabCounts} />
  );
}

function ProfileWorkspaceContent({
  profile,
  tab,
  setTab,
  tabCounts,
}: {
  profile: CustomerProfile;
  tab: ProfileTabId;
  setTab: (tab: ProfileTabId) => void;
  tabCounts: { payments: number; tickets: number };
}) {
  const subscriptionView = useCustomerSubscriptionView(profile);

  return (
    <div className="grid gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-8">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="border-primary/15 from-primary/10 via-background to-background overflow-hidden bg-gradient-to-br p-4">
          <div className="flex items-center gap-3">
            <CustomerAvatar name={profile.name} avatar={profile.avatar} size="md" />
            <div className="min-w-0">
              <p className="truncate font-bold">{profile.name}</p>
              <p className="text-muted-foreground mt-0.5 truncate text-xs" dir="ltr">
                {profile.phone ? maskPhone(profile.phone) : '—'}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={subscriptionView.hasActiveSubscription ? 'default' : 'secondary'}>
              {subscriptionView.displayLabel}
            </Badge>
            {profile.planName && (
              <Badge variant="outline" className="font-normal">
                {profile.planName}
              </Badge>
            )}
          </div>
        </Card>

        <ProfileTabNav active={tab} onChange={setTab} counts={tabCounts} />
      </aside>

      <div className="min-w-0">
        {tab === 'overview' && (
          <OverviewTab profile={profile} subscriptionView={subscriptionView} onNavigate={setTab} />
        )}
        {tab === 'account' && <AccountTab profile={profile} />}
        {tab === 'address' && <AddressTab profile={profile} />}
        {tab === 'payments' && (
          <ProfilePurchaseHistory
            payments={profile.payments}
            subscription={{
              statusLabel: subscriptionView.displayLabel,
              planName: profile.planName,
              expiresAt: profile.expiresAt,
              showExpiredNotice: subscriptionView.showExpiredNotice,
              showPendingNotice: subscriptionView.showPendingNotice,
            }}
          />
        )}
        {tab === 'tickets' && <TicketsTab profile={profile} />}
      </div>
    </div>
  );
}

function OverviewTab({
  profile,
  subscriptionView,
  onNavigate,
}: {
  profile: CustomerProfile;
  subscriptionView: ReturnType<typeof useCustomerSubscriptionView>;
  onNavigate: (tab: ProfileTabId) => void;
}) {
  const { items, itemCount, totalAmount } = useSubscriptionCart();
  const paidPayments = profile.payments.filter((p) => p.status === 'paid');
  const recentPurchases = [...profile.payments]
    .filter((p) => p.status !== 'pending')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`سلام، ${profile.name}`}
        description="خلاصه وضعیت اشتراک، خریدها و پشتیبانی"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="وضعیت اشتراک" value={subscriptionView.displayLabel} accent />
        <StatCard label="پلن فعلی" value={profile.planName ?? 'بدون اشتراک'} />
        <StatCard
          label="تاریخ انقضا"
          value={profile.expiresAt ? formatJalaliDate(profile.expiresAt) : '—'}
        />
        <StatCard label="خریدهای موفق" value={`${paidPayments.length} مورد`} />
      </div>

      {items.length > 0 && (
        <Card className="border-violet-500/20 bg-violet-500/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">سبد خرید باز دارید</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {itemCount} مورد · جمع {formatPrice(totalAmount)} تومان
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="border-border hover:bg-muted rounded-xl border px-3 py-2 text-sm font-medium"
                onClick={() => onNavigate('payments')}
              >
                مشاهده در خریدها
              </button>
              <Link href="/subscription#checkout">
                <FormActionButton type="button">ادامه و نهایی کردن</FormActionButton>
              </Link>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-semibold">آخرین خریدها</h3>
          {(recentPurchases.length > 0 || items.length > 0) && (
            <button
              type="button"
              className="text-primary text-xs font-medium hover:underline"
              onClick={() => onNavigate('payments')}
            >
              مشاهده همه
            </button>
          )}
        </div>
        {recentPurchases.length === 0 ? (
          <div className="border-border rounded-xl border border-dashed px-4 py-8 text-center">
            <p className="text-muted-foreground text-sm">هنوز خریدی ثبت نشده است.</p>
            <Link
              href="/subscription"
              className="text-primary mt-3 inline-flex text-sm font-semibold underline-offset-2 hover:underline"
            >
              مشاهده پلن‌های اشتراک
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {recentPurchases.map((payment) => (
              <li
                key={payment.id}
                className="border-border/70 flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{payment.plan}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {formatJalaliDate(payment.date, 'D MMMM YYYY')}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold tabular-nums">
                  {formatPrice(payment.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AccountTab({ profile }: { profile: CustomerProfile }) {
  const router = useRouter();
  const { setCustomer, customer } = useCustomerAuth();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(
    isPlaceholderCustomerEmail(profile.email) ? '' : profile.email,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await updateCustomerProfile({ name, email });
        if (customer) setCustomer({ ...customer, name });
        setMessage('اطلاعات حساب ذخیره شد.');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در ذخیره');
      }
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="حساب کاربری" description="تصویر پروفایل و اطلاعات تماس" />
      <ProfileAvatarEditor name={profile.name} avatar={profile.avatar} />
      <Card className="p-6">
        <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name" required>
              نام
            </Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email" required>
              ایمیل
            </Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              placeholder="example@mail.com"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>موبایل (تأیید‌شده)</Label>
            <Input value={profile.phone ?? ''} disabled dir="ltr" className="rounded-xl" />
          </div>
          {message && <p className="text-sm text-emerald-600 md:col-span-2">{message}</p>}
          {error && <p className="text-destructive text-sm md:col-span-2">{error}</p>}
          <div className="md:col-span-2">
            <FormActionButton loading={pending} loadingText="در حال ذخیره...">
              ذخیره تغییرات
            </FormActionButton>
          </div>
        </form>
      </Card>
    </div>
  );
}

function AddressTab({ profile }: { profile: CustomerProfile }) {
  const router = useRouter();
  const deliveryContact = useDeliveryContactPhone(profile);
  const [editing, setEditing] = useState(!profile.address);
  const [name, setName] = useState(profile.name);
  const [deliveryPhone, setDeliveryPhone] = useState(profile.deliveryPhone ?? profile.phone ?? '');
  const [province, setProvince] = useState(profile.province ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [address, setAddress] = useState(profile.address ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await updateCustomerAddress({ name, deliveryPhone, province, city, address });
        setMessage('آدرس با موفقیت ذخیره شد.');
        setEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در ذخیره آدرس');
      }
    });
  };

  if (!editing) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="آدرس ارسال"
          description="فقط برای ارسال نسخه چاپی مجله — جدا از اطلاعات ورود حساب"
        />
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Badge variant="outline">{profile.address ? 'ثبت شده' : 'ثبت نشده'}</Badge>
            <FormActionButton type="button" variant="secondary" onClick={() => setEditing(true)}>
              ویرایش آدرس
            </FormActionButton>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoRow label="نام گیرنده" value={profile.name} />
            <InfoRow label="موبایل حساب (ورود)" value={profile.phone ?? '—'} dir="ltr" />
            <InfoRow label="تلفن تماس برای ارسال" value={deliveryContact ?? '—'} dir="ltr" />
            <InfoRow label="استان" value={profile.province ?? '—'} />
            <InfoRow label="شهر" value={profile.city ?? '—'} />
            <InfoRow
              label="آدرس کامل"
              value={profile.address ?? 'ثبت نشده'}
              className="sm:col-span-2"
            />
          </dl>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="ویرایش آدرس"
        description="تلفن تماس برای ارسال با موبایل ورود به حساب متفاوت است و اینجا فقط برای پست استفاده می‌شود"
      />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-border/70 bg-muted/30 rounded-xl border px-4 py-3 text-sm">
            <p className="font-medium">موبایل حساب (ورود)</p>
            <p className="text-muted-foreground mt-1" dir="ltr">
              {profile.phone ?? '—'}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              این شماره با OTP تأیید شده و از این بخش قابل تغییر نیست.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addr-name" required>
                نام گیرنده
              </Label>
              <Input
                id="addr-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-delivery-phone" required>
                تلفن تماس برای ارسال
              </Label>
              <Input
                id="addr-delivery-phone"
                value={deliveryPhone}
                onChange={(e) => setDeliveryPhone(e.target.value)}
                required
                dir="ltr"
                placeholder="09xxxxxxxxx"
                className="rounded-xl"
              />
              <p className="text-muted-foreground text-xs">
                برای تماس پستی — می‌تواند با موبایل حساب یکی باشد.
              </p>
            </div>
          </div>

          <ProvinceCityField
            province={province}
            city={city}
            onProvinceChange={setProvince}
            onCityChange={setCity}
            disabled={pending}
            provinceId="addr-province"
            cityId="addr-city"
          />

          <div className="space-y-2">
            <Label htmlFor="addr-address" required>
              آدرس کامل
            </Label>
            <Textarea
              id="addr-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows={3}
              className="rounded-xl"
            />
          </div>

          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <FormActionButton loading={pending} loadingText="در حال ذخیره...">
              ذخیره آدرس
            </FormActionButton>
            {profile.address && (
              <FormActionButton type="button" variant="ghost" onClick={() => setEditing(false)}>
                انصراف
              </FormActionButton>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

function TicketsTab({ profile }: { profile: CustomerProfile }) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sortedTickets = useMemo(
    () =>
      [...profile.tickets].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [profile.tickets],
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await createCustomerTicket({ subject, body });
        setSubject('');
        setBody('');
        setMessage('تیکت شما ثبت شد و در پنل پشتیبانی پیگیری می‌شود.');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در ثبت تیکت');
      }
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="پشتیبانی" description="ثبت و پیگیری تیکت‌های پشتیبانی" />

      <Card className="p-6">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-subject" required>
              موضوع
            </Label>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-body" required>
              پیام
            </Label>
            <Textarea
              id="ticket-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              maxLength={5000}
              className="rounded-xl"
            />
          </div>
          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-destructive text-sm">{error}</p>}
          <FormActionButton loading={pending} loadingText="در حال ارسال...">
            ارسال تیکت
          </FormActionButton>
        </form>
      </Card>

      <div>
        <h3 className="mb-3 font-semibold">تیکت‌های قبلی ({sortedTickets.length})</h3>
        {sortedTickets.length === 0 ? (
          <Card className="text-muted-foreground border-dashed p-8 text-center text-sm">
            هنوز تیکتی ثبت نکرده‌اید.
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedTickets.map((ticket) => (
              <Card key={ticket.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatJalaliDate(ticket.createdAt, 'D MMMM YYYY — HH:mm')}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-3 line-clamp-3 text-sm">{ticket.body}</p>
                {ticket.replyCount > 0 && (
                  <p className="text-primary mt-2 text-xs">{ticket.replyCount} پاسخ از پشتیبانی</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-1.5 text-sm">{description}</p>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn('mt-2 text-lg font-bold', accent && 'text-primary')}>{value}</p>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  dir,
  className,
}: {
  label: string;
  value: string;
  dir?: 'ltr' | 'rtl';
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 font-medium" dir={dir}>
        {value}
      </dd>
    </div>
  );
}

const PROFILE_TABS: ProfileTabId[] = ['overview', 'account', 'address', 'payments', 'tickets'];

function parseProfileTab(value: string | null): ProfileTabId {
  if (value && PROFILE_TABS.includes(value as ProfileTabId)) {
    return value as ProfileTabId;
  }
  return 'overview';
}
