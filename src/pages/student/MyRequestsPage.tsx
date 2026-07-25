import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyRequests, getCategories } from '../../lib/api';
import type { ServiceRequest, Category } from '../../types';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { PlusCircle, Eye } from 'lucide-react';

export const MyRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqData, catData] = await Promise.all([getMyRequests(), getCategories()]);
      setRequests(reqData);
      setCategories(catData);
    } finally {
      setLoading(false);
    }
  };

  // Filter Data
  const filteredRequests = requests.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNo = r.ticket_no.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchLoc = r.location.toLowerCase().includes(q);
      if (!matchNo && !matchTitle && !matchLoc) return false;
    }

    if (statusFilter && r.status !== statusFilter) return false;
    if (categoryFilter && r.category_id !== categoryFilter) return false;
    if (priorityFilter && r.priority !== priorityFilter) return false;

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
      header: 'Submitted',
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
          className="px-2.5 py-1 text-xs font-semibold bg-chalk hover:bg-slate-200 text-ledger-navy border border-slate-300 rounded inline-flex items-center gap-1 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading text-ledger-navy">My Service Requests</h1>
          <p className="text-sm text-ink/70 mt-0.5">
            Track and manage your submitted facilities work orders
          </p>
        </div>

        <Link
          to="/app/requests/new"
          className="px-4 py-2.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded shadow-sm transition-colors flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-worn-gold" />
          <span>Submit New Request</span>
        </Link>
      </div>

      {/* Filter Bar */}
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
        }}
      />

      {/* Data Table */}
      <DataTable
        data={filteredRequests}
        columns={columns}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyTitle="No requests yet — report your first issue."
        emptyDescription="You haven't submitted any service requests matching your criteria."
        emptyActionLabel="Report First Issue"
        onEmptyAction={() => navigate('/app/requests/new')}
      />
    </div>
  );
};
