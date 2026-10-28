import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import PageBanner from '@/components/PageBanner.vue'
import { createPresentationStore } from '@/services/presentation'
import { fallbackPresentation, bundledImages } from '@/content/presentation'
import type { PresentationConfig } from '@/api/presentation'
const state = vi.hoisted(() => ({
  store: undefined as
    | ReturnType<typeof import('@/services/presentation').createPresentationStore>
    | undefined,
}))
vi.mock('@/services/presentation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/presentation')>()
  return {
    ...actual,
    presentation: {
      choose: (path: string) => state.store!.choose(path),
      ensure: () => state.store!.ensure(),
      imageFailed: (path: string, image: import('@/api/presentation').PresentationImage) =>
        state.store!.imageFailed(path, image),
    },
  }
})
let wrapper: VueWrapper | undefined
beforeEach(() => sessionStorage.clear())
afterEach(() => wrapper?.unmount())
async function show(path = '/about') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  await router.push(path)
  wrapper = mount(PageBanner, { props: { title: 'About BULSCA' }, global: { plugins: [router] } })
  return { router, banner: wrapper }
}
describe('page photo banners', () => {
  it('keeps the visible photo through a background refresh and query changes, then uses new config on navigation', async () => {
    let resolve!: (value: PresentationConfig) => void
    state.store = createPresentationStore({
      mode: () => 'test',
      random: () => 0,
      load: () =>
        new Promise((done) => {
          resolve = done
        }),
    })
    const { router, banner } = await show()
    await flushPromises()
    const initial = banner.get('.hero-photo').attributes('src')
    const remote = { id: 'remote', url: 'https://cdn.example.test/team.jpg', alt: 'Team' }
    resolve({
      ...fallbackPresentation,
      banner_pool: [remote],
      banner_overrides: { '/welfare': 'remote' },
    })
    await flushPromises()
    expect(banner.get('.hero-photo').attributes('src')).toBe(initial)
    await router.push('/about?q=one#top')
    expect(banner.get('.hero-photo').attributes('src')).toBe(initial)
    await router.push('/welfare')
    expect(banner.get('.hero-photo').attributes('src')).toBe(remote.url)
    await router.push('/about')
    expect(banner.get('.hero-photo').attributes('src')).toBe(remote.url)
    expect(banner.findAll('h1')).toHaveLength(1)
  })
  it('retains the selected image through a page reload and renders updated headings', async () => {
    const opts = { mode: () => 'test', random: () => 0.9, load: async () => fallbackPresentation }
    state.store = createPresentationStore(opts)
    const first = await show()
    const src = first.banner.get('.hero-photo').attributes('src')
    first.banner.unmount()
    state.store = createPresentationStore({ ...opts, random: () => 0 })
    const { banner } = await show()
    await banner.setProps({ title: 'Updated title', subtitle: 'Updated subtitle' })
    expect(banner.get('.hero-photo').attributes('src')).toBe(src)
    expect(banner.get('h1').text()).toBe('Updated title')
    expect(banner.text()).toContain('Updated subtitle')
  })
  it('retains readable headings and a solid background after every photo fails', async () => {
    state.store = createPresentationStore({
      mode: () => 'test',
      random: () => 0,
      load: async () => {
        throw new Error('Unavailable')
      },
    })
    const { banner } = await show()
    for (const _image of bundledImages) await banner.get('.hero-photo').trigger('error')
    await flushPromises()
    expect(banner.find('.hero-photo').exists()).toBe(false)
    expect(banner.get('h1').text()).toBe('About BULSCA')
  })
})
