'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Receipt,
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  Share2,
  FileText,
  Search,
} from 'lucide-react';
import { getDatabase, AppDatabase } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Invoice } from '@/types/billing';

export default function DashboardPage() {
  const [data, setData] = useState<AppDatabase | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setData(getDatabase());
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const { invoices, customers, settings } = data;

  // Calculate statistics
  const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalReceived = invoices.reduce((sum, inv) => sum + (inv.received || 0), 0);
  const totalDue = invoices.reduce((sum, inv) => sum + (inv.due || 0), 0);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.no.toLowerCase().includes(search.toLowerCase()) ||
      inv.custName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{settings.shopName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              Next-Gen Desktop
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            GST Billing, Inventory & Point of Sale System
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-bold text-xs rounded-lg transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </Link>
          <Link
            href="/daybook"
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs rounded-lg border border-zinc-700/60 transition-all"
          >
            <span>Daily Cashbook</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Total Sales
              </p>
              <h3 className="text-xl font-black text-white mt-1">
                {formatCurrency(totalSales)}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-zinc-400">
            <span className="text-emerald-400 font-semibold mr-1.5 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              Active
            </span>
            <span>{invoices.length} invoices generated</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Total Received
              </p>
              <h3 className="text-xl font-black text-emerald-400 mt-1">
                {formatCurrency(totalReceived)}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-zinc-400">
            <span>Cash & Online combined</span>
          </div>
        </div>

        {/* Pending Due Amount */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Pending Balance
              </p>
              <h3 className="text-xl font-black text-rose-400 mt-1">
                {formatCurrency(totalDue)}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-rose-300">
            <span>Payment follow-up required</span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Total Accounts
              </p>
              <h3 className="text-xl font-black text-purple-400 mt-1">
                {customers.length}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-zinc-400">
            <span>Registered customers & parties</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices Section */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" />
              <span>Recent Invoices & Bills</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Manage your sales vouchers and transactions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500 w-64"
              />
            </div>
            <Link
              href="/invoices"
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold px-2 py-1"
            >
              View All &rarr;
            </Link>
          </div>
        </div>

        {/* Invoice Table or Empty State */}
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40">
            <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-zinc-300">No Invoices Yet</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              You haven't generated any bills yet. Click below to create your first tax invoice.
            </p>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-bold text-xs rounded-lg shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Invoice</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Due</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                {filteredInvoices.map((inv: Invoice) => (
                  <tr key={inv.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white font-mono">
                      {inv.no}
                    </td>
                    <td className="py-3 px-3 text-zinc-400">{formatDate(inv.date)}</td>
                    <td className="py-3 px-3 font-medium text-zinc-200">
                      {inv.custName}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      {inv.due > 0 ? (
                        <span className="text-rose-400">{formatCurrency(inv.due)}</span>
                      ) : (
                        <span className="text-zinc-500">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : inv.status === 'Partial'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (window.electronAPI) {
                              window.electronAPI.printInvoice();
                            } else {
                              window.print();
                            }
                          }}
                          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                          title="Print Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const text = encodeURIComponent(
                              `Hello ${inv.custName}, here is your invoice ${inv.no} of ${formatCurrency(
                                inv.total
                              )}. Due amount: ${formatCurrency(inv.due)}.`
                            );
                            window.open(`https://wa.me/?text=${text}`, '_blank');
                          }}
                          className="p-1.5 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 rounded transition-colors"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
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
