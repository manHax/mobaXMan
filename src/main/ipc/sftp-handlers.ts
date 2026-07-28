import { ipcMain, BrowserWindow } from 'electron';
import { SSHConnectionManager } from '../ssh/SSHConnectionManager';

export function registerSFTPHandlers(window: BrowserWindow, manager: SSHConnectionManager) {
  ipcMain.handle('sftp:readdir', async (e, { sessionId, path }) => {
    const sftp = await manager.getSFTPSession(sessionId, window);
    return sftp.readdir(path);
  });
  
  ipcMain.handle('sftp:mkdir', async (e, { sessionId, path }) => {
    const sftp = await manager.getSFTPSession(sessionId, window);
    return sftp.mkdir(path);
  });
  
  ipcMain.handle('sftp:rmdir', async (e, { sessionId, path }) => {
    const sftp = await manager.getSFTPSession(sessionId, window);
    return sftp.rmdir(path);
  });
  
  ipcMain.handle('sftp:rename', async (e, { sessionId, oldPath, newPath }) => {
    const sftp = await manager.getSFTPSession(sessionId, window);
    return sftp.rename(oldPath, newPath);
  });
  
  ipcMain.handle('sftp:unlink', async (e, { sessionId, path }) => {
    const sftp = await manager.getSFTPSession(sessionId, window);
    return sftp.unlink(path);
  });
  
  ipcMain.handle('sftp:chmod', async (e, { sessionId, path, mode }) => {
    const sftp = await manager.getSFTPSession(sessionId, window);
    return sftp.chmod(path, mode);
  });
  
  ipcMain.handle('sftp:upload', async (e, { sessionId, localPath, remotePath, transferId }) => {
    const sftp = await manager.getSFTPSession(sessionId, window);
    return sftp.upload(localPath, remotePath, transferId);
  });
  
  ipcMain.handle('sftp:download', async (e, { sessionId, remotePath, localPath, transferId }) => {
    const sftp = await manager.getSFTPSession(sessionId, window);
    return sftp.download(remotePath, localPath, transferId);
  });
  
  ipcMain.on('sftp:cancel-transfer', async (e, { sessionId, transferId }) => {
    const sftp = await manager.getSFTPSession(sessionId, window);
    sftp.cancelTransfer(transferId);
  });
}
