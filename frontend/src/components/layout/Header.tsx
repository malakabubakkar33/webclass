import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Avatar } from '../ui/Avatar.js';
import { LogoutModal } from '../ui/LogoutModal.js';
import {
  Bell,
  Search,
  CheckCheck,
  Video,
  Calendar,
  Sparkles,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Menu,
  BookOpen,
  Folder,
  Users,
  X,
  ExternalLink,
  ClipboardCheck
} from 'lucide-react';
import { api } from '../../services/api.js';
import { NotificationItem } from '../../types/index.js';
import { motion, AnimatePresence } from 'framer-motion';

export interface HeaderProps {
  onToggleSidebar?: () => void;
  title?: string;
}

interface SearchResults {
  courses: Array<{ id: string; title: string; type: string; url: string }>;
  topics: Array<{ id: string; title: string; courseId: string; type: string; url: string }>;
  videos: Array<{ id: string; title: string; courseId: string; type: string; url: string }>;
  assignments?: Array<{ id: string; title: string; courseId?: string; type: string; url: string }>;
  students: Array<{ id: string; title: string; subtitle?: string; type: string; url: string }>;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTeacher = user?.role === 'teacher';

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Debounced global search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchOpen(false);
      setIsSearching(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsSearching(true);
    setSearchOpen(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.globalSearch(searchQuery.trim());
        if (res.data?.success) {
          setSearchResults(res.data.data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {}
    }
    setIsNotifOpen(false);

    if (isTeacher) {
      if (notif.reference_type === 'course' && notif.reference_id) {
        navigate(`/teacher/courses/${notif.reference_id}`);
      } else if (notif.reference_type === 'attendance') {
        navigate('/teacher/attendance');
      } else {
        navigate('/teacher/courses');
      }
    } else {
      if (notif.reference_type === 'video' && notif.reference_id) {
        navigate(`/student/videos/${notif.reference_id}`);
      } else if (notif.reference_type === 'course') {
        navigate(`/student/courses/${notif.reference_id}`);
      } else if (notif.reference_type === 'attendance') {
        navigate('/student/attendance');
      }
    }
  };

  const handleSearchResultClick = (url: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(url);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'video_uploaded':
        return <Video className="w-4 h-4 text-primary-600" />;
      case 'attendance_marked':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-secondary-600" />;
    }
  };

  const profilePath = isTeacher ? '/teacher/profile' : '/student/profile';
  const settingsPath = isTeacher ? '/teacher/settings' : '/student/settings';

  const totalResultsCount =
    (searchResults?.courses.length || 0) +
    (searchResults?.topics.length || 0) +
    (searchResults?.videos.length || 0) +
    (searchResults?.assignments?.length || 0) +
    (searchResults?.students.length || 0);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      {/* Mobile Hamburger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/90 hover:border-primary-300 md:hidden flex flex-col items-center justify-center transition-all shadow-2xs group focus:outline-none cursor-pointer"
            aria-label="Open navigation menu"
            title="Toggle Menu"
          >
            <div className="flex flex-col items-end gap-1 w-4">
              <span className="h-[2px] w-4 bg-navy-900 rounded-full transition-all group-hover:bg-primary-600" />
              <span className="h-[2px] w-2.5 bg-primary-600 rounded-full transition-all group-hover:w-4" />
            </div>
          </button>
        )}

        {title ? (
          <h1 className="text-xl font-bold text-navy-900 tracking-tight hidden lg:block mr-2">
            {title}
          </h1>
        ) : null}

        {/* Global Working Search Bar with Auto-Dropdown */}
        <div className="relative flex-1" ref={searchRef}>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search courses, topics, lessons, assignments..."
            value={searchQuery}
            onFocus={() => {
              if (searchQuery.trim()) setSearchOpen(true);
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-100/80 hover:bg-slate-100 text-xs sm:text-sm font-medium text-navy-900 placeholder:text-slate-400 rounded-2xl border border-transparent focus:border-primary-500 focus:bg-white focus:outline-none transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-navy-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Results Dropdown Modal */}
          {searchOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in duration-150 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400 font-medium">
                  Searching classroom data...
                </div>
              ) : totalResultsCount === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No courses, topics, videos, or students found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {/* Courses */}
                  {searchResults && searchResults.courses.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-primary-600" />
                        <span>Courses ({searchResults.courses.length})</span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {searchResults.courses.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSearchResultClick(item.url)}
                            className="p-2 rounded-xl hover:bg-blue-50/80 flex items-center justify-between text-xs font-semibold text-navy-900 cursor-pointer transition"
                          >
                            <span className="truncate">{item.title}</span>
                            <span className="text-[10px] font-bold text-primary-600 shrink-0">Open &rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics */}
                  {searchResults && searchResults.topics.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Folder className="w-3 h-3 text-secondary-600" />
                        <span>Topics ({searchResults.topics.length})</span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {searchResults.topics.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSearchResultClick(item.url)}
                            className="p-2 rounded-xl hover:bg-purple-50/80 flex items-center justify-between text-xs font-semibold text-navy-900 cursor-pointer transition"
                          >
                            <span className="truncate">{item.title}</span>
                            <span className="text-[10px] font-bold text-secondary-600 shrink-0">View Topic &rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos */}
                  {searchResults && searchResults.videos.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Video className="w-3 h-3 text-amber-600" />
                        <span>Lessons & Videos ({searchResults.videos.length})</span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {searchResults.videos.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSearchResultClick(item.url)}
                            className="p-2 rounded-xl hover:bg-amber-50/80 flex items-center justify-between text-xs font-semibold text-navy-900 cursor-pointer transition"
                          >
                            <span className="truncate">{item.title}</span>
                            <span className="text-[10px] font-bold text-amber-600 shrink-0">Open &rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assignments */}
                  {searchResults && searchResults.assignments && searchResults.assignments.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <ClipboardCheck className="w-3 h-3 text-secondary-600" />
                        <span>Assignments ({searchResults.assignments.length})</span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {searchResults.assignments.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSearchResultClick(item.url)}
                            className="p-2 rounded-xl hover:bg-purple-50/80 flex items-center justify-between text-xs font-semibold text-navy-900 cursor-pointer transition"
                          >
                            <span className="truncate">{item.title}</span>
                            <span className="text-[10px] font-bold text-secondary-600 shrink-0">Open &rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Students */}
                  {searchResults && searchResults.students.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-emerald-600" />
                        <span>Students ({searchResults.students.length})</span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {searchResults.students.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSearchResultClick(item.url)}
                            className="p-2 rounded-xl hover:bg-emerald-50/80 flex items-center justify-between text-xs font-semibold text-navy-900 cursor-pointer transition"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-bold">{item.title}</p>
                              {item.subtitle && <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>}
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 shrink-0">Profile &rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 ml-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2.5 rounded-2xl text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition focus:outline-none"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-secondary-600 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-navy-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="text-[11px] font-semibold bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition ${
                          !n.is_read ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                          {getNotifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-navy-900 truncate">{n.title}</p>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed font-medium">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium block mt-1">
                            {new Date(n.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-secondary-600 mt-2 shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-100 transition focus:outline-none group"
          >
            <Avatar src={user?.avatarUrl} name={user?.fullName || 'Teacher'} size="md" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-navy-900 leading-tight truncate max-w-[130px] group-hover:text-primary-600 transition">
                {user?.fullName || 'Prof. Alex Vance'}
              </p>
              <p className="text-[9px] font-bold text-primary-600 uppercase tracking-wider">
                {isTeacher ? 'ADMIN INSTRUCTOR' : user?.rollNumber || 'STUDENT'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Menu Dropdown */}
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-2 z-50"
              >
                <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-navy-900 truncate">
                    {user?.fullName || 'Prof. Alex Vance'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>

                <Link
                  to={profilePath}
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-primary-600 hover:bg-primary-50/70 rounded-xl transition"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Link>

                <Link
                  to={settingsPath}
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-primary-600 hover:bg-primary-50/70 rounded-xl transition"
                >
                  <Settings className="w-4 h-4" />
                  Class Settings
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Logout Confirmation Permission Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          logout();
          navigate('/login');
        }}
        userName={user?.fullName}
      />
    </header>
  );
};
