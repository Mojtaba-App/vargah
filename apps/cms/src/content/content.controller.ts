import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ArticleStatus, IssueStatus, prisma } from '@vargah/database';

import { ApiKeyGuard } from '../guards/api-key.guard';

@Controller('content')
export class ContentController {
  @Get('articles')
  async listArticles(@Query('take') takeRaw?: string) {
    const take = Math.min(Number(takeRaw) || 20, 100);
    const articles = await prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      take,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        readingTime: true,
      },
    });
    return { items: articles };
  }

  @Get('articles/:slug')
  async getArticle(@Param('slug') slug: string) {
    const article = await prisma.article.findFirst({
      where: { slug, status: ArticleStatus.PUBLISHED },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        coverImage: true,
        publishedAt: true,
        readingTime: true,
        metaTitle: true,
        metaDescription: true,
      },
    });
    if (!article) return { error: 'NOT_FOUND' };
    return { item: article };
  }

  @Get('issues')
  async listIssues(@Query('take') takeRaw?: string) {
    const take = Math.min(Number(takeRaw) || 20, 100);
    const issues = await prisma.issue.findMany({
      where: { status: IssueStatus.PUBLISHED },
      orderBy: { number: 'desc' },
      take,
      select: {
        id: true,
        slug: true,
        number: true,
        title: true,
        description: true,
        coverImage: true,
        publishedAt: true,
        pageCount: true,
      },
    });
    return { items: issues };
  }

  @Get('issues/:slug')
  async getIssue(@Param('slug') slug: string) {
    const issue = await prisma.issue.findFirst({
      where: { slug, status: IssueStatus.PUBLISHED },
      select: {
        id: true,
        slug: true,
        number: true,
        title: true,
        description: true,
        coverImage: true,
        pdfUrl: true,
        publishedAt: true,
        pageCount: true,
      },
    });
    if (!issue) return { error: 'NOT_FOUND' };
    return { item: issue };
  }

  /** وضعیت داخلی — فقط با API key */
  @Get('admin/ping')
  @UseGuards(ApiKeyGuard)
  adminPing() {
    return { ok: true, role: 'read-api', editorial: 'next-admin' };
  }
}
