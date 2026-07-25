import type {
  ServiceRequest,
  User,
  Category,
  StatusLog,
  Notification,
  CreateRequestInput,
  ReportsSummary,
  Priority,
  RequestStatus,
  RoleName
} from '../../types';
import {
  MOCK_USERS,
  MOCK_CATEGORIES,
  MOCK_REQUESTS,
  MOCK_STATUS_LOGS,
  MOCK_NOTIFICATIONS
} from '../mock/fixtures';
import {
  isSupabaseConfigured,
  getCurrentSupabaseUser,
  getMySupabaseRequests,
  getAllSupabaseRequests,
  getAssignedSupabaseRequests,
  getSupabaseRequestById,
  createSupabaseRequest,
  updateSupabaseRequestStatus,
  assignSupabaseRequest,
  overrideSupabasePriority,
  getSupabaseStatusLogs,
  getSupabaseRecentStatusLogs,
  getSupabaseCategories,
  createSupabaseCategory,
  toggleSupabaseCategoryActive,
  listSupabaseUsers,
  updateSupabaseUserRole,
  toggleSupabaseUserActive,
  getSupabaseNotifications,
  markSupabaseNotificationAsRead,
  markAllSupabaseNotificationsRead
} from './supabaseApi';

// In-memory state holding live mutations for mock mode
let users: User[] = [...MOCK_USERS];
let categories: Category[] = [...MOCK_CATEGORIES];
let requests: ServiceRequest[] = [...MOCK_REQUESTS];
let statusLogs: StatusLog[] = [...MOCK_STATUS_LOGS];
let notifications: Notification[] = [...MOCK_NOTIFICATIONS];

let ticketCounter = 2034;
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getCurrentUser(): Promise<User | null> {
  if (isSupabaseConfigured()) {
    const user = await getCurrentSupabaseUser();
    if (user) return user;
  }
  await delay(100);
  const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('campusfix_current_user_id') : null;
  const user = users.find((u) => u.id === (storedUserId || 'user-1'));
  return user || users[0];
}

export async function setCurrentUser(userId: string): Promise<User> {
  await delay(100);
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');
  if (typeof window !== 'undefined') {
    localStorage.setItem('campusfix_current_user_id', userId);
  }
  return user;
}

