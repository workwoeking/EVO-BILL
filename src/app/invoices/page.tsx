'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Printer, Share2, Trash2, Edit } from 'lucide-react';
import { getDatabase, AppDatabase, saveDatabase } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Invoice } from '@/types/billing';

export default function InvoicesPage() {
  const [data, setData] = useState<AppDatabase | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'due' | 'paid'>('all');

  useEffect(() => {
    setData(getDatabase());
  }, []);

  if (!data) return null;

  const filtered = data.invoices.filter((inv) => {
    const matchesSearch =
      inv.no.toLowerCase().includes(search.toLowerCase()) ||
      inv.custName.toLowerCase().includes(search.toLowerCase());
    if (filter === 'due') return matchesSearch && inv.due > 0;
    if (filter === 'paid') return matchesSearch && inv.due === 0;
    return matchesSearch;
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      const updated = {
        ...data,
        invoices: data.invoices.filter((i) => i.id !== id),
      };
      saveDatabase(updated);
      setData(updated);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-black text-white">Invoices & Billing</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Create, view and manage your sales invoices
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-bold text-xs rounded-lg transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setFilter('due')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'due'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pending / Due Only
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'paid'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Fully Paid
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Search className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">No Invoices Found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              There are no sales bills matching your current filter. Click "+ Create Invoice" to issue a new bill.
            </p>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-bold text-xs rounded-lg shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Tax (GST)</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {inv.no}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400">{formatDate(inv.date)}</td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-100">
                    {inv.custName}
                  </td>
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    {formatCurrency(inv.subtotal)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-zinc-400">
                    {formatCurrency(inv.tax)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-white">
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold">
                    {inv.due > 0 ? (
                      <span className="text-rose-400">{formatCurrency(inv.due)}</span>
                    ) : (
                      <span className="text-zinc-500">₹0.00</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
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
                  <td className="py-3.5 px-4 text-right">
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
                        title="Print"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="p-1.5 hover:bg-zinc-800 text-rose-400 hover:text-rose-300 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
