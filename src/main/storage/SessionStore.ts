import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { SessionConfig, SessionFolder } from '../../shared/types';

export class SessionStore {
  private db: Database.Database;

  constructor() {
    const dbPath = join(app.getPath('userData'), 'sessions.sqlite');
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parentId TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        host TEXT NOT NULL,
        port INTEGER DEFAULT 22,
        username TEXT NOT NULL,
        authType TEXT NOT NULL,
        privateKeyPath TEXT,
        folderId TEXT,
        tags TEXT,
        loggingEnabled INTEGER DEFAULT 0,
        logDirectory TEXT,
        color TEXT,
        lastConnectedAt TEXT
      );
    `);

    // Migration
    try {
      this.db.prepare('ALTER TABLE sessions ADD COLUMN stripAnsi INTEGER DEFAULT 1').run();
    } catch (e) {
      // Column might already exist
    }
  }

  getAllFolders(): SessionFolder[] {
    const stmt = this.db.prepare('SELECT * FROM folders');
    return stmt.all() as SessionFolder[];
  }

  saveFolder(folder: SessionFolder) {
    const stmt = this.db.prepare(`
      INSERT INTO folders (id, name, parentId)
      VALUES (@id, @name, @parentId)
      ON CONFLICT(id) DO UPDATE SET
        name = @name,
        parentId = @parentId
    `);
    stmt.run(folder);
  }

  deleteFolder(id: string) {
    this.db.prepare('DELETE FROM folders WHERE id = ?').run(id);
    this.db.prepare('UPDATE sessions SET folderId = NULL WHERE folderId = ?').run(id);
  }

  getAllSessions(): SessionConfig[] {
    const stmt = this.db.prepare('SELECT * FROM sessions');
    const rows = stmt.all() as any[];
    
    return rows.map(row => {
      const auth = row.authType === 'password'
        ? { type: 'password', password: '' }
        : { type: 'privateKey', privateKeyPath: row.privateKeyPath, passphrase: '' };
      
      return {
        id: row.id,
        name: row.name,
        host: row.host,
        port: row.port,
        username: row.username,
        auth: auth as any,
        folderId: row.folderId,
        tags: row.tags ? JSON.parse(row.tags) : [],
        loggingEnabled: Boolean(row.loggingEnabled),
        stripAnsi: row.stripAnsi !== undefined ? Boolean(row.stripAnsi) : true,
        logDirectory: row.logDirectory,
        color: row.color,
        lastConnectedAt: row.lastConnectedAt,
      };
    });
  }

  saveSession(session: SessionConfig) {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (
        id, name, host, port, username, authType, privateKeyPath, 
        folderId, tags, loggingEnabled, stripAnsi, logDirectory, color, lastConnectedAt
      ) VALUES (
        @id, @name, @host, @port, @username, @authType, @privateKeyPath,
        @folderId, @tags, @loggingEnabled, @stripAnsi, @logDirectory, @color, @lastConnectedAt
      ) ON CONFLICT(id) DO UPDATE SET
        name = @name, host = @host, port = @port, username = @username,
        authType = @authType, privateKeyPath = @privateKeyPath,
        folderId = @folderId, tags = @tags, loggingEnabled = @loggingEnabled,
        stripAnsi = @stripAnsi, logDirectory = @logDirectory, color = @color, lastConnectedAt = @lastConnectedAt
    `);

    stmt.run({
      id: session.id,
      name: session.name,
      host: session.host,
      port: session.port,
      username: session.username,
      authType: session.auth.type,
      privateKeyPath: session.auth.type === 'privateKey' ? session.auth.privateKeyPath : null,
      folderId: session.folderId || null,
      tags: session.tags ? JSON.stringify(session.tags) : null,
      loggingEnabled: session.loggingEnabled ? 1 : 0,
      stripAnsi: session.stripAnsi !== false ? 1 : 0,
      logDirectory: session.logDirectory || null,
      color: session.color || null,
      lastConnectedAt: session.lastConnectedAt || null,
    });
  }

  deleteSession(id: string) {
    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  }
}
