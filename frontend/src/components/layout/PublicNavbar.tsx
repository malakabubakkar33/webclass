import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Button } from '../ui/Button.js';
import { api } from '../../services/api.js';
import {
  GraduationCap,
  ArrowRight,
  X,
  ChevronDown,
  Layers,
  Lock,
  BookOpen,
  Sparkles,
  Home,
  CheckCircle,
  Users,
  Info,
  LogIn,
  UserPlus,
  LayoutDashboard
} from 'lucide-react';

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  level: string;
  topicsCount: number;
  videosCount: number;
}

const FALLBACK_COURSES: CourseItem[] = [
  {
    id: 'course-html5-css3',
    title: 'HTML5 & Modern CSS3 Architecture',
    slug: 'html5-modern-css3-architecture',
    description: 'Master semantic HTML5, Flexbox, CSS Grid, custom properties, animations, and responsive web design best practices.',
    thumbnail_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=600',
    level: 'Beginner',
    topicsCount: 4,
    videosCount: 12,
  },
  {
    id: 'course-javascript-es6',
    title: 'Modern JavaScript (ES6+) Fundamentals',
    slug: 'modern-javascript-es6-fundamentals',
    description: 'Deep dive into modern JS: lexical scope, closures, promises, async/await, DOM APIs, and functional paradigms.',
    thumbnail_url: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&q=80&w=600',
    level: 'Beginner',
    topicsCount: 4,
    videosCount: 14,
  },
  {
    id: 'course-typescript',
    title: 'TypeScript for Production Web Apps',
    slug: 'typescript-production-web-apps',
    description: 'Static typing, generics, interfaces, strict mode, union types, and error-free codebases.',
    thumbnail_url: 'https://images.unsplash.com/photo-1516116211227-bbc042c1619a?auto=format&fit=crop&q=80&w=600',
    level: 'Intermediate',
    topicsCount: 3,
    videosCount: 8,
  },
  {
    id: 'course-react',
    title: 'React 18 & Enterprise Component Architecture',
    slug: 'react-18-enterprise-architecture',
    description: 'Component lifecycles, hooks, context API, state machines, and real-world dashboards.',
    thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600',
    level: 'Intermediate',
    topicsCount: 5,
    videosCount: 15,
  },
  {
    id: 'course-firebase',
    title: 'Firebase Cloud Mastery & Push Notifications',
    slug: 'firebase-cloud-mastery',
    description: 'Realtime database, Cloud Firestore, Firebase Auth, FCM web notifications, and storage buckets.',
    thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600',
    level: 'Advanced',
    topicsCount: 3,
    videosCount: 7,
  },
  {
    id: 'course-supabase',
    title: 'Supabase & PostgreSQL Full-Stack Architecture',
    slug: 'supabase-postgresql-architecture',
    description: 'Relational data modeling, Row-Level Security (RLS), realtime subscriptions, and Edge Functions.',
    thumbnail_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=600',
    level: 'Advanced',
    topicsCount: 3,
    videosCount: 9,
  },
];

