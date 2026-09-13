import { articles } from '@/data/mock/articles';
import { getAllCategoriesFlat } from '@/data/mock/categories';
import { getTagsByIds, tags } from '@/data/mock/tags';
import { getAuthorById } from '@/data/mock/authors';
import { persianSearchMatch } from '@/lib/search';
import type { Article } from '@/data/types';

export type SearchFilters = {
  query?: string;
  categorySlug?: string;
  tagSlug?: string;
};

export function searchArticles(filters: SearchFilters): Article[] {
  let results = [...articles];

  if (filters.categorySlug) {
    const categories = getAllCategoriesFlat();
    const category = categories.find((c) => c.slug === filters.categorySlug);
    if (category) {
      results = results.filter(
        (a) => a.categoryId === category.id || a.categoryId.startsWith(category.id),
      );
    }
  }

  if (filters.tagSlug) {
    const tag = tags.find((t) => t.slug === filters.tagSlug);
    if (tag) {
      results = results.filter((a) => a.tagIds.includes(tag.id));
    }
  }

  if (filters.query) {
    results = results.filter((article) => {
      const author = getAuthorById(article.authorId);
      const articleTags = getTagsByIds(article.tagIds)
        .map((t) => t.name)
        .join(' ');
      return persianSearchMatch(
        filters.query!,
        article.title,
        article.excerpt,
        author?.name ?? '',
        articleTags,
      );
    });
  }

  return results.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
