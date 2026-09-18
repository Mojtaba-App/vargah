'use client';

import type { CustomGeoLayer } from '@vargah/business/map-config';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';

import { cn } from '@/lib/utils';

type GeoLayerPanelProps = {
  customLayers: CustomGeoLayer[];
  hiddenLayerIds: string[];
  onToggleCustomLayer: (layerId: string) => void;
};

export function GeoLayerPanel({
  customLayers,
  hiddenLayerIds,
  onToggleCustomLayer,
}: GeoLayerPanelProps) {
  if (customLayers.length === 0) {
    return (
      <div className="border-border text-muted-foreground rounded-2xl border border-dashed p-4 text-sm">
        لایه سفارشی تعریف نشده. از تنظیمات → نقشه می‌توانید GeoJSON اضافه کنید.
      </div>
    );
  }

  return (
    <div className="border-border rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">مدیریت لایه‌ها</h3>
        <Badge variant="outline">{customLayers.length} لایه</Badge>
      </div>
      <ul className="mt-3 space-y-2">
        {customLayers.map((layer) => {
          const visible = !hiddenLayerIds.includes(layer.id);
          return (
            <li
              key={layer.id}
              className="border-border/70 flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{layer.name}</p>
                <p className="text-muted-foreground truncate text-xs">{layer.geoJsonUrl}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={visible ? 'default' : 'outline'}
                className="shrink-0 rounded-full"
                onClick={() => onToggleCustomLayer(layer.id)}
              >
                {visible ? 'فعال' : 'غیرفعال'}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function GeoSettingsHint({ googleReady }: { googleReady: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 text-sm',
        googleReady
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200'
          : 'border-border bg-muted/30 text-muted-foreground',
      )}
    >
      {googleReady
        ? 'Google Maps فعال است — لایه‌های Road / Satellite / Hybrid در دسترس‌اند.'
        : 'Google Maps غیرفعال است — فقط لایه‌های رایگان OSM فعال‌اند. از تنظیمات → نقشه می‌توانید بعداً API Key را وارد کنید.'}
    </div>
  );
}
