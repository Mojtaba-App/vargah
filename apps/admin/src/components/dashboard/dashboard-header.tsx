import { formatJalali } from '@/lib/utils';

type DashboardHeaderProps = {
  userName: string;
};

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const today = formatJalali(new Date());

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">داشبورد مدیریت</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">سلام، {userName}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          نمای کلی از عملکرد محتوا، مخاطبان و درآمد ماهنامه — {today}
        </p>
      </div>
      <div className="surface-card rounded-2xl px-4 py-3 text-sm">
        <p className="text-muted-foreground">وضعیت سیستم</p>
        <p className="mt-1 font-semibold text-primary">فعال و به‌روز</p>
      </div>
    </header>
  );
}
