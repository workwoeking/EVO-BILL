'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Receipt, Search, Printer, Share2, Plus, ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react';
import { getDatabase, saveDatabase, AppDatabase } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Customer, Invoice, DaybookEntry } from '@/types/billing';

interface LedgerRow {
  id: string;
  date: string;
  desc: string;
  refNo: string;
  debit: number; // Sale / Invoice
  credit: number; // Payment received
  balance: number;
}

function LedgerContent() {
  const searchParams = useSearchParams();
  const initialCustId = searchParams?.get('cust') || '';

  const [data, setData] = useState<AppDatabase | null>(null);
  const [selectedCustId, setSelectedCustId] = useState(initialCustId);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'online'>('cash');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState('');

  useEffect(() => {
    const db = getDatabase();
    setData(db);
    if (!selectedCustId && db.customers && db.customers.length > 0) {
      setSelectedCustId(db.customers[0].id);
    }
  }, [selectedCustId]);

  const selectedCustomer = (data?.customers || []).find((c) => c.id === selectedCustId);

  // Compute ledger transactions for the selected customer
  const ledgerRows = useMemo(() => {
    if (!selectedCustomer || !data) return [];

    const rows: LedgerRow[] = [];
    let runningBal = selectedCustomer.openingBalance || 0;

    // 1. Opening Balance
    if (runningBal !== 0) {
      rows.push({
        id: 'op-bal',
        date: selectedCustomer.createdAt ? selectedCustomer.createdAt.slice(0, 10) : '2026-01-01',
        desc: 'Opening Balance',
        refNo: '-',
        debit: runningBal > 0 ? runningBal : 0,
        credit: runningBal < 0 ? Math.abs(runningBal) : 0,
        balance: runningBal,
      });
    }

    // 2. Invoices (Debits)
    const custInvoices = (data.invoices || []).filter(
      (inv) => inv.custId === selectedCustomer.id || inv.custName.toLowerCase() === selectedCustomer.name.toLowerCase()
    );

    // Collect all transaction points
    const transactions: { date: string; type: 'invoice' | 'payment'; data: any }[] = [];

    custInvoices.forEach((inv) => {
      transactions.push({ date: inv.date, type: 'invoice', data: inv });
      // If invoice has immediate received payment
      if (inv.received > 0) {
        transactions.push({
          date: inv.date,
          type: 'payment',
          data: {
            id: `pay-${inv.id}`,
            desc: `Payment Received (Inv #${inv.no})`,
            refNo: inv.no,
            amount: inv.received,
          },
        });
      }
    });

    // Also customer manual payments recorded in daybook
    const custDaybook = (data.daybook || []).filter(
      (d) => d.type === 'in' && d.desc.toLowerCase().includes(selectedCustomer.name.toLowerCase())
    );
    custDaybook.forEach((d) => {
      transactions.push({
        date: d.date,
        type: 'payment',
        data: {
          id: d.id,
          desc: `${d.desc} (${d.flow === 'cash' ? 'Cash' : 'UPI/Online'})`,
          refNo: 'RCPT',
          amount: d.amount,
        },
      });
    });

    // Sort chronologically
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    transactions.forEach((tx) => {
      if (tx.type === 'invoice') {
        const inv = tx.data as Invoice;
        runningBal += inv.total;
        rows.push({
          id: inv.id,
          date: inv.date,
          desc: `Tax Invoice`,
          refNo: inv.no,
          debit: inv.total,
          credit: 0,
          balance: runningBal,
        });
      } else {
        const pay = tx.data;
        runningBal -= pay.amount;
        rows.push({
          id: pay.id,
          date: tx.date,
          desc: pay.desc,
          refNo: pay.refNo,
          debit: 0,
          credit: pay.amount,
          balance: runningBal,
        });
      }
    });

    return rows;
  }, [selectedCustomer, data]);

  const currentBalance = ledgerRows.length > 0 ? ledgerRows[ledgerRows.length - 1].balance : selectedCustomer?.openingBalance || 0;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !data) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Add entry to daybook
    const dayEntry: DaybookEntry = {
      id: `rcpt-${Date.now()}`,
      date: payDate,
      type: 'in',
      flow: payMode,
      category: 'Sales',
      desc: `Payment from ${selectedCustomer.name}${payNote ? ` - ${payNote}` : ''}`,
      amount: amt,
    };

    // Update customer opening balance or invoices due
    let remainingToDeduct = amt;
    const updatedInvoices = data.invoices.map((inv) => {
      if (
        (inv.custId === selectedCustomer.id || inv.custName.toLowerCase() === selectedCustomer.name.toLowerCase()) &&
        inv.due > 0 &&
        remainingToDeduct > 0
      ) {
        const deduct = Math.min(inv.due, remainingToDeduct);
        remainingToDeduct -= deduct;
        const newDue = inv.due - deduct;
        const newRecv = inv.received + deduct;
        return {
          ...inv,
          due: newDue,
          received: newRecv,
          status: (newDue === 0 ? 'Paid' : 'Partial') as any,
        };
      }
      return inv;
    });

    const updated = {
      ...data,
      daybook: [dayEntry, ...data.daybook],
      invoices: updatedInvoices,
    };

    saveDatabase(updated);
    setData(updated);
    setIsPayModalOpen(false);
    setPayAmount('');
    setPayNote('');
  };

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-orange-500" />
            <span>Customer Statement & Ledger</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Complete transaction ledger history, invoices, payments, and running balance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedCustomer && (
            <>
              <button
                onClick={() => setIsPayModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Receive Payment</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ledger</span>
              </button>
              {selectedCustomer.phone && (
                <button
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Ledger Statement from ${data.settings.shopName}\nCustomer: ${selectedCustomer.name}\nNet Outstanding Balance: ${formatCurrency(
                        currentBalance
                      )}`
                    );
                    window.open(
                      `https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}?text=${text}`,
                      '_blank'
                    );
                  }}
                  className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 transition-all"
                  title="WhatsApp Statement"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Customer Selector */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-zinc-300">Select Customer:</label>
          <select
            value={selectedCustId}
            onChange={(e) => setSelectedCustId(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-orange-500 min-w-56"
          >
            {data.customers.length === 0 && <option value="">No Customers Added Yet</option>}
            {data.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedCustomer && (
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Phone</span>
              <span className="font-semibold text-zinc-200">{selectedCustomer.phone || '-'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">GSTIN</span>
              <span className="font-semibold text-zinc-200">{selectedCustomer.gstin || '-'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Net Balance Due</span>
              <span
                className={`font-black text-sm ${
                  currentBalance > 0
                    ? 'text-rose-400'
                    : currentBalance < 0
                    ? 'text-emerald-400'
                    : 'text-zinc-400'
                }`}
              >
                {formatCurrency(currentBalance)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ledger Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        {!selectedCustomer ? (
          <div className="text-center py-16 px-4">
            <Receipt className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">No Customer Selected</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Please register or select a customer above to view their statement of account.
            </p>
          </div>
        ) : ledgerRows.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Receipt className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">No Transactions for {selectedCustomer.name}</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              No bills or payment receipts have been recorded for this customer yet.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Particulars</th>
                <th className="py-3 px-4">Voucher / Ref #</th>
                <th className="py-3 px-4 text-right">Debit (Sales +)</th>
                <th className="py-3 px-4 text-right">Credit (Receipts -)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {ledgerRows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 text-zinc-400">{formatDate(row.date)}</td>
                  <td className="py-3 px-4 font-semibold text-white">{row.desc}</td>
                  <td className="py-3 px-4 font-mono text-zinc-400">{row.refNo}</td>
                  <td className="py-3 px-4 text-right font-bold text-rose-400">
                    {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-white">
                    {formatCurrency(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Receipt Modal */}
      {isPayModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Receive Payment from {selectedCustomer.name}
              </h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMode('cash')}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                      payMode === 'cash'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMode('online')}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                      payMode === 'online'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    UPI / Bank
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 2000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-base font-bold text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Remarks / Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. GooglePay Ref #12345"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                >
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LedgerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-400">Loading customer ledger...</div>}>
      <LedgerContent />
    </Suspense>
  );
}
