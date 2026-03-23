# Cloud Clipboard for VS Code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.100.0+-blue.svg)](https://code.visualstudio.com/)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/AylexCODE.cloud-clipboard)](https://marketplace.visualstudio.com/items?itemName=AylexCODE.cloud-clipboard)
<!-- [![Rating](https://img.shields.io/visual-studio-marketplace/r/AylexCODE.cloud-clipboard)](https://marketplace.visualstudio.com/items?itemName=AylexCODE.cloud-clipboard) -->
<!-- [![Version](https://img.shields.io/visual-studio-marketplace/v/AylexCODE.cloud-clipboard)](https://marketplace.visualstudio.com/items?itemName=AylexCODE.cloud-clipboard) -->

**Cloud Clipboard** is a lightweight tool that lets you copy code in one VS Code instance and paste it instantly in another, across any environment where VS Code runs. Move code snippets, full files, or entire directory structures.

## ✨ Features

- **Instant Sync:** Copy on one instance and paste instantly to another.
- **Multi-Slot Support:** Save multiple snippets to different "slots" in the cloud for better organization.
- **Cross-Platform:** Works wherever VS Code runs, including Windows, macOS, Linux, and VS Code for the Web.
- **Flexible Copying:**
   - **Text:** Copy highlighted snippets directly.
   - **Files:** Copy a single file or select multiple files to cloud-copy.
   - **Folders:** Copy entire folder structures, including multiple folders at once.
- **Smart Pasting:**
   - **As Text:** Paste content directly into your active editor.
   - **As Files:** When pasting content copied from multiple files/folders, the extension automatically switches to file-paste mode.
   - **Smart Routing:** Upon pasting files, you will be prompted for a folder name.
      - Enter a **folder name** to create a new directory for the content.
      - Enter `-` to paste directly into your root directory or the currently selected folder in the explorer.
- **Clipboard Management:** Easily delete saved clipboards to keep your cloud storage clean. (Warning: Deletions are permanent and cannot be undone). 

## 🛠 Usage
1. **Copy:** Right-click a selection, file, or folder in the Explorer and select **Cloud Clipboard: Copy**.
2. **Paste:**
   - **As Text:** Right-click inside an open file and select **Cloud Clipboard: Paste**.
   - **As Files:** Right-click a folder or empty space in the Explorer and select Cloud Clipboard: Paste. Follow the prompt to specify a directory name (or enter - to paste into the current path).
3. **Manage:** Use **Cloud Clipboard: Delete** to remove stored items. 

### Example Usage

### Copy
![copy](https://raw.githubusercontent.com/AylexCODE/cloud-clipboard/main/img/demo/copy.png)

### Paste
![copy](https://raw.githubusercontent.com/AylexCODE/cloud-clipboard/main/img/demo/paste.png)

### Delete
![copy](https://raw.githubusercontent.com/AylexCODE/cloud-clipboard/main/img/demo/delete.png)

## 🛠️ Infrastructure & Setup

To keep this tool lightweight, private, free to use, and avoid overloading free-tier resources, **you are encouraged to provide your own API endpoint.** 

### Why a Custom Endpoint?
- **Zero Data Logging:** Since you host the backend, your clipboard data never passes through a third-party server.
- **Resource Management:** By setting up your own endpoint (e.g., on a free tier like Render, Railway, or a home Raspberry Pi), you avoid shared rate limits and service "cold starts."
- **Full Control:** You decide how long your clipboard history is stored and who has access.

## ⚙️ Setup & API Configuration

### 1. API Specifications

The client communicates via a RESTful interface. Each request requires a namespace (your private ID) and a clipboard (a specific slot).

### 1.2 Data Schema

All data exchanged (except for the /list endpoint) must be a JSON Array of Objects with the following structure:
```javascript
[{ "file": string, "content": string }]
```

| Method | Endpoint | Query Parameters | Content-Type | Action |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | `namespace, clipboard` | `None` | Returns the stored array for that clipboard. |
| **GET** | `/list` | `namespace, sort` | `None` | Returns an array of available clipboard e.g. ["s1", "s2"]. |
| **POST** | `/` | `namespace, clipboard` | `application/json` | Overwrites the clipboard with the new content body. |

### 2. VS Code Extension Configuration

To link your VS Code extension to your API Endpoint:

1. Open **Settings** (`Ctrl + ,` or `Cmd + ,`).
2. Search for **"Cloud Clipboard"**.
3. Fill in your specific details:
   - **API Endpoint**: `https://example.com` (make sure endpoint does not end with a slash)
   - **Connection**: `example`
  
### 3. Error Handling

To ensure Cloud Clipboard handles issues gracefully, your API should return the following status codes:
- 200 OK: Request successful.
- 400 Bad Request: Missing connection or clipboard parameters, or invalid body format.
- 500 Internal Server Error: Server-side failure.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create.

Any contributions are greatly appreciated.

## 📄 License

Distributed under the MIT License.