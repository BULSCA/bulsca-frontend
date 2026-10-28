import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import CompetitionCard from '@/components/CompetitionCard.vue'
import type { PublicEntry } from '@/api/public/types'
const entry: PublicEntry = {
  id: 1,
  kind: 'competitions',
  slug: 'university.1',
  title: 'University Competition',
  date: '2026-07-02',
  summary: 'SERCs and speeds',
  location: 'University Pool',
}
const global = { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
let wrapper: VueWrapper
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-01T12:00:00Z'))
})
afterEach(() => {
  wrapper?.unmount()
  vi.useRealTimers()
})
function show(overrides: Partial<PublicEntry> = {}) {
  wrapper = mount(CompetitionCard, { props: { entry: { ...entry, ...overrides } }, global })
  return wrapper
}
describe('competition tiles', () => {
  it('renders the date, description, status and full-width detail action', () => {
    show()
    expect(wrapper.get('h3').text()).toBe(entry.title)
    expect(wrapper.get('time').text()).toBe('2 July 2026')
    expect(wrapper.text()).toContain('1 day to go')
    expect(wrapper.text()).toContain('University Pool')
    expect(wrapper.get('.card-frame-footer a').attributes('href')).toBe(
      '/competitions/university.1',
    )
  })
  it.each([
    ['2026-07-01', 'Today'],
    ['2026-06-30', 'Results not available'],
    ['invalid', 'Date to be announced'],
    ['2026-02-30', 'Date to be announced'],
    [undefined, 'Date to be announced'],
  ])('handles date %s with status %s', (date, status) => {
    show({ date })
    expect(wrapper.get('.competition-status').text()).toBe(status)
  })
  it('uses an explicitly supplied published results link', () => {
    show({ results_link: { label: 'View results', url: 'https://results.example.test/event' } })
    expect(wrapper.get('.competition-status a').attributes('href')).toBe(
      'https://results.example.test/event',
    )
    expect(wrapper.text()).not.toContain('1 day to go')
  })
  it('does not infer results from tags and rejects unsafe result links', () => {
    show({
      date: '2026-06-30',
      tags: ['Results available'],
      results_link: { label: 'Results', url: 'javascript:x' },
    })
    expect(wrapper.find('.competition-status a').exists()).toBe(false)
    expect(wrapper.text()).toContain('Results not available')
  })
  it('uses London midnight and updates if a visitor leaves the page open', async () => {
    vi.setSystemTime(new Date('2026-07-01T22:59:00Z'))
    show()
    expect(wrapper.text()).toContain('1 day to go')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(wrapper.get('.competition-status').text()).toBe('Today')
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
