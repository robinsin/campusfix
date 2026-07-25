import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthContext';
import { getAssignedRequests } from '../../lib/api';
import type { ServiceRequest } from '../../types';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Wrench, CheckCircle2, Clock, Eye } from 'lucide-react';

export const OfficerQueuePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [assignedRequests, setAssignedRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>('all');

  useEffect(() => {
    if (currentUser) {
      loadQueue();
    }
  }, [currentUser]);

  const loadQueue = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getAssignedRequests(currentUser.id);
      setAssignedRequests(data);
    } finally {
      setLoading(false);
    }
  };

  const filtered = assignedRequests.filter((r) => {
    if (statusTab === 'active') return r.status === 'new' || r.status === 'in_progress' || r.status === 'on_hold';
    if (statusTab === 'resolved') return r.status === 'resolved';
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
      header: 'Assigned Date',
      accessor: (r) => (
        <span className="text-xs text-ink/70 font-mono-data">
          {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      ),
      sortableKey: 'created_at',
    },
    {
      header: 'Action',
      accessor: (r) => (
        <Link
          to={`/app/requests/${r.id}`}
          className="px-3 py-1 text-xs font-bold bg-worn-gold hover:bg-worn-gold/90 text-ledger-navy rounded inline-flex items-center gap-1 shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Work Order</span>
        </Link>
      ),
    },
  ];

  const activeCount = assignedRequests.filter(
    (r) => r.status === 'new' || r.status === 'in_progress' || r.status === 'on_hold'
  ).length;
  const resolvedCount = assignedRequests.filter((r) => r.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-worn-gold font-bold uppercase text-xs tracking-wider mb-1">
          <Wrench className="w-4 h-4" />
          <span>Maintenance Dispatch Console</span>
        </div>
        <h1 className="text-3xl font-black font-heading text-ledger-navy">Officer Work Queue</h1>
        <p className="text-sm text-ink/70 mt-0.5">
          Work orders assigned to <strong className="text-ledger-navy">{currentUser?.full_name}</strong>, sorted by priority & age
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setStatusTab('all')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            statusTab === 'all'
              ? 'border-worn-gold text-ledger-navy font-black'
              : 'border-transparent text-slate-500 hover:text-ledger-navy'
          }`}
        >
          <span>All Assigned ({assignedRequests.length})</span>
        </button>
        <button
          onClick={() => setStatusTab('active')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            statusTab === 'active'
              ? 'border-worn-gold text-ledger-navy font-black'
              : 'border-transparent text-slate-500 hover:text-ledger-navy'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-worn-gold" />
          <span>Active Queue ({activeCount})</span>
        </button>
        <button
          onClick={() => setStatusTab('resolved')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            statusTab === 'resolved'
              ? 'border-worn-gold text-ledger-navy font-black'
              : 'border-transparent text-slate-500 hover:text-ledger-navy'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-resolved-green" />
          <span>Completed ({resolvedCount})</span>
        </button>
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyTitle="No assigned work orders in this queue"
        emptyDescription="All assigned tickets are up to date."
      />
    </div>
  );
};
