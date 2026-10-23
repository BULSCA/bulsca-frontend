import { describe, expect, it, vi } from 'vitest'
import { useApi } from '../useApi'
import { ApiFailure } from '@/api/errors'
describe('request state', () => {
  it('keeps successful data during a failed refresh', async () => {
    const request = vi.fn<(signal: AbortSignal) => Promise<string[]>>().mockResolvedValueOnce(['news']).mockRejectedValueOnce(new ApiFailure('server', 'Unavailable'))
    const state = useApi<string[], []>(request)
    expect(await state.execute()).toBe(true)
    expect(await state.execute()).toBe(false)
    expect(state.data.value).toEqual(['news'])
    expect(state.error.value?.message).toBe('Unavailable')
    expect(state.loading.value).toBe(false)
  })
  it('cancels obsolete requests and ignores late replies from transports that ignore abort', async () => {
    let first!: (value: string) => void
    const request = vi.fn<(signal: AbortSignal) => Promise<string>>().mockImplementationOnce(() => new Promise<string>(resolve => { first = resolve })).mockResolvedValueOnce('new')
    const state = useApi<string, []>(request)
    const old = state.execute()
    await state.execute()
    expect(request.mock.calls[0]![0].aborted).toBe(true)
    first('old')
    await old
    expect(state.data.value).toBe('new')
  })
  it('clears previous-entity content and blocks a reply after disposal', async () => {
    let finish!: (value: string) => void
    const state = useApi<string, []>(() => new Promise(resolve => { finish = resolve }))
    const pending = state.execute()
    state.clear()
    finish('private')
    await pending
    expect(state.data.value).toBeNull()
    expect(state.error.value).toBeNull()
    expect(state.loading.value).toBe(false)
  })
})
