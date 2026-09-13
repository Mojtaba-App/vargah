import { FREE_MAP_LAYERS, type FreeMapLayerId } from './iran-geo';

export type CustomGeoLayer = {
  id: string;
  name: string;
  geoJsonUrl: string;
  enabled: boolean;
  opacity: number;
  color: string;
  zIndex: number;
  sourceFormat?: 'geojson' | 'kml' | 'kmz' | 'url';
  originalFileName?: string;
};

export type MapLayerVisibility = {
  osm: boolean;
  osmHot: boolean;
  carto: boolean;
  topo: boolean;
  googleRoad: boolean;
  googleSatellite: boolean;
  googleHybrid: boolean;
};

export type GoogleMapMutantType = 'roadmap' | 'satellite' | 'hybrid';

export const GOOGLE_MAP_LAYERS = {
  googleRoad: {
    id: 'googleRoad',
    label: 'Google Road',
    mutantType: 'roadmap' as GoogleMapMutantType,
  },
  googleSatellite: {
    id: 'googleSatellite',
    label: 'Google Satellite',
    mutantType: 'satellite' as GoogleMapMutantType,
  },
  googleHybrid: {
    id: 'googleHybrid',
    label: 'Google Hybrid',
    mutantType: 'hybrid' as GoogleMapMutantType,
  },
} as const;

export type GoogleMapLayerId = keyof typeof GOOGLE_MAP_LAYERS;

export type MapLayerId = FreeMapLayerId | GoogleMapLayerId;

export type MapConfig = {
  googleEnabled: boolean;
  googleApiKey: string;
  defaultBasemap: MapLayerId;
  layerVisibility: MapLayerVisibility;
  customLayers: CustomGeoLayer[];
  showAdvertisersOnMap: boolean;
  showMessagesOnMap: boolean;
};

export const MAP_CONFIG_KEY = 'map_config';

export const DEFAULT_LAYER_VISIBILITY: MapLayerVisibility = {
  osm: true,
  osmHot: true,
  carto: true,
  topo: true,
  googleRoad: true,
  googleSatellite: true,
  googleHybrid: true,
};

export const DEFAULT_MAP_CONFIG: MapConfig = {
  googleEnabled: false,
  googleApiKey: '',
  defaultBasemap: 'osm',
  layerVisibility: DEFAULT_LAYER_VISIBILITY,
  customLayers: [],
  showAdvertisersOnMap: true,
  showMessagesOnMap: true,
};

export function mergeMapConfig(value: unknown): MapConfig {
  const input = (value && typeof value === 'object' ? value : {}) as Partial<MapConfig>;
  return {
    ...DEFAULT_MAP_CONFIG,
    ...input,
    layerVisibility: {
      ...DEFAULT_LAYER_VISIBILITY,
      ...(input.layerVisibility && typeof input.layerVisibility === 'object'
        ? input.layerVisibility
        : {}),
    },
    customLayers: Array.isArray(input.customLayers)
      ? input.customLayers.map((layer, index) => {
          const row = layer as CustomGeoLayer;
          return {
            id: String(row.id ?? `custom-${index + 1}`),
            name: String(row.name ?? `لایه ${index + 1}`),
            geoJsonUrl: String(row.geoJsonUrl ?? ''),
            enabled: Boolean(row.enabled ?? true),
            opacity: Number(row.opacity ?? 0.6),
            color: String(row.color ?? '#6366f1'),
            zIndex: Number(row.zIndex ?? index + 1),
            sourceFormat: row.sourceFormat,
            originalFileName: row.originalFileName ? String(row.originalFileName) : undefined,
          };
        })
      : [],
  };
}

export function isGoogleMapsReady(config: MapConfig): boolean {
  return config.googleEnabled && Boolean(config.googleApiKey.trim());
}

export type ResolvedMapLayer = {
  id: MapLayerId;
  label: string;
  kind: 'free' | 'google';
  googleType?: GoogleMapMutantType;
};

export function resolveAvailableMapLayers(config: MapConfig): ResolvedMapLayer[] {
  const layers: ResolvedMapLayer[] = [];

  for (const id of Object.keys(FREE_MAP_LAYERS) as FreeMapLayerId[]) {
    if (config.layerVisibility[id]) {
      layers.push({ id, label: FREE_MAP_LAYERS[id].label, kind: 'free' });
    }
  }

  if (isGoogleMapsReady(config)) {
    for (const id of Object.keys(GOOGLE_MAP_LAYERS) as GoogleMapLayerId[]) {
      if (config.layerVisibility[id]) {
        layers.push({
          id,
          label: GOOGLE_MAP_LAYERS[id].label,
          kind: 'google',
          googleType: GOOGLE_MAP_LAYERS[id].mutantType,
        });
      }
    }
  }

  return layers;
}

export function resolveDefaultBasemap(config: MapConfig): MapLayerId {
  const available = resolveAvailableMapLayers(config);
  if (available.some((layer) => layer.id === config.defaultBasemap)) {
    return config.defaultBasemap;
  }
  return available[0]?.id ?? 'osm';
}

export type AdminMapRuntimeConfig = {
  defaultBasemap: MapLayerId;
  layers: ResolvedMapLayer[];
  googleApiKey: string | null;
  customLayers: CustomGeoLayer[];
  showAdvertisersOnMap: boolean;
  showMessagesOnMap: boolean;
};

/** Config passed to admin geo page — API key only when Google is enabled. */
export function buildAdminMapRuntimeConfig(config: MapConfig): AdminMapRuntimeConfig {
  const merged = mergeMapConfig(config);
  return {
    defaultBasemap: resolveDefaultBasemap(merged),
    layers: resolveAvailableMapLayers(merged),
    googleApiKey: isGoogleMapsReady(merged) ? merged.googleApiKey.trim() : null,
    customLayers: merged.customLayers.filter((layer) => layer.enabled && layer.geoJsonUrl.trim()),
    showAdvertisersOnMap: merged.showAdvertisersOnMap,
    showMessagesOnMap: merged.showMessagesOnMap,
  };
}

export { maskSecret } from './messaging-config';
