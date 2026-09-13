import { FadeIn } from '@/components/motion/fade-in';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'content-under-header relative overflow-hidden border-b border-border',
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-accent/80 via-background/40 to-background"
        aria-hidden="true"
      />
      <div
        className="absolute -start-24 top-0 size-72 rounded-full bg-primary/8 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -end-16 bottom-0 size-56 rounded-full bg-brand-200/30 blur-3xl dark:bg-brand-800/15"
        aria-hidden="true"
      />
      <FadeIn className="clear-site-header relative mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
        {eyebrow && <p className="section-eyebrow mb-4">{eyebrow}</p>}
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
      </FadeIn>
    </div>
  );
}
