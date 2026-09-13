'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminMapRuntimeConfig, MapLayerId } from '@vargah/business/map-config';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';

import { backfillGeoStatsNow, runGeoStatsNow } from '@/actions/geo';
import {
  GeoGrowthCitiesChart,
  GeoProvinceShareChart,
  GeoTopCitiesChart,
  GeoTrendChart,
} from '@/components/geo/geo-charts';
import { GeoLayerPanel, GeoSettingsHint } from '@/components/geo/geo-layer-panel';
import type { GeoMapView } from '@/components/geo/geo-map-types';
import { ExportToolbar } from '@/components/ui/feedback/export-toolbar';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { MapExportDialog } from '@/components/ui/feedback/map-export-dialog';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import type { GeoAnalytics } from '@/lib/geo/analytics';
import type { GeoEntitySource, GeoSummary, GeoSubscriberFilter } from '@/lib/geo/stats';
import { cn, formatNumber } from '@/lib/utils';

const GeoMap = dynamic(
  () => import('@/components/geo/geo-map').then((mod) => mod.GeoMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[min(70vh,520px)] w-full items-center justify-center rounded-2xl border border-border bg-muted/30 text-sm text-muted-foreground"
        aria-busy="true"
      >
        در حال بارگذاری نقشه…
      </div>
    ),
  },
);

type GeoStatsPack = {
  subscribers: { active: GeoSummary; all: GeoSummary };
  advertisers: GeoSummary;
  messages: GeoSummary;
  combined: { active: GeoSummary; all: GeoSummary };
};

type GeoWorkspaceProps = {
  mapConfig: AdminMapRuntimeConfig;
  statsPack: GeoStatsPack;
  analytics: GeoAnalytics;
  initial?: {
    province?: string;
    city?: string;
    source?: GeoEntitySource;
    filter?: GeoSubscriberFilter;
    tab?: WorkspaceTab;
  };
};

type WorkspaceTab = 'map' | 'reports';

const ENTITY_LABELS: Record<GeoEntitySource, string> = {
  subscribers: 'مشترکین',
  advertisers: 'آگهی‌دهندگان',
  messages: 'پیام‌ها',
  all: 'همه منابع',
};

