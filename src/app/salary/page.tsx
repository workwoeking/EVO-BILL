'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, Users, Calendar, Trash2, CheckCircle2, Wallet } from 'lucide-react';
import { getDatabase, saveDatabase, AppDatabase } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Employee, SalaryPayment } from '@/types/billing';

export default function SalaryPage() {
  const [data, setData] = useState<AppDatabase | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // Staff Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Technician');
  const [salary, setSalary] = useState('');

  // Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payMonth, setPayMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [payMode, setPayMode] = useState<'Cash' | 'Online'>('Cash');
  const [payNote, setPayNote] = useState('');

  useEffect(() => {
    setData(getDatabase());
  }, []);

  if (!data) return null;

  const employees = data.employees || [];

  // Flatten all salary vouchers across employees
  const allVouchers: { empName: string; empRole: string; payment: SalaryPayment }[] = [];
  employees.forEach((emp) => {
    (emp.payments || []).forEach((p) => {
      allVouchers.push({ empName: emp.name, empRole: emp.role, payment: p });
    });
  });

  allVouchers.sort(
    (a, b) => new Date(b.payment.date).getTime() - new Date(a.payment.date).getTime()
  );

  const totalPayroll = employees.reduce((sum, e) => sum + (e.monthlySalary || 0), 0);
  const currentMonthPaid = allVouchers
    .filter((v) => v.payment.month === payMonth)
    .reduce((sum, v) => sum + v.payment.amount, 0);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter staff name');
      return;
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      role: role.trim(),
      monthlySalary: Number(salary) || 0,
      joiningDate: new Date().toISOString().slice(0, 10),
      payments: [],
    };

    const updated = {
      ...data,
      employees: [newEmp, ...employees],
    };

    saveDatabase(updated);
    setData(updated);
    setIsStaffModalOpen(false);

    // Reset
    setName('');
    setPhone('');
    setSalary('');
  };

  const handlePaySalary = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!selectedEmpId || !amt || amt <= 0) {
      alert('Please select staff and enter valid amount');
      return;
    }

    const targetEmp = employees.find((emp) => emp.id === selectedEmpId);
    if (!targetEmp) return;

    const newPayment: SalaryPayment = {
      id: `sal-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      month: payMonth,
      amount: amt,
      paymentMode: payMode,
      note: payNote.trim(),
    };

    const updatedEmployees = employees.map((emp) => {
      if (emp.id === selectedEmpId) {
        return {
          ...emp,
          payments: [newPayment, ...(emp.payments || [])],
        };
      }
      return emp;
    });

    // Also record in daybook under salary expense
    const dayEntry = {
      id: `day-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'out' as const,
      flow: payMode.toLowerCase() as 'cash' | 'online',
      category: 'Salary',
      desc: `Salary Paid to ${targetEmp.name} (${payMonth})`,
      amount: amt,
    };

    const updated = {
      ...data,
      employees: updatedEmployees,
      daybook: [dayEntry, ...(data.daybook || [])],
    };

    saveDatabase(updated);
    setData(updated);
    setIsPayModalOpen(false);
    setPayAmount('');
    setPayNote('');
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Delete this staff member and their payment records?')) {
      const updated = {
        ...data,
        employees: employees.filter((e) => e.id !== id),
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
            <CreditCard className="w-6 h-6 text-orange-500" />
            <span>Employee & Staff Salary</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage staff profiles, monthly payroll, advance disbursements, and salary vouchers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Staff</span>
          </button>
          <button
            onClick={() => {
              if (employees.length === 0) {
                alert('Please add a staff member first');
                return;
              }
              setSelectedEmpId(employees[0].id);
              setPayAmount(String(employees[0].monthlySalary || ''));
              setIsPayModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-bold text-xs rounded-lg transition-all shadow-lg shadow-orange-500/20"
          >
            <Wallet className="w-4 h-4" />
            <span>Disburse Salary</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Active Staff</span>
          <div className="text-2xl font-black text-white mt-1">{employees.length} employees</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Monthly Payroll Budget</span>
          <div className="text-2xl font-black text-orange-400 mt-1">
            {formatCurrency(totalPayroll)}
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Paid this month ({payMonth})</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(currentMonthPaid)}
          </div>
        </div>
      </div>

      {/* Staff List Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Staff Members
        </h3>

        {employees.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8 text-center">
            <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-400">No staff members registered.</p>
            <p className="text-[11px] text-zinc-500">Click "+ Add Staff" above to record employees.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{emp.name}</h4>
                    <span className="text-[11px] text-orange-400 font-semibold">{emp.role}</span>
                    <p className="text-[11px] text-zinc-400 mt-1">{emp.phone || 'No phone'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteEmployee(emp.id)}
                    className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Salary</span>
                    <span className="font-black text-white">{formatCurrency(emp.monthlySalary)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEmpId(emp.id);
                      setPayAmount(String(emp.monthlySalary || ''));
                      setIsPayModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-bold"
                  >
                    Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salary Vouchers Table */}
      <div className="space-y-3 pt-4">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Salary Payment Vouchers History
        </h3>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
          {allVouchers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-xs text-zinc-500">No salary payments recorded yet.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Salary Month</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                {allVouchers.map((v) => (
                  <tr key={v.payment.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 text-zinc-400">{formatDate(v.payment.date)}</td>
                    <td className="py-3 px-4 font-bold text-white">{v.empName}</td>
                    <td className="py-3 px-4 text-zinc-400">{v.empRole}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-orange-400">
                      {v.payment.month}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                        {v.payment.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-400">
                      {formatCurrency(v.payment.amount)}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 text-[11px]">{v.payment.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Staff Member</h3>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Technician, Sales"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black text-xs font-bold rounded-lg"
                >
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Salary Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">Disburse Salary</h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePaySalary} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Select Employee *
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => {
                    setSelectedEmpId(e.target.value);
                    const found = employees.find((em) => em.id === e.target.value);
                    if (found) setPayAmount(String(found.monthlySalary || ''));
                  }}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                >
                  {employees.map((em) => (
                    <option key={em.id} value={em.id}>
                      {em.name} ({em.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Salary Month
                  </label>
                  <input
                    type="month"
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={payMode}
                    onChange={(e: any) => setPayMode(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online / UPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-base font-black text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Remarks / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full month salary, advance deduction"
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
                  Confirm & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
