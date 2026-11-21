'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, User, Building2, Mail, Phone, MapPin, FileText,
  Calendar, Shield, CreditCard, ExternalLink, CheckCircle2,
  XCircle, Clock, AlertTriangle, RefreshCw, Loader2, Key
} from 'lucide-react';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id as string;
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`);
      const json = await res.json();
      if (json.success) setCustomer(json.customer);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchCustomer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_status: status }),
      });
      const json = await res.json();
      if (json.success) { showToast(`Status: ${status}`); fetchCustomer(); }
      else showToast(`Failed: ${json.error}`, false);
    } catch (err: any) { showToast(err.message, false); }
    finally { setActionLoading(false); }
  };

  const extendSubscription = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extend_months: extendMonths }),
      });
      const json = await res.json();
      if (json.success) { showToast(`Extended ${extendMonths} month(s)`); fetchCustomer(); }
      else showToast(`Failed: ${json.error}`, false);
    } catch (err: any) { showToast(err.message, false); }
    finally { setActionLoading(false); }
  };

  const provisionSheet = async () => {
    if (!customer) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/sheets/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, business_name: customer.business_name }),
      });
      const json = await res.json();
      if (json.success) { showToast(json.already_existed ? 'Already exists!' : `Created: ${json.title}`); fetchCustomer(); }
      else showToast(`Failed: ${json.error}`, false);
    } catch (err: any) { showToast(err.message, false); }
    finally { setActionLoading(false); }
  };

  const sc: Record<string, string> = {
    active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    suspended: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    blocked: 'text-red-400 bg-red-500/10 border-red-500/30',
    expired: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (!customer) return (
    <div className="text-center py-24 text-slate-400">
      <XCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
      <p>Customer not found.</p>
      <Link href="/admin/customers" className="text-blue-400 underline text-sm mt-2 inline-block">Back to Customers</Link>
    </div>
  );

  const sub = customer.subscriptions?.[0];
  const lic = customer.licenses?.[0];
  const sheet = customer.google_sheet_mapping?.[0];
  const isSheetReal = sheet?.spreadsheet_id && !sheet.spreadsheet_id.startsWith('placeholder_');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border
          ${toast.ok ? 'bg-emerald-900/90 text-emerald-300 border-emerald-700' : 'bg-red-900/90 text-red-300 border-red-700'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/customers" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white">{customer.customer_name}</h1>
            <p className="text-xs text-slate-400 font-mono">{customer.customer_id}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${sc[customer.account_status] || sc.expired}`}>
          {customer.account_status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Customer Info */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><User className="w-4 h-4 text-blue-400" /> Customer Information</h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><span className="text-slate-400">Name</span><p className="text-white font-medium mt-0.5">{customer.customer_name}</p></div>
              <div><span className="text-slate-400">Customer ID</span><p className="text-blue-400 font-mono font-bold mt-0.5">{customer.customer_id}</p></div>
              <div><span className="text-slate-400">Email</span><p className="text-white mt-0.5 flex items-center gap-1"><Mail className="w-3 h-3" />{customer.email}</p></div>
              <div><span className="text-slate-400">Mobile</span><p className="text-white mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{customer.mobile}</p></div>
              <div><span className="text-slate-400">Business</span><p className="text-white font-medium mt-0.5 flex items-center gap-1"><Building2 className="w-3 h-3 text-purple-400" />{customer.business_name}</p></div>
              <div><span className="text-slate-400">GSTIN</span><p className="text-white font-mono mt-0.5">{customer.gstin || '—'}</p></div>
              {customer.address && <div className="col-span-2"><span className="text-slate-400">Address</span><p className="text-white mt-0.5 flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />{customer.address}</p></div>}
            </div>
          </div>

          {/* Subscription */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-400" /> Subscription</h2>
            {sub ? (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><span className="text-slate-400">Plan</span><p className="text-white font-medium mt-0.5">{sub.plan?.name || sub.plan_id}</p></div>
                <div><span className="text-slate-400">Status</span><p className={`font-bold mt-0.5 uppercase ${sub.status === 'active' ? 'text-emerald-400' : 'text-yellow-400'}`}>{sub.status}</p></div>
                <div><span className="text-slate-400">Start</span><p className="text-white mt-0.5">{sub.start_date}</p></div>
                <div><span className="text-slate-400">Expiry</span><p className="text-white mt-0.5">{sub.expiry_date}</p></div>
              </div>
            ) : <p className="text-xs text-slate-500">No subscription found.</p>}
            <div className="border-t border-slate-800 pt-4 flex items-center gap-3">
              <select value={extendMonths} onChange={(e) => setExtendMonths(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5">
                {[1,2,3,6,12].map(m => <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>)}
              </select>
              <button onClick={extendSubscription} disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50">
                {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Extend
              </button>
            </div>
          </div>

          {/* License */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Key className="w-4 h-4 text-yellow-400" /> License</h2>
            {lic ? (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="col-span-2"><span className="text-slate-400">License Key</span><p className="text-yellow-300 font-mono font-bold mt-0.5 text-sm">{lic.license_key}</p></div>
                <div><span className="text-slate-400">Status</span><p className={`font-bold mt-0.5 uppercase ${lic.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>{lic.status}</p></div>
                <div><span className="text-slate-400">Max Devices</span><p className="text-white mt-0.5">{lic.max_devices}</p></div>
                <div><span className="text-slate-400">Expires</span><p className="text-white mt-0.5">{lic.expires_at ? new Date(lic.expires_at).toLocaleDateString('en-IN') : '—'}</p></div>
                <div><span className="text-slate-400">Bound Devices</span><p className="text-white mt-0.5">{lic.customer_devices?.length || 0}</p></div>
              </div>
            ) : <p className="text-xs text-slate-500">No license found.</p>}
          </div>

          {/* Payments */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-pink-400" /> Payment History</h2>
            {customer.payments?.length > 0 ? (
              <table className="w-full text-xs">
                <thead><tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-2 text-left">ID</th><th className="pb-2 text-left">Date</th>
                  <th className="pb-2 text-right">Amount</th><th className="pb-2 text-left">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-800/50">
                  {customer.payments.map((p: any) => (
                    <tr key={p.payment_id}>
                      <td className="py-2 font-mono text-slate-300 text-[10px]">{p.payment_id}</td>
                      <td className="py-2 text-slate-400">{p.payment_date}</td>
                      <td className="py-2 text-right font-bold text-white">&#8377;{p.paid_amount}</td>
                      <td className="py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${p.payment_status === 'paid' ? 'text-emerald-400 bg-emerald-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>{p.payment_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-xs text-slate-500">No payments recorded.</p>}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white">Account Actions</h2>
            <div className="flex flex-col gap-2">
              <button onClick={() => updateStatus('active')} disabled={actionLoading || customer.account_status === 'active'}
                className="w-full py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" /> Activate
              </button>
              <button onClick={() => updateStatus('suspended')} disabled={actionLoading || customer.account_status === 'suspended'}
                className="w-full py-2 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-500/30 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors">
                <AlertTriangle className="w-3.5 h-3.5" /> Suspend
              </button>
              <button onClick={() => updateStatus('blocked')} disabled={actionLoading || customer.account_status === 'blocked'}
                className="w-full py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors">
                <XCircle className="w-3.5 h-3.5" /> Block
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Google Sheet
            </h2>
            {isSheetReal ? (
              <div className="space-y-2 text-xs">
                <p className="text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Sheet Active</p>
                <p className="text-slate-400 font-mono text-[10px] break-all">{sheet.spreadsheet_id}</p>
                <a href={sheet.spreadsheet_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline text-xs">
                  <ExternalLink className="w-3 h-3" /> Open in Google Sheets
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-yellow-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> No real sheet yet</p>
                <button onClick={provisionSheet} disabled={actionLoading}
                  className="w-full py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
                  {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                  Create Google Sheet
                </button>
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-white">Account Meta</h2>
            <div className="space-y-2 text-slate-400">
              <div><span className="block">Registered</span><span className="text-white">{customer.registration_date || customer.created_at?.split('T')[0] || '—'}</span></div>
              <div><span className="block">Auth User ID</span><span className="text-white font-mono text-[10px] break-all">{customer.auth_user_id || '—'}</span></div>
              {customer.notes && <div><span className="block">Notes</span><span className="text-white">{customer.notes}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
