import { SSHSession } from './SSHSession';
import { SFTPSession } from './SFTPSession';
import { SessionConfig } from '../../shared/types';
import { BrowserWindow } from 'electron';
import { CredentialStore } from '../storage/CredentialStore';

export class SSHConnectionManager {
  private sessions: Map<string, SSHSession> = new Map();
  private sftpSessions: Map<string, SFTPSession> = new Map();
  private credStore = new CredentialStore();

  async connect(sessionId: string, config: SessionConfig, window: BrowserWindow): Promise<void> {
    if (this.sessions.has(sessionId)) {
      throw new Error('Session already connected');
    }
    
    if (config.auth.type === 'password') {
      const pwd = await this.credStore.getPassword(config.id);
      if (pwd) config.auth.password = pwd;
    } else if (config.auth.type === 'privateKey') {
      const pass = await this.credStore.getPassphrase(config.id);
      if (pass) config.auth.passphrase = pass;
    }

    const session = new SSHSession(sessionId, window);
    await session.connect(config);
    this.sessions.set(sessionId, session);
  }

  async getSFTPSession(sessionId: string, window: BrowserWindow): Promise<SFTPSession> {
    if (this.sftpSessions.has(sessionId)) return this.sftpSessions.get(sessionId)!;
    
    const sshSession = this.sessions.get(sessionId);
    if (!sshSession) throw new Error('SSH session not connected');
    
    const sftpWrapper = await sshSession.getSFTP();
    const sftpSession = new SFTPSession(sftpWrapper, sessionId, window);
    this.sftpSessions.set(sessionId, sftpSession);
    return sftpSession;
  }

  toggleLogging(sessionId: string, enabled: boolean) {
    this.sessions.get(sessionId)?.setLogging(enabled);
  }

  write(sessionId: string, data: string) {
    this.sessions.get(sessionId)?.write(data);
  }

  resize(sessionId: string, cols: number, rows: number) {
    this.sessions.get(sessionId)?.resize(cols, rows);
  }

  disconnect(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.disconnect();
      this.sessions.delete(sessionId);
    }
  }
}
