import type { Article } from '@/api/articles/types'

/**
 * Format date and author string: "Created on DD/MM/YYYY by BULSCA"
 */
export function formatDateAuthor(createdAt?: string | Date | null, author?: string | null): string {
  const authorName = author && String(author).trim() ? String(author).trim() : 'BULSCA'

  if (!createdAt) {
    return `Created by ${authorName}`
  }


  const date = createdAt instanceof Date ? createdAt : new Date(createdAt)
  if (!Number.isFinite(date.getTime())) return `Created by ${authorName}`
  return `Created on ${new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London' }).format(date)} by ${authorName}`
}

/**
 * Format views count: e.g. 120 -> "120", 1400 -> "1.4k", 2500000 -> "2.5M"
 */
export function formatViews(views?: number | null): string {
  if (views == null || views === undefined) return '0'
  if (views < 1000) return views.toString()
  if (views < 1_000_000) {
    return `${(views / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}

/**
 * Extract clean plain-text excerpt from HTML content or fallback excerpt.
 * Handles spacing before tags and generous word count (~80 words).
 */
export function getExcerpt(content?: string | null, excerpt?: string | null, maxWords = 80): string {
  const rawText = excerpt || content
  if (!rawText) {
    return ''
  }

  // Prepend space before opening tags to avoid concatenating words, then strip tags
  const withSpaces = rawText.replace(/</g, ' <')
  const stripped = withSpaces
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  const words = stripped.split(' ')
  if (words.length <= maxWords) {
    return stripped
  }

  return words.slice(0, maxWords).join(' ') + '...'
}

/**
 * Check if an article is pinned
 */
export function isArticlePinned(article: Article | Partial<Article> | { pinned?: boolean | number }): boolean {
  return Boolean(article.pinned)
}
