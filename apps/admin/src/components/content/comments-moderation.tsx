'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { Card, CardContent } from '@vargah/ui/components/card';
import { approveComment, deleteComment, rejectComment } from '@/actions/comments';
import { WorkspaceSearchField } from '@/components/ui/workspace-search-field';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { formatRelativeTime } from '@/lib/audit/messages';
import { filterByQuery } from '@/lib/filter-by-query';
import { formatJalali } from '@/lib/utils';

export type CommentModerationRow = {
  id: string;
  authorName: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  article: { id: string; title: string; slug: string };
};

const STATUS_LABELS = {
  PENDING: 'در انتظار',
  APPROVED: 'تأییدشده',
  REJECTED: 'ردشده',
} as const;

const STATUS_VARIANT = {
  PENDING: 'outline',
  APPROVED: 'default',
  REJECTED: 'destructive',
} as const;

type Props = {
  comments: CommentModerationRow[];
  canModerate: boolean;
};

export function CommentsModeration({ comments, canModerate }: Props) {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const filteredComments = useMemo(
    () =>
      filterByQuery(comments, debouncedSearch, (comment) => [
        comment.authorName,
        comment.content,
        comment.article.title,
      ]),
    [comments, debouncedSearch],
  );

  const run = (fn: () => Promise<void>) => {
    startTransition(() => {
      void fn();
    });
  };

  if (comments.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          نظری برای بررسی وجود ندارد.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <WorkspaceSearchField
        id="comments-search"
        value={search}
        onChange={setSearch}
        placeholder="جستجو در نام، متن یا عنوان مقاله..."
      />

      {filteredComments.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            نظری با این عبارت یافت نشد.
          </CardContent>
        </Card>
      ) : (
        filteredComments.map((comment) => (
        <Card key={comment.id} className="rounded-2xl">
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{comment.authorName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(comment.createdAt)} — {formatJalali(comment.createdAt)}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[comment.status]}>{STATUS_LABELS[comment.status]}</Badge>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">مقاله:</span>
              <Link
                href={`/content/articles/${comment.article.id}`}
                className="font-medium text-primary hover:underline"
              >
                {comment.article.title}
              </Link>
            </div>

            {canModerate && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {comment.status !== 'APPROVED' && (
                  <Button
                    size="sm"
                    className="rounded-xl"
                    disabled={pending}
                    onClick={() => run(() => approveComment(comment.id))}
                  >
                    تأیید
                  </Button>
                )}
                {comment.status !== 'REJECTED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={pending}
                    onClick={() => run(() => rejectComment(comment.id))}
                  >
                    رد
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl text-destructive"
                  disabled={pending}
                  onClick={() => run(() => deleteComment(comment.id))}
                >
                  حذف
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        ))
      )}
    </div>
  );
}
