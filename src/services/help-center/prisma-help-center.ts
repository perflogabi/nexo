import type { PrismaClient } from '@prisma/client';
import type { HelpArticleRecord, HelpCenterService } from './help-center-service';

export function createPrismaHelpCenter(prisma: PrismaClient): HelpCenterService {
  return {
    async search(query) {
      const q = query.trim();
      if (!q) {
        const all = await prisma.helpArticle.findMany({ orderBy: { title: 'asc' }, take: 20 });
        return all.map(mapArticle);
      }
      const articles = await prisma.helpArticle.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { body: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
            { tags: { has: q.toLowerCase() } },
          ],
        },
        take: 10,
      });
      return articles.map(mapArticle);
    },
    async getBySlug(slug) {
      const article = await prisma.helpArticle.findUnique({ where: { slug } });
      return article ? mapArticle(article) : null;
    },
  };
}

function mapArticle(a: {
  id: string;
  slug: string;
  title: string;
  body: string;
  tags: string[];
}): HelpArticleRecord {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    body: a.body,
    tags: a.tags,
  };
}
