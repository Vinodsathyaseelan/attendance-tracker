import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadAttendance, saveAttendance } from './attendanceStorage'

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

  it('propagates write failures without replacing existing data', async () => {
    records.set('attendance_2026', JSON.stringify({ '2026-10-05': 'wfh' }))
    localStorage.setItem.mockImplementationOnce(() => {
      throw new Error('storage unavailable')
    })

    await expect(saveAttendance(2026, { '2026-10-05': 'in-office' })).rejects.toThrow('storage unavailable')
    await expect(loadAttendance(2026)).resolves.toEqual({ '2026-10-05': 'wfh' })
  })
})
