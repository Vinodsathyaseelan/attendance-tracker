export function monthPages(quarters, year) {
  return quarters.flatMap(quarter => quarter.months.filter(month => month.weeks.length).map(month => {
    const thursday = month.weeks[0].days[4].date
    return { quarter: quarter.name, month, label: `${month.name} ${thursday.getFullYear()} · ${quarter.name} ${year}` }
  }))
}

export function monthStep(year, index, direction, count) {
  const next = index + direction
  if (next < 0) return { year: year - 1, index: -1 }
  if (next >= count) return { year: year + 1, index: 0 }
  return { year, index: next }
}

export function createCalendarInputHandlers(step, enabled) {
  let lastWheelAt = -Infinity
  let consumed = false
  let distance = 0
  const blocked = event => !enabled() || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.target?.closest?.('input, textarea, select, [contenteditable="true"], [role="combobox"], [role="listbox"], [role="dialog"], .el-select')
  return {
    wheel(event) {
      if (blocked(event) || !event.deltaY || Math.abs(event.deltaX || 0) > Math.abs(event.deltaY)) return
      event.preventDefault()
      if (event.timeStamp - lastWheelAt > 180) {
        consumed = false
        distance = 0
      }
      lastWheelAt = event.timeStamp
      if (consumed) return
      distance += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 600 : 1)
      if (Math.abs(distance) < 60) return
      consumed = true
      step(distance > 0 ? 1 : -1)
    },
    keydown(event) {
      if (blocked(event) || !['ArrowUp', 'ArrowDown'].includes(event.key)) return
      event.preventDefault()
      if (!event.repeat) step(event.key === 'ArrowDown' ? 1 : -1)
    }
  }
}
