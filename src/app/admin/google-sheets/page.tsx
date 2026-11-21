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
  Plus,
  Clock,
  XCircle,
} from 'lucide-react';

export default function GoogleSheetsPage() {
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [provisioningId, setProvisioningId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSheets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sheets');
      const json = await res.json();
      if (json.success) setSheets(json.sheets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSheets(); }, []);

  /* ── Provision a real Google Sheet ───────────────────────── */
  const handleCreateSheet = async (customerId: string, businessName: string) => {
    setProvisioningId(customerId);
    try {
      const res = await fetch('/api/admin/sheets/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, business_name: businessName }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.already_existed
          ? 'Google Sheet already exists!'
          : `✅ Sheet created: ${json.title}`);
        await fetchSheets();
      } else {
        showToast(`❌ Failed: ${json.error || 'Unknown error'}. ${json.hint || ''}`, false);
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err.message}`, false);
    } finally {
      setProvisioningId(null);
    }
  };

  /* ── Sync Now ─────────────────────────────────────────────── */
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
        showToast('Sync timestamp updated.');
        await fetchSheets();
      } else {
        showToast(`Sync failed: ${json.error}`, false);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, false);
    } finally {
      setSyncingId(null);
    }
  };

  const isPlaceholder = (id: string) => !id || id.startsWith('placeholder_');

  const statusBadge = (s: any) => {
    if (isPlaceholder(s.spreadsheet_id)) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1 w-max">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </span>
      );
    }
    if (s.sync_status === 'active') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-max">
          <CheckCircle2 className="w-3 h-3" />
          <span>Active</span>
        </span>
      );
    }
    if (s.sync_status === 'error') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-max">
          <XCircle className="w-3 h-3" />
          <span>Error</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center gap-1 w-max">
        <AlertTriangle className="w-3 h-3" />
        <span>{s.sync_status || 'Unknown'}</span>
      </span>
    );
  };

  const filteredSheets = sheets.filter(
    (s) =>
      s.customer_id.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer?.business_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.spreadsheet_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const realSheets = filteredSheets.filter((s) => !isPlaceholder(s.spreadsheet_id));
  const pendingSheets = filteredSheets.filter((s) => isPlaceholder(s.spreadsheet_id));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border transition-all
          ${toast.ok ? 'bg-emerald-900/90 text-emerald-300 border-emerald-700' : 'bg-red-900/90 text-red-300 border-red-700'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Customer Google Spreadsheets</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
              Google Drive API
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Every customer gets their own private Google Spreadsheet —
            <code className="text-emerald-400 mx-1">EVO BILL - Business Name - Customer ID</code>
            — auto-created via Google Service Account.
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

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 text-center">
          <div className="text-2xl font-extrabold text-white">{sheets.length}</div>
          <div className="text-xs text-slate-400 mt-1">Total Sheets</div>
        </div>
        <div className="rounded-xl bg-emerald-900/30 border border-emerald-800/40 p-4 text-center">
          <div className="text-2xl font-extrabold text-emerald-400">{realSheets.length}</div>
          <div className="text-xs text-emerald-300/70 mt-1">Real Google Sheets ✅</div>
        </div>
        <div className="rounded-xl bg-yellow-900/30 border border-yellow-800/40 p-4 text-center">
          <div className="text-2xl font-extrabold text-yellow-400">{pendingSheets.length}</div>
          <div className="text-xs text-yellow-300/70 mt-1">Pending Creation ⏳</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Customer ID or Business Name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium ml-4">
          {filteredSheets.length} records
        </span>
      </div>

      {/* Sheets Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
            <span className="text-xs">Loading Google Sheet registry...</span>
          </div>
        ) : filteredSheets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No customer spreadsheets yet. Add a customer to automatically create their individual Google Sheet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950/40">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">Spreadsheet</th>
                  <th className="py-3 px-4">Last Synced</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSheets.map((s) => (
                  <tr key={s.id || s.customer_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{s.customer_id}</td>
                    <td className="py-3.5 px-4 text-white font-medium">
                      {s.customer?.business_name || s.customer_id}
                    </td>
                    <td className="py-3.5 px-4">
                      {isPlaceholder(s.spreadsheet_id) ? (
                        <span className="text-yellow-400/80 italic text-[11px]">
                          ⏳ Not created yet — click &quot;Create Sheet&quot;
                        </span>
                      ) : (
                        <span className="text-slate-200 font-medium flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{s.spreadsheet_name || s.sheet_title}</span>
                        </span>
                      )}
                      {!isPlaceholder(s.spreadsheet_id) && (
                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-[200px] block">
                          ID: {s.spreadsheet_id}
                        </span>
                      )}
                      {s.last_sync_error && (
                        <span className="text-[10px] text-red-400 block mt-0.5">
                          Error: {s.last_sync_error}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {s.last_sync_at ? new Date(s.last_sync_at).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-3.5 px-4">{statusBadge(s)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* Create Sheet button for placeholder entries */}
                        {isPlaceholder(s.spreadsheet_id) ? (
                          <button
                            onClick={() => handleCreateSheet(
                              s.customer_id,
                              s.customer?.business_name || s.customer_id
                            )}
                            disabled={provisioningId === s.customer_id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs border border-emerald-500/30 transition-colors flex items-center gap-1 font-medium"
                            title="Create real Google Sheet"
                          >
                            {provisioningId === s.customer_id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                            <span>Create Sheet</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSyncNow(s.customer_id)}
                              disabled={syncingId === s.customer_id}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors flex items-center gap-1"
                              title="Update sync timestamp"
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Setup Guide (shown when Google credentials are not set) */}
      <div className="p-5 rounded-2xl bg-blue-900/20 border border-blue-700/40 text-xs text-blue-200 space-y-3">
        <div className="font-bold text-blue-300 text-sm flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Google Service Account Setup Guide
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-blue-200/80">
          <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Google Cloud Console</a></li>
          <li>Enable <strong>Google Drive API</strong> and <strong>Google Sheets API</strong></li>
          <li>Create a Service Account → Download JSON Key</li>
          <li>Add to <code className="bg-blue-900/50 px-1 rounded">.env.local</code>:
            <pre className="mt-1 p-2 bg-slate-950/60 rounded-lg text-[10px] font-mono overflow-x-auto">
{`GOOGLE_SERVICE_ACCOUNT_EMAIL=your@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"`}
            </pre>
          </li>
          <li>Restart the Next.js dev server and click <strong>Create Sheet</strong> above.</li>
        </ol>
      </div>
    </div>
  );
}
