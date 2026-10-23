import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import apiClient, { read } from '../client'
import { normalizeFailure } from '../errors'
import { reportError } from '@/services/diagnostics'
vi.mock('@/services/diagnostics', () => ({ reportError: vi.fn<() => void>() }))
const valid = (value: unknown): value is string => typeof value === 'string'
const signal = () => new AbortController().signal

function failed(status: number) {
  return new AxiosError('secret backend message', 'ERR_BAD_RESPONSE', undefined, undefined, {
    data: { message: 'password=private' }, status, statusText: 'Failure', headers: new AxiosHeaders({ 'retry-after': '30' }),
    config: { headers: new AxiosHeaders() },
  })
}
describe('resilient API reads', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks() })
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

  it('uses same-origin versioned API requests without an embedded key', () => {
    expect(apiClient.defaults.baseURL).toBe('/api/v1')
    expect(apiClient.defaults.headers).not.toHaveProperty('X-API-KEY')
  })
  it('retries network errors twice and reports only the final failure', async () => {
    const get = vi.spyOn(apiClient, 'get').mockRejectedValue(new AxiosError('offline', 'ERR_NETWORK'))
    const promise = read('/articles', valid, signal(), '/latest')
    const result = promise.catch((error: unknown) => error)
    await vi.runAllTimersAsync()
    expect(await result).toMatchObject({ kind: 'network' })
    expect(get).toHaveBeenCalledTimes(3)
    expect(reportError).toHaveBeenCalledTimes(1)
  })
  it('recovers from a transient 503', async () => {
    const get = vi.spyOn(apiClient, 'get').mockRejectedValueOnce(failed(503)).mockResolvedValueOnce({ data: 'ready' })
    const promise = read('/articles', valid, signal(), '/latest')
    await vi.runAllTimersAsync()
    expect(await promise).toBe('ready')
    expect(get).toHaveBeenCalledTimes(2)
    expect(reportError).not.toHaveBeenCalled()
  })
  it('does not retry validation, missing records, forbidden or rate-limited reads', async () => {
    const get = vi.spyOn(apiClient, 'get')
    for (const status of [401, 403, 404, 419, 422, 429]) {
      get.mockRejectedValueOnce(failed(status))
      await expect(read('/articles', valid, signal(), '/latest')).rejects.toMatchObject({ status })
    }
    expect(get).toHaveBeenCalledTimes(6)
    expect(reportError).not.toHaveBeenCalled()
    expect(normalizeFailure(failed(429)).retryAfter).toBe(30)
  })
  it('rejects malformed success responses and never renders backend exception text', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { broken: true } })
    await expect(read('/articles', valid, signal(), '/latest')).rejects.toMatchObject({ kind: 'invalid_response' })
    expect(normalizeFailure(failed(500)).message).not.toContain('private')
    expect(normalizeFailure(failed(500)).message).not.toContain('secret')
  })
  it('cancels backoff without sending another request', async () => {
    const controller = new AbortController()
    const get = vi.spyOn(apiClient, 'get').mockRejectedValue(new AxiosError('offline', 'ERR_NETWORK'))
    const promise = read('/articles', valid, controller.signal, '/latest')
    const result = promise.catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(0)
    controller.abort()
    expect(await result).toMatchObject({ name: 'AbortError' })
    expect(get).toHaveBeenCalledTimes(1)
    expect(reportError).not.toHaveBeenCalled()
  })
  it('never automatically replays writes', async () => {
    const post = vi.spyOn(apiClient, 'post').mockRejectedValue(failed(503))
    await expect(apiClient.post('/anything', {})).rejects.toBeInstanceOf(AxiosError)
    await vi.runAllTimersAsync()
    expect(post).toHaveBeenCalledTimes(1)
  })
})
