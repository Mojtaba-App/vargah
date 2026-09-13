'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  AD_SURFACE_META,
  getSchematicSlot,
  type AdPlacement,
  type AdPricing,
  type AdSurfaceId,
} from '@vargah/business/services-content-types';
import { formatPrice, cn } from '@/lib/utils';

type PlacementSchematicsProps = {
  placements: AdPlacement[];
  pricing: AdPricing[];
};

export function PlacementSchematics({ placements, pricing }: PlacementSchematicsProps) {
  const surfacesWithPlacements = useMemo(() => {
    return AD_SURFACE_META.filter((surface) =>
      placements.some((item) => item.surface === surface.id),
    );
  }, [placements]);

  const [activeSurface, setActiveSurface] = useState<AdSurfaceId>(
    surfacesWithPlacements[0]?.id ?? 'website-home',
  );
  const [activePlacementId, setActivePlacementId] = useState<string | null>(null);

  const surfacePlacements = useMemo(
    () => placements.filter((item) => item.surface === activeSurface),
    [placements, activeSurface],
  );

  const selectedId = activePlacementId && surfacePlacements.some((p) => p.id === activePlacementId)
    ? activePlacementId
    : surfacePlacements[0]?.id ?? null;

  const pricingById = useMemo(() => {
    const map = new Map<string, AdPricing>();
    for (const item of pricing) map.set(item.id, item);
    return map;
  }, [pricing]);

  if (surfacesWithPlacements.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
        جایگاهی برای نمایش تعریف نشده است.
      </p>
    );
  }

  const selected = surfacePlacements.find((p) => p.id === selectedId) ?? null;
  const frame = AD_SURFACE_META.find((s) => s.id === activeSurface)?.frame ?? 'site';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="نوع صفحه">
        {surfacesWithPlacements.map((surface) => {
          const active = surface.id === activeSurface;
          return (
            <button
              key={surface.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveSurface(surface.id);
                setActivePlacementId(null);
              }}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {surface.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5">
          <p className="mb-4 text-sm text-muted-foreground">
            {AD_SURFACE_META.find((s) => s.id === activeSurface)?.description}
          </p>
          <SchematicFrame frame={frame}>
            {surfacePlacements.map((placement) => {
              const slot = getSchematicSlot(placement.surface, placement.slotKey);
              if (!slot) return null;
              const isSelected = placement.id === selectedId;
              // Magazine slots share the same page canvas — only emphasize the selected format
              if (frame === 'print' && !isSelected && surfacePlacements.length > 1) {
                return null;
              }
              return (
                <button
                  key={placement.id}
                  type="button"
                  title={placement.label}
                  onClick={() => setActivePlacementId(placement.id)}
                  className={cn(
                    'absolute rounded-md border text-[10px] font-semibold leading-tight transition-all sm:text-[11px]',
                    isSelected
                      ? 'z-20 border-primary bg-primary/25 text-foreground shadow-sm ring-2 ring-primary/40'
                      : 'z-10 border-amber-600/40 bg-amber-500/15 text-foreground/80 hover:bg-amber-500/25',
                  )}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    width: `${slot.w}%`,
                    height: `${slot.h}%`,
                  }}
                >
                  <span className="flex h-full items-center justify-center px-1 text-center">
                    {placement.label}
                  </span>
                </button>
              );
            })}
            {surfacePlacements.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                جایگاهی فعال نیست
              </p>
            )}
          </SchematicFrame>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            نمای شماتیک — برای جزئیات روی هر جایگاه کلیک کنید
          </p>
        </div>

        <div className="space-y-3">
          {surfacePlacements.map((placement) => {
            const linked = placement.pricingId ? pricingById.get(placement.pricingId) : undefined;
            const isSelected = placement.id === selectedId;
            return (
              <button
                key={placement.id}
                type="button"
                onClick={() => setActivePlacementId(placement.id)}
                className={cn(
                  'w-full rounded-xl border p-4 text-start transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/30',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">{placement.label}</h4>
                    {placement.sizeHint && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{placement.sizeHint}</p>
                    )}
                  </div>
                  {linked && (
                    <p className="shrink-0 text-end text-sm font-bold tabular-nums text-primary">
                      {formatPrice(linked.price)}
                      <span className="block text-[10px] font-normal text-muted-foreground">تومان</span>
                    </p>
                  )}
                </div>
                {placement.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {placement.description}
                  </p>
                )}
                {linked && (
                  <p className="mt-2 text-xs text-muted-foreground">تعرفه مرتبط: {linked.name}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <p className="sr-only" aria-live="polite">
          جایگاه انتخاب‌شده: {selected.label}
        </p>
      )}
    </div>
  );
}

function SchematicFrame({
  frame,
  children,
}: {
  frame: 'site' | 'article' | 'print' | 'newsletter';
  children: ReactNode;
}) {
  const aspect =
    frame === 'print'
      ? 'aspect-[3/4] max-w-sm mx-auto'
      : frame === 'newsletter'
        ? 'aspect-[4/5] max-w-md mx-auto'
        : frame === 'article'
          ? 'aspect-[16/11]'
          : 'aspect-[16/10]';

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-dashed border-border/80 bg-muted/30',
        aspect,
      )}
    >
      <ChromeBars frame={frame} />
      {children}
    </div>
  );
}

function ChromeBars({ frame }: { frame: 'site' | 'article' | 'print' | 'newsletter' }) {
  if (frame === 'print') {
    return (
      <>
        <div className="absolute inset-x-[8%] top-[4%] h-1 rounded bg-border/60" />
        <div className="absolute inset-y-[6%] start-[4%] w-1 rounded bg-border/50" />
      </>
    );
  }

  if (frame === 'newsletter') {
    return (
      <>
        <div className="absolute inset-x-[10%] top-[3%] h-2 rounded bg-border/50" />
        <div className="absolute inset-x-[18%] top-[28%] h-[8%] rounded bg-border/25" />
        <div className="absolute inset-x-[18%] top-[70%] h-[8%] rounded bg-border/25" />
      </>
    );
  }

  return (
    <>
      <div className="absolute inset-x-[5%] top-[2%] h-2 rounded-full bg-border/50" />
      <div className="absolute inset-x-[28%] top-[16%] h-[55%] rounded bg-border/20" />
      <div className="absolute inset-x-[5%] bottom-[2%] h-1.5 rounded bg-border/40" />
    </>
  );
}
