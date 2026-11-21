'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, Printer } from 'lucide-react';
import { getDatabase, saveDatabase, AppDatabase, DEFAULT_SETTINGS } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { InvoiceItem, Invoice } from '@/types/billing';
import A4PrintModal from '@/components/A4PrintModal';

export default function NewInvoicePage() {
  const router = useRouter();
  const [db, setDb] = useState<AppDatabase | null>(null);

  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custGstin, setCustGstin] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', name: '', qty: 1, price: 0, total: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(18); // Default 18% GST
  const [received, setReceived] = useState(0);

  // A4 Print Modal state
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    setDb(getDatabase());
  }, []);

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    // Recalculate item total
    const qty = Number(updated[index].qty) || 0;
    const price = Number(updated[index].price) || 0;
    updated[index].total = qty * price;
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), name: '', qty: 1, price: 0, total: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = (taxableAmount * taxRate) / 100;
  const grandTotal = Math.round(taxableAmount + tax);
  const due = Math.max(0, grandTotal - received);

  const handleSave = () => {
    if (!custName.trim()) {
      alert('Please enter a customer name');
      return;
    }

    const currentDb = db || getDatabase();
    const nextNo = `${currentDb.settings.invoicePrefix}${currentDb.settings.nextInvoiceNumber}`;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      no: nextNo,
      date,
      custId: `cust-${Date.now()}`,
      custName: custName.trim(),
      custPhone: custPhone.trim(),
      custGstin: custGstin.trim().toUpperCase(),
      custAddress: custAddress.trim(),
      items: items.filter((it) => it.name.trim() !== ''),
      subtotal,
      discount,
      tax,
      total: grandTotal,
      received,
      due,
      status: due === 0 ? 'Paid' : received > 0 ? 'Partial' : 'Pending',
      notes: 'Thank you for your business!',
    };

    const updatedDb = {
      ...currentDb,
      settings: {
        ...currentDb.settings,
        nextInvoiceNumber: currentDb.settings.nextInvoiceNumber + 1,
      },
      invoices: [newInvoice, ...currentDb.invoices],
    };

    saveDatabase(updatedDb);
    setDb(updatedDb);

    // Immediately trigger A4 Print preview and print dialog!
    setSavedInvoice(newInvoice);
    setIsPrintModalOpen(true);
  };

  const handleResetForNextBill = () => {
    setCustName('');
    setCustPhone('');
    setCustGstin('');
    setCustAddress('');
    setItems([{ id: Date.now().toString(), name: '', qty: 1, price: 0, total: 0 }]);
    setDiscount(0);
    setReceived(0);
    setIsPrintModalOpen(false);
    setSavedInvoice(null);
  };

  const invPrefix = db?.settings.invoicePrefix || DEFAULT_SETTINGS.invoicePrefix;
  const invNext = db?.settings.nextInvoiceNumber || DEFAULT_SETTINGS.nextInvoiceNumber;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-black text-white">Create New Invoice</h2>
            <p className="text-xs text-zinc-400">
              Invoice #{invPrefix}{invNext}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Save &amp; Print Bill (A4)</span>
        </button>
      </div>

      {/* Customer Info Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
          Customer &amp; Invoice Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Customer / Party Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Trading Co."
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="10-digit mobile"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Invoice Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Party Address
            </label>
            <input
              type="text"
              placeholder="Shop No, Street, City"
              value={custAddress}
              onChange={(e) => setCustAddress(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              GSTIN (Optional)
            </label>
            <input
              type="text"
              placeholder="15-character GSTIN"
              value={custGstin}
              onChange={(e) => setCustGstin(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white uppercase focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Item Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
            Items &amp; Services
          </h3>
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 font-semibold border-b border-zinc-800 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 w-28">HSN Code</th>
                <th className="py-2.5 px-3 w-20 text-right">Qty</th>
                <th className="py-2.5 px-3 w-28 text-right">Rate / Price (₹)</th>
                <th className="py-2.5 px-3 w-32 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="py-2 px-3 text-zinc-500">{index + 1}</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Product or service name..."
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="HSN/SAC"
                      value={item.hsn || ''}
                      onChange={(e) => updateItem(index, 'hsn', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                      className="w-16 px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-xs text-white text-right focus:outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                      className="w-24 px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-xs text-white text-right focus:outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-white">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => removeItem(index)}
                      className="text-zinc-500 hover:text-rose-400 p-1 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation summary */}
        <div className="flex justify-end pt-4 border-t border-zinc-800">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Discount (₹):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-24 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white text-right"
              />
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>GST Rate (%):</span>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-24 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white text-right"
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Tax (GST):</span>
              <span className="font-semibold text-white">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-zinc-700">
              <span>Grand Total:</span>
              <span className="text-orange-400">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400 pt-1">
              <span>Received (₹):</span>
              <input
                type="number"
                min="0"
                value={received}
                onChange={(e) => setReceived(Number(e.target.value))}
                className="w-24 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white text-right font-bold"
              />
            </div>
            <div className="flex justify-between text-xs font-bold pt-1">
              <span>Balance Due:</span>
              <span className={due > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {formatCurrency(due)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-800">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-orange-500/25 active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Generate &amp; Print A4 Invoice</span>
          </button>
        </div>
      </div>

      {/* A4 Fullscreen Print & Preview Modal */}
      {savedInvoice && db && (
        <A4PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            router.push('/invoices');
          }}
          document={savedInvoice}
          settings={db.settings}
          docType="Invoice"
          autoPrint={true}
        />
      )}
    </div>
  );
}
