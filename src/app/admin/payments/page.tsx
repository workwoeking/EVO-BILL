'use client';

import React, { useEffect, useState } from 'react';
import {
  BadgeDollarSign,
  Search,
  PlusCircle,
  Download,
  CreditCard,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  Calendar,
  Building2,
  Printer
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New Payment Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    total_amount: '',
    paid_amount: '',
    pending_amount: '0',
    payment_method: 'UPI',
    payment_status: 'paid',
    transaction_reference: '',
    notes: '',
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments');
      const json = await res.json();
      if (json.success) {
        setPayments(json.payments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setFormData({
          customer_id: '',
          total_amount: '',
          paid_amount: '',
          pending_amount: '0',
          payment_method: 'UPI',
          payment_status: 'paid',
          transaction_reference: '',
          notes: '',
        });
        fetchPayments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      p.payment_id.toLowerCase().includes(search.toLowerCase()) ||
      p.customer_id.toLowerCase().includes(search.toLowerCase()) ||
      (p.customer?.business_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.payment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCollected = payments
    .filter((p) => p.payment_status === 'paid')
    .reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

  const totalPending = payments
    .filter((p) => p.payment_status === 'pending')
    .reduce((sum, p) => sum + Number(p.pending_amount || p.total_amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Payment Records & Invoicing</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track subscription fee payments, UPI receipts, pending balances, and verified transactions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Collected</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">₹{totalCollected.toLocaleString('en-IN')}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Verified Bank & UPI Receipts</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Pending Receivables</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">₹{totalPending.toLocaleString('en-IN')}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Outstanding Invoices</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Transactions</span>
          <div className="text-2xl font-extrabold text-white mt-1">{payments.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Payment entries on record</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Payment ID, Customer ID, or Business Name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'paid', 'pending'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
          <button
            onClick={fetchPayments}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
            <span className="text-xs">Loading payment records...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No payments match the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950/40">
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Pending</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPayments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-300">{p.payment_id}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{p.customer?.business_name || p.customer_id}</p>
                      <p className="text-[10px] font-mono text-slate-500">{p.customer_id}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">₹{p.total_amount}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">₹{p.paid_amount}</td>
                    <td className="py-3.5 px-4 text-amber-400 font-medium">₹{p.pending_amount || 0}</td>
                    <td className="py-3.5 px-4 text-slate-400">{p.payment_date}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          p.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
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

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Record Customer Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EVO-2026-0001"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Total Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value, paid_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Paid Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.paid_amount}
                    onChange={(e) => {
                      const paid = Number(e.target.value);
                      const tot = Number(formData.total_amount);
                      setFormData({
                        ...formData,
                        paid_amount: e.target.value,
                        pending_amount: String(Math.max(0, tot - paid)),
                        payment_status: paid >= tot ? 'paid' : 'pending',
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Method</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / QR)</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer / IMPS / NEFT</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Transaction Ref / UTR (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/123456789012"
                  value={formData.transaction_reference}
                  onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-md shadow-blue-600/30"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
