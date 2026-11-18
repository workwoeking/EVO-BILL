'use client';

import React, { useEffect, useState } from 'react';
import { Wrench, Plus, Search, Printer, Share2, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { getDatabase, saveDatabase, AppDatabase } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RepairJob, JobStatus } from '@/types/billing';

export default function RepairJobsPage() {
  const [data, setData] = useState<AppDatabase | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'ready' | 'delivered'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [custName, setCustName] = useState('');
  const [phone, setPhone] = useState('');
  const [device, setDevice] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [problem, setProblem] = useState('');
  const [estimate, setEstimate] = useState('');
  const [advance, setAdvance] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  useEffect(() => {
    setData(getDatabase());
  }, []);

  if (!data) return null;

  const jobs = data.jobs || [];

  const filtered = jobs.filter((j) => {
    const matchesSearch =
      j.jobNo.toLowerCase().includes(search.toLowerCase()) ||
      j.custName.toLowerCase().includes(search.toLowerCase()) ||
      j.device.toLowerCase().includes(search.toLowerCase());

    if (filter === 'open') return matchesSearch && (j.status === 'Received' || j.status === 'In Progress');
    if (filter === 'ready') return matchesSearch && j.status === 'Ready';
    if (filter === 'delivered') return matchesSearch && j.status === 'Delivered';
    return matchesSearch;
  });

  const openCount = jobs.filter((j) => j.status === 'Received' || j.status === 'In Progress').length;
  const readyCount = jobs.filter((j) => j.status === 'Ready').length;

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !device.trim()) {
      alert('Please fill customer name and device details');
      return;
    }

    const nextJobNo = `${data.settings.jobPrefix}${data.settings.nextJobNumber}`;
    const newJob: RepairJob = {
      id: `job-${Date.now()}`,
      jobNo: nextJobNo,
      date: new Date().toISOString().slice(0, 10),
      custName: custName.trim(),
      phone: phone.trim(),
      device: device.trim(),
      serialNo: serialNo.trim(),
      problem: problem.trim(),
      estimate: Number(estimate) || 0,
      advance: Number(advance) || 0,
      status: 'Received',
      deliveryDate,
    };

    const updated = {
      ...data,
      settings: {
        ...data.settings,
        nextJobNumber: data.settings.nextJobNumber + 1,
      },
      jobs: [newJob, ...jobs],
    };

    saveDatabase(updated);
    setData(updated);
    setIsModalOpen(false);

    // Reset
    setCustName('');
    setPhone('');
    setDevice('');
    setSerialNo('');
    setProblem('');
    setEstimate('');
    setAdvance('');
    setDeliveryDate('');
  };

  const handleUpdateStatus = (id: string, newStatus: JobStatus) => {
    const updatedJobs = jobs.map((j) => {
      if (j.id === id) {
        return { ...j, status: newStatus };
      }
      return j;
    });

    const updated = { ...data, jobs: updatedJobs };
    saveDatabase(updated);
    setData(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this repair job?')) {
      const updated = {
        ...data,
        jobs: jobs.filter((j) => j.id !== id),
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
            <Wrench className="w-6 h-6 text-orange-500" />
            <span>Repair & Service Jobs</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage device repair tickets, estimates, customer job cards, and delivery tracking
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-bold text-xs rounded-lg transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Repair Job Ticket</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Active / In Progress</span>
          <div className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-2">
            <span>{openCount} jobs</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Ready for Pickup</span>
          <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-2">
            <span>{readyCount} devices</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Total Tickets</span>
          <div className="text-2xl font-black text-white mt-1">{jobs.length} jobs</div>
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
            All Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'open'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pending / In Progress ({openCount})
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'ready'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Ready for Delivery ({readyCount})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search job #, customer, device..."
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
            <Wrench className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">No Repair Jobs Found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              There are no service tickets recorded yet. Click "+ New Repair Job Ticket" to intake a device.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Job #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Device & Problem</th>
                <th className="py-3 px-4 text-right">Estimate (₹)</th>
                <th className="py-3 px-4 text-right">Advance (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {filtered.map((j) => (
                <tr key={j.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">{j.jobNo}</td>
                  <td className="py-3.5 px-4 text-zinc-400">{formatDate(j.date)}</td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-100">
                    <div>{j.custName}</div>
                    {j.phone && <div className="text-[10px] text-zinc-500">{j.phone}</div>}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-orange-400">{j.device}</div>
                    <div className="text-zinc-400 text-[11px] max-w-xs truncate">{j.problem}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-white">
                    {formatCurrency(j.estimate)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-400">
                    {j.advance > 0 ? formatCurrency(j.advance) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <select
                      value={j.status}
                      onChange={(e: any) => handleUpdateStatus(j.id, e.target.value)}
                      className={`px-2 py-1 rounded text-[11px] font-bold border bg-zinc-950 ${
                        j.status === 'Ready'
                          ? 'border-emerald-500 text-emerald-400'
                          : j.status === 'Delivered'
                          ? 'border-zinc-700 text-zinc-400'
                          : 'border-amber-500 text-amber-400'
                      }`}
                    >
                      <option value="Received">Received</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Ready">Ready for Pickup</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {j.phone && (
                        <button
                          onClick={() => {
                            const msg =
                              j.status === 'Ready'
                                ? `Hello ${j.custName}, your device ${j.device} (Job #${j.jobNo}) is READY for pickup at ${data.settings.shopName}. Balance amount: ${formatCurrency(
                                    j.estimate - j.advance
                                  )}.`
                                : `Hello ${j.custName}, job #${j.jobNo} for your ${j.device} is currently ${j.status}.`;
                            window.open(
                              `https://wa.me/${j.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                msg
                              )}`,
                              '_blank'
                            );
                          }}
                          className="p-1.5 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 rounded"
                          title="WhatsApp Job Update"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(j.id)}
                        className="p-1.5 hover:bg-zinc-800 text-rose-400 hover:text-rose-300 rounded"
                        title="Delete Job"
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

      {/* New Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Create New Repair Job Ticket</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddJob} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Device / Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell Inspiron 15, iPhone 13"
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Serial No / IMEI (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Device serial / IMEI"
                    value={serialNo}
                    onChange={(e) => setSerialNo(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Reported Problem / Issue Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Screen flickering, no power on, heating issue..."
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={estimate}
                    onChange={(e) => setEstimate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Advance Paid (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={advance}
                    onChange={(e) => setAdvance(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
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
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black text-xs font-bold rounded-lg"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
