'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Key,
  BadgeDollarSign,
  FileSpreadsheet,
  BarChart3,
  History,
  Settings,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Bell,
  Search,
  ExternalLink,
  Database,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Licenses', href: '/admin/licenses', icon: Key },
  { name: 'Payments', href: '/admin/payments', icon: BadgeDollarSign },
  { name: 'Google Sheets', href: '/admin/google-sheets', icon: FileSpreadsheet },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Activity Logs', href: '/admin/activity-logs', icon: History },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // If on the login page itself, do not render admin chrome
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      document.cookie = 'evo_admin_session=; path=/; max-age=0;';
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/admin/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-blue-500 selection:text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-white text-base">EVO BILL <span className="text-xs text-blue-400">Admin</span></span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col backdrop-blur-xl transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/70 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>EVO BILL</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">SAAS</span>
              </div>
              <p className="text-[11px] text-slate-400">Super Admin Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Platform Management
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Database & System Health Widget */}
        <div className="px-3 py-2">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Supabase DB
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 truncate">PostgreSQL RLS Active</p>
          </div>
        </div>

        {/* Owner Profile & Logout */}
        <div className="p-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-semibold text-white truncate">workwoeking@gmail.com</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 inline" /> Software Owner
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Multi-Tenant Environment</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-200 font-medium">Owner Control Plane</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Link to Desktop App */}
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors border border-slate-700"
            >
              <span>Launch Desktop View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Quick status pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>System Online</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
