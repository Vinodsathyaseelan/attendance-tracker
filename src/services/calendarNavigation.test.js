import { describe, expect, it, vi } from 'vitest'
import { createCalendarInputHandlers, monthPages, monthStep } from './calendarNavigation'
import { generateFiscalQuarters } from './calendar'

const event = values => ({ preventDefault: vi.fn(), target: { closest: () => null }, ...values })

describe('month navigation', () => {
  it('makes all 2027 weeks reachable, including December 2026', () => {
    const pages = monthPages(generateFiscalQuarters(2027), 2027)
    expect(pages[0].label).toBe('December 2026 · Q1 2027')
    expect(pages.at(-1).label).toBe('December 2027 · Q4 2027')
    expect(pages.flatMap(page => page.month.weeks)).toHaveLength(52)
  })

  it('crosses fiscal years in either direction', () => {
    expect(monthStep(2026, 11, 1, 12)).toEqual({ year: 2027, index: 0 })
    expect(monthStep(2027, 0, -1, 13)).toEqual({ year: 2026, index: -1 })
    expect(monthStep(2027, 4, 1, 13)).toEqual({ year: 2027, index: 5 })
  })

  it('uses one month per scroll gesture, ignoring momentum and horizontal scrolling', () => {
    const step = vi.fn()
    const handlers = createCalendarInputHandlers(step, () => true)
    handlers.wheel(event({ deltaY: 70, deltaX: 0, timeStamp: 1000 }))
    handlers.wheel(event({ deltaY: 70, deltaX: 0, timeStamp: 1020 }))
    expect(step.mock.calls).toEqual([[1]])
    handlers.wheel(event({ deltaY: -70, deltaX: 0, timeStamp: 1500 }))
    expect(step.mock.calls).toEqual([[1], [-1]])
    const horizontal = event({ deltaY: 1, deltaX: 80, timeStamp: 2000 })
    handlers.wheel(horizontal)
    expect(horizontal.preventDefault).not.toHaveBeenCalled()
  })

  it('supports arrow keys but does not hijack controls, dialogs, or key repeats', () => {
    const step = vi.fn()
    let enabled = true
    const handlers = createCalendarInputHandlers(step, () => enabled)
    handlers.keydown(event({ key: 'ArrowDown' }))
    handlers.keydown(event({ key: 'ArrowUp' }))
    handlers.keydown(event({ key: 'ArrowDown', repeat: true }))
    handlers.keydown(event({ key: 'ArrowDown', target: { closest: () => ({}) } }))
    enabled = false
    handlers.keydown(event({ key: 'ArrowDown' }))
    handlers.wheel(event({ deltaY: 100, timeStamp: 1000 }))
    expect(step.mock.calls).toEqual([[1], [-1]])
  })
})
