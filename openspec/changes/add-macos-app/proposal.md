## Why

The attendance tracker currently requires a browser and development server, which is inconvenient for regular personal use on macOS. A standalone offline macOS application will provide a native launch experience, reliable local persistence, and system file dialogs while preserving the existing Vue functionality.

## What Changes

- Package the existing Vue application as a standalone macOS application using Tauri.
- Preserve the quarterly calendar, attendance statuses, compliance calculations, and dashboard behavior.
- Store attendance records in the macOS application data directory with migration from existing browser data where practical.
- Use native macOS dialogs for Excel import and export.
- Restrict native permissions and external navigation so the application remains offline and local-first.
- Add development, build, and personal-device installation instructions for macOS.

## Capabilities

### New Capabilities
- `macos-desktop-app`: Standalone macOS application packaging, local persistence, native file operations, offline behavior, and personal installation.

### Modified Capabilities

None.

## Impact

- Adds Tauri, Rust, and macOS application configuration to the repository.
- Updates the Vue application to use a platform-neutral persistence and file-operation boundary.
- Changes local data handling for the desktop build while retaining browser compatibility.
- Adds macOS build artifacts, icons, permissions, and documentation.
- Requires Xcode Command Line Tools and the Rust toolchain for local macOS builds.
