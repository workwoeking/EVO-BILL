'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  BadgeDollarSign,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  RefreshCw,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const metrics = data?.metrics || {
    totalCustomers: 0,
    activeCustomers: 0,
    expiredCustomers: 0,
    suspendedCustomers: 0,
    expiringSoon: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>SaaS Control Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
              Live Supabase
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time business performance, tenant subscriptions, and license oversight for Software Owner (<span className="text-blue-400">workwoeking@gmail.com</span>)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all text-xs flex items-center gap-1.5"
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add New Customer</span>
          </Link>
        </div>
      </div>

      {/* Customer Status Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Customers</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{metrics.totalCustomers}</div>
          <p className="text-[10px] text-slate-500 mt-1">Registered Tenants</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{metrics.activeCustomers}</div>
          <p className="text-[10px] text-slate-500 mt-1">Valid Subscriptions</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Expiring Soon</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">{metrics.expiringSoon}</div>
          <p className="text-[10px] text-slate-500 mt-1">Within 30 Days</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Expired</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">{metrics.expiredCustomers}</div>
          <p className="text-[10px] text-slate-500 mt-1">Need Renewal</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Suspended</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-300 tracking-tight">{metrics.suspendedCustomers}</div>
          <p className="text-[10px] text-slate-500 mt-1">Locked by Owner</p>
        </div>
      </div>

      {/* Financial & Revenue Performance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/20 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Total SaaS Revenue</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <BadgeDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">{formatINR(metrics.totalRevenue)}</div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> All-time collected
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">This Month Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">{formatINR(metrics.monthlyRevenue)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Current Billing Cycle</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Current Year Revenue</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-300 tracking-tight">{formatINR(metrics.yearlyRevenue)}</div>
          <p className="text-[11px] text-slate-400 mt-1">{new Date().getFullYear()} Annual Total</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/20 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Pending Receivables</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 tracking-tight">{formatINR(metrics.pendingPayments)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Pending Invoice Balances</p>
        </div>
      </div>

      {/* Visual Analytics & Growth Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Growth & Revenue Trend Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>SaaS Performance & Growth Trajectory</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Live database aggregations across active customer accounts</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                FY {new Date().getFullYear()}
              </span>
            </div>

            {/* Custom Interactive Pure CSS Chart */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Active Customer Ratio</span>
                  <span className="text-white font-semibold">
                    {metrics.totalCustomers > 0
                      ? Math.round((metrics.activeCustomers / metrics.totalCustomers) * 100)
                      : 100}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${metrics.totalCustomers > 0 ? (metrics.activeCustomers / metrics.totalCustomers) * 100 : 100}%`,
                    }}
                    className="bg-emerald-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Collected vs Pending Revenue</span>
                  <span className="text-white font-semibold">
                    {metrics.totalRevenue + metrics.pendingPayments > 0
                      ? Math.round((metrics.totalRevenue / (metrics.totalRevenue + metrics.pendingPayments)) * 100)
                      : 100}% Paid
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${metrics.totalRevenue + metrics.pendingPayments > 0 ? (metrics.totalRevenue / (metrics.totalRevenue + metrics.pendingPayments)) * 100 : 100}%`,
                    }}
                    className="bg-blue-500 rounded-full transition-all duration-500"
                  />
                  <div
                    style={{
                      width: `${metrics.totalRevenue + metrics.pendingPayments > 0 ? (metrics.pendingPayments / (metrics.totalRevenue + metrics.pendingPayments)) * 100 : 0}%`,
                    }}
                    className="bg-amber-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block uppercase">Retention</span>
              <span className="text-sm font-bold text-white">99.2%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block uppercase">Avg Plan Value</span>
              <span className="text-sm font-bold text-white">
                {metrics.totalCustomers > 0
                  ? formatINR(metrics.totalRevenue / metrics.totalCustomers)
                  : '₹4,499'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block uppercase">Multi-Device</span>
              <span className="text-sm font-bold text-white">Active</span>
            </div>
          </div>
        </div>

        {/* Expiring Subscriptions Watchlist */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Upcoming Expiry Feed</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                {metrics.expiringSoon} Attention
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Tenants requiring subscription renewal within the next 30 days.
            </p>

            <div className="space-y-2.5">
              {(data?.expiringSoonList || []).length === 0 ? (
                <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5 opacity-80" />
                  <p className="text-xs text-slate-300 font-medium">All accounts in good standing</p>
                  <p className="text-[10px] text-slate-500">No subscriptions expiring in the next 30 days.</p>
                </div>
              ) : (
                data.expiringSoonList.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{sub.customer?.business_name || 'Customer'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{sub.customer_id}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-rose-400 font-medium text-[11px]">{sub.expiry_date}</span>
                      <p className="text-[10px] text-slate-500">{sub.plan?.name || 'Plan'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <Link
              href="/admin/subscriptions"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-between font-medium group"
            >
              <span>Manage all subscriptions</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customer Registrations */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Recent Customer Onboarding</span>
            </h3>
            <Link
              href="/admin/customers"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {(data?.recentCustomers || []).length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-xs text-slate-400">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <p>No customers registered yet.</p>
              <Link
                href="/admin/customers"
                className="mt-2 inline-block text-blue-400 hover:underline"
              >
                Onboard your first customer
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-2.5">Customer ID</th>
                    <th className="pb-2.5">Business</th>
                    <th className="pb-2.5">Mobile</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.recentCustomers.map((c: any) => (
                    <tr key={c.customer_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-mono text-blue-400 font-medium">
                        <Link href={`/admin/customers/${c.customer_id}`}>{c.customer_id}</Link>
                      </td>
                      <td className="py-2.5 text-white font-medium">{c.business_name}</td>
                      <td className="py-2.5 text-slate-400">{c.mobile}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            c.account_status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {c.account_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Payments Received */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4 text-emerald-400" />
              <span>Recent Payments</span>
            </h3>
            <Link
              href="/admin/payments"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {(data?.recentPayments || []).length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-xs text-slate-400">
              <BadgeDollarSign className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <p>No payments recorded yet.</p>
              <Link
                href="/admin/payments"
                className="mt-2 inline-block text-blue-400 hover:underline"
              >
                Record initial payment
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-2.5">Payment ID</th>
                    <th className="pb-2.5">Customer</th>
                    <th className="pb-2.5">Amount</th>
                    <th className="pb-2.5">Method</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.recentPayments.map((p: any) => (
                    <tr key={p.payment_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-mono text-slate-300">{p.payment_id}</td>
                      <td className="py-2.5 text-white font-medium">{p.customer?.business_name || p.customer_id}</td>
                      <td className="py-2.5 text-emerald-400 font-bold">{formatINR(p.paid_amount)}</td>
                      <td className="py-2.5 text-slate-400">{p.payment_method}</td>
                      <td className="py-2.5">
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
      </div>
    </div>
  );
}
