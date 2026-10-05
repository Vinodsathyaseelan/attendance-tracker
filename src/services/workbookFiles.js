import { isTauri } from './platform'

export async function exportWorkbook(data, defaultName) {
  if (!isTauri()) {
    const url = URL.createObjectURL(new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }))
    const link = document.createElement('a')
    link.href = url
    link.download = defaultName
    link.click()
    URL.revokeObjectURL(url)
    return true
  }

  const [{ save }, { writeFile }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/plugin-fs')
  ])
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
  })
  if (!path) return false

  await writeFile(path, data)
  return true
}

export async function importWorkbook(file) {
  if (!isTauri()) {
    return file ? new Uint8Array(await file.arrayBuffer()) : null
  }

  const [{ open }, { readFile }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/plugin-fs')
  ])
  const path = await open({
    multiple: false,
    directory: false,
    filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
  })
  if (!path) return null

  return readFile(path)
}
