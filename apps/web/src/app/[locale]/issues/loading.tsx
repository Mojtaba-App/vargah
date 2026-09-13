import { Container } from '@vargah/ui/components/container';
import { SkeletonIssueCard, SkeletonPageHeader } from '@vargah/ui/components/skeleton';

export default function IssuesLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <Container className="py-10">
        <div className="mb-8 flex gap-3" aria-hidden="true">
          <div className="h-10 w-32 rounded-md bg-muted" />
          <div className="h-10 w-32 rounded-md bg-muted" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonIssueCard key={i} />
          ))}
        </div>
      </Container>
      <span className="sr-only">در حال بارگذاری شماره‌ها...</span>
    </>
  );
}
