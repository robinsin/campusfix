import React, { useState, useEffect } from 'react';
import { listUsers, updateUserRole, toggleUserActive } from '../../lib/api';
import type { User, RoleName } from '../../types';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Shield, ShieldAlert, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Role Change Modal state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleName>('student_staff');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Deactivate/Reactivate Confirm Dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [toggleUser, setToggleUser] = useState<User | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const openRoleModal = (u: User) => {
    setTargetUser(u);
    setSelectedRole(u.role_id);
    setRoleModalOpen(true);
  };

  const handleConfirmRoleChange = async () => {
    if (!targetUser) return;
    setUpdatingRole(true);
    try {
      await updateUserRole(targetUser.id, selectedRole);
      toast.success(`Role updated for ${targetUser.full_name}`);
      setRoleModalOpen(false);
      setTargetUser(null);
      loadUsers();
    } catch (err) {
      toast.error('Failed to change role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const openToggleDialog = (u: User) => {
    setToggleUser(u);
    setConfirmDialogOpen(true);
  };

  const handleConfirmToggleActive = async () => {
    if (!toggleUser) return;
    setToggling(true);
    try {
      const updated = await toggleUserActive(toggleUser.id);
      const action = updated.is_active ? 'Reactivated' : 'Deactivated';
      toast.success(`${action} user ${updated.full_name}`);
      setConfirmDialogOpen(false);
      setToggleUser(null);
      loadUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    } finally {
      setToggling(false);
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'User',
      accessor: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-300 shrink-0">
            <UserCheck className="w-4 h-4 text-ledger-navy" />
          </div>
          <div>
            <span className="font-bold text-ledger-navy block text-sm">{u.full_name}</span>
            <span className="text-xs text-ink/60 block">{u.email}</span>
          </div>
        </div>
      ),
      sortableKey: 'full_name',
    },
    {
      header: 'Role',
      accessor: (u) => {
        let badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
        if (u.role_id === 'admin') badgeColor = 'bg-amber-100 text-worn-gold border-amber-300 font-bold';
        if (u.role_id === 'officer') badgeColor = 'bg-blue-100 text-blue-800 border-blue-300 font-bold';

        return (
          <span className={`px-2.5 py-1 rounded text-xs border uppercase tracking-wider ${badgeColor}`}>
            {u.role_id.replace('_', ' ')}
          </span>
        );
      },
      sortableKey: 'role_id',
    },
    {
      header: 'Department / Hostel',
      accessor: (u) => <span className="text-xs text-ink/80 font-medium">{u.department_or_hostel || 'N/A'}</span>,
    },
    {
      header: 'Joined Date',
      accessor: (u) => (
        <span className="text-xs text-ink/70 font-mono-data">
          {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
        </span>
      ),
      sortableKey: 'created_at',
    },
    {
      header: 'Status',
      accessor: (u) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
            u.is_active ? 'bg-emerald-100 text-resolved-green' : 'bg-red-100 text-site-orange'
          }`}
        >
          {u.is_active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
          <span>{u.is_active ? 'Active' : 'Disabled'}</span>
        </span>
      ),
      sortableKey: 'is_active',
    },
    {
      header: 'Actions',
      accessor: (u) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openRoleModal(u)}
            className="px-2.5 py-1 text-xs font-bold bg-black text-white hover:bg-slate-800 rounded inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-white" />
            <span>Role</span>
          </button>
          <button
            onClick={() => openToggleDialog(u)}
            className={`px-2.5 py-1 text-xs font-semibold rounded border ${
              u.is_active
                ? 'bg-orange-50 text-site-orange border-orange-200 hover:bg-orange-100'
                : 'bg-emerald-50 text-resolved-green border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {u.is_active ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black font-heading text-ledger-navy">Manage Users</h1>
        <p className="text-sm text-ink/70 mt-0.5">
          User directory, role assignments, and account access management
        </p>
      </div>

      {/* Table */}
      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(u) => u.id}
        loading={loading}
        emptyTitle="No users found"
      />

      {/* Change Role Modal */}
      {roleModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ledger-navy/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold font-heading text-ledger-navy">
              Update Role — {targetUser.full_name}
            </h3>
            <p className="text-xs text-ink/70">
              Granting Maintenance Officer or Admin role grants privileges across the system.
            </p>

            <div>
              <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">Select Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as RoleName)}
                className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink font-medium"
              >
                <option value="student_staff">Student / Staff (Default)</option>
                <option value="officer">Maintenance Officer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-ink bg-chalk hover:bg-slate-200 rounded border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={updatingRole}
                className="px-4 py-2 text-xs font-bold text-ledger-navy bg-worn-gold hover:bg-worn-gold/90 rounded disabled:opacity-50 flex items-center gap-1.5"
              >
                {updatingRole && <div className="w-3.5 h-3.5 border-2 border-ledger-navy border-t-transparent rounded-full animate-spin" />}
                <span>Save Role</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate/Reactivate Confirm Dialog */}
      {toggleUser && (
        <ConfirmDialog
          isOpen={confirmDialogOpen}
          title={`${toggleUser.is_active ? 'Deactivate' : 'Reactivate'} Account?`}
          message={`Are you sure you want to ${
            toggleUser.is_active ? 'deactivate' : 'reactivate'
          } account for ${toggleUser.full_name}?`}
          confirmLabel={toggleUser.is_active ? 'Deactivate User' : 'Reactivate User'}
          isDestructive={toggleUser.is_active}
          loading={toggling}
          onConfirm={handleConfirmToggleActive}
          onClose={() => setConfirmDialogOpen(false)}
        />
      )}
    </div>
  );
};
