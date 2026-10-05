import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Layers,
  Video,
  ArrowRight,
  Filter,
  RefreshCw,
  Sparkles,
  Lock,
  X,
  SlidersHorizontal,
  CheckCircle,
  GraduationCap
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

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

const FALLBACK_DEFAULT_COURSES: CourseItem[] = [
  {
    id: 'course-html5-css3',
    title: 'HTML5 & Modern CSS3 Architecture',
    slug: 'html5-modern-css3-architecture',
    description: 'Master semantic HTML5, Flexbox, CSS Grid, custom properties, animations, and responsive web design best practices.',
    thumbnail_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    level: 'Beginner',
    topicsCount: 4,
    videosCount: 12,
  },
  {
    id: 'course-javascript-es6',
    title: 'Modern JavaScript (ES6+) Fundamentals',
    slug: 'modern-javascript-es6-fundamentals',
    description: 'Deep dive into modern JS: lexical scope, closures, promises, async/await, DOM APIs, and functional paradigms.',
    thumbnail_url: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&q=80&w=800',
    level: 'Beginner',
    topicsCount: 4,
    videosCount: 14,
  },
  {
    id: 'course-typescript',
    title: 'TypeScript for Production Web Apps',
    slug: 'typescript-production-web-apps',
    description: 'Static typing, generics, interfaces, strict mode, union types, and error-free codebases.',
    thumbnail_url: 'https://images.unsplash.com/photo-1516116211227-bbc042c1619a?auto=format&fit=crop&q=80&w=800',
    level: 'Intermediate',
    topicsCount: 3,
    videosCount: 8,
  },
  {
    id: 'course-react',
    title: 'React 18 & Enterprise Component Architecture',
    slug: 'react-18-enterprise-architecture',
    description: 'Component lifecycles, hooks, context API, state machines, and real-world dashboards.',
    thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
    level: 'Intermediate',
    topicsCount: 5,
    videosCount: 15,
  },
  {
    id: 'course-firebase',
    title: 'Firebase Cloud Mastery & Push Notifications',
    slug: 'firebase-cloud-mastery',
    description: 'Realtime database, Cloud Firestore, Firebase Auth, FCM web notifications, and storage buckets.',
    thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800',
    level: 'Advanced',
    topicsCount: 3,
    videosCount: 7,
  },
  {
    id: 'course-supabase',
    title: 'Supabase & PostgreSQL Full-Stack Architecture',
    slug: 'supabase-postgresql-architecture',
    description: 'Relational data modeling, Row-Level Security (RLS), realtime subscriptions, and Edge Functions.',
    thumbnail_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=800',
    level: 'Advanced',
    topicsCount: 3,
    videosCount: 9,
  },
];

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isTeacher } = useAuth();
  const { info } = useToast();

  const [courses, setCourses] = useState<CourseItem[]>(FALLBACK_DEFAULT_COURSES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Collapsible filter sidebar

  const fetchCourses = () => {
    setLoading(true);
    setError(null);
    api.getPublicCourses()
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCourses(res.data.data);
        } else {
          setCourses(FALLBACK_DEFAULT_COURSES);
        }
      })
      .catch((err) => {
        console.error('Failed to load courses:', err);
        setCourses(FALLBACK_DEFAULT_COURSES);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel =
        selectedLevel === 'All' || c.level.toLowerCase() === selectedLevel.toLowerCase();
      return matchesSearch && matchesLevel;
    });
  }, [courses, searchQuery, selectedLevel]);

  const activeFiltersCount = (selectedLevel !== 'All' ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const handleOpenCourse = (courseId: string) => {
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

  const levelCounts = useMemo(() => {
    return {
      All: courses.length,
      Beginner: courses.filter((c) => c.level === 'Beginner').length,
      Intermediate: courses.filter((c) => c.level === 'Intermediate').length,
      Advanced: courses.filter((c) => c.level === 'Advanced').length,
    };
  }, [courses]);

  return (
    <div className="w-full min-h-[75vh] bg-[#F8FAFC] pt-6 sm:pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* ONE CLEAN, UNIFIED HEADING (Removed redundant duplicate top headings) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary-600 text-xs font-bold uppercase tracking-wider mb-2 border border-primary-200/60">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official SMIT Curriculum</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Classroom Courses & Syllabus
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-xl">
              Explore all Web Development tracks, module topics, and lectures. Log in to stream full videos in the student portal.
            </p>
          </div>

          {/* Action Bar: Filter Toggle & Quick Stats */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              variant={sidebarOpen ? 'primary' : 'outline'}
              size="md"
              className="font-bold text-xs sm:text-sm shadow-xs transition-all"
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            >
              <span>{sidebarOpen ? 'Close Filter Sidebar' : 'Open Filter Sidebar'}</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-white text-primary-700 text-xs font-black shadow-xs">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLevel('All');
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* MAIN LAYOUT: COLLAPSIBLE SIDEBAR + COURSES BOXES */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start relative">
          {/* ========================================================================= */}
          {/* COLLAPSIBLE FILTER SIDEBAR (Desktop Left Pane & Mobile Drawer) */}
          {/* ========================================================================= */}
          {sidebarOpen && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="md:col-span-4 lg:col-span-3 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-lg space-y-6 sticky top-24 z-20"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-navy-900 font-extrabold text-sm">
                  <Filter className="w-4 h-4 text-primary-600" />
                  <span>Filter Courses</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition"
                  title="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Search Topics
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by topic, tech..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Difficulty Level Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Curriculum Level
                </label>
                <div className="space-y-1.5">
                  {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        selectedLevel === lvl
                          ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-2xs font-extrabold'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-transparent'
                      }`}
                    >
                      <span>{lvl}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          selectedLevel === lvl
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-200/80 text-slate-600'
                        }`}
                      >
                        {levelCounts[lvl] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Summary Pill */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Available Courses:</span>
                  <strong className="text-navy-900 font-bold">{courses.length}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Matching Criteria:</span>
                  <strong className="text-primary-700 font-bold">{filteredCourses.length}</strong>
                </div>
              </div>

              {/* Reset Button */}
              {activeFiltersCount > 0 && (
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLevel('All');
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Clear All Filters
                </Button>
              )}
            </motion.aside>
          )}

          {/* ========================================================================= */}
          {/* COURSES BOXES GRID */}
          {/* ========================================================================= */}
          <main
            className={`${
              sidebarOpen ? 'md:col-span-8 lg:col-span-9' : 'md:col-span-12'
            } transition-all duration-300`}
          >
            {loading ? (
              <div
                className={`grid grid-cols-1 ${
                  sidebarOpen ? 'sm:grid-cols-2 lg:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
                } gap-6 sm:gap-8`}
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-4 space-y-4 bg-white rounded-3xl border border-slate-200">
                    <Skeleton className="h-48 w-full rounded-2xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </Card>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-navy-900">No matching courses found</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">
                  Try adjusting your search keywords or clear your filter criteria.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLevel('All');
                  }}
                  variant="primary"
                  size="sm"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 ${
                  sidebarOpen ? 'sm:grid-cols-2 lg:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
                } gap-6 sm:gap-8`}
              >
                {filteredCourses.map((course) => (
                  <Card
                    key={course.id}
                    onClick={() => handleOpenCourse(course.id)}
                    className="group flex flex-col bg-white border border-slate-200/90 hover:border-primary-400 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 rounded-3xl overflow-hidden cursor-pointer"
                  >
                    {/* Course Thumbnail Image Box */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600';
                        }}
                      />
                      {/* Floating Level Badge */}
                      <div className="absolute top-3.5 left-3.5">
                        <Badge
                          variant="primary"
                          className="bg-white text-primary-700 font-bold border border-primary-200 shadow-sm"
                        >
                          {course.level}
                        </Badge>
                      </div>

                      {/* Portal Only Tag */}
                      <div className="absolute top-3.5 right-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                          <Lock className="w-3 h-3 text-secondary-600" />
                          Portal Only
                        </span>
                      </div>
                    </div>

                    {/* Content Box */}
                    <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                      <div>
                        <h3 className="text-lg font-black text-navy-950 group-hover:text-primary-600 transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed font-medium">
                          {course.description}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-4 py-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-primary-500" />
                            {course.topicsCount} Topics
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Video className="w-4 h-4 text-secondary-500" />
                            {course.videosCount} Video Lessons
                          </span>
                        </div>

                        <div className="pt-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCourse(course.id);
                            }}
                            variant="primary"
                            size="md"
                            className="w-full justify-center shadow-xs font-bold"
                            leftIcon={!isAuthenticated ? <Lock className="w-4 h-4" /> : undefined}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                          >
                            {isAuthenticated ? 'Open in Student Portal' : 'Login to Access Course'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
