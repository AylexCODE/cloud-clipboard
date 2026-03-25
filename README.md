<h1 align=center> <img width=72 align=center src="https://raw.githubusercontent.com/AylexCODE/cloud-clipboard/main/img/icon.png" alt="Cloud Clipboard Logo" /> Cloud Clipboard </h1><br />

<div align=center>
   <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" /></a>
   <a href="https://code.visualstudio.com/"><img src="https://img.shields.io/badge/VS%20Code-1.100.0+-blue.svg" /></a>
   <a href="https://marketplace.visualstudio.com/items?itemName=AylexCODE.cloud-clipboard"><img src="https://img.shields.io/visual-studio-marketplace/i/AylexCODE.cloud-clipboard" /></a>
   <!-- <a href="https://marketplace.visualstudio.com/items?itemName=AylexCODE.cloud-clipboard"><img src="https://img.shields.io/visual-studio-marketplace/r/AylexCODE.cloud-clipboard" /></a> -->
   <!-- <a href="https://marketplace.visualstudio.com/items?itemName=AylexCODE.cloud-clipboard"><img src="[https://img.shields.io/badge/VS%20Code-1.100.0+-blue.svg](https://img.shields.io/visual-studio-marketplace/v/AylexCODE.cloud-clipboard" /></a> -->
</div>

<p align=center><i><strong>Cloud Clipboard</strong> is a lightweight tool that lets you copy code in one VS Code instance and paste it instantly in another, across any environment where VS Code runs. Move code snippets, full files, or entire directory structures.</i></p>

## Features

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
      - Enter a **path** to create a new directory for the content.
- **Clipboard Management:** Delete saved clipboards to keep your cloud storage clean.

## Usage
1. **Copy:** Right-click a selection, file, or folder in the Explorer and select **Cloud Clipboard: Copy**.
2. **Paste:**
   - **As Text:** Right-click inside an open file and select **Cloud Clipboard: Paste**.
   - **As Files:** Right-click a folder or empty space in the Explorer and select **Cloud Clipboard: Paste.** Follow the prompt to specify a directory name.
3. **Manage:** Use **Cloud Clipboard: Delete** to remove stored items.

### Limitations
The following limitations apply only when using the default API Endpoint.
- **Permanent Deletion:** Deletions are permanent and cannot be undone. 
- **Total File Size:** The combined size of all selected files must not exceed **1MB**.

<details close>
<summary>Example Usage</summary>
   
### Copy
![copy](https://raw.githubusercontent.com/AylexCODE/cloud-clipboard/main/img/demo/copy.png)

### Paste
![copy](https://raw.githubusercontent.com/AylexCODE/cloud-clipboard/main/img/demo/paste.png)

### Delete
![copy](https://raw.githubusercontent.com/AylexCODE/cloud-clipboard/main/img/demo/delete.png)

</details>

> To keep this tool lightweight, private, free to use, and avoid overloading free-tier resources, **you are encouraged to provide your own API endpoint.**

<details close>

<summary><strong>View Infrastructure & Setup</strong></summary>
   
### Why a Custom Endpoint?
- **Zero Data Logging:** Since you host the backend, your clipboard data never passes through a third-party server.
- **Resource Management:** By setting up your own endpoint (e.g., on a free tier like Render, Railway, or a home Raspberry Pi), you avoid shared rate limits and service "cold starts."
- **Full Control:** You decide how long your clipboard history is stored and who has access.

## Setup & API Configuration

### 1. API Specifications

The client communicates via a RESTful interface. Each request requires a namespace (your private ID) and a clipboard (a specific slot).

### 1.2 API Reference

| Method | Endpoint | Query Parameters | Content-Type | Body | Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/list` | `namespace, sort` | `None` | `None` | Returns an array of available clipboard e.g. [string]. |
| **GET** | `/` | `namespace, clipboard` | `None` | `None` | Returns the content for that clipboard e.g. [{ "path": string, "content": string }] |
| **POST** | `/` | `namespace, clipboard` | `application/json` | `[{"path": string, "content": string}]` | Overwrites the clipboard with the new content body. |
| **DELETE** | `/` | `namespace` | `application/json` | `[string]` | Deletes the items matching the provided body. |

### 2. VS Code Extension Configuration

To link your VS Code extension to your API Endpoint:

1. Open **Settings** (`Ctrl + ,` or `Cmd + ,`).
2. Search for **"Cloud Clipboard"**.
3. Fill in your specific details:
   - **API Endpoint**: `https://example.com`
   - **Connection**: `example`
> **Caution:** Make sure your API Endpoint does not end with a slash `/`.

### 3. Error Handling

To ensure Cloud Clipboard handles issues gracefully, your API should return the following status codes:
- 200 OK: Request successful.
- 400 Bad Request: Missing namespace or clipboard parameters, or invalid body format.
- 500 Internal Server Error: Server-side failure.

</details>

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create.

Any contributions are greatly appreciated.

## License

<p>Distributed under the <a href="https://github.com/AylexCODE/cloud-clipboard/blob/main/LICENSE">MIT License.</a></p>
