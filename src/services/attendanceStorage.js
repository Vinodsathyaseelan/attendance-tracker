import { isTauri } from './platform'

const storeName = 'attendance.json'

async function getDesktopStore() {
  const { load } = await import('@tauri-apps/plugin-store')
  return load(storeName, { autoSave: false })
}

export async function loadAttendance(year) {
  const key = `attendance_${year}`

  if (!isTauri()) {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : {}
  }

  const store = await getDesktopStore()
  return (await store.get(key)) || {}
}

export async function loadCalendarAttendance(year) {
  const data = await Promise.all([year - 1, year, year + 1].map(loadAttendance))
  return Object.assign({}, ...data)
}

export async function saveCalendarAttendance(year, attendance) {
  const buckets = new Map([year - 1, year, year + 1].map(value => [value, {}]))
  for (const [key, status] of Object.entries(attendance)) {
    const entryYear = Number(key.slice(0, 4))
    if (!buckets.has(entryYear)) buckets.set(entryYear, await loadAttendance(entryYear))
    buckets.get(entryYear)[key] = status
  }
  for (const [entryYear, data] of buckets) await saveAttendance(entryYear, data)
}

export async function saveAttendance(year, attendance) {
  const key = `attendance_${year}`

  if (!isTauri()) {
    localStorage.setItem(key, JSON.stringify(attendance))
    return
  }

  const store = await getDesktopStore()
  await store.set(key, attendance)
  await store.save()
}
