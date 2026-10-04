# Attendance Tracker

A modern web-based attendance tracking application built with Vue 3 and Element Plus. Track your daily attendance with an intuitive quarterly view, mark status for each day, and export data to Excel.

![Attendance Tracker Overview](docs/screenshots/overview.png)

![Compliance Cards](docs/screenshots/compliance-cards.png)

## Features

- **Quarterly View**: Visualize attendance across all four quarters of the year
- **Daily Tracking**: Mark attendance status for each individual day
- **Multiple Status Types**: Track In-office, WFH, PTO, Sick Leave, Other Leave, and Flexible Time Off
- **Compliance Tracking**: Monitor quarterly compliance with average in-office days per week
- **Card-Based Compliance Display**: Visual cards for each quarter with status indicators
- **Date Restrictions**: Future dates and weekends are disabled for attendance entry
- **Local Storage**: All data is saved locally in your browser
- **Excel Export**: Export attendance data to Excel spreadsheets
- **Excel Import**: Import existing Excel data to update the tracker
- **Year Selection**: Switch between different years
- **Visual Indicators**: 
  - Current week highlighting
  - Today's date marking
  - Color-coded status with hover tooltips
  - Weekend differentiation
  - Compliance status icons (checkmark, X, question mark)

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Element Plus** - Vue 3 UI component library
- **Vite** - Next generation frontend tooling
- **XLSX** - Excel file generation and parsing

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

#### macOS

1. **Install Node.js** (if not already installed):
   ```bash
   # Using Homebrew
   brew install node
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/Vinodsathyaseelan/attendance-tracker.git
   cd attendance-tracker
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

#### Windows

1. **Install Node.js** (if not already installed):
   - Download the installer from [nodejs.org](https://nodejs.org/)
   - Run the installer and follow the prompts
   - Restart your terminal/command prompt after installation

2. **Clone the repository**:
   ```bash
   git clone https://github.com/Vinodsathyaseelan/attendance-tracker.git
   cd attendance-tracker
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

#### Linux (Ubuntu/Debian)

1. **Install Node.js** (if not already installed):
   ```bash
   # Using NodeSource repository
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Or using package manager (may have older version)
   sudo apt-get update
   sudo apt-get install -y nodejs npm
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/Vinodsathyaseelan/attendance-tracker.git
   cd attendance-tracker
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

#### Linux (Fedora/RHEL)

1. **Install Node.js** (if not already installed):
   ```bash
   # Using NodeSource repository
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs

   # Or using dnf
   sudo dnf install nodejs npm
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/Vinodsathyaseelan/attendance-tracker.git
   cd attendance-tracker
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## Usage

### Compliance Tracking

The application displays compliance status for each quarter (Q1-Q4) in a card layout:

- **Compliance Calculation**: Based on average in-office days per week (target: 3+ days)
- **Current Year, Current Quarter**: Shows compliance for completed weeks and the current week only
- **Current Year, Past Quarters**: Shows compliance for all weeks with attendance entries
- **Past/Future Years**: Shows compliance for all weeks with attendance entries
- **Status Indicators**:
  - ✅ Green card with checkmark: Compliant (average ≥ 3 in-office days/week)
  - ❌ Red card with X: Not Compliant (average < 3 in-office days/week)
  - ❓ Gray card with question mark: Not Available (no attendance entries)
- Only In-office days count toward compliance calculation

### Marking Attendance

1. Click on any day (except weekends) to open the status selector
2. Select your attendance status from the dropdown
3. The status is automatically saved to local storage

### Exporting to Excel

1. Click the "Export to Excel" button in the header
2. An Excel file named `attendance_YYYY.xlsx` will be downloaded
3. The file contains columns: Date, Day, and Status

### Importing from Excel

1. Click the "Import from Excel" button in the header
2. Select an existing Excel file
3. The attendance data will be merged with your current data

### Switching Years

Use the year dropdown in the header to switch between different years. Each year's data is stored separately in local storage.

## Status Types

| Status | Color | Description |
|--------|-------|-------------|
| In-office | Green | Working from office |
| WFH | Blue | Working from home |
| PTO | Orange | Paid time off |
| Sick Leave | Red | Sick leave |
| Other Leave | Gray | Other types of leave |
| Flexible Time Off | Purple | Flexible time off |

## Project Structure

```
attendance-tracker/
├── public/
├── src/
│   ├── components/
│   ├── App.vue
│   └── main.js
├── docs/
│   ├── screenshots/
│   └── USER_GUIDE.md
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Data Storage

All attendance data is stored in your browser's local storage under the key `attendance_YYYY` (where YYYY is the year). Data is persisted between sessions and is specific to each year.

## Excel Format

The exported Excel file follows this format:

| Date | Day | Status |
|------|-----|--------|
| 2026-10-01 | Thursday | In-office |
| 2026-10-02 | Friday | WFH |
| 2026-10-05 | Monday | In-office |

When importing, the application matches dates and updates the corresponding status.

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with local storage support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Vue.js](https://vuejs.org/)
- UI components from [Element Plus](https://element-plus.org/)
- Excel handling by [SheetJS](https://sheetjs.com/)
