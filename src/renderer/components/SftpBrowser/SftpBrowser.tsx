import React, { useState, useEffect, useCallback } from 'react';
import { FileItem } from '../../../shared/types';
import { LucideFolder, LucideFile, LucideArrowUpCircle, LucideRefreshCw, LucideTrash2, LucideEdit2, LucideFolderPlus, LucideXCircle } from 'lucide-react';

interface SftpBrowserProps {
  sessionId: string;
}

interface Transfer {
  id: string;
  filename: string;
  transferred: number;
  total: number;
  type: 'upload' | 'download';
}

export const SftpBrowser: React.FC<SftpBrowserProps> = ({ sessionId }) => {
  const [localPath, setLocalPath] = useState('');
  const [remotePath, setRemotePath] = useState('.');
  
  const [localFiles, setLocalFiles] = useState<FileItem[]>([]);
  const [remoteFiles, setRemoteFiles] = useState<FileItem[]>([]);
  
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  const loadLocal = useCallback(async (dir: string) => {
    try {
      const actualDir = dir || await window.api.localFs.homedir();
      setLocalPath(actualDir);
      const files = await window.api.localFs.readdir(actualDir);
      setLocalFiles(files);
    } catch (e: any) {
      alert('Error reading local dir: ' + e.message);
    }
  }, []);

  const loadRemote = useCallback(async (dir: string) => {
    try {
      const files = await window.api.sftp.readdir(sessionId, dir);
      setRemotePath(dir);
      setRemoteFiles(files);
    } catch (e: any) {
      alert('Error reading remote dir: ' + e.message);
    }
  }, [sessionId]);

  useEffect(() => {
    loadLocal('');
    loadRemote('.');
    
    // progress listener
    window.api.sftp.onProgress((transferId: string, transferred: number, total: number) => {
      setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, transferred, total } : t));
    });
  }, [loadLocal, loadRemote]);

  const handleTransfer = async (file: FileItem, fromLocal: boolean) => {
    if (file.isDir) {
      alert('Directory transfer not supported in MVP. Please transfer files.');
      return;
    }
    const transferId = crypto.randomUUID();
    const newTransfer: Transfer = {
      id: transferId, filename: file.name, transferred: 0, total: file.size, type: fromLocal ? 'upload' : 'download'
    };
    
    setTransfers(prev => [...prev, newTransfer]);
    
    try {
      if (fromLocal) {
        const lPath = localPath + '\\' + file.name; // Simple path join, ideally use path module
        const rPath = remotePath === '.' ? file.name : remotePath + '/' + file.name;
        await window.api.sftp.upload(sessionId, lPath, rPath, transferId);
        loadRemote(remotePath);
      } else {
        const rPath = remotePath === '.' ? file.name : remotePath + '/' + file.name;
        const lPath = localPath + '\\' + file.name;
        await window.api.sftp.download(sessionId, rPath, lPath, transferId);
        loadLocal(localPath);
      }
    } catch (e: any) {
      if (e.message !== 'Cancelled') {
        alert(`Transfer failed: ${e.message}`);
      }
    } finally {
      setTransfers(prev => prev.filter(t => t.id !== transferId));
    }
  };

  const cancelTransfer = (id: string) => {
    window.api.sftp.cancelTransfer(sessionId, id);
  };

  const deleteFile = async (file: FileItem, isLocal: boolean) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    try {
      if (isLocal) {
        const p = localPath + '\\' + file.name;
        if (file.isDir) await window.api.localFs.rmdir(p);
        else await window.api.localFs.unlink(p);
        loadLocal(localPath);
      } else {
        const p = remotePath === '.' ? file.name : remotePath + '/' + file.name;
        if (file.isDir) await window.api.sftp.rmdir(sessionId, p);
        else await window.api.sftp.unlink(sessionId, p);
        loadRemote(remotePath);
      }
    } catch (e: any) { alert(e.message); }
  };
  
  const renameFile = async (file: FileItem, isLocal: boolean) => {
    const newName = prompt('New name:', file.name);
    if (!newName || newName === file.name) return;
    try {
      if (isLocal) {
        await window.api.localFs.rename(localPath + '\\' + file.name, localPath + '\\' + newName);
        loadLocal(localPath);
      } else {
        const base = remotePath === '.' ? '' : remotePath + '/';
        await window.api.sftp.rename(sessionId, base + file.name, base + newName);
        loadRemote(remotePath);
      }
    } catch (e: any) { alert(e.message); }
  };

  const mkDir = async (isLocal: boolean) => {
    const name = prompt('New folder name:');
    if (!name) return;
    try {
      if (isLocal) {
        await window.api.localFs.mkdir(localPath + '\\' + name);
        loadLocal(localPath);
      } else {
        const base = remotePath === '.' ? '' : remotePath + '/';
        await window.api.sftp.mkdir(sessionId, base + name);
        loadRemote(remotePath);
      }
    } catch (e: any) { alert(e.message); }
  };
  
  const chmodRemote = async (file: FileItem) => {
    const mode = prompt('New permissions (octal, e.g. 755):', file.permissions);
    if (!mode) return;
    try {
      const base = remotePath === '.' ? '' : remotePath + '/';
      await window.api.sftp.chmod(sessionId, base + file.name, parseInt(mode, 8));
      loadRemote(remotePath);
    } catch (e: any) { alert(e.message); }
  }

  const onDragStart = (e: React.DragEvent, file: FileItem, isLocal: boolean) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ file, isLocal }));
  };

  const onDrop = (e: React.DragEvent, targetIsLocal: boolean) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const { file, isLocal } = JSON.parse(dataStr);
      if (isLocal === targetIsLocal) return;
      handleTransfer(file, isLocal);
    } catch (err) {}
  };

  const renderPanel = (isLocal: boolean, pathStr: string, files: FileItem[], setPath: (p: string) => void, load: (p: string) => void) => {
    return (
      <div 
        className="flex flex-col flex-1 border-r border-gray-700 bg-[#1e1e1e] overflow-hidden relative"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, isLocal)}
      >
        <div className="bg-gray-800 p-2 flex gap-2 items-center text-sm shadow z-10">
          <span className="font-bold text-gray-400 w-16">{isLocal ? 'Local' : 'Remote'}</span>
          <input 
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-300 outline-none focus:border-blue-500" 
            value={pathStr} 
            onChange={e => setPath(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(pathStr)}
          />
          <button onClick={() => load(pathStr)} className="text-gray-400 hover:text-white p-1"><LucideRefreshCw size={16} /></button>
          <button onClick={() => mkDir(isLocal)} className="text-gray-400 hover:text-white p-1" title="New Folder"><LucideFolderPlus size={16} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="font-normal pb-2 font-mono">Name</th>
                <th className="font-normal pb-2 font-mono w-24">Size</th>
                <th className="font-normal pb-2 font-mono w-32">Modified</th>
                <th className="font-normal pb-2 font-mono w-16">Perms</th>
                <th className="font-normal pb-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {/* Go up directory */}
              <tr className="hover:bg-gray-800 cursor-pointer select-none group" onDoubleClick={() => load(isLocal ? pathStr + '\\..' : pathStr + '/..')}>
                <td className="py-1 flex items-center gap-2"><LucideFolder size={16} className="text-blue-400" /> ..</td>
                <td></td><td></td><td></td><td></td>
              </tr>
              {files.map(f => (
                <tr 
                  key={f.name} 
                  className="hover:bg-gray-800 border-b border-gray-800/50 group select-none cursor-grab active:cursor-grabbing" 
                  onDoubleClick={() => f.isDir && load(isLocal ? pathStr + '\\' + f.name : pathStr + '/' + f.name)}
                  draggable={!f.isDir}
                  onDragStart={(e) => onDragStart(e, f, isLocal)}
                >
                  <td className="py-1 flex items-center gap-2 max-w-[200px] overflow-hidden text-ellipsis">
                    {f.isDir ? <LucideFolder size={16} className="text-blue-400 shrink-0" /> : <LucideFile size={16} className="text-gray-400 shrink-0" />}
                    <span className="truncate">{f.name}</span>
                  </td>
                  <td className="text-gray-400">{f.isDir ? '' : (f.size / 1024).toFixed(1) + ' KB'}</td>
                  <td className="text-gray-400">{new Date(f.modifyTime).toLocaleDateString()}</td>
                  <td className="text-gray-500 cursor-pointer hover:text-white" onClick={() => !isLocal && chmodRemote(f)}>{f.permissions}</td>
                  <td className="text-right">
                    <div className="hidden group-hover:flex items-center justify-end gap-2 text-gray-400">
                      <button onClick={() => handleTransfer(f, isLocal)} title={isLocal ? "Upload" : "Download"} className="hover:text-green-400"><LucideArrowUpCircle size={14} className={isLocal ? "" : "rotate-180"} /></button>
                      <button onClick={() => renameFile(f, isLocal)} title="Rename" className="hover:text-yellow-400"><LucideEdit2 size={14} /></button>
                      <button onClick={() => deleteFile(f, isLocal)} title="Delete" className="hover:text-red-400"><LucideTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
      <div className="flex flex-1 overflow-hidden">
        {renderPanel(true, localPath, localFiles, setLocalPath, loadLocal)}
        {renderPanel(false, remotePath, remoteFiles, setRemotePath, loadRemote)}
      </div>
      
      {/* Transfers Panel */}
      {transfers.length > 0 && (
        <div className="h-48 border-t border-gray-700 bg-gray-900 flex flex-col shadow-inner">
          <div className="p-2 bg-gray-800 text-xs font-bold text-gray-400 border-b border-gray-700">ACTIVE TRANSFERS</div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
            {transfers.map(t => (
              <div key={t.id} className="bg-gray-800 rounded p-2 flex items-center gap-4 border border-gray-700">
                <div className="w-16 text-xs uppercase font-bold text-blue-400">{t.type}</div>
                <div className="flex-1 truncate text-sm">{t.filename}</div>
                <div className="w-64 bg-gray-900 rounded-full h-3 overflow-hidden border border-gray-700">
                  <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, (t.transferred / t.total) * 100))}%` }}></div>
                </div>
                <div className="w-24 text-right text-xs text-gray-400">
                  {(t.transferred / 1024 / 1024).toFixed(1)} / {(t.total / 1024 / 1024).toFixed(1)} MB
                </div>
                <button onClick={() => cancelTransfer(t.id)} className="text-red-400 hover:text-red-300" title="Cancel">
                  <LucideXCircle size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
