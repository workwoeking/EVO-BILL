'use client';

import React, { useState, useEffect } from 'react';
import { User, LogOut, CheckCircle2, Shield, LogIn } from 'lucide-react';
import { getCurrentUser, loginAsGoogle, logoutUser, AppUser } from '@/lib/auth';

export default function UserAuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [user, setUser] = useState<AppUser>(getCurrentUser());
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    setUser(getCurrentUser());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = (email: string, name: string) => {
    const logged = loginAsGoogle(email, name);
    setUser(logged);
    onClose();
  };

  const handleLogout = () => {
    logoutUser();
    setUser(getCurrentUser());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Google Authentication</h3>
              <p className="text-[11px] text-zinc-400">Shop Operator Account</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-lg">
            &times;
          </button>
        </div>

        {user.isLoggedIn ? (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-black text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                    <span>{user.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </h4>
                  <p className="text-[11px] text-zinc-400">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-semibold">
                    Role: {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400">
              Sign in with your Google Account to protect billing records and enable live Google Cloud Sync.
            </p>

            {/* 1-Click Fast Login with workwoeking@gmail.com */}
            <button
              onClick={() => handleGoogleLogin('workwoeking@gmail.com', 'Workwoeking')}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs rounded-xl transition-all shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign in with Google (workwoeking@gmail.com)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-3 text-[10px] text-zinc-500 uppercase">Or custom operator</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Operator Name (e.g. Rahul)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
              />
              <input
                type="email"
                placeholder="Google Email (e.g. user@gmail.com)"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
              />
              <button
                onClick={() => {
                  if (!customEmail) return;
                  handleGoogleLogin(customEmail, customName || 'Operator');
                }}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
