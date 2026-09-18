import { cn } from '@/lib/utils';

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3';
  align?: 'start' | 'center';
};

export function SectionTitle({
  title,
  subtitle,
  eyebrow,
  action,
  className,
  as: Tag = 'h2',
  align = 'start',
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className="section-eyebrow mb-3">{eyebrow}</p>}
        <Tag className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</Tag>
        {subtitle && (
          <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
