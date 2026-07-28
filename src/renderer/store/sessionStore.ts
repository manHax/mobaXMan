import { create } from 'zustand';
import { SessionConfig, SessionFolder } from '../../shared/types';

interface SessionState {
  sessions: SessionConfig[];
  folders: SessionFolder[];
  fetchData: () => Promise<void>;
  saveSession: (session: SessionConfig) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  saveFolder: (folder: SessionFolder) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  folders: [],
  fetchData: async () => {
    const sessions = await window.api.sessions.getAll();
    const folders = await window.api.sessions.getAllFolders();
    set({ sessions, folders });
  },
  saveSession: async (session) => {
    await window.api.sessions.save(session);
    await get().fetchData();
  },
  deleteSession: async (id) => {
    await window.api.sessions.delete(id);
    await get().fetchData();
  },
  saveFolder: async (folder) => {
    await window.api.sessions.saveFolder(folder);
    await get().fetchData();
  },
  deleteFolder: async (id) => {
    await window.api.sessions.deleteFolder(id);
    await get().fetchData();
  },
}));
