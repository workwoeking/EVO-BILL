'use client';

import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, AlertTriangle, Trash2, Edit, ArrowUpDown } from 'lucide-react';
import { getDatabase, saveDatabase, AppDatabase } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { InventoryItem } from '@/types/billing';

export default function ItemsPage() {
  const [data, setData] = useState<AppDatabase | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [hsn, setHsn] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [salePrice, setSalePrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');

  useEffect(() => {
    setData(getDatabase());
  }, []);

  if (!data) return null;

  const items = data.items || [];

  const filtered = items.filter((it) => {
    const matchesSearch =
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      (it.hsn && it.hsn.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'low') {
      return matchesSearch && it.stock <= (it.minStock !== undefined ? it.minStock : 5);
    }
    return matchesSearch;
  });

  const lowStockCount = items.filter(
    (it) => it.stock <= (it.minStock !== undefined ? it.minStock : 5)
  ).length;

  const totalInventoryValue = items.reduce(
    (sum, it) => sum + (it.salePrice || 0) * (it.stock || 0),
    0
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an item name');
      return;
    }

    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      name: name.trim(),
      hsn: hsn.trim(),
      unit,
      salePrice: Number(salePrice) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 5,
    };

    const updated = {
      ...data,
      items: [newItem, ...(data.items || [])],
    };

    saveDatabase(updated);
    setData(updated);
    setIsModalOpen(false);

    // Reset
    setName('');
    setHsn('');
    setSalePrice('');
    setPurchasePrice('');
    setStock('0');
    setMinStock('5');
  };

  const handleAdjustStock = (id: string, delta: number) => {
    const updatedItems = items.map((it) => {
      if (it.id === id) {
        return { ...it, stock: Math.max(0, it.stock + delta) };
      }
      return it;
    });

    const updated = { ...data, items: updatedItems };
    saveDatabase(updated);
    setData(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this product/service?')) {
      const updated = {
        ...data,
        items: items.filter((it) => it.id !== id),
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
            <Package className="w-6 h-6 text-orange-500" />
            <span>Items & Inventory Stock</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your product inventory, HSN codes, selling rates, and low stock warnings
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-bold text-xs rounded-lg transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product / Item</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Total Products</span>
          <div className="text-2xl font-black text-white mt-1">{items.length} items</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Low Stock Alerts</span>
          <div className="text-2xl font-black text-rose-400 mt-1 flex items-center gap-2">
            <span>{lowStockCount} items</span>
            {lowStockCount > 0 && <AlertTriangle className="w-5 h-5 text-rose-400" />}
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Estimated Stock Value</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(totalInventoryValue)}
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
            All Products ({items.length})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'low'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Low Stock Only ({lowStockCount})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search item name or HSN..."
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
            <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">No Items Found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Your inventory catalog is currently empty. Click "+ Add New Product / Item" to create your inventory.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">HSN/SAC</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 text-right">Sale Price (₹)</th>
                <th className="py-3 px-4 text-right">Purchase Price (₹)</th>
                <th className="py-3 px-4 text-center">In Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {filtered.map((it) => {
                const isLow = it.stock <= (it.minStock !== undefined ? it.minStock : 5);
                return (
                  <tr key={it.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{it.name}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">{it.hsn || '-'}</td>
                    <td className="py-3.5 px-4 text-zinc-400">{it.unit}</td>
                    <td className="py-3.5 px-4 text-right font-black text-orange-400">
                      {formatCurrency(it.salePrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-zinc-400">
                      {it.purchasePrice ? formatCurrency(it.purchasePrice) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleAdjustStock(it.id, -1)}
                          className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                          title="Decrease Stock"
                        >
                          -
                        </button>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            isLow
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-zinc-800 text-white'
                          }`}
                        >
                          {it.stock} {it.unit}
                        </span>
                        <button
                          onClick={() => handleAdjustStock(it.id, 1)}
                          className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                          title="Increase Stock"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(it.id)}
                        className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 rounded"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Product / Service</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Item / Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Mouse, Screen Replacement"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    HSN / SAC Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8471"
                    value={hsn}
                    onChange={(e) => setHsn(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                  >
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Box">Box</option>
                    <option value="Kg">Kg</option>
                    <option value="Mtr">Mtr (Meter)</option>
                    <option value="Ltr">Ltr (Liter)</option>
                    <option value="Nos">Nos</option>
                    <option value="Service">Service / Job</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Purchase Rate (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Initial Stock Qty
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Low Stock Alert At
                  </label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
