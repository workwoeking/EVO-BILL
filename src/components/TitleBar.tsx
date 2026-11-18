'use client';

import React, { useEffect, useState } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';

export default function TitleBar() {
  const [isElectron, setIsElectron] = useState(false);
  const [isMax, setIsMax] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      setIsElectron(true);
      window.electronAPI.isMaximized().then(setIsMax);
    }
  }, []);

  if (!isElectron) {
    // In web browser preview mode, show a subtle banner indicating Desktop Ready
    return (
      <div className="h-8 bg-zinc-950/80 border-b border-zinc-800/60 px-3 flex items-center justify-between text-xs text-zinc-400 select-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-semibold text-zinc-200">EVO BILL Next-Gen</span>
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Desktop App Mode</span>
        </div>
        <div className="text-[11px] text-zinc-500">v1.0.0 &middot; Electron + Next.js</div>
      </div>
    );
  }

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = async () => {
    if (window.electronAPI) {
      const max = await window.electronAPI.maximize();
      setIsMax(max);
    }
  };
  const handleClose = () => window.electronAPI?.close();

  return (
    <div className="h-9 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between select-none z-50 sticky top-0 drag-region">
      {/* App branding & title */}
      <div className="flex items-center gap-2.5 px-3 no-drag">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[11px] font-black text-black">
          E
        </div>
        <span className="text-xs font-bold tracking-wide text-zinc-200">EVO BILL Next-Gen</span>
        <span className="text-[10px] text-zinc-500 font-medium">Desktop</span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center h-full no-drag">
        <button
          onClick={handleMinimize}
          className="h-full px-3 text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors flex items-center justify-center"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-3 text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors flex items-center justify-center"
          title={isMax ? 'Restore' : 'Maximize'}
        >
          {isMax ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </button>
        <button
          onClick={handleClose}
          className="h-full px-3.5 text-zinc-400 hover:text-white hover:bg-rose-600 transition-colors flex items-center justify-center"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
