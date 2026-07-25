import React, { useState, useEffect } from 'react';
import { getAllRequests, getCategories, listUsers, exportRequestsCSV } from '../../lib/api';
import type { ServiceRequest, Category, User } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Download, FileText, Filter, Calendar, ClipboardList, CheckCircle2, Clock, Flame } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export const ReportsPage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState('30');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [officerFilter, setOfficerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqData, catData, userData] = await Promise.all([
        getAllRequests(),
        getCategories(),
        listUsers(),
      ]);
      setRequests(reqData);
      setCategories(catData);
      setOfficers(userData.filter((u) => u.role_id === 'officer'));
    } finally {
      setLoading(false);
    }
  };

  // Filter Requests
  const filtered = requests.filter((r) => {
    if (categoryFilter && r.category_id !== categoryFilter) return false;
    if (officerFilter && r.assigned_officer_id !== officerFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  // Client-Side CSV Export
  const handleExportCSV = () => {
    const csvContent = exportRequestsCSV(filtered);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `campusfix-work-orders-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report downloaded successfully');
  };

  // Client-Side PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('CampusFix — Facilities Operations Report', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Filtered Requests: ${filtered.length}`, 14, 34);

    let y = 46;
    doc.setFont('helvetica', 'bold');
    doc.text('Ticket ID', 14, y);
    doc.text('Title', 42, y);
    doc.text('Category', 110, y);
    doc.text('Priority', 150, y);
    doc.text('Status', 180, y);

    doc.line(14, y + 2, 196, y + 2);
    y += 8;

    doc.setFont('helvetica', 'normal');
    filtered.slice(0, 20).forEach((r) => {
      doc.text(r.ticket_no, 14, y);
      doc.text(r.title.slice(0, 30), 42, y);
      doc.text((r.category_name || '').slice(0, 18), 110, y);
      doc.text(r.priority.toUpperCase(), 150, y);
      doc.text(r.status.replace('_', ' '), 180, y);
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`campusfix-facilities-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF Executive Report downloaded');
  };

  const totalCount = filtered.length;
  const resolvedCount = filtered.filter((r) => r.status === 'resolved').length;
  const inProgressCount = filtered.filter((r) => r.status === 'in_progress').length;
  const urgentCount = filtered.filter((r) => r.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading text-ledger-navy">Reports & Analytics</h1>
          <p className="text-sm text-ink/70 mt-0.5">
            Filter request metrics, generate summaries, and export CSV/PDF reports
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-worn-gold" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-worn-gold" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-ledger-navy uppercase">
          <Filter className="w-4 h-4 text-worn-gold" />
          <span>Report Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Time Horizon</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-1.5 bg-chalk border border-slate-300 rounded text-xs font-medium"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last Quarter (90 Days)</option>
              <option value="365">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-chalk border border-slate-300 rounded text-xs font-medium"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Assigned Officer</label>
            <select
              value={officerFilter}
              onChange={(e) => setOfficerFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-chalk border border-slate-300 rounded text-xs font-medium"
            >
              <option value="">All Officers</option>
              {officers.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status State</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-chalk border border-slate-300 rounded text-xs font-medium"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Filtered Volume" value={totalCount} icon={ClipboardList} variant="navy" />
        <StatCard label="Resolved Tickets" value={resolvedCount} icon={CheckCircle2} variant="green" />
        <StatCard label="In Progress" value={inProgressCount} icon={Clock} variant="gold" />
        <StatCard label="Urgent Priority" value={urgentCount} icon={Flame} variant="orange" />
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h2 className="text-base font-bold font-heading text-ledger-navy">Filtered Report Preview ({filtered.length} Work Orders)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold text-ledger-navy uppercase border-b border-slate-200">
                <th className="p-3">Ticket ID</th>
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Requester</th>
                <th className="p-3">Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono-data font-bold">{r.ticket_no}</td>
                  <td className="p-3 font-semibold text-ledger-navy">{r.title}</td>
                  <td className="p-3">{r.category_name}</td>
                  <td className="p-3 uppercase font-bold">{r.priority}</td>
                  <td className="p-3 uppercase font-bold">{r.status.replace('_', ' ')}</td>
                  <td className="p-3">{r.requester?.full_name}</td>
                  <td className="p-3">{r.assigned_officer?.full_name || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
