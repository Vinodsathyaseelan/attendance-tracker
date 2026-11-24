<template>
  <div class="attendance-tracker">
    <el-container>
      <el-header>
        <div class="brand">
          <div class="brand-mark"><el-icon><Calendar /></el-icon></div>
          <div>
            <h1>Attendance<span class="brand-accent">.</span></h1>
            <p class="brand-subtitle">Your workweek, at a glance</p>
          </div>
        </div>
        <div class="header-controls">
          <el-select v-model="selectedYear" @change="handleYearChange" aria-label="Calendar year" :disabled="isNavigating || isTransitioning" style="width: 160px; margin-right: 10px">
            <el-option
              v-for="year in years"
              :key="year"
              :label="`Calendar ${year}`"
              :value="year"
            />
          </el-select>
          <el-button @click="importFromExcel" :icon="Upload" aria-label="Import from Excel">Import</el-button>
          <el-button type="primary" @click="exportToExcel" :icon="Download" aria-label="Export to Excel">Export Excel</el-button>
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx"
            style="display: none"
            @change="handleFileImport"
          />
        </div>
      </el-header>

      <el-main>
        <section class="compliance-cards" aria-label="Quarterly compliance overview">
          <article v-for="(quarter, index) in quarters" :key="quarter.name" class="compliance-card" :class="getComplianceCardClass(index)">
            <div class="card-header">
              <h3>{{ quarter.name }} <span>{{ selectedYear }}</span></h3>
              <el-icon class="card-icon"><component :is="getComplianceIcon(index)" /></el-icon>
            </div>
            <div class="card-value">
              {{ getComplianceStatus(index) === 'Not Available' ? '—' : getComplianceStatus(index).split(' ')[0] }}
              <span>days / week</span>
            </div>
            <div class="card-footer">
              <span class="compliance-pill">{{ getComplianceStatus(index) === 'Not Available' ? 'No completed weeks' : isCompliantStatus(getComplianceStatus(index)) ? 'On track' : 'Below target' }}</span>
              <span class="card-target">Target 3.0</span>
            </div>
          </article>
        </section>

        <div class="status-legend" aria-label="Attendance status key">
          <span class="legend-title">Attendance key</span>
          <span class="legend-item" v-for="status in statusTypes" :key="status.value">
            <span class="legend-color" :style="{ backgroundColor: status.color }"></span>
            {{ status.label }}
          </span>
        </div>

        <div class="quarters-container" @wheel="handleCalendarWheel">
          <div class="calendar-navigation">
            <div class="calendar-title">
              <h2>Attendance calendar</h2>
              <span class="navigation-hint">Scroll or use <kbd>↑</kbd> <kbd>↓</kbd> to explore months</span>
            </div>
            <div class="month-controls">
              <el-button @click="showToday" :disabled="isNavigating || isTransitioning">Today</el-button>
              <el-button :icon="ArrowLeft" aria-label="Previous month" title="Previous month" @click="navigateMonth(-1)" :disabled="isNavigating || isTransitioning || selectedYear === years[0] && activeMonthIndex === 0" />
              <el-select v-model="activeMonthIndex" aria-label="Displayed month" class="month-select" :disabled="isNavigating || isTransitioning">
                <el-option v-for="(page, index) in pages" :key="index" :label="page.label" :value="index" />
              </el-select>
              <el-button :icon="ArrowRight" aria-label="Next month" title="Next month" @click="navigateMonth(1)" :disabled="isNavigating || isTransitioning || selectedYear === years[years.length - 1] && activeMonthIndex === pages.length - 1" />
            </div>
          </div>
          <Transition :name="monthTransition" mode="out-in" @before-leave="isTransitioning = true" @after-enter="isTransitioning = false" @enter-cancelled="isTransitioning = false">
            <section v-if="visibleQuarter" :key="`${selectedYear}-${activeMonthIndex}`" class="quarter" v-loading="isNavigating" aria-label="Monthly attendance">
              <div class="months-grid">
                <div v-for="month in visibleQuarter.months" :key="month.name" class="month">
                  <div class="month-heading">
                    <h2>{{ month.name }} <span>{{ month.weeks[0].days[4].date.getFullYear() }}</span></h2>
                    <span class="quarter-badge">{{ visibleQuarter.name }} <span>·</span> {{ selectedYear }}</span>
                  </div>
                  <div class="weekday-heading" aria-hidden="true">
                    <span class="week-column-title">Quarter week</span>
                    <div class="week-days"><span v-for="name in weekdayNames" :key="name">{{ name }}</span></div>
                  </div>
                  <div class="weeks-grid">
                    <div v-for="week in month.weeks" :key="week.start" class="week" :class="{ 'current-week': isCurrentWeek(week) }">
                      <div class="week-meta">
                        <span class="week-label">W{{ week.number }} <span v-if="isCurrentWeek(week)" class="current-week-dot" aria-label="Current week"></span></span>
                        <span class="week-dates">{{ formatDateRange(week.start, week.days[6].date) }}</span>
                      </div>
                      <div class="week-days">
                        <button
                          v-for="day in week.days"
                          :key="day.date"
                          type="button"
                          class="day"
                          :class="{ 'weekend': day.isWeekend, 'today': isToday(day.date), 'other-month': !day.isCurrentMonth, 'future-date': isFutureDate(day.date), 'has-status': !!getAttendanceStatus(day.date).value }"
                          :style="{ '--status-color': getAttendanceStatus(day.date).color }"
                          :disabled="day.isWeekend || isFutureDate(day.date) || isNavigating || isTransitioning"
                          :aria-label="`${day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}: ${getAttendanceStatus(day.date).label || 'No entry'}`"
                          :aria-current="isToday(day.date) ? 'date' : undefined"
                          @click="selectDay(day)"
                        >
                          <span class="day-topline"><span class="day-number">{{ day.dayNumber }}</span><span v-if="isToday(day.date)" class="today-label">Today</span></span>
                          <span class="day-status" :title="getAttendanceStatus(day.date).label">
                            <span v-if="getAttendanceStatus(day.date).value" class="status-dot" :style="{ backgroundColor: getAttendanceStatus(day.date).color }"></span>
                            <span class="day-status-label">{{ getAttendanceStatus(day.date).label || (day.isWeekend ? 'Weekend' : isFutureDate(day.date) ? '—' : 'Add entry') }}</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Transition>
        </div>
      </el-main>
    </el-container>

    <el-dialog v-model="statusDialogVisible" title="Update attendance" width="360px" style="max-width: calc(100vw - 32px); border-radius: 16px; --el-color-primary: #6154d9">
      <p v-if="selectedDay" class="dialog-date">{{ selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) }}</p>
      <el-select v-model="selectedStatus" placeholder="Select status" style="width: 100%" clearable>
        <el-option
          v-for="status in statusTypes"
          :key="status.value"
          :label="status.label"
          :value="status.value"
        >
          <span class="status-option">
            <span class="status-color" :style="{ backgroundColor: status.color }"></span>
            {{ status.label }}
          </span>
        </el-option>
      </el-select>
      <template #footer>
        <el-button @click="statusDialogVisible = false">Cancel</el-button>
        <el-button type="danger" @click="clearStatus" v-if="selectedStatus">Clear</el-button>
        <el-button type="primary" @click="saveStatus">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { createCalendarInputHandlers, monthPages, monthStep } from './services/calendarNavigation'
