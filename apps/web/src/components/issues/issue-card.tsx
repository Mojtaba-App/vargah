import { Link } from '@/i18n/navigation';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { Badge } from '@vargah/ui/components/badge';
import { formatJalaliDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Issue } from '@/data/types';

type IssueCardProps = {
  issue: Issue;
  className?: string;
  priority?: boolean;
};

export function IssueCard({ issue, className, priority = false }: IssueCardProps) {
  return (
    <Link
      href={`/issues/${issue.slug}`}
      className={cn('group surface-card flex flex-col overflow-hidden', className)}
    >
      <div className="relative overflow-hidden p-2 pb-0">
        <OptimizedImage
          src={issue.coverImage}
          alt={`کاور ${issue.title}`}
          fill
          wrapperClassName="aspect-[3/4] overflow-hidden rounded-xl bg-muted"
          className="transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 50vw, 25vw"
          priority={priority}
        />
        <Badge className="absolute start-5 top-5 rounded-full bg-primary px-3 text-primary-foreground shadow-sm">
          شماره {issue.number}
        </Badge>
      </div>
      <div className="p-5">
        <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">{issue.title}</h3>
        {issue.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{issue.description}</p>
        ) : null}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <time dateTime={issue.publishedAt}>{formatJalaliDate(issue.publishedAt, 'MMMM YYYY')}</time>
          <span>{issue.pageCount} صفحه</span>
        </div>
      </div>
    </Link>
  );
}
