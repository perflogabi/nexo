/**
 * Help Center — leitura de artigos (seed).
 * Port simples; impl in-memory ou Prisma.
 */

export type HelpArticleRecord = {
  id: string;
  slug: string;
  title: string;
  body: string;
  tags: string[];
};

export type HelpCenterService = {
  search(query: string): Promise<HelpArticleRecord[]>;
  getBySlug(slug: string): Promise<HelpArticleRecord | null>;
};

export function createInMemoryHelpCenter(articles: HelpArticleRecord[]): HelpCenterService {
  return {
    async search(query) {
      const q = query.trim().toLowerCase();
      if (!q) return [...articles];
      return articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.body.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.slug.toLowerCase().includes(q),
      );
    },
    async getBySlug(slug) {
      return articles.find((a) => a.slug === slug) ?? null;
    },
  };
}