import { dateKey as localDateKey, calendarYearForDate, generateFiscalQuarters, numberQuarterWeeks, isFutureDay, isCompliantStatus, isWorkWeekComplete, startDayRefresh } from './services/calendar'
import { ElMessage } from 'element-plus'
import { Calendar, ArrowLeft, ArrowRight, Download, Upload, SuccessFilled, CircleCloseFilled, QuestionFilled } from '@element-plus/icons-vue'
import { loadCalendarAttendance, saveCalendarAttendance } from './services/attendanceStorage'
import { isTauri } from './services/platform'
import { createAttendanceWorkbook, parseAttendanceWorkbook } from './services/workbook'
import { exportWorkbook, importWorkbook } from './services/workbookFiles'

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const statusTypes = [
  { label: 'In-office', value: 'in-office', color: '#67C23A' },
  { label: 'WFH', value: 'wfh', color: '#409EFF' },
  { label: 'PTO', value: 'pto', color: '#E6A23C' },
  { label: 'Sick Leave', value: 'sick', color: '#F56C6C' },
  { label: 'Other Leave', value: 'other-leave', color: '#909399' },
  { label: 'Flexible Time Off', value: 'flexible', color: '#9b59b6' }
]

const today = ref(new Date())
const years = computed(() => {
  const year = today.value.getFullYear()
  return Array.from({ length: Math.max(5, year - 2024 + 3) }, (_, index) => 2024 + index)
})
const selectedYear = ref(calendarYearForDate(today.value))
let stopDayRefresh

