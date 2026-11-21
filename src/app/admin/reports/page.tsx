'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Users,
  CreditCard,
  BadgeDollarSign,
  FileSpreadsheet,
  Calendar,
  Layers,
  RefreshCw,
  Loader2
} from 'lucide-react';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const exportCustomersCSV = () => {
    if (!data?.customers || data.customers.length === 0) return;
    const headers = ['Customer ID', 'Business Name', 'Contact Person', 'Mobile', 'Email', 'Status', 'Date'];
    const rows = data.customers.map((c: any) => [
      c.customer_id,
      `"${c.business_name}"`,
      `"${c.customer_name}"`,
      c.mobile,
      c.email,
      c.account_status,
      c.registration_date,
    ]);
    downloadCSV(headers, rows, 'customers_report.csv');
  };

  const exportRevenueCSV = () => {
    if (!data?.payments || data.payments.length === 0) return;
    const headers = ['Payment ID', 'Customer ID', 'Amount', 'Date', 'Method', 'Status'];
    const rows = data.payments.map((p: any) => [
      p.payment_id,
      p.customer_id,
      p.paid_amount,
      p.payment_date,
      p.payment_method,
      p.payment_status,
    ]);
    downloadCSV(headers, rows, 'revenue_payments_report.csv');
  };

  const downloadCSV = (headers: string[], rows: any[][], filename: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCustomers = data?.customers?.length || 0;
  const activeCustomers = data?.customers?.filter((c: any) => c.account_status === 'active').length || 0;
  const totalRevenue = data?.payments
    ?.filter((p: any) => p.payment_status === 'paid')
    .reduce((sum: number, p: any) => sum + Number(p.paid_amount || 0), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>SaaS Analytics & Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate and export business growth metrics, financial summaries, and tenant status reports in Excel/CSV format.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="p-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all text-xs flex items-center gap-1.5 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Revenue</span>
            <div className="text-2xl font-extrabold text-white mt-1">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <p className="text-[11px] text-emerald-400 mt-0.5">All-time collected</p>
          </div>
          <button
            onClick={exportRevenueCSV}
            className="p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Customer Base</span>
            <div className="text-2xl font-extrabold text-white mt-1">{totalCustomers} Tenants</div>
            <p className="text-[11px] text-slate-400 mt-0.5">{activeCustomers} Active accounts</p>
          </div>
          <button
            onClick={exportCustomersCSV}
            className="p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Database Engine</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">Supabase DB</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Multi-Tenant Isolated RLS</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
            Active
          </div>
        </div>
      </div>

      {/* Downloadable Report Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Customer Master Registry (CSV)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Export a complete CSV spreadsheet containing all customer names, phone numbers, email addresses, registration dates, and subscription statuses.
          </p>
          <button
            onClick={exportCustomersCSV}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Customer Registry (.CSV)</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BadgeDollarSign className="w-4 h-4 text-emerald-400" />
            <span>Financial & Revenue Ledger (CSV)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Export all payment records, paid amounts, pending balances, payment methods (UPI/Cash/Bank Transfer), and dates for accounting.
          </p>
          <button
            onClick={exportRevenueCSV}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-600/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Revenue Ledger (.CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
