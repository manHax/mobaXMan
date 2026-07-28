import React from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { LucideSettings, LucideX } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { theme, fontFamily, fontSize, autoColorKeywords, setTheme, setFontFamily, setFontSize, setAutoColor } = useSettingsStore();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-96 overflow-hidden flex flex-col">
        <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LucideSettings size={18} className="text-gray-400" />
            <h2 className="text-white font-bold">Terminal Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><LucideX size={18} /></button>
        </div>
        
        <div className="p-4 flex flex-col gap-4 text-sm text-gray-300">
          <label className="flex flex-col gap-1">
            <span>Color Theme</span>
            <select 
              className="bg-gray-900 border border-gray-600 p-2 rounded focus:border-blue-500 outline-none"
              value={theme} 
              onChange={e => setTheme(e.target.value)}
            >
              <option value="dark">Dark (Default)</option>
              <option value="matrix">Green Neon (Matrix)</option>
              <option value="dracula">Dracula</option>
              <option value="ubuntu">Ubuntu</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span>Font Family</span>
            <input 
              type="text" 
              className="bg-gray-900 border border-gray-600 p-2 rounded focus:border-blue-500 outline-none font-mono text-xs" 
              value={fontFamily} 
              onChange={e => setFontFamily(e.target.value)} 
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Font Size</span>
            <input 
              type="number" 
              className="bg-gray-900 border border-gray-600 p-2 rounded focus:border-blue-500 outline-none" 
              value={fontSize} 
              min={8} max={72}
              onChange={e => setFontSize(parseInt(e.target.value) || 14)} 
            />
          </label>

          <label className="flex items-center gap-2 mt-2 cursor-pointer border border-gray-700 p-3 rounded bg-gray-900/50 hover:bg-gray-900">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500" 
              checked={autoColorKeywords} 
              onChange={e => setAutoColor(e.target.checked)} 
            />
            <div className="flex flex-col">
              <span className="font-semibold text-gray-200">Auto-Highlight Keywords</span>
              <span className="text-xs text-gray-500">Colors 'error', 'failed', 'warn', 'success'</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
