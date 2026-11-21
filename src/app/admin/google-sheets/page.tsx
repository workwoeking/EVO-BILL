'use client';

import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Loader2,
  Database
} from 'lucide-react';

export default function GoogleSheetsPage() {
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchSheets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sheets');
      const json = await res.json();
      if (json.success) {
        setSheets(json.sheets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  const handleSyncNow = async (customerId: string) => {
    setSyncingId(customerId);
    try {
      const res = await fetch('/api/admin/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_now', customer_id: customerId }),
      });
      const json = await res.json();
      if (json.success) {
        fetchSheets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingId(null);
    }
  };

  const filteredSheets = sheets.filter(
    (s) =>
      s.customer_id.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer?.business_name || '').toLowerCase().includes(search.toLowerCase()) ||
      s.spreadsheet_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Customer Google Spreadsheets</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
              Individual Provisioning
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Every customer account receives their own private Google Spreadsheet (<code className="text-emerald-400">EVO BILL - Business Name - Customer ID</code>) automatically linked via Google Drive API.
          </p>
        </div>

        <button
          onClick={fetchSheets}
          className="p-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all text-xs flex items-center gap-1.5 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer spreadsheet by name or Customer ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {filteredSheets.length} Google Sheets Linked
        </span>
      </div>

      {/* Sheets Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
            <span className="text-xs">Loading Google Sheet registries...</span>
          </div>
        ) : filteredSheets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No customer spreadsheets registered yet. Onboarding a customer automatically creates their individual sheet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950/40">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">Spreadsheet Title</th>
                  <th className="py-3 px-4">Last Synced</th>
                  <th className="py-3 px-4">Sync Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSheets.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{s.customer_id}</td>
                    <td className="py-3.5 px-4 text-white font-medium">
                      {s.customer?.business_name || s.customer_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200 font-medium flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span>{s.spreadsheet_name}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 truncate max-w-[200px] block">
                        ID: {s.spreadsheet_id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {s.last_sync_at ? new Date(s.last_sync_at).toLocaleString() : 'Pending first sync'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{s.sync_status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSyncNow(s.customer_id)}
                          disabled={syncingId === s.customer_id}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors flex items-center gap-1"
                          title="Trigger Sync Now"
                        >
                          <RotateCcw className={`w-3 h-3 ${syncingId === s.customer_id ? 'animate-spin text-blue-400' : ''}`} />
                          <span>Sync Now</span>
                        </button>
                        <a
                          href={s.spreadsheet_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs transition-colors flex items-center gap-1 font-medium"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
