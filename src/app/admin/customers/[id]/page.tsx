'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Users,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Key,
  Laptop,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  RefreshCw,
  Plus,
  Loader2,
  RotateCcw
} from 'lucide-react';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const customerId = params.id;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [extendMonths, setExtendMonths] = useState(12);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`);
      const json = await res.json();
      if (json.success) {
        setCustomer(json.customer);
      }
    } catch (err) {
      console.error('Failed to load customer:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this customer as ${newStatus}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchCustomer();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtend = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extend_months: extendMonths }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`Subscription extended successfully by ${extendMonths} months!`);
        fetchCustomer();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
        <span className="text-xs">Loading customer profile...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-400">
        <h2 className="text-lg font-bold text-white mb-2">Customer Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">No customer record exists with ID {customerId}</p>
        <Link href="/admin/customers" className="text-xs text-blue-400 hover:underline">
          Return to Customer List
        </Link>
      </div>
    );
  }

  const sub = customer.subscriptions?.[0];
  const lic = customer.licenses?.[0];
  const sheet = customer.google_sheet_mapping?.[0];
  const devices = lic?.customer_devices || [];
  const payments = customer.payments || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back button and status header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{customer.business_name}</h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                {customer.customer_id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Contact: {customer.customer_name}</p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          {customer.account_status === 'active' ? (
            <button
              onClick={() => updateStatus('suspended')}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-all"
            >
              Suspend Customer
            </button>
          ) : (
            <button
              onClick={() => updateStatus('active')}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all"
            >
              Activate Customer
            </button>
          )}

          <button
            onClick={() => updateStatus('blocked')}
            disabled={actionLoading}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-all"
          >
            Block Access
          </button>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Business Details */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Business Information</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Business Name</span>
                <span className="font-semibold text-white">{customer.business_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Owner Name</span>
                <span className="font-semibold text-white">{customer.customer_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Mobile</span>
                <span className="font-semibold text-white">{customer.mobile}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Email</span>
                <span className="text-white truncate max-w-[170px]">{customer.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">GSTIN</span>
                <span className="font-mono text-blue-400">{customer.gstin || 'Not Provided'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Address</span>
                <span className="text-slate-300 text-right max-w-[180px]">{customer.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Google Spreadsheet Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Dedicated Google Spreadsheet</span>
            </h3>

            {sheet?.spreadsheet_url ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <p className="font-semibold text-white truncate">{sheet.spreadsheet_name}</p>
                <p className="text-[10px] text-slate-500 font-mono">ID: {sheet.spreadsheet_id}</p>
                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Auto-sync Active
                  </span>
                  <a
                    href={sheet.spreadsheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    <span>Open Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                <p>Google Sheet auto-provisioned upon customer login.</p>
              </div>
            )}
          </div>
        </div>

        {/* Middle & Right: Subscription, License, Devices & Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription & Expiry Extension Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>Subscription Plan & Lifecycle</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {sub?.plan?.name || 'Yearly Enterprise'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Start Date</span>
                <span className="font-semibold text-white">{sub?.start_date || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Expiry Date</span>
                <span className="font-semibold text-rose-400">{sub?.expiry_date || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Account Status</span>
                <span className="font-semibold text-emerald-400 uppercase">{customer.account_status}</span>
              </div>
            </div>

            {/* Extend Subscription Action */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-white">Extend Customer Subscription</p>
                <p className="text-[10px] text-slate-400">Adds validity to both subscription and hardware license.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(parseInt(e.target.value, 10))}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                >
                  <option value={1}>+1 Month</option>
                  <option value={3}>+3 Months</option>
                  <option value={6}>+6 Months</option>
                  <option value={12}>+1 Year</option>
                </select>
                <button
                  onClick={handleExtend}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Extend Validity</span>
                </button>
              </div>
            </div>
          </div>

          {/* License & Bound Hardware Devices Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Hardware License & Machine Binding</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                {lic?.license_key || 'EVO-XXXX-XXXX-XXXX'}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Maximum Devices Allowed: <strong className="text-white">{lic?.max_devices || 1} PC/Laptop</strong>. The desktop application binds to the motherboard machine ID to prevent piracy.
            </p>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Authorized Hardware Devices ({devices.length}/{lic?.max_devices || 1})
              </span>
              {devices.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                  No devices bound yet. Will automatically bind on first desktop app login.
                </div>
              ) : (
                devices.map((d: any) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Laptop className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="font-semibold text-white">{d.device_name}</p>
                        <p className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
                          Machine ID: {d.hardware_machine_id}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Bound & Active
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment History Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Payment Records</span>
            </h3>

            {payments.length === 0 ? (
              <p className="text-xs text-slate-500">No payment records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="pb-2">Payment ID</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Method</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {payments.map((p: any) => (
                      <tr key={p.payment_id}>
                        <td className="py-2.5 font-mono text-slate-300">{p.payment_id}</td>
                        <td className="py-2.5 text-slate-400">{p.payment_date}</td>
                        <td className="py-2.5 font-bold text-emerald-400">₹{p.paid_amount}</td>
                        <td className="py-2.5 text-slate-400">{p.payment_method}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase">
                            {p.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
