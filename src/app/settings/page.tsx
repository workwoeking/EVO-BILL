'use client';

import React, { useState, useEffect } from 'react';
import { Save, Printer, HardDrive, ShieldCheck, Download, Upload } from 'lucide-react';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { ShopSettings } from '@/types/billing';

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [printers, setPrinters] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const db = getDatabase();
    setSettings(db.settings);

    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getPrinters().then(setPrinters);
    }
  }, []);

  if (!settings) return null;

  const handleSave = () => {
    const db = getDatabase();
    saveDatabase({ ...db, settings });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleBackup = async () => {
    const db = getDatabase();
    const jsonStr = JSON.stringify(db, null, 2);

    if (window.electronAPI) {
      const res = await window.electronAPI.saveBackupDialog('evo-bill-backup.json');
      if (res && !res.canceled) {
        alert('Backup saved successfully!');
      }
    } else {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evo-bill-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-black text-white">System Settings</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage business profile, GSTIN, thermal printer & desktop options
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-bold text-xs rounded-lg transition-all shadow-lg shadow-orange-500/20"
        >
          <Save className="w-4 h-4" />
          <span>{isSaved ? 'Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Shop Profile */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
          Company & Business Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Shop / Company Name
            </label>
            <input
              type="text"
              value={settings.shopName}
              onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={settings.tagline || ''}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              GSTIN Number
            </label>
            <input
              type="text"
              value={settings.gstin || ''}
              onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white uppercase focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Shop Address
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Printer & Hardware */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
          <Printer className="w-4 h-4" />
          <span>Thermal & Laser Printer Setup</span>
        </h3>
        <p className="text-xs text-zinc-400">
          Detected printers connected to your desktop system:
        </p>
        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
          {printers.length > 0 ? (
            <ul className="space-y-1 text-xs">
              {printers.map((p, idx) => (
                <li key={idx} className="flex items-center justify-between text-zinc-300">
                  <span className="font-medium">{p.name}</span>
                  {p.isDefault && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                      Default Printer
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-zinc-500 italic">
              Electron Desktop App mode automatically detects local USB thermal printers (POS-58, POS-80) and A4 laser printers.
            </div>
          )}
        </div>
      </div>

      {/* Backup and Data */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
          <HardDrive className="w-4 h-4" />
          <span>Offline Data & Backup</span>
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackup}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>Export Database (.json)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
