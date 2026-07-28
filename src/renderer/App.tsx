import React, { useState } from 'react';
import { Terminal } from './components/Terminal/Terminal';
import { Sidebar } from './components/SessionManager/Sidebar';
import { SessionModal } from './components/SessionManager/SessionModal';
import { SettingsModal } from './components/SessionManager/SettingsModal';
import { SftpBrowser } from './components/SftpBrowser/SftpBrowser';
import { SessionConfig } from '../shared/types';
import { LucideX } from 'lucide-react';

interface OpenSession {
  tabId: string;
  config: SessionConfig;
  viewMode: 'terminal' | 'sftp';
  isLogging: boolean;
}

const App = () => {
  const [openSessions, setOpenSessions] = useState<OpenSession[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionConfig | undefined>();

  const handleConnect = async (config: SessionConfig) => {
    const tabId = crypto.randomUUID();
    
    const res = await window.api.ssh.connect(tabId, config);
    if (res.success) {
      setOpenSessions(prev => [...prev, { tabId, config, viewMode: 'terminal', isLogging: config.loggingEnabled }]);
      setActiveTabId(tabId);
    } else {
      alert('Connection failed: ' + res.error);
    }
  };

  const handleEdit = (session?: SessionConfig) => {
    setEditingSession(session);
    setIsEditing(true);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenSessions(prev => {
      const filtered = prev.filter(s => s.tabId !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(filtered.length > 0 ? filtered[filtered.length - 1].tabId : null);
      }
      return filtered;
    });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
      <Sidebar onConnect={handleConnect} onEdit={handleEdit} onSettings={() => setIsSettingsOpen(true)} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#1e1e1e]">
        
        {/* Tab Bar */}
        {openSessions.length > 0 && (
          <div className="flex bg-[#111] overflow-x-auto border-b border-gray-700 scrollbar-hide">
            {openSessions.map(session => (
              <div 
                key={session.tabId}
                onClick={() => setActiveTabId(session.tabId)}
                className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer min-w-[150px] max-w-[250px] select-none group transition-colors
                  ${activeTabId === session.tabId ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500' : 'text-gray-400 hover:bg-gray-800 border-t-2 border-t-transparent'}`}
              >
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_5px_#22c55e]"></span>
                <span className="truncate flex-1 text-sm font-medium">{session.config.name}</span>
                <button 
                  onClick={(e) => closeTab(session.tabId, e)}
                  className={`shrink-0 p-1 rounded hover:bg-gray-700 ${activeTabId === session.tabId ? 'text-gray-400 hover:text-white' : 'text-transparent group-hover:text-gray-400 hover:!text-white'}`}
                >
                  <LucideX size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Content Area */}
        {openSessions.length > 0 ? (
          openSessions.map(session => {
            const isActive = activeTabId === session.tabId;
            return (
              <div key={session.tabId} className={`flex-1 flex-col overflow-hidden ${isActive ? 'flex' : 'hidden'}`}>
                
                {/* Session Header / Controls */}
                <div className="bg-gray-800 text-gray-200 text-sm px-4 py-1.5 border-b border-gray-700 flex justify-between items-center shadow-sm z-10">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 font-mono text-xs">{session.config.username}@{session.config.host}</span>
                    <div className="flex rounded border border-gray-700 overflow-hidden text-xs font-semibold">
                      <button 
                        className={`px-3 py-1 transition-colors ${session.viewMode === 'terminal' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-700'}`}
                        onClick={() => setOpenSessions(prev => prev.map(s => s.tabId === session.tabId ? { ...s, viewMode: 'terminal' } : s))}
                      >
                        Terminal
                      </button>
                      <button 
                        className={`px-3 py-1 transition-colors ${session.viewMode === 'sftp' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-700'}`}
                        onClick={() => setOpenSessions(prev => prev.map(s => s.tabId === session.tabId ? { ...s, viewMode: 'sftp' } : s))}
                      >
                        SFTP Browser
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const newState = !session.isLogging;
                      window.api.ssh.toggleLogging(session.tabId, newState);
                      setOpenSessions(prev => prev.map(s => s.tabId === session.tabId ? { ...s, isLogging: newState } : s));
                    }} 
                    className={`text-xs px-2 py-1 rounded transition-colors ${session.isLogging ? 'bg-red-900/50 text-red-400 border border-red-800 hover:bg-red-900/80 shadow-[0_0_8px_rgba(239,68,68,0.3)]' : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'}`}
                  >
                    {session.isLogging ? '🔴 Rec' : '⚪ Log off'}
                  </button>
                </div>

                <div className="flex-1 p-2 overflow-hidden flex flex-col">
                  {/* We keep both mounted so state is preserved */}
                  <div className={`flex-1 overflow-hidden relative ${session.viewMode === 'terminal' ? 'block' : 'hidden'}`}>
                    <Terminal sessionId={session.tabId} />
                  </div>
                  <div className={`flex-1 overflow-hidden relative ${session.viewMode === 'sftp' ? 'block' : 'hidden'}`}>
                    <SftpBrowser sessionId={session.tabId} />
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 bg-gradient-to-br from-[#1e1e1e] to-[#111]">
            <h1 className="text-5xl font-black tracking-widest text-gray-800/50 drop-shadow-md">mobaXMan</h1>
            <p className="text-gray-500 text-sm font-medium">Select or create a session to connect</p>
          </div>
        )}
      </div>

      {isEditing && (
        <SessionModal session={editingSession} onClose={() => setIsEditing(false)} />
      )}
      
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
};

import { createRoot } from 'react-dom/client';
import './styles/index.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}

export default App;
