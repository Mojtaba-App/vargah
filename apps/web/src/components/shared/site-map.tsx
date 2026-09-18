'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import {
  buildOpenStreetMapLink,
  buildNeshanLink,
  buildBaladLink,
  resolveContactMapView,
  type SiteContactSettings,
} from '@vargah/business/site-settings';

import { cn } from '@/lib/utils';

const OsmLeafletMap = dynamic(() => import('./osm-leaflet-map').then((mod) => mod.OsmLeafletMap), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
      Loading map…
    </div>
  ),
});

type SiteMapProps = {
  contact: Pick<SiteContactSettings, 'mapEmbedUrl' | 'mapLat' | 'mapLng'>;
  address?: string;
  className?: string;
  /** لایه کاشی Leaflet وقتی از مختصات استفاده می‌شود */
  basemap?: 'osm' | 'carto' | 'osmHot' | 'topo';
};

export function SiteMap({ contact, address, className, basemap = 'carto' }: SiteMapProps) {
  const t = useTranslations('map');
  const view = resolveContactMapView(contact);
  const lat = Number(contact.mapLat);
  const lng = Number(contact.mapLng);
  const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng);

  const links = hasCoords
    ? [
        { href: buildOpenStreetMapLink(lat, lng), label: 'OpenStreetMap' },
        { href: buildNeshanLink(lat, lng), label: 'نشان' },
        { href: buildBaladLink(lat, lng), label: 'بلد' },
      ]
    : [];

  return (
    <div className={cn('border-border overflow-hidden rounded-xl border', className)}>
      <div
        className="bg-muted/50 relative h-64 sm:h-80"
        role="region"
        aria-label={t('attribution')}
      >
        {view?.mode === 'embed' ? (
          <iframe
            title={t('attribution')}
            src={view.src}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : view?.mode === 'coordinates' ? (
          <OsmLeafletMap
            lat={view.lat}
            lng={view.lng}
            basemap={basemap}
            className="absolute inset-0 z-0"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center px-6 text-center text-sm">
            {t('unset')}
          </div>
        )}
      </div>
      <div className="border-border bg-background space-y-2 border-t px-4 py-3">
        {address ? <p className="text-muted-foreground text-sm">{address}</p> : null}
        <p className="text-muted-foreground text-xs">{t('attribution')}</p>
        {links.length > 0 ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs font-medium hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** @deprecated use SiteMap — نگه داشته شده برای سازگاری */
export function MapPlaceholder({
  address,
  lat,
  lng,
  className,
}: {
  address: string;
  lat: number;
  lng: number;
  className?: string;
}) {
  return (
    <SiteMap
      address={address}
      className={className}
      contact={{ mapEmbedUrl: '', mapLat: lat, mapLng: lng }}
    />
  );
}

/** سازگاری با ContactMap قبلی */
export function ContactMap({
  contact,
  className,
}: {
  contact: Pick<SiteContactSettings, 'mapEmbedUrl' | 'mapLat' | 'mapLng'>;
  className?: string;
}) {
  return <SiteMap contact={contact} className={className} />;
}
