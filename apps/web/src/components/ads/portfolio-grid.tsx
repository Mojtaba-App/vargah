import Image from 'next/image';
import type { AdPortfolio } from '@vargah/business/services-content-types';

type PortfolioGridProps = {
  items: AdPortfolio[];
};

export function PortfolioGrid({ items }: PortfolioGridProps) {
  if (items.length === 0) {
    return (
      <p className="border-border text-muted-foreground rounded-2xl border border-dashed px-6 py-10 text-center text-sm">
        نمونه‌کاری برای نمایش وجود ندارد.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="group border-border bg-card overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="bg-muted relative aspect-[3/2] overflow-hidden">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="400px"
            />
            <span className="bg-background/90 absolute start-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
              {item.type === 'print' ? 'چاپی' : 'دیجیتال'}
            </span>
          </div>
          <div className="p-4">
            <h4 className="font-semibold">{item.title}</h4>
            <p className="text-muted-foreground mt-1 text-sm">{item.client}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
