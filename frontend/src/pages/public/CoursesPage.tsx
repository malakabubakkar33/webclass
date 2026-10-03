import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  ShieldCheck,
  ExternalLink
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

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isTeacher } = useAuth();
  const { info } = useToast();

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');

  const fetchCourses = () => {
    setLoading(true);
    setError(null);
    api.getPublicCourses()
      .then((res) => {
        if (res.data?.success) {
          setCourses(res.data.data || []);
        } else {
          setError('Unable to load courses at this moment.');
        }
      })
      .catch((err) => {
        console.error('Failed to load courses:', err);
        setError('Unable to load courses.');
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

  return (
    <div className="w-full min-h-[75vh] bg-[#F8FAFC] pt-8 sm:pt-10 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-primary-600 text-xs font-bold uppercase tracking-wider mb-3 border border-primary-200/60 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Classroom Curriculum
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-navy-900 tracking-tight">
            Explore All Courses
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            Browse our SMIT Web Development class curriculum. Log in to your portal to stream full lessons and code files.
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses by technology or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </div>

          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedLevel === lvl
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Content States */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4 space-y-4 bg-white rounded-3xl border border-slate-200">
                <Skeleton className="h-52 w-full rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-900">{error}</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              There was a problem communicating with the classroom database.
            </p>
            <Button onClick={fetchCourses} variant="primary" size="md">
              Try Again
            </Button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-navy-900">
              {searchQuery || selectedLevel !== 'All'
                ? 'No matching courses found'
                : 'No courses have been published yet.'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              {searchQuery || selectedLevel !== 'All'
                ? 'Try adjusting your search keywords or clear your filter criteria.'
                : 'Your instructor will publish new courses soon.'}
            </p>
            {(searchQuery || selectedLevel !== 'All') && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLevel('All');
                }}
                variant="outline"
                size="sm"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                onClick={() => handleOpenCourse(course.id)}
                className="group flex flex-col bg-white border border-slate-200/90 hover:border-primary-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden cursor-pointer"
              >
                {/* Real Image Box with Overlay Badges */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600';
                    }}
                  />
                  {/* Floating Level Badge - Solid background without blur */}
                  <div className="absolute top-3.5 left-3.5">
                    <Badge
                      variant="primary"
                      className="bg-white text-primary-700 font-bold border border-primary-200 shadow-sm"
                    >
                      {course.level}
                    </Badge>
                  </div>

                  {/* Portal Access Required Tag - Solid background without blur */}
                  <div className="absolute top-3.5 right-3.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                      <Lock className="w-3 h-3 text-secondary-600" />
                      Portal Only
                    </span>
                  </div>
                </div>

                {/* Course Name and Details */}
                <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-navy-950 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div>
                    {/* Topics & Videos Stats */}
                    <div className="flex items-center gap-4 py-3.5 border-t border-slate-100 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-primary-500" />
                        {course.topicsCount} Topics
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-secondary-500" />
                        {course.videosCount} Video Lessons
                      </span>
                    </div>

                    {/* Access CTA Button */}
                    <div className="pt-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCourse(course.id);
                        }}
                        variant="primary"
                        size="md"
                        className="w-full justify-center shadow-xs"
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
      </div>
    </div>
  );
};
