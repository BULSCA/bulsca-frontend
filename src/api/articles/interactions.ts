import apiClient from '../client'
import { ApiFailure, normalizeFailure } from '../errors'
import { reportError } from '@/services/diagnostics'
import { previewMode } from '@/config'

export interface ArticleCounters { views: number; thumbs_up: number; thumbs_down: number }
export function isCounters(value: unknown): value is { data: ArticleCounters } {
  if (!value || typeof value !== 'object' || !('data' in value) || !value.data || typeof value.data !== 'object') return false
  const data = value.data as Record<string, unknown>
  return ['views', 'thumbs_up', 'thumbs_down'].every(key => Number.isSafeInteger(data[key]) && Number(data[key]) >= 0)
}
const previewCounters = new Map<string, ArticleCounters>()
async function submit(slug: string, action: 'views' | 'ratings', eventId: string, signal: AbortSignal, type?: 'up' | 'down'): Promise<ArticleCounters> {
  signal.throwIfAborted()
  if (previewMode) {
    const counts = previewCounters.get(slug) || { views: 0, thumbs_up: 0, thumbs_down: 0 }
    const field = action === 'views' ? 'views' : type === 'up' ? 'thumbs_up' : 'thumbs_down'
    const updated = { ...counts, [field]: counts[field] + 1 }
    previewCounters.set(slug, updated)
    return updated
  }
  try {
    // Writes deliberately bypass the read retry helper.
    const response = await apiClient.post<unknown>(`/articles/${encodeURIComponent(slug)}/${action}`, { event_id: eventId, ...(type ? { type } : {}) }, { signal })
    if (!isCounters(response.data)) throw new ApiFailure('invalid_response', 'We could not confirm this update. Refresh the totals before trying again.')
    return response.data.data
  } catch (error) {
    if (signal.aborted) throw new DOMException('Request cancelled', 'AbortError')
    const failure = normalizeFailure(error)
    if (failure.kind === 'network' || failure.kind === 'server' || failure.kind === 'invalid_response') reportError(failure.kind, '/article/:slug', failure.status, failure.requestId)
    throw failure
  }
}
export const recordView = (slug: string, eventId: string, signal: AbortSignal) => submit(slug, 'views', eventId, signal)
export const rateArticle = (slug: string, type: 'up' | 'down', eventId: string, signal: AbortSignal) => submit(slug, 'ratings', eventId, signal, type)
