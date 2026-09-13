import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { PublicCategory } from '@/lib/db/taxonomy';

type CategoryNavProps = {
  categories: PublicCategory[];
  activeSlug?: string;
  className?: string;
};

export function CategoryNav({ categories, activeSlug, className }: CategoryNavProps) {
  return (
    <nav aria-label="دسته‌بندی موضوعی" className={cn('space-y-1', className)}>
      <Link
        href="/articles"
        className={cn(
          'block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
          !activeSlug && 'bg-primary/10 text-primary',
        )}
      >
        همه مطالب
      </Link>
      {categories.map((cat) => (
        <div key={cat.id}>
          <Link
            href={`/articles/category/${cat.slug}`}
            className={cn(
              'block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
              activeSlug === cat.slug && 'bg-primary/10 text-primary',
            )}
          >
            {cat.name}
          </Link>
          {cat.children.length > 0 && (
            <div className="me-3 border-s border-border ps-2">
              {cat.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/articles/category/${child.slug}`}
                  className={cn(
                    'block rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                    activeSlug === child.slug && 'bg-primary/10 text-primary',
                  )}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
