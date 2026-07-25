import { supabase } from '../supabase/client';
import type {
  ServiceRequest,
  User,
  Category,
  StatusLog,
  Notification,
  CreateRequestInput,
  RequestStatus,
  Priority,
  RoleName
} from '../../types';

// Check if live Supabase is configured
export function isSupabaseConfigured(): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') {
    return false;
  }
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('placeholder') && !key.includes('placeholder'));
}

export async function getCurrentSupabaseUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    role_id: profile.role_id,
    department_or_hostel: profile.department_or_hostel,
    is_active: profile.is_active,
    created_at: profile.created_at,
    avatar_url: profile.avatar_url,
  };
}

export async function getMySupabaseRequests(): Promise<ServiceRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('service_requests')
    .select(`
      *,
      category:categories(name),
      requester:profiles!requester_id(full_name, email),
      assigned_officer:profiles!assigned_officer_id(full_name, department_or_hostel)
    `)
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase getMyRequests error:', error);
    return [];
  }

  return (data || []).map(formatServiceRequest);
}

export async function getAllSupabaseRequests(): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select(`
      *,
      category:categories(name),
      requester:profiles!requester_id(full_name, email),
      assigned_officer:profiles!assigned_officer_id(full_name, department_or_hostel)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase getAllRequests error:', error);
    return [];
  }

  return (data || []).map(formatServiceRequest);
}

export async function getAssignedSupabaseRequests(officerId: string): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select(`
      *,
      category:categories(name),
      requester:profiles!requester_id(full_name, email),
      assigned_officer:profiles!assigned_officer_id(full_name, department_or_hostel)
    `)
    .eq('assigned_officer_id', officerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase getAssignedRequests error:', error);
    return [];
  }

  return (data || []).map(formatServiceRequest);
}

export async function getSupabaseRequestById(id: string): Promise<ServiceRequest | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let query = supabase
    .from('service_requests')
    .select(`
      *,
      category:categories(name),
      requester:profiles!requester_id(full_name, email),
      assigned_officer:profiles!assigned_officer_id(full_name, department_or_hostel)
    `);

  if (isUuid) {
    query = query.eq('id', id);
  } else {
    query = query.ilike('ticket_no', id);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    console.error('Supabase getRequestById error:', error);
    return null;
  }

  return formatServiceRequest(data);
}

export async function createSupabaseRequest(input: CreateRequestInput): Promise<ServiceRequest> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const evidenceUrls: string[] = [];
  if (input.evidence_files && input.evidence_files.length > 0) {
    for (const file of input.evidence_files) {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('request-evidence')
        .upload(fileName, file);

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('request-evidence')
          .getPublicUrl(data.path);
        evidenceUrls.push(publicUrlData.publicUrl);
      }
    }
  }

  const { data, error } = await supabase
    .from('service_requests')
    .insert({
      title: input.title,
      category_id: input.category_id,
      location: input.location,
      priority: input.priority,
      description: input.description,
      requester_id: user.id,
      evidence_urls: evidenceUrls,
      status: 'new',
    })
    .select(`
      *,
      category:categories(name),
      requester:profiles!requester_id(full_name, email)
    `)
    .single();

  if (error) throw error;

  // Insert initial StatusLog
  await supabase.from('status_logs').insert({
    request_id: data.id,
    old_status: null,
    new_status: 'new',
    note: 'Service request created.',
    changed_by: user.id,
  });

  // Insert notification for requester
  await supabase.from('notifications').insert({
    user_id: user.id,
    request_id: data.id,
    ticket_no: data.ticket_no,
    message: `Work order ${data.ticket_no} submitted successfully.`,
  });

  return formatServiceRequest(data);
}

export async function updateSupabaseRequestStatus(
  id: string,
  newStatus: RequestStatus,
  note: string,
  completionPhotoUrl?: string
): Promise<ServiceRequest> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data: currentReq } = await supabase
    .from('service_requests')
    .select('status, ticket_no, requester_id, assigned_officer_id, title')
    .eq('id', id)
    .single();

  const oldStatus = currentReq ? currentReq.status : null;

  const { data, error } = await supabase
    .from('service_requests')
    .update({
      status: newStatus,
      completion_photo_url: completionPhotoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      category:categories(name),
      requester:profiles!requester_id(full_name, email),
      assigned_officer:profiles!assigned_officer_id(full_name, department_or_hostel)
    `)
    .single();

  if (error) throw error;

  // Log status change
  await supabase.from('status_logs').insert({
    request_id: id,
    old_status: oldStatus,
    new_status: newStatus,
    note: note,
    changed_by: user.id,
  });

  // Status label
  const statusLabel = newStatus.replace('_', ' ').toUpperCase();

  // Create notification for requester
  if (data.requester_id) {
    await supabase.from('notifications').insert({
      user_id: data.requester_id,
      request_id: id,
      ticket_no: data.ticket_no,
      message: `Work Order ${data.ticket_no} status updated to ${statusLabel}: "${note}"`,
    });
  }

  // Create notification for assigned officer (if changer is not the officer)
  if (data.assigned_officer_id && data.assigned_officer_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: data.assigned_officer_id,
      request_id: id,
      ticket_no: data.ticket_no,
      message: `Work Order ${data.ticket_no} updated to ${statusLabel}`,
    });
  }

  return formatServiceRequest(data);
}

