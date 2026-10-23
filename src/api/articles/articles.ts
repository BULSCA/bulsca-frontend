import { read } from '../client'
import type { Article, ArticleList, ArticleResponse } from './types'

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object'
export function isArticle(value: unknown): value is Article {
  return object(value) && Number.isInteger(value.id) && typeof value.slug === 'string'
    && typeof value.title === 'string' && (value.author === null || typeof value.author === 'string')
    && typeof value.excerpt === 'string' && typeof value.pinned === 'boolean'
    && (value.created_at === null || typeof value.created_at === 'string')
    && (value.updated_at === null || typeof value.updated_at === 'string')
    && ['views', 'thumbs_up', 'thumbs_down'].every(key => typeof value[key] === 'number' && Number.isFinite(value[key]))
    && Array.isArray(value.tags) && value.tags.every(tag => object(tag) && Number.isInteger(tag.id) && typeof tag.name === 'string' && typeof tag.slug === 'string')
}
export function isArticleList(value: unknown): value is ArticleList {
  if (!object(value) || !object(value.data) || !object(value.meta) || !object(value.links)) return false
  const meta = value.meta
  const links = value.links
  return Array.isArray(value.data.pinned) && value.data.pinned.every(isArticle)
    && Array.isArray(value.data.articles) && value.data.articles.every(isArticle)
    && ['current_page', 'last_page', 'per_page'].every(key => Number.isInteger(meta[key]) && Number(meta[key]) >= 1)
    && Number.isInteger(meta.total) && Number(meta.total) >= 0
    && ['prev', 'next'].every(key => links[key] === null || typeof links[key] === 'string')
}
export function isArticleResponse(value: unknown): value is ArticleResponse {
  if (!object(value) || !object(value.data)) return false
  const content = value.data.content
  return isArticle(value.data) && typeof content === 'string'
}
export function getArticles(signal: AbortSignal, page = 1, tag = ''): Promise<ArticleList> {
  const params = new URLSearchParams({ page: String(page) })
  if (tag) params.set('tag', tag)
  return read(`/articles?${params}`, isArticleList, signal, '/latest')
}
export function getArticleBySlug(signal: AbortSignal, slug: string): Promise<ArticleResponse> {
  return read(`/articles/${encodeURIComponent(slug)}`, isArticleResponse, signal, '/article/:slug')
}
