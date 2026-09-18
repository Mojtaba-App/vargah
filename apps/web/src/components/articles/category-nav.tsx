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
          'hover:bg-muted block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
              'hover:bg-muted block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              activeSlug === cat.slug && 'bg-primary/10 text-primary',
            )}
          >
            {cat.name}
          </Link>
          {cat.children.length > 0 && (
            <div className="border-border me-3 border-s ps-2">
              {cat.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/articles/category/${child.slug}`}
                  className={cn(
                    'text-muted-foreground hover:bg-muted hover:text-foreground block rounded-lg px-3 py-1.5 text-sm transition-colors',
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