export const PublicNavbar: React.FC = () => {
  const { isAuthenticated, user, isTeacher } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [courses, setCourses] = useState<CourseItem[]>(FALLBACK_COURSES);

  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dashboardRoute = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setCoursesDropdownOpen(false);
  }, [location.pathname]);

  // Fetch courses dynamically from backend
  useEffect(() => {
    api.getPublicCourses()
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCourses(res.data.data);
        }
      })
      .catch((err) => console.error('Failed to fetch courses for navbar dropdown:', err));
  }, []);

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setCoursesDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setCoursesDropdownOpen(false);
    }, 200);
  };

  const handleCourseClick = (courseId: string) => {
    setCoursesDropdownOpen(false);
    setMobileMenuOpen(false);

    if (isAuthenticated) {
      if (isTeacher) {
        navigate(`/teacher/courses/${courseId}`);
      } else {
        navigate(`/student/courses/${courseId}`);
      }
    } else {
      info(
        'Please sign in to your student account to access full course lessons in your portal.',
        'Student Portal Required'
      );
      navigate('/login');
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand Logo & Class Name */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-secondary-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform duration-200">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black text-navy-950 tracking-tight leading-none group-hover:text-primary-600 transition-colors">
              SMIT Web Class
            </span>
            <span className="text-[10px] font-bold text-primary-600 tracking-wider uppercase mt-1">
              Web Development Portal
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {/* Home */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'text-primary-600 bg-primary-50 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
              }`
            }
          >
            Home
          </NavLink>

          {/* Courses with Dropdown Toggle */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <NavLink
              to="/courses"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive || coursesDropdownOpen
                    ? 'text-primary-600 bg-primary-50 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
                }`
              }
            >
              <span>Courses</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  coursesDropdownOpen ? 'rotate-180 text-primary-600' : 'text-slate-400'
                }`}
              />
            </NavLink>
          </div>

          {/* Features */}
          <NavLink
            to="/features"
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'text-primary-600 bg-primary-50 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
              }`
            }
          >
            Features
          </NavLink>

          {/* Students */}
          <NavLink
            to="/students"
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'text-primary-600 bg-primary-50 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
              }`
            }
          >
            Students
          </NavLink>

          {/* About Class */}
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'text-primary-600 bg-primary-50 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
              }`
            }
          >
            About Class
          </NavLink>
        </div>

        {/* Desktop Right Side CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              onClick={() => navigate(dashboardRoute)}
              variant="primary"
              size="md"
              className="shadow-sm shadow-primary-500/25"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                size="md"
                className="text-slate-700 hover:text-primary-600 font-bold"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate('/signup')}
                variant="primary"
                size="md"
                className="shadow-sm shadow-primary-500/25"
              >
                Join Class
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button - Custom Modern 2-Line Design (One Long, One Short) */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/90 hover:border-primary-300 flex flex-col items-center justify-center transition-all duration-200 shadow-2xs group focus:outline-none cursor-pointer"
            aria-label="Toggle Navigation Menu"
            title="Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-navy-900 group-hover:text-primary-600 transition-colors" />
            ) : (
              <div className="flex flex-col items-end gap-1.5 w-5">
                {/* Long Top Line */}
                <span className="h-[2.5px] w-5 bg-navy-900 rounded-full transition-all duration-200 group-hover:bg-primary-600 group-hover:w-5" />
                {/* Short Bottom Line */}
                <span className="h-[2.5px] w-3.5 bg-primary-600 rounded-full transition-all duration-200 group-hover:bg-primary-700 group-hover:w-5" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* SLEEK COURSES DROPDOWN (Matches Main Courses Page Exactly) */}
      {coursesDropdownOpen && (
        <div
          className="hidden md:block absolute top-full left-0 right-0 w-full bg-white/98 backdrop-blur-md border-b border-slate-200/90 shadow-2xl shadow-slate-900/10 z-50 animate-in fade-in slide-in-from-top-1 duration-200"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-navy-900">
                  SMIT Curriculum Courses ({courses.length})
                </span>
              </div>
              <Link
                to="/courses"
                onClick={() => setCoursesDropdownOpen(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 transition"
              >
                <span>View Full Syllabus & Filter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {courses.slice(0, 6).map((course, idx) => (
                <div
                  key={`${course.id}-${idx}`}
                  onClick={() => handleCourseClick(course.id)}
                  className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/70 hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-navy-900 group-hover:text-primary-600 transition-colors line-clamp-1 leading-snug">
                        {course.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-200/60">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                        course.level === 'Beginner'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : course.level === 'Advanced'
                          ? 'text-purple-700 bg-purple-50 border-purple-200'
                          : 'text-primary-700 bg-blue-50 border-blue-200'
                      }`}
                    >
                      {course.level}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold truncate flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      {course.topicsCount} Topics
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SIDE SLIDE-OUT DRAWER WITH BACKDROP */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop Blur */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200"
          />

          {/* Slide-out Drawer from Side */}
          <div className="fixed top-0 right-0 bottom-0 w-[84%] max-w-[340px] bg-white z-50 shadow-2xl flex flex-col justify-between p-6 md:hidden animate-in slide-in-from-right duration-300 border-l border-slate-200/90 overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary-600 flex items-center justify-center text-white shadow-sm">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-navy-900 leading-tight">SMIT Web Class</h3>
                    <p className="text-[10px] font-bold text-primary-600 uppercase">Navigation Menu</p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition focus:outline-none"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links with Icons */}
              <div className="flex flex-col space-y-1.5">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                      isActive
                        ? 'text-primary-700 bg-primary-50 font-bold border border-primary-200/60 shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Home className="w-4 h-4 text-primary-600" />
                  <span>Home</span>
                </NavLink>

                <NavLink
                  to="/courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                      isActive
                        ? 'text-primary-700 bg-primary-50 font-bold border border-primary-200/60 shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-secondary-600" />
                    <span>Courses</span>
                  </div>
                  <span className="text-xs bg-primary-100 text-primary-700 font-bold px-2 py-0.5 rounded-full">
                    {courses.length}
                  </span>
                </NavLink>

                <NavLink
                  to="/features"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                      isActive
                        ? 'text-primary-700 bg-primary-50 font-bold border border-primary-200/60 shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Platform Features</span>
                </NavLink>

                <NavLink
                  to="/students"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                      isActive
                        ? 'text-primary-700 bg-primary-50 font-bold border border-primary-200/60 shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Class Students</span>
                </NavLink>

                <NavLink
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                      isActive
                        ? 'text-primary-700 bg-primary-50 font-bold border border-primary-200/60 shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Info className="w-4 h-4 text-sky-600" />
                  <span>About Class</span>
                </NavLink>
              </div>

              {/* Course Highlights in Drawer */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Featured Topics</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-1 rounded-md border border-slate-200">React 18</span>
                  <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-1 rounded-md border border-slate-200">TypeScript</span>
                  <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-1 rounded-md border border-slate-200">Supabase</span>
                  <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-1 rounded-md border border-slate-200">Firebase FCM</span>
                </div>
              </div>
            </div>

            {/* Bottom Auth Buttons in Mobile Drawer */}
            <div className="pt-6 border-t border-slate-100 space-y-2.5">
              {isAuthenticated ? (
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(dashboardRoute);
                  }}
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-md shadow-primary-500/25"
                  leftIcon={<LayoutDashboard className="w-4 h-4" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    variant="outline"
                    size="lg"
                    className="w-full justify-center text-navy-900 border-slate-200 hover:bg-slate-50 font-bold"
                    leftIcon={<LogIn className="w-4 h-4" />}
                  >
                    Portal Login
                  </Button>
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/signup');
                    }}
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-md shadow-primary-500/25 font-bold"
                    leftIcon={<UserPlus className="w-4 h-4" />}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Join Class
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};
