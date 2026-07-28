import { ipcMain } from 'electron';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';

export function registerLocalFSHandlers() {
  ipcMain.handle('localFs:homedir', () => os.homedir());

  ipcMain.handle('localFs:readdir', async (e, dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const list = await Promise.all(entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      try {
        const stat = await fs.stat(fullPath);
        return {
          name: entry.name,
          isDir: stat.isDirectory(),
          size: stat.size,
          modifyTime: stat.mtimeMs,
          permissions: (stat.mode & parseInt('777', 8)).toString(8)
        };
      } catch (err) {
        return { name: entry.name, isDir: entry.isDirectory(), size: 0, modifyTime: 0, permissions: '000' };
      }
    }));
    return list.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
  });

  ipcMain.handle('localFs:mkdir', (e, dir) => fs.mkdir(dir));
  ipcMain.handle('localFs:rmdir', (e, dir) => fs.rm(dir, { recursive: true, force: true }));
  ipcMain.handle('localFs:unlink', (e, file) => fs.unlink(file));
  ipcMain.handle('localFs:rename', (e, oldP, newP) => fs.rename(oldP, newP));
}
