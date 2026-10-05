import ExcelJS from 'exceljs'

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const headers = ['Date', 'Day', 'Status']

function getDayName(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long' })
}

export async function createAttendanceWorkbook(attendance, statusTypes) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Attendance')
  worksheet.addRow(headers)

  Object.keys(attendance).sort().forEach(dateKey => {
    const status = attendance[dateKey]
    const statusLabel = statusTypes.find(item => item.value === status)?.label || status
    worksheet.addRow([dateKey, getDayName(dateKey), statusLabel])
  })

  worksheet.columns = [{ width: 14 }, { width: 14 }, { width: 24 }]
  const buffer = await workbook.xlsx.writeBuffer()
  return new Uint8Array(buffer)
}

export async function parseAttendanceWorkbook(data, statusTypes) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(data)
  const worksheet = workbook.worksheets[0]

  if (!worksheet) {
    throw new Error('The workbook does not contain an attendance sheet.')
  }

  const workbookHeaders = worksheet.getRow(1).values.slice(1, 4).map(String)
  if (headers.some((header, index) => workbookHeaders[index] !== header)) {
    throw new Error('The workbook must contain Date, Day, and Status columns.')
  }

  const attendance = {}
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return

    const dateKey = String(row.getCell(1).value || '').trim()
    const statusLabel = String(row.getCell(3).value || '').trim()
    if (!dateKey && !statusLabel) return

    const status = statusTypes.find(item => item.label === statusLabel)
    const [year, month, day] = dateKey.split('-').map(Number)
    const date = datePattern.test(dateKey) ? new Date(year, month - 1, day) : null
    const isValidDate = date && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    if (!isValidDate || !status) {
      throw new Error(`Invalid attendance entry on row ${rowNumber}.`)
    }

    attendance[dateKey] = status.value
  })

  return attendance
}
