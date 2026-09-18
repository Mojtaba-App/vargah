import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@vargah/ui/components/container';
import { sanitizeArticleHtml } from '@vargah/security/sanitize';
import {
  buildNewsArticleJsonLd,
  buildPeriodicalJsonLd,
  pickDiscoverImage,
  articleUrl,
} from '@vargah/seo';
import { absoluteUrl } from '@vargah/seo/site';

import { Breadcrumb } from '@/components/shared/breadcrumb';
import { ArticleMeta } from '@/components/articles/article-meta';
import { ShareButtons } from '@/components/articles/share-buttons';
import { RelatedArticles } from '@/components/articles/related-articles';
import { CommentSection } from '@/components/articles/comment-section';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { FadeIn } from '@/components/motion/fade-in';
import { JsonLd } from '@/components/seo/json-ld';
import { AnalyticsProvider } from '@/components/analytics/analytics-provider';
import { getArticleBySlug, getRelatedArticles, articles } from '@/data/mock/articles';
import { getCommentsByArticle } from '@/data/mock/comments';
import { getCachedApprovedComments } from '@/lib/db/comments';
import {
  getCachedPublishedArticleBySlug,
  getCachedPublishedArticleSlugs,
  getRelatedPublishedArticles,
} from '@/lib/db/articles';
import { getDbArticleMeta, mapDbArticleToView } from '@/lib/db/map-article';
import { toIsoString } from '@/lib/date';

export const revalidate = 3600;

type ArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const dbSlugs = await getCachedPublishedArticleSlugs().catch(() => [] as string[]);
  if (process.env.NODE_ENV === 'production') {
    return dbSlugs.map((slug) => ({ slug }));
  }
  const mockSlugs = articles.map((a) => a.slug);
  const slugs = [...new Set([...dbSlugs, ...mockSlugs])];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const dbArticle = await getCachedPublishedArticleBySlug(slug).catch(() => null);
  const mockArticle = process.env.NODE_ENV === 'production' ? null : getArticleBySlug(slug);

  const title = dbArticle?.metaTitle ?? dbArticle?.title ?? mockArticle?.title;
  const description =
    dbArticle?.metaDescription ?? dbArticle?.excerpt ?? mockArticle?.excerpt ?? undefined;
  const image =
    pickDiscoverImage(dbArticle?.coverImage, dbArticle?.ogImage) ?? mockArticle?.coverImage;
  const imageUrl = image?.startsWith('http') ? image : image ? absoluteUrl(image) : undefined;
  const canonical = articleUrl(slug);

  if (!title) return {};

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      locale: 'fa_IR',
      url: canonical,
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 675, alt: title }] : undefined,
      publishedTime: toIsoString(dbArticle?.publishedAt) ?? mockArticle?.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const dbArticle = await getCachedPublishedArticleBySlug(slug).catch(() => null);

  if (dbArticle) {
    const article = mapDbArticleToView(dbArticle);
    const meta = getDbArticleMeta(dbArticle);
    const relatedDb = await getRelatedPublishedArticles(dbArticle.id, dbArticle.categoryId);
    const related = relatedDb.map(mapDbArticleToView);
    const comments = await getCachedApprovedComments(dbArticle.id);
    const safeContent = sanitizeArticleHtml(article.content);
    const pageUrl = articleUrl(slug);
    const discoverImage =
      pickDiscoverImage(dbArticle.coverImage, dbArticle.ogImage) ?? article.coverImage;

    const jsonLd = buildNewsArticleJsonLd({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      coverImage: discoverImage,
      ogImage: dbArticle.ogImage,
      publishedAt: dbArticle.publishedAt,
      updatedAt: dbArticle.updatedAt,
      authorName: meta.author.name,
      categoryName: meta.category?.name,
    });

    return (
      <>
        <JsonLd
          data={[jsonLd, buildPeriodicalJsonLd({ number: 0, title: 'وارگه', slug: 'vargah' })]}
        />
        <AnalyticsProvider articleId={dbArticle.id} />
        <Container className="py-6">
          <Breadcrumb
            items={[
              { label: 'خانه', href: '/' },
              { label: 'مقالات', href: '/articles' },
              { label: article.title },
            ]}
          />
        </Container>
        <Container className="pb-12">
          <article className="mx-auto max-w-3xl">
            <FadeIn>
              <ArticleMeta
                article={article}
                author={meta.author}
                category={meta.category}
                tags={meta.tags}
              />
            </FadeIn>
            <FadeIn delay={0.05}>
              <OptimizedImage
                src={discoverImage}
                alt={article.title}
                fill
                wrapperClassName="my-8 aspect-[16/9] overflow-hidden rounded-2xl shadow-md"
                sizes="(max-width:768px) 100vw, 1200px"
                priority
              />
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="prose-content" dangerouslySetInnerHTML={{ __html: safeContent }} />
            </FadeIn>
            <div className="border-border mt-8 border-t pt-6">
              <ShareButtons title={article.title} url={pageUrl} />
            </div>
          </article>
          <div className="mx-auto mt-12 max-w-3xl">
            <CommentSection comments={comments} articleId={dbArticle.id} />
          </div>
          <div className="mx-auto mt-12 max-w-5xl">
            <RelatedArticles articles={related} />
          </div>
        </Container>
      </>
    );
  }

  if (process.env.NODE_ENV === 'production') notFound();

  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article);
  const comments = getCommentsByArticle(article.id);
  const pageUrl = articleUrl(article.slug);
  const safeContent = sanitizeArticleHtml(article.content);

  return (
    <>
      <JsonLd
        data={buildNewsArticleJsonLd({
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          coverImage: article.coverImage,
          publishedAt: article.publishedAt,
          authorName: 'وارگه',
        })}
      />
      <Container className="py-6">
        <Breadcrumb
          items={[
            { label: 'خانه', href: '/' },
            { label: 'مقالات', href: '/articles' },
            { label: article.title },
          ]}
        />
      </Container>
      <Container className="pb-12">
        <article className="mx-auto max-w-3xl">
          <FadeIn>
            <ArticleMeta article={article} />
          </FadeIn>
          <FadeIn delay={0.05}>
            <OptimizedImage
              src={article.coverImage}
              alt={article.title}
              fill
              wrapperClassName="my-8 aspect-[16/9] overflow-hidden rounded-2xl shadow-md"
              sizes="(max-width:768px) 100vw, 768px"
              priority
            />
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: safeContent }} />
          </FadeIn>
          <div className="border-border mt-8 border-t pt-6">
            <ShareButtons title={article.title} url={pageUrl} />
          </div>
        </article>
        <div className="mx-auto mt-12 max-w-3xl">
          <CommentSection comments={comments} articleId={article.id} isMock />
        </div>
        <div className="mx-auto mt-12 max-w-5xl">
          <RelatedArticles articles={related} />
        </div>
      </Container>
    </>
  );
}
