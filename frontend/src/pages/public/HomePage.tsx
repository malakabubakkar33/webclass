import React, { useEffect, useState, useRef } from 'react';
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
  Trophy,
  Flame,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock
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

interface TopStudentItem {
  id: string;
  rank: number;
  fullName: string;
  rollNumber: string;
  avatarUrl: string;
  attendanceRate: number;
  assignmentsDone: string;
  streakDays: number;
  badge: string;
  specialty?: string;
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
  const [topStudents, setTopStudents] = useState<TopStudentItem[]>([]);
  const [teacher, setTeacher] = useState<TeacherData | null>(null);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingTopStudents, setLoadingTopStudents] = useState(true);
  const [loadingTeacher, setLoadingTeacher] = useState(true);

  // Fallback top 10 achievers in case network delay occurs
  const fallbackTopStudents: TopStudentItem[] = [
    {
      id: 'top-1',
      rank: 1,
      fullName: 'Malik Abubakkar',
      rollNumber: '00000',
      avatarUrl: 'https://vejdcilgwgiscaspbfho.supabase.co/storage/v1/object/public/avatars/avatar-e09ce3fe-9207-44e9-916d-bf2f01b0ca5f.jpg',
      attendanceRate: 99,
      assignmentsDone: '16/16',
      streakDays: 32,
      badge: 'Top Overall Achiever 🥇',
      specialty: 'Full-Stack Architecture',
    },
    {
      id: 'top-2',
      rank: 2,
      fullName: 'Ayesha Noor',
      rollNumber: '00102',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
      attendanceRate: 98,
      assignmentsDone: '16/16',
      streakDays: 28,
      badge: 'Frontend Specialist 🥈',
      specialty: 'React & UI Systems',
    },
    {
      id: 'top-3',
      rank: 3,
      fullName: 'Hamza Farooq',
      rollNumber: '00105',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
      attendanceRate: 97,
      assignmentsDone: '15/16',
      streakDays: 25,
      badge: 'React Pro 🥉',
      specialty: 'State Management',
    },
    {
      id: 'top-4',
      rank: 4,
      fullName: 'Fatima Tariq',
      rollNumber: '00109',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      attendanceRate: 96,
      assignmentsDone: '15/16',
      streakDays: 24,
      badge: 'JavaScript Innovator ⭐',
      specialty: 'Algorithms & Logic',
    },
    {
      id: 'top-5',
      rank: 5,
      fullName: 'Zain Ahmed',
      rollNumber: '00114',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
      attendanceRate: 96,
      assignmentsDone: '15/16',
      streakDays: 22,
      badge: 'Full-Stack Builder 🚀',
      specialty: 'Node & APIs',
    },
    {
      id: 'top-6',
      rank: 6,
      fullName: 'Sara Bilal',
      rollNumber: '00121',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256',
      attendanceRate: 95,
      assignmentsDone: '14/16',
      streakDays: 21,
      badge: 'CSS Master 🎨',
      specialty: 'Responsive Design',
    },
    {
      id: 'top-7',
      rank: 7,
      fullName: 'Bilal Siddiqui',
      rollNumber: '00128',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=256',
      attendanceRate: 95,
      assignmentsDone: '14/16',
      streakDays: 20,
      badge: 'TypeScript Champion 💎',
      specialty: 'Type Architecture',
    },
    {
      id: 'top-8',
      rank: 8,
      fullName: 'Hira Aslam',
      rollNumber: '00135',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
      attendanceRate: 94,
      assignmentsDone: '14/16',
      streakDays: 19,
      badge: 'Database Architect 🗄️',
      specialty: 'PostgreSQL & RLS',
    },
    {
      id: 'top-9',
      rank: 9,
      fullName: 'Usman Raza',
      rollNumber: '00142',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256',
      attendanceRate: 93,
      assignmentsDone: '13/16',
      streakDays: 18,
      badge: 'Consistent Learner 📅',
      specialty: 'Clean Code',
    },
    {
      id: 'top-10',
      rank: 10,
      fullName: 'Maryam Khan',
      rollNumber: '00149',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=256',
      attendanceRate: 92,
      assignmentsDone: '13/16',
      streakDays: 17,
      badge: 'Rising Star ✨',
      specialty: 'Web Fundamentals',
    },
  ];

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
    // 1. Stats
    api.getPublicStats()
      .then((res) => {
        if (res.data?.success) setStats(res.data.data);
      })
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setLoadingStats(false));

    // 2. Courses
    api.getPublicCourses()
      .then((res) => {
        if (res.data?.success) setCourses(res.data.data);
      })
      .catch((err) => console.error('Failed to load courses:', err))
      .finally(() => setLoadingCourses(false));

    // 3. Students
    api.getPublicStudents()
      .then((res) => {
        if (res.data?.success) setStudents(res.data.data);
      })
      .catch((err) => console.error('Failed to load students:', err))
      .finally(() => setLoadingStudents(false));

    // 4. Top 10 Honor Roll Students
    api.getPublicTopStudents()
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setTopStudents(res.data.data);
        } else {
          setTopStudents(fallbackTopStudents);
        }
      })
      .catch(() => setTopStudents(fallbackTopStudents))
      .finally(() => setLoadingTopStudents(false));

    // 5. Teacher
    api.getPublicTeacher()
      .then((res) => {
        if (res.data?.success) setTeacher(res.data.data);
      })
      .catch((err) => console.error('Failed to load teacher:', err))
      .finally(() => setLoadingTeacher(false));
  }, []);

  const displayTopStudents = topStudents.length > 0 ? topStudents : fallbackTopStudents;

  return (
    <div className="w-full bg-[#F8FAFC]">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Streamlined Size so Heading & Action Buttons fit comfortably) */}
      {/* ========================================================================= */}
      <section className="relative flex items-center justify-center overflow-hidden border-b border-slate-200/80 pt-8 sm:pt-12 pb-12 sm:pb-16">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=2000')`,
          }}
        />

        {/* Light Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/88 to-[#F8FAFC]" />

        {/* Ambient Subtle Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-primary-400/15 via-secondary-400/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Small Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200/70 shadow-2xs mb-4"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-600 animate-spin-slow" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
              SMIT WEB DEVELOPMENT CLASS
            </span>
          </motion.div>

          {/* Main Heading - Balanced size so buttons fit comfortably on screen */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-navy-950 tracking-tight leading-tight sm:leading-snug"
          >
            Master Modern Web Development.
            <span className="block mt-1.5 text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600">
              From Core Fundamentals to Full-Stack Engineering.
            </span>
          </motion.h1>

          {/* Subtitle / Description */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Official SMIT Web Development curriculum covering HTML5, CSS3, JavaScript ES6+, React 18, and Supabase PostgreSQL with dedicated instructor guidance, attendance tracking, and video lectures.
          </motion.p>

          {/* Action Buttons - Instantly visible on viewport */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <Button
              onClick={() => navigate('/signup')}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-lg shadow-primary-500/25 px-8 text-base font-bold"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Join Class
            </Button>
            <Button
              onClick={() => navigate('/courses')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto bg-white/90 hover:bg-white text-navy-900 border-slate-300 px-8 text-base font-bold shadow-xs"
              leftIcon={<BookOpen className="w-5 h-5 text-primary-600" />}
            >
              Explore Courses
            </Button>
          </motion.div>

          {/* Supporting Trust Pill */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 text-xs font-semibold text-slate-500 flex items-center justify-center gap-2"
          >
            <GraduationCap className="w-4 h-4 text-secondary-600" />
            <span>Structured Cohort • Monday & Thursday (4:00 PM – 6:00 PM)</span>
          </motion.p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC CLASS STATS WITH ANIMATED COUNTERS */}
      {/* ========================================================================= */}
      <section className="relative -mt-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {/* Students Enrolled */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="h-full p-5 bg-white border border-slate-200/90 shadow-md shadow-slate-200/50 rounded-2xl flex items-center gap-3.5 transition hover:shadow-xl hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Students Enrolled</p>
                {loadingStats && loadingStudents ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-0.5">
                    <AnimatedCounter value={enrolledStudentsCount} duration={1.2} />
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Courses */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="h-full p-5 bg-white border border-slate-200/90 shadow-md shadow-slate-200/50 rounded-2xl flex items-center gap-3.5 transition hover:shadow-xl hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-secondary-600 flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Curriculum Courses</p>
                {loadingStats && loadingCourses ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-0.5">
                    <AnimatedCounter value={Math.max(stats?.totalCourses || 0, courses.length || 6)} duration={1.2} />
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Topics */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="h-full p-5 bg-white border border-slate-200/90 shadow-md shadow-slate-200/50 rounded-2xl flex items-center gap-3.5 transition hover:shadow-xl hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Syllabus Topics</p>
                {loadingStats ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-0.5">
                    <AnimatedCounter value={Math.max(stats?.totalTopics || 0, 18)} duration={1.2} />
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Class Days & Time */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card className="h-full p-5 bg-white border border-slate-200/90 shadow-md shadow-slate-200/50 rounded-2xl flex items-center gap-3.5 transition hover:shadow-xl hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 shadow-2xs">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Live Schedule</p>
                <p className="text-sm font-extrabold text-navy-900 mt-0.5">
                  Mon & Thu
                </p>
                <p className="text-[11px] font-semibold text-slate-500">4:00 PM – 6:00 PM</p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TOP 10 HIGH ACHIEVERS / HONOR ROLL SECTION (Animated Horizontal Scroll) */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2.5 border border-amber-200/60 shadow-2xs">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Honor Roll & Leaderboard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Top 10 High-Performing Students
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Recognized for outstanding classroom attendance, active participation, and 100% assignment submission streaks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline-block">
              Hover to inspect profile • Auto-scrolling
            </span>
            <Button
              onClick={() => navigate('/students')}
              variant="outline"
              size="sm"
              className="text-xs font-bold"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View Full Class Directory
            </Button>
          </div>
        </div>

        {/* Continuous Horizontal Marquee Banner (No Scrollbar Lines) */}
        <div className="relative w-full overflow-hidden no-scrollbar py-2">
          {/* Subtle edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Marquee Track: Double the array so it scrolls seamlessly without breaking */}
          <div className="animate-marquee flex items-center gap-5 no-scrollbar px-4">
            {[...displayTopStudents, ...displayTopStudents].map((student, idx) => (
              <div
                key={`${student.id}-${idx}`}
                className="w-72 sm:w-80 shrink-0 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-primary-400 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                onClick={() => navigate('/students')}
              >
                {/* Shiny gradient accent header line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    student.rank === 1
                      ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                      : student.rank === 2
                      ? 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500'
                      : student.rank === 3
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600'
                      : 'bg-gradient-to-r from-primary-500 to-secondary-500'
                  }`}
                />

                {/* Top Row: Rank Tag & Streak */}
                <div className="flex items-center justify-between pt-1 mb-3.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1 ${
                        student.rank === 1
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : student.rank === 2
                          ? 'bg-slate-100 text-slate-800 border border-slate-300'
                          : student.rank === 3
                          ? 'bg-orange-100 text-orange-900 border border-orange-300'
                          : 'bg-blue-50 text-primary-700 border border-blue-200'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5 shrink-0" />
                      <span>Rank #{student.rank}</span>
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span>{student.streakDays}d Streak</span>
                  </div>
                </div>

                {/* Student Avatar & Identity */}
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={
                        getMediaUrl(student.avatarUrl) ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.fullName)}`
                      }
                      alt={student.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-primary-100 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.fullName)}`;
                      }}
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-extrabold text-navy-950 group-hover:text-primary-600 transition-colors truncate">
                      {student.fullName}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      Roll No: <span className="font-bold text-primary-700">{student.rollNumber}</span>
                    </p>
                    <p className="text-[10px] font-bold text-secondary-600 truncate mt-0.5">
                      {student.specialty || student.badge}
                    </p>
                  </div>
                </div>

                {/* Score & Attendance Metrics Strip */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance</p>
                    <p className="text-sm font-black text-emerald-600 flex items-center justify-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{student.attendanceRate}%</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignments</p>
                    <p className="text-sm font-black text-primary-700 flex items-center justify-center gap-1 mt-0.5">
                      <Award className="w-3.5 h-3.5 text-primary-500" />
                      <span>{student.assignmentsDone}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CURRICULUM COURSES SECTION */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary-600 text-xs font-bold uppercase tracking-wider mb-2.5 border border-primary-200/60 shadow-2xs">
              <BookOpen className="w-3.5 h-3.5" />
              Comprehensive Syllabus
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Class Curriculum & Courses
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-600 max-w-2xl">
              Step-by-step modular tracks designed to take you from initial HTML semantics to enterprise full-stack development.
            </p>
          </div>
          <div className="mt-5 md:mt-0">
            <Button
              onClick={() => navigate('/courses')}
              variant="outline"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="font-bold text-sm"
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {courses.slice(0, 6).map((course) => (
              <Card
                key={course.id}
                onClick={() => handleOpenCourse(course.id)}
                className="group flex flex-col bg-white border border-slate-200/90 hover:border-primary-400 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 rounded-3xl overflow-hidden cursor-pointer"
              >
                {/* Real Thumbnail Image */}
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

                {/* Content */}
                <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-navy-950 group-hover:text-primary-600 transition-colors line-clamp-1">
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
      </section>

      {/* ========================================================================= */}
      {/* 5. TEACHER GUIDANCE SPOTLIGHT */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-secondary-600 text-xs font-bold uppercase tracking-wider mb-2.5">
              One Dedicated Instructor
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Learn With Dedicated Mentorship
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-600">
              Direct mentorship, live coding reviews, and hands-on guidance from our lead instructor.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-200/40 overflow-hidden flex flex-col md:flex-row items-stretch">
            {/* Teacher Profile Image */}
            <div className="relative w-full md:w-80 min-h-[260px] md:min-h-full shrink-0 bg-slate-100">
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
            <div className="flex-1 p-6 sm:p-9 text-center md:text-left space-y-3 flex flex-col justify-center">
              <Badge variant="primary" className="bg-primary-100 text-primary-800 font-bold border-none w-fit mx-auto md:mx-0">
                {teacher?.role || 'Lead Instructor & Admin'}
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-950">
                {teacher?.fullName || 'Prof. Alex Vance'}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
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
                  Code Reviews & Feedback
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. STUDENT COMMUNITY TAB (Redesigned with Premium Cards) */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                Class Cohort
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-primary-700 text-xs font-bold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-primary-600" />
                <span>{enrolledStudentsCount} {enrolledStudentsCount === 1 ? 'Student Joined' : 'Students Joined'}</span>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Class Cohort & Learners
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-600 max-w-2xl">
              Meet our dedicated students learning, collaborating, and shipping web applications together.
            </p>
          </div>
          <div className="mt-5 md:mt-0">
            <Button
              onClick={() => navigate('/students')}
              variant="outline"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="font-bold text-sm"
            >
              Meet All Students
            </Button>
          </div>
        </div>

        {/* Dynamic Student Cards */}
        {loadingStudents ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-8 text-center space-y-4 bg-white rounded-3xl border border-slate-200">
                <Skeleton className="w-24 h-24 rounded-3xl mx-auto" />
                <Skeleton className="h-6 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
                <Skeleton className="h-8 w-2/3 mx-auto rounded-xl" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {(students.length > 0 ? students.slice(0, 6) : displayTopStudents.slice(0, 6)).map((student, idx) => (
              <div
                key={student.id}
                className="group bg-white border border-slate-200/90 hover:border-primary-400 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col justify-between"
              >
                {/* Top Image Banner */}
                <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
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
                  <div className="absolute top-3 left-3 bg-navy-950/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Student #{String(idx + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-700 shadow-2xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Cohort
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-black text-navy-950 group-hover:text-primary-600 transition-colors truncate">
                      {student.fullName}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50/90 border border-primary-200/70 text-primary-800 text-xs font-bold shadow-2xs">
                      <BookOpen className="w-3.5 h-3.5 text-primary-600" />
                      <span>Web Development Track</span>
                    </div>
                  </div>

                  {/* Roll Number Strip */}
                  <div className="w-full mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">SMIT ID:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                      {student.rollNumber || 'Active Student'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 7. BOTTOM CTA */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-16 bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <Badge className="bg-white/20 text-white border-none font-bold uppercase tracking-wider text-xs">
            Start Learning Today
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Build Strong Foundations. Ship Real Projects.
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto">
            Join the SMIT Web Development class and turn concepts into working applications with step-by-step guidance.
          </p>
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
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
              className="w-full sm:w-auto text-white hover:bg-white/10 border border-white/30 font-bold"
            >
              Student & Teacher Login
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
