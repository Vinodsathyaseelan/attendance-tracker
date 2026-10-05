## 1. Baseline and Desktop Tooling

- [x] 1.1 Verify the existing web production build and record any pre-existing warnings
- [x] 1.2 Audit current npm dependencies, especially spreadsheet processing, and resolve blocking security findings without weakening package security controls
- [x] 1.3 Add Tauri 2 CLI and required dialog, filesystem, and store dependencies using vetted stable versions
- [x] 1.4 Initialize the Tauri macOS project with Vite development and production build commands
- [x] 1.5 Configure the application identifier, window title, minimum window size, icons, and macOS bundle metadata

## 2. Platform Service Boundaries

- [x] 2.1 Add a platform detector that distinguishes browser and Tauri execution without breaking the web build
- [x] 2.2 Extract attendance persistence behind an asynchronous storage service interface
- [x] 2.3 Implement and verify the browser localStorage adapter with unchanged year-keyed behavior
- [x] 2.4 Implement the Tauri store adapter with awaited writes and non-destructive read/write error handling
- [x] 2.5 Update the Vue application to load and save attendance through the storage service

## 3. Native Excel File Operations

- [x] 3.1 Extract workbook generation and parsing into testable functions independent of browser DOM APIs
- [x] 3.2 Add workbook validation for expected columns, ISO dates, known statuses, and invalid-file error reporting
- [x] 3.3 Implement and verify browser import/export adapters that preserve current behavior
- [x] 3.4 Implement native macOS export with a save dialog and scoped write access to the selected `.xlsx` path
- [x] 3.5 Implement native macOS import with an open dialog and scoped read access to the selected `.xlsx` file
- [x] 3.6 Verify canceled native dialogs leave files and attendance data unchanged
- [x] 3.7 Verify web-exported attendance imports into the macOS application and persists after restart

## 4. Security and Reliability

- [x] 4.1 Configure minimal Tauri capabilities for store, dialog, and user-selected file access only
- [x] 4.2 Configure a restrictive Content Security Policy and block unapproved external navigation
- [x] 4.3 Confirm the desktop application makes no attendance-related network requests during normal use
- [x] 4.4 Verify storage and invalid-workbook failures preserve existing in-memory and persisted attendance
- [x] 4.5 Verify attendance selection, clearing, year switching, completed-week compliance, and current-week navigation in the desktop build

## 5. Packaging and Documentation

- [x] 5.1 Add npm scripts for Tauri development and production macOS builds while retaining existing web scripts
- [x] 5.2 Build the production web assets and macOS application bundle with no compile or configuration errors
- [x] 5.3 Launch the packaged application offline and verify attendance persists across application and Mac restarts
- [x] 5.4 Document macOS prerequisites, development commands, personal installation, Gatekeeper behavior, data location, backup, and browser-to-desktop migration
- [x] 5.5 Run the final web build, automated tests, dependency audit, and Tauri production build, documenting any non-blocking warnings
