import { setRequestLocale } from 'next-intl/server';
import { Container } from '@vargah/ui/components/container';

import { PageHeader } from '@/components/shared/page-header';
import { SectionTitle } from '@/components/shared/section-title';
import { PricingTable } from '@/components/ads/pricing-table';
import { PlacementSchematics } from '@/components/ads/placement-schematics';
import { PortfolioGrid } from '@/components/ads/portfolio-grid';
import { AdRequestForm } from '@/components/forms/ad-request-form';
import { getPublicServicesContent } from '@/lib/services-content';

export const dynamic = 'force-dynamic';

export default async function AdvertisingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const services = await getPublicServicesContent();
  const { advertising } = services;

  return (
    <>
      <PageHeader title={advertising.title} description={advertising.description} />
      <Container className="py-12 sm:py-14">
        <section className="mb-14">
          <SectionTitle
            title={advertising.placementsTitle}
            subtitle={advertising.placementsSubtitle}
          />
          <PlacementSchematics
            placements={advertising.placements}
            pricing={advertising.pricing}
          />
        </section>

        <section className="mb-14">
          <SectionTitle title={advertising.pricingTitle} subtitle={advertising.pricingSubtitle} />
          <PricingTable items={advertising.pricing} placements={advertising.placements} />
        </section>

        <section className="mb-14">
          <SectionTitle title={advertising.formTitle} subtitle={advertising.formSubtitle} />
          <div className="max-w-2xl">
            <AdRequestForm pricingOptions={advertising.pricing} />
          </div>
        </section>

        <section>
          <SectionTitle title={advertising.portfolioTitle} subtitle={advertising.portfolioSubtitle} />
          <PortfolioGrid items={advertising.portfolio} />
        </section>
      </Container>
    </>
  );
}
