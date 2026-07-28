<h1 align="center">
  <br>
  🚀 mobaXMan
  <br>
</h1>

<h4 align="center">A modern, cross-platform SSH & SFTP Client built with Electron, React, and xterm.js</h4>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#security">Security</a> •
  <a href="#license">License</a>
</p>

---

**mobaXMan** is an elegant, open-source terminal manager designed for developers and sysadmins. It serves as a modern alternative to legacy tools like MobaXterm or PuTTY, combining an extremely fast terminal emulator with a fully-featured SFTP visual browser. 

## ✨ Features

- **💻 Advanced Terminal Emulator**
  - Powered by `xterm.js` for blazing-fast rendering.
  - Built-in search (Ctrl+Shift+F) with Regex, Match Case, and Multi-Highlight support.
  - Auto-colored terminal output for keywords (`error`, `success`, `warn`, etc.).
  - Cosmetic customizations: Change fonts, font size, and apply themes (Dark, Matrix, Dracula, Ubuntu) on the fly.
- **📂 Dual-Pane SFTP Browser**
  - Seamlessly browse your local filesystem and remote server side-by-side.
  - Drag & Drop file transfers!
  - Active transfer manager with progress bars and instant abort functionality.
  - Basic file operations: Rename, Delete, New Folder, and remote `chmod` management.
- **📑 Multi-Tab Interface**
  - Open multiple isolated sessions concurrently.
  - Open multiple tabs for the *same* server with separate underlying SSH connections.
- **🔐 Secure Credential Vault**
  - Your passwords and private keys are never stored in plain text.
  - Integrates with the OS native keychain (via `keytar` / `libsecret` / `Windows Credential Manager`) for absolute security.
  - Local SQLite database for organizing sessions.
- **📝 Session Recording**
  - One-click toggle to record everything printed in the terminal into a local `.log` file.

## 🛠 Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/) + [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Terminal Core**: [xterm.js](https://xtermjs.org/)
- **SSH Protocol**: [ssh2](https://github.com/mscdex/ssh2)
- **Local Database**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Secure Storage**: [keytar](https://github.com/atom/node-keytar)

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- `node-gyp` dependencies for your OS (required to build native modules like SQLite and Keytar).

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/manHax/mobaXMan.git
   cd mobaXMan
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   > **Note:** Because this project uses native Node addons (`better-sqlite3`, `keytar`), they will be automatically rebuilt for Electron's ABI during install. If you face ABI mismatch issues, run: `npx electron-builder install-app-deps`.

3. **Run the app in development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   # Windows
   npm run build:win
   
   # macOS
   npm run build:mac
   
   # Linux
   npm run build:linux
   ```

## ⚡ One-Line Installation

🐧 **Linux / macOS (Bash)**
```bash
curl -sSL https://raw.githubusercontent.com/manHax/mobaXMan/main/install.sh | bash
```

🪟 **Windows (PowerShell)**
```powershell
irm https://raw.githubusercontent.com/manHax/mobaXMan/main/install.ps1 | iex
```

## 🔒 Security First
We take security seriously. **mobaXMan** does NOT sync your servers to any cloud. Everything remains 100% locally on your machine. Passwords and Private Key passphrases are encrypted at rest using your Operating System's native hardware-backed keychain (`keytar`).

## 🤝 Contributing
Contributions, issues, and feature requests are highly welcome! Feel free to check the [issues page](https://github.com/yourusername/mobaXMan/issues).

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
