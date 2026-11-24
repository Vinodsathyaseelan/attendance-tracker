<template>
  <div class="attendance-tracker">
    <el-container>
      <el-header>
        <h1>Attendance Tracker</h1>
        <div class="header-controls">
          <el-select v-model="selectedYear" @change="handleYearChange" aria-label="Calendar year" :disabled="isNavigating || isTransitioning" style="width: 160px; margin-right: 10px">
            <el-option
              v-for="year in years"
              :key="year"
              :label="`Calendar ${year}`"
              :value="year"
            />
          </el-select>
          <el-button type="primary" @click="exportToExcel" :icon="Download">
            Export to Excel
          </el-button>
          <el-button type="success" @click="importFromExcel" :icon="Upload">
            Import from Excel
          </el-button>
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
        <div class="compliance-cards">
          <div class="compliance-card" :class="getComplianceCardClass(0)">
            <div class="card-header">
              <h3>Q1 Compliance</h3>
              <div class="card-icon" :style="{ color: getComplianceIconColor(0) }">
                <SuccessFilled v-if="getComplianceStatus(0) !== 'Not Available' && getComplianceStatus(0).includes('Compliant')" />
                <CircleCloseFilled v-else-if="getComplianceStatus(0) !== 'Not Available'" />
                <QuestionFilled v-else />
              </div>
            </div>
            <div class="card-value">{{ getComplianceStatus(0) }}</div>
          </div>
          <div class="compliance-card" :class="getComplianceCardClass(1)">
            <div class="card-header">
              <h3>Q2 Compliance</h3>
              <div class="card-icon" :style="{ color: getComplianceIconColor(1) }">
                <SuccessFilled v-if="getComplianceStatus(1) !== 'Not Available' && getComplianceStatus(1).includes('Compliant')" />
                <CircleCloseFilled v-else-if="getComplianceStatus(1) !== 'Not Available'" />
                <QuestionFilled v-else />
              </div>
            </div>
            <div class="card-value">{{ getComplianceStatus(1) }}</div>
          </div>
          <div class="compliance-card" :class="getComplianceCardClass(2)">
            <div class="card-header">
              <h3>Q3 Compliance</h3>
              <div class="card-icon" :style="{ color: getComplianceIconColor(2) }">
                <SuccessFilled v-if="getComplianceStatus(2) !== 'Not Available' && getComplianceStatus(2).includes('Compliant')" />
                <CircleCloseFilled v-else-if="getComplianceStatus(2) !== 'Not Available'" />
                <QuestionFilled v-else />
              </div>
            </div>
            <div class="card-value">{{ getComplianceStatus(2) }}</div>
          </div>
          <div class="compliance-card" :class="getComplianceCardClass(3)">
            <div class="card-header">
              <h3>Q4 Compliance</h3>
              <div class="card-icon" :style="{ color: getComplianceIconColor(3) }">
                <SuccessFilled v-if="getComplianceStatus(3) !== 'Not Available' && getComplianceStatus(3).includes('Compliant')" />
                <CircleCloseFilled v-else-if="getComplianceStatus(3) !== 'Not Available'" />
                <QuestionFilled v-else />
              </div>
            </div>
            <div class="card-value">{{ getComplianceStatus(3) }}</div>
          </div>
        </div>

        <div class="status-legend">
          <span class="legend-item" v-for="status in statusTypes" :key="status.value">
            <span class="legend-color" :style="{ backgroundColor: status.color }"></span>
            {{ status.label }}
          </span>
        </div>

        <div class="quarters-container" @wheel="handleCalendarWheel">
          <div class="calendar-navigation">
            <el-button @click="navigateMonth(-1)" :disabled="isNavigating || isTransitioning || selectedYear === years[0] && activeMonthIndex === 0">Previous month</el-button>
            <el-select v-model="activeMonthIndex" aria-label="Displayed month" style="width: 280px" :disabled="isNavigating || isTransitioning">
              <el-option v-for="(page, index) in pages" :key="index" :label="page.label" :value="index" />
            </el-select>
            <el-button @click="navigateMonth(1)" :disabled="isNavigating || isTransitioning || selectedYear === years[years.length - 1] && activeMonthIndex === pages.length - 1">Next month</el-button>
            <el-button @click="showToday" :disabled="isNavigating || isTransitioning">Today</el-button>
            <span class="navigation-hint">Scroll here or use ↑ / ↓ to change month</span>
          </div>
          <Transition :name="monthTransition" mode="out-in" @before-leave="isTransitioning = true" @after-enter="isTransitioning = false" @enter-cancelled="isTransitioning = false">
          <div v-if="visibleQuarter" :key="`${selectedYear}-${activeMonthIndex}`" class="quarter" v-loading="isNavigating">
            <h2>{{ visibleQuarter.name }} {{ selectedYear }}</h2>
            <div class="months-grid">
              <div v-for="month in visibleQuarter.months" :key="month.name" class="month">
                <h3>{{ month.name }}</h3>
                <div class="weeks-grid">
                  <div
                    v-for="week in month.weeks"
                    :key="week.start"
                    class="week"
                    :class="{ 'current-week': isCurrentWeek(week) }"
                  >
                    <div class="week-label">W{{ week.number }}</div>
                    <div class="week-dates">{{ formatDateRange(week.start, week.end) }}</div>
                    <div class="week-days">
                      <div
                        v-for="day in week.days"
                        :key="day.date"
                        class="day"
                        :class="{ 
                          'weekend': day.isWeekend, 
                          'today': isToday(day.date),
                          'other-month': !day.isCurrentMonth,
                          'future-date': isFutureDate(day.date)
                        }"
                        @click="selectDay(day)"
                      >
                        <div class="day-number">{{ day.dayNumber }}</div>
                        <el-tooltip :content="getAttendanceStatus(day.date).label" placement="top" :disabled="!getAttendanceStatus(day.date).value">
                          <div
                            class="day-status"
                            :style="{ backgroundColor: getAttendanceStatus(day.date).color }"
                          ></div>
                        </el-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </Transition>
        </div>
      </el-main>
    </el-container>

    <el-dialog v-model="statusDialogVisible" title="Update Attendance" width="300px">
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
import { dateKey as localDateKey, calendarYearForDate, generateFiscalQuarters, numberQuarterWeeks, isFutureDay, isWorkWeekComplete, startDayRefresh } from './services/calendar'
import { ElMessage } from 'element-plus'
import { Download, Upload, SuccessFilled, CircleCloseFilled, QuestionFilled } from '@element-plus/icons-vue'
import { loadCalendarAttendance, saveCalendarAttendance } from './services/attendanceStorage'
import { isTauri } from './services/platform'
import { createAttendanceWorkbook, parseAttendanceWorkbook } from './services/workbook'
import { exportWorkbook, importWorkbook } from './services/workbookFiles'

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
  
  if (status.includes('Compliant')) {
    return 'compliant'
  }
  
  return 'not-compliant'
}

