'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FREE_MAP_LAYERS, type FreeMapLayerId } from '@vargah/business/iran-geo';

type OsmLeafletMapProps = {
  lat: number;
  lng: number;
  className?: string;
  basemap?: FreeMapLayerId;
  zoom?: number;
};

const MARKER_ICON = L.divIcon({
  className: 'leaflet-osm-pin',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48" aria-hidden="true">
    <path fill="#4f46e5" stroke="#312e81" stroke-width="1.5" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/>
    <circle cx="12" cy="12" r="5" fill="#fff"/>
  </svg>`,
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -44],
});

export function OsmLeafletMap({
  lat,
  lng,
  className,
  basemap = 'carto',
  zoom = 15,
}: OsmLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const styleId = 'leaflet-osm-pin-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent =
        '.leaflet-osm-pin{background:transparent!important;border:none!important;}';
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const layer = FREE_MAP_LAYERS[basemap] ?? FREE_MAP_LAYERS.carto;
    const map = L.map(container, {
      center: [lat, lng],
      zoom,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: layer.maxZoom,
    }).addTo(map);

    markerRef.current = L.marker([lat, lng], { icon: MARKER_ICON }).addTo(map);
    mapRef.current = map;

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
      map.setView([lat, lng], map.getZoom(), { animate: false });
    }, 80);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [lat, lng, basemap, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([lat, lng], map.getZoom());
    markerRef.current?.setLatLng([lat, lng]);
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: '100%', width: '100%' }}
      role="img"
      aria-label="Interactive map"
    />
  );
}
