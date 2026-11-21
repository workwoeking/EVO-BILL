'use client';

import React, { useEffect, useState } from 'react';
import {
  Key,
  Laptop,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  RefreshCw,
  Loader2,
  ShieldAlert,
  Copy,
  Trash2
} from 'lucide-react';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState('');

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/licenses');
      const json = await res.json();
      if (json.success) {
        setLicenses(json.licenses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const revokeLicense = async (licenseId: string) => {
    if (!confirm('Are you sure you want to REVOKE this license? The customer will lose desktop app access.')) return;
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', license_id: licenseId }),
      });
      const json = await res.json();
      if (json.success) {
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unbindDevice = async (deviceId: string) => {
    if (!confirm('Unbind this hardware device? The customer can then activate a new PC.')) return;
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_device', device_id: deviceId }),
      });
      const json = await res.json();
      if (json.success) {
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>License & Device Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate anti-piracy hardware license keys, inspect motherboard machine IDs, and unbind replaced devices.
          </p>
        </div>

        <button
          onClick={fetchLicenses}
          className="p-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all text-xs flex items-center gap-1.5 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Licenses Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
            <span className="text-xs">Loading license keys and hardware registries...</span>
          </div>
        ) : licenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No customer licenses generated yet. Onboard a customer to generate their first license.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950/40">
                  <th className="py-3 px-4">License Key</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Bound Devices</th>
                  <th className="py-3 px-4">Max PCs</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {licenses.map((lic) => {
                  const devices = lic.customer_devices || [];

                  return (
                    <tr key={lic.license_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                            {lic.license_key}
                          </span>
                          <button
                            onClick={() => copyToClipboard(lic.license_key)}
                            className="text-slate-400 hover:text-white"
                            title="Copy Key"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {copiedKey === lic.license_key && (
                            <span className="text-[10px] text-emerald-400 font-semibold">Copied!</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{lic.customer?.business_name || 'N/A'}</p>
                        <p className="font-mono text-[10px] text-slate-500">{lic.customer_id}</p>
                      </td>
                      <td className="py-3 px-4">
                        {devices.length === 0 ? (
                          <span className="text-slate-500 text-[11px]">No device bound yet</span>
                        ) : (
                          <div className="space-y-1">
                            {devices.map((d: any) => (
                              <div
                                key={d.id}
                                className="flex items-center gap-1.5 text-[11px] bg-slate-950 p-1 px-2 rounded border border-slate-800"
                              >
                                <Laptop className="w-3 h-3 text-blue-400" />
                                <span className="font-mono truncate max-w-[120px] text-slate-300">
                                  {d.hardware_machine_id}
                                </span>
                                <button
                                  onClick={() => unbindDevice(d.id)}
                                  className="text-rose-400 hover:text-rose-300 ml-auto"
                                  title="Unbind Device"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {lic.max_devices} {lic.max_devices > 1 ? 'Devices' : 'Device'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {lic.expires_at ? new Date(lic.expires_at).toISOString().split('T')[0] : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            lic.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {lic.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {lic.status === 'active' && (
                          <button
                            onClick={() => revokeLicense(lic.license_id)}
                            className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
