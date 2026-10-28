import { describe, expect, it } from 'vitest'
import { competitionStatus, eventDay, formatDateRange, isCalendarDate } from '@/utils/dates'
describe('event calendar formatting', () => {
  it.each([
    ['2027-03-06', '2027-03-07', '6th–7th March'],
    ['2027-03-06', '2027-03-06', '6th March'],
    ['2027-03-31', '2027-04-01', '31st March–1st April'],
    ['2026-12-31', '2027-01-01', '31st December 2026–1st January 2027'],
    ['2027-03-11', '2027-03-13', '11th–13th March'],
    ['2027-03-21', '2027-03-23', '21st–23rd March'],
  ])('formats %s to %s', (start, end, expected) => {
    expect(formatDateRange(start, end)).toBe(expected)
  })
  it('validates real calendar days rather than accepting normalized invalid dates', () => {
    expect(isCalendarDate('2028-02-29')).toBe(true)
    for (const value of [
      '2027-02-29',
      '2026-04-31',
      '2026-13-01',
      'not-a-date',
      '2026-01-01T12:00:00Z',
    ])
      expect(isCalendarDate(value)).toBe(false)
    expect(eventDay('2026-07-01T23:30:00Z')).toBe('2026-07-02')
  })
  it('counts calendar days across the London daylight-saving boundary', () => {
    expect(competitionStatus('2026-03-30', new Date('2026-03-28T23:59:00Z')).text).toBe(
      '2 days to go',
    )
    expect(competitionStatus('2026-03-30', new Date('2026-03-29T23:01:00Z')).text).toBe('Today')
  })
})
