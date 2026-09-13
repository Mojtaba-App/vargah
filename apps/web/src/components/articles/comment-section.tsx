'use client';

import { useEffect, useState, useTransition } from 'react';
import { Input, Label, Textarea } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Card } from '@vargah/ui/components/card';
import { formatJalaliDate } from '@/lib/date';
import { submitComment } from '@/actions/forms';
import { useCustomerAuth } from '@/components/auth/customer-auth-provider';
import type { PublicComment } from '@/lib/db/comments';

type CommentSectionProps = {
  comments: PublicComment[];
  articleId: string;
  /** mock articles — نظرات فقط client-side */
  isMock?: boolean;
};

export function CommentSection({ comments: initialComments, articleId, isMock }: CommentSectionProps) {
  const { customer, isAuthenticated, openLogin } = useCustomerAuth();
  const [comments, setComments] = useState(initialComments);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'success' | 'pending' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (customer?.name) setName(customer.name);
  }, [customer?.name]);

  useEffect(() => {
    if (isAuthenticated) setAuthNotice(null);
  }, [isAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    if (!isAuthenticated && !isMock) {
      setAuthNotice('برای ثبت نظر باید با شماره موبایل وارد حساب کاربری شوید.');
      openLogin('comment');
      return;
    }

    if (isMock) {
      const newComment: PublicComment = {
        id: `c-new-${Date.now()}`,
        articleId,
        authorName: name.trim(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      setComments([newComment, ...comments]);
      setName(customer?.name ?? '');
      setContent('');
      setFeedback('success');
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    setErrorMsg('');
    startTransition(async () => {
      try {
        const result = await submitComment({
          articleId,
          authorName: name.trim(),
          content: content.trim(),
        });
        if (!result.ok) {
          setErrorMsg(result.message);
          setFeedback('error');
          return;
        }
        setContent('');
        setFeedback(result.pending ? 'pending' : 'success');
        setTimeout(() => setFeedback(null), 5000);
      } catch {
        setErrorMsg('ثبت نظر با خطا مواجه شد. لطفاً بعداً تلاش کنید.');
        setFeedback('error');
      }
    });
  };

  return (
    <section className="mt-10" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="mb-6 text-xl font-bold">
        نظرات ({comments.length})
      </h2>

      {!isAuthenticated && !isMock && (
        <Card className="mb-4 border-primary/20 bg-primary/5 p-4 text-sm">
          برای ثبت نظر،{' '}
          <button
            type="button"
            className="font-semibold text-primary underline-offset-2 hover:underline"
            onClick={() => openLogin('comment')}
          >
            با موبایل وارد شوید
          </button>
          .
        </Card>
      )}

      <Card className="mb-8 p-4 sm:p-6">
        <form onSubmit={handleSubmit} aria-label="فرم ارسال نظر">
          <div className="space-y-3">
            {authNotice && (
              <p role="status" className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {authNotice}
              </p>
            )}
            <div>
              <Label htmlFor="comment-name" required>
                نام
              </Label>
              <Input
                id="comment-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                disabled={pending || (!isAuthenticated && !isMock)}
                readOnly={isAuthenticated && Boolean(customer?.name)}
              />
            </div>
            <div>
              <Label htmlFor="comment-content" required>
                نظر شما
              </Label>
              <Textarea
                id="comment-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                required
                maxLength={2000}
                disabled={pending || (!isAuthenticated && !isMock)}
                placeholder={
                  !isAuthenticated && !isMock
                    ? 'پس از ورود می‌توانید نظر خود را بنویسید...'
                    : undefined
                }
              />
            </div>
            <Button type="submit" disabled={pending || (!isAuthenticated && !isMock)}>
              {pending ? 'در حال ارسال...' : isAuthenticated || isMock ? 'ارسال نظر' : 'ورود برای ثبت نظر'}
            </Button>
            {feedback === 'pending' && (
              <p role="status" className="text-sm text-muted-foreground">
                نظر شما ثبت شد و پس از تأیید سردبیر نمایش داده می‌شود.
              </p>
            )}
            {feedback === 'success' && (
              <p role="status" className="text-sm text-green-600">
                نظر شما ثبت شد.
              </p>
            )}
            {(feedback === 'error' || errorMsg) && (
              <p role="alert" className="text-sm text-destructive">
                {errorMsg || 'خطا در ثبت نظر'}
              </p>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-4" role="list" aria-label="فهرست نظرات">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">هنوز نظری ثبت نشده است.</p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4 sm:p-5" role="listitem">
              <div className="mb-2 flex items-center justify-between gap-4">
                <span className="font-medium">{comment.authorName}</span>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={comment.createdAt}>
                  {formatJalaliDate(comment.createdAt, 'D MMMM YYYY')}
                </time>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{comment.content}</p>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
