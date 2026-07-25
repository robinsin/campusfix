export type RoleName = 'student_staff' | 'officer' | 'admin';

export type Role = {
  id: string;
  name: RoleName;
  label: string;
};

export type User = {
  id: string;
  full_name: string;
  email: string;
  role_id: RoleName;
  department_or_hostel?: string;
  is_active: boolean;
  created_at: string;
  avatar_url?: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
};

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type RequestStatus = 'new' | 'in_progress' | 'on_hold' | 'resolved' | 'cancelled';

export type ServiceRequest = {
  id: string;
  ticket_no: string; // e.g. WO-2031
  title: string;
  category_id: string;
  category_name?: string;
  description: string;
  location: string; // building + room
  priority: Priority;
  status: RequestStatus;
  requester_id: string;
  requester?: User;
  assigned_officer_id?: string;
  assigned_officer?: User;
  evidence_urls: string[];
  completion_photo_url?: string;
  created_at: string;
  updated_at: string;
};

export type Assignment = {
  id: string;
  request_id: string;
  officer_id: string;
  assigned_by: string;
  assigned_at: string;
  unassigned_at?: string;
};

export type StatusLog = {
  id: string;
  request_id: string;
  old_status: RequestStatus | null;
  new_status: RequestStatus;
  note: string;
  changed_by: string; // user id
  changed_by_name?: string;
  changed_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  ticket_no: string;
  request_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type CreateRequestInput = {
  title: string;
  category_id: string;
  location: string;
  priority: Priority;
  description: string;
  evidence_files?: File[];
  evidence_urls?: string[];
};

export type ReportsSummary = {
  totalRequests: number;
  openRequests: number;
  inProgressRequests: number;
  resolvedThisWeek: number;
  overdueRequests: number;
  categoryBreakdown: { category: string; count: number }[];
  statusBreakdown: { status: RequestStatus; label: string; count: number }[];
  recentActivity: StatusLog[];
};
