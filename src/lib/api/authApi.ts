import { supabase } from '../supabase/client';
import { isSupabaseConfigured } from './supabaseApi';
export { isSupabaseConfigured };
import type { User } from '../../types';

export async function loginWithSupabase(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error('Incorrect email or password');
  }

  if (!data.user) {
    throw new Error('User authentication failed');
  }

  // Fetch full user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    // Fallback profile if profile trigger hasn't finished
    return {
      id: data.user.id,
      full_name: data.user.user_metadata?.full_name || 'University User',
      email: data.user.email || email,
      role_id: 'student_staff',
      is_active: true,
      created_at: new Date().toISOString(),
    };
  }

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

export async function registerWithSupabase(
  full_name: string,
  email: string,
  password: string,
  department_or_hostel?: string
): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        department_or_hostel: department_or_hostel || '',
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Failed to create account');
  }

  return {
    id: data.user.id,
    full_name,
    email,
    role_id: 'student_staff', // Security rule: Defaults to student_staff
    department_or_hostel,
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

export async function logoutWithSupabase(): Promise<void> {
  await supabase.auth.signOut();
}

export async function resetPasswordWithSupabase(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });

  if (error) {
    throw new Error(error.message);
  }
}
