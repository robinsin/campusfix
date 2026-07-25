# CampusFix — University Facilities & Maintenance Operations Portal

CampusFix is a web-based Facilities and Service Operations Portal designed to streamline maintenance reporting, work order dispatching, and resolution tracking across university campuses. It replaces manual paperwork, phone calls, and unorganized messages with an organized, role-based digital workflow.

---

 🌟 Key Features

 👨‍🎓 1. Student & Staff Portal
- Submit Service Requests: Report maintenance issues (electrical, plumbing, HVAC, carpentry, IT) with location details and photo evidence uploads.
- Real-Time Ticket Tracking: Track ticket status (`New`, `In Progress`, `On Hold`, `Resolved`, `Cancelled`) with ticket stubs (`WO-2034`).
- Audit Timeline: View chronological status update notes and resolution timestamps.
- In-App Notifications: Receive instant notification alerts when work orders are assigned or updated.

 🛠️ 2. Maintenance Officer Portal
- Assigned Queue: View personal work order queue sorted by priority (`Urgent`, `High`, `Medium`, `Low`) and submission age.
- Progress Tracking: Acknowledge work orders, update status notes, and upload completion proof photos upon job completion.
- Work Order Filtering: Search and filter assigned tasks by ticket ID, location, or status.

 🛡️ 3. Administrator Command Center
- Master Queue Oversight: Monitor all submitted campus requests, override ticket priorities, or cancel duplicate requests.
- Officer Dispatch: Assign or reassign work orders to available maintenance officers.
- User Access Control: Manage user directory, promote users to `Maintenance Officer` or `Administrator`, and toggle account access.
- Category Management: Create and configure service intake classifications.
- Analytics & Reporting: Interactive Recharts graphs (category distribution & status breakdown), one-click CSV data export, and formatted PDF report generation.

---

 🚀 Tech Stack

- Frontend Framework: React 19 + TypeScript + Vite
- Styling: Tailwind CSS v4 (Custom design tokens, responsive layouts, high contrast theme)
- Backend & Database: Supabase (PostgreSQL, Supabase Auth, Storage Buckets, Realtime Subscriptions)
- Form Handling & Validation: React Hook Form + Zod
- Data Visualization: Recharts
- PDF & CSV Export: jsPDF + Native CSV Exporter
- Icons & UI Utilities: Lucide React + Sonner (Toast notifications)
- Testing: Vitest + React Testing Library

---

 📂 Project Structure

```
CampusFix/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components & layouts
│   │   ├── layout/          # AppShell top navigation header & footer
│   │   └── ui/              # StatCard, StatusBadge, PriorityBadge, DataTable, FileDropzone, Timeline
│   ├── lib/
│   │   ├── api/             # Supabase & data access layer (fallback mock mode available)
│   │   ├── auth/            # AuthContext provider & role-based route guards (RequireRole)
│   │   ├── mock/            # Initial fixture data
│   │   └── supabase/        # Supabase client & realtime subscription helpers
│   ├── pages/               # Page views
│   │   ├── admin/           # AdminOverviewPage, AllRequestsPage, ManageUsersPage, CategoriesPage, ReportsPage
│   │   ├── officer/         # OfficerQueuePage
│   │   ├── shared/          # RequestDetailPage, ProfilePage, NotificationsPage
│   │   └── student/         # MyRequestsPage, NewRequestPage
│   ├── types/               # TypeScript interfaces (ServiceRequest, User, Category, StatusLog, etc.)
│   ├── App.tsx              # Router configuration
│   └── index.css            # Custom CSS & Tailwind configuration
├── supabase/
│   └── schema.sql           # Complete DDL Postgres schema, RLS policies, triggers & storage buckets
├── .env.example             # Template for environment configuration
├── package.json             # Dependencies and build scripts
└── vite.config.ts           # Vite build configuration
```

---

 ⚙️ Installation & Setup Guide

 Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- A [Supabase](https://supabase.com/) account and active project

---

 Step 1: Clone the Repository

```bash
git clone https://github.com/robinsin/campusfix.git
cd campusfix
```

---

 Step 2: Install Dependencies

```bash
npm install
```

---

 Step 3: Configure Environment Variables

1. Copy `.env.example` to create a `.env` file in the root project folder:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
   VITE_APP_TITLE=CampusFix - Facilities Operations Portal
   PORT=5173
   ```

---

 Step 4: Run Database Migration (Supabase)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) $\rightarrow$ SQL Editor $\rightarrow$ New Query.
2. Copy and paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and click Run.

> Schema Operations Included:
> - Tables: `profiles`, `roles`, `categories`, `service_requests`, `assignments`, `status_logs`, `notifications`.
> - Row Level Security (RLS) policies for `student_staff`, `officer`, and `admin` roles.
> - Storage Bucket: `request-evidence` for evidence photos and completion proofs.
> - PostgreSQL Trigger: `on_auth_user_created` for auto-provisioning user profiles upon signup.
> - Ticket Sequence: Automatic generation of ticket IDs (`WO-2034`).

---

 Step 5: Start Development Server

```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

 🧪 Testing & Production Build

 Run Unit Tests
```bash
npm test
```

 Build for Production
```bash
npm run build
```

 Preview Production Build
```bash
npm run preview
```

---

 🔒 Security & Role-Based Access Control (RBAC)

- Default Registration: All new registrations default to the `student_staff` role. Privilege escalation to `officer` or `admin` must be granted by an Administrator via the Manage Users dashboard (`/app/admin/users`).
- Row Level Security (RLS): Enforced directly on PostgreSQL tables:
  - `student_staff` can only view and update their own submitted work orders.
  - `officer` can view assigned work orders and update status progress.
  - `admin` possesses full read/write access across all system entities.

---

 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
