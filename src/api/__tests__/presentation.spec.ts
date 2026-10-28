import { describe, expect, it } from 'vitest'
import { parsePresentation, publicImageUrl, type CampaignSlide } from '@/api/presentation'

const image = { id: 'pool', url: 'https://images.example.test/pool-v1.jpg', alt: 'Pool team' }
const campaign: CampaignSlide = {
  id: 'volunteers',
  title: 'Volunteer',
  image_url: '/photos/team.jpg',
  order: 1,
  link: { label: 'Join us', url: '/get-involved' },
}
const data = {
  version: '1',
  banner_pool: [image],
  banner_overrides: { '/welfare': 'pool' },
  campaigns: [campaign],
}
describe('presentation response validation', () => {
  it('accepts the public image pool, fixed overrides and campaigns', () => {
    expect(parsePresentation({ data })).toEqual(data)
  })
  it.each([
    null,
    {},
    { data: null },
    { data: { ...data, campaigns: {} } },
    { data: { ...data, banner_overrides: [] } },
  ])('rejects a malformed envelope: %j', (value) => {
    expect(parsePresentation(value)).toBeNull()
  })
  it('discards unsafe and duplicate images while keeping valid content', () => {
    const result = parsePresentation({
      data: {
        ...data,
        banner_pool: [
          image,
          image,
          { ...image, id: 'unsafe', url: 'javascript:alert(1)' },
          { ...image, id: '../bad' },
        ],
      },
    })!
    expect(result.banner_pool).toEqual([image])
  })
  it('discards unknown and noncanonical page overrides', () => {
    const result = parsePresentation({
      data: {
        ...data,
        banner_overrides: {
          '/welfare': 'pool',
          '/unknown': 'missing',
          '//evil.test': 'pool',
          '/about?q=1': 'pool',
          '/about#top': 'pool',
        },
      },
    })!
    expect(result.banner_overrides).toEqual({ '/welfare': 'pool' })
  })
  it('omits malformed campaigns without rejecting the complete config', () => {
    const invalid = [
      { ...campaign, id: 'empty-title', title: ' ' },
      { ...campaign, id: 'bad-order', order: 'first' },
      { ...campaign, id: 'image', image_url: 'data:image/png;base64,x' },
      { ...campaign, id: 'bad-link', link: { label: 'Click', url: 'javascript:alert(1)' } },
      { ...campaign, id: 'bad-type', link: { label: 'Click', url: {} } },
      { ...campaign, id: 'schedule', starts_at: 'bad' },
      {
        ...campaign,
        id: 'backwards',
        starts_at: '2026-10-01T00:00:00Z',
        ends_at: '2026-09-01T00:00:00Z',
      },
    ]
    expect(
      parsePresentation({ data: { ...data, campaigns: [campaign, campaign, ...invalid] } })!
        .campaigns,
    ).toEqual([campaign])
  })
  it('allows public HTTP and root-relative images only', () => {
    for (const url of [
      '/photos/team.jpg',
      'https://cdn.example.test/pool-v2.jpg',
      'http://localhost/pool.jpg',
    ])
      expect(publicImageUrl(url)).toBe(true)
    for (const url of [
      '//evil.test/x',
      '/\\evil.test',
      'javascript:x',
      'data:image/png,x',
      'mailto:a@example.test',
      '#image',
      'https://example.test/a\nb',
    ])
      expect(publicImageUrl(url)).toBe(false)
  })
})
