## Context

The application is a Vue 3/Vite single-page application that stores yearly attendance maps in browser `localStorage` and uses SheetJS in the browser for Excel import and export. It has no backend and does not require network access. The macOS application must preserve browser compatibility while introducing a native application shell, persistent app-data storage, and system file dialogs.

## Goals / Non-Goals

**Goals:**
- Reuse the existing Vue interface and attendance/compliance logic.
- Produce a standalone macOS `.app` through a reproducible local build.
- Keep attendance data local and available across application restarts.
- Use native macOS dialogs for user-initiated Excel import and export.
- Minimize native permissions and prevent arbitrary external navigation.
- Keep the browser build functional through platform-neutral adapters.

**Non-Goals:**
- App Store distribution, notarization automation, or automatic updates.
- Cloud synchronization, user accounts, or a remote backend.
- A SwiftUI rewrite.
- iPhone or iPad packaging on this branch.
- Automatic extraction of browser `localStorage` from Safari or other browsers.

## Decisions

### Use Tauri 2 as the macOS application shell

Tauri will load the existing Vite production build in the macOS system WebView and produce the application bundle. It avoids shipping a complete Chromium runtime and provides a capability-based permission model.

Electron was considered but rejected because its larger bundle and runtime are unnecessary for this local application. A PWA was rejected because it does not provide the desired standalone application bundle or predictable native file handling. SwiftUI was rejected because it would duplicate the existing Vue implementation.

### Introduce platform-neutral storage and file adapters

Vue components will call narrow application services rather than directly calling `localStorage`, browser file inputs, or browser downloads. The browser implementation will retain existing behavior. The Tauri implementation will use native plugins.

```text
Vue attendance UI
        │
        ├── Attendance storage service
        │       ├── Browser localStorage adapter
        │       └── Tauri store adapter
        │
        └── Workbook file service
                ├── Browser upload/download adapter
                └── Tauri dialog + filesystem adapter
```

This boundary prevents Tauri-specific APIs from spreading through calendar and compliance code and keeps the web build usable.

### Persist desktop attendance with the Tauri store plugin

The desktop adapter will store the same year-keyed attendance maps in a JSON-backed Tauri store under the macOS application data directory. Writes will be awaited before reporting success. Read or write failures will be surfaced in the UI and will not replace a valid in-memory attendance map with an empty value.

SQLite was considered but rejected for the first desktop version because the data model is a small set of year-keyed maps and does not need relational queries. The adapter boundary allows migration to SQLite later without changing the UI contract.

### Migrate existing data through Excel import

The desktop app will not attempt to read another browser's sandboxed `localStorage`. The supported migration path is to export the existing web data to Excel and import that workbook through the macOS application. Existing web imports already provide a user-controlled migration mechanism and avoid browser-specific filesystem assumptions.

### Use native dialogs and scoped filesystem permissions

Excel export will generate workbook bytes in JavaScript, ask the user for a destination with the Tauri dialog plugin, and write only to the selected path. Import will ask the user to select an `.xlsx` file and read only the selected file. Cancellation is a normal no-op.

Tauri capabilities will grant only the dialog, store, and selected-file read/write operations required by these flows. Shell execution, arbitrary directory access, and network plugins will not be enabled.

### Validate imported workbook data before mutation

Import will enforce the expected columns, valid ISO dates, and known attendance status labels. Parsed entries will be collected and validated before merging into the current attendance map. Invalid files will leave existing data unchanged and display an actionable error.

### Restrict WebView content

The production application will load packaged assets only. Tauri navigation controls and a restrictive Content Security Policy will prevent unapproved origins from loading in the application window. No secrets or credentials will be embedded because the application has no remote service.

### Build both development and production modes

Development mode will run Vite and open the Tauri window against the local development URL. Production mode will run the Vite build first and package its output. Project scripts will expose explicit desktop development and build commands while retaining existing web commands.

## Risks / Trade-offs

- **[Tauri and Rust increase setup complexity]** → Document installation of Xcode Command Line Tools and Rust, and provide single npm scripts for desktop development and builds.
- **[Native plugin APIs can break browser builds]** → Isolate dynamic Tauri imports behind environment detection and maintain browser adapters.
- **[Existing browser data is not automatically visible]** → Document the web-export/macOS-import migration workflow.
- **[JSON store corruption or write failure could lose recent changes]** → Await writes, retain the previous in-memory state on failure, surface errors, and support Excel backups.
- **[SheetJS dependency may carry security or maintenance concerns]** → Audit the installed dependency before packaging and keep workbook parsing behind a replaceable service boundary.
- **[Unsigned personal builds may trigger Gatekeeper warnings]** → Document local build and opening behavior; signing and notarization remain outside the initial scope.
- **[Desktop layout may not fit small windows]** → Define a practical minimum window size and verify the quarterly layout at that size.

## Migration Plan

1. Add Tauri configuration and minimal capabilities without changing web behavior.
2. Add browser and desktop adapters for storage and workbook files.
3. Route the Vue application through the adapters and verify existing attendance behavior.
4. Build the macOS application and verify persistence across restarts.
5. Export data from the web version and import it into the desktop build.
6. Document personal installation and rollback.

Rollback consists of removing the desktop wrapper and adapter selection while retaining the browser implementation. Attendance can be exported to Excel before rollback and re-imported into the web application.
