import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Avatar } from '../ui/Avatar.js';
import { LogoutModal } from '../ui/LogoutModal.js';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  Bell,
  Users,
  Settings,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
  X
} from 'lucide-react';

export interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const isTeacher = user?.role === 'teacher';

  const studentNavItems = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Courses', path: '/student/courses', icon: BookOpen },
    { label: 'Assignments', path: '/student/assignments', icon: ClipboardCheck },
    { label: 'Attendance', path: '/student/attendance', icon: CalendarCheck },
    { label: 'Notifications', path: '/student/notifications', icon: Bell },
    { label: 'Settings', path: '/student/settings', icon: Settings },
  ];

  const teacherNavItems = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Courses', path: '/teacher/courses', icon: BookOpen },
    { label: 'Assignments', path: '/teacher/assignments', icon: ClipboardCheck },
    { label: 'Students', path: '/teacher/students', icon: Users },
    { label: 'Attendance', path: '/teacher/attendance', icon: CalendarCheck },
    { label: 'Analytics', path: '/teacher/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/teacher/settings', icon: Settings },
  ];

  const navItems = isTeacher ? teacherNavItems : studentNavItems;
  const profilePath = isTeacher ? '/teacher/profile' : '/student/profile';

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-[999] md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Element */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-[1000] md:z-30 flex flex-col bg-white border-r border-slate-200/90 transition-all duration-300 ease-in-out select-none shadow-xl md:shadow-none ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <Link to="/" onClick={handleNavClick} className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-secondary-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20 flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            {(!isCollapsed || mobileOpen) && (
              <span className="text-base font-extrabold text-navy-900 tracking-tight">
                SMIT Web Class
              </span>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-slate-400 hover:text-navy-900 hover:bg-slate-100 md:hidden focus:outline-none"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm items-center justify-center text-slate-500 hover:text-navy-900 hover:scale-110 transition z-50 focus:outline-none"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3 py-2.5 rounded-2xl font-semibold text-xs transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-primary-50/90 text-primary-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
                  }`
                }
                title={isCollapsed && !mobileOpen ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                        isActive
                          ? 'bg-gradient-to-tr from-primary-600 to-primary-500 text-white shadow-sm shadow-primary-500/30'
                          : 'text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {(!isCollapsed || mobileOpen) && <span className="tracking-tight text-xs">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Class Schedule Mini Card (Expanded Mode) */}
        {(!isCollapsed || mobileOpen) && (
          <div className="mx-3.5 mb-3 p-3.5 bg-gradient-to-br from-blue-50/70 via-white to-purple-50/50 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-secondary-600" />
              <span className="text-[10px] font-bold text-navy-900 uppercase tracking-wider">Class Schedule</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              Every <strong className="text-primary-700">Monday</strong> & <strong className="text-secondary-700">Tuesday</strong>
            </p>
            <p className="text-[10px] text-primary-700 font-bold mt-0.5">
              4:00 PM – 6:00 PM
            </p>
          </div>
        )}

        {/* Bottom Profile Anchor & Logout */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <Link
            to={profilePath}
            onClick={handleNavClick}
            className={`flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition group ${
              isCollapsed && !mobileOpen ? 'justify-center' : ''
            }`}
            title={isCollapsed && !mobileOpen ? user?.fullName : undefined}
          >
            <Avatar src={user?.avatarUrl} name={user?.fullName || 'Teacher'} size="md" />
            {(!isCollapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-bold text-navy-900 truncate group-hover:text-primary-600 transition">
                  {user?.fullName || 'Teacher Admin'}
                </span>
                <span className="text-[10px] font-medium text-slate-400 truncate">
                  {isTeacher ? 'ADMIN INSTRUCTOR' : user?.email}
                </span>
              </div>
            )}
          </Link>

          {/* Quick Logout Button */}
          {(!isCollapsed || mobileOpen) && (
            <button
              onClick={() => setLogoutConfirmOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Animated Logout Confirmation Modal */}
      <LogoutModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        userName={user?.fullName}
      />
    </>
  );
};
