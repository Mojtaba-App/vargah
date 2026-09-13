import { absoluteUrl, articleUrl, getSiteUrl } from './site';

export type ArticleJsonLdInput = {
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string;
  coverImage?: string | null;
  ogImage?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  authorName: string;
  categoryName?: string | null;
};

export type IssueJsonLdInput = {
  number: number;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  pdfUrl?: string | null;
  publishedAt?: Date | string | null;
  pageCount?: number;
};

function toIso(date?: Date | string | null): string | undefined {
  if (!date) return undefined;
  return typeof date === 'string' ? date : date.toISOString();
}

export function buildOrganizationJsonLd(siteName = 'وارگه') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: getSiteUrl(),
    logo: absoluteUrl('/images/hero-vargah.jpg'),
  };
}

export function buildWebSiteJsonLd(siteName = 'وارگه') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: getSiteUrl(),
    inLanguage: 'fa-IR',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${getSiteUrl()}/articles?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildNewsArticleJsonLd(input: ArticleJsonLdInput) {
  const image = input.ogImage || input.coverImage;
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: input.title,
    description: input.excerpt ?? undefined,
    image: image ? [image] : undefined,
    datePublished: toIso(input.publishedAt),
    dateModified: toIso(input.updatedAt ?? input.publishedAt),
    author: {
      '@type': 'Person',
      name: input.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'وارگه',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/images/hero-vargah.jpg'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl(input.slug),
    },
    articleSection: input.categoryName ?? undefined,
    inLanguage: 'fa-IR',
  };
}

export function buildArticleJsonLd(input: ArticleJsonLdInput) {
  const news = buildNewsArticleJsonLd(input);
  return { ...news, '@type': 'Article' };
}

export function buildPeriodicalJsonLd(input: IssueJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Periodical',
    name: 'وارگه',
    issn: undefined,
    url: getSiteUrl(),
  };
}

export function buildPublicationIssueJsonLd(input: IssueJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PublicationIssue',
    issueNumber: input.number,
    name: input.title,
    description: input.description ?? undefined,
    datePublished: toIso(input.publishedAt),
    image: input.coverImage ?? undefined,
    url: absoluteUrl(`/issues/${encodeURIComponent(input.slug)}`),
    isPartOf: {
      '@type': 'Periodical',
      name: 'وارگه',
      url: getSiteUrl(),
    },
    numberOfPages: input.pageCount ?? undefined,
    encoding: input.pdfUrl
      ? {
          '@type': 'MediaObject',
          contentUrl: input.pdfUrl,
          encodingFormat: 'application/pdf',
        }
      : undefined,
    inLanguage: 'fa-IR',
  };
}
