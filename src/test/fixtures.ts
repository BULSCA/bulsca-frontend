import type { Article, ArticleList } from '@/api/articles/types'

export function article(overrides: Partial<Article> = {}): Article {
  return { id: 1, slug: 'rescue-news.1', title: 'Rescue news', author: 'Alex', excerpt: 'BULSCA news', pinned: false,
    created_at: '2026-01-01T12:00:00+00:00', updated_at: '2026-01-01T12:00:00+00:00',
    views: 10, thumbs_up: 1, thumbs_down: 0, tags: [{ id: 1, name: 'Competition', slug: 'competition' }], ...overrides }
}
export function articleList(): ArticleList {
  return { data: { pinned: [], articles: [article()] }, meta: { current_page: 1, last_page: 2, per_page: 8, total: 10 }, links: { prev: null, next: '/api/v1/articles?page=2' } }
}
