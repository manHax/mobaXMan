import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { registerSSHHandlers } from './ipc/ssh-handlers';
import { registerSessionHandlers } from './ipc/session-handlers';
import { registerSFTPHandlers } from './ipc/sftp-handlers';
import { registerLocalFSHandlers } from './ipc/local-fs-handlers';
import { SSHConnectionManager } from './ssh/SSHConnectionManager';

let mainWindow: BrowserWindow | null = null;
const sshManager = new SSHConnectionManager();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  registerSSHHandlers(mainWindow, sshManager);
  registerSessionHandlers(mainWindow);
  registerSFTPHandlers(mainWindow, sshManager);
  registerLocalFSHandlers();

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
