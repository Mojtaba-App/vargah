import { Container } from '@vargah/ui/components/container';
import { SkeletonCard, SkeletonIssueCard } from '@vargah/ui/components/skeleton';

export default function HomeLoading() {
  return (
    <>
      <div className="content-under-header border-b border-border" aria-hidden="true">
        <div className="clear-site-header min-h-[min(68vh,620px)] animate-pulse bg-muted/40" />
      </div>
      <Container className="section-padding space-y-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="mx-auto aspect-[3/4] w-full max-w-sm animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded-md bg-muted" />
            <div className="h-4 w-full rounded-md bg-muted" />
            <div className="h-4 w-2/3 rounded-md bg-muted" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonIssueCard key={i} />
          ))}
        </div>
      </Container>
      <span className="sr-only">در حال بارگذاری...</span>
    </>
  );
}
