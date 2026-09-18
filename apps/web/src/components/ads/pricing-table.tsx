import { formatPrice } from '@/lib/utils';
import type { AdPlacement, AdPricing } from '@vargah/business/services-content-types';
import { AD_SURFACE_META } from '@vargah/business/services-content-types';
import { cn } from '@/lib/utils';

type PricingTableProps = {
  items: AdPricing[];
  placements?: AdPlacement[];
};

export function PricingTable({ items, placements = [] }: PricingTableProps) {
  const printItems = items.filter((i) => i.type === 'print');
  const digitalItems = items.filter((i) => i.type === 'digital');
  const placementById = new Map(placements.map((p) => [p.id, p]));

  if (items.length === 0) {
    return (
      <p className="border-border text-muted-foreground rounded-2xl border border-dashed px-6 py-10 text-center text-sm">
        تعرفه‌ای برای نمایش وجود ندارد.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PricingGroup
        title="تبلیغات چاپی"
        accent="print"
        items={printItems}
        placementById={placementById}
      />
      <PricingGroup
        title="تبلیغات دیجیتال"
        accent="digital"
        items={digitalItems}
        placementById={placementById}
      />
    </div>
  );
}

function PricingGroup({
  title,
  accent,
  items,
  placementById,
}: {
  title: string;
  accent: 'print' | 'digital';
  items: AdPricing[];
  placementById: Map<string, AdPlacement>;
}) {
  return (
    <div className="border-border bg-card/50 rounded-2xl border p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
            accent === 'print' ? 'bg-amber-500/10 text-amber-800' : 'bg-sky-500/10 text-sky-800',
          )}
        >
          {accent === 'print' ? 'چاپی' : 'دیجیتال'}
        </span>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">موردی ثبت نشده</p>
        ) : (
          items.map((item) => {
            const placement = item.placementId ? placementById.get(item.placementId) : undefined;
            const surfaceLabel = placement
              ? AD_SURFACE_META.find((s) => s.id === placement.surface)?.label
              : undefined;
            return (
              <article
                key={item.id}
                className="border-border/80 bg-background rounded-xl border p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-muted-foreground text-xs">{item.size}</p>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      {item.description}
                    </p>
                    {placement && (
                      <p className="text-primary/90 mt-2 text-xs">
                        جایگاه: {placement.label}
                        {surfaceLabel ? ` · ${surfaceLabel}` : ''}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-end">
                    <span className="text-primary text-lg font-bold tabular-nums">
                      {formatPrice(item.price)}
                    </span>
                    <span className="text-muted-foreground block text-[11px]">تومان</span>
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