export async function getMyRequests(userId?: string): Promise<ServiceRequest[]> {
  if (isSupabaseConfigured()) {
    return getMySupabaseRequests();
  }
  await delay(200);
  const current = userId || (await getCurrentUser())?.id;
  return requests
    .filter((r) => r.requester_id === current)
    .map(populateRelations)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getAllRequests(): Promise<ServiceRequest[]> {
  if (isSupabaseConfigured()) {
    return getAllSupabaseRequests();
  }
  await delay(200);
  return requests
    .map(populateRelations)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getAssignedRequests(officerId: string): Promise<ServiceRequest[]> {
  if (isSupabaseConfigured()) {
    return getAssignedSupabaseRequests(officerId);
  }
  await delay(200);
  return requests
    .filter((r) => r.assigned_officer_id === officerId)
    .map(populateRelations)
    .sort((a, b) => {
      const priorityOrder: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (diff !== 0) return diff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

export async function getRequestById(id: string): Promise<ServiceRequest | null> {
  if (isSupabaseConfigured()) {
    const liveReq = await getSupabaseRequestById(id);
    if (liveReq) return liveReq;
  }
  await delay(150);
  const req = requests.find((r) => r.id === id || r.ticket_no.toLowerCase() === id.toLowerCase());
  if (!req) return null;
  return populateRelations(req);
}

export async function createRequest(input: CreateRequestInput): Promise<ServiceRequest> {
  if (isSupabaseConfigured()) {
    return createSupabaseRequest(input);
  }
  await delay(350);
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthenticated user cannot create request');

  const cat = categories.find((c) => c.id === input.category_id);
  const newTicketNo = `WO-${ticketCounter++}`;
  const now = new Date().toISOString();

  let urls: string[] = input.evidence_urls || [];
  if (input.evidence_files && input.evidence_files.length > 0) {
    const uploaded = input.evidence_files.map((file) => URL.createObjectURL(file));
    urls = [...urls, ...uploaded];
  }

  const newReq: ServiceRequest = {
    id: `req-${Date.now()}`,
    ticket_no: newTicketNo,
    title: input.title,
    category_id: input.category_id,
    category_name: cat ? cat.name : 'General',
    description: input.description,
    location: input.location,
    priority: input.priority,
    status: 'new',
    requester_id: currentUser.id,
    evidence_urls: urls,
    created_at: now,
    updated_at: now,
  };

  requests.unshift(newReq);

  statusLogs.unshift({
    id: `log-${Date.now()}`,
    request_id: newReq.id,
    old_status: null,
    new_status: 'new',
    note: 'Service request created.',
    changed_by: currentUser.id,
    changed_by_name: currentUser.full_name,
    changed_at: now,
  });

  notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: currentUser.id,
    request_id: newReq.id,
    ticket_no: newReq.ticket_no,
    message: `Work Order ${newReq.ticket_no} submitted successfully.`,
    is_read: false,
    created_at: now,
  });

  return populateRelations(newReq);
}

export async function updateRequestStatus(
  id: string,
  newStatus: RequestStatus,
  note: string,
  completionPhotoUrl?: string
): Promise<ServiceRequest> {
  if (isSupabaseConfigured()) {
    return updateSupabaseRequestStatus(id, newStatus, note, completionPhotoUrl);
  }
  await delay(300);
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthenticated');

  const reqIndex = requests.findIndex((r) => r.id === id);
  if (reqIndex === -1) throw new Error('Request not found');

  const targetReq = requests[reqIndex];
  const oldStatus = targetReq.status;
  const now = new Date().toISOString();

  requests[reqIndex] = {
    ...targetReq,
    status: newStatus,
    completion_photo_url: completionPhotoUrl || targetReq.completion_photo_url,
    updated_at: now,
  };

  statusLogs.unshift({
    id: `log-${Date.now()}`,
    request_id: targetReq.id,
    old_status: oldStatus,
    new_status: newStatus,
    note: note || `Status updated to ${newStatus.replace('_', ' ')}`,
    changed_by: currentUser.id,
    changed_by_name: currentUser.full_name,
    changed_at: now,
  });

  const statusLabel = newStatus.replace('_', ' ').toUpperCase();

  // Create notification for requester
  notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: targetReq.requester_id,
    request_id: targetReq.id,
    ticket_no: targetReq.ticket_no,
    message: `Work Order ${targetReq.ticket_no} status updated to ${statusLabel}: "${note}"`,
    is_read: false,
    created_at: now,
  });

  // Create notification for assigned officer
  if (targetReq.assigned_officer_id && targetReq.assigned_officer_id !== currentUser.id) {
    notifications.unshift({
      id: `notif-${Date.now() + 1}`,
      user_id: targetReq.assigned_officer_id,
      request_id: targetReq.id,
      ticket_no: targetReq.ticket_no,
      message: `Work Order ${targetReq.ticket_no} updated to ${statusLabel}`,
      is_read: false,
      created_at: now,
    });
  }

  return populateRelations(requests[reqIndex]);
}

export async function assignRequest(requestId: string, officerId: string): Promise<ServiceRequest> {
  if (isSupabaseConfigured()) {
    return assignSupabaseRequest(requestId, officerId);
  }
  await delay(300);
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthenticated');

  const reqIndex = requests.findIndex((r) => r.id === requestId);
  if (reqIndex === -1) throw new Error('Request not found');

  const officer = users.find((u) => u.id === officerId);
  if (!officer) throw new Error('Officer not found');

  const target = requests[reqIndex];
  const now = new Date().toISOString();

  requests[reqIndex] = {
    ...target,
    assigned_officer_id: officerId,
    updated_at: now,
  };

  statusLogs.unshift({
    id: `log-${Date.now()}`,
    request_id: target.id,
    old_status: target.status,
    new_status: target.status,
    note: `Assigned work order to ${officer.full_name}`,
    changed_by: currentUser.id,
    changed_by_name: currentUser.full_name,
    changed_at: now,
  });

  // Notification for assigned officer
  notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: officerId,
    request_id: target.id,
    ticket_no: target.ticket_no,
    message: `You have been assigned to Work Order ${target.ticket_no}: "${target.title}"`,
    is_read: false,
    created_at: now,
  });

  // Notification for requester
  notifications.unshift({
    id: `notif-${Date.now() + 1}`,
    user_id: target.requester_id,
    request_id: target.id,
    ticket_no: target.ticket_no,
    message: `Work Order ${target.ticket_no} has been assigned to Maintenance Officer ${officer.full_name}.`,
    is_read: false,
    created_at: now,
  });

  return populateRelations(requests[reqIndex]);
}

