'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  FREE_MAP_LAYERS,
  IRAN_MAP_BOUNDS,
  IRAN_MAP_CENTER,
  provinceNameFromGeoJson,
  type FreeMapLayerId,
} from '@vargah/business/iran-geo';
import type { AdminMapRuntimeConfig, CustomGeoLayer, MapLayerId } from '@vargah/business/map-config';
import { createGoogleMutantLayer } from '@/lib/geo/google-maps-leaflet';
import { createHeatLayer, ensureLeafletHeat } from '@/lib/geo/leaflet-heat';
import type { GeoCityStat } from '@/lib/geo/stats';
import { adminPath } from '@/lib/base-path';
import type { GeoMapView } from '@/components/geo/geo-map-types';

export type { GeoMapView } from '@/components/geo/geo-map-types';

function resolveAssetUrl(url: string): string {
  if (!url) return url;
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  if (url.startsWith('/admin/')) return url;
  return adminPath(url);
}

type GeoMapProps = {
  cities: GeoCityStat[];
  provinceStats: Array<{ province: string; count: number }>;
  mapConfig: AdminMapRuntimeConfig;
  layerId: MapLayerId;
  mapView: GeoMapView;
  hiddenCustomLayerIds: string[];
  selectedCityId?: string | null;
  selectedProvince?: string | null;
  onSelectCity?: (cityId: string) => void;
  onSelectProvince?: (province: string) => void;
};

function markerRadius(count: number, maxCount: number) {
  if (maxCount <= 0) return 8;
  const ratio = count / maxCount;
  return 8 + Math.round(ratio * 22);
}

function choroplethFill(count: number, maxCount: number, selected: boolean): string {
  if (selected) return '#ef4444';
  if (count <= 0 || maxCount <= 0) return '#e2e8f0';
  const t = Math.min(1, count / maxCount);
  const r = Math.round(238 - t * 118);
  const g = Math.round(242 - t * 106);
  const b = Math.round(255 - t * 11);
  return `rgb(${r}, ${g}, ${b})`;
}

type ProvinceGeoJson = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: { 'name:fa': string; 'name:en': string };
    geometry: GeoJSON.Geometry;
  }>;
};

function isFreeLayer(layerId: MapLayerId): layerId is FreeMapLayerId {
  return layerId in FREE_MAP_LAYERS;
}

