import { describe, expect, it } from 'vitest'
import { buildHeroSlides } from '@/services/carousel'
import type { CampaignSlide } from '@/api/presentation'
import type { PublicEntry } from '@/api/public/types'
const campaign: CampaignSlide = {
  id: 'active',
  title: 'Volunteer',
  image_url: '/team.jpg',
  order: 1,
}
const competition = (id: number, date: string): PublicEntry => ({
  id,
  slug: `event.${id}`,
  title: `Event ${id}`,
  kind: 'competitions',
  date,
})
describe('home slide composition', () => {
  it('puts the nearest upcoming competition before ordered active campaigns and brand slides', () => {
    const now = new Date('2026-06-10T12:00:00Z')
    const campaigns = [
      campaign,
      { ...campaign, id: 'first', order: 0 },
      { ...campaign, id: 'future', starts_at: '2026-06-11T00:00:00Z' },
      { ...campaign, id: 'expired', ends_at: now.toISOString() },
    ]
    const slides = buildHeroSlides(
      campaigns,
      [competition(2, '2026-06-20'), competition(1, '2026-06-10'), competition(0, '2026-06-09')],
      now,
    )
    expect(slides.map((slide) => slide.id)).toEqual([
      'competition:1',
      'campaign:first',
      'campaign:active',
      'brand-swimmer',
      'brand-clubs',
    ])
    expect(slides[0]!.description).toContain('Today')
    expect(slides[0]!.link?.url).toBe('/competitions/event.1')
    expect(slides[0]!.image).toBeTruthy()
  })
  it('keeps current events throughout the London calendar day', () => {
    const slides = buildHeroSlides(
      [],
      [competition(1, '2026-07-01'), competition(2, 'invalid')],
      new Date('2026-07-01T22:59:00Z'),
    )
    expect(slides[0]!.id).toBe('competition:1')
    expect(
      buildHeroSlides([], [competition(1, '2026-07-01')], new Date('2026-07-01T23:01:00Z'))[0]!.id,
    ).toBe('brand-swimmer')
  })
  it('includes campaigns at their start and excludes them at their end', () => {
    const scheduled = {
      ...campaign,
      starts_at: '2026-06-10T12:00:00Z',
      ends_at: '2026-06-10T13:00:00Z',
    }
    expect(buildHeroSlides([scheduled], [], new Date(scheduled.starts_at))[0]!.type).toBe(
      'campaign',
    )
    expect(buildHeroSlides([scheduled], [], new Date(scheduled.ends_at))[0]!.type).toBe('brand')
  })
  it.each([
    [6, false],
    [7, true],
    [11, true],
    [12, false],
  ])('shows freshers in month %s: %s', (month, expected) => {
    expect(
      buildHeroSlides([], [], new Date(`2026-${String(month).padStart(2, '0')}-01T12:00:00Z`)).some(
        (slide) => slide.id === 'freshers',
      ),
    ).toBe(expected)
  })
  it('always includes usable brand slides if all dynamic content is absent', () => {
    const slides = buildHeroSlides([], [], new Date('2026-01-01T00:00:00Z'))
    expect(slides.map((slide) => slide.type)).toEqual(['brand', 'brand'])
    expect(slides.every((slide) => slide.image && slide.link?.url.startsWith('/'))).toBe(true)
  })
})
