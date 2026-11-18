'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Plus, Search, Share2, Receipt, Trash2, Phone, MapPin } from 'lucide-react';
import { getDatabase, saveDatabase, AppDatabase } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { Customer } from '@/types/billing';

export default function CustomersPage() {
  const [data, setData] = useState<AppDatabase | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'due'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  useEffect(() => {
    setData(getDatabase());
  }, []);

  if (!data) return null;

  // Calculate dynamic balances for each customer based on their invoices & opening balance
  const customersWithCalculatedBalances = (data.customers || []).map((c) => {
    const custInvoices = (data.invoices || []).filter(
      (inv) => inv.custId === c.id || inv.custName.toLowerCase() === c.name.toLowerCase()
    );
    const invoiceDue = custInvoices.reduce((sum, inv) => sum + (inv.due || 0), 0);
    const currentBalance = (c.openingBalance || 0) + invoiceDue;
    return { ...c, balance: currentBalance };
  });

  const filtered = customersWithCalculatedBalances.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase());
    if (filter === 'due') return matchesSearch && c.balance > 0;
    return matchesSearch;
  });

  const totalOutstanding = customersWithCalculatedBalances.reduce(
    (sum, c) => sum + (c.balance > 0 ? c.balance : 0),
    0
  );

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a customer name');
      return;
    }

    const opBal = Number(openingBalance) || 0;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gstin: gstin.trim().toUpperCase(),
      address: address.trim(),
      openingBalance: opBal,
      balance: opBal,
      createdAt: new Date().toISOString(),
    };

    const updated = {
      ...data,
      customers: [newCust, ...(data.customers || [])],
    };

    saveDatabase(updated);
    setData(updated);
    setIsModalOpen(false);

    // Reset
    setName('');
    setPhone('');
    setEmail('');
    setGstin('');
    setAddress('');
    setOpeningBalance('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this customer?')) {
      const updated = {
        ...data,
        customers: data.customers.filter((c) => c.id !== id),
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
            <Users className="w-6 h-6 text-orange-500" />
            <span>Customer Directory</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your customer accounts, contact info, and track outstanding ledger balances
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-bold text-xs rounded-lg transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Stats and filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Total Customers</span>
          <div className="text-2xl font-black text-white mt-1">
            {customersWithCalculatedBalances.length}
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Customers with Balance</span>
          <div className="text-2xl font-black text-rose-400 mt-1">
            {customersWithCalculatedBalances.filter((c) => c.balance > 0).length}
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Total Outstanding</span>
          <div className="text-2xl font-black text-rose-400 mt-1">
            {formatCurrency(totalOutstanding)}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Customers ({customersWithCalculatedBalances.length})
          </button>
          <button
            onClick={() => setFilter('due')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'due'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pending Due Only
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">No Customers Found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Your customer list is empty. Click "+ Add New Customer" to register your first client or party.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <Link
                      href={`/ledger?cust=${encodeURIComponent(c.id)}`}
                      className="hover:text-orange-400 transition-colors"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono">
                    {c.phone || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono uppercase">
                    {c.gstin || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 max-w-xs truncate">
                    {c.address || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black">
                    {c.balance > 0 ? (
                      <span className="text-rose-400">{formatCurrency(c.balance)}</span>
                    ) : c.balance < 0 ? (
                      <span className="text-emerald-400">{formatCurrency(Math.abs(c.balance))} (Adv)</span>
                    ) : (
                      <span className="text-zinc-500">₹0.00</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/ledger?cust=${encodeURIComponent(c.id)}`}
                        className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-semibold border border-zinc-700"
                        title="View Statement"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Ledger</span>
                      </Link>
                      {c.phone && (
                        <button
                          onClick={() => {
                            const text = encodeURIComponent(
                              `Dear ${c.name}, this is a gentle reminder that an amount of ${formatCurrency(
                                c.balance
                              )} is pending towards your account at ${data.settings.shopName}. Kindly clear the dues at your earliest convenience.`
                            );
                            window.open(
                              `https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${text}`,
                              '_blank'
                            );
                          }}
                          className="p-1.5 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 rounded"
                          title="Send WhatsApp Reminder"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 hover:bg-zinc-800 text-rose-400 hover:text-rose-300 rounded"
                        title="Delete Customer"
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

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Customer</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Gupta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="15-character GSTIN"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Billing / Shipping address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Opening Balance (₹) (Optional)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                />
                <span className="text-[10px] text-zinc-500">
                  Enter existing balance if customer already owes money.
                </span>
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
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black text-xs font-bold rounded-lg"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
