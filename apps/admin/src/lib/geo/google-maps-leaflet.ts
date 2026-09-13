import L from 'leaflet';

let googleScriptPromise: Promise<void> | null = null;
let mutantScriptPromise: Promise<void> | null = null;

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

export async function ensureGoogleMapsLeaflet(apiKey: string): Promise<void> {
  if (!apiKey.trim()) {
    throw new Error('Google Maps API key is missing');
  }

  if (!googleScriptPromise) {
    googleScriptPromise = loadScript(
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey.trim())}`,
      'google-maps-api',
    );
  }

  if (!mutantScriptPromise) {
    mutantScriptPromise = loadScript(
      'https://unpkg.com/leaflet.gridlayer.googlemutant@0.15.0/dist/Leaflet.GoogleMutant.js',
      'leaflet-google-mutant',
    );
  }

  await googleScriptPromise;
  await mutantScriptPromise;
}

export type GoogleMutantLayer = L.TileLayer;

export async function createGoogleMutantLayer(
  apiKey: string,
  type: 'roadmap' | 'satellite' | 'hybrid',
): Promise<GoogleMutantLayer> {
  await ensureGoogleMapsLeaflet(apiKey);

  const gridLayerFactory = (
    L as typeof L & {
      gridLayer?: {
        googleMutant?: (options: { type: string; maxZoom?: number }) => L.TileLayer;
      };
    }
  ).gridLayer?.googleMutant;

  if (!gridLayerFactory) {
    throw new Error('Google Mutant layer is unavailable');
  }

  return gridLayerFactory({ type, maxZoom: 21 });
}
