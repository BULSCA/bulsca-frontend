import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createSiteRouter } from '@/router'
import CommitteeMemberView from '@/views/CommitteeMemberView.vue'
import * as publicApi from '@/api/public'
import { ApiFailure } from '@/api/errors'
import type { PublicDocument } from '@/api/public/types'
vi.mock('@/services/diagnostics', () => ({ reportError: vi.fn<() => void>() }))
vi.mock('@/config', () => ({
  previewMode: true,
  websiteApiBase: '/api/v1',
  competitionApiBase: '/api/v1',
  portalUrl: 'https://portal.bulsca.co.uk',
}))
let wrapper: VueWrapper
afterEach(() => {
  wrapper?.unmount()
  vi.restoreAllMocks()
})
const member: PublicDocument = {
  id: 1,
  slug: 'alex.1',
  kind: 'members',
  parent: '2026-27',
  title: 'Alex Example',
  role_label: 'Chair',
  sections: [],
  role_sections: [],
}
async function show(path = '/get-involved/committee/2026-27/alex.1') {
  const router = createSiteRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  wrapper = mount(CommitteeMemberView, { global: { plugins: [router] } })
  await flushPromises()
  return router
}
describe('committee member profiles', () => {
  it('returns a current-member profile to the current committee route', async () => {
    vi.spyOn(publicApi, 'getDocument').mockResolvedValue({ data: member })
    await show('/get-involved/committee/current/alex.1')
    expect(wrapper.get('a.action-button').attributes('href')).toBe('/get-involved/committee')
  })
  it('loads the next member when navigating within the same profile view', async () => {
    const request = vi
      .spyOn(publicApi, 'getDocument')
      .mockResolvedValueOnce({ data: member })
      .mockResolvedValueOnce({
        data: {
          ...member,
          id: 2,
          slug: 'sam.2',
          title: 'Sam Sample',
          role_label: 'Welfare Officer',
        },
      })
    const router = await show()
    await router.push('/get-involved/committee/2026-27/sam.2')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('Sam Sample')
    expect(wrapper.get('.committee-role').text()).toBe('Welfare Officer')
    expect(request.mock.calls[1]?.[2]).toEqual({ season: '2026-27', slug: 'sam.2' })
  })
  it('restores the portrait/bio layout and the full-width role section with sensible empty states', async () => {
    vi.spyOn(publicApi, 'getDocument').mockResolvedValue({ data: member })
    await show()
    expect(wrapper.get('h1').text()).toBe('Alex Example')
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.find('.committee-member-layout .committee-profile-card').exists()).toBe(true)
    expect(wrapper.get('.committee-biography').text()).toContain(
      'This member has not added a bio yet.',
    )
    expect(wrapper.get('main > .page-body > .page-section--brand').text()).toContain(
      'What is the role of Chair?',
    )
    expect(wrapper.text()).toContain('Details about this role have not been published yet.')
    expect(wrapper.get('a.action-button').attributes('href')).toBe(
      '/get-involved/committee/2026-27',
    )
  })
  it('renders structured biography and role text safely', async () => {
    vi.spyOn(publicApi, 'getDocument').mockResolvedValue({
      data: {
        ...member,
        sections: [{ heading: 'My background', paragraphs: ['<script>private()</script>'] }],
        role_sections: [
          { heading: 'Responsibilities', paragraphs: ['Support university lifesaving.'] },
        ],
      },
    })
    await show()
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.get('.committee-biography').text()).toContain('<script>private()</script>')
    expect(wrapper.get('.page-section--brand h3').text()).toBe('Responsibilities')
  })
  it('keeps the banner and committee navigation when the member API fails and can retry', async () => {
    vi.spyOn(publicApi, 'getDocument')
      .mockRejectedValueOnce(new ApiFailure('server', 'Unavailable', 500))
      .mockResolvedValueOnce({ data: member })
    await show()
    expect(wrapper.get('h1').text()).toBe('Committee member')
    expect(wrapper.get('a.action-button').attributes('href')).toContain('/2026-27')
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('Alex Example')
  })
})