export function GeoWorkspace({ mapConfig, statsPack, analytics, initial }: GeoWorkspaceProps) {
  const router = useRouter();
  const mapCaptureRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<WorkspaceTab>(initial?.tab ?? 'map');
  const [entitySource, setEntitySource] = useState<GeoEntitySource>(initial?.source ?? 'subscribers');
  const [filter, setFilter] = useState<GeoSubscriberFilter>(initial?.filter ?? 'active');
  const [layerId, setLayerId] = useState<MapLayerId>(mapConfig.defaultBasemap);
  const [mapView, setMapView] = useState<GeoMapView>('cities');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(initial?.province ?? null);
  const [hiddenCustomLayerIds, setHiddenCustomLayerIds] = useState<string[]>([]);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [mapExportOpen, setMapExportOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    if (entitySource === 'subscribers') {
      return filter === 'active' ? statsPack.subscribers.active : statsPack.subscribers.all;
    }
    if (entitySource === 'advertisers') return statsPack.advertisers;
    if (entitySource === 'messages') return statsPack.messages;
    return filter === 'active' ? statsPack.combined.active : statsPack.combined.all;
  }, [entitySource, filter, statsPack]);

  const selectedCity = useMemo(
    () => stats.cities.find((city) => city.cityId === selectedCityId) ?? null,
    [stats.cities, selectedCityId],
  );

  const selectedProvinceStat = useMemo(
    () => stats.provinceStats.find((row) => row.province === selectedProvince) ?? null,
    [stats.provinceStats, selectedProvince],
  );

  const bottomCities = useMemo(() => {
    if (stats.cities.length <= 5) return [];
    return [...stats.cities].sort((a, b) => a.count - b.count).slice(0, 5);
  }, [stats.cities]);

  const coveragePercent = useMemo(() => {
    const total = stats.totalWithCity + stats.totalWithoutCity;
    if (total <= 0) return 0;
    return Math.round((stats.totalWithCity / total) * 100);
  }, [stats.totalWithCity, stats.totalWithoutCity]);

  const reportSubtitle = useMemo(() => {
    const filterLabel =
      entitySource === 'subscribers' || entitySource === 'all'
        ? filter === 'active'
          ? 'فعال'
          : 'همه'
        : '—';
    return `${ENTITY_LABELS[entitySource]} · فیلتر: ${filterLabel}`;
  }, [entitySource, filter]);

  const cityExportRows = useMemo(
    () =>
      stats.cities.map((city, index) => ({
        rank: index + 1,
        city: city.city,
        province: city.province,
        count: city.count,
      })),
    [stats.cities],
  );

  const provinceExportRows = useMemo(
    () =>
      stats.provinceStats.map((row, index) => ({
        rank: index + 1,
        province: row.province,
        count: row.count,
      })),
    [stats.provinceStats],
  );

  useEffect(() => {
    if (!initial?.city && !initial?.province) return;
    setTab('map');

    if (initial.province) {
      setSelectedProvince(initial.province);
      setMapView(initial.city ? 'cities' : 'provinces');
    }

    if (initial.city) {
      const match = stats.cities.find(
        (city) =>
          city.city === initial.city &&
          (!initial.province || city.province === initial.province),
      );
      if (match) setSelectedCityId(match.cityId);
    }
  }, [initial?.city, initial?.province, stats.cities]);

  function handleAggregate(refresh = false) {
    setJobMessage(null);
    setJobError(null);
    startTransition(async () => {
      try {
        if (refresh) {
          const result = await backfillGeoStatsNow(30);
          setJobMessage(`تجمیع ۳۰ روزه انجام شد — ${result.totalRows} ردیف`);
        } else {
          const result = await runGeoStatsNow();
          setJobMessage(
            `تجمیع امروز/دیروز انجام شد — ${result.results.map((r) => r.rowsUpserted).join(' + ')} ردیف`,
          );
        }
        router.refresh();
      } catch (error) {
        setJobError(error instanceof Error ? error.message : 'اجرای تجمیع ناموفق بود');
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="با موقعیت شهر" value={stats.totalWithCity} />
        <StatCard label="بدون موقعیت" value={stats.totalWithoutCity} />
        <StatCard label="پوشش مکانی" value={coveragePercent} suffix="%" />
        <StatCard
          label="پرتراکم‌ترین شهر"
          value={stats.topCity?.count ?? 0}
          hint={
            stats.topCity ? `${stats.topCity.city} (${stats.topCity.province})` : '—'
          }
        />
        <StatCard label="شهرهای دارای داده" value={stats.cities.length} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === 'map'} onClick={() => setTab('map')}>
            نقشه
          </TabButton>
          <TabButton active={tab === 'reports'} onClick={() => setTab('reports')}>
            گزارش و نمودار
          </TabButton>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LoadingButton
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            loading={isPending}
            onClick={() => handleAggregate(false)}
          >
            تجمیع امروز
          </LoadingButton>
          <LoadingButton
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full"
            loading={isPending}
            onClick={() => handleAggregate(true)}
          >
            بازسازی ۳۰ روز
          </LoadingButton>
          {analytics.lastAggregatedAt && (
            <span className="text-xs text-muted-foreground">
              آخرین تجمیع: {new Date(analytics.lastAggregatedAt).toLocaleString('fa-IR')}
            </span>
          )}
        </div>
      </div>

      {jobMessage && <StatusBanner type="success" message={jobMessage} />}
      {jobError && <StatusBanner type="error" message={jobError} />}
      {exportMessage && <StatusBanner type="success" message={exportMessage} />}
      {exportError && <StatusBanner type="error" message={exportError} />}

      <GeoSettingsHint googleReady={Boolean(mapConfig.googleApiKey)} />

      <div className="flex flex-wrap gap-2">
        <FilterButton active={entitySource === 'subscribers'} onClick={() => setEntitySource('subscribers')}>
          مشترکین
        </FilterButton>
        {mapConfig.showAdvertisersOnMap && (
          <FilterButton active={entitySource === 'advertisers'} onClick={() => setEntitySource('advertisers')}>
            آگهی‌دهندگان
          </FilterButton>
        )}
        {mapConfig.showMessagesOnMap && (
          <FilterButton active={entitySource === 'messages'} onClick={() => setEntitySource('messages')}>
            پیام‌ها
          </FilterButton>
        )}
        <FilterButton active={entitySource === 'all'} onClick={() => setEntitySource('all')}>
          همه منابع
        </FilterButton>
      </div>

      <div className="flex flex-wrap gap-2">
        {(entitySource === 'subscribers' || entitySource === 'all') && (
          <>
            <FilterButton active={filter === 'active'} onClick={() => setFilter('active')}>
              مشترک فعال
            </FilterButton>
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
              همه مشترکین
            </FilterButton>
          </>
        )}
      </div>

      {tab === 'map' ? (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <FilterButton active={mapView === 'cities'} onClick={() => setMapView('cities')}>
                نمای شهر
              </FilterButton>
              <FilterButton active={mapView === 'heatmap'} onClick={() => setMapView('heatmap')}>
                heatmap
              </FilterButton>
              <FilterButton active={mapView === 'provinces'} onClick={() => setMapView('provinces')}>
                choropleth استان
              </FilterButton>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">لایه نقشه:</span>
              {mapConfig.layers.map((layer) => (
                <Button
                  key={layer.id}
                  type="button"
                  size="sm"
                  variant={layerId === layer.id ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => setLayerId(layer.id)}
                >
                  {layer.label}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setExportError(null);
                  setMapExportOpen(true);
                }}
              >
                خروجی نقشه
              </Button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div ref={mapCaptureRef} className="rounded-2xl bg-card p-1">
              <GeoMap
                cities={stats.cities}
                provinceStats={stats.provinceStats}
                mapConfig={mapConfig}
                layerId={layerId}
                mapView={mapView}
                hiddenCustomLayerIds={hiddenCustomLayerIds}
                selectedCityId={selectedCityId}
                selectedProvince={selectedProvince}
                onSelectCity={setSelectedCityId}
                onSelectProvince={setSelectedProvince}
              />
            </div>

            <aside className="space-y-4">
              <GeoLayerPanel
                customLayers={mapConfig.customLayers}
                hiddenLayerIds={hiddenCustomLayerIds}
                onToggleCustomLayer={(layerIdToToggle) =>
                  setHiddenCustomLayerIds((current) =>
                    current.includes(layerIdToToggle)
                      ? current.filter((id) => id !== layerIdToToggle)
                      : [...current, layerIdToToggle],
                  )
                }
              />
              {mapView === 'cities' && selectedCity && (
                <SelectionCard
                  title={selectedCity.city}
                  subtitle={selectedCity.province}
                  value={selectedCity.count}
                  hint="مشترک در این شهر"
                />
              )}

              {mapView === 'provinces' && selectedProvinceStat && (
                <SelectionCard
                  title={selectedProvinceStat.province}
                  subtitle="استان انتخاب‌شده"
                  value={selectedProvinceStat.count}
                  hint="مشترک در این استان"
                />
              )}

              <RankList
                title="۱۰ شهر برتر"
                empty="هنوز داده مکانی ثبت نشده است."
                items={stats.cities.slice(0, 10).map((city, index) => ({
                  key: city.cityId,
                  label: (
                    <>
                      <span className="me-2 text-xs text-muted-foreground">{index + 1}.</span>
                      {city.city}
                      <span className="ms-1 text-xs text-muted-foreground">({city.province})</span>
                    </>
                  ),
                  count: city.count,
                  selected: selectedCityId === city.cityId,
                  onClick: () => setSelectedCityId(city.cityId),
                }))}
              />

              {bottomCities.length > 0 && (
                <div className="rounded-2xl border border-border p-4">
                  <h3 className="font-semibold">شهرهای با کمترین پوشش</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {bottomCities.map((city) => (
                      <li key={city.cityId} className="flex justify-between gap-2">
                        <span>
                          {city.city}
                          <span className="text-xs text-muted-foreground"> — {city.province}</span>
                        </span>
                        <span className="tabular-nums">{formatNumber(city.count)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">گزارش‌های تجمیعی و روند ۳۰ روزه</p>
            <div className="flex flex-wrap gap-2">
              <ExportToolbar
                title="گزارش توزیع شهری"
                subtitle={reportSubtitle}
                filenameBase="geo-cities-report"
                columns={[
                  { key: 'rank', header: 'رتبه', width: 8 },
                  { key: 'city', header: 'شهر', width: 16 },
                  { key: 'province', header: 'استان', width: 14 },
                  { key: 'count', header: 'تعداد', width: 10 },
                ]}
                rows={cityExportRows}
                onDone={setExportMessage}
                onError={setExportError}
              />
              <ExportToolbar
                title="گزارش توزیع استانی"
                subtitle={reportSubtitle}
                filenameBase="geo-provinces-report"
                columns={[
                  { key: 'rank', header: 'رتبه', width: 8 },
                  { key: 'province', header: 'استان', width: 18 },
                  { key: 'count', header: 'تعداد', width: 10 },
                ]}
                rows={provinceExportRows}
                onDone={setExportMessage}
                onError={setExportError}
              />
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <GeoTrendChart data={analytics.trend} />
            <GeoProvinceShareChart data={stats.provinceStats} />
            <GeoTopCitiesChart cities={stats.cities} />
            <GeoGrowthCitiesChart cities={analytics.topGrowthCities} />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">توزیع استانی</h3>
          {tab === 'map' && (
            <ExportToolbar
              title="گزارش توزیع استانی"
              subtitle={reportSubtitle}
              filenameBase="geo-provinces-report"
              columns={[
                { key: 'rank', header: 'رتبه', width: 8 },
                { key: 'province', header: 'استان', width: 18 },
                { key: 'count', header: 'تعداد', width: 10 },
              ]}
              rows={provinceExportRows}
              onDone={setExportMessage}
              onError={setExportError}
            />
          )}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stats.provinceStats.map((row) => (
            <button
              key={row.province}
              type="button"
              onClick={() => {
                setSelectedProvince(row.province);
                setTab('map');
                setMapView('provinces');
              }}
              className={cn(
                'flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-start text-sm transition-colors hover:bg-muted',
                selectedProvince === row.province && 'border-primary/40 bg-primary/5',
              )}
            >
              <span>{row.province}</span>
              <Badge variant="outline">{formatNumber(row.count)}</Badge>
            </button>
          ))}
          {stats.provinceStats.length === 0 && (
            <p className="text-sm text-muted-foreground">داده استانی موجود نیست.</p>
          )}
        </div>
      </div>

      <MapExportDialog
        open={mapExportOpen}
        title="خروجی نقشه GIS"
        subtitle={`${reportSubtitle} · نمای ${mapView === 'cities' ? 'شهر' : mapView === 'heatmap' ? 'heatmap' : 'استانی'}`}
        target={mapCaptureRef.current}
        meta={{
          entityLabel: ENTITY_LABELS[entitySource],
          filterLabel:
            entitySource === 'subscribers' || entitySource === 'all'
              ? filter === 'active'
                ? 'فعال'
                : 'همه'
              : '—',
          mapViewLabel:
            mapView === 'cities' ? 'شهر' : mapView === 'heatmap' ? 'heatmap' : 'choropleth استان',
          withCity: stats.totalWithCity,
          withoutCity: stats.totalWithoutCity,
          coveragePercent,
          topCityLabel: stats.topCity
            ? `${stats.topCity.city} (${stats.topCity.province})`
            : null,
          topCities: stats.cities.slice(0, 10).map((city) => ({
            city: city.city,
            province: city.province,
            count: city.count,
          })),
          provinces: stats.provinceStats.slice(0, 10).map((row) => ({
            province: row.province,
            count: row.count,
          })),
        }}
        onClose={() => setMapExportOpen(false)}
        onDone={(msg) => {
          setExportMessage(msg);
          setMapExportOpen(false);
        }}
        onError={setExportError}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  suffix,
}: {
  label: string;
  value: number;
  hint?: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {formatNumber(value)}
        {suffix}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SelectionCard({
  title,
  subtitle,
  value,
  hint,
}: {
  title: string;
  subtitle: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{formatNumber(value)}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function RankList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{
    key: string;
    label: React.ReactNode;
    count: number;
    selected?: boolean;
    onClick?: () => void;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={item.onClick}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-start text-sm transition-colors hover:bg-muted',
                item.selected && 'bg-muted',
              )}
            >
              <span>{item.label}</span>
              <Badge variant="secondary">{formatNumber(item.count)}</Badge>
            </button>
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">{empty}</p>}
      </ul>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'outline'}
      className="rounded-full"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'outline'}
      className="rounded-full"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
