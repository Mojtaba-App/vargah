import { buildAdminMapRuntimeConfig } from '@vargah/business/map-config';

import { GeoWorkspace } from '@/components/geo/geo-workspace';
import { PageHeader } from '@/components/ui/data-table';
import { requirePermission } from '@/lib/auth-utils';
import { getGeoAnalytics } from '@/lib/geo/analytics';
import { getGeoStats, type GeoEntitySource, type GeoSubscriberFilter } from '@/lib/geo/stats';
import { getMapConfig } from '@/lib/map-config';
import { PERMISSIONS } from '@/lib/permissions';

type GeoPageProps = {
  searchParams: Promise<{
    province?: string;
    city?: string;
    source?: string;
    filter?: string;
    tab?: string;
  }>;
};

function parseEntitySource(value?: string): GeoEntitySource | undefined {
  if (value === 'subscribers' || value === 'advertisers' || value === 'messages' || value === 'all') {
    return value;
  }
  return undefined;
}

function parseFilter(value?: string): GeoSubscriberFilter | undefined {
  if (value === 'active' || value === 'all') return value;
  return undefined;
}

function parseTab(value?: string): 'map' | 'reports' | undefined {
  if (value === 'map' || value === 'reports') return value;
  return undefined;
}

export default async function GeoPage({ searchParams }: GeoPageProps) {
  await requirePermission(PERMISSIONS.GEO_VIEW);

  const params = await searchParams;
  const initial = {
    province: params.province,
    city: params.city,
    source: parseEntitySource(params.source),
    filter: parseFilter(params.filter),
    tab: parseTab(params.tab),
  };

  const mapConfigRow = await getMapConfig();
  const mapConfig = buildAdminMapRuntimeConfig(mapConfigRow);

  const [
    subscribersActive,
    subscribersAll,
    advertisers,
    messages,
    combinedActive,
    combinedAll,
    analytics,
  ] = await Promise.all([
    getGeoStats('subscribers', 'active'),
    getGeoStats('subscribers', 'all'),
    mapConfig.showAdvertisersOnMap ? getGeoStats('advertisers', 'all') : Promise.resolve(emptyStats()),
    mapConfig.showMessagesOnMap ? getGeoStats('messages', 'all') : Promise.resolve(emptyStats()),
    getGeoStats('all', 'active'),
    getGeoStats('all', 'all'),
    getGeoAnalytics(30),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="تحلیل جغرافیایی"
        description="مشترکین، آگهی‌دهندگان و پیام‌ها — choropleth استانی، لایه‌های OSM و Google (اختیاری)"
      />
      <GeoWorkspace
        mapConfig={mapConfig}
        statsPack={{
          subscribers: { active: subscribersActive, all: subscribersAll },
          advertisers,
          messages,
          combined: { active: combinedActive, all: combinedAll },
        }}
        analytics={analytics}
        initial={initial}
      />
    </div>
  );
}

function emptyStats() {
  return {
    totalWithCity: 0,
    totalWithoutCity: 0,
    topCity: null,
    provinceStats: [],
    cities: [],
  };
}