const attendanceData = ref({})
const statusDialogVisible = ref(false)
const selectedDay = ref(null)
const selectedStatus = ref('')
const fileInput = ref(null)
const activeMonthIndex = ref(0)
const isNavigating = ref(false)
const isTransitioning = ref(false)
const monthTransition = ref('month-next')
const calendarInput = createCalendarInputHandlers(navigateMonth, () => !statusDialogVisible.value && !isNavigating.value)

watch([selectedYear, activeMonthIndex], ([year, index], [previousYear, previousIndex]) => {
  monthTransition.value = year > previousYear || year === previousYear && index > previousIndex ? 'month-next' : 'month-previous'
})

const quarters = computed(() => getQuarters(selectedYear.value))
const pages = computed(() => monthPages(quarters.value, selectedYear.value))
const visibleQuarter = computed(() => {
  const page = pages.value[activeMonthIndex.value]
  return page ? { name: page.quarter, months: [page.month] } : null
})

function getQuarters(year) {
  if (year >= 2027) return generateFiscalQuarters(year)
  return [
    {
      name: 'Q1',
      months: generateMonthsForQuarter(year, 0, 2)
    },
    {
      name: 'Q2',
      months: generateMonthsForQuarter(year, 3, 5)
    },
    {
      name: 'Q3',
      months: generateMonthsForQuarter(year, 6, 8)
    },
    {
      name: 'Q4',
      months: generateMonthsForQuarter(year, 9, 11)
    }
  ]
}

function generateMonthsForQuarter(year, startMonth, endMonth) {
  const months = []
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December']

  for (let m = startMonth; m <= endMonth; m++) {
    const weeks = generateWeeksForMonth(year, m).filter(week => year !== 2026 || week.start < new Date(2026, 11, 27))
    months.push({
      name: monthNames[m],
      weeks
    })
  }

  return numberQuarterWeeks(months)
}

