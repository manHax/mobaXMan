import React, { useState, useEffect } from 'react';
import { SessionConfig } from '../../../shared/types';
import { useSessionStore } from '../../store/sessionStore';

interface SessionModalProps {
  session?: SessionConfig;
  onClose: () => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({ session, onClose }) => {
  const saveSession = useSessionStore(state => state.saveSession);
  
  const [formData, setFormData] = useState<Partial<SessionConfig>>({
    name: '', host: '127.0.0.1', port: 22, username: 'root',
    auth: { type: 'password', password: '' },
    loggingEnabled: false
  });
  
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (session) {
      setFormData(session);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = session?.id || crypto.randomUUID();
    const configToSave: SessionConfig = {
      id,
      name: formData.name || 'New Session',
      host: formData.host || '127.0.0.1',
      port: Number(formData.port) || 22,
      username: formData.username || 'root',
      auth: { type: 'password', password }, // MVP auth handling
      loggingEnabled: formData.loggingEnabled || false
    };
    
    await saveSession(configToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center backdrop-blur-sm z-50">
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg w-[400px] shadow-2xl">
        <h2 className="text-xl font-bold mb-4">{session ? 'Edit Session' : 'New Session'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Session Name</span>
            <input className="bg-gray-900 border border-gray-600 p-2 rounded text-sm focus:border-blue-500 focus:outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Host</span>
            <input className="bg-gray-900 border border-gray-600 p-2 rounded text-sm focus:border-blue-500 focus:outline-none" value={formData.host} onChange={e => setFormData({...formData, host: e.target.value})} />
          </label>
          <div className="flex gap-3">
            <label className="flex flex-col gap-1 flex-1">
              <span className="text-sm text-gray-300">Username</span>
              <input className="bg-gray-900 border border-gray-600 p-2 rounded text-sm focus:border-blue-500 focus:outline-none" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            </label>
            <label className="flex flex-col gap-1 w-24">
              <span className="text-sm text-gray-300">Port</span>
              <input className="bg-gray-900 border border-gray-600 p-2 rounded text-sm focus:border-blue-500 focus:outline-none" type="number" value={formData.port} onChange={e => setFormData({...formData, port: Number(e.target.value)})} />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Password</span>
            <input className="bg-gray-900 border border-gray-600 p-2 rounded text-sm focus:border-blue-500 focus:outline-none" type="password" placeholder={session ? "Leave empty to keep existing" : ""} value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500" checked={formData.loggingEnabled} onChange={e => setFormData({...formData, loggingEnabled: e.target.checked})} />
              <span className="text-sm text-gray-300">Enable Logging</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer transition-opacity" style={{ opacity: formData.loggingEnabled ? 1 : 0.5 }}>
              <input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500" disabled={!formData.loggingEnabled} checked={formData.stripAnsi !== false} onChange={e => setFormData({...formData, stripAnsi: e.target.checked})} />
              <span className="text-sm text-gray-300">Strip ANSI (Readable)</span>
            </label>
          </div>
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};
