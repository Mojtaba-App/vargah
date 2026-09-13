import { formatJalaliDate } from '@/lib/date';
import type { JobOpening, WritingGuideline } from '@vargah/business/services-content-types';
import { cn } from '@/lib/utils';

export function JobOpeningsGrid({ jobs }: { jobs: JobOpening[] }) {
  if (jobs.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
        فرصت فعالی ثبت نشده است.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {jobs.map((job) => (
        <article
          key={job.id}
          className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
        >
          <span
            className={cn(
              'w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold',
              job.type === 'freelance' ? 'bg-violet-500/10 text-violet-700' : 'bg-emerald-500/10 text-emerald-700',
            )}
          >
            {job.type === 'freelance' ? 'فریلنس' : 'تمام‌وقت'}
          </span>
          <h3 className="mt-3 text-lg font-bold leading-snug">{job.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            مهلت: {formatJalaliDate(job.deadline, 'D MMMM YYYY')}
          </p>
        </article>
      ))}
    </div>
  );
}

export function WritingGuidelinesGrid({ guidelines }: { guidelines: WritingGuideline[] }) {
  if (guidelines.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
        راهنمایی ثبت نشده است.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {guidelines.map((guide, index) => (
        <article
          key={guide.id}
          className="rounded-2xl border border-border bg-gradient-to-b from-muted/20 to-background p-5"
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {index + 1}
            </span>
            <h3 className="font-bold">{guide.title}</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{guide.content}</p>
        </article>
      ))}
    </div>
  );
}
