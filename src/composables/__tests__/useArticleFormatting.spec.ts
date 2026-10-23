import { describe, it, expect } from 'vitest'
import { formatDateAuthor, formatViews, getExcerpt, isArticlePinned } from '../useArticleFormatting'

describe('useArticleFormatting', () => {
  it('formats date and author correctly', () => {
    expect(formatDateAuthor('2026-07-09T17:18:00.000000Z', 'Alice')).toBe('Created on 09/07/2026 by Alice')
    expect(formatDateAuthor(null, null)).toBe('Created by BULSCA')
    expect(formatDateAuthor('2026-01-01', '')).toBe('Created on 01/01/2026 by BULSCA')
  })

  it('formats view counts appropriately', () => {
    expect(formatViews(0)).toBe('0')
    expect(formatViews(450)).toBe('450')
    expect(formatViews(1200)).toBe('1.2k')
    expect(formatViews(20000)).toBe('20k')
    expect(formatViews(1500000)).toBe('1.5M')
  })

  it('uses the London calendar day and handles invalid dates safely', () => {
    expect(formatDateAuthor('2026-06-01T23:30:00Z', 'Alex')).toBe('Created on 02/06/2026 by Alex')
    expect(formatDateAuthor('invalid', null)).toBe('Created by BULSCA')
  })

  it('generates clean plain-text excerpts without HTML tags', () => {
    const html = '<p>Hello <strong>world</strong> &amp; friends! <a href="#">Link</a></p>'
    expect(getExcerpt(html)).toBe('Hello world & friends! Link')

    const longContent = 'Word '.repeat(60)
    const excerpt = getExcerpt(longContent, undefined, 50)
    expect(excerpt.endsWith('...')).toBe(true)
    expect(excerpt.split(' ').length).toBe(50)
  })

  it('identifies pinned articles', () => {
    expect(isArticlePinned({ id: 1, title: 'Pinned', pinned: true })).toBe(true)
    expect(isArticlePinned({ id: 2, title: 'Regular', pinned: false })).toBe(false)
  })
})
