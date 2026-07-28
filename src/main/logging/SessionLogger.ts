import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export class SessionLogger {
  private stream: fs.WriteStream | null = null;
  private stripAnsi: boolean;

  constructor(sessionName: string, logDirectory: string | undefined, stripAnsi: boolean) {
    this.stripAnsi = stripAnsi;
    
    const logsDir = logDirectory || path.join(app.getPath('userData'), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Format date as yyyyMMdd_HHmmss
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    
    const safeName = sessionName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_${dateStr}.log`;
    const filepath = path.join(logsDir, filename);

    this.stream = fs.createWriteStream(filepath, { flags: 'a' });
  }

  write(data: string) {
    if (!this.stream) return;
    
    let logData = data;
    if (this.stripAnsi) {
      // Regex to remove ANSI escape sequences
      logData = data.replace(/[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]))/g, '');
    }
    
    this.stream.write(logData);
  }

  close() {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
  }
}
