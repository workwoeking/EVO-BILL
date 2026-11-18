'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Percent, Download, Printer, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { getDatabase, AppDatabase } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Invoice } from '@/types/billing';

export default function GSTPage() {
  const [data, setData] = useState<AppDatabase | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    setData(getDatabase());
  }, []);

  if (!data) return null;

  const invoices = data.invoices || [];

  // Filter invoices for selected period
  const monthInvoices = invoices.filter((i) => (i.date || '').slice(0, 7) === selectedMonth);

  // Separate B2B (has GSTIN) and B2C (no GSTIN)
  const b2bInvoices = monthInvoices.filter((i) => i.custGstin && i.custGstin.trim().length >= 10);
  const b2cInvoices = monthInvoices.filter((i) => !i.custGstin || i.custGstin.trim().length < 10);

  // Financial aggregates
  const totalTaxable = monthInvoices.reduce((sum, i) => sum + (i.subtotal - i.discount), 0);
  const totalTax = monthInvoices.reduce((sum, i) => sum + i.tax, 0);
  const totalSales = monthInvoices.reduce((sum, i) => sum + i.total, 0);

  // CGST and SGST split (assuming intra-state 50-50 default)
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  // E-Way Bill Candidates (Total > ₹50,000)
  const ewayCandidates = monthInvoices.filter((i) => i.total >= 50000);

  // HSN Breakdown
  const hsnMap: { [hsn: string]: { name: string; qty: number; taxable: number; tax: number; total: number } } = {};
  monthInvoices.forEach((inv) => {
    (inv.items || []).forEach((it) => {
      const code = it.hsn?.trim() || 'General';
      if (!hsnMap[code]) {
        hsnMap[code] = { name: it.name, qty: 0, taxable: 0, tax: 0, total: 0 };
      }
      hsnMap[code].qty += it.qty || 1;
      hsnMap[code].taxable += it.total || 0;
      hsnMap[code].tax += it.taxAmount || ((it.total * (it.taxRate || 18)) / 100);
      hsnMap[code].total += (it.total || 0) + (it.taxAmount || 0);
    });
  });

  const exportJSON = () => {
    const report = {
      gstin: data.settings.gstin,
      period: selectedMonth,
      summary: { totalSales, totalTaxable, totalTax, cgst, sgst },
      b2b: b2bInvoices,
      b2c: b2cInvoices,
      hsnSummary: hsnMap,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gst-return-${selectedMonth}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-orange-500" />
            <span>GST & E-Way Portal</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            GSTR-1, GSTR-3B tax computation, B2B/B2C split, and E-Way bill compliance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-semibold text-white focus:outline-none"
          />
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>Export GST JSON</span>
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700"
            title="Print Summary"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profile Notice */}
      <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold">
            GST
          </div>
          <div>
            <div className="font-bold text-white">Registered GSTIN: {data.settings.gstin || 'Not Configured'}</div>
            <div className="text-[11px] text-zinc-400">{data.settings.shopName} &middot; Regular Taxpayer</div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
          Period: {selectedMonth}
        </span>
      </div>

      {/* Tax Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Total Sales Value</span>
          <div className="text-2xl font-black text-white mt-1">{formatCurrency(totalSales)}</div>
          <span className="text-[10px] text-zinc-500">{monthInvoices.length} total bills</span>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Taxable Turnover</span>
          <div className="text-2xl font-black text-blue-400 mt-1">{formatCurrency(totalTaxable)}</div>
          <span className="text-[10px] text-zinc-500">Excluding tax</span>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">CGST (Central Tax)</span>
          <div className="text-2xl font-black text-orange-400 mt-1">{formatCurrency(cgst)}</div>
          <span className="text-[10px] text-zinc-500">Intra-state (50%)</span>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">SGST (State Tax)</span>
          <div className="text-2xl font-black text-orange-400 mt-1">{formatCurrency(sgst)}</div>
          <span className="text-[10px] text-zinc-500">Intra-state (50%)</span>
        </div>
      </div>

      {/* B2B vs B2C Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* B2B */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>B2B Invoices (Business with GSTIN)</span>
            </h3>
            <span className="text-xs font-bold text-emerald-400">{b2bInvoices.length} Bills</span>
          </div>

          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            {b2bInvoices.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No B2B invoices in this month.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-zinc-500 uppercase border-b border-zinc-800">
                  <tr>
                    <th className="py-2">Bill No</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">GSTIN</th>
                    <th className="py-2 text-right">Tax</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {b2bInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-2 font-mono text-white">{inv.no}</td>
                      <td className="py-2">{inv.custName}</td>
                      <td className="py-2 font-mono text-zinc-400 uppercase">{inv.custGstin}</td>
                      <td className="py-2 text-right text-orange-400">{formatCurrency(inv.tax)}</td>
                      <td className="py-2 text-right font-bold text-white">{formatCurrency(inv.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* B2C */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>B2C Invoices (Consumer / Unregistered)</span>
            </h3>
            <span className="text-xs font-bold text-blue-400">{b2cInvoices.length} Bills</span>
          </div>

          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            {b2cInvoices.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No B2C invoices in this month.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-zinc-500 uppercase border-b border-zinc-800">
                  <tr>
                    <th className="py-2">Bill No</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2 text-right">Tax</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {b2cInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-2 font-mono text-white">{inv.no}</td>
                      <td className="py-2">{inv.custName}</td>
                      <td className="py-2 text-right text-orange-400">{formatCurrency(inv.tax)}</td>
                      <td className="py-2 text-right font-bold text-white">{formatCurrency(inv.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* E-Way Bill Section */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" />
              <span>E-Way Bill Compliance (Bills &gt; ₹50,000)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Consignments requiring mandatory government E-Way Bill portal generation
            </p>
          </div>
          <span className="text-xs font-bold text-orange-400">
            {ewayCandidates.length} Eligible Consignments
          </span>
        </div>

        {ewayCandidates.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500">
            No bills exceeding the ₹50,000 E-Way Bill threshold in {selectedMonth}.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Party Name</th>
                <th className="py-2.5 px-3">Party GSTIN</th>
                <th className="py-2.5 px-3 text-right">Consignment Value</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {ewayCandidates.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2.5 px-3 font-mono font-bold text-white">{inv.no}</td>
                  <td className="py-2.5 px-3 text-zinc-400">{formatDate(inv.date)}</td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-100">{inv.custName}</td>
                  <td className="py-2.5 px-3 font-mono text-zinc-400 uppercase">{inv.custGstin || 'URP'}</td>
                  <td className="py-2.5 px-3 text-right font-black text-white">{formatCurrency(inv.total)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Required
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
