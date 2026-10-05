import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  Video,
  Calendar,
  ArrowRight,
  Code2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Layers,
  GraduationCap,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { getMediaUrl } from '../../utils/media.js';

interface StatsData {
  totalStudents: number;
  totalCourses: number;
  totalTopics: number;
  totalVideos: number;
  classDays: string;
  classTiming: string;
}

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

interface StudentItem {
  id: string;
  fullName: string;
  rollNumber: string;
  avatarUrl: string;
}

interface TeacherData {
  fullName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  role: string;
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isTeacher } = useAuth();
  const { info } = useToast();

  // State
  const [stats, setStats] = useState<StatsData | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teacher, setTeacher] = useState<TeacherData | null>(null);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingTeacher, setLoadingTeacher] = useState(true);

  // Guarantee student count is always strictly accurate and includes all joined students
  const enrolledStudentsCount = Math.max(stats?.totalStudents || 0, students?.length || 0);

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

  useEffect(() => {
    // 1. Fetch dynamic stats
    api.getPublicStats()
      .then((res) => {
        if (res.data?.success) setStats(res.data.data);
      })
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setLoadingStats(false));

    // 2. Fetch dynamic courses
    api.getPublicCourses()
      .then((res) => {
        if (res.data?.success) setCourses(res.data.data);
      })
      .catch((err) => console.error('Failed to load courses:', err))
      .finally(() => setLoadingCourses(false));

    // 3. Fetch dynamic students preview
    api.getPublicStudents()
      .then((res) => {
        if (res.data?.success) setStudents(res.data.data);
      })
      .catch((err) => console.error('Failed to load students:', err))
      .finally(() => setLoadingStudents(false));

    // 4. Fetch dynamic teacher
    api.getPublicTeacher()
      .then((res) => {
        if (res.data?.success) setTeacher(res.data.data);
      })
      .catch((err) => console.error('Failed to load teacher:', err))
      .finally(() => setLoadingTeacher(false));
  }, []);

  return (
    <div className="w-full bg-[#F8FAFC]">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION WITH LARGE BACKGROUND IMAGE & LIGHT OVERLAY */}
      {/* ========================================================================= */}
      <section className="relative min-h-[72vh] flex items-center justify-center overflow-hidden border-b border-slate-200/80">
        {/* Large High-Quality Background Image (Modern Developer Workspace & Code) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=2000')`,
          }}
        />

        {/* Subtle Light Gradient Overlay to maintain clean light theme and high text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-[#F8FAFC]" />

        {/* Ambient subtle light glow shapes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-primary-400/15 via-secondary-400/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-14 sm:pb-18 text-center">
          {/* Small Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200/60 shadow-xs mb-5"
          >
            <Sparkles className="w-4 h-4 text-primary-600 animate-spin-slow" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
              SMIT WEB DEVELOPMENT CLASS
            </span>
          </motion.div>

          {/* Main Heading & Second Line */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-navy-900 tracking-tight leading-[1.1]"
          >
            Master Modern Web Development.
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600">
              From Core Fundamentals to Full-Stack Engineering.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal"
          >
            Official SMIT Web Development curriculum covering HTML5, CSS3, JavaScript ES6+, React, Node.js, and Supabase PostgreSQL with dedicated instructor guidance, hands-on assignments, and structured video lessons.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={() => navigate('/signup')}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-lg shadow-primary-500/25 px-8 text-base"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Join Class
            </Button>
            <Button
              onClick={() => navigate('/courses')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto bg-white/80 hover:bg-white text-navy-800 border-slate-300 px-8 text-base shadow-sm"
              leftIcon={<BookOpen className="w-5 h-5 text-primary-600" />}
            >
              Explore Courses
            </Button>
          </motion.div>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 text-sm font-medium text-slate-500 flex items-center justify-center gap-2"
          >
            <GraduationCap className="w-4 h-4 text-secondary-600" />
            One class. One teacher. One complete learning journey.
          </motion.p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC CLASS STATS SECTION WITH ANIMATED COUNTERS */}
      {/* ========================================================================= */}
      <section className="relative -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Students Enrolled */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full p-6 bg-white border border-slate-200/80 shadow-md shadow-slate-200/50 rounded-2xl flex items-center gap-4 transition hover:shadow-xl hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-xs">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Students Enrolled</p>
                {loadingStats && loadingStudents ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-0.5">
                    <AnimatedCounter value={enrolledStudentsCount} duration={1.4} />
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Courses */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full p-6 bg-white border border-slate-200/80 shadow-md shadow-slate-200/50 rounded-2xl flex items-center gap-4 transition hover:shadow-xl hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-secondary-600 flex items-center justify-center shrink-0 border border-purple-100 shadow-xs">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Courses</p>
                {loadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-0.5">
                    <AnimatedCounter value={stats?.totalCourses ?? 0} duration={1.2} />
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Lessons */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="h-full p-6 bg-white border border-slate-200/80 shadow-md shadow-slate-200/50 rounded-2xl flex items-center gap-4 transition hover:shadow-xl hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-xs">
                <Video className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Lessons</p>
                {loadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-0.5">
                    <AnimatedCounter value={stats?.totalVideos ?? 0} duration={1.5} />
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Class Days */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="h-full p-6 bg-white border border-slate-200/80 shadow-md shadow-slate-200/50 rounded-2xl flex items-center gap-4 transition hover:shadow-xl hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Class Days</p>
                {loadingStats ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-lg sm:text-xl font-bold text-navy-900 mt-0.5 leading-tight flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {stats?.classDays ?? 'Monday & Thursday'}
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. OUR COURSES PREVIEW SECTION */}
      {/* ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary-600 text-xs font-bold uppercase tracking-wider mb-3">
              Curriculum Path
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Explore Our Learning Path
            </h2>
            <p className="mt-2 text-base text-slate-600 max-w-2xl">
              Follow a structured path from the fundamentals of web development to modern full-stack technologies.
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <Button
              onClick={() => navigate('/courses')}
              variant="outline"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View All Courses
            </Button>
          </div>
        </div>

        {/* Dynamic Courses Grid */}
        {loadingCourses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 space-y-4">
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-lg font-bold text-navy-900">No courses published yet</p>
            <p className="text-sm text-slate-500 mt-1">Courses created by the teacher will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.slice(0, 6).map((course) => (
              <Card
                key={course.id}
                onClick={() => handleOpenCourse(course.id)}
                className="group flex flex-col bg-white border border-slate-200/90 hover:border-primary-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden cursor-pointer"
              >
                {/* Real Thumbnail Image */}
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
                  {/* Floating Level Badge - Solid background without blur for crisp clarity */}
                  <div className="absolute top-3.5 left-3.5">
                    <Badge
                      variant="primary"
                      className="bg-white text-primary-700 font-bold border border-primary-200 shadow-sm"
                    >
                      {course.level}
                    </Badge>
                  </div>

                  {/* Portal Only Tag - Solid background without blur */}
                  <div className="absolute top-3.5 right-3.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                      <Lock className="w-3 h-3 text-secondary-600" />
                      Portal Only
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-navy-950 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed font-medium">
                      {course.description}
                    </p>
                  </div>

                  <div>
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
      </section>

      {/* ========================================================================= */}
      {/* 4. TEACHER SECTION: LEARN WITH DEDICATED GUIDANCE */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-secondary-600 text-xs font-bold uppercase tracking-wider mb-3">
              One Dedicated Instructor
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Learn With Dedicated Guidance
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Direct mentorship and continuous code reviews from our lead web development instructor.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row items-stretch">
            {/* Teacher Profile Image - Full Box (No Box inside Box) */}
            <div className="relative w-full md:w-80 min-h-[280px] md:min-h-full shrink-0 bg-slate-100">
              <img
                src={
                  teacher?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'
                }
                alt={teacher?.fullName || 'Teacher Profile'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600';
                }}
              />
              <div className="absolute top-4 left-4 bg-primary-600/95 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl shadow-md text-xs font-bold flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                <span>Class Instructor</span>
              </div>
            </div>

            {/* Teacher Info */}
            <div className="flex-1 p-8 sm:p-10 text-center md:text-left space-y-3 flex flex-col justify-center">
              <Badge variant="primary" className="bg-primary-100/80 text-primary-800 font-bold border-none w-fit mx-auto md:mx-0">
                {teacher?.role || 'Lead Instructor & Admin'}
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-900">
                {teacher?.fullName || 'Prof. Alex Vance'}
              </h3>
              <p className="text-slate-600 text-base leading-relaxed">
                {teacher?.bio ||
                  'Leading our SMIT Web Development class with structured lessons, practical projects, code reviews and continuous guidance from foundational HTML to modern full-stack architectures.'}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Monday & Thursday Live Sessions
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Curriculum Developer
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. STUDENT COMMUNITY SECTION: GROWING TOGETHER */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                Class Cohort
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-primary-700 text-xs font-bold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-primary-600" />
                <span>{enrolledStudentsCount} {enrolledStudentsCount === 1 ? 'Student Joined' : 'Students Joined'}</span>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Growing Together
            </h2>
            <p className="mt-2 text-base text-slate-600 max-w-2xl">
              Meet some of our students learning, practicing, and building projects together in our web development class.
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <Button
              onClick={() => navigate('/students')}
              variant="outline"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Meet Our Class
            </Button>
          </div>
        </div>

        {/* Dynamic Student Cards (Safe public data only: photo, name, roll number) */}
        {loadingStudents ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-8 text-center space-y-4 bg-white rounded-3xl border border-slate-200">
                <Skeleton className="w-24 h-24 rounded-3xl mx-auto" />
                <Skeleton className="h-6 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
                <Skeleton className="h-8 w-2/3 mx-auto rounded-xl" />
              </Card>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl p-6">
            <p className="text-sm font-semibold text-slate-500">No student profiles are currently public.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Elegant connecting line running behind the cards on desktop */}
            <div className="hidden lg:block absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-blue-200 via-purple-300 to-blue-200 -translate-y-1/2 z-0 pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              {students.slice(0, 6).map((student, idx) => (
                <div key={student.id} className="relative group">
                  {/* Card Container with Full-Box Photo (No Box inside Box) */}
                  <div className="h-full bg-white border border-slate-200/90 group-hover:border-primary-400 group-hover:shadow-2xl group-hover:-translate-y-1.5 transition-all duration-300 rounded-3xl flex flex-col justify-between relative overflow-hidden">
                    {/* Top ambient subtle gradient glow */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600 opacity-80 group-hover:opacity-100 transition-opacity z-10" />

                    {/* Student Full-Box Top Image */}
                    <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={
                          getMediaUrl(student.avatarUrl) ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.fullName)}`
                        }
                        alt={student.fullName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.fullName)}`;
                        }}
                      />
                      <div className="absolute top-3 left-3 bg-navy-900/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Joined Student #{String(idx + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-700 shadow-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Cohort
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="p-6 flex flex-col flex-1 justify-between text-left">
                      <div className="space-y-2">
                        <h3 className="text-lg font-black text-navy-950 group-hover:text-primary-600 transition-colors truncate">
                          {student.fullName}
                        </h3>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50/90 border border-primary-200/70 text-primary-800 text-xs font-bold shadow-2xs">
                          <BookOpen className="w-3.5 h-3.5 text-primary-600" />
                          <span>Web Development Course</span>
                        </div>
                      </div>

                      {/* Roll Number Pill */}
                      <div className="w-full mt-5 pt-4 border-t border-slate-100/90 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">SMIT ID:</span>
                        <span className="px-3 py-1 rounded-xl bg-blue-50/90 border border-primary-200/60 text-primary-700 text-xs font-bold shadow-xs">
                          {student.rollNumber || 'Active Student'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal connecting dot node for desktop between cards */}
                  {idx < Math.min(students.length, 6) - 1 && (idx + 1) % 3 !== 0 && (
                    <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 items-center justify-center pointer-events-none">
                      <div className="w-3 h-3 rounded-full bg-white border-2 border-primary-500 shadow-md flex items-center justify-center">
                        <span className="w-1 h-1 rounded-full bg-secondary-600" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. BOTTOM CALL TO ACTION */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-16 bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge className="bg-white/20 text-white border-none font-bold uppercase tracking-wider text-xs">
            Start Learning Today
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Build Strong Foundations. Create Real Projects.
          </h2>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto">
            Join the SMIT Web Development class and turn concepts into working applications with step-by-step guidance.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate('/signup')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto bg-white text-primary-700 hover:bg-blue-50 border-none font-bold shadow-lg"
              rightIcon={<ArrowRight className="w-5 h-5 text-primary-700" />}
            >
              Join Our Class
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto text-white hover:bg-white/10 border border-white/30"
            >
              Student & Teacher Login
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
