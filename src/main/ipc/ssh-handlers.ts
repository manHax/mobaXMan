import { ipcMain, BrowserWindow } from 'electron';
import { SSHConnectionManager } from '../ssh/SSHConnectionManager';

export function registerSSHHandlers(window: BrowserWindow, manager: SSHConnectionManager) {
  ipcMain.handle('ssh:connect', async (event, { sessionId, config }) => {
    try {
      await manager.connect(sessionId, config, window);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.on('ssh:disconnect', (event, { sessionId }) => {
    manager.disconnect(sessionId);
  });

  ipcMain.on('ssh:data-out', (event, { sessionId, data }) => {
    manager.write(sessionId, data);
  });

  ipcMain.on('ssh:resize', (event, { sessionId, cols, rows }) => {
    manager.resize(sessionId, cols, rows);
  });

  ipcMain.on('ssh:toggle-logging', (event, { sessionId, enabled }) => {
    manager.toggleLogging(sessionId, enabled);
  });
}
