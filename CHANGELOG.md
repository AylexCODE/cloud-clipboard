## 1.5.0 - 2026 August 30
### Add
- **Cloud Clipboard: Clear Local Cache** command to manually wipe the offline fallback cache (with a confirmation showing how much is cached) — only affects the local fallback, nothing on the server

## 1.4.1 - 2026 August 29
## Improve
- Paste/delete pickers now also match typed filter text against the description (size/file count/date), and no longer re-sort pinned items out of place while filtering

## 1.4.0 - 2026 August 29
### Add
- Pin/star clipboards from the paste and delete pickers (client-side only — not synced to the server) — pinned items always sort first, and stay first even while filtering

## 1.3.0 - 2026 August 29
### Add
- Offline fallback: if the server is unreachable, paste and delete now fall back to the last-fetched clipboard list/content instead of failing outright, clearly marked as cached and showing how old it is

## 1.2.0 - 2026 August 29
### Add
- Typing empty (or whitespace-only) into "Type a Namespace..." now unsets the active namespace, same as if it had never been set
### Change
- If the namespaceProfiles entry the active namespace came from is edited directly in settings.json, the active namespace now follows: repointed to a new value, it updates automatically; removed entirely (or repointed to blank), it's unset

## 1.1.1 - 2026 August 28
### Add
- Namespace profiles (`cloudclipboard.namespaceProfiles`) for naming and quickly switching between namespaces via the status bar or the new **Cloud Clipboard: Switch Namespace Profile** command
- Explicit `onStartupFinished` activation event, so the extension activates after startup
- Status bar item that opens the namespace switcher
### Change
- Active namespace now lives in extension storage (workspace/global state) instead of the single `cloudclipboard.namespace` setting, so different workspaces can remember different active profiles

## 1.1.0 - 2026 August 27
### Add
- Paste confirmation dialog shows the file count when there are multiple files (e.g. `Paste "name"?` vs. `Paste "name" (3 files)?`)
### Fix
- Progress notification (e.g. "Copy", "Paste", "Delete", "Getting Clipboards...") staying stuck on screen until an info/warning message was dismissed, instead of closing immediately
### Improve
- Automatic compression for clipboard content over 10KB before upload, reducing transfer size and Firestore storage
- Notification and automatic skip for image/binary files during copy (not supported by Cloud Clipboard) — folders/selections with a mix of text and binary files now copy the text files and list what was skipped
- Retry with backoff and a request timeout for copy/paste/delete, with distinct messages for a timed-out vs. unreachable server instead of one generic error

## 1.0.0 - 2026 March 27
### Add
- Control panel UI for managing clipboards when using the default API endpoint (visit extension details for info.)

## 0.4.2 - 2026 March 26
### Fix
- Issue where the paste input field prompt remained visible after pressing enter
- Incorrect file path message display when the paste destination differs from the workspace name
- Delete operation does not cancel automatically if no items are selected

## 0.3.9 - 2026 March 26
### Add
- Loaders to provide real-time transparency during background processes
### Fix
- Incorrect display for the "file size limit" error message
### Improve
- Error message for the "total selected files" to accurately reflect endpoint-specific API constraints

## 0.3.6 - 2026 March 25
### Fix
- Issue where files were saved to the incorrect directory due to a pathing error
### Improve
- Messages for the delete command to provide clearer confirmation

## 0.3.0 - 2026 March 24
### Change
- Clipboard data retrieval path changed to /content

## 0.2.9 - 2026 March 24
### Add
- Validation and error message for exceeding the total file size limit
### Fix
- Spelling for error handling with unique Error IDs for copy/paste failures

## 0.2.7 - 2026 March 24
### Add
- Error handling with unique Error IDs for copy/paste failures
### Change
- ClipboardData Types key from "file" to "path"
### Improve
- Delete command to support bulk deletion of multiple clipboard items at once

## 0.2.4 - 2026 March 23
### Fix
- Force Paste "Always Replace" option is not working

## 0.2.3 - 2026 March 23
### Fix
- Issue where copying a file failed when no editor was active.

## 0.2.2 - 2026 March 23
### Add
- Option to prevent the input box from closing when it loses focus
- Optional confirmation dialog before deleting a clipboard item
- Validation for clipboard names (<= 64 characters)
### Improve
- Clarity of the "no file selected" message in the explorer
- File creation logic and status messaging during paste operations
- Input box UX to include more descriptive titles and prompts

## 0.1.6 - 2026 March 23
### Add
- Overwrite confirmation prompt if a file already exists during paste
- Support for sorting clipboard results

## 0.1.4 - 2026 March 23
### Improve
- Error message for malformed API Endpoint

## 0.1.3 - 2026 March 23
### Add
- Option to paste files directly into a selected directory
### Refactor
- Variables for better code clarity.

## 0.1.1 - 2026 March 23
### Add
- Configuration setting for sorting clipboard results
### Change
- Command contributions.

## 0.1.0 - 2026 March 22
### Add
- Delete clipboard functionality
- Documentation for example usage
### Change
- Icon
### Improve
- Error message descriptions

## 0.0.6 - 2026 March 22
### Add
- Shortcut button to open settings directly from command notifications (if not configured)
### Change
- Icon

## 0.0.5 - 2026 March 22
### Add
- Default Clipboard API endpoint configuration
### Change
- Icon
### Improve
- Error handling and notification messages
### Refactor
- API request handling logic
- Core copy and paste workflow

## 0.0.2 - 2026 March 21
### Add
- Issue where the clipboard paste status was not displaying correctly

## 0.0.1 - 2026 March 21
### Initial release