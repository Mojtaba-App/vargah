import { Container } from '@vargah/ui/components/container';
import { SkeletonCard, SkeletonPageHeader } from '@vargah/ui/components/skeleton';

export default function ArticlesLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <Container className="py-10">
        <div className="bg-muted mb-8 h-11 animate-pulse rounded-md" aria-hidden="true" />
        <div className="grid gap-8 lg:grid-cols-4">
          <aside className="hidden space-y-4 lg:block" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-muted h-8 rounded-md" />
            ))}
          </aside>
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </Container>
      <span className="sr-only">در حال بارگذاری مقالات...</span>
    </>
  );
}
