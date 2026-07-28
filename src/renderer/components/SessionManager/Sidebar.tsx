import React, { useEffect } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { SessionConfig } from '../../../shared/types';

interface SidebarProps {
  onConnect: (session: SessionConfig) => void;
  onEdit: (session?: SessionConfig) => void;
  onSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onConnect, onEdit, onSettings }) => {
  const { sessions, fetchData, deleteSession } = useSessionStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-900">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Sessions</h2>
        <div className="flex gap-1">
          <button onClick={() => onSettings()} className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors" title="Settings">⚙</button>
          <button onClick={async () => { await window.api.sessions.importSessions(); fetchData(); }} className="text-xs text-gray-400 hover:text-white px-1">↓</button>
          <button onClick={async () => { await window.api.sessions.exportSessions(); }} className="text-xs text-gray-400 hover:text-white px-1">↑</button>
          <button onClick={() => onEdit()} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors ml-1">
            + New
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.map(s => (
          <div key={s.id} className="flex justify-between items-center p-2 hover:bg-gray-700 rounded cursor-pointer group mb-1 transition-colors">
            <div onClick={() => onConnect(s)} className="flex-1 overflow-hidden">
              <div className="font-semibold text-sm truncate">{s.name}</div>
              <div className="text-xs text-gray-400 truncate">{s.username}@{s.host}</div>
            </div>
            <div className="hidden group-hover:flex gap-1 ml-2">
              <button onClick={() => onEdit(s)} className="text-xs text-gray-300 hover:text-white px-1">✏️</button>
              <button onClick={() => deleteSession(s.id)} className="text-xs text-red-400 hover:text-red-300 px-1">❌</button>
            </div>
          </div>
        ))}
        {sessions.length === 0 && <div className="text-gray-500 text-sm p-2 text-center">No sessions yet.</div>}
      </div>
    </div>
  );
};
