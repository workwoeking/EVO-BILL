'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Loader2,
  RotateCcw,
  Edit2
} from 'lucide-react';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editPrice, setEditPrice] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions');
      const json = await res.json();
      if (json.success) {
        setPlans(json.plans || []);
        setSubscriptions(json.subscriptions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdatePlanPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_plan',
          plan: {
            ...editingPlan,
            price_inr: Number(editPrice),
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingPlan(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Subscription & Plan Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure billing plans (Monthly, Half-Yearly, Yearly), pricing tiers, and monitor active customer renewals.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all text-xs flex items-center gap-1.5 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Pricing Plans Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Available Subscription Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
                    {p.id}
                  </span>
                  <button
                    onClick={() => {
                      setEditingPlan(p);
                      setEditPrice(p.price_inr.toString());
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit Price"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹{p.price_inr}</span>
                  <span className="text-xs text-slate-400">/ {p.billing_period_months} month{p.billing_period_months > 1 ? 's' : ''}</span>
                </div>

                <ul className="mt-5 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Up to <strong>{p.max_devices} PC / Laptop</strong> devices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Individual Google Spreadsheet Sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Unlimited GST Invoices & Quotations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>A4 Tax Invoice & Thermal Print</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between">
                <span>Status: Active Tier</span>
                <span>Auto-renewal optional</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Subscriptions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Active Tenant Subscriptions</span>
          </h3>
          <span className="text-xs text-slate-400">{subscriptions.length} Subscriptions recorded</span>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No customer subscriptions active yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950/40">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{s.customer_id}</td>
                    <td className="py-3 px-4 text-white font-medium">{s.customer?.business_name || s.customer_id}</td>
                    <td className="py-3 px-4 text-slate-300">{s.plan?.name || s.plan_id}</td>
                    <td className="py-3 px-4 text-slate-400">{s.start_date}</td>
                    <td className="py-3 px-4 font-bold text-rose-400">{s.expiry_date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Edit Plan Price: {editingPlan.name}</h3>
            <form onSubmit={handleUpdatePlanPrice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Price (₹ INR)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium shadow-md shadow-blue-600/30"
                >
                  Save Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
