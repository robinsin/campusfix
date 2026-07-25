import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReportsSummary } from '../../lib/api';
import type { ReportsSummary } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Timeline } from '../../components/ui/Timeline';
import {
  ClipboardList,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  BarChart2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminOverviewPage: React.FC = () => {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportsSummary().then((data) => {
      setSummary(data);
      setLoading(false);
    });
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-worn-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Chart Colors matching §4 Tokens
  const DONUT_COLORS: Record<string, string> = {
    new: '#94A3B8',
    in_progress: '#B8933F',
    on_hold: '#C9542C',
    resolved: '#3F7A57',
    cancelled: '#64748B',
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-worn-gold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Facilities Operations Command Center</span>
          </div>
          <h1 className="text-3xl font-black font-heading text-ledger-navy">Admin Overview</h1>
          <p className="text-sm text-ink/70 mt-0.5">
            Real-time status metrics, category distribution, and system audit log feed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/app/admin/requests"
            className="px-4 py-2 bg-ledger-navy hover:bg-ledger-navy/90 text-white font-bold text-xs rounded shadow-xs transition-colors flex items-center gap-2"
          >
            <span>Manage All Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Work Orders"
          value={summary.totalRequests}
          icon={ClipboardList}
          variant="navy"
          trend="All recorded requests"
        />
        <StatCard
          label="New / Unassigned"
          value={summary.openRequests}
          icon={Sparkles}
          variant="default"
          trend="Needs officer dispatch"
        />
        <StatCard
          label="In Progress / Hold"
          value={summary.inProgressRequests}
          icon={Clock}
          variant="gold"
          trend="Active work orders"
        />
        <StatCard
          label="Resolved This Week"
          value={summary.resolvedThisWeek}
          icon={CheckCircle2}
          variant="green"
          trend="Successfully completed"
        />
        <StatCard
          label="Urgent Priority"
          value={summary.overdueRequests}
          icon={AlertTriangle}
          variant="orange"
          trend="Requires immediate focus"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading text-ledger-navy flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-worn-gold" />
              <span>Requests by Category</span>
            </h2>
            <span className="text-xs font-mono-data text-slate-400">Total volume</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: '#16273E' }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#16273E' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', color: '#23262B', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#16273E', fontWeight: 'bold' }}
                  labelStyle={{ color: '#16273E', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#16273E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading text-ledger-navy flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-worn-gold" />
              <span>Work Order Status Breakdown</span>
            </h2>
            <span className="text-xs font-mono-data text-slate-400">Live proportion</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.statusBreakdown}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {summary.statusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={DONUT_COLORS[entry.status] || '#16273E'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', color: '#23262B', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#16273E', fontWeight: 'bold' }}
                  labelStyle={{ color: '#16273E', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 text-xs pt-2">
            {summary.statusBreakdown.map((st) => (
              <div key={st.status} className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[st.status] }} />
                <span>{st.label}: <strong>{st.count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Feed */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading text-ledger-navy">Recent Status Activity Feed</h2>
          <Link to="/app/admin/requests" className="text-xs font-bold text-worn-gold hover:underline">
            View full log history
          </Link>
        </div>
        <Timeline logs={summary.recentActivity} />
      </div>
    </div>
  );
};
