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
