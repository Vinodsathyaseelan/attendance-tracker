import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { createAttendanceWorkbook, parseAttendanceWorkbook } from './workbook'

const statusTypes = [
  { label: 'In-office', value: 'in-office' },
  { label: 'WFH', value: 'wfh' },
  { label: 'PTO', value: 'pto' }
]

describe('attendance workbooks', () => {
  it('round-trips attendance with correct weekday names', async () => {
    const data = await createAttendanceWorkbook({
      '2026-09-28': 'wfh',
      '2026-09-29': 'in-office'
    }, statusTypes)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(data)
    const worksheet = workbook.worksheets[0]
    expect(worksheet.getRow(2).values.slice(1)).toEqual(['2026-09-28', 'Monday', 'WFH'])
    expect(worksheet.getRow(3).values.slice(1)).toEqual(['2026-09-29', 'Tuesday', 'In-office'])
    await expect(parseAttendanceWorkbook(data, statusTypes)).resolves.toEqual({
      '2026-09-28': 'wfh',
      '2026-09-29': 'in-office'
    })
  })

  it('rejects workbooks with unexpected headers', async () => {
    const workbook = new ExcelJS.Workbook()
    workbook.addWorksheet('Attendance').addRow(['When', 'Day', 'Status'])
    const data = await workbook.xlsx.writeBuffer()

    await expect(parseAttendanceWorkbook(data, statusTypes)).rejects.toThrow(
      'The workbook must contain Date, Day, and Status columns.'
    )
  })

  it('rejects invalid dates and statuses without returning partial data', async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Attendance')
    worksheet.addRow(['Date', 'Day', 'Status'])
    worksheet.addRow(['2026-09-28', 'Monday', 'WFH'])
    worksheet.addRow(['not-a-date', 'Tuesday', 'Unknown'])
    const data = await workbook.xlsx.writeBuffer()

    await expect(parseAttendanceWorkbook(data, statusTypes)).rejects.toThrow(
      'Invalid attendance entry on row 3.'
    )
  })
})
