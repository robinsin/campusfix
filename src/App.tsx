import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth/AuthContext';
import { RequireRole } from './lib/auth/RequireRole';
import { AppShell } from './components/layout/AppShell';
import { Toaster } from 'sonner';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardRedirectPage } from './pages/DashboardRedirectPage';
import { MyRequestsPage } from './pages/student/MyRequestsPage';
import { NewRequestPage } from './pages/student/NewRequestPage';
import { RequestDetailPage } from './pages/shared/RequestDetailPage';
import { OfficerQueuePage } from './pages/officer/OfficerQueuePage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AllRequestsPage } from './pages/admin/AllRequestsPage';
import { ManageUsersPage } from './pages/admin/ManageUsersPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Authenticated Application Shell */}
          <Route
            path="/app"
            element={
              <RequireRole>
                <DashboardRedirectPage />
              </RequireRole>
            }
          />

          <Route
            path="/app/requests"
            element={
              <RequireRole allowedRoles={['student_staff', 'officer', 'admin']}>
                <AppShell>
                  <MyRequestsPage />
                </AppShell>
              </RequireRole>
            }
          />

          <Route
            path="/app/requests/new"
            element={
              <RequireRole allowedRoles={['student_staff', 'officer', 'admin']}>
                <AppShell>
                  <NewRequestPage />
                </AppShell>
              </RequireRole>
            }
          />

          <Route
            path="/app/requests/:id"
            element={
              <RequireRole allowedRoles={['student_staff', 'officer', 'admin']}>
                <AppShell>
                  <RequestDetailPage />
                </AppShell>
              </RequireRole>
            }
          />

          <Route
            path="/app/officer"
            element={
              <RequireRole allowedRoles={['officer', 'admin']}>
                <AppShell>
                  <OfficerQueuePage />
                </AppShell>
              </RequireRole>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/app/admin"
            element={
              <RequireRole allowedRoles={['admin']}>
                <AppShell>
                  <AdminOverviewPage />
                </AppShell>
              </RequireRole>
            }
          />

          <Route
            path="/app/admin/requests"
            element={
              <RequireRole allowedRoles={['admin']}>
                <AppShell>
                  <AllRequestsPage />
                </AppShell>
              </RequireRole>
            }
          />

          <Route
            path="/app/admin/users"
            element={
              <RequireRole allowedRoles={['admin']}>
                <AppShell>
                  <ManageUsersPage />
                </AppShell>
              </RequireRole>
            }
          />

          <Route
            path="/app/admin/categories"
            element={
              <RequireRole allowedRoles={['admin']}>
                <AppShell>
                  <CategoriesPage />
                </AppShell>
              </RequireRole>
            }
          />

          <Route
            path="/app/admin/reports"
            element={
              <RequireRole allowedRoles={['admin']}>
                <AppShell>
                  <ReportsPage />
                </AppShell>
              </RequireRole>
            }
          />

          {/* Profile & Notifications */}
          <Route
            path="/app/profile"
            element={
              <RequireRole>
                <AppShell>
                  <ProfilePage />
                </AppShell>
              </RequireRole>
            }
          />

          <Route
            path="/app/notifications"
            element={
              <RequireRole>
                <AppShell>
                  <NotificationsPage />
                </AppShell>
              </RequireRole>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
