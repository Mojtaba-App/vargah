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
        'content-under-header border-border relative overflow-hidden border-b',
        className,
      )}
    >
      <div
        className="from-accent/80 via-background/40 to-background absolute inset-0 bg-gradient-to-b"
        aria-hidden="true"
      />
      <div
        className="bg-primary/8 absolute -start-24 top-0 size-72 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="bg-brand-200/30 dark:bg-brand-800/15 absolute -end-16 bottom-0 size-56 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <FadeIn className="clear-site-header relative mx-auto max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12 lg:px-8">
        {eyebrow && <p className="section-eyebrow mb-4">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
            {description}
          </p>
        )}
      </FadeIn>
    </div>
  );
}
