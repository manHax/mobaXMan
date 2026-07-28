import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';
import { LucideSearch, LucideChevronUp, LucideChevronDown, LucideX } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { themes } from '../../utils/themes';

interface TerminalProps {
  sessionId: string;
}

declare global {
  interface Window {
    api: any;
  }
}

export const Terminal: React.FC<TerminalProps> = ({ sessionId }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [matchWord, setMatchWord] = useState(false);
  const [matchInfo, setMatchInfo] = useState<{ index: number; count: number } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { theme, fontFamily, fontSize } = useSettingsStore();

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: fontFamily,
      fontSize: fontSize,
      theme: (themes as any)[theme] || themes.dark
    });
    
    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    
    term.loadAddon(fitAddon);
    term.loadAddon(searchAddon);

    if ((searchAddon as any).onDidChangeResults) {
      (searchAddon as any).onDidChangeResults((e: any) => {
        if (e) setMatchInfo({ index: e.resultIndex, count: e.resultCount });
      });
    }

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    searchAddonRef.current = searchAddon;
    fitAddonRef.current = fitAddon;

    term.onData((data) => window.api.ssh.write(sessionId, data));
    term.onResize(({ cols, rows }) => window.api.ssh.resize(sessionId, cols, rows));
    
    // Send initial size immediately
    window.api.ssh.resize(sessionId, term.cols, term.rows);

    window.api.ssh.onData((id: string, data: string) => {
      if (id === sessionId) {
        let text = data;
        if (useSettingsStore.getState().autoColorKeywords) {
          text = text
            .replace(/\b(error|failed|fail)\b/gi, '\x1b[1;31m$1\x1b[0m')
            .replace(/\b(warn|warning)\b/gi, '\x1b[1;33m$1\x1b[0m')
            .replace(/\b(success|ok)\b/gi, '\x1b[1;32m$1\x1b[0m');
        }
        term.write(text);
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearch(prev => {
          if (!prev) setTimeout(() => searchInputRef.current?.focus(), 100);
          return true;
        });
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        searchAddon.clearDecorations();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      term.dispose();
      window.api.ssh.disconnect(sessionId);
    };
  }, [sessionId]);

  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = (themes as any)[theme] || themes.dark;
      xtermRef.current.options.fontFamily = fontFamily;
      xtermRef.current.options.fontSize = fontSize;
      // Slight delay to allow DOM to update font if needed before fitting
      setTimeout(() => {
        if (xtermRef.current) fitAddonRef.current?.fit();
      }, 50);
    }
  }, [theme, fontFamily, fontSize]);
  
  const doSearch = useCallback((next: boolean) => {
    if (!searchAddonRef.current || !searchText) return;
    const options = {
      regex: useRegex,
      wholeWord: matchWord,
      caseSensitive: matchCase,
      decorations: { 
        matchBackground: '#334155', 
        matchBorder: '#64748b', 
        matchOverviewRuler: '#3b82f6', 
        activeMatchBackground: '#f59e0b', 
        activeMatchBorder: '#d97706', 
        activeMatchColorOverviewRuler: '#f59e0b' 
      }
    };
    if (next) {
      searchAddonRef.current.findNext(searchText, options);
    } else {
      searchAddonRef.current.findPrevious(searchText, options);
    }
  }, [searchText, useRegex, matchWord, matchCase]);

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      doSearch(!e.shiftKey);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Search Bar Overlay */}
      {showSearch && (
        <div className="absolute top-2 right-6 z-10 bg-gray-800 border border-gray-600 rounded-md shadow-lg p-2 flex items-center gap-2">
          <LucideSearch size={16} className="text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white w-48 focus:outline-none focus:border-blue-500"
            placeholder="Search (Enter for next)"
            value={searchText}
            onChange={e => {
              setSearchText(e.target.value);
              // Optional: live search as user types
              // setTimeout(() => searchAddonRef.current?.findNext(e.target.value, { decorations: { ... } }), 0);
            }}
            onKeyDown={handleSearchKey}
          />
          <div className="flex border border-gray-700 rounded overflow-hidden">
            <button onClick={() => setMatchCase(!matchCase)} className={`px-2 py-1 text-xs font-mono border-r border-gray-700 ${matchCase ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`} title="Match Case">Aa</button>
            <button onClick={() => setMatchWord(!matchWord)} className={`px-2 py-1 text-xs font-mono border-r border-gray-700 ${matchWord ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`} title="Match Whole Word">W</button>
            <button onClick={() => setUseRegex(!useRegex)} className={`px-2 py-1 text-xs font-mono ${useRegex ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`} title="Use Regular Expression">.*</button>
          </div>
          
          {matchInfo && matchInfo.count > 0 && (
            <span className="text-xs text-gray-400 ml-1">{matchInfo.index + 1} of {matchInfo.count}</span>
          )}
          {matchInfo && matchInfo.count === 0 && searchText && (
            <span className="text-xs text-red-400 ml-1">No results</span>
          )}

          <div className="flex items-center ml-2 border-l border-gray-700 pl-2 gap-1">
            <button onClick={() => doSearch(false)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Find Previous (Shift+Enter)"><LucideChevronUp size={16} /></button>
            <button onClick={() => doSearch(true)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Find Next (Enter)"><LucideChevronDown size={16} /></button>
            <button onClick={() => { setShowSearch(false); searchAddonRef.current?.clearDecorations(); }} className="p-1 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded ml-1" title="Close"><LucideX size={16} /></button>
          </div>
        </div>
      )}
      <div ref={terminalRef} className="flex-1 overflow-hidden" />
    </div>
  );
};
