import { afterEach, describe, expect, it, vi } from 'vitest'
import apiClient from '@/api/client'
import { isCounters, recordView, rateArticle } from '@/api/articles/interactions'
vi.mock('@/api/client', () => ({ default: { post: vi.fn<typeof import('@/api/client').default.post>() } }))
vi.mock('@/config', () => ({ previewMode: false }))
vi.mock('@/services/diagnostics', () => ({ reportError: vi.fn<typeof import('@/services/diagnostics').reportError>() }))
afterEach(() => vi.resetAllMocks())
describe('article write consumers', () => {
  it('sends a stable event ID and validates the returned totals', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { views: 1, thumbs_up: 2, thumbs_down: 0 } } })
    const signal = new AbortController().signal
    await rateArticle('news.1', 'up', 'event-id', signal)
    expect(apiClient.post).toHaveBeenCalledWith('/articles/news.1/ratings', { event_id: 'event-id', type: 'up' }, { signal })
  })
  it('never automatically retries failed or malformed writes', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('network'))
    await expect(recordView('news.1', 'event-id', new AbortController().signal)).rejects.toBeDefined()
    expect(apiClient.post).toHaveBeenCalledOnce()
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { views: -1 } } })
    await expect(recordView('news.1', 'event-id', new AbortController().signal)).rejects.toMatchObject({ kind: 'invalid_response' })
    expect(apiClient.post).toHaveBeenCalledTimes(2)
  })
  it('rejects non-integer, negative and incomplete counters', () => {
    expect(isCounters({ data: { views: 1.2, thumbs_up: 0, thumbs_down: 0 } })).toBe(false)
    expect(isCounters({ data: { views: 1, thumbs_up: -1, thumbs_down: 0 } })).toBe(false)
    expect(isCounters({ data: { views: 1, thumbs_up: 1, thumbs_down: 0 } })).toBe(true)
  })
})