function generateWeeksForMonth(year, month) {
  const weeks = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Find the Sunday that starts the week containing the first day of the month
  const firstDayOfWeek = firstDay.getDay()
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDayOfWeek)
  
  let currentDate = new Date(startDate)
  let weekNumber = 1
  
  // Iterate through weeks until we've processed all weeks that could belong to this month
  // We need to go one week past the last day to catch weeks that start in this month
  // but have Thursday in the next month (which should be excluded)
  while (currentDate <= lastDay || (currentDate.getDay() !== 0 && currentDate.getMonth() === month)) {
    const currentWeek = []
    const weekStart = new Date(currentDate)
    let weekBelongsToCurrentMonth = false
    
    // Build a week (Sunday to Saturday) - include all 7 days
    for (let i = 0; i < 7; i++) {
      const isCurrentMonth = currentDate.getMonth() === month
      const dayOfWeek = currentDate.getDay()
      
      // A week belongs to a month if Thursday (day 4) is in that month
      if (dayOfWeek === 4 && isCurrentMonth) {
        weekBelongsToCurrentMonth = true
      }
      
      currentWeek.push({
        date: new Date(currentDate),
        dayNumber: currentDate.getDate(),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isCurrentMonth: isCurrentMonth
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Only add the week if Thursday is in the current month
    if (weekBelongsToCurrentMonth) {
      weeks.push({
        number: weekNumber++,
        start: weekStart,
        end: new Date(currentDate),
        days: currentWeek
      })
    }
    
    // Stop if we've moved past the month and past a Sunday
    if (currentDate.getMonth() !== month && currentDate.getDay() === 0) {
      break
    }
  }
  
  return weeks
}

function formatDateRange(start, end) {
  const options = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
}

function isCurrentWeek(week) {
  return localDateKey(today.value) >= localDateKey(week.start) && localDateKey(today.value) <= localDateKey(week.days[6].date)
}

function isToday(date) {
  return localDateKey(date) === localDateKey(today.value)
}

function isFutureDate(date) {
  return isFutureDay(date, today.value)
}

function getAttendanceStatus(date) {
  const dateKey = localDateKey(date)
  const status = attendanceData.value[dateKey]
  return statusTypes.find(s => s.value === status) || { color: '#f5f5f5', label: '', value: '' }
}

function selectDay(day) {
  if (day.isWeekend || isNavigating.value || isTransitioning.value) return
  
  // Disable future dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayDate = new Date(day.date)
  dayDate.setHours(0, 0, 0, 0)
  
  if (dayDate > today) return
  
  selectedDay.value = day
  selectedStatus.value = attendanceData.value[localDateKey(day.date)] || ''
  statusDialogVisible.value = true
}

async function saveStatus() {
  if (!selectedDay.value) return

  const dateKey = localDateKey(selectedDay.value.date)
  attendanceData.value[dateKey] = selectedStatus.value
  try {
    await saveAttendanceData()
    statusDialogVisible.value = false
  } catch (error) {
    ElMessage.error(`Unable to save attendance: ${error.message}`)
  }
}

async function clearStatus() {
  if (!selectedDay.value) return

  const dateKey = localDateKey(selectedDay.value.date)
  delete attendanceData.value[dateKey]
  try {
    await saveAttendanceData()
    selectedStatus.value = ''
    statusDialogVisible.value = false
  } catch (error) {
    ElMessage.error(`Unable to clear attendance: ${error.message}`)
  }
}

async function saveAttendanceData() {
  await saveCalendarAttendance(selectedYear.value, attendanceData.value)
}

async function loadAttendanceData() {
  try {
    attendanceData.value = await loadCalendarAttendance(selectedYear.value)
  } catch (error) {
    ElMessage.error(`Unable to load attendance: ${error.message}`)
  }
}

function handleCalendarWheel(event) {
  if (isTransitioning.value) {
    event.preventDefault()
    return
  }
  const main = event.currentTarget.closest('.el-main')
  if (main && main.scrollHeight > main.clientHeight + 1) return
  calendarInput.wheel(event)
}

function selectCurrentMonth() {
  const index = pages.value.findIndex(page => page.month.weeks.some(isCurrentWeek))
  activeMonthIndex.value = index < 0 ? 0 : index
}

async function handleYearChange() {
  isNavigating.value = true
  selectCurrentMonth()
  try {
    await loadAttendanceData()
  } finally {
    isNavigating.value = false
  }
}

async function navigateMonth(direction) {
  if (isNavigating.value || isTransitioning.value || statusDialogVisible.value) return
  const next = monthStep(selectedYear.value, activeMonthIndex.value, direction, pages.value.length)
  if (!years.value.includes(next.year)) return
  if (next.year === selectedYear.value) {
    activeMonthIndex.value = next.index
    return
  }
  selectedYear.value = next.year
  activeMonthIndex.value = next.index < 0 ? pages.value.length - 1 : next.index
  isNavigating.value = true
  try {
    await loadAttendanceData()
  } finally {
    isNavigating.value = false
  }
}

async function showToday() {
  selectedYear.value = calendarYearForDate(today.value)
  await handleYearChange()
}

async function exportToExcel() {
  try {
    const weeks = quarters.value.flatMap(quarter => quarter.months.flatMap(month => month.weeks))
    const dates = new Set(weeks.flatMap(week => week.days.map(day => localDateKey(day.date))))
    const attendance = Object.fromEntries(Object.entries(attendanceData.value).filter(([key]) => dates.has(key)))
    const data = await createAttendanceWorkbook(attendance, statusTypes)
    await exportWorkbook(data, `attendance_${selectedYear.value}.xlsx`)
  } catch (error) {
    ElMessage.error(`Unable to export attendance: ${error.message}`)
  }
}

async function importFromExcel() {
  if (!isTauri()) {
    fileInput.value.click()
    return
  }

  try {
    const data = await importWorkbook()
    if (data) await applyWorkbookData(data)
  } catch (error) {
    ElMessage.error(`Unable to import attendance: ${error.message}`)
  }
}

async function applyWorkbookData(data) {
  const importedAttendance = await parseAttendanceWorkbook(data, statusTypes)
  attendanceData.value = { ...attendanceData.value, ...importedAttendance }
  await saveAttendanceData()
}

async function handleFileImport(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const data = await importWorkbook(file)
    if (data) await applyWorkbookData(data)
  } catch (error) {
    ElMessage.error(`Unable to import attendance: ${error.message}`)
  } finally {
    fileInput.value.value = ''
  }
}

function getComplianceStatus(quarterIndex) {
  const year = selectedYear.value
  const quarterMonths = quarters.value[quarterIndex].months
  
  let totalInOfficeDays = 0
  let totalWeeks = 0
  let hasAnyEntry = false
  const now = today.value
  
  // Determine the current quarter based on today's date
  const currentQuarter = quarters.value.findIndex(quarter => quarter.months.some(month => month.weeks.some(isCurrentWeek)))
  const isCurrentYear = currentQuarter !== -1
  
  quarterMonths.forEach(month => {
    const weeks = month.weeks
    
    weeks.forEach(week => {
      // For the current quarter, include a week only after its Monday-Friday work week has ended.
      if (!isWorkWeekComplete(week, now)) return
      if (isCurrentYear && quarterIndex === currentQuarter) {
        const workWeekCompletedAt = new Date(week.start)
        workWeekCompletedAt.setDate(workWeekCompletedAt.getDate() + 6)
        workWeekCompletedAt.setHours(0, 0, 0, 0)

        if (now < workWeekCompletedAt) return
      }
      
      let weekHasEntry = false
      let weekInOfficeDays = 0
      
      week.days.forEach(day => {
        const dateKey = localDateKey(day.date)
        const status = attendanceData.value[dateKey]
        
        if (status) {
          hasAnyEntry = true
          weekHasEntry = true
          if (status === 'in-office') {
            weekInOfficeDays++
          }
        }
      })
      
      if (weekHasEntry) {
        totalWeeks++
        totalInOfficeDays += weekInOfficeDays
      }
    })
  })
  
  if (!hasAnyEntry) {
    return 'Not Available'
  }
  
  if (totalWeeks === 0) {
    return 'Not Available'
  }
  
  const average = totalInOfficeDays / totalWeeks
  const isCompliant = average >= 3
  
  return `${average.toFixed(1)} (${isCompliant ? 'Compliant' : 'Not Compliant'})`
}

function getComplianceClass(quarterIndex) {
  const status = getComplianceStatus(quarterIndex)
  
  if (status === 'Not Available') {
    return 'compliance-na'
  }
  
  if (isCompliantStatus(status)) {
    return 'compliant'
  }
  
  return 'not-compliant'
}

function getComplianceCardClass(quarterIndex) {
  const status = getComplianceStatus(quarterIndex)
  
  if (status === 'Not Available') {
    return 'card-na'
  }
  
  if (isCompliantStatus(status)) {
    return 'card-compliant'
  }
  
  return 'card-not-compliant'
}

function getComplianceIcon(quarterIndex) {
  const status = getComplianceStatus(quarterIndex)
  
  if (status === 'Not Available') {
    return QuestionFilled
  }
  
  if (isCompliantStatus(status)) {
    return SuccessFilled
  }
  
  return CircleCloseFilled
}

function getComplianceIconColor(quarterIndex) {
  const status = getComplianceStatus(quarterIndex)
  
  if (status === 'Not Available') {
    return '#909399'
  }
  
  if (isCompliantStatus(status)) {
    return '#67c23a'
  }
  
  return '#f56c6c'
}

selectCurrentMonth()

onMounted(async () => {
  window.addEventListener('keydown', calendarInput.keydown)
  stopDayRefresh = startDayRefresh(now => {
    if (localDateKey(now) !== localDateKey(today.value)) {
      const previousYear = calendarYearForDate(today.value)
      const wasCurrentMonth = pages.value[activeMonthIndex.value]?.month.weeks.some(isCurrentWeek)
      today.value = now
      if (selectedYear.value === previousYear && previousYear !== calendarYearForDate(now)) {
        selectedYear.value = calendarYearForDate(now)
        handleYearChange()
      } else if (wasCurrentMonth) {
        selectCurrentMonth()
      }
    }
  })
  await handleYearChange()
})

onUnmounted(() => {
  stopDayRefresh?.()
  window.removeEventListener('keydown', calendarInput.keydown)
})
</script>

<style scoped>
:global(body) {
  margin: 0;
}

.attendance-tracker {
  --ink: #1a1f36;
  --muted: #64748b;
  --line: #e2e8f0;
  --accent: #7c6bf0;
  --el-color-primary: #7c6bf0;
  --el-color-primary-light-3: #a69bf6;
  --el-color-primary-light-5: #c4c5fa;
  --el-color-primary-light-7: #e0e0ff;
  --el-color-primary-light-9: #f5f5ff;
  --el-color-primary-dark-2: #5e4fd0;
  --el-border-radius-base: 12px;
  --el-text-color-primary: #1a1f36;
  width: 100%;
  height: 100dvh;
  color: var(--ink);
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 50%, #f0f3ff 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.attendance-tracker :deep(*) {
  box-sizing: border-box;
}

.el-container {
  height: 100%;
  min-width: 0;
}

.el-header {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: auto;
  min-height: 76px;
  padding: 14px 24px;
  border-bottom: 1px solid rgba(124, 107, 240, 0.08);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.brand,
.header-controls,
.month-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(145deg, #9488f6, #7c6bf0, #6555e0);
  box-shadow: 0 8px 20px rgba(124, 107, 240, 0.25);
  font-size: 23px;
}

.brand h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 750;
  letter-spacing: -0.8px;
}

.brand-accent {
  color: var(--accent);
}

.brand-subtitle {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 12px;
}

.header-controls,
.month-controls {
  flex-wrap: wrap;
  max-width: 100%;
  gap: 8px;
}

.el-button {
  font-weight: 600;
}

.header-controls .el-button + .el-button,
.month-controls .el-button + .el-button {
  margin-left: 0;
}

.el-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  min-height: 0;
  padding: 18px 24px;
  overflow: auto;
}

