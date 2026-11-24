export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function fiscalYearStart(year) {
  const start = new Date(2026, 11, 27)
  start.setDate(start.getDate() + (year - 2027) * 364)
  return start
}

export function calendarYearForDate(date) {
  let year = date.getFullYear()
  if (date < fiscalYearStart(2027)) return year
  while (date >= fiscalYearStart(year + 1)) year++
  return year
}

export function numberQuarterWeeks(months) {
  let number = 0
  return months.map(month => ({
    ...month,
    weeks: month.weeks.map(week => ({ ...week, number: ++number }))
  }))
}

export function generateFiscalQuarters(year) {
  const start = fiscalYearStart(year)
  return Array.from({ length: 4 }, (_, quarterIndex) => {
    const months = []
    for (let index = 0; index < 13; index++) {
      const weekStart = new Date(start)
      weekStart.setDate(start.getDate() + (quarterIndex * 13 + index) * 7)
      const thursday = new Date(weekStart)
      thursday.setDate(thursday.getDate() + 4)
      const name = thursday.toLocaleDateString('en-US', { month: 'long' })
      if (months.at(-1)?.name !== name) months.push({ name, weeks: [] })
      const days = Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(weekStart)
        date.setDate(date.getDate() + dayIndex)
        return {
          date,
          dayNumber: date.getDate(),
          isWeekend: dayIndex === 0 || dayIndex === 6,
          isCurrentMonth: date.getMonth() === thursday.getMonth()
        }
      })
      months.at(-1).weeks.push({
        number: index + 1,
        start: weekStart,
        end: days[6].date,
        days
      })
    }
    return { name: `Q${quarterIndex + 1}`, months }
  })
}

export function isFutureDay(date, now) {
  return dateKey(date) > dateKey(now)
}

export function isWorkWeekComplete(week, now) {
  const completedAt = new Date(week.start)
  completedAt.setDate(completedAt.getDate() + 6)
  return now >= completedAt
}

export function startDayRefresh(refresh, targetWindow = window, targetDocument = document) {
  let timer
  const update = () => {
    clearTimeout(timer)
    const now = new Date()
    refresh(now)
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    timer = setTimeout(update, midnight - now)
  }
  targetWindow.addEventListener('focus', update)
  targetDocument.addEventListener('visibilitychange', update)
  update()
  return () => {
    clearTimeout(timer)
    targetWindow.removeEventListener('focus', update)
    targetDocument.removeEventListener('visibilitychange', update)
  }
}
