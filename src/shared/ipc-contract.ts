import { SessionConfig } from './types';

export interface IPCRequests {
  'ssh:connect': { sessionId: string; config: SessionConfig };
  'ssh:disconnect': { sessionId: string };
  'ssh:data-out': { sessionId: string; data: string };
  'ssh:resize': { sessionId: string; cols: number; rows: number };
  'ssh:toggle-logging': { sessionId: string; enabled: boolean };
}

export interface IPCResponses {
  'ssh:data-in': { sessionId: string; data: string };
  'ssh:error': { sessionId: string; error: string };
  'ssh:close': { sessionId: string };
}
