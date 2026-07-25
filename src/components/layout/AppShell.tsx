import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthContext';
import { getNotifications, markAllNotificationsRead } from '../../lib/api';
import { logoutWithSupabase, isSupabaseConfigured } from '../../lib/api/authApi';
import type { Notification } from '../../types';
import {
  Wrench,
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  CheckSquare,
  Users,
  FolderTree,
  BarChart3,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (currentUser) {
      getNotifications(currentUser.id).then(setNotifications);
    }
  }, [currentUser, location.pathname]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await markAllNotificationsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success('Notifications marked read');
  };

  const getNavLinks = () => {
    if (!currentUser) return [];

    if (currentUser.role_id === 'admin') {
      return [
        { label: 'Overview', path: '/app/admin', icon: LayoutDashboard },
        { label: 'All Requests', path: '/app/admin/requests', icon: ClipboardList },
        { label: 'Manage Users', path: '/app/admin/users', icon: Users },
        { label: 'Categories', path: '/app/admin/categories', icon: FolderTree },
        { label: 'Reports & Export', path: '/app/admin/reports', icon: BarChart3 },
      ];
    }

    if (currentUser.role_id === 'officer') {
      return [
        { label: 'Officer Queue', path: '/app/officer', icon: CheckSquare },
        { label: 'My Requests', path: '/app/requests', icon: ClipboardList },
      ];
    }

    return [
      { label: 'My Requests', path: '/app/requests', icon: ClipboardList },
      { label: 'Submit New Request', path: '/app/requests/new', icon: PlusCircle },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen flex flex-col bg-chalk text-black">
      {/* Top Navbar Header */}
      <header className="bg-white text-black border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo & Hamburger */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-black hover:bg-slate-100 rounded"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/app" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded bg-worn-gold text-black flex items-center justify-center font-black shadow-xs group-hover:scale-105 transition-transform">
                  <Wrench className="w-5 h-5 text-black" />
                </div>
                <div>
                  <span className="font-heading text-xl font-black tracking-tight text-black">CampusFix</span>
                  <span className="block text-[10px] text-worn-gold font-bold uppercase tracking-widest -mt-1 font-mono-data">Facilities Portal</span>
                </div>
              </Link>
            </div>

            {/* Middle: Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3.5 py-2 rounded text-sm font-bold transition-colors flex items-center gap-2 ${
                      isActive
                        ? 'bg-worn-gold text-black shadow-xs'
                        : 'text-black hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-black" />
                    <span className="text-black">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Notifications Bell & User Menu */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="p-2 text-black hover:bg-slate-100 rounded-full relative transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 text-black" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-site-orange text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Sub-Menu Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
                    <div className="p-3 bg-slate-100 border-b border-slate-200 text-black flex items-center justify-between">
                      <span className="font-heading font-bold text-sm text-black">Notifications ({notifications.length})</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-worn-gold hover:underline font-bold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 font-medium">No notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setNotifDropdownOpen(false);
                              navigate(`/app/requests/${n.request_id}`);
                            }}
                            className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                              !n.is_read ? 'bg-amber-50/80 font-bold' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between text-slate-600 mb-0.5">
                              <span className="font-mono-data text-black font-bold">{n.ticket_no}</span>
                              <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-black text-sm font-semibold">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <Link
                      to="/app/notifications"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="block p-2.5 text-center text-xs font-bold bg-slate-50 text-black hover:bg-slate-100 border-t border-slate-200"
                    >
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>

              {/* User Profile Button without Avatar */}
              <div className="relative">
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotifDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-100 border border-slate-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-chalk flex items-center justify-center text-black font-bold border border-slate-300">
                    <UserIcon className="w-4 h-4 text-black" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="block text-xs font-black text-black truncate max-w-[120px]">
                      {currentUser?.full_name}
                    </span>
                    <span className="block text-[10px] text-worn-gold uppercase tracking-wider font-bold -mt-0.5">
                      {currentUser?.role_id.replace('_', ' ')}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-black hidden sm:block" />
                </button>

                {/* User Dropdown Sub-Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white text-black rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
                    <div className="p-3 bg-slate-50 border-b border-slate-200">
                      <p className="text-xs font-black text-black truncate">{currentUser?.full_name}</p>
                      <p className="text-[11px] text-slate-600 font-medium truncate">{currentUser?.email}</p>
                    </div>

                    <div className="p-1">
                      <Link
                        to="/app/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-black hover:bg-slate-100 rounded flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4 text-black" />
                        Profile Settings
                      </Link>
                      <button
                        onClick={async () => {
                          setUserDropdownOpen(false);
                          if (isSupabaseConfigured()) {
                            await logoutWithSupabase();
                          }
                          navigate('/login');
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-site-orange hover:bg-orange-50 rounded flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-white border-t border-slate-200 px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded text-sm font-bold flex items-center gap-3 ${
                    isActive ? 'bg-worn-gold text-black' : 'text-black hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5 text-black" />
                  <span className="text-black">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-black font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 CampusFix — University Facilities & Service Operations Portal</p>
          <p className="font-mono-data text-[11px] text-slate-500 font-bold">MIT 8333 Assessment Project</p>
        </div>
      </footer>
    </div>
  );
};
