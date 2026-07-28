import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: string;
  fontFamily: string;
  fontSize: number;
  autoColorKeywords: boolean;
  setTheme: (t: string) => void;
  setFontFamily: (f: string) => void;
  setFontSize: (s: number) => void;
  setAutoColor: (b: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      autoColorKeywords: true,
      setTheme: (t) => set({ theme: t }),
      setFontFamily: (f) => set({ fontFamily: f }),
      setFontSize: (s) => set({ fontSize: s }),
      setAutoColor: (b) => set({ autoColorKeywords: b }),
    }),
    { name: 'mobaxman-settings' }
  )
);
