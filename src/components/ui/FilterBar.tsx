import React from 'react';
import { Search, X } from 'lucide-react';
import type { Category } from '../../types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter?: string;
  onStatusChange?: (status: string) => void;
  categoryFilter?: string;
  onCategoryChange?: (catId: string) => void;
  priorityFilter?: string;
  onPriorityChange?: (priority: string) => void;
  categories?: Category[];
  onReset?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter = '',
  onStatusChange,
  categoryFilter = '',
  onCategoryChange,
  priorityFilter = '',
  onPriorityChange,
  categories = [],
  onReset,
}) => {
  const hasActiveFilters = searchQuery || statusFilter || categoryFilter || priorityFilter;

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3 mb-6">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket ID (WO-2031), title, or location..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-worn-gold"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-2 items-center">
          {onStatusChange && (
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink font-medium focus-visible:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}

          {onCategoryChange && categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink font-medium focus-visible:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {onPriorityChange && (
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink font-medium focus-visible:outline-none"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          )}

          {hasActiveFilters && onReset && (
            <button
              onClick={onReset}
              className="px-3 py-2 text-xs font-semibold text-site-orange bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
