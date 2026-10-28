import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import ChampionshipBand from '@/components/ChampionshipBand.vue'
import { previewPresentation } from '@/content/presentation'
const campaign = previewPresentation.championship_campaign!
const global = { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
let wrapper: VueWrapper
afterEach(() => wrapper?.unmount())
describe('full-width championship campaign', () => {
  it('shows the complete announcement without requiring a logo', () => {
    wrapper = mount(ChampionshipBand, { props: { campaign }, global })
    expect(wrapper.get('h2').text()).toBe('Champs 2027')
    expect(wrapper.text()).toContain('6th–7th March')
    expect(wrapper.text()).toContain('@ Alan Higgs Centre, Coventry')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('a').attributes('href')).toBe('/competitions/championships')
    expect(wrapper.attributes('style')).toContain('--campaign-primary: #070660')
    expect(wrapper.attributes('style')).toContain('--campaign-secondary: #9e0d06')
  })
  it('keeps exactly one campaign heading with a logo and when the logo fails', async () => {
    wrapper = mount(ChampionshipBand, {
      props: { campaign: { ...campaign, logo_url: '/champs.png' } },
      global,
    })
    expect(wrapper.findAll('h2')).toHaveLength(1)
    await wrapper.get('img').trigger('error')
    expect(wrapper.findAll('h2')).toHaveLength(1)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Champs 2027')
    await wrapper.setProps({ campaign: { ...campaign, logo_url: '/new-logo.png' } })
    expect(wrapper.get('img').attributes('src')).toBe('/new-logo.png')
  })
  it('supports a published announcement before a CTA is available', () => {
    wrapper = mount(ChampionshipBand, {
      props: { campaign: { ...campaign, link: undefined } },
      global,
    })
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toContain('6th–7th March')
  })
})