export async function overridePriority(requestId: string, newPriority: Priority): Promise<ServiceRequest> {
  if (isSupabaseConfigured()) {
    return overrideSupabasePriority(requestId, newPriority);
  }
  await delay(250);
  const currentUser = await getCurrentUser();
  const reqIndex = requests.findIndex((r) => r.id === requestId);
  if (reqIndex === -1) throw new Error('Request not found');

  const target = requests[reqIndex];
  const now = new Date().toISOString();
  requests[reqIndex] = {
    ...target,
    priority: newPriority,
    updated_at: now,
  };

  statusLogs.unshift({
    id: `log-${Date.now()}`,
    request_id: target.id,
    old_status: target.status,
    new_status: target.status,
    note: `Priority overridden to ${newPriority.toUpperCase()}`,
    changed_by: currentUser?.id || 'admin',
    changed_by_name: currentUser?.full_name || 'Admin',
    changed_at: now,
  });

  notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: target.requester_id,
    request_id: target.id,
    ticket_no: target.ticket_no,
    message: `Priority of Work Order ${target.ticket_no} changed to ${newPriority.toUpperCase()}`,
    is_read: false,
    created_at: now,
  });

  return populateRelations(requests[reqIndex]);
}

export async function cancelRequest(requestId: string, note?: string): Promise<ServiceRequest> {
  return updateRequestStatus(requestId, 'cancelled', note || 'Cancelled by requester');
}

export async function listUsers(): Promise<User[]> {
  if (isSupabaseConfigured()) {
    return listSupabaseUsers();
  }
  await delay(150);
  return [...users];
}

export async function updateUserRole(userId: string, newRole: RoleName): Promise<User> {
  if (isSupabaseConfigured()) {
    return updateSupabaseUserRole(userId, newRole);
  }
  await delay(250);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('User not found');

  users[idx] = {
    ...users[idx],
    role_id: newRole,
  };

  return users[idx];
}

export async function toggleUserActive(userId: string): Promise<User> {
  if (isSupabaseConfigured()) {
    return toggleSupabaseUserActive(userId);
  }
  await delay(200);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('User not found');

  users[idx] = {
    ...users[idx],
    is_active: !users[idx].is_active,
  };

  return users[idx];
}

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    return getSupabaseCategories();
  }
  await delay(100);
  return [...categories];
}

export async function createCategory(input: { name: string; description: string }): Promise<Category> {
  if (isSupabaseConfigured()) {
    return createSupabaseCategory(input);
  }
  await delay(200);
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name: input.name,
    description: input.description,
    is_active: true,
  };
  categories.push(newCat);
  return newCat;
}

export async function toggleCategoryActive(id: string): Promise<Category> {
  if (isSupabaseConfigured()) {
    return toggleSupabaseCategoryActive(id);
  }
  await delay(150);
  const idx = categories.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Category not found');
  categories[idx] = {
    ...categories[idx],
    is_active: !categories[idx].is_active,
  };
  return categories[idx];
}

export async function getStatusLogs(requestId: string): Promise<StatusLog[]> {
  if (isSupabaseConfigured()) {
    return getSupabaseStatusLogs(requestId);
  }
  await delay(100);
  return statusLogs
    .filter((l) => l.request_id === requestId)
    .sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());
}

