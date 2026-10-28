import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import CommitteeProfileCard from '@/components/CommitteeProfileCard.vue'
import CommitteeProfiles from '@/components/CommitteeProfiles.vue'
import PublicCards from '@/components/PublicCards.vue'
import type { PublicEntry } from '@/api/public/types'
import logo from '@/assets/blogo.png'
const member: PublicEntry = {
  id: 1,
  slug: 'alex.1',
  kind: 'members',
  title: 'Alex Example',
  parent: '2026-27',
  role_label: 'Chair',
  role_order: 0,
}
const global = { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
let wrapper: VueWrapper
afterEach(() => wrapper?.unmount())
describe('original committee profile cards', () => {
  it('links the entire portrait/name/role card to the member profile in its own season', () => {
    wrapper = mount(CommitteeProfileCard, { props: { member }, global })
    expect(wrapper.get('a').attributes('href')).toBe('/get-involved/committee/2026-27/alex.1')
    expect(wrapper.get('h3').text()).toBe('Alex Example')
    expect(wrapper.get('.committee-role').text()).toBe('Chair')
    expect(wrapper.get('.committee-portrait img').attributes('src')).toBe(logo)
    expect(wrapper.find('.card-action').exists()).toBe(false)
  })
  it('falls back from a broken portrait to the BULSCA logo, then readable initials', async () => {
    wrapper = mount(CommitteeProfileCard, {
      props: { member: { ...member, image_url: '/missing.jpg' } },
      global,
    })
    await wrapper.get('img').trigger('error')
    expect(wrapper.get('img').attributes('src')).toBe(logo)
    await wrapper.get('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('.committee-portrait').text()).toBe('AE')
    expect(wrapper.get('a').attributes('href')).toContain('2026-27')
    await wrapper.setProps({ member: { ...member, image_url: '/new.jpg' } })
    expect(wrapper.get('img').attributes('src')).toBe('/new.jpg')
  })
  it('blocks unsafe portrait URLs and supports older API data with role tags', () => {
    wrapper = mount(CommitteeProfileCard, {
      props: {
        member: {
          ...member,
          image_url: 'javascript:x',
          role_label: undefined,
          tags: ['Welfare Officer'],
        },
      },
      global,
    })
    expect(wrapper.get('img').attributes('src')).toBe(logo)
    expect(wrapper.get('.committee-role').text()).toBe('Welfare Officer')
  })
  it('uses a non-linked identity card on the member detail page', () => {
    wrapper = mount(CommitteeProfileCard, { props: { member, linked: false }, global })
    expect(wrapper.element.tagName).toBe('ARTICLE')
    expect(wrapper.find('a').exists()).toBe(false)
  })
  it('orders members by role while retaining API order for equal or missing ranks', () => {
    wrapper = mount(CommitteeProfiles, {
      props: {
        members: [
          { ...member, id: 3, title: 'Third', role_order: undefined },
          { ...member, id: 2, title: 'Second', role_order: 1 },
          member,
          { ...member, id: 4, title: 'Fourth', role_order: undefined },
        ],
      },
      global,
    })
    expect(wrapper.findAll('h3').map((heading) => heading.text())).toEqual([
      'Alex Example',
      'Second',
      'Third',
      'Fourth',
    ])
  })
  it('uses the profile gallery for member entries instead of generic record cards', () => {
    wrapper = mount(PublicCards, { props: { entries: [member] }, global })
    expect(wrapper.find('.committee-profile-card').exists()).toBe(true)
    expect(wrapper.find('.card-frame').exists()).toBe(false)
  })
})
