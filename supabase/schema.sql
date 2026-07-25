-- ============================================================================
-- CampusFix — Comprehensive Supabase Database Schema, RLS Security,
-- Storage Buckets & Realtime Publications
-- MIT 8333 Continuous Assessment
-- ============================================================================

-- 1. CUSTOM ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student_staff', 'officer', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE request_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('new', 'in_progress', 'on_hold', 'resolved', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. ROLES REFERENCE TABLE
CREATE TABLE IF NOT EXISTS public.roles (
    id user_role PRIMARY KEY,
    label TEXT NOT NULL
);

INSERT INTO public.roles (id, label) VALUES
    ('student_staff', 'Student / Staff'),
    ('officer', 'Maintenance Officer'),
    ('admin', 'Administrator')
ON CONFLICT (id) DO NOTHING;

-- 3. PROFILES / USERS TABLE (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role_id user_role NOT NULL DEFAULT 'student_staff' REFERENCES public.roles(id),
    department_or_hostel TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. REQUEST CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SERVICE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_no TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    priority request_priority NOT NULL DEFAULT 'medium',
    status request_status NOT NULL DEFAULT 'new',
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    evidence_urls TEXT[] DEFAULT '{}',
    completion_photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ
);

-- 7. STATUS UPDATES / AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    old_status request_status,
    new_status request_status NOT NULL,
    note TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. IN-APP NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ticket_no TEXT NOT NULL,
    request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. AUTOMATIC TRIGGERS & FUNCTIONS
-- ============================================================================

-- Ticket Number Generator (WO-2034)
CREATE SEQUENCE IF NOT EXISTS ticket_no_seq START WITH 2034;

CREATE OR REPLACE FUNCTION generate_ticket_no()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_no IS NULL OR NEW.ticket_no = '' THEN
        NEW.ticket_no := 'WO-' || nextval('ticket_no_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_ticket_no ON public.service_requests;
CREATE TRIGGER trg_generate_ticket_no
BEFORE INSERT ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION generate_ticket_no();

-- Updated_At Timestamp Trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_service_requests_timestamp ON public.service_requests;
CREATE TRIGGER trg_update_service_requests_timestamp
BEFORE UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Handle Supabase Auth User Creation Trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role_id, department_or_hostel)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'University User'),
        NEW.email,
        'student_staff', -- Security Rule: Defaults to student_staff
        NEW.raw_user_meta_data->>'department_or_hostel'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES PER ROLE
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security helper function to check active role
CREATE OR REPLACE FUNCTION get_caller_role()
RETURNS user_role AS $$
    SELECT role_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- --- PROFILES RLS ---
DROP POLICY IF EXISTS "Authenticated users read profiles" ON public.profiles;
CREATE POLICY "Authenticated users read profiles" ON public.profiles 
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins full management on profiles" ON public.profiles;
CREATE POLICY "Admins full management on profiles" ON public.profiles 
FOR ALL USING (get_caller_role() = 'admin');

-- --- CATEGORIES RLS ---
DROP POLICY IF EXISTS "Categories read by all" ON public.categories;
CREATE POLICY "Categories read by all" ON public.categories 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories 
FOR ALL USING (get_caller_role() = 'admin');

-- --- SERVICE REQUESTS RLS (PER ROLE) ---

-- 1. SELECT Policy (Role-Based Filtering):
-- - Student/Staff: can view requests where they are the requester
-- - Officers: can view requests assigned to them or any open queue
-- - Admins: can view all requests
DROP POLICY IF EXISTS "Service requests role-based SELECT" ON public.service_requests;
CREATE POLICY "Service requests role-based SELECT" ON public.service_requests
FOR SELECT USING (
    auth.uid() = requester_id OR 
    auth.uid() = assigned_officer_id OR 
    get_caller_role() IN ('officer', 'admin')
);

-- 2. INSERT Policy:
-- - Students/Staff can submit new service requests for themselves
DROP POLICY IF EXISTS "Student/Staff insert requests" ON public.service_requests;
CREATE POLICY "Student/Staff insert requests" ON public.service_requests
FOR INSERT WITH CHECK (
    auth.uid() = requester_id
);

-- 3. UPDATE Policy (Role-Based Actions):
-- - Students: can cancel or add comments to own tickets
-- - Officers: can update status (Acknowledge -> In Progress -> Resolved/On Hold) for assigned tickets
-- - Admins: can update any ticket, override priority, or reassign officer
DROP POLICY IF EXISTS "Service requests role-based UPDATE" ON public.service_requests;
CREATE POLICY "Service requests role-based UPDATE" ON public.service_requests
FOR UPDATE USING (
    auth.uid() = requester_id OR 
    auth.uid() = assigned_officer_id OR 
    get_caller_role() IN ('officer', 'admin')
);

-- --- STATUS LOGS RLS ---
DROP POLICY IF EXISTS "Status logs readable by authenticated" ON public.status_logs;
CREATE POLICY "Status logs readable by authenticated" ON public.status_logs 
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Status logs insertable by actor" ON public.status_logs;
CREATE POLICY "Status logs insertable by actor" ON public.status_logs 
FOR INSERT WITH CHECK (auth.uid() = changed_by);

-- --- ASSIGNMENTS RLS ---
DROP POLICY IF EXISTS "Assignments readable by authenticated" ON public.assignments;
CREATE POLICY "Assignments readable by authenticated" ON public.assignments 
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins create assignments" ON public.assignments;
CREATE POLICY "Admins create assignments" ON public.assignments 
FOR INSERT WITH CHECK (get_caller_role() = 'admin');

-- --- NOTIFICATIONS RLS ---
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications 
FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 11. SUPABASE STORAGE BUCKET CONFIGURATION & POLICIES
-- ============================================================================

-- Create public storage bucket for fault evidence and completion photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'request-evidence',
    'request-evidence',
    true,
    5242880, -- 5MB limit per image
    ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png'];

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public read access for evidence bucket" ON storage.objects;
CREATE POLICY "Public read access for evidence bucket" ON storage.objects 
FOR SELECT USING (bucket_id = 'request-evidence');

DROP POLICY IF EXISTS "Authenticated users upload evidence images" ON storage.objects;
CREATE POLICY "Authenticated users upload evidence images" ON storage.objects 
FOR INSERT WITH CHECK (
    bucket_id = 'request-evidence' AND 
    auth.role() = 'authenticated'
);

-- ============================================================================
-- 12. SUPABASE REALTIME SUBSCRIPTION PUBLICATION
-- ============================================================================

-- Enable Realtime replication on service_requests, status_logs, and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.status_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================================
-- 13. INITIAL SEED DATA
-- ============================================================================
INSERT INTO public.categories (name, description, is_active) VALUES
    ('Electrical', 'Faulty outlets, broken light fixtures, power surges, wire issues', true),
    ('Plumbing', 'Leaking pipes, clogged toilets, drainage issues, water supply', true),
    ('Furniture', 'Damaged desks, broken chairs, door locks, window latches', true),
    ('Internet/IT', 'WiFi access point offline, Ethernet port dead, projector cables', true),
    ('Classroom Equipment', 'Podium controls, smart boards, speakers, HVAC controls', true),
    ('Hostel Maintenance', 'Bed frames, wardrobe hinges, balcony doors, communal showers', true),
    ('Other', 'General facilities, groundskeeping, unclassified requests', true)
ON CONFLICT (name) DO NOTHING;
