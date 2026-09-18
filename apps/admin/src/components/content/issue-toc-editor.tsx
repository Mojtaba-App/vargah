'use client';

import { Input, Label } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import type { IssueFormValues } from '@/lib/schemas/issue-form';

type ArticleOption = {
  id: string;
  title: string;
  readingTime: number;
};

type IssueTocEditorProps = {
  entries: IssueFormValues['tableOfContents'];
  articles: ArticleOption[];
  onChange: (entries: IssueFormValues['tableOfContents']) => void;
  disabled?: boolean;
};

export function IssueTocEditor({ entries, articles, onChange, disabled }: IssueTocEditorProps) {
  const addManualEntry = () => {
    onChange([...entries, { title: '', page: undefined }]);
  };

  const addArticleEntry = (articleId: string) => {
    const article = articles.find((a) => a.id === articleId);
    if (!article) return;
    if (entries.some((e) => e.articleId === articleId)) return;
    onChange([...entries, { title: article.title, articleId: article.id, page: undefined }]);
  };

  const updateEntry = (
    index: number,
    patch: Partial<IssueFormValues['tableOfContents'][number]>,
  ) => {
    onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const moveEntry = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= entries.length) return;
    const copy = [...entries];
    [copy[index], copy[next]] = [copy[next]!, copy[index]!];
    onChange(copy);
  };

  const unusedArticles = articles.filter((a) => !entries.some((e) => e.articleId === a.id));

  return (
    <div className="border-border space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">فهرست مطالب</p>
          <p className="text-muted-foreground text-xs">ترتیب نمایش در صفحه شماره روی سایت</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={addManualEntry}
        >
          + ردیف دستی
        </Button>
      </div>

      {unusedArticles.length > 0 && (
        <div className="space-y-2">
          <Label>افزودن از مقالات</Label>
          <div className="flex flex-wrap gap-2">
            {unusedArticles.slice(0, 8).map((article) => (
              <Button
                key={article.id}
                type="button"
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => addArticleEntry(article.id)}
              >
                + {article.title.slice(0, 30)}
                {article.title.length > 30 ? '…' : ''}
              </Button>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="bg-muted/40 text-muted-foreground rounded-lg p-4 text-sm">
          هنوز آیتمی در فهرست نیست. مقاله اضافه کنید یا ردیف دستی بسازید.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry, index) => (
            <li
              key={`${entry.articleId ?? 'manual'}-${index}`}
              className="border-border grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_100px_auto]"
            >
              <div>
                <Input
                  value={entry.title}
                  onChange={(e) => updateEntry(index, { title: e.target.value })}
                  placeholder="عنوان در فهرست"
                  disabled={disabled || Boolean(entry.articleId)}
                  className="rounded-lg"
                />
                {entry.articleId && (
                  <p className="text-muted-foreground mt-1 text-xs">مرتبط با مقاله منتشرشده</p>
                )}
              </div>
              <div>
                <Input
                  type="number"
                  min={1}
                  value={entry.page ?? ''}
                  onChange={(e) =>
                    updateEntry(index, {
                      page: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  placeholder="صفحه"
                  disabled={disabled}
                  className="rounded-lg"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || index === 0}
                  onClick={() => moveEntry(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || index === entries.length - 1}
                  onClick={() => moveEntry(index, 1)}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={disabled}
                  onClick={() => removeEntry(index)}
                >
                  حذف
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
