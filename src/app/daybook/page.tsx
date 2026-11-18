'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, ArrowDownLeft, ArrowUpRight, Calendar, Trash2, Wallet, CreditCard } from 'lucide-react';
import { getDatabase, saveDatabase, AppDatabase } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DaybookEntry } from '@/types/billing';

export default function DaybookPage() {
  const [data, setData] = useState<AppDatabase | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [flowFilter, setFlowFilter] = useState<'all' | 'cash' | 'online'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [entryType, setEntryType] = useState<'in' | 'out'>('in');
  const [flow, setFlow] = useState<'cash' | 'online'>('cash');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Sales');

  useEffect(() => {
    setData(getDatabase());
  }, []);

  if (!data) return null;

  const entriesForDate = (data.daybook || []).filter((e) => e.date === selectedDate);

  const filteredEntries = entriesForDate.filter((e) => {
    if (flowFilter === 'cash') return e.flow === 'cash';
    if (flowFilter === 'online') return e.flow === 'online';
    return true;
  });

  // Calculate day totals
  const cashIn = entriesForDate.filter((e) => e.flow === 'cash' && e.type === 'in').reduce((s, e) => s + e.amount, 0);
  const cashOut = entriesForDate.filter((e) => e.flow === 'cash' && e.type === 'out').reduce((s, e) => s + e.amount, 0);
  const cashNet = cashIn - cashOut;

  const onlineIn = entriesForDate.filter((e) => e.flow === 'online' && e.type === 'in').reduce((s, e) => s + e.amount, 0);
  const onlineOut = entriesForDate.filter((e) => e.flow === 'online' && e.type === 'out').reduce((s, e) => s + e.amount, 0);
  const onlineNet = onlineIn - onlineOut;

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const newEntry: DaybookEntry = {
      id: `day-${Date.now()}`,
      date: selectedDate,
      type: entryType,
      flow,
      category,
      desc: desc.trim() || (entryType === 'in' ? 'Receipt' : 'Expense'),
      amount: parsedAmount,
    };

    const updated = {
      ...data,
      daybook: [newEntry, ...(data.daybook || [])],
    };

    saveDatabase(updated);
    setData(updated);
    setIsModalOpen(false);
    // Reset
    setAmount('');
    setDesc('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this entry?')) {
      const updated = {
        ...data,
        daybook: data.daybook.filter((e) => e.id !== id),
      };
      saveDatabase(updated);
      setData(updated);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-orange-500" />
            <span>Daily Cashbook</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Track daily cash and UPI/bank collections, petty expenses, and daily balances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700/80 px-3 py-1.5 rounded-lg text-xs text-white">
            <Calendar className="w-3.5 h-3.5 text-orange-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setEntryType('in');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Cash In</span>
          </button>

          <button
            onClick={() => {
              setEntryType('out');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>- Cash Out</span>
          </button>
        </div>
      </div>

      {/* Cash vs Online Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cash Flow */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Physical Cash Flow</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              Net: {formatCurrency(cashNet)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Cash In</span>
              <span className="text-emerald-400 font-bold text-base">{formatCurrency(cashIn)}</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 block text-[10px] uppercase">Cash Out</span>
              <span className="text-rose-400 font-bold text-base">{formatCurrency(cashOut)}</span>
            </div>
          </div>
        </div>

        {/* Online Flow */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Online Flow (UPI / Bank)</h3>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400">
              Net: {formatCurrency(onlineNet)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Online In</span>
              <span className="text-blue-400 font-bold text-base">{formatCurrency(onlineIn)}</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 block text-[10px] uppercase">Online Out</span>
              <span className="text-rose-400 font-bold text-base">{formatCurrency(onlineOut)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-zinc-900/40 p-2 rounded-xl border border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFlowFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              flowFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Transactions ({entriesForDate.length})
          </button>
          <button
            onClick={() => setFlowFilter('cash')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              flowFilter === 'cash' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Cash Only
          </button>
          <button
            onClick={() => setFlowFilter('online')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              flowFilter === 'online' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Online / UPI Only
          </button>
        </div>

        <div className="text-xs font-semibold text-zinc-300 pr-2">
          Total Net for {formatDate(selectedDate)}: <span className="font-bold text-orange-400">{formatCurrency(cashNet + onlineNet)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16 px-4">
            <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">No Entries for {formatDate(selectedDate)}</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              There are no cash or online transactions recorded for this date. Click "+ Cash In" or "- Cash Out" above.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Particulars / Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Flow Mode</th>
                <th className="py-3 px-4 text-right">In (+)</th>
                <th className="py-3 px-4 text-right">Out (-)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {filteredEntries.map((e, idx) => (
                <tr key={e.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 text-zinc-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-white">{e.desc}</td>
                  <td className="py-3 px-4 text-zinc-400">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.flow === 'cash' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {e.flow === 'cash' ? 'Cash' : 'Online / UPI'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    {e.type === 'in' ? formatCurrency(e.amount) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-400">
                    {e.type === 'out' ? formatCurrency(e.amount) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {entryType === 'in' ? 'Record Cash / Money In (+)' : 'Record Cash / Money Out (-)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Payment Mode / Flow
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFlow('cash')}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                      flow === 'cash'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlow('online')}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                      flow === 'online'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Online / UPI / Bank
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-base font-bold text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                >
                  <option value="Sales">Customer Payment / Sales</option>
                  <option value="Expenses">Shop Expense / Tea / Snacks</option>
                  <option value="Rent">Rent / Electricity</option>
                  <option value="Vendor">Vendor / Supplier Payment</option>
                  <option value="Salary">Staff Advance / Salary</option>
                  <option value="Repair">Repair Service Income</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received from customer for order #100"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white text-xs font-bold rounded-lg ${
                    entryType === 'in' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
