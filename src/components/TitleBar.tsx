'use client';

import React, { useEffect, useState } from 'react';
import { Minus, Square, X, Copy, User, CheckCircle2 } from 'lucide-react';
import { getCurrentUser, AppUser } from '@/lib/auth';
import UserAuthModal from './UserAuthModal';

export default function TitleBar() {
  const [isElectron, setIsElectron] = useState(false);
  const [isMax, setIsMax] = useState(false);
  const [user, setUser] = useState<AppUser>(getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUser(getCurrentUser());
      const onAuthChange = () => setUser(getCurrentUser());
      window.addEventListener('auth-change', onAuthChange);

      if (window.electronAPI?.isElectron) {
        setIsElectron(true);
        window.electronAPI.isMaximized().then(setIsMax);
      }

      return () => window.removeEventListener('auth-change', onAuthChange);
    }
  }, []);

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = async () => {
    if (window.electronAPI) {
      const max = await window.electronAPI.maximize();
      setIsMax(max);
    }
  };
  const handleClose = () => window.electronAPI?.close();

  if (!isElectron) {
    // In web browser preview mode, show user profile & desktop badge
    return (
      <>
        <div className="h-9 bg-zinc-950/90 border-b border-zinc-800/80 px-3 flex items-center justify-between text-xs text-zinc-400 select-none">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-bold text-zinc-200">EVO BILL Next-Gen</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Desktop App Mode</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 transition-colors"
            >
              <div className="w-4 h-4 rounded-full bg-orange-500 text-black flex items-center justify-center font-bold text-[9px]">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-white">{user.name}</span>
              <span className="text-[10px] text-zinc-500 truncate max-w-[140px]">({user.email || 'Guest'})</span>
            </button>
            <div className="text-[11px] text-zinc-500">v1.0.0 &middot; Next.js + Electron</div>
          </div>
        </div>
        <UserAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="h-9 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between select-none z-50 sticky top-0 drag-region">
        {/* App branding & title */}
        <div className="flex items-center gap-2.5 px-3 no-drag">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[11px] font-black text-black">
            E
          </div>
          <span className="text-xs font-bold tracking-wide text-zinc-200">EVO BILL Next-Gen</span>
          <span className="text-[10px] text-zinc-500 font-medium">Desktop</span>
        </div>

        {/* User Auth Pill in Window Bar */}
        <div className="no-drag flex items-center">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 transition-colors mr-2"
            title="Google Account Profile"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-black flex items-center justify-center font-bold text-[9px]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-white truncate max-w-[120px]">{user.name}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </button>
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
      <UserAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
