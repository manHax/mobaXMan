export type AuthMethod =
  | { type: 'password'; password: string }
  | { type: 'privateKey'; privateKeyPath: string; passphrase?: string };

export interface SessionConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  auth: AuthMethod;
  folderId?: string;
  tags?: string[];
  loggingEnabled: boolean;
  logDirectory?: string;
  stripAnsi?: boolean;
  color?: string;
  lastConnectedAt?: string;
}

export interface SessionFolder {
  id: string;
  name: string;
  parentId?: string;
}

export interface FileItem {
  name: string;
  isDir: boolean;
  size: number;
  modifyTime: number;
  permissions: string;
}
