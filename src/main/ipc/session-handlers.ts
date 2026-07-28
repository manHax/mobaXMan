import { ipcMain, dialog, BrowserWindow } from 'electron';
import { SessionStore } from '../storage/SessionStore';
import { CredentialStore } from '../storage/CredentialStore';
import { SessionConfig, SessionFolder } from '../../shared/types';
import fs from 'fs';

export function registerSessionHandlers(window: BrowserWindow) {
  const sessionStore = new SessionStore();
  const credentialStore = new CredentialStore();

  ipcMain.handle('session:get-all', () => {
    return sessionStore.getAllSessions();
  });

  ipcMain.handle('session:save', async (event, session: SessionConfig) => {
    if (session.auth.type === 'password' && session.auth.password) {
      await credentialStore.setPassword(session.id, session.auth.password);
      session.auth.password = '';
    } else if (session.auth.type === 'privateKey' && session.auth.passphrase) {
      await credentialStore.setPassphrase(session.id, session.auth.passphrase);
      session.auth.passphrase = '';
    }
    
    sessionStore.saveSession(session);
    return true;
  });

  ipcMain.handle('session:delete', async (event, id: string) => {
    sessionStore.deleteSession(id);
    await credentialStore.deleteAllCredentials(id);
    return true;
  });

  ipcMain.handle('folder:get-all', () => {
    return sessionStore.getAllFolders();
  });

  ipcMain.handle('folder:save', (event, folder: SessionFolder) => {
    sessionStore.saveFolder(folder);
    return true;
  });

  ipcMain.handle('folder:delete', (event, id: string) => {
    sessionStore.deleteFolder(id);
    return true;
  });

  // Import / Export
  ipcMain.handle('session:export', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(window, {
      title: 'Export Sessions',
      defaultPath: 'mobaxman-sessions.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (canceled || !filePath) return false;

    const sessions = sessionStore.getAllSessions();
    const folders = sessionStore.getAllFolders();

    // The passwords are automatically omitted from getAllSessions because they are in keytar
    fs.writeFileSync(filePath, JSON.stringify({ sessions, folders }, null, 2));
    return true;
  });

  ipcMain.handle('session:import', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      title: 'Import Sessions',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) return false;

    try {
      const data = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'));
      if (data.folders) {
        data.folders.forEach((f: SessionFolder) => sessionStore.saveFolder(f));
      }
      if (data.sessions) {
        data.sessions.forEach((s: SessionConfig) => sessionStore.saveSession(s));
      }
      return true;
    } catch (e) {
      console.error('Failed to import sessions', e);
      return false;
    }
  });
}