function getComplianceCardClass(quarterIndex) {
  const status = getComplianceStatus(quarterIndex)
  
  if (status === 'Not Available') {
    return 'card-na'
  }
  
  if (status.includes('Compliant')) {
    return 'card-compliant'
  }
  
  return 'card-not-compliant'
}

function getComplianceIcon(quarterIndex) {
  const status = getComplianceStatus(quarterIndex)
  
  if (status === 'Not Available') {
    return QuestionFilled
  }
  
  if (status.includes('Compliant')) {
    return SuccessFilled
  }
  
  return CircleCloseFilled
}

function getComplianceIconColor(quarterIndex) {
  const status = getComplianceStatus(quarterIndex)
  
  if (status === 'Not Available') {
    return '#909399'
  }
  
  if (status.includes('Compliant')) {
    return '#67c23a'
  }
  
  return '#f56c6c'
}

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
  width: 100%;
  height: 100dvh;
  background: #f5f7fa;
}

.attendance-tracker :deep(*) {
  box-sizing: border-box;
}

.el-container {
  height: 100%;
  min-width: 0;
}

.el-header {
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  flex-shrink: 0;
  gap: 10px;
  height: auto;
  min-height: 56px;
  padding: 10px 16px;
}

.el-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
}

.header-controls .el-button + .el-button {
  margin-left: 0;
}