export async function assignSupabaseRequest(requestId: string, officerId: string): Promise<ServiceRequest> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('service_requests')
    .update({
      assigned_officer_id: officerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select(`
      *,
      category:categories(name),
      requester:profiles!requester_id(full_name, email),
      assigned_officer:profiles!assigned_officer_id(full_name, department_or_hostel)
    `)
    .single();

  if (error) throw error;

  // Record assignment audit entry
  await supabase.from('assignments').insert({
    request_id: requestId,
    officer_id: officerId,
    assigned_by: user.id,
  });

  const officerName = data.assigned_officer?.full_name || 'Maintenance Officer';

  // 1. Create notification for assigned officer
  await supabase.from('notifications').insert({
    user_id: officerId,
    request_id: requestId,
    ticket_no: data.ticket_no,
    message: `You have been assigned to Work Order ${data.ticket_no}: "${data.title}"`,
  });

  // 2. Create notification for requester
  if (data.requester_id) {
    await supabase.from('notifications').insert({
      user_id: data.requester_id,
      request_id: requestId,
      ticket_no: data.ticket_no,
      message: `Work Order ${data.ticket_no} has been assigned to ${officerName}.`,
    });
  }

  return formatServiceRequest(data);
}

export async function overrideSupabasePriority(requestId: string, newPriority: Priority): Promise<ServiceRequest> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data, error } = await supabase
    .from('service_requests')
    .update({
      priority: newPriority,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select(`
      *,
      category:categories(name),
      requester:profiles!requester_id(full_name, email),
      assigned_officer:profiles!assigned_officer_id(full_name, department_or_hostel)
    `)
    .single();

  if (error) throw error;

  await supabase.from('status_logs').insert({
    request_id: requestId,
    old_status: data.status,
    new_status: data.status,
    note: `Priority overridden to ${newPriority.toUpperCase()}`,
    changed_by: user.id,
  });

  // Create notification for requester & officer
  if (data.requester_id) {
    await supabase.from('notifications').insert({
      user_id: data.requester_id,
      request_id: requestId,
      ticket_no: data.ticket_no,
      message: `Priority of Work Order ${data.ticket_no} changed to ${newPriority.toUpperCase()}`,
    });
  }

  if (data.assigned_officer_id) {
    await supabase.from('notifications').insert({
      user_id: data.assigned_officer_id,
      request_id: requestId,
      ticket_no: data.ticket_no,
      message: `Priority of Work Order ${data.ticket_no} changed to ${newPriority.toUpperCase()}`,
    });
  }

  return formatServiceRequest(data);
}

export async function getSupabaseStatusLogs(requestId: string): Promise<StatusLog[]> {
  const { data, error } = await supabase
    .from('status_logs')
    .select(`
      *,
      changed_by_profile:profiles!changed_by(full_name)
    `)
    .eq('request_id', requestId)
    .order('changed_at', { ascending: true });

  if (error) return [];

  return (data || []).map((l: any) => ({
    id: l.id,
    request_id: l.request_id,
    old_status: l.old_status,
    new_status: l.new_status,
    note: l.note,
    changed_by: l.changed_by,
    changed_by_name: l.changed_by_profile?.full_name || 'System User',
    changed_at: l.changed_at,
  }));
}

export async function getSupabaseRecentStatusLogs(limit = 8): Promise<StatusLog[]> {
  const { data, error } = await supabase
    .from('status_logs')
    .select(`
      *,
      changed_by_profile:profiles!changed_by(full_name)
    `)
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return (data || []).map((l: any) => ({
    id: l.id,
    request_id: l.request_id,
    old_status: l.old_status,
    new_status: l.new_status,
    note: l.note,
    changed_by: l.changed_by,
    changed_by_name: l.changed_by_profile?.full_name || 'System User',
    changed_at: l.changed_at,
  }));
}

export async function getSupabaseCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) return [];
  return data || [];
}

export async function createSupabaseCategory(input: { name: string; description: string }): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: input.name, description: input.description, is_active: true })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleSupabaseCategoryActive(id: string): Promise<Category> {
  const { data: current } = await supabase.from('categories').select('is_active').eq('id', id).single();
  const nextState = current ? !current.is_active : true;

  const { data, error } = await supabase
    .from('categories')
    .update({ is_active: nextState })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listSupabaseUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function updateSupabaseUserRole(userId: string, newRole: RoleName): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role_id: newRole })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleSupabaseUserActive(userId: string): Promise<User> {
  const { data: current } = await supabase.from('profiles').select('is_active').eq('id', userId).single();
  const nextState = current ? !current.is_active : true;

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: nextState })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSupabaseNotifications(userId?: string): Promise<Notification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetId = userId || user?.id;
  if (!targetId) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

export async function markSupabaseNotificationAsRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllSupabaseNotificationsRead(userId?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetId = userId || user?.id;
  if (!targetId) return;

  await supabase.from('notifications').update({ is_read: true }).eq('user_id', targetId);
}

function formatServiceRequest(raw: any): ServiceRequest {
  return {
    id: raw.id,
    ticket_no: raw.ticket_no,
    title: raw.title,
    category_id: raw.category_id,
    category_name: raw.category?.name || 'General',
    description: raw.description,
    location: raw.location,
    priority: raw.priority,
    status: raw.status,
    requester_id: raw.requester_id,
    requester: raw.requester
      ? {
          id: raw.requester_id,
          full_name: raw.requester.full_name,
          email: raw.requester.email,
          role_id: 'student_staff',
          is_active: true,
          created_at: raw.created_at,
        }
      : undefined,
    assigned_officer_id: raw.assigned_officer_id,
    assigned_officer: raw.assigned_officer
      ? {
          id: raw.assigned_officer_id,
          full_name: raw.assigned_officer.full_name,
          email: '',
          role_id: 'officer',
          department_or_hostel: raw.assigned_officer.department_or_hostel,
          is_active: true,
          created_at: raw.created_at,
        }
      : undefined,
    evidence_urls: raw.evidence_urls || [],
    completion_photo_url: raw.completion_photo_url,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}
