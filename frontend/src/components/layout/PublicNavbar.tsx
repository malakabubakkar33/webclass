import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Button } from '../ui/Button.js';
import { api } from '../../services/api.js';
import {
  GraduationCap,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Layers,
  Lock,
  BookOpen,
  Sparkles
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
    id: 'course-html',
    title: 'HTML5 Semantic Web Architecture',
    slug: 'html5-semantic-web-architecture',
    description: 'Master semantic markup, forms, modern SEO, accessibility standards, and web fundamentals.',
    thumbnail_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
    level: 'Beginner',
    topicsCount: 4,
    videosCount: 8,
  },
  {
    id: 'course-css',
    title: 'Modern CSS3 & Responsive Design',
    slug: 'modern-css3-responsive-design',
    description: 'Deep dive into Flexbox, CSS Grid, mobile-first design, fluid typography, and animations.',
    thumbnail_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=400',
    level: 'Beginner',
    topicsCount: 4,
    videosCount: 9,
  },
  {
    id: 'course-javascript',
    title: 'JavaScript Deep Dive & DOM Engineering',
    slug: 'javascript-deep-dive-dom-engineering',
    description: 'Comprehensive ES6+, closures, async/await, Fetch API, event loops, and DOM manipulation.',
    thumbnail_url: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&q=80&w=400',
    level: 'Intermediate',
    topicsCount: 4,
    videosCount: 12,
  },
  {
    id: 'course-typescript',
    title: 'TypeScript for Production Web Apps',
    slug: 'typescript-production-web-apps',
    description: 'Static typing, generics, interfaces, strict mode, union types, and error-free codebases.',
    thumbnail_url: 'https://images.unsplash.com/photo-1516116211227-bbc042c1619a?auto=format&fit=crop&q=80&w=400',
    level: 'Intermediate',
    topicsCount: 3,
    videosCount: 8,
  },
  {
    id: 'course-react',
    title: 'React 18 & Enterprise Component Architecture',
    slug: 'react-18-enterprise-architecture',
    description: 'Component lifecycles, hooks, context API, state machines, and real-world dashboards.',
    thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400',
    level: 'Intermediate',
    topicsCount: 5,
    videosCount: 15,
  },
  {
    id: 'course-firebase',
    title: 'Firebase Cloud Mastery & Push Notifications',
    slug: 'firebase-cloud-mastery',
    description: 'Realtime database, Cloud Firestore, Firebase Auth, FCM web notifications, and storage buckets.',
    thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=400',
    level: 'Advanced',
    topicsCount: 3,
    videosCount: 7,
  },
  {
    id: 'course-supabase',
    title: 'Supabase & PostgreSQL Full-Stack Architecture',
    slug: 'supabase-postgresql-architecture',
    description: 'Relational data modeling, Row-Level Security (RLS), realtime subscriptions, and Edge Functions.',
    thumbnail_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=400',
    level: 'Advanced',
    topicsCount: 3,
    videosCount: 9,
  },
  {
    id: 'course-github-1426',
    title: 'GitHub & Team Version Control Workflows',
    slug: 'github-team-version-control',
    description: 'Git branching models, Pull Requests, merge conflicts, code reviews, and CI/CD pipelines.',
    thumbnail_url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=400',
    level: 'Advanced',
    topicsCount: 2,
    videosCount: 6,
  },
];

export const PublicNavbar: React.FC = () => {
  const { isAuthenticated, user, isTeacher } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [courses, setCourses] = useState<CourseItem[]>(FALLBACK_COURSES);

  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dashboardRoute = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';

  // Fetch courses dynamically from database on mount to merge latest updates
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
    }, 240);
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
    <nav
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all relative"
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-secondary-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-navy-900 tracking-tight block">
              SMIT Web Class
            </span>
            <span className="text-[10px] font-bold text-primary-600 tracking-wider uppercase block">
              Web Development Cohort
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {/* Home Link */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
                isActive
                  ? 'text-primary-600 bg-primary-50/80 shadow-xs'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
              }`
            }
          >
            Home
          </NavLink>

          {/* Courses Nav Item WITH AUTO-HOVER MEGA-MENU TRIGGER */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
          >
            <NavLink
              to="/courses"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  isActive || coursesDropdownOpen
                    ? 'text-primary-600 bg-primary-50/80 shadow-xs'
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
              `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
                isActive
                  ? 'text-primary-600 bg-primary-50/80 shadow-xs'
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
              `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
                isActive
                  ? 'text-primary-600 bg-primary-50/80 shadow-xs'
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
              `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
                isActive
                  ? 'text-primary-600 bg-primary-50/80 shadow-xs'
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
                className="text-slate-700 hover:text-primary-600"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate('/signup')}
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-sm shadow-primary-500/25"
              >
                Join Class
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-navy-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* SLEEK, CLEAN COURSES DROPDOWN */}
      {coursesDropdownOpen && (
        <div
          className="hidden md:block absolute top-full left-0 right-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xl shadow-slate-900/10 z-50 animate-in fade-in slide-in-from-top-1 duration-200"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            {/* Purely Course Cards Grid with titles & level tags */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {courses.slice(0, 8).map((course, idx) => (
                <div
                  key={`${course.id}-${idx}`}
                  onClick={() => handleCourseClick(course.id)}
                  className="p-3.5 rounded-2xl bg-slate-50/90 hover:bg-blue-50/90 border border-slate-200/80 hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <h4 className="text-xs font-bold text-navy-900 group-hover:text-primary-600 transition-colors line-clamp-1 leading-snug">
                    {course.title}
                  </h4>

                  <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-200/60">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        course.level === 'Beginner'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : course.level === 'Advanced'
                          ? 'text-purple-700 bg-purple-50 border-purple-200'
                          : 'text-primary-700 bg-blue-50 border-blue-200'
                      }`}
                    >
                      {course.level}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold truncate">
                      {course.topicsCount} Topics
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Clean View All link */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
              <Link
                to="/courses"
                onClick={() => setCoursesDropdownOpen(false)}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary-600 hover:text-primary-700 transition group"
              >
                <span>Browse All Courses</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-lg px-6 py-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col space-y-1">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-base font-medium transition ${
                  isActive ? 'text-primary-600 bg-primary-50 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-base font-medium transition ${
                  isActive ? 'text-primary-600 bg-primary-50 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Courses ({courses.length})
            </NavLink>

            <NavLink
              to="/features"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-base font-medium transition ${
                  isActive ? 'text-primary-600 bg-primary-50 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Features
            </NavLink>

            <NavLink
              to="/students"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-base font-medium transition ${
                  isActive ? 'text-primary-600 bg-primary-50 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              Students
            </NavLink>

            <NavLink
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-base font-medium transition ${
                  isActive ? 'text-primary-600 bg-primary-50 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              About Class
            </NavLink>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(dashboardRoute);
                }}
                variant="primary"
                size="md"
                className="w-full justify-center"
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
                  size="md"
                  className="w-full justify-center"
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/signup');
                  }}
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Join Class
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