.el-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
  padding: 12px;
  overflow: auto;
}

.compliance-cards {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.compliance-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border-left: 4px solid #dcdfe6;
}

.compliance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.card-icon {
  font-size: 24px;
}

.card-value {
  font-size: 20px;
  font-weight: bold;
  color: #606266;
}

.card-na {
  border-left-color: #909399;
}

.card-na .card-value {
  color: #909399;
}

.card-compliant {
  border-left-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #fff 100%);
}

.card-compliant .card-value {
  color: #67c23a;
}

.card-not-compliant {
  border-left-color: #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
}

.card-not-compliant .card-value {
  color: #f56c6c;
}

.status-legend {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  gap: 8px 16px;
  padding: 10px 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.quarters-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 12px;
}

.calendar-navigation {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.navigation-hint {
  color: #606266;
  font-size: 13px;
}

.calendar-navigation .el-button + .el-button {
  margin-left: 0;
}

.quarter {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quarter h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 20px;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
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
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 8px;
}

.month h3 {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 16px;
  text-align: center;
}

.weeks-grid {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.week {
  display: grid;
  flex: 1 0 auto;
  min-width: 0;
  grid-template-columns: 45px 130px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 4px 8px;
  transition: all 0.3s;
}

.week:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.week.current-week {
  border-color: #67c23a;
  background: #f0f9ff;
}

.week-label {
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.week-dates {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.week-days {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 2px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.day:hover:not(.weekend) {
  background: #ecf5ff;
}

.day.weekend {
  opacity: 0.5;
  cursor: not-allowed;
}

.day.other-month {
  opacity: 0.6;
}

.day.future-date {
  opacity: 0.4;
  cursor: not-allowed;
}

.day.today {
  border: 2px solid #409eff;
}

.day-number {
  font-size: 12px;
  color: #606266;
  margin-bottom: 2px;
}

.day-status {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #dcdfe6;
  transition: all 0.2s;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}
.month-next-enter-active,
.month-previous-enter-active {
  transition: transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 240ms ease;
}

.month-next-leave-active,
.month-previous-leave-active {
  transition: transform 160ms ease-in, opacity 160ms ease-in;
  pointer-events: none;
}

.month-next-enter-from,
.month-previous-leave-to {
  transform: translateY(24px);
  opacity: 0;
}

.month-next-leave-to,
.month-previous-enter-from {
  transform: translateY(-24px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .month-next-enter-active,
  .month-next-leave-active,
  .month-previous-enter-active,
  .month-previous-leave-active {
    transition-duration: 1ms;
  }
}

@media (max-width: 700px) {
  .compliance-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .week {
    grid-template-columns: 45px minmax(0, 1fr);
    gap: 4px;
  }

  .week-dates {
    text-align: right;
    margin: 0;
  }

  .week-days {
    grid-column: 1 / -1;
  }

  .card-value {
    font-size: 16px;
  }
}

@media (max-height: 750px) {
  .el-main {
    gap: 8px;
    padding: 8px;
  }

  .compliance-card {
    padding: 8px 10px;
  }

  .card-header {
    margin-bottom: 4px;
  }

  .card-value {
    font-size: 17px;
  }

  .status-legend {
    padding: 6px 10px;
  }

  .quarters-container {
    gap: 8px;
  }

  .quarter {
    padding: 8px;
  }

  .navigation-hint {
    font-size: 12px;
  }
}
</style>
