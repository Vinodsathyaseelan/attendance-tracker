## Purpose

Defines the observable behavior of the standalone, offline macOS attendance application, including persistence, native spreadsheet file operations, and secure local execution.

## ADDED Requirements

### Requirement: Standalone macOS launch
The system SHALL provide a macOS application that launches the attendance tracker without requiring the user to start a development server or open a browser manually.

#### Scenario: Launch from Finder
- **WHEN** the user opens the macOS application from Finder or Launchpad
- **THEN** the attendance tracker SHALL open in its own application window

#### Scenario: Offline launch
- **WHEN** the Mac has no network connection
- **THEN** the application SHALL launch and provide attendance tracking functionality

### Requirement: Existing attendance behavior
The macOS application SHALL preserve the existing quarterly calendar, attendance status selection, compliance calculation, year selection, and dashboard behavior.

#### Scenario: Record attendance
- **WHEN** the user assigns an attendance status to an eligible date
- **THEN** the macOS application SHALL display and retain that status using the same rules as the web application

#### Scenario: Calculate compliance
- **WHEN** attendance exists for completed work weeks
- **THEN** the macOS application SHALL calculate quarterly compliance using the same completed-week rules as the web application

### Requirement: Persistent local attendance data
The system SHALL persist attendance records locally so they remain available after the application is closed, reopened, or the Mac is restarted.

#### Scenario: Reopen application
- **WHEN** the user closes and later reopens the application
- **THEN** all previously saved attendance records SHALL be restored

#### Scenario: Storage failure
- **WHEN** local attendance data cannot be read or written
- **THEN** the application SHALL preserve the last usable in-memory state and inform the user without silently discarding records

### Requirement: Browser data migration
The macOS application SHALL provide a documented migration path for attendance data previously stored by the browser version.

#### Scenario: Import web attendance export
- **WHEN** the user selects a valid Excel export from the web application
- **THEN** the macOS application SHALL import and persist the attendance records

### Requirement: Native Excel export
The macOS application SHALL allow the user to export attendance records to an `.xlsx` file using a native macOS save or share workflow.

#### Scenario: Successful export
- **WHEN** the user chooses Export and confirms a destination
- **THEN** the application SHALL write a valid Excel file containing the date, correct weekday, and attendance status

#### Scenario: Cancel export
- **WHEN** the user cancels the native save workflow
- **THEN** the application SHALL not create a file or alter attendance data

### Requirement: Native Excel import
The macOS application SHALL use a native macOS file-selection workflow to import attendance from a validated `.xlsx` file.

#### Scenario: Successful import
- **WHEN** the user selects a valid attendance workbook
- **THEN** the application SHALL merge the validated entries and persist the updated attendance data

#### Scenario: Invalid workbook
- **WHEN** the selected file is not a supported workbook or contains invalid attendance values
- **THEN** the application SHALL reject invalid entries and report the problem without corrupting existing data

### Requirement: Local-first security
The macOS application SHALL operate without external network services and SHALL expose only the native capabilities required for local persistence and user-initiated file operations.

#### Scenario: Normal operation
- **WHEN** the user tracks attendance, views compliance, imports, or exports data
- **THEN** the application SHALL not transmit attendance data over the network

#### Scenario: External navigation attempt
- **WHEN** application content attempts to navigate to an unapproved external origin
- **THEN** the application SHALL block the navigation

### Requirement: Personal macOS installation
The project SHALL provide documented steps to build and install the application on the user's Mac for personal use.

#### Scenario: Local production build
- **WHEN** the documented prerequisites are installed and the user runs the macOS build command
- **THEN** the build SHALL produce an installable macOS application bundle
