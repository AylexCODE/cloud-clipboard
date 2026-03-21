# Cloud Clipboard - Copy & Paste Text Anywhere!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.100.0+-blue.svg)](https://code.visualstudio.com/)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/AylexCODE.cloud-clipboard)](https://marketplace.visualstudio.com/items?itemName=AylexCODE.cloud-clipboard)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/AylexCODE.cloud-clipboard)](https://marketplace.visualstudio.com/items?itemName=AylexCODE.cloud-clipboard)
<!-- [![Version](https://img.shields.io/visual-studio-marketplace/v/AylexCODE.cloud-clipboard)](https://marketplace.visualstudio.com/items?itemName=AylexCODE.cloud-clipboard) -->

**Cloud Clipboard** is a lightweight tool that lets you copy code in one VS Code instance and paste it instantly in another, across different machines, OSs, or networks. No more emailing links to yourself or using messaging apps as temporary storage.

## ✨ Features

Code instance and paste it instantly in another—across different machines, OSs, or networks.

- **Instant Sync:** Copy on your desktop, paste on your laptop.
- **Multi-Slot Support:** Save multiple snippets to different "slots" in the cloud.
- **Cross-Platform:** Works wherever VS Code runs (Windows, macOS, Linux, and Web).

## 🛠️ Infrastructure & Setup

To keep this tool lightweight, private, and free to use, **you must provide your own API endpoint.** 

### Why a Custom Endpoint?
- **Zero Data Logging:** Since you host the backend, your clipboard data never passes through a third-party server.
- **Resource Management:** By setting up your own endpoint (e.g., on a free tier like Render, Railway, or a home Raspberry Pi), you avoid shared rate limits and service "cold starts."
- **Full Control:** You decide how long your clipboard history is stored and who has access.

## ⚙️ Setup & API Configuration

To keep this tool private and avoid overloading free-tier resources, **you must provide your own API endpoint**. The client communicates using a simple RESTful interface that handles raw text and uses a `connection` parameter to identify your specific clipboard.

### 1. API Specifications

Your endpoint must support **Plain Text** (no JSON wrappers) and use a query parameter to identify the specific **data channel** you wish to access.


| Method | Endpoint Example | Content-Type | Action |
| :--- | :--- | :--- | :--- |
| **GET** | `?connection=1` | `text/plain` | Returns the stored content for connection `1`. |
| **POST** | `?connection=1` | `text/plain` | Overwrites the content for connection `1` with the request body. |

### 2. VS Code Extension Configuration

To link your VS Code extension to your API Endpoint:

1. Open **Settings** (`Ctrl + ,` or `Cmd + ,`).
2. Search for **"Cloud Clipboard"**.
3. Fill in your specific details:
   - **API Endpoint**: `https://example.com`

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create.

Any contributions are greatly appreciated.

## 📄 License

Distributed under the MIT License.