export async function getReportsSummary(_dateRangeDays = 30): Promise<ReportsSummary> {
  let all: ServiceRequest[] = [];
  let currentCategories: Category[] = [];
  let recentActivityLogs: StatusLog[] = [];

  if (isSupabaseConfigured()) {
    all = await getAllSupabaseRequests();
    currentCategories = await getSupabaseCategories();
    recentActivityLogs = await getSupabaseRecentStatusLogs(8);
  } else {
    all = requests.map(populateRelations);
    currentCategories = categories;
    recentActivityLogs = statusLogs.slice(0, 8);
  }

  const totalRequests = all.length;
  const openRequests = all.filter((r) => r.status === 'new').length;
  const inProgressRequests = all.filter((r) => r.status === 'in_progress' || r.status === 'on_hold').length;
  const resolvedThisWeek = all.filter((r) => r.status === 'resolved').length;
  const overdueRequests = all.filter((r) => r.status !== 'resolved' && r.priority === 'urgent').length;

  const categoryMap: Record<string, number> = {};
  currentCategories.forEach((cat) => {
    categoryMap[cat.name] = 0;
  });
  all.forEach((r) => {
    const catName = r.category_name || 'General';
    categoryMap[catName] = (categoryMap[catName] || 0) + 1;
  });

  const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

  const statusCounts: Record<RequestStatus, number> = {
    new: 0,
    in_progress: 0,
    on_hold: 0,
    resolved: 0,
    cancelled: 0,
  };
  all.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  const statusLabels: Record<RequestStatus, string> = {
    new: 'New / Unassigned',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    resolved: 'Resolved',
    cancelled: 'Cancelled',
  };

  const statusBreakdown = (Object.keys(statusCounts) as RequestStatus[]).map((status) => ({
    status,
    label: statusLabels[status],
    count: statusCounts[status],
  }));

  return {
    totalRequests,
    openRequests,
    inProgressRequests,
    resolvedThisWeek,
    overdueRequests,
    categoryBreakdown,
    statusBreakdown,
    recentActivity: recentActivityLogs,
  };
}

export async function getNotifications(userId?: string): Promise<Notification[]> {
  if (isSupabaseConfigured()) {
    return getSupabaseNotifications(userId);
  }
  await delay(100);
  const currentUser = userId || (await getCurrentUser())?.id;
  return notifications.filter((n) => n.user_id === currentUser);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return markSupabaseNotificationAsRead(id);
  }
  await delay(50);
  const idx = notifications.findIndex((n) => n.id === id);
  if (idx !== -1) {
    notifications[idx].is_read = true;
  }
}

export async function markAllNotificationsRead(userId?: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return markAllSupabaseNotificationsRead(userId);
  }
  await delay(50);
  const currentUser = userId || (await getCurrentUser())?.id;
  notifications = notifications.map((n) => (n.user_id === currentUser ? { ...n, is_read: true } : n));
}

export function exportRequestsCSV(requestsToExport: ServiceRequest[]): string {
  const headers = ['Ticket No', 'Title', 'Category', 'Priority', 'Status', 'Location', 'Requester', 'Officer', 'Created At'];
  const rows = requestsToExport.map((r) => [
    r.ticket_no,
    `"${r.title.replace(/"/g, '""')}"`,
    r.category_name || '',
    r.priority,
    r.status,
    `"${r.location.replace(/"/g, '""')}"`,
    `"${r.requester?.full_name || ''}"`,
    `"${r.assigned_officer?.full_name || 'Unassigned'}"`,
    r.created_at,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

function populateRelations(req: ServiceRequest): ServiceRequest {
  const cat = categories.find((c) => c.id === req.category_id);
  const requester = users.find((u) => u.id === req.requester_id);
  const officer = req.assigned_officer_id ? users.find((u) => u.id === req.assigned_officer_id) : undefined;

  return {
    ...req,
    category_name: cat ? cat.name : req.category_name || 'General',
    requester,
    assigned_officer: officer,
  };
}
