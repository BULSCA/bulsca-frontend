import type { Article, ArticleList, ArticleResponse } from '@/api/articles/types'
import type { PublicDocument, PublicEntry, PublicKind } from '@/api/public/types'

const entry = (kind: PublicKind, slug: string, title: string, summary: string, extra: Partial<PublicEntry> = {}): PublicEntry => ({ id: slug, kind, slug, title, summary, ...extra })
export const clubs = [
  entry('clubs', 'example-university.1', 'Example University Lifesaving', 'A sample university club for exploring the website.', { location: 'Example City', tags: ['Student club'] }),
  entry('clubs', 'coastal-university.2', 'Coastal University Lifesaving', 'A second fictional club, with pool and first-aid training.', { location: 'Coastal City', tags: ['Student club'] }),
]
export const competitions = [
  entry('competitions', 'example-university-2026.1', 'Example University Competition', 'A sample league competition with team speed events and SERCs.', { date: '2026-11-14', location: 'Example University Pool', tags: ['League', 'Upcoming'] }),
  entry('competitions', 'coastal-university-2026.2', 'Coastal University Competition', 'A completed sample competition with published results.', { date: '2026-03-14', location: 'Coastal City Pool', tags: ['League', 'Results available'], results_link: { label: 'View results', url: '/resources/view/sample-entry-pack' } }),
]
export const seasons = ['2026-27', '2025-26'].map(slug => entry('seasons', slug, `League ${slug}`, 'Sample season with competition results and standings.'))
export const committees = ['2026-27', '2025-26'].map(slug => entry('committees', slug, `Committee ${slug}`, 'Fictional members demonstrating committee and profile pages.'))
export const members = (season: string) => [
  entry('members', 'alex-example.1', 'Alex Example', 'Sample Chair — helping coordinate university lifesaving.', { parent: season, tags: ['Chair'] }),
  entry('members', 'sam-sample.2', 'Sam Sample', 'Sample Welfare and Inclusion Officer.', { parent: season, tags: ['Welfare and Inclusion Officer'] }),
]
export const resourcePages = [
  entry('resource-pages', 'competition-documents', 'Competition documents', 'Entry packs, event guidance and results.'),
  entry('resource-pages', 'governance', 'Governance', 'Constitution, policies and committee resources.'),
  entry('resource-pages', 'training', 'Training', 'Practice scenarios and training materials.'),
]
export const resources = [
  entry('resources', 'sample-entry-pack', 'Sample entry pack', 'A small bundled preview document, not an actual competition pack.', { tags: ['Competition'] }),
  entry('resources', 'sample-safety-guide', 'Sample training guide', 'A preview-only document for testing download navigation.', { tags: ['Training'] }),
]
export const sercs = [
  entry('sercs', 'pool-rescue.1', 'Pool rescue practice', 'A fictional team scenario for exploring SERC resources.', { tags: ['Pool', 'Team'] }),
  entry('sercs', 'first-aid.2', 'First aid practice', 'A second preview scenario with supporting casualty information.', { tags: ['Dry', 'First aid'] }),
]
export const casualties = [
  entry('casualties', 'sample-casualty.1', 'Sample casualty briefing', 'A fictional casualty profile, provided for interface preview only.', { tags: ['Training'] }),
]
export const championships = ['2026', '2025', '2024', '2023'].map(year => entry('championships', year, `Championships ${year}`, 'Explore a championship year and its associated resources.'))
export const social = [entry('social', 'sample-update', 'University lifesaving community', 'This is a sample social update. Visit BULSCA’s official social pages for real news.', { links: [{ label: 'BULSCA on Instagram', url: 'https://www.instagram.com/bulsca/' }] })]

export function document(item: PublicEntry, extra: Partial<PublicDocument> = {}): PublicDocument {
  return { ...item, sections: [{ heading: 'About this sample', paragraphs: [item.summary || '', 'All people, clubs and results on this preview are sample data.'] }], ...extra }
}
export const sampleArticle: Article = {
  id: 1, slug: 'welcome-to-the-preview.1', title: 'Welcome to the public site preview', author: 'BULSCA preview',
  excerpt: 'Explore the news pages and the rest of the website using clearly labelled sample data.', pinned: true,
  created_at: '2026-10-01T12:00:00+00:00', updated_at: '2026-10-01T12:00:00+00:00', views: 0, thumbs_up: 0, thumbs_down: 0,
  tags: [{ id: 1, name: 'Preview', slug: 'preview' }],
}
export function previewArticles(page: number, tag: string): ArticleList {
  const matches = !tag || tag === 'preview'
  return { data: { pinned: matches ? [sampleArticle] : [], articles: matches && page === 1 ? [{ ...sampleArticle, id: 2, slug: 'sample-competition-news.2', title: 'Sample competition news', pinned: false }] : [] },
    meta: { current_page: page, last_page: 1, per_page: 8, total: matches ? 1 : 0 }, links: { prev: null, next: null } }
}
export function previewArticle(slug: string): ArticleResponse | null {
  const parts = slug.split('.')
  const id = Number(parts[parts.length - 1])
  if (![1, 2].includes(id)) return null
  return { data: { ...sampleArticle, id, slug: id === 1 ? sampleArticle.slug : 'sample-competition-news.2',
    title: id === 1 ? sampleArticle.title : 'Sample competition news',
    content: '<p>This article is sample content for browsing the new website. No real event or announcement is represented.</p><p>You can explore clubs, competitions, resources and welfare using the navigation.</p>' } }
}
