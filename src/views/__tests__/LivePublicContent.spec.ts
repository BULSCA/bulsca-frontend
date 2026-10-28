import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import PublicBrowseView from '@/views/PublicBrowseView.vue'
import { getCollection, getDocument } from '@/api/public'
import { isDocumentResponse } from '@/api/public/validation'
vi.mock('@/api/public', () => ({ getCollection: vi.fn<typeof import('@/api/public').getCollection>(), getDocument: vi.fn<typeof import('@/api/public').getDocument>() }))
let wrapper: VueWrapper
afterEach(() => { wrapper?.unmount(); vi.resetAllMocks() })
const detail = { id: 1, slug: '2026-27', title: 'League', kind: 'seasons' as const, sections: [] }
async function screen(path: string, browse: string) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: PublicBrowseView, meta: { browse } }] })
  await router.push(path); await router.isReady()
  wrapper = mount(PublicBrowseView, { global: { plugins: [router], stubs: { PageBanner: true } } }); await flushPromises()
  return router
}
describe('real public content shapes', () => {
  it('renders both league tables and validates table dimensions', async () => {
    const table = { caption: 'A League', columns: ['Team', 'Points'], rows: [['Test University', 10]] }
    vi.mocked(getDocument).mockResolvedValue({ data: { ...detail, tables: [table, { ...table, caption: 'B League' }] } })
    await screen('/competitions/league', 'league')
    expect(wrapper.findAll('table')).toHaveLength(2)
    expect(wrapper.text()).toContain('Test University')
    expect(isDocumentResponse({ data: { ...detail, tables: [{ ...table, rows: [['Only one cell']] }] } })).toBe(false)
  })
  it('renders server-sanitized rich content and rejects malformed blocks', async () => {
    vi.mocked(getDocument).mockResolvedValue({ data: { ...detail, kind: 'clubs', sections: [{ heading: 'Training', paragraphs: [], html: '<p><strong>Weekly</strong> training</p>' }] } })
    await screen('/get-involved/clubs/test.1', 'club')
    expect(wrapper.get('.article-copy strong').text()).toBe('Weekly')
    expect(isDocumentResponse({ data: { ...detail, sections: [{ heading: '', paragraphs: [], html: 123 }] } })).toBe(false)
  })
  it('keeps advanced SERC filters in shareable query parameters', async () => {
    vi.mocked(getCollection).mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1, total: 0 }, filters: { years: [2026], locations: ['Pool'] } })
    const router = await screen('/resources/sercs', 'sercs')
    await wrapper.get('select[name=year]').setValue('2026')
    await wrapper.get('select[name=location]').setValue('Pool')
    await wrapper.get('input[name=cas_min]').setValue('2')
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(router.currentRoute.value.query).toMatchObject({ year: '2026', location: 'Pool', cas_min: '2' })
    expect(getCollection).toHaveBeenLastCalledWith('sercs', expect.any(AbortSignal), expect.objectContaining({ year: '2026', location: 'Pool', cas_min: '2' }))
  })
  it('offers casualty groups and identifies cached social results', async () => {
    vi.mocked(getCollection).mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1, total: 0 }, stale: true, filters: { groups: [{ id: 1, name: 'First aid' }] } })
    await screen('/resources/casualties', 'casualties')
    expect(wrapper.get('select[name=group]').text()).toContain('First aid')
    expect(wrapper.text()).toContain('Showing previously published updates')
  })
})
