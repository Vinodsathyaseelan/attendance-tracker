import { afterEach, describe, expect, it, vi } from 'vitest'
import { dateKey, calendarYearForDate, generateFiscalQuarters, numberQuarterWeeks, isFutureDay, isWorkWeekComplete, startDayRefresh } from './calendar'

const weeksOf = quarter => quarter.months.flatMap(month => month.weeks)

afterEach(() => vi.useRealTimers())

describe('quarter week numbering', () => {
  it('continues across months and restarts for each quarter without changing dates', () => {
    const months = [4, 4, 5].map((count, month) => ({
      name: `Month ${month + 1}`,
      weeks: Array.from({ length: count }, (_, index) => ({
        number: index + 1,
        start: new Date(2026, month, 1 + index * 7)
      }))
    }))
    for (let quarter = 0; quarter < 4; quarter++) {
      const numbered = numberQuarterWeeks(months)
      expect(numbered.flatMap(month => month.weeks.map(week => week.number))).toEqual(Array.from({ length: 13 }, (_, index) => index + 1))
      expect(numbered[1].weeks[0].start).toBe(months[1].weeks[0].start)
    }
    expect(months[1].weeks[0].number).toBe(1)
  })
})

describe('13-week fiscal calendar', () => {
  it('selects the fiscal year at the December boundary', () => {
    expect(calendarYearForDate(new Date(2026, 11, 26))).toBe(2026)
    expect(calendarYearForDate(new Date(2026, 11, 27))).toBe(2027)
    expect(calendarYearForDate(new Date(2027, 11, 26))).toBe(2028)
  })

  it('uses the confirmed 2027 quarter boundaries', () => {
    const quarters = generateFiscalQuarters(2027)
    expect(quarters.map(quarter => {
      const weeks = weeksOf(quarter)
      expect(weeks).toHaveLength(13)
      expect(weeks.map(week => week.number)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1))
      return [dateKey(weeks[0].start), dateKey(weeks[12].end)]
    })).toEqual([
      ['2026-12-27', '2027-03-27'],
      ['2027-03-28', '2027-06-26'],
      ['2027-06-27', '2027-09-25'],
      ['2027-09-26', '2027-12-25']
    ])
  })

  it('contains 364 unique consecutive days, including across DST', () => {
    const days = generateFiscalQuarters(2027).flatMap(weeksOf).flatMap(week => week.days)
    expect(new Set(days.map(day => dateKey(day.date))).size).toBe(364)
    days.forEach((day, index) => {
      const expected = new Date(2026, 11, 27 + index)
      expect(dateKey(day.date)).toBe(dateKey(expected))
      expect(day.date.getHours()).toBe(0)
    })
    expect(dateKey(weeksOf(generateFiscalQuarters(2028)[0])[0].start)).toBe('2027-12-26')
  })

  it('excludes the cross-year work week until Saturday', () => {
    const week = weeksOf(generateFiscalQuarters(2027)[0])[0]
    expect(isWorkWeekComplete(week, new Date(2027, 0, 1, 23, 59))).toBe(false)
    expect(isWorkWeekComplete(week, new Date(2027, 0, 2))).toBe(true)
  })
})

describe('live date refresh', () => {
  it('enables the next day at local midnight without reopening', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59))
    let now
    const target = new EventTarget()
    const stop = startDayRefresh(value => { now = value }, target, target)
    const nextDay = new Date(2027, 0, 1)
    expect(isFutureDay(nextDay, now)).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(isFutureDay(nextDay, now)).toBe(false)
    expect(dateKey(now)).toBe('2027-01-01')
    expect(vi.getTimerCount()).toBe(1)
    stop()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('refreshes after sleep on focus and visibility change, and cleans up', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2027, 2, 13, 12))
    const refresh = vi.fn()
    const target = new EventTarget()
    const stop = startDayRefresh(refresh, target, target)
    vi.setSystemTime(new Date(2027, 2, 15, 9))
    target.dispatchEvent(new Event('focus'))
    expect(dateKey(refresh.mock.lastCall[0])).toBe('2027-03-15')
    target.dispatchEvent(new Event('visibilitychange'))
    expect(refresh).toHaveBeenCalledTimes(3)
    expect(vi.getTimerCount()).toBe(1)
    stop()
    target.dispatchEvent(new Event('focus'))
    expect(refresh).toHaveBeenCalledTimes(3)
  })
})
