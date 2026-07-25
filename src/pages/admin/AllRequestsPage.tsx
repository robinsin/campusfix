import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllRequests, getCategories, listUsers, assignRequest } from '../../lib/api';
import type { ServiceRequest, Category, User } from '../../types';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { UserPlus, Eye } from 'lucide-react';
import { toast } from 'sonner';

export const AllRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [officerFilter, setOfficerFilter] = useState('');

  // Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetRequest, setTargetRequest] = useState<ServiceRequest | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assigning, setAssigning] = useState(false);

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
      setOfficers(userData.filter((u) => u.role_id === 'officer' && u.is_active));
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (req: ServiceRequest) => {
    setTargetRequest(req);
    setSelectedOfficerId(req.assigned_officer_id || '');
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!targetRequest || !selectedOfficerId) return;
    setAssigning(true);
    try {
      await assignRequest(targetRequest.id, selectedOfficerId);
      toast.success(`Assigned ${targetRequest.ticket_no} to officer.`);
      setAssignModalOpen(false);
      setTargetRequest(null);
      loadData();
    } catch (err) {
      toast.error('Failed to assign officer');
    } finally {
      setAssigning(false);
    }
  };

  // Filter Data
  const filteredRequests = requests.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNo = r.ticket_no.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchLoc = r.location.toLowerCase().includes(q);
      const matchReq = r.requester?.full_name.toLowerCase().includes(q);
      if (!matchNo && !matchTitle && !matchLoc && !matchReq) return false;
    }

    if (statusFilter && r.status !== statusFilter) return false;
    if (categoryFilter && r.category_id !== categoryFilter) return false;
    if (priorityFilter && r.priority !== priorityFilter) return false;
    if (officerFilter && r.assigned_officer_id !== officerFilter) return false;

    return true;
  });

  const columns: Column<ServiceRequest>[] = [
    {
      header: 'Ticket ID',
      accessor: (r) => (
        <span className="font-mono-data font-bold text-ledger-navy bg-slate-100 px-2 py-1 rounded text-xs">
          {r.ticket_no}
        </span>
      ),
      sortableKey: 'ticket_no',
    },
    {
      header: 'Title & Location',
      accessor: (r) => (
        <div>
          <Link
            to={`/app/requests/${r.id}`}
            className="font-bold text-ledger-navy hover:text-worn-gold transition-colors block text-sm"
          >
            {r.title}
          </Link>
          <span className="text-xs text-ink/60 truncate block">{r.location}</span>
        </div>
      ),
      sortableKey: 'title',
    },
    {
      header: 'Requester',
      accessor: (r) => <span className="text-xs font-semibold text-slate-700">{r.requester?.full_name}</span>,
      sortableKey: 'requester_id',
    },
    {
      header: 'Category',
      accessor: (r) => <span className="text-xs font-semibold text-slate-700">{r.category_name}</span>,
      sortableKey: 'category_name',
    },
    {
      header: 'Priority',
      accessor: (r) => <PriorityBadge priority={r.priority} />,
      sortableKey: 'priority',
    },
    {
      header: 'Status',
      accessor: (r) => <StatusBadge status={r.status} />,
      sortableKey: 'status',
    },
    {
      header: 'Assigned Officer',
      accessor: (r) => (
        <span className="text-xs font-semibold text-ledger-navy">
          {r.assigned_officer ? r.assigned_officer.full_name : <em className="text-slate-400 font-normal">Unassigned</em>}
        </span>
      ),
      sortableKey: 'assigned_officer_id',
    },
    {
      header: 'Actions',
      accessor: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openAssignModal(r)}
            className="px-3 py-1.5 text-xs font-bold bg-black text-white hover:bg-slate-800 rounded inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            title="Assign officer"
          >
            <UserPlus className="w-3.5 h-3.5 text-white" />
            <span>Assign</span>
          </button>
          <Link
            to={`/app/requests/${r.id}`}
            className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 text-black hover:bg-slate-200 border border-slate-300 rounded inline-flex items-center gap-1 transition-colors"
            title="View details"
          >
            <Eye className="w-3.5 h-3.5 text-black" />
            <span>View</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black font-heading text-ledger-navy">All Work Orders</h1>
        <p className="text-sm text-ink/70 mt-0.5">
          Master queue oversight and officer assignment control
        </p>
      </div>

      {/* Filter Bar with extra Officer Dropdown */}
      <div className="space-y-3">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          categories={categories}
          onReset={() => {
            setSearchQuery('');
            setStatusFilter('');
            setCategoryFilter('');
            setPriorityFilter('');
            setOfficerFilter('');
          }}
        />

        {/* Extra Officer Filter Row */}
        <div className="flex items-center gap-2 text-xs bg-white p-3 rounded border border-slate-200">
          <span className="font-bold text-ledger-navy">Filter by Assigned Officer:</span>
          <select
            value={officerFilter}
            onChange={(e) => setOfficerFilter(e.target.value)}
            className="px-3 py-1.5 bg-chalk border border-slate-300 rounded text-sm text-ink font-medium"
          >
            <option value="">All Officers</option>
            {officers.map((off) => (
              <option key={off.id} value={off.id}>
                {off.full_name} ({off.department_or_hostel || 'Officer'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredRequests}
        columns={columns}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyTitle="No requests match your filter criteria"
      />

      {/* Assign Officer Modal */}
      {assignModalOpen && targetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ledger-navy/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold font-heading text-ledger-navy">
              Assign Officer — Ticket #{targetRequest.ticket_no}
            </h3>
            <p className="text-xs text-ink/70">
              Work order: <strong>{targetRequest.title}</strong> ({targetRequest.category_name})
            </p>

            <div>
              <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">
                Select Officer
              </label>
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
                className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink font-medium"
              >
                <option value="">Select Maintenance Officer</option>
                {officers.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.full_name} — {off.department_or_hostel || 'Facilities'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-ink bg-chalk hover:bg-slate-200 rounded border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                disabled={assigning || !selectedOfficerId}
                className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-slate-800 rounded disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {assigning && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Assign Officer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
