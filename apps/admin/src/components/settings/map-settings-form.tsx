'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_LAYER_VISIBILITY,
  GOOGLE_MAP_LAYERS,
  type CustomGeoLayer,
  type MapConfig,
  type MapLayerId,
} from '@vargah/business/map-config';
import { FREE_MAP_LAYERS } from '@vargah/business/iran-geo';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { Input, Label, Textarea } from '@vargah/ui/components/input';

import { updateMapConfig } from '@/actions/settings';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { ReasonConfirmDialog } from '@/components/ui/feedback/reason-confirm-dialog';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { adminApiPath } from '@/lib/base-path';
import { csrfHeaders } from '@/lib/csrf-client';
import { SETTINGS_SECRET_PLACEHOLDER } from '@/lib/settings-secrets';
import { getActionErrorMessage } from '@/lib/settings/errors';

type MapSettingsFormProps = {
  initialConfig: MapConfig;
  canEdit: boolean;
};

const BASEMAP_OPTIONS: Array<{ id: MapLayerId; label: string }> = [
  ...Object.entries(FREE_MAP_LAYERS).map(([id, layer]) => ({
    id: id as MapLayerId,
    label: layer.label,
  })),
  ...Object.entries(GOOGLE_MAP_LAYERS).map(([id, layer]) => ({
    id: id as MapLayerId,
    label: layer.label,
  })),
];

function emptyCustomLayer(index: number): CustomGeoLayer {
  return {
    id: `custom-${Date.now()}-${index}`,
    name: `لایه ${index + 1}`,
    geoJsonUrl: '',
    enabled: true,
    opacity: 0.6,
    color: '#6366f1',
    zIndex: index + 1,
    sourceFormat: 'url',
  };
}

