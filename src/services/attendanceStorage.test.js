import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadAttendance, saveAttendance, loadCalendarAttendance, saveCalendarAttendance } from './attendanceStorage'

const records = new Map()

beforeEach(() => {
  records.clear()
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(key => records.get(key) ?? null),
    setItem: vi.fn((key, value) => records.set(key, value))
  })
})

describe('browser attendance storage', () => {
  it('persists year-keyed attendance', async () => {
    const attendance = { '2026-10-05': 'in-office' }
    await saveAttendance(2026, attendance)

    await expect(loadAttendance(2026)).resolves.toEqual(attendance)
    await expect(loadAttendance(2025)).resolves.toEqual({})
  })

  it('shares cross-year entries without losing historical data and supports clearing', async () => {
    await saveAttendance(2026, { '2026-10-05': 'wfh', '2026-12-28': 'in-office' })
    await saveAttendance(2027, { '2027-01-04': 'pto' })
    await saveAttendance(2028, { '2028-01-03': 'sick' })
    const attendance = await loadCalendarAttendance(2027)
    expect(attendance['2026-12-28']).toBe('in-office')
    attendance['2026-12-28'] = 'wfh'
    await saveCalendarAttendance(2027, attendance)
    expect((await loadAttendance(2026))['2026-12-28']).toBe('wfh')
    delete attendance['2026-12-28']
    await saveCalendarAttendance(2027, attendance)
    expect(await loadAttendance(2026)).toEqual({ '2026-10-05': 'wfh' })
    expect(await loadAttendance(2027)).toEqual({ '2027-01-04': 'pto' })
    expect(await loadAttendance(2028)).toEqual({ '2028-01-03': 'sick' })
  })

  it('propagates write failures without replacing existing data', async () => {
    records.set('attendance_2026', JSON.stringify({ '2026-10-05': 'wfh' }))
    localStorage.setItem.mockImplementationOnce(() => {
      throw new Error('storage unavailable')
    })

    await expect(saveAttendance(2026, { '2026-10-05': 'in-office' })).rejects.toThrow('storage unavailable')
    await expect(loadAttendance(2026)).resolves.toEqual({ '2026-10-05': 'wfh' })
  })
})
