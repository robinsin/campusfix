import { supabase } from './client';
import type { ServiceRequest, StatusLog, Notification } from '../../types';

/**
 * Subscribes to real-time status updates on service_requests table
 */
export function subscribeToRequestUpdates(onRequestUpdated: (request: ServiceRequest) => void) {
  const channel = supabase
    .channel('public:service_requests')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'service_requests' },
      (payload) => {
        onRequestUpdated(payload.new as ServiceRequest);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to real-time status logs for audit trail updates
 */
export function subscribeToStatusLogs(requestId: string, onNewLog: (log: StatusLog) => void) {
  const channel = supabase
    .channel(`status_logs:${requestId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'status_logs', filter: `request_id=eq.${requestId}` },
      (payload) => {
        onNewLog(payload.new as StatusLog);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to real-time notifications for the logged-in user
 */
export function subscribeToUserNotifications(userId: string, onNotification: (notif: Notification) => void) {
  const channel = supabase
    .channel(`user_notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
