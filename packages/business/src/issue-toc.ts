export type IssueTocEntry = {
  title: string;
  page?: number;
  articleId?: string;
};

export function parseIssueTocEntries(value: unknown): IssueTocEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      title: String(item.title ?? ''),
      page: typeof item.page === 'number' ? item.page : undefined,
      articleId: typeof item.articleId === 'string' ? item.articleId : undefined,
    }))
    .filter((item) => item.title.trim().length > 0);
}
