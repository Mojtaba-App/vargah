import { ActivityIcon } from '@/components/dashboard/dashboard-icons';
import { formatAuditMessage, formatRelativeTime } from '@/lib/audit/messages';
import { formatJalali } from '@/lib/utils';

type ActivityItem = {
  id: string;
  action: string;
  entity: string;
  userName: string;
  changes?: unknown;
  createdAt: Date;
};

type ActivityFeedProps = {
  items: ActivityItem[];
  title?: string;
  showUserName?: boolean;
};

export function ActivityFeed({
  items,
  title = 'آخرین فعالیت‌ها',
  showUserName = true,
}: ActivityFeedProps) {
  return (
    <section className="border-border/80 bg-card rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ActivityIcon className="text-primary size-5" />
        <h2 className="font-bold">{title}</h2>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">فعالیتی ثبت نشده است.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="border-primary/20 relative flex gap-3 border-s-2 ps-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  {showUserName ? (
                    <>
                      <span className="font-semibold">{item.userName}</span>
                      <span className="text-muted-foreground"> — </span>
                    </>
                  ) : null}
                  <span>
                    {formatAuditMessage({
                      action: item.action,
                      entity: item.entity,
                      changes: item.changes,
                    })}
                  </span>
                </p>
                <time className="text-muted-foreground mt-1 block text-xs">
                  {formatJalali(item.createdAt, true)} · {formatRelativeTime(item.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