.compliance-cards {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.compliance-card {
  min-width: 0;
  padding: 16px 18px;
  border: 1px solid rgba(124, 107, 240, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 20px rgba(124, 107, 240, 0.08);
  transition: all 280ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.compliance-card:hover {
  border-color: rgba(124, 107, 240, 0.25);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 30px rgba(124, 107, 240, 0.15);
  transform: translateY(-2px);
}

.card-header,
.card-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.card-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.card-header h3 span {
  margin-left: 5px;
  color: var(--muted);
  font-weight: 400;
}

.card-icon {
  color: #8b94a8;
  font-size: 17px;
}

.card-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 5px 0 10px;
  font-size: 29px;
  font-weight: 700;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
}

.card-value span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
}

.compliance-pill {
  padding: 3px 7px;
  border-radius: 6px;
  color: #667085;
  background: #f1f3f7;
  font-size: 10px;
  font-weight: 600;
}

.card-target {
  color: var(--muted);
  font-size: 10px;
}

.card-compliant .compliance-pill {
  color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.card-compliant .card-icon {
  color: #10b981;
}

.card-not-compliant .compliance-pill {
  color: #f97316;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 1px solid rgba(249, 115, 22, 0.15);
}

.card-not-compliant .card-icon {
  color: #f97316;
}

.status-legend {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  align-items: center;
  gap: 8px 18px;
  padding: 0 2px;
}

.legend-title {
  margin-right: 4px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #535e74;
  font-size: 11px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.status-dot {
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
}

.quarters-container {
  --week-column: 140px;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 12px;
}

.calendar-navigation {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.calendar-title h2 {
  margin: 0 0 5px;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.2px;
}

.navigation-hint {
  color: var(--muted);
  font-size: 10px;
}

kbd {
  padding: 1px 4px;
  border: 1px solid #dce0eb;
  border-radius: 4px;
  color: #535e74;
  background: #fff;
  font: inherit;
}

.month-select {
  width: 260px;
}

.quarter {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: 20px;
  border: 1px solid rgba(124, 107, 240, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 32px rgba(124, 107, 240, 0.06);
}

.months-grid {
  display: grid;
  flex: 1;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
}

.month {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.month-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.month-heading h2 {
  margin: 0;
  font-size: 21px;
  font-weight: 650;
  letter-spacing: -0.6px;
}

.month-heading h2 span {
  color: var(--muted);
  font-weight: 400;
}

.quarter-badge {
  padding: 6px 11px;
  border: 1px solid rgba(124, 107, 240, 0.2);
  border-radius: 9px;
  color: #7c6bf0;
  background: linear-gradient(135deg, #f5f3ff 0%, #e8e4ff 100%);
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.quarter-badge span {
  padding: 0 3px;
  color: #a59cce;
}

.weekday-heading,
.week {
  display: grid;
  min-width: 0;
  grid-template-columns: var(--week-column) minmax(0, 1fr);
  gap: 12px;
  padding: 0 10px;
}

.weekday-heading {
  align-items: center;
  margin-bottom: 6px;
  padding-top: 7px;
  padding-bottom: 7px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.weekday-heading .week-days span {
  text-align: center;
}

.weeks-grid {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.week {
  flex: 1 0 auto;
  align-items: stretch;
  min-height: 62px;
  padding-top: 6px;
  padding-bottom: 6px;
  border: 1px solid rgba(124, 107, 240, 0.06);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  transition: all 240ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.week:hover {
  border-color: rgba(124, 107, 240, 0.2);
  background: rgba(255, 255, 255, 0.85);
  transform: translateX(3px);
}

.week.current-week {
  border-color: rgba(124, 107, 240, 0.25);
  background: linear-gradient(135deg, rgba(124, 107, 240, 0.04) 0%, rgba(124, 107, 240, 0.02) 100%);
  box-shadow: 0 0 0 1px rgba(124, 107, 240, 0.08);
}

.week-meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  min-width: 0;
}

.week-label {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #4e5870;
  font-size: 12px;
  font-weight: 650;
}

.current-week .week-label {
  color: var(--accent);
}

.current-week-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
}

.week-dates {
  color: var(--muted);
  font-size: 10px;
}

.week-days {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}

.day {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  padding: 8px 9px;
  border: 1px solid rgba(124, 107, 240, 0.06);
  border-radius: 9px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.7);
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: all 220ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.day:not(:disabled):hover {
  border-color: rgba(124, 107, 240, 0.2);
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 107, 240, 0.1);
}

.day:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.day.has-status {
  background: var(--status-color);
  border-color: var(--status-color);
  color: #fff;
}

.day.weekend {
  color: #94a3b8;
  background: rgba(248, 250, 252, 0.7);
  border-color: rgba(148, 163, 184, 0.08);
}

.day:disabled {
  cursor: default;
}

.day.other-month .day-number {
  color: #94a3b8;
}

.day.future-date .day-status {
  color: #94a3b8;
}

.day.today {
  border-color: var(--accent);
  background: linear-gradient(135deg, rgba(124, 107, 240, 0.06) 0%, rgba(124, 107, 240, 0.03) 100%);
  box-shadow: 0 0 0 1px rgba(124, 107, 240, 0.12), 0 2px 8px rgba(124, 107, 240, 0.15);
}

.day.today.has-status {
  background: var(--status-color);
  border-color: var(--status-color);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15);
}

.day-topline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 3px;
}

.day-number {
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.3px;
}

.today-label {
  color: var(--accent);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.day-status {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 10px;
  font-weight: 600;
}

.day.has-status .day-status {
  color: rgba(255, 255, 255, 0.95);
}

.day-status-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dialog-date {
  margin: 0 0 18px;
  color: #69738a;
  font-size: 13px;
}

.month-next-enter-active,
.month-previous-enter-active {
  transition: transform 300ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 280ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.month-next-leave-active,
.month-previous-leave-active {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.6, 1), opacity 160ms cubic-bezier(0.4, 0, 0.6, 1);
  pointer-events: none;
}

.month-next-enter-from,
.month-previous-leave-to {
  transform: translateY(32px);
  opacity: 0;
}

.month-next-leave-to,
.month-previous-enter-from {
  transform: translateY(-32px);
  opacity: 0;
}

@media (max-width: 850px) {
  .el-header {
    padding: 12px 16px;
  }

  .el-main {
    padding: 14px;
  }

  .quarters-container {
    --week-column: 105px;
  }

  .card-target {
    display: none;
  }

  .compliance-card {
    padding: 12px;
  }

  .day {
    padding: 6px 4px;
  }
}

@media (max-width: 600px) {
  .compliance-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .quarters-container {
    --week-column: 40px;
  }

  .quarter {
    padding: 10px;
  }

  .month-select {
    width: 205px;
  }

  .month-controls {
    gap: 5px;
  }

  .week,
  .weekday-heading {
    padding-left: 4px;
    padding-right: 4px;
    gap: 4px;
  }

  .week-column-title,
  .week-dates,
  .day.weekend .day-status-label {
    display: none;
  }

  .week-days {
    gap: 2px;
  }

  .day {
    padding: 6px 2px;
  }

  .today-label {
    font-size: 8px;
  }
}

@media (max-height: 750px) {
  .el-header {
    min-height: 62px;
    padding-top: 9px;
    padding-bottom: 9px;
  }

  .el-main {
    gap: 10px;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .compliance-card {
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .card-value {
    margin: 2px 0 6px;
    font-size: 25px;
  }

  .quarter {
    padding: 12px;
  }

  .month-heading {
    margin-bottom: 6px;
  }

  .day {
    gap: 4px;
    padding-top: 5px;
    padding-bottom: 5px;
  }

  .week {
    min-height: 52px;
    padding-top: 3px;
    padding-bottom: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .month-next-enter-active,
  .month-next-leave-active,
  .month-previous-enter-active,
  .month-previous-leave-active,
  .day,
  .week,
  .compliance-card {
    transition-duration: 1ms;
  }
}
</style>