export function MapSettingsForm({ initialConfig, canEdit }: MapSettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskedKey = initialConfig.googleApiKey ? SETTINGS_SECRET_PLACEHOLDER : '';
  const hasStoredKey = Boolean(initialConfig.googleApiKey);

  const [config, setConfig] = useState<MapConfig>({
    ...initialConfig,
    googleApiKey: maskedKey,
  });
  const [feedback, setFeedback] = useState<{
    section: 'google' | 'visibility' | 'layers' | 'entities' | 'save';
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setConfig({ ...initialConfig, googleApiKey: maskedKey });
  }, [initialConfig, maskedKey]);

  function showFeedback(
    section: 'google' | 'visibility' | 'layers' | 'entities' | 'save',
    type: 'success' | 'error',
    message: string,
  ) {
    setFeedback({ section, type, message });
  }

  function updateLayerVisibility(key: keyof MapConfig['layerVisibility'], value: boolean) {
    setConfig((current) => ({
      ...current,
      layerVisibility: { ...current.layerVisibility, [key]: value },
    }));
  }

  function updateCustomLayer(index: number, patch: Partial<CustomGeoLayer>) {
    setConfig((current) => ({
      ...current,
      customLayers: current.customLayers.map((layer, i) =>
        i === index ? { ...layer, ...patch } : layer,
      ),
    }));
  }

  function addEmptyLayer() {
    setConfig((current) => ({
      ...current,
      customLayers: [...current.customLayers, emptyCustomLayer(current.customLayers.length)],
    }));
    showFeedback(
      'layers',
      'success',
      'لایه جدید اضافه شد — فایل یا آدرس را تنظیم کنید و ذخیره کنید.',
    );
  }

  async function handleLayerFile(file: File) {
    setUploading(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.set('file', file);
      const res = await fetch(adminApiPath('/api/settings/geo-layer/upload'), {
        method: 'POST',
        headers: csrfHeaders(),
        body: formData,
        credentials: 'include',
      });
      const data = (await res.json()) as {
        path?: string;
        error?: string;
        sourceFormat?: CustomGeoLayer['sourceFormat'];
        originalName?: string;
        featureCount?: number;
      };
      if (!res.ok || !data.path) {
        showFeedback('layers', 'error', data.error ?? 'آپلود لایه ناموفق بود');
        return;
      }

      const uploadedPath = data.path;
      const sourceFormat = data.sourceFormat ?? 'geojson';
      const originalName = data.originalName ?? file.name;

      setConfig((current) => ({
        ...current,
        customLayers: [
          ...current.customLayers,
          {
            ...emptyCustomLayer(current.customLayers.length),
            name: originalName.replace(/\.[^.]+$/, ''),
            geoJsonUrl: uploadedPath,
            sourceFormat,
            originalFileName: originalName,
          },
        ],
      }));
      showFeedback(
        'layers',
        'success',
        `لایه اضافه شد (${data.featureCount ?? 0} عارضه) — برای اعمال روی نقشه ذخیره کنید.`,
      );
    } catch {
      showFeedback('layers', 'error', 'خطا در آپلود فایل لایه');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleSave() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const payload: MapConfig = {
          ...config,
          googleApiKey:
            !config.googleApiKey || config.googleApiKey === SETTINGS_SECRET_PLACEHOLDER
              ? SETTINGS_SECRET_PLACEHOLDER
              : config.googleApiKey,
        };
        await updateMapConfig(payload);
        showFeedback('save', 'success', 'تنظیمات نقشه ذخیره شد');
        router.refresh();
      } catch (err) {
        showFeedback('save', 'error', getActionErrorMessage(err));
      }
    });
  }

  function confirmDeleteLayer(reason: string) {
    if (deleteIndex === null) return;
    const layer = config.customLayers[deleteIndex];
    setConfig((current) => ({
      ...current,
      customLayers: current.customLayers.filter((_, i) => i !== deleteIndex),
    }));
    setDeleteIndex(null);
    showFeedback(
      'layers',
      'success',
      `لایه «${layer?.name ?? ''}» حذف شد — دلیل: ${reason}. برای قطعی شدن ذخیره کنید.`,
    );
  }

  return (
    <div className="space-y-6">
      <section className="border-border bg-card space-y-4 rounded-2xl border p-5">
        {feedback?.section === 'google' && (
          <StatusBanner
            type={feedback.type}
            message={feedback.message}
            onDismiss={feedback.type === 'error' ? undefined : () => setFeedback(null)}
          />
        )}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Google Maps</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              پیش‌فرض غیرفعال — تا زمان وارد کردن API Key هیچ درخواستی به Google ارسال نمی‌شود.
            </p>
          </div>
          <Badge variant={config.googleEnabled ? 'default' : 'outline'}>
            {config.googleEnabled ? 'فعال' : 'غیرفعال'}
          </Badge>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.googleEnabled}
            disabled={!canEdit}
            onChange={(event) =>
              setConfig((current) => ({ ...current, googleEnabled: event.target.checked }))
            }
          />
          فعال‌سازی Google Maps (Road / Satellite / Hybrid)
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="googleApiKey">Google Maps API Key</Label>
            <Input
              id="googleApiKey"
              type="password"
              disabled={!canEdit}
              value={config.googleApiKey}
              placeholder={hasStoredKey ? 'برای تغییر وارد کنید' : 'AIza...'}
              onChange={(event) =>
                setConfig((current) => ({ ...current, googleApiKey: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultBasemap">Basemap پیش‌فرض</Label>
            <select
              id="defaultBasemap"
              disabled={!canEdit}
              value={config.defaultBasemap}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  defaultBasemap: event.target.value as MapLayerId,
                }))
              }
              className="border-input bg-background h-10 w-full rounded-xl border px-3 text-sm"
            >
              {BASEMAP_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="border-border bg-card space-y-4 rounded-2xl border p-5">
        {feedback?.section === 'visibility' && (
          <StatusBanner
            type={feedback.type}
            message={feedback.message}
            onDismiss={feedback.type === 'error' ? undefined : () => setFeedback(null)}
          />
        )}
        <h2 className="font-bold">لایه‌های قابل نمایش</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(DEFAULT_LAYER_VISIBILITY).map(([key]) => (
            <label
              key={key}
              className="border-border/70 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={config.layerVisibility[key as keyof MapConfig['layerVisibility']]}
                onChange={(event) =>
                  updateLayerVisibility(
                    key as keyof MapConfig['layerVisibility'],
                    event.target.checked,
                  )
                }
              />
              {key.startsWith('google')
                ? GOOGLE_MAP_LAYERS[key as keyof typeof GOOGLE_MAP_LAYERS]?.label
                : (FREE_MAP_LAYERS[key as keyof typeof FREE_MAP_LAYERS]?.label ?? key)}
            </label>
          ))}
        </div>
      </section>

      <section className="border-border bg-card space-y-4 rounded-2xl border p-5">
        {feedback?.section === 'layers' && (
          <StatusBanner
            type={feedback.type}
            message={feedback.message}
            onDismiss={feedback.type === 'error' ? undefined : () => setFeedback(null)}
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">لایه‌های GeoJSON / KMZ سفارشی</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              آپلود GeoJSON، KML یا KMZ — یا افزودن دستی با آدرس
            </p>
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".geojson,.json,.kml,.kmz,application/geo+json,application/json,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleLayerFile(file);
                }}
              />
              <LoadingButton
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                آپلود فایل لایه
              </LoadingButton>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={addEmptyLayer}
              >
                افزودن لایه دستی
              </Button>
            </div>
          )}
        </div>

        {canEdit && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) void handleLayerFile(file);
            }}
            className="border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:bg-muted/40 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-sm transition-colors"
          >
            <span className="text-foreground font-medium">کشیدن و رها کردن فایل لایه</span>
            <span>GeoJSON · KML · KMZ</span>
          </button>
        )}

        {config.customLayers.length === 0 && (
          <p className="text-muted-foreground text-sm">لایه سفارشی تعریف نشده است.</p>
        )}

        <div className="space-y-4">
          {config.customLayers.map((layer, index) => (
            <div key={layer.id} className="border-border/70 space-y-3 rounded-xl border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{layer.sourceFormat?.toUpperCase() ?? 'URL'}</Badge>
                {layer.originalFileName && (
                  <span className="text-muted-foreground truncate text-xs">
                    {layer.originalFileName}
                  </span>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>نام لایه</Label>
                  <Input
                    disabled={!canEdit}
                    value={layer.name}
                    onChange={(event) => updateCustomLayer(index, { name: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>آدرس GeoJSON</Label>
                  <Input
                    disabled={!canEdit}
                    value={layer.geoJsonUrl}
                    placeholder="/uploads/geo-layers/...."
                    dir="ltr"
                    onChange={(event) =>
                      updateCustomLayer(index, {
                        geoJsonUrl: event.target.value,
                        sourceFormat: layer.sourceFormat ?? 'url',
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>رنگ</Label>
                  <Input
                    disabled={!canEdit}
                    type="color"
                    value={layer.color.startsWith('#') ? layer.color : '#6366f1'}
                    onChange={(event) => updateCustomLayer(index, { color: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>شفافیت ({Math.round(layer.opacity * 100)}%)</Label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    disabled={!canEdit}
                    value={layer.opacity}
                    onChange={(event) =>
                      updateCustomLayer(index, { opacity: Number(event.target.value) })
                    }
                    className="accent-primary mt-3 w-full"
                  />
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={layer.enabled}
                    onChange={(event) =>
                      updateCustomLayer(index, { enabled: event.target.checked })
                    }
                  />
                  فعال
                </label>
              </div>
              {canEdit && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setDeleteIndex(index)}
                >
                  حذف لایه
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border-border bg-card space-y-3 rounded-2xl border p-5">
        {feedback?.section === 'entities' && (
          <StatusBanner
            type={feedback.type}
            message={feedback.message}
            onDismiss={feedback.type === 'error' ? undefined : () => setFeedback(null)}
          />
        )}
        <h2 className="font-bold">نمایش روی نقشه GIS</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={!canEdit}
            checked={config.showAdvertisersOnMap}
            onChange={(event) =>
              setConfig((current) => ({ ...current, showAdvertisersOnMap: event.target.checked }))
            }
          />
          نمایش آگهی‌دهندگان (دارای cityId)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={!canEdit}
            checked={config.showMessagesOnMap}
            onChange={(event) =>
              setConfig((current) => ({ ...current, showMessagesOnMap: event.target.checked }))
            }
          />
          نمایش پیام‌ها (دارای cityId)
        </label>
        <Textarea
          readOnly
          value="پیام‌ها و آگهی‌دهندگان فقط وقتی روی نقشه دیده می‌شوند که استان/شهر معتبر و cityId ثبت شده باشد."
          className="text-muted-foreground min-h-16 text-xs"
        />
      </section>

      {canEdit && (
        <div className="space-y-3">
          {feedback?.section === 'save' && (
            <StatusBanner
              type={feedback.type}
              message={feedback.message}
              onDismiss={feedback.type === 'error' ? undefined : () => setFeedback(null)}
            />
          )}
          <LoadingButton type="button" loading={isPending} onClick={handleSave}>
            ذخیره تنظیمات نقشه
          </LoadingButton>
        </div>
      )}

      <ReasonConfirmDialog
        open={deleteIndex !== null}
        title="حذف لایه سفارشی"
        description={
          deleteIndex !== null
            ? `لایه «${config.customLayers[deleteIndex]?.name ?? ''}» برای همیشه از تنظیمات حذف می‌شود.`
            : ''
        }
        onCancel={() => setDeleteIndex(null)}
        onConfirm={confirmDeleteLayer}
      />
    </div>
  );
}
