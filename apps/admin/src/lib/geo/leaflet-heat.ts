import L from 'leaflet';

let heatScriptPromise: Promise<void> | null = null;

function loadScript(src: string, id: string): Promise<void> {
  if (document.getElementById(id)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${id}`));
    document.head.appendChild(script);
  });
}

type HeatLayer = L.Layer & {
  setLatLngs: (latlngs: Array<[number, number, number?]>) => HeatLayer;
};

type LeafletWithHeat = typeof L & {
  heatLayer?: (
    latlngs: Array<[number, number, number?]>,
    options?: Record<string, unknown>,
  ) => HeatLayer;
};

export async function ensureLeafletHeat(): Promise<void> {
  const leaflet = L as LeafletWithHeat;
  if (leaflet.heatLayer) return;

  if (!heatScriptPromise) {
    heatScriptPromise = loadScript(
      'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js',
      'leaflet-heat',
    );
  }

  await heatScriptPromise;

  if (!leaflet.heatLayer) {
    throw new Error('leaflet.heat failed to initialize');
  }
}

export function createHeatLayer(
  points: Array<[number, number, number?]>,
  options?: Record<string, unknown>,
): HeatLayer {
  const leaflet = L as LeafletWithHeat;
  if (!leaflet.heatLayer) {
    throw new Error('leaflet.heat is not loaded');
  }
  return leaflet.heatLayer(points, {
    radius: 22,
    blur: 16,
    maxZoom: 12,
    max: 1,
    gradient: {
      0.2: '#3b82f6',
      0.5: '#eab308',
      0.8: '#f97316',
      1: '#ef4444',
    },
    ...options,
  });
}
