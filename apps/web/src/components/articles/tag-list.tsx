import { Link } from '@/i18n/navigation';
import { tags } from '@/data/mock/tags';
import { cn } from '@/lib/utils';

type TagListProps = {
  activeSlug?: string;
  tagIds?: string[];
  tags?: { id: string; slug: string; name: string }[];
  className?: string;
};

export function TagList({ activeSlug, tagIds, tags: tagsProp, className }: TagListProps) {
  const displayTags = tagsProp ?? (tagIds ? tags.filter((t) => tagIds.includes(t.id)) : tags);

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displayTags.map((tag) => (
        <Link
          key={tag.id}
          href={`/articles/tag/${tag.slug}`}
          className={cn(
            'rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted',
            activeSlug === tag.slug && 'border-primary bg-primary/10 text-primary',
          )}
        >
          #{tag.name}
        </Link>
      ))}
    </div>
  );
}
