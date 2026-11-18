'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Printer, Share2, Trash2, ArrowRightLeft, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { getDatabase, saveDatabase, AppDatabase } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Quote, InvoiceItem, Invoice } from '@/types/billing';

export default function QuotesPage() {
  const [data, setData] = useState<AppDatabase | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [type, setType] = useState<'Quotation' | 'Estimate' | 'Proforma'>('Quotation');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', name: '', qty: 1, price: 0, total: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setData(getDatabase());
  }, []);

  if (!data) return null;

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    const qty = Number(updated[index].qty) || 0;
    const price = Number(updated[index].price) || 0;
    updated[index].total = qty * price;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { id: Date.now().toString(), name: '', qty: 1, price: 0, total: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((s, it) => s + (it.total || 0), 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = (taxable * taxRate) / 100;
  const grandTotal = Math.round(taxable + tax);

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      alert('Please enter a customer name');
      return;
    }

    const nextNo = `${data.settings.quotePrefix}${data.settings.nextQuoteNumber}`;
    const newQuote: Quote = {
      id: `qt-${Date.now()}`,
      no: nextNo,
      type,
      date,
      validUntil,
      custId: `cust-${Date.now()}`,
      custName,
      custPhone,
      items: items.filter((it) => it.name.trim() !== ''),
      subtotal,
      discount,
      tax,
      total: grandTotal,
      notes,
      status: 'Sent',
    };

    const updated = {
      ...data,
      settings: {
        ...data.settings,
        nextQuoteNumber: data.settings.nextQuoteNumber + 1,
      },
      quotes: [newQuote, ...(data.quotes || [])],
    };

    saveDatabase(updated);
    setData(updated);
    setIsModalOpen(false);
    // Reset form
    setCustName('');
    setCustPhone('');
    setItems([{ id: '1', name: '', qty: 1, price: 0, total: 0 }]);
    setDiscount(0);
    setNotes('');
  };

  const handleConvertToInvoice = (quote: Quote) => {
    if (!confirm(`Convert quotation ${quote.no} to a tax invoice?`)) return;

    const nextInvNo = `${data.settings.invoicePrefix}${data.settings.nextInvoiceNumber}`;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      no: nextInvNo,
      date: new Date().toISOString().slice(0, 10),
      custId: quote.custId,
      custName: quote.custName,
      custPhone: quote.custPhone,
      items: quote.items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      tax: quote.tax,
      total: quote.total,
      received: 0,
      due: quote.total,
      status: 'Pending',
      notes: `Converted from ${quote.type} #${quote.no}`,
    };

    const updatedQuotes = data.quotes.map((q) =>
      q.id === quote.id ? { ...q, status: 'Converted' as const } : q
    );

    const updated = {
      ...data,
      settings: {
        ...data.settings,
        nextInvoiceNumber: data.settings.nextInvoiceNumber + 1,
      },
      quotes: updatedQuotes,
      invoices: [newInvoice, ...data.invoices],
    };

    saveDatabase(updated);
    setData(updated);
    alert(`Success! Generated Invoice ${nextInvNo}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this quotation?')) {
      const updated = {
        ...data,
        quotes: data.quotes.filter((q) => q.id !== id),
      };
      saveDatabase(updated);
      setData(updated);
    }
  };

  const filtered = (data.quotes || []).filter(
    (q) =>
      q.no.toLowerCase().includes(search.toLowerCase()) ||
      q.custName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-orange-500" />
            <span>Quotations & Estimates</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Create professional price estimates and convert them into bills anytime
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-bold text-xs rounded-lg transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation / Estimate</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quotation # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="text-xs text-zinc-400">
          Total Quotes: <span className="font-bold text-white">{filtered.length}</span>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileSpreadsheet className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">No Quotations Found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              You haven't created any quotations or estimates yet. Click "+ New Quotation" to create one.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Quote No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Items</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {filtered.map((quote) => (
                <tr key={quote.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-orange-400">
                    {quote.type}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {quote.no}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400">{formatDate(quote.date)}</td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-100">
                    <div>{quote.custName}</div>
                    {quote.custPhone && <div className="text-[10px] text-zinc-500">{quote.custPhone}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-right text-zinc-400">
                    {quote.items.length}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-white">
                    {formatCurrency(quote.total)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        quote.status === 'Converted'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : quote.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {quote.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {quote.status !== 'Converted' && (
                        <button
                          onClick={() => handleConvertToInvoice(quote)}
                          className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-[11px] font-semibold border border-emerald-500/30 transition-colors"
                          title="Convert to Invoice"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>To Invoice</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const text = encodeURIComponent(
                            `Hello ${quote.custName}, here is your quotation ${quote.no} for ${formatCurrency(
                              quote.total
                            )}.`
                          );
                          window.open(`https://wa.me/?text=${text}`, '_blank');
                        }}
                        className="p-1.5 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 rounded"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(quote.id)}
                        className="p-1.5 hover:bg-zinc-800 text-rose-400 hover:text-rose-300 rounded"
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

      {/* New Quote Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Quotation / Estimate</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Document Type
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                  >
                    <option value="Quotation">Quotation</option>
                    <option value="Estimate">Estimate</option>
                    <option value="Proforma">Proforma Invoice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Customer name"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="Contact mobile"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">Items / Products</span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {items.map((it, idx) => (
                    <div key={it.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Item name / description"
                        value={it.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-xs text-white"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={it.qty}
                        onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                        className="w-20 px-2 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-xs text-white text-right"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={it.price}
                        onChange={(e) => updateItem(idx, 'price', Number(e.target.value))}
                        className="w-24 px-2 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-xs text-white text-right"
                      />
                      <span className="w-24 text-right text-xs font-bold text-zinc-200">
                        {formatCurrency(it.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-between items-center pt-3 border-t border-zinc-800 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-zinc-400 mr-2">Discount (₹):</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white text-right"
                    />
                  </div>
                  <div>
                    <span className="text-zinc-400 mr-2">GST (%):</span>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-400">Grand Total:</div>
                  <div className="text-lg font-black text-orange-400">
                    {formatCurrency(grandTotal)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black text-xs font-bold rounded-lg"
                >
                  Save Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
