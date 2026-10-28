/**
 * HRM, Shift Scheduling & Ethiopian Payroll Management.
 * Staff duty roster with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface StaffMember {
  name: string;
  code: string;
  dept: string;
  role: string;
  shift: string;
  baseSalary: number;
}

const mockStaff: StaffMember[] = [
  { name: 'Dr. Bekele Tadesse', code: 'EMP-101', dept: 'General Surgery', role: 'Senior Surgeon', shift: 'Morning (08:00 - 16:00)', baseSalary: 24000 },
  { name: 'Nurse Chaltu Abera', code: 'EMP-102', dept: 'ICU Ward', role: 'Head Nurse', shift: 'Night (23:00 - 08:00)', baseSalary: 12500 },
  { name: 'Gemechu Desta', code: 'EMP-103', dept: 'Laboratory', role: 'Lab Technologist', shift: 'Afternoon (16:00 - 23:00)', baseSalary: 9800 },
  { name: 'Solomon Kassa', code: 'EMP-104', dept: 'Dispensary', role: 'Clinical Pharmacist', shift: 'Morning (08:00 - 16:00)', baseSalary: 11200 },
];

export default function HRMPage(): React.ReactElement {
  const { t } = useTranslation();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember>(mockStaff[0]);
  const [dutyAllowance, setDutyAllowance] = useState<number>(3000);
  const [overtime, setOvertime] = useState<number>(1500);

  // Ethiopian Payroll Calculation
  const base = selectedStaff.baseSalary;
  const gross = base + dutyAllowance + overtime;
  const employeePension = Math.round(base * 0.07);
  const employerPension = Math.round(base * 0.11);

  // Progressive Tax schedule
  let incomeTax = 0;
  if (gross <= 600) incomeTax = 0;
  else if (gross <= 1650) incomeTax = gross * 0.10 - 60;
  else if (gross <= 3200) incomeTax = gross * 0.15 - 142.5;
  else if (gross <= 5250) incomeTax = gross * 0.20 - 302.5;
  else if (gross <= 7800) incomeTax = gross * 0.25 - 565;
  else if (gross <= 10900) incomeTax = gross * 0.30 - 955;
  else incomeTax = gross * 0.35 - 1500;
  incomeTax = Math.round(Math.max(0, incomeTax));

  const totalDeductions = employeePension + incomeTax;
  const netPay = gross - totalDeductions;

  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']} moduleName="HRM & Staff Payroll" category="administrative">
      <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 lg:p-8 space-y-6">
          {/* Header Bar with Rectangular Responsive Spotlight */}
          <div className="group flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-7 py-5 rounded-3xl border-2 border-slate-200/90 shadow-xs hover:border-teal-500 hover:bg-teal-50/40 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  👔
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('hrm')} • Hospital Human Resources & 24/7 Shift Roster
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Ethiopian Labor & Civil Service Proclamation No. 979/2016 • Pension 7%/11% • Shift Allowances
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-800 border border-teal-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                Active Workforce: 348 Staff
              </span>
            </div>
          </div>

          {/* Quick Stats Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Clinical Staff</span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">348</p>
              <p className="mt-1 text-xs text-teal-600 font-bold">42 Doctors • 186 Nurses</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">On Active Duty Now</span>
              <p className="mt-2 text-3xl font-black text-emerald-600 group-hover:text-emerald-950 transition-colors">114 Staff</p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">Morning Shift (08:00 - 16:00)</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Net Payroll</span>
              <p className="mt-2 text-3xl font-black text-blue-700 group-hover:text-blue-950 transition-colors">ETB 4.2M</p>
              <p className="mt-1 text-xs text-blue-600 font-bold">Includes hazard & night duty</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pension Remittance</span>
              <p className="mt-2 text-3xl font-black text-purple-700 group-hover:text-purple-950 transition-colors">100%</p>
              <p className="mt-1 text-xs text-purple-600 font-bold">POESSA verified transfer</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Staff Roster & Shifts (Floating Card-Rows Table) */}
            <div className="col-span-2 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Today&apos;s Clinical Duty Roster (24/7 Shifts)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
                  <thead>
                    <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-2">Employee</th>
                      <th className="px-5 py-2">Department</th>
                      <th className="px-5 py-2">Role</th>
                      <th className="px-5 py-2">Assigned Shift</th>
                      <th className="px-5 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockStaff.map((staff, idx) => (
                      <tr
                        key={idx}
                        className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                      >
                        <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900">
                          {staff.name}
                          <span className="block font-mono text-[10px] text-slate-400">{staff.code}</span>
                        </td>
                        <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-700">
                          {staff.dept}
                        </td>
                        <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-semibold text-slate-600">
                          {staff.role}
                        </td>
                        <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                          <span className="rounded-xl bg-teal-50 border border-teal-200 px-3 py-1 font-bold text-teal-800 text-xs">
                            {staff.shift}
                          </span>
                        </td>
                        <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right">
                          <button
                            onClick={() => setSelectedStaff(staff)}
                            className="rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/40 transition-all cursor-pointer shadow-xs"
                          >
                            Calculate Payslip
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ethiopian Payroll Slip Calculator with Rectangular Spotlight */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-7 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                  Ethiopian Payslip Preview
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedStaff.name} • {selectedStaff.code}</p>
              </div>

              <div className="mt-4 space-y-3 text-xs font-semibold">
                <div className="flex justify-between text-slate-600">
                  <span>Base Salary:</span>
                  <span className="font-mono font-bold text-slate-900">{base.toLocaleString()} ETB</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Duty Allowance (ETB)
                  </label>
                  <input
                    type="number"
                    value={dutyAllowance}
                    onChange={(e) => setDutyAllowance(Number(e.target.value))}
                    className="w-full rounded-xl border-2 border-slate-200 p-2 text-xs font-mono font-bold hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Overtime / On-Call (ETB)
                  </label>
                  <input
                    type="number"
                    value={overtime}
                    onChange={(e) => setOvertime(Number(e.target.value))}
                    className="w-full rounded-xl border-2 border-slate-200 p-2 text-xs font-mono font-bold hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 focus:outline-none transition-all"
                  />
                </div>

                <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-2 text-sm">
                  <span>Gross Earnings:</span>
                  <span className="text-teal-700 font-mono">{gross.toLocaleString()} ETB</span>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2 text-xs border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Employee Pension (7%):</span>
                    <span className="font-mono font-bold text-rose-600">- {employeePension.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Employer Pension (11%):</span>
                    <span className="font-mono text-slate-500">{employerPension.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Employment Income Tax:</span>
                    <span className="font-mono font-bold text-rose-600">- {incomeTax.toLocaleString()} ETB</span>
                  </div>
                </div>

                <div className="border-t-2 border-teal-600 pt-3 flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-slate-900">Net Take-Home Pay:</span>
                  <span className="text-xl font-black text-emerald-700 font-mono">{netPay.toLocaleString()} ETB</span>
                </div>

                <button
                  type="button"
                  className="w-full mt-4 rounded-2xl bg-teal-600 py-3 text-xs font-black text-white shadow-sm hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/50 hover:shadow-md transition-all cursor-pointer"
                >
                  Approve & Post to General Ledger
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
