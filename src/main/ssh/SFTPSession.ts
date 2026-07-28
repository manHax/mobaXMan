import fs from 'fs';
import { BrowserWindow } from 'electron';
import { FileItem } from '../../shared/types';
import { SFTPWrapper } from 'ssh2';

export class SFTPSession {
  private activeTransfers = new Map<string, { abort: () => void }>();

  constructor(private sftp: SFTPWrapper, private sessionId: string, private window: BrowserWindow) {}

  readdir(remotePath: string): Promise<FileItem[]> {
    return new Promise((resolve, reject) => {
      this.sftp.readdir(remotePath, (err, list) => {
        if (err) return reject(err);
        const files: FileItem[] = list.map(item => ({
          name: item.filename,
          isDir: item.attrs.isDirectory(),
          size: item.attrs.size,
          modifyTime: item.attrs.mtime * 1000,
          permissions: (item.attrs.mode & parseInt('777', 8)).toString(8)
        }));
        // Sort: dirs first
        files.sort((a, b) => {
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name);
        });
        resolve(files);
      });
    });
  }

  mkdir(remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => this.sftp.mkdir(remotePath, err => err ? reject(err) : resolve()));
  }

  rmdir(remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => this.sftp.rmdir(remotePath, err => err ? reject(err) : resolve()));
  }

  rename(oldPath: string, newPath: string): Promise<void> {
    return new Promise((resolve, reject) => this.sftp.rename(oldPath, newPath, err => err ? reject(err) : resolve()));
  }

  unlink(remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => this.sftp.unlink(remotePath, err => err ? reject(err) : resolve()));
  }

  chmod(remotePath: string, mode: string | number): Promise<void> {
    return new Promise((resolve, reject) => this.sftp.chmod(remotePath, mode, err => err ? reject(err) : resolve()));
  }

  upload(localPath: string, remotePath: string, transferId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let aborted = false;
      const readStream = fs.createReadStream(localPath);
      const writeStream = this.sftp.createWriteStream(remotePath);
      
      const stat = fs.statSync(localPath);
      const total = stat.size;
      let transferred = 0;

      readStream.on('data', (chunk: any) => {
        transferred += chunk.length;
        this.window.webContents.send('sftp:progress', { transferId, transferred, total });
      });

      this.activeTransfers.set(transferId, {
        abort: () => {
          aborted = true;
          readStream.destroy();
          writeStream.destroy();
          reject(new Error('Cancelled'));
        }
      });

      readStream.pipe(writeStream);
      writeStream.on('close', () => {
        this.activeTransfers.delete(transferId);
        if (!aborted) resolve();
      }).on('error', (err: Error) => {
        this.activeTransfers.delete(transferId);
        reject(err);
      });
    });
  }

  download(remotePath: string, localPath: string, transferId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let aborted = false;
      
      this.sftp.stat(remotePath, (err, stats) => {
        if (err) return reject(err);
        
        const total = stats.size;
        let transferred = 0;

        const readStream = this.sftp.createReadStream(remotePath);
        const writeStream = fs.createWriteStream(localPath);
        
        readStream.on('data', (chunk: any) => {
          transferred += chunk.length;
          this.window.webContents.send('sftp:progress', { transferId, transferred, total });
        });

        this.activeTransfers.set(transferId, {
          abort: () => {
            aborted = true;
            readStream.destroy();
            writeStream.destroy();
            try { fs.unlinkSync(localPath); } catch (e) {} // cleanup
            reject(new Error('Cancelled'));
          }
        });

        readStream.pipe(writeStream);
        writeStream.on('close', () => {
          this.activeTransfers.delete(transferId);
          if (!aborted) resolve();
        }).on('error', (err: Error) => {
          this.activeTransfers.delete(transferId);
          reject(err);
        });
      });
    });
  }

  cancelTransfer(transferId: string) {
    if (this.activeTransfers.has(transferId)) {
      this.activeTransfers.get(transferId)!.abort();
    }
  }
}
