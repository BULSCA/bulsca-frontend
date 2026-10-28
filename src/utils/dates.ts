/** Calendar operations use London dates; UTC arithmetic avoids daylight-saving day lengths. */
export function londonDay(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const field = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return `${field('year')}-${field('month')}-${field('day')}`
}
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export function eventDay(value?: string): string | null {
  if (!value) return null
  if (isCalendarDate(value)) return value
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? londonDay(date) : null
}
export function formatEventDate(value?: string) {
  const day = eventDay(value)
  return day
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'Europe/London' }).format(
        new Date(`${day}T12:00:00Z`),
      )
    : 'Date to be announced'
}
export function competitionStatus(value: string | undefined, now: Date) {
  const day = eventDay(value)
  if (!day) return { text: 'Date to be announced', icon: 'clock' as const }
  const days = Math.round((Date.parse(day) - Date.parse(londonDay(now))) / 86_400_000)
  if (days === 0) return { text: 'Today', icon: 'clock' as const }
  if (days < 0) return { text: 'Results not available', icon: 'unavailable' as const }
  return { text: `${days} day${days === 1 ? '' : 's'} to go`, icon: 'clock' as const }
}
const ordinal = (day: number) =>
  `${day}${day % 100 >= 11 && day % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[day % 10] || 'th'}`
export function formatDateRange(start: string, end: string) {
  const part = (value: string) => {
    const date = new Date(`${value}T12:00:00Z`)
    return {
      day: ordinal(date.getUTCDate()),
      month: new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }).format(date),
      year: date.getUTCFullYear(),
    }
  }
  const first = part(start),
    last = part(end)
  if (first.year !== last.year)
    return `${first.day} ${first.month} ${first.year}–${last.day} ${last.month} ${last.year}`
  if (first.month !== last.month) return `${first.day} ${first.month}–${last.day} ${last.month}`
  return `${first.day}${start === end ? '' : `–${last.day}`} ${first.month}`
}
