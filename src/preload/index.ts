import { contextBridge, ipcRenderer } from 'electron';
import { SessionConfig } from '../shared/types';

contextBridge.exposeInMainWorld('api', {
  ssh: {
    connect: (sessionId: string, config: SessionConfig) => ipcRenderer.invoke('ssh:connect', { sessionId, config }),
    disconnect: (sessionId: string) => ipcRenderer.send('ssh:disconnect', { sessionId }),
    write: (sessionId: string, data: string) => ipcRenderer.send('ssh:data-out', { sessionId, data }),
    resize: (sessionId: string, cols: number, rows: number) => ipcRenderer.send('ssh:resize', { sessionId, cols, rows }),
    toggleLogging: (sessionId: string, enabled: boolean) => ipcRenderer.send('ssh:toggle-logging', { sessionId, enabled }),
    onData: (callback: (sessionId: string, data: string) => void) => {
      ipcRenderer.on('ssh:data-in', (_event, { sessionId, data }) => callback(sessionId, data));
    },
    onError: (callback: (sessionId: string, error: string) => void) => {
      ipcRenderer.on('ssh:error', (_event, { sessionId, error }) => callback(sessionId, error));
    },
    onClose: (callback: (sessionId: string) => void) => {
      ipcRenderer.on('ssh:close', (_event, { sessionId }) => callback(sessionId));
    }
  },
  sessions: {
    getAll: () => ipcRenderer.invoke('session:get-all'),
    save: (session: SessionConfig) => ipcRenderer.invoke('session:save', session),
    delete: (id: string) => ipcRenderer.invoke('session:delete', id),
    getAllFolders: () => ipcRenderer.invoke('folder:get-all'),
    saveFolder: (folder: any) => ipcRenderer.invoke('folder:save', folder),
    deleteFolder: (id: string) => ipcRenderer.invoke('folder:delete', id),
    exportSessions: () => ipcRenderer.invoke('session:export'),
    importSessions: () => ipcRenderer.invoke('session:import'),
  },
  sftp: {
    readdir: (sessionId: string, path: string) => ipcRenderer.invoke('sftp:readdir', { sessionId, path }),
    mkdir: (sessionId: string, path: string) => ipcRenderer.invoke('sftp:mkdir', { sessionId, path }),
    rmdir: (sessionId: string, path: string) => ipcRenderer.invoke('sftp:rmdir', { sessionId, path }),
    rename: (sessionId: string, oldPath: string, newPath: string) => ipcRenderer.invoke('sftp:rename', { sessionId, oldPath, newPath }),
    unlink: (sessionId: string, path: string) => ipcRenderer.invoke('sftp:unlink', { sessionId, path }),
    chmod: (sessionId: string, path: string, mode: string | number) => ipcRenderer.invoke('sftp:chmod', { sessionId, path, mode }),
    upload: (sessionId: string, localPath: string, remotePath: string, transferId: string) => ipcRenderer.invoke('sftp:upload', { sessionId, localPath, remotePath, transferId }),
    download: (sessionId: string, remotePath: string, localPath: string, transferId: string) => ipcRenderer.invoke('sftp:download', { sessionId, remotePath, localPath, transferId }),
    cancelTransfer: (sessionId: string, transferId: string) => ipcRenderer.send('sftp:cancel-transfer', { sessionId, transferId }),
    onProgress: (callback: (transferId: string, transferred: number, total: number) => void) => {
      ipcRenderer.on('sftp:progress', (_event, { transferId, transferred, total }) => callback(transferId, transferred, total));
    }
  },
  localFs: {
    homedir: () => ipcRenderer.invoke('localFs:homedir'),
    readdir: (dir: string) => ipcRenderer.invoke('localFs:readdir', dir),
    mkdir: (dir: string) => ipcRenderer.invoke('localFs:mkdir', dir),
    rmdir: (dir: string) => ipcRenderer.invoke('localFs:rmdir', dir),
    unlink: (file: string) => ipcRenderer.invoke('localFs:unlink', file),
    rename: (oldP: string, newP: string) => ipcRenderer.invoke('localFs:rename', oldP, newP)
  },
  version: process.versions.electron,
});
