import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import CardFrame from '@/components/CardFrame.vue'
import NavigationTile from '@/components/NavigationTile.vue'
import PublicCards from '@/components/PublicCards.vue'
import PageSection from '@/components/PageSection.vue'
const global = { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
let wrapper: VueWrapper | undefined
afterEach(() => wrapper?.unmount())
describe('shared public layout components', () => {
  it('keeps record content and a distinct footer action in the card frame', () => {
    wrapper = mount(CardFrame, {
      slots: {
        default: '<h3>A club</h3><p>Training information</p>',
        footer: '<a href="/club">View club</a>',
      },
    })
    expect(wrapper.get('.card-frame-body h3').text()).toBe('A club')
    expect(wrapper.get('.card-frame-footer a').attributes('href')).toBe('/club')
  })
  it('does not render empty action areas', () => {
    wrapper = mount(CardFrame, { slots: { default: 'Information' } })
    expect(wrapper.find('footer').exists()).toBe(false)
  })
  it('keeps a navigation tile usable after its photo fails and resets for a replacement image', async () => {
    wrapper = mount(NavigationTile, {
      props: { title: 'League', to: '/competitions/league', image: '/missing.jpg' },
      global,
    })
    await wrapper.get('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('a').attributes('href')).toBe('/competitions/league')
    expect(wrapper.text()).toBe('League')
    await wrapper.setProps({ image: '/replacement.jpg' })
    expect(wrapper.get('img').attributes('src')).toBe('/replacement.jpg')
  })
  it('blocks unsafe navigation and image URLs', () => {
    wrapper = mount(NavigationTile, {
      props: { title: 'Unsafe', to: 'javascript:alert(1)', image: 'data:image/png,x' },
      global,
    })
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('link unavailable')
  })
  it('labels a section with its heading and keeps content inside the shared container', () => {
    wrapper = mount(PageSection, {
      props: { title: 'About', tone: 'brand' },
      slots: { default: '<p>Content</p>' },
    })
    expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.get('h2').attributes('id'))
    expect(wrapper.get('.content-container p').text()).toBe('Content')
  })
  it('retains record metadata and actions for non-competition directories', () => {
    wrapper = mount(PublicCards, {
      props: {
        entries: [
          {
            id: 1,
            slug: 'university.1',
            title: 'University Club',
            kind: 'clubs',
            summary: 'Training sessions',
            location: 'City',
            tags: ['Student club'],
          },
        ],
      },
      global,
    })
    expect(wrapper.get('.card-frame-body').text()).toContain('Training sessions')
    expect(wrapper.text()).toContain('Student club')
    expect(wrapper.get('.card-action').attributes('href')).toBe('/get-involved/clubs/university.1')
    expect(wrapper.find('.competition-status').exists()).toBe(false)
  })
})
