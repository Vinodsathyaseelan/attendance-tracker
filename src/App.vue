<template>
  <div class="attendance-tracker">
    <el-container>
      <el-header>
        <h1>Attendance Tracker</h1>
        <div class="header-controls">
          <el-select v-model="selectedYear" @change="loadAttendanceData" style="width: 120px; margin-right: 10px">
            <el-option
              v-for="year in years"
              :key="year"
              :label="year"
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
            accept=".xlsx,.xls"
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

        <div class="quarters-container">
          <div v-for="quarter in quarters" :key="quarter.name" class="quarter">
            <h2>{{ quarter.name }} {{ selectedYear }}</h2>
            <div class="months-grid">
              <div v-for="month in quarter.months" :key="month.name" class="month">
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
import { ref, computed, onMounted } from 'vue'
import { Download, Upload, SuccessFilled, CircleCloseFilled, QuestionFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

const statusTypes = [
  { label: 'In-office', value: 'in-office', color: '#67C23A' },
  { label: 'WFH', value: 'wfh', color: '#409EFF' },
  { label: 'PTO', value: 'pto', color: '#E6A23C' },
  { label: 'Sick Leave', value: 'sick', color: '#F56C6C' },
  { label: 'Other Leave', value: 'other-leave', color: '#909399' },
  { label: 'Flexible Time Off', value: 'flexible', color: '#9b59b6' }
]

const currentYear = new Date().getFullYear()
const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]
const selectedYear = ref(currentYear)

const attendanceData = ref({})
const statusDialogVisible = ref(false)
const selectedDay = ref(null)
const selectedStatus = ref('')
const fileInput = ref(null)

const quarters = computed(() => {
  const year = selectedYear.value
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
})

function generateMonthsForQuarter(year, startMonth, endMonth) {
  const months = []
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December']

  for (let m = startMonth; m <= endMonth; m++) {
    const weeks = generateWeeksForMonth(year, m)
    months.push({
      name: monthNames[m],
      weeks
    })
  }

  return months
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
  const now = new Date()
  return now >= week.start && now <= week.end
}

function isToday(date) {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function isFutureDate(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayDate = new Date(date)
  dayDate.setHours(0, 0, 0, 0)
  return dayDate > today
}

function getAttendanceStatus(date) {
  const dateKey = date.toISOString().split('T')[0]
  const status = attendanceData.value[dateKey]
  return statusTypes.find(s => s.value === status) || { color: '#f5f5f5', label: '', value: '' }
}

function selectDay(day) {
  if (day.isWeekend) return
  
  // Disable future dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayDate = new Date(day.date)
  dayDate.setHours(0, 0, 0, 0)
  
  if (dayDate > today) return
  
  selectedDay.value = day
  selectedStatus.value = attendanceData.value[day.date.toISOString().split('T')[0]] || ''
  statusDialogVisible.value = true
}

function saveStatus() {
  if (selectedDay.value) {
    const dateKey = selectedDay.value.date.toISOString().split('T')[0]
    attendanceData.value[dateKey] = selectedStatus.value
    saveAttendanceData()
    statusDialogVisible.value = false
  }
}

function clearStatus() {
  if (selectedDay.value) {
    const dateKey = selectedDay.value.date.toISOString().split('T')[0]
    delete attendanceData.value[dateKey]
    saveAttendanceData()
    selectedStatus.value = ''
    statusDialogVisible.value = false
  }
}

function saveAttendanceData() {
  const key = `attendance_${selectedYear.value}`
  localStorage.setItem(key, JSON.stringify(attendanceData.value))
}

function loadAttendanceData() {
  const key = `attendance_${selectedYear.value}`
  const data = localStorage.getItem(key)
  attendanceData.value = data ? JSON.parse(data) : {}
}

function exportToExcel() {
  const workbook = XLSX.utils.book_new()
  const worksheetData = []

  worksheetData.push(['Date', 'Day', 'Status'])

  Object.keys(attendanceData.value).sort().forEach(dateKey => {
    const [year, month, day] = dateKey.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const status = attendanceData.value[dateKey]
    const statusLabel = statusTypes.find(s => s.value === status)?.label || status

    worksheetData.push([
      dateKey,
      dayNames[date.getDay()],
      statusLabel
    ])
  })

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')

  XLSX.writeFile(workbook, `attendance_${selectedYear.value}.xlsx`)
}

function importFromExcel() {
  fileInput.value.click()
}

function handleFileImport(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    jsonData.forEach((row, index) => {
      if (index === 0) return
      if (row[0] && row[2]) {
        const dateKey = row[0]
        const statusLabel = row[2]
        const status = statusTypes.find(s => s.label === statusLabel)?.value || statusLabel
        attendanceData.value[dateKey] = status
      }
    })

    saveAttendanceData()
    fileInput.value.value = ''
  }
  reader.readAsArrayBuffer(file)
}

function getComplianceStatus(quarterIndex) {
  const year = selectedYear.value
  const quarterMonths = [0, 1, 2].map(m => quarterIndex * 3 + m)
  
  let totalInOfficeDays = 0
  let totalWeeks = 0
  let hasAnyEntry = false
  const now = new Date()
  
  // Determine the current quarter based on today's date
  const currentMonth = now.getMonth()
  const currentQuarter = Math.floor(currentMonth / 3)
  const isCurrentYear = year === now.getFullYear()
  
  quarterMonths.forEach(month => {
    const weeks = generateWeeksForMonth(year, month)
    
    weeks.forEach(week => {
      // For the current quarter of the current year, only include completed weeks or the current week
      if (isCurrentYear && quarterIndex === currentQuarter) {
        const weekEnd = new Date(week.end)
        weekEnd.setHours(23, 59, 59, 999)
        const weekStart = new Date(week.start)
        weekStart.setHours(0, 0, 0, 0)
        
        // Skip if week is entirely in the future
        if (weekStart > now) return
      }
      
      let weekHasEntry = false
      let weekInOfficeDays = 0
      
      week.days.forEach(day => {
        const dateKey = day.date.toISOString().split('T')[0]
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

onMounted(() => {
  loadAttendanceData()
})
</script>

<style scoped>
.attendance-tracker {
  min-height: 100vh;
  background: #f5f7fa;
}

.el-header {
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.el-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-controls {
  display: flex;
  align-items: center;
}

.el-main {
  padding: 20px;
}

.compliance-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.compliance-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
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
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
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
  flex-direction: column;
  gap: 30px;
}

.quarter {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quarter h2 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 20px;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.month {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 15px;
}

.month h3 {
  margin: 0 0 15px 0;
  color: #606266;
  font-size: 16px;
  text-align: center;
}

.weeks-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.week {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
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
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
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
</style>
