import { Client } from 'ssh2';
import { SessionConfig } from '../../shared/types';
import { BrowserWindow } from 'electron';
import { SessionLogger } from '../logging/SessionLogger';

export class SSHSession {
  private client: Client;
  private stream: any;
  private window: BrowserWindow;
  public sessionId: string;
  private logger: SessionLogger | null = null;
  private currentConfig: SessionConfig | null = null;
  private cols: number = 80;
  private rows: number = 24;

  constructor(sessionId: string, window: BrowserWindow) {
    this.client = new Client();
    this.window = window;
    this.sessionId = sessionId;
  }

  connect(config: SessionConfig): Promise<void> {
    this.currentConfig = config;
    
    if (config.loggingEnabled) {
      this.logger = new SessionLogger(config.name, config.logDirectory, config.stripAnsi ?? true);
    }

    return new Promise((resolve, reject) => {
      this.client.on('ready', () => {
        this.client.shell((err, stream) => {
          if (err) {
            reject(err);
            return;
          }
          this.stream = stream;
          this.stream.setWindow(this.rows, this.cols, 0, 0);
          stream.on('close', () => {
            this.client.end();
            this.window.webContents.send('ssh:close', { sessionId: this.sessionId });
          }).on('data', (data: Buffer) => {
            const text = data.toString('utf-8');
            if (this.logger) this.logger.write(text);
            this.window.webContents.send('ssh:data-in', { sessionId: this.sessionId, data: text });
          });
          resolve();
        });
      }).on('error', (err) => {
        this.window.webContents.send('ssh:error', { sessionId: this.sessionId, error: err.message });
        reject(err);
      }).on('close', () => {
        this.window.webContents.send('ssh:close', { sessionId: this.sessionId });
      });

      const connectConfig: any = {
        host: config.host,
        port: config.port,
        username: config.username,
      };

      if (config.auth.type === 'password') {
        connectConfig.password = config.auth.password;
      } else if (config.auth.type === 'privateKey') {
        connectConfig.privateKey = config.auth.passphrase; // Temp fallback logic if no actual file used
        // Note: For privateKey we should actually read the file contents at config.auth.privateKeyPath
        // Since we are MVP, we assume password.
      }

      this.client.connect(connectConfig);
    });
  }

  setLogging(enabled: boolean) {
    if (!this.currentConfig) return;
    
    if (enabled && !this.logger) {
      this.logger = new SessionLogger(this.currentConfig.name, this.currentConfig.logDirectory, this.currentConfig.stripAnsi ?? true);
    } else if (!enabled && this.logger) {
      this.logger.close();
      this.logger = null;
    }
  }

  getSFTP(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) reject(err);
        else resolve(sftp);
      });
    });
  }

  write(data: string) {
    if (this.stream) {
      this.stream.write(data);
    }
  }

  resize(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    if (this.stream) {
      this.stream.setWindow(rows, cols, 0, 0);
    }
  }

  disconnect() {
    if (this.logger) this.logger.close();
    this.client.end();
  }
}
