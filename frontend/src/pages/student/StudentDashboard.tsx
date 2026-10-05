import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import {
  TrendingUp,
  CheckCircle2,
  CalendarCheck,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Layers,
  Award,
  BookOpen,
  AlertCircle,
  Hand,
  CheckCheck,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionInfo, setActiveSessionInfo] = useState<any>(null);
  const [isAcceptingAttendance, setIsAcceptingAttendance] = useState(false);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getStudentDashboard();
      if (res.data?.success) {
        setDashboardData(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      console.error('Error fetching student dashboard:', err);
      setError('Unable to load your learning dashboard. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveSession = async () => {
    try {
      const res = await api.getActiveAttendanceSession();
      if (res.data?.success) {
        setActiveSessionInfo(res.data.data);
      }
    } catch (e) {}
  };

  const handleAcceptLiveAttendance = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAcceptingAttendance(true);
    try {
      const res = await api.acceptAttendanceRequest(sessionId);
      if (res.data?.success) {
        success('Attendance accepted! You are marked Present for today’s class. 🎉', 'Verified Present ✅');
        await fetchActiveSession();
        await fetchDashboard();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to accept attendance request');
    } finally {
      setIsAcceptingAttendance(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchActiveSession();

    // Auto-poll active attendance session every 3.5 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchActiveSession();
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const stats = dashboardData?.stats;
  const attendanceOverview = dashboardData?.attendanceOverview;
  const learningProgressTimeline = dashboardData?.learningProgressTimeline || [];
  const courseProgress = dashboardData?.courseProgress || [];

  // Assignment Chart Data derived from database metrics
  const assignmentChartData = [
    {
      name: 'Completed',
      count: stats?.assignments?.completed || 0,
      fill: '#10B981',
    },
    {
      name: 'Pending',
      count: stats?.assignments?.pending || 0,
      fill: '#F59E0B',
    },
    {
      name: 'Total Assigned',
      count: stats?.assignments?.total || 0,
      fill: '#2563EB',
    },
  ];

  // Course Skills Mastery Data for Bar Comparison
  const courseMasteryData = (courseProgress || []).map((c: any) => ({
    name: c.title.length > 18 ? c.title.substring(0, 16) + '...' : c.title,
    mastery: c.progressPercentage || 0,
    lessons: c.completedVideosCount || 0,
    total: c.videosCount || 0,
  }));

  if (isLoading && !dashboardData) {
    return (
      <div className="space-y-8 pb-12 animate-pulse">
        {/* Welcome Hero Skeleton */}
        <div className="h-44 bg-white/70 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between">
          <div className="h-5 w-40 bg-slate-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-8 w-72 bg-slate-200 rounded-xl" />
            <div className="h-4 w-96 bg-slate-100 rounded-lg" />
          </div>
        </div>

        {/* 4 Stat Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-8 h-80 rounded-3xl" />
          <Skeleton className="lg:col-span-4 h-80 rounded-3xl" />
        </div>

        {/* Curriculum Mastery Skeleton */}
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-rose-200/80 p-8 text-center max-w-lg mx-auto my-12 shadow-xl">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-navy-900">Unable to load your dashboard</h3>
        <p className="text-xs text-slate-500 mt-2 mb-6">{error}</p>
        <Button onClick={fetchDashboard} variant="primary" size="md">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* ========================================================================= */}
      {/* 1. CLEAN GLASSMORPHIC WELCOME HERO (NO EXTRA LABELS, WITH WAVING HAND) */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/80 shadow-lg shadow-blue-500/5">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-primary-400/15 via-secondary-400/15 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 text-primary-700 text-xs font-bold shadow-2xs border border-blue-200/60">
              <Sparkles className="w-3.5 h-3.5 text-secondary-600" />
              <span>Roll Number: {dashboardData?.student?.rollNumber || user?.rollNumber || 'Enrolled Student'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-900 tracking-tight leading-snug">
              {getGreeting()},{' '}
              <span className="inline-flex items-center gap-2 align-baseline whitespace-nowrap">
                <span>{dashboardData?.student?.fullName || user?.fullName || 'Student'}</span>
                <motion.span
                  className="inline-block origin-[70%_70%] select-none shrink-0"
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                >
                  👋
                </motion.span>
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-medium leading-relaxed">
              Continue learning and keep building your web development skills.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={() => navigate('/student/courses')}
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="shadow-sm shadow-primary-500/25"
            >
              Explore Courses &rarr;
            </Button>
            <Button
              onClick={() => navigate('/student/assignments')}
              variant="outline"
              size="lg"
              leftIcon={<ClipboardCheck className="w-4 h-4 text-secondary-600" />}
              className="bg-white/80 hover:bg-white"
            >
              View Assignments
            </Button>
          </div>
        </div>
      </div>

      {/* Live Attendance Alert Banner */}
      {activeSessionInfo?.session?.status === 'active' && (
        <div
          onClick={() => navigate('/student/attendance')}
          className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-primary-700 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-xl transition transform hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3.5">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-400 animate-ping shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Live Attendance Active
                </span>
                <span className="text-xs text-blue-100 font-semibold">
                  Monday & Tuesday • 4:00 PM – 6:00 PM
                </span>
              </div>
              <p className="text-sm font-extrabold mt-0.5 text-white">
                {activeSessionInfo?.studentResponse?.status === 'approved' || activeSessionInfo?.isAlreadyMarkedPresentToday
                  ? "Your check-in has been verified as Present for today's session! ✅"
                  : `${dashboardData?.instructor?.fullName || 'Your Instructor'} requested attendance for today's class! Tap Accept below.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeSessionInfo?.studentResponse?.status === 'approved' || activeSessionInfo?.isAlreadyMarkedPresentToday ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-sm">
                <CheckCheck className="w-4 h-4 stroke-[3]" />
                <span>Verified Present Today</span>
              </span>
            ) : (
              <Button
                onClick={(e) => handleAcceptLiveAttendance(activeSessionInfo.session.id, e)}
                isLoading={isAcceptingAttendance}
                variant="secondary"
                size="sm"
                className="bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Hand className="w-4 h-4 text-emerald-600" />
                <span>Accept Attendance Now</span>
              </Button>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/student/attendance');
              }}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs rounded-xl"
            >
              Details &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ANIMATED KPI STATISTIC CARDS (GLASSMORPHIC) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Overall Progress */}
        <div className="p-6 bg-white/75 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Overall Progress
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50/80 text-primary-600 flex items-center justify-center border border-blue-100/80 shadow-2xs group-hover:scale-105 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl sm:text-4xl font-black text-navy-900 tracking-tight flex items-baseline">
                <AnimatedCounter value={stats?.overallProgress || 0} />
                <span className="text-xl font-bold text-primary-600 ml-0.5">%</span>
              </p>
            )}
            <p className="text-xs text-slate-500 font-medium mt-1">
              Curriculum mastery rate
            </p>
          </div>
        </div>

        {/* Card 2: Completed Lessons */}
        <div className="p-6 bg-white/75 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Completed Lessons
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50/80 text-secondary-600 flex items-center justify-center border border-purple-100/80 shadow-2xs group-hover:scale-105 transition">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-3xl sm:text-4xl font-black text-navy-900 tracking-tight flex items-baseline gap-1">
                <AnimatedCounter value={stats?.completedLessons || 0} />
                <span className="text-base font-bold text-slate-400">/ {stats?.totalLessons || 0}</span>
              </p>
            )}
            <p className="text-xs text-slate-500 font-medium mt-1">
              Lectures marked finished
            </p>
          </div>
        </div>

        {/* Card 3: Attendance */}
        <div className="p-6 bg-white/75 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Attendance Fidelity
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50/80 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shadow-2xs group-hover:scale-105 transition">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl sm:text-4xl font-black text-navy-900 tracking-tight flex items-baseline">
                <AnimatedCounter value={stats?.attendanceRate ?? 100} />
                <span className="text-xl font-bold text-emerald-600 ml-0.5">%</span>
              </p>
            )}
            <p className="text-xs text-slate-500 font-medium mt-1">
              {stats?.presentCount || 0} of {stats?.totalClasses || 0} class sessions
            </p>
          </div>
        </div>

        {/* Card 4: Assignments */}
        <div className="p-6 bg-white/75 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Task Submissions
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50/80 text-amber-600 flex items-center justify-center border border-amber-100/80 shadow-2xs group-hover:scale-105 transition">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-3xl sm:text-4xl font-black text-navy-900 tracking-tight flex items-baseline gap-1">
                <AnimatedCounter value={stats?.assignments?.completed || 0} />
                <span className="text-base font-bold text-slate-400">/ {stats?.assignments?.total || 0}</span>
              </p>
            )}
            <p className="text-xs text-slate-500 font-medium mt-1">
              {stats?.assignments?.pending || 0} tasks pending review
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ROW 1 CHARTS: LEARNING PROGRESS (LINE/AREA) + ATTENDANCE DONUT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Learning Progress Area Chart (7 Cols) */}
        <div className="lg:col-span-7 p-6 bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900">Learning Progress Velocity</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Cumulative lecture completions and student learning pace
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-primary-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
              {stats?.completedLessons || 0} Finished
            </span>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="h-56 w-full rounded-2xl" />
            </div>
          ) : learningProgressTimeline.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400 font-medium">
              <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
              <span>Your progress chart will appear as you complete lessons.</span>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={learningProgressTimeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="studentProgressVelocityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                      <stop offset="50%" stopColor="#7C3AED" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200 text-xs">
                            <p className="font-bold text-navy-900">{label}</p>
                            <p className="text-primary-600 font-bold mt-1">
                              Completed: {payload[0].value} lessons
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#2563EB"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#studentProgressVelocityGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Attendance Donut / Pie Chart (5 Cols) */}
        <div className="lg:col-span-5 p-6 bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900">Attendance Overview</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Monday & Tuesday live session records (4:00 PM – 6:00 PM)
                </p>
              </div>
            </div>
          </div>

          <div className="relative h-48 flex items-center justify-center my-2">
            {isLoading ? (
              <Skeleton className="h-44 w-44 rounded-full" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceOverview?.pieData || [{ name: 'Present', value: 1, color: '#2563EB' }]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      strokeWidth={3}
                      stroke="#fff"
                    >
                      {(attendanceOverview?.pieData || []).map((entry: any, index: number) => (
                        <Cell key={`cell-att-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center score */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-navy-900">
                    {attendanceOverview?.rate ?? 100}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Fidelity
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-around text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary-600" />
              <span className="text-slate-600 font-medium">
                Present ({attendanceOverview?.presentCount || 0})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="text-slate-600 font-medium">
                Absent ({attendanceOverview?.absentCount || 0})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ROW 2 CHARTS: ASSIGNMENT BAR CHART + CURRICULUM MASTERY GRAPH */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Assignment Performance & Task Status (5 Cols) */}
        <div className="lg:col-span-5 p-6 bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900">Assignment Breakdown</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Submission & review status across tasks
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/assignments')}
              className="text-xs font-bold text-primary-600 hover:text-primary-700"
            >
              Assignments &rarr;
            </button>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assignmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200 text-xs font-bold">
                          <p className="text-navy-900">{label}</p>
                          <p className="text-primary-600 mt-1">{payload[0].value} assignments</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Evaluated by your instructor</span>
            <span className="font-bold text-emerald-600">
              {stats?.assignments?.completed || 0} of {stats?.assignments?.total || 0} completed
            </span>
          </div>
        </div>

        {/* Course Curriculum Mastery Hub (7 Cols) */}
        <div className="lg:col-span-7 p-6 bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm space-y-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-100 to-blue-50 text-secondary-600 flex items-center justify-center border border-purple-200/50 shadow-2xs">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-navy-900 tracking-tight">Curriculum Mastery & Track Progress</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Live skill breakdown and completion status across active modules
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/courses')}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline transition"
            >
              All Courses &rarr;
            </button>
          </div>

          {courseProgress.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-navy-800">No course progress recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Start watching lessons to track your progress here.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {courseProgress.map((course: any) => {
                const percent = course.progressPercentage || 0;
                const isCompleted = percent === 100;
                const isInProgress = percent > 0 && percent < 100;

                return (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/student/courses/${course.id}`)}
                    className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/40 border border-slate-200/70 hover:border-primary-300 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-primary-700 shadow-2xs shrink-0 group-hover:border-primary-400 group-hover:scale-105 transition">
                          {course.slug?.toUpperCase().slice(0, 3) || 'DEV'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-navy-900 group-hover:text-primary-600 transition truncate">
                            {course.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                            <span className="capitalize text-slate-500 font-bold">{course.level || 'Beginner'}</span>
                            <span>•</span>
                            <span>{course.completedVideosCount || 0} of {course.videosCount || 0} lessons</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200/60 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3" />
                            100%
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary-700 bg-blue-100/70 px-2 py-0.5 rounded-md border border-blue-200/60 shadow-2xs">
                            <AnimatedCounter value={percent} />%
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded-md">
                            0%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Gradient Progress Bar */}
                    <div className="relative w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Continuous tracking from video lessons</span>
            <span className="font-bold text-primary-600">{courseProgress.length} Enrolled Courses</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
