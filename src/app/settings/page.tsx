'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  Printer,
  HardDrive,
  Cloud,
  Mail,
  RefreshCw,
  Copy,
  Check,
  Download,
  Upload,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getDatabase, saveDatabase, AppDatabase } from '@/lib/storage';
import { syncToGoogleCloud, pullFromGoogleCloud, DEFAULT_TARGET_EMAIL } from '@/lib/cloudSync';
import { ShopSettings } from '@/types/billing';
import { formatDate } from '@/lib/utils';

export default function SettingsPage() {
  const [db, setDb] = useState<AppDatabase | null>(null);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [printers, setPrinters] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Cloud sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string; sheetUrl?: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showScriptGuide, setShowScriptGuide] = useState(false);

  useEffect(() => {
    const loadedDb = getDatabase();
    setDb(loadedDb);
    setSettings(loadedDb.settings);

    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getPrinters().then(setPrinters);
    }
  }, []);

  if (!settings || !db) return null;

  const handleSave = () => {
    const updated = { ...db, settings };
    saveDatabase(updated);
    setDb(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleCloudSync = async (sendEmail: boolean = false) => {
    if (!settings.appsScriptUrl || !settings.appsScriptUrl.trim()) {
      alert('Please enter your Google Apps Script Web App URL first.');
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    const result = await syncToGoogleCloud(
      { ...db, settings },
      { sendEmail, scriptUrl: settings.appsScriptUrl }
    );

    setIsSyncing(false);
    setSyncStatus(result);

    if (result.success) {
      const refreshed = getDatabase();
      setDb(refreshed);
      setSettings(refreshed.settings);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!settings.appsScriptUrl) {
      alert('Please enter your Google Apps Script URL first.');
      return;
    }

    if (!confirm('Warning: Restoring from Google Cloud will replace your current local data. Continue?')) {
      return;
    }

    setIsSyncing(true);
    const result = await pullFromGoogleCloud(settings.appsScriptUrl);
    setIsSyncing(false);

    if (result.success && result.data) {
      saveDatabase(result.data);
      setDb(result.data);
      setSettings(result.data.settings);
      alert('Data successfully restored from Google Cloud!');
    } else {
      alert('Restore failed: ' + (result.error || 'Could not fetch data'));
    }
  };

  const handleBackup = async () => {
    const jsonStr = JSON.stringify(db, null, 2);
    if (typeof window !== 'undefined' && window.electronAPI) {
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

  const copyScriptCode = () => {
    const code = `/**
 * EVO BILL - Google Apps Script Cloud Engine
 * Destination: workwoeking@gmail.com
 */
const TARGET_EMAIL = "workwoeking@gmail.com";

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var payload = JSON.parse(raw);
    var action = payload.action || 'sync';
    var db = payload.data;
    var targetEmail = payload.targetEmail || TARGET_EMAIL;
    var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create("EVO BILL - Live Database");

    if (action === 'sync' || action === 'push') {
      syncInvoices(ss, db.invoices || []);
      syncCustomers(ss, db.customers || []);
      syncItems(ss, db.items || []);
      syncDaybook(ss, db.daybook || []);
      syncJobs(ss, db.jobs || []);
      syncSalary(ss, db.employees || []);
      saveMasterBackup(ss, db);
      if (payload.sendEmail) sendBackupEmail(targetEmail, db, ss.getUrl());

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "All data saved to Google Sheets and workwoeking@gmail.com!",
        sheetUrl: ss.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Master_JSON_Backup");
  var jsonStr = sheet ? sheet.getRange(1, 1).getValue() : "{}";
  return ContentService.createTextOutput(jsonStr).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name) { var s = ss.getSheetByName(name); return s ? s : ss.insertSheet(name); }
function formatHeader(sheet, headers) { sheet.clear(); sheet.appendRow(headers); sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#ff7a00").setFontColor("#ffffff"); }
function syncInvoices(ss, list) { var s = getOrCreateSheet(ss, "Invoices"); formatHeader(s, ["Bill No", "Date", "Customer", "Phone", "Total (₹)", "Paid (₹)", "Due (₹)", "Status"]); if(!list.length) return; var r = list.map(i => [i.no, i.date, i.custName, i.custPhone||"", i.total, i.received, i.due, i.status]); s.getRange(2, 1, r.length, 8).setValues(r); }
function syncCustomers(ss, list) { var s = getOrCreateSheet(ss, "Customers"); formatHeader(s, ["Name", "Phone", "GSTIN", "Address", "Balance (₹)"]); if(!list.length) return; var r = list.map(c => [c.name, c.phone||"", c.gstin||"", c.address||"", c.balance||0]); s.getRange(2, 1, r.length, 5).setValues(r); }
function syncItems(ss, list) { var s = getOrCreateSheet(ss, "Items"); formatHeader(s, ["Item Name", "HSN", "Unit", "Sale Price (₹)", "Stock"]); if(!list.length) return; var r = list.map(it => [it.name, it.hsn||"", it.unit||"Pcs", it.salePrice, it.stock]); s.getRange(2, 1, r.length, 5).setValues(r); }
function syncDaybook(ss, list) { var s = getOrCreateSheet(ss, "Daybook"); formatHeader(s, ["Date", "Type", "Flow", "Category", "Desc", "Amount (₹)"]); if(!list.length) return; var r = list.map(d => [d.date, d.type, d.flow, d.category, d.desc, d.amount]); s.getRange(2, 1, r.length, 6).setValues(r); }
function syncJobs(ss, list) { var s = getOrCreateSheet(ss, "RepairJobs"); formatHeader(s, ["Job No", "Date", "Customer", "Device", "Problem", "Estimate (₹)", "Status"]); if(!list.length) return; var r = list.map(j => [j.jobNo, j.date, j.custName, j.device, j.problem, j.estimate, j.status]); s.getRange(2, 1, r.length, 7).setValues(r); }
function syncSalary(ss, list) { var s = getOrCreateSheet(ss, "Salary"); formatHeader(s, ["Staff Name", "Role", "Salary (₹)"]); if(!list.length) return; var r = list.map(e => [e.name, e.role, e.monthlySalary]); s.getRange(2, 1, r.length, 3).setValues(r); }
function saveMasterBackup(ss, db) { var s = getOrCreateSheet(ss, "Master_JSON_Backup"); s.clear(); s.getRange(1, 1).setValue(JSON.stringify(db)); }
function sendBackupEmail(email, db, sheetUrl) {
  var totalSales = (db.invoices||[]).reduce((s,i)=>s+(i.total||0),0);
  MailApp.sendEmail({
    to: email,
    subject: "📊 EVO BILL Data Backup - " + new Date().toLocaleDateString(),
    htmlBody: "<h3>EVO BILL Backup</h3><p>Total Sales: ₹" + totalSales + "</p><p><a href='" + sheetUrl + "'>Open Google Sheets Database</a></p>"
  });
}`;

    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-black text-white">System Settings</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Business profile, Google Apps Script Cloud Sync (workwoeking@gmail.com), thermal printer
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

      {/* ================= GOOGLE APPS SCRIPT CLOUD BACKUP & GMAIL ================= */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-orange-500/40 rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shadow-md">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Google Apps Script Cloud Sync &amp; Email Backup</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  Live
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Connected Destination Account: <b className="text-orange-400">{DEFAULT_TARGET_EMAIL}</b>
              </p>
            </div>
          </div>

          {settings.lastCloudSync && (
            <div className="text-[11px] text-zinc-400 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800">
              Last Synced: <span className="font-semibold text-emerald-400">{formatDate(settings.lastCloudSync)}</span>
            </div>
          )}
        </div>

        {/* Input field for Web App URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-zinc-300">
            Google Apps Script Web App URL *
          </label>
          <input
            type="url"
            placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
            value={settings.appsScriptUrl || ''}
            onChange={(e) => setSettings({ ...settings, appsScriptUrl: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-orange-500"
          />
          <p className="text-[11px] text-zinc-500">
            બધો ડેટા (Invoices, Customers, Items, Jobs, Cashbook) આ Apps Script ના Google Sheets માં સેવ થશે અને <b>{DEFAULT_TARGET_EMAIL}</b> પર ઈમેલ સમરી મોકલાશે.
          </p>
        </div>

        {/* Actions buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => handleCloudSync(false)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-bold text-xs rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync to Google Sheets Now'}</span>
          </button>

          <button
            onClick={() => handleCloudSync(true)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 transition-all disabled:opacity-50"
          >
            <Mail className="w-3.5 h-3.5 text-orange-400" />
            <span>Send Email Backup to {DEFAULT_TARGET_EMAIL}</span>
          </button>

          <button
            onClick={handleRestoreFromCloud}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl border border-zinc-700 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Restore from Google Cloud</span>
          </button>
        </div>

        {/* Status message */}
        {syncStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold border ${
              syncStatus.success
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {syncStatus.message}
            {syncStatus.sheetUrl && (
              <a
                href={syncStatus.sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-2 underline font-bold inline-flex items-center gap-1 text-white"
              >
                <span>Open Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Setup guide collapsible */}
        <div className="pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setShowScriptGuide(!showScriptGuide)}
            className="flex items-center justify-between w-full text-xs font-bold text-orange-400 hover:text-orange-300"
          >
            <span>Google Apps Script Setup Guide (1-Minute Setup)</span>
            {showScriptGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showScriptGuide && (
            <div className="mt-3 p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3 text-xs text-zinc-300">
              <ol className="list-decimal list-inside space-y-1.5 text-zinc-400">
                <li>
                  <b className="text-white">workwoeking@gmail.com</b> એકાઉન્ટમાં{' '}
                  <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-orange-400 underline">
                    sheets.new
                  </a>{' '}
                  ખોલો.
                </li>
                <li>
                  ટોપ મેનુમાં <b>Extensions</b> &rarr; <b>Apps Script</b> પર ક્લિક કરો.
                </li>
                <li>ત્યાં પહેલાથી લખેલો કોડ ડિલીટ કરીને નીચેનો કોડ પેસ્ટ કરો.</li>
                <li>
                  ટોપ-રાઇટ માં <b>Deploy</b> &rarr; <b>New deployment</b> &rarr; Type: <b>Web app</b> સિલેક્ટ કરો.
                </li>
                <li>
                  <b>Execute as:</b> &quot;Me (workwoeking@gmail.com)&quot; અને <b>Who has access:</b> &quot;Anyone&quot; રાખો.
                </li>
                <li>
                  <b>Deploy</b> કરીને મળેલ Web App URL કોપી કરી ઉપરના બોક્સમાં પેસ્ટ કરો!
                </li>
              </ol>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={copyScriptCode}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-lg text-xs"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Code Copied!' : 'Copy Complete Google Apps Script Code'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
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

      {/* Offline JSON Backup */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
          <HardDrive className="w-4 h-4" />
          <span>Local File Backup</span>
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
