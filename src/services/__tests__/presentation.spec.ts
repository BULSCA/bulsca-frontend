import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPresentationStore } from '@/services/presentation'
import { bundledImages, fallbackPresentation } from '@/content/presentation'
import type { PresentationConfig } from '@/api/presentation'

const remote: PresentationConfig = {
  version: 'remote-1',
  banner_pool: [
    { id: 'a', url: 'https://cdn.example.test/a.jpg', alt: 'A' },
    { id: 'b', url: 'https://cdn.example.test/b.jpg', alt: 'B' },
  ],
  banner_overrides: { '/welfare': 'b' },
  campaigns: [],
}
const storage = () => window.sessionStorage
const options = () => ({
  storage,
  mode: () => 'test',
  random: () => 0,
  load: vi.fn<() => Promise<PresentationConfig>>(async () => remote),
})
beforeEach(() => sessionStorage.clear())
describe('session banner selection and configuration', () => {
  it('deduplicates the presentation read and remembers choices across navigation and refresh', async () => {
    const opts = { ...options(), random: vi.fn<() => number>(() => 0.9) }
    const store = createPresentationStore(opts)
    await Promise.all([store.ensure(), store.ensure()])
    const selected = store.choose('/about?q=one#top')
    expect(store.choose('/about/?q=two')).toEqual(selected)
    store.choose('/resources')
    expect(store.choose('/about')).toEqual(selected)
    expect(opts.load).toHaveBeenCalledTimes(1)
    expect(opts.random).toHaveBeenCalledTimes(2)
    const refreshed = createPresentationStore({ ...opts, random: () => 0 })
    expect(refreshed.choose('/about')).toEqual(selected)
  })
  it('uses fixed page overrides ahead of random selection', async () => {
    const store = createPresentationStore(options())
    await store.ensure()
    expect(store.choose('/welfare')).toEqual(remote.banner_pool[1])
    expect(store.choose('/about')).toEqual(remote.banner_pool[0])
  })
  it('renders cached configuration immediately and retains it if the refresh fails', async () => {
    const first = createPresentationStore(options())
    await first.ensure()
    const next = createPresentationStore({
      ...options(),
      load: async () => {
        throw new Error('Offline')
      },
    })
    expect(next.choose('/about')).toEqual(remote.banner_pool[0])
    await next.ensure()
    expect(next.config.value).toEqual(remote)
  })
  it('reuses choices still in a new pool and replaces removed images', async () => {
    const first = createPresentationStore(options())
    await first.ensure()
    first.choose('/about')
    const updated = createPresentationStore({
      ...options(),
      load: async () => ({ ...remote, version: '2', banner_pool: [remote.banner_pool[0]!] }),
    })
    await updated.ensure()
    expect(updated.choose('/about')?.id).toBe('a')
    const removed = createPresentationStore({
      ...options(),
      load: async () => ({ ...remote, banner_pool: [remote.banner_pool[1]!] }),
    })
    await removed.ensure()
    expect(removed.choose('/about')?.id).toBe('b')
  })
  it('isolates preview choices and ignores stale requests when mode changes', async () => {
    let mode = 'live'
    let resolve!: (value: PresentationConfig) => void
    const load = vi
      .fn<() => Promise<PresentationConfig>>()
      .mockImplementationOnce(
        () =>
          new Promise<PresentationConfig>((done) => {
            resolve = done
          }),
      )
      .mockResolvedValue(fallbackPresentation)
    const store = createPresentationStore({ ...options(), mode: () => mode, load })
    const pending = store.ensure()
    await Promise.resolve()
    mode = 'preview'
    await store.ensure()
    const previewImage = store.choose('/about')
    resolve(remote)
    await pending
    expect(store.config.value).toEqual(fallbackPresentation)
    expect(store.choose('/about')).toEqual(previewImage)
    expect(sessionStorage.getItem('bulsca:presentation:v1:live:config')).toBeNull()
  })
  it('uses in-memory choices when storage is blocked', async () => {
    const store = createPresentationStore({
      ...options(),
      storage: () => {
        throw new Error('Blocked')
      },
    })
    const first = store.choose('/about')
    expect(store.choose('/about')).toEqual(first)
    await store.ensure()
    expect(store.choose('/welfare')?.id).toBe('b')
  })
  it('recovers from corrupt cache and rejects malformed configuration', async () => {
    sessionStorage.setItem('bulsca:presentation:v1:test:config', '{bad-json')
    sessionStorage.setItem(
      'bulsca:presentation:v1:test:choices',
      '{"/about":{"id":"x","url":"javascript:x","alt":"bad"}}',
    )
    const store = createPresentationStore({
      ...options(),
      load: async () => null as unknown as PresentationConfig,
    })
    expect(store.choose('/about')).toEqual(bundledImages[0])
    await store.ensure()
    expect(store.config.value).toEqual(fallbackPresentation)
  })
  it('replaces broken remote images with bundled photos and eventually a solid background', async () => {
    const store = createPresentationStore(options())
    await store.ensure()
    let image = store.choose('/welfare')
    const failed = new Set<string>()
    while (image) {
      expect(failed.has(image.url)).toBe(false)
      failed.add(image.url)
      image = store.imageFailed('/welfare', image)
    }
    expect(failed.size).toBe(remote.banner_pool.length + bundledImages.length)
    expect(store.choose('/welfare')).toBeNull()
    expect(createPresentationStore(options()).choose('/about')).toBeNull()
  })
})
