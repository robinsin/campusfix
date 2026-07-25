import React, { useState } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { User, Lock, Bell, Save } from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [department, setDepartment] = useState(currentUser?.department_or_hostel || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      toast.success('Profile details updated successfully!');
      refreshUser();
    }, 300);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black font-heading text-ledger-navy">Profile & Preferences</h1>
        <p className="text-sm text-ink/70 mt-0.5">
          Manage your account information, security credentials, and notification settings
        </p>
      </div>

      {/* Account Info Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold font-heading text-ledger-navy flex items-center gap-2">
          <User className="w-5 h-5 text-worn-gold" />
          <span>Account Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">Email Address</label>
            <input
              type="email"
              value={currentUser?.email || ''}
              disabled
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">Role</label>
            <input
              type="text"
              value={currentUser?.role_id.replace('_', ' ').toUpperCase() || ''}
              disabled
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-sm text-slate-500 uppercase font-mono-data font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">Department / Hostel Room</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingProfile}
            className="px-4 py-2 bg-worn-gold hover:bg-worn-gold/90 text-ledger-navy font-bold text-xs rounded shadow-2xs transition-colors flex items-center gap-1.5"
          >
            {savingProfile ? (
              <div className="w-3.5 h-3.5 border-2 border-ledger-navy border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Profile</span>
          </button>
        </div>
      </form>

      {/* Password Change Form */}
      <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold font-heading text-ledger-navy flex items-center gap-2">
          <Lock className="w-5 h-5 text-worn-gold" />
          <span>Security & Password</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ledger-navy uppercase mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-chalk border border-slate-300 rounded text-sm text-ink"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 bg-ledger-navy hover:bg-ledger-navy/90 text-white font-bold text-xs rounded shadow-2xs transition-colors flex items-center gap-1.5"
          >
            {savingPassword && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>Update Password</span>
          </button>
        </div>
      </form>

      {/* Notification Preferences */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold font-heading text-ledger-navy flex items-center gap-2">
          <Bell className="w-5 h-5 text-worn-gold" />
          <span>Notification Preferences</span>
        </h2>

        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={inAppNotifs}
              onChange={(e) => setInAppNotifs(e.target.checked)}
              className="w-4 h-4 text-worn-gold rounded border-slate-300 focus:ring-worn-gold"
            />
            <div>
              <span className="font-bold text-ledger-navy block">In-App Banner Notifications</span>
              <span className="text-xs text-ink/70">Receive real-time badges when ticket status changes</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={(e) => setEmailNotifs(e.target.checked)}
              className="w-4 h-4 text-worn-gold rounded border-slate-300 focus:ring-worn-gold"
            />
            <div>
              <span className="font-bold text-ledger-navy block">Email Updates & Alerts</span>
              <span className="text-xs text-ink/70">Receive automated email digests when officer assigns your request</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
