import type { PublicEntry } from '@/api/public/types'
export function safeHref(value?: string): string | null {
  if (!value || [...value].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === '\\') || value.startsWith('//')) return null
  if (value.startsWith('/') || value.startsWith('#')) return value
  try { return ['https:', 'http:', 'mailto:', 'tel:'].includes(new URL(value).protocol) ? value : null } catch { return null }
}
export function entryPath(item: PublicEntry): string {
  const slug = encodeURIComponent(item.slug)
  switch (item.kind) {
    case 'clubs': return `/get-involved/clubs/${slug}`
    case 'competitions': return `/competitions/${slug}`
    case 'committees': return `/get-involved/committee/${slug}`
    case 'members': return `/get-involved/committee/${encodeURIComponent(item.parent || 'current')}/${slug}`
    case 'championships': return `/competitions/championships/${slug}`
    case 'seasons': return `/competitions/league/${slug}`
    case 'resource-pages': return `/resources/${slug}`
    case 'resources': return `/resources/view/${encodeURIComponent(String(item.id))}`
    case 'sercs': return `/resources/sercs/${slug}`
    case 'casualties': return `/resources/casualties/${slug}`
    case 'social': return safeHref(item.links?.[0]?.url) || '/latest'
  }
}
