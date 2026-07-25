import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth/AuthContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsRead } from '../lib/api';
import type { Notification } from '../types';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getNotifications(currentUser.id);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await markAllNotificationsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-heading text-ledger-navy">Notifications</h1>
          <p className="text-sm text-ink/70 mt-0.5">
            Activity updates on your submitted or assigned work orders
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 text-xs font-bold text-ledger-navy bg-amber-100 hover:bg-amber-200 border border-worn-gold/40 rounded flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-worn-gold" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink/60">No notifications recorded yet.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                handleMarkRead(n.id);
                navigate(`/app/requests/${n.request_id}`);
              }}
              className={`p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                !n.is_read ? 'bg-amber-50/40 border-l-4 border-l-worn-gold' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono-data text-xs font-bold text-ledger-navy bg-slate-100 px-2 py-0.5 rounded">
                    {n.ticket_no}
                  </span>
                  <span className="font-bold text-sm text-ledger-navy">{n.title}</span>
                </div>
                <p className="text-sm text-ink">{n.message}</p>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono-data pt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>

              {!n.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-site-orange shrink-0 mt-1.5" title="Unread" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