export function GeoMap({
  cities,
  provinceStats,
  mapConfig,
  layerId,
  mapView,
  hiddenCustomLayerIds,
  selectedCityId,
  selectedProvince,
  onSelectCity,
  onSelectProvince,
}: GeoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.Layer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const choroplethRef = useRef<L.GeoJSON | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const customLayersRef = useRef<L.LayerGroup | null>(null);
  const geoJsonRef = useRef<ProvinceGeoJson | null>(null);
  const [geoJsonReady, setGeoJsonReady] = useState(false);
  const [layerError, setLayerError] = useState<string | null>(null);
  const [layerProgress, setLayerProgress] = useState<{
    active: boolean;
    done: number;
    total: number;
    label: string;
  }>({ active: false, done: 0, total: 0, label: '' });

  const visibleCustomLayers = useMemo(
    () =>
      mapConfig.customLayers.filter((layer) => !hiddenCustomLayerIds.includes(layer.id)),
    [mapConfig.customLayers, hiddenCustomLayerIds],
  );

  useEffect(() => {
    const styleId = 'leaflet-geo-marker-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .geo-city-marker { background: transparent !important; border: none !important; }
        .geo-city-marker__dot {
          display: flex; align-items: center; justify-content: center;
          border-radius: 9999px; font-size: 11px; font-weight: 700;
          color: #fff; background: hsl(var(--primary));
          border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.25);
          cursor: pointer;
        }
        .geo-city-marker__dot.is-selected {
          background: hsl(var(--destructive));
          transform: scale(1.08);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(resolveAssetUrl('/geo/iran-provinces.geojson'))
      .then((res) => res.json())
      .then((data: ProvinceGeoJson) => {
        if (!cancelled) {
          geoJsonRef.current = data;
          setGeoJsonReady(true);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      center: IRAN_MAP_CENTER,
      zoom: 5,
      minZoom: 4,
      maxZoom: 14,
      maxBounds: IRAN_MAP_BOUNDS,
      maxBoundsViscosity: 0.85,
    });

    customLayersRef.current = L.layerGroup().addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markersRef.current = null;
      choroplethRef.current = null;
      heatLayerRef.current = null;
      customLayersRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function applyBasemap() {
      const liveMap = mapRef.current;
      if (!liveMap) return;

      if (layerRef.current) {
        liveMap.removeLayer(layerRef.current);
        layerRef.current = null;
      }

      setLayerError(null);

      try {
        const selected = mapConfig.layers.find((layer) => layer.id === layerId);
        if (!selected) {
          throw new Error('لایه انتخاب‌شده در دسترس نیست');
        }

        if (selected.kind === 'free' && isFreeLayer(layerId)) {
          layerRef.current = L.tileLayer(FREE_MAP_LAYERS[layerId].url, {
            attribution: FREE_MAP_LAYERS[layerId].attribution,
            maxZoom: FREE_MAP_LAYERS[layerId].maxZoom,
            crossOrigin: true,
          }).addTo(liveMap);
          return;
        }

        if (selected.kind === 'google' && selected.googleType && mapConfig.googleApiKey) {
          layerRef.current = await createGoogleMutantLayer(mapConfig.googleApiKey, selected.googleType);
          if (!cancelled) layerRef.current.addTo(liveMap);
          return;
        }

        throw new Error('لایه نقشه پیکربندی نشده است');
      } catch (error) {
        if (!cancelled) {
          setLayerError(error instanceof Error ? error.message : 'بارگذاری نقشه ناموفق بود');
          layerRef.current = L.tileLayer(FREE_MAP_LAYERS.osm.url, {
            attribution: FREE_MAP_LAYERS.osm.attribution,
            maxZoom: FREE_MAP_LAYERS.osm.maxZoom,
            crossOrigin: true,
          }).addTo(liveMap);
        }
      }
    }

    void applyBasemap();

    return () => {
      cancelled = true;
    };
  }, [layerId, mapConfig]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (choroplethRef.current) {
      map.removeLayer(choroplethRef.current);
      choroplethRef.current = null;
    }

    const geoJson = geoJsonRef.current;
    if (mapView !== 'provinces' || !geoJson) return;

    const provinceCountMap = new Map(provinceStats.map((row) => [row.province, row.count]));
    const maxCount = provinceStats.reduce((max, row) => Math.max(max, row.count), 0);

    choroplethRef.current = L.geoJSON(geoJson as GeoJSON.FeatureCollection, {
      style: (feature) => {
        const geoName = String(feature?.properties?.['name:fa'] ?? '');
        const province = provinceNameFromGeoJson(geoName);
        const count = provinceCountMap.get(province) ?? 0;
        const selected = selectedProvince === province;
        return {
          fillColor: choroplethFill(count, maxCount, selected),
          weight: selected ? 2.5 : 1,
          opacity: 1,
          color: selected ? '#ef4444' : '#64748b',
          fillOpacity: selected ? 0.82 : 0.72,
        };
      },
      onEachFeature: (feature, layer) => {
        const geoName = String(feature?.properties?.['name:fa'] ?? '');
        const province = provinceNameFromGeoJson(geoName);
        const count = provinceCountMap.get(province) ?? 0;
        layer.bindPopup(`<strong>${province}</strong><br/>${count} مورد`);
        layer.on('click', () => onSelectProvince?.(province));
      },
    }).addTo(map);
  }, [mapView, provinceStats, selectedProvince, onSelectProvince, geoJsonReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (mapView !== 'heatmap' || cities.length === 0) return;

    let cancelled = false;

    void (async () => {
      try {
        await ensureLeafletHeat();
        if (cancelled || !mapRef.current) return;

        const maxCount = cities.reduce((max, city) => Math.max(max, city.count), 0);
        const points: Array<[number, number, number]> = cities.map((city) => [
          city.lat,
          city.lng,
          maxCount > 0 ? city.count / maxCount : 0.1,
        ]);

        const layer = createHeatLayer(points, { max: 1 });
        heatLayerRef.current = layer;
        layer.addTo(mapRef.current);
      } catch {
        // heatmap is optional — map still works without it
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cities, mapView]);

  useEffect(() => {
    const group = customLayersRef.current;
    if (!group) return;

    let cancelled = false;
    group.clearLayers();

    if (visibleCustomLayers.length === 0) {
      setLayerProgress({ active: false, done: 0, total: 0, label: '' });
      return;
    }

    setLayerProgress({
      active: true,
      done: 0,
      total: visibleCustomLayers.length,
      label: 'شروع بارگذاری لایه‌ها…',
    });

    void (async () => {
      let done = 0;
      for (const layer of visibleCustomLayers) {
        if (cancelled) return;
        setLayerProgress({
          active: true,
          done,
          total: visibleCustomLayers.length,
          label: layer.name,
        });
        await loadCustomLayer(group, layer);
        done += 1;
        if (cancelled) return;
        setLayerProgress({
          active: done < visibleCustomLayers.length,
          done,
          total: visibleCustomLayers.length,
          label: layer.name,
        });
      }
      if (!cancelled) {
        setLayerProgress({
          active: false,
          done: visibleCustomLayers.length,
          total: visibleCustomLayers.length,
          label: '',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visibleCustomLayers]);

  useEffect(() => {
    const group = markersRef.current;
    if (!group) return;

    group.clearLayers();
    if (mapView !== 'cities') return;

    const maxCount = cities.reduce((max, city) => Math.max(max, city.count), 0);

    for (const city of cities) {
      const size = markerRadius(city.count, maxCount);
      const selected = city.cityId === selectedCityId;
      const icon = L.divIcon({
        className: 'geo-city-marker',
        html: `<div class="geo-city-marker__dot${selected ? ' is-selected' : ''}" style="width:${size}px;height:${size}px" title="${city.city}">${city.count}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([city.lat, city.lng], { icon });
      marker.bindPopup(
        `<strong>${city.city}</strong><br/>${city.province}<br/>${city.count} مورد`,
      );
      marker.on('click', () => onSelectCity?.(city.cityId));
      marker.addTo(group);
    }
  }, [cities, mapView, selectedCityId, onSelectCity]);

  const progressPercent =
    layerProgress.total > 0
      ? Math.min(100, Math.round((layerProgress.done / layerProgress.total) * 100))
      : 0;

  return (
    <div className="space-y-2">
      {layerError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {layerError} — fallback به OpenStreetMap
        </p>
      )}
      <div className="relative">
        <div
          ref={containerRef}
          className="h-[min(70vh,520px)] w-full overflow-hidden rounded-2xl border border-border bg-muted/30"
          aria-label={
            mapView === 'provinces'
              ? 'نقشه choropleth استانی'
              : mapView === 'heatmap'
                ? 'نقشه heatmap'
                : 'نقشه پراکندگی'
          }
        />
        {layerProgress.active ? (
          <div
            className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] rounded-xl border border-border/80 bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-muted-foreground">
                بارگذاری لایه: {layerProgress.label || '…'}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {progressPercent.toLocaleString('fa-IR')}٪ ({layerProgress.done.toLocaleString('fa-IR')}/
                {layerProgress.total.toLocaleString('fa-IR')})
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
      {mapView === 'provinces' && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>کم</span>
          <div className="h-2 flex-1 rounded-full bg-gradient-to-l from-indigo-600 via-indigo-300 to-slate-200" />
          <span>زیاد</span>
        </div>
      )}
    </div>
  );
}

async function loadCustomLayer(group: L.LayerGroup, layer: CustomGeoLayer) {
  try {
    const response = await fetch(resolveAssetUrl(layer.geoJsonUrl));
    if (!response.ok) return;
    const geoJson = await response.json();
    L.geoJSON(geoJson, {
      style: {
        color: layer.color,
        weight: 2,
        fillColor: layer.color,
        fillOpacity: layer.opacity,
      },
    }).addTo(group);
  } catch {
    // ignore broken custom layer
  }
}
