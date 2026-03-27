## 1.4.2 - 2026 March 27
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