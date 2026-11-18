'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  BookOpen,
  Users,
  Receipt,
  Package,
  Wrench,
  CreditCard,
  Percent,
  Settings,
  Bell,
  Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/quotes', label: 'Quotations', icon: FileSpreadsheet },
  { href: '/daybook', label: 'Daily Book', icon: BookOpen },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/ledger', label: 'Ledger', icon: Receipt },
  { href: '/items', label: 'Items & Stock', icon: Package },
  { href: '/jobs', label: 'Repair Jobs', icon: Wrench },
  { href: '/salary', label: 'Salary', icon: CreditCard },
  { href: '/gst', label: 'GST & E-Way', icon: Percent },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-zinc-950/90 border-r border-zinc-800/80 flex flex-col justify-between py-4 select-none shrink-0">
      <div className="px-3">
        {/* Brand header */}
        <div className="flex items-center gap-3 px-3 py-2.5 mb-4 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-900/40 border border-zinc-800/80">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-black text-lg shadow-lg shadow-orange-500/20">
            E
          </div>
          <div className="overflow-hidden">
            <h1 className="font-extrabold text-sm tracking-wide text-zinc-100 truncate">
              EVO BILL
            </h1>
            <p className="text-[11px] text-zinc-400 truncate">Next-Gen POS</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20 font-bold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-black' : 'text-zinc-400')} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom status / shortcut */}
      <div className="px-3 pt-3 border-t border-zinc-800/80 space-y-2">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/60 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Offline Ready</span>
          </div>
          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
            F1
          </span>
        </div>

        {/* Google Apps Script Cloud Sync Pill */}
        <Link
          href="/settings"
          className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-[11px] text-orange-400 font-semibold transition-colors"
          title="Google Cloud Sync for workwoeking@gmail.com"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Cloud className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="truncate">Cloud Sync</span>
          </div>
          <span className="text-[9px] bg-orange-500/20 px-1 rounded text-orange-300 font-mono">
            workwoeking
          </span>
        </Link>
      </div>
    </aside>
  );
}
