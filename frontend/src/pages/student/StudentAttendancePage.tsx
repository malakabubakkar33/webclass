import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter.js';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Info,
  Calendar as CalendarIcon,
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
  Coffee,
  Radio,
  Search,
  Filter,
  RotateCcw,
  Hand,
  CheckCheck,
  ChevronRight,
  UserCheck,
  BellRing,
  Timer,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export const StudentAttendancePage: React.FC = () => {
  const { success, error } = useToast();
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live Attendance Session State
  const [activeSessionInfo, setActiveSessionInfo] = useState<any>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // Collapsible state for Class Schedule Matrix
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  // Filter States for Previous Class Attendance
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'leave'>('all');
  const [dayFilter, setDayFilter] = useState<'all' | 'monday' | 'tuesday'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'this_month' | 'mondays' | 'tuesdays'>('all');
  const [teacherName, setTeacherName] = useState<string>('Instructor');

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await api.getPublicTeacher();
        if (res.data?.success && res.data.data?.fullName) {
          setTeacherName(res.data.data.fullName);
        }
      } catch (err) {
        console.error('Failed to load teacher info', err);
      }
    };
    fetchTeacher();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await api.getStudentAttendance();
      if (res.data?.success) {
        setAttendanceData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load student attendance', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveSession = async () => {
    try {
      const res = await api.getActiveAttendanceSession();
      if (res.data?.success && res.data.data?.session) {
        setActiveSessionInfo(res.data.data);
        const serverSeconds = res.data.data.remainingSeconds;
        if (typeof serverSeconds === 'number' && serverSeconds > 0) {
          setRemainingSeconds(serverSeconds);
        } else {
          setRemainingSeconds(1200);
        }
      } else {
        setActiveSessionInfo(null);
        setRemainingSeconds(0);
      }
    } catch (err) {
      setActiveSessionInfo(null);
      setRemainingSeconds(0);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchActiveSession();

    // Poll active session every 3 seconds when tab is active
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchActiveSession();
      }
    }, 3000);

    // 1-second countdown ticker for the 20-minute window
    const ticker = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(ticker);
    };
  }, []);

  const handleAcceptAttendance = async (sessionId: string) => {
    setIsAccepting(true);
    try {
      const res = await api.acceptAttendanceRequest(sessionId);
      if (res.data?.success) {
        success(`Attendance accepted! You are marked Present for today's class. 🎉`, 'Verified Present ✅');
        await fetchActiveSession();
        await fetchAttendance();
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to accept attendance request');
    } finally {
      setIsAccepting(false);
    }
  };

  // Format seconds to MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalClasses = attendanceData?.totalClasses || 0;
  const presentCount = attendanceData?.presentCount || 0;
  const absentCount = attendanceData?.absentCount || 0;
  const leaveCount = attendanceData?.leaveCount || 0;
  const percentage = attendanceData?.percentage ?? 100;
  const records = attendanceData?.records || [];

  const isLowAttendance = percentage < 70;

  // Monday & Tuesday bi-weekly schedule matrix (4:00 PM – 6:00 PM)
  const currentMonthClassDays = [
    { date: '2026-09-07', day: 'Monday', label: 'Sep 7' },
    { date: '2026-09-08', day: 'Tuesday', label: 'Sep 8' },
    { date: '2026-09-14', day: 'Monday', label: 'Sep 14' },
    { date: '2026-09-15', day: 'Tuesday', label: 'Sep 15' },
    { date: '2026-09-21', day: 'Monday', label: 'Sep 21' },
    { date: '2026-09-22', day: 'Tuesday', label: 'Sep 22' },
    { date: '2026-09-28', day: 'Monday', label: 'Sep 28' },
    { date: '2026-09-29', day: 'Tuesday', label: 'Sep 29' },
    { date: '2026-10-05', day: 'Monday', label: 'Oct 5' },
    { date: '2026-10-06', day: 'Tuesday', label: 'Oct 6' },
  ];

  const getRecordStatus = (dateStr: string) => {
    const rec = records.find((r: any) => r.date === dateStr);
    if (rec) return rec.status; // 'present' | 'absent' | 'leave'
    if (new Date(dateStr) > new Date('2026-09-29')) return 'upcoming';
    return 'pending';
  };

  // Main 3-segment Donut
  const mainPieData = [
    { name: 'Present', value: Math.max(presentCount, 1), color: '#10B981' },
    { name: 'Absent', value: absentCount, color: '#EF4444' },
    { name: 'Leave', value: leaveCount, color: '#F59E0B' },
  ].filter(segment => segment.value > 0);

  // Present Rate, Absent Rate, Leave Rate for mini graphs
  const presentPct = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;
  const absentPct = totalClasses > 0 ? Math.round((absentCount / totalClasses) * 100) : 0;
  const leavePct = totalClasses > 0 ? Math.round((leaveCount / totalClasses) * 100) : 0;

  // Filter Logic for Previous Class Attendance Records
  const filteredRecords = useMemo(() => {
    return records.filter((rec: any) => {
      if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
      if (dayFilter !== 'all' && rec.class_day?.toLowerCase() !== dayFilter) return false;

      if (quickFilter === 'this_month') {
        if (!rec.date.startsWith('2026-09') && !rec.date.startsWith('2026-10')) return false;
      } else if (quickFilter === 'mondays') {
        if (rec.class_day?.toLowerCase() !== 'monday') return false;
      } else if (quickFilter === 'tuesdays') {
        if (rec.class_day?.toLowerCase() !== 'tuesday') return false;
      }

      if (startDateFilter && rec.date < startDateFilter) return false;
      if (endDateFilter && rec.date > endDateFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesDate = rec.date.toLowerCase().includes(query);
        const matchesDay = rec.class_day?.toLowerCase().includes(query);
        const matchesStatus = rec.status?.toLowerCase().includes(query);
        if (!matchesDate && !matchesDay && !matchesStatus) return false;
      }

      return true;
    });
  }, [records, statusFilter, dayFilter, quickFilter, startDateFilter, endDateFilter, searchQuery]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setDayFilter('all');
    setSearchQuery('');
    setStartDateFilter('');
    setEndDateFilter('');
    setQuickFilter('all');
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    dayFilter !== 'all' ||
    searchQuery.trim() !== '' ||
    startDateFilter !== '' ||
    endDateFilter !== '' ||
    quickFilter !== 'all';

  if (isLoading && !attendanceData) {
    return (
      <div className="space-y-8 pb-12 animate-pulse">
        <div className="h-32 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between">
          <div className="h-5 w-44 bg-slate-200 rounded-full" />
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const liveSession = activeSessionInfo?.session;
  const myResponse = activeSessionInfo?.studentResponse;
  // Session is active ONLY if teacher opened it AND the 20-minute timer has not expired yet!
  const isSessionActive = liveSession && liveSession.status === 'active' && remainingSeconds > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-16"
    >
      {/* ========================================================================= */}
      {/* 1. CLEAN, CRISP, FULLY READABLE LIGHT-THEME HEADER                        */}
      {/* ========================================================================= */}
      <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary-700 text-xs font-bold mb-2 border border-blue-200/60 shadow-2xs">
            <CalendarCheck className="w-3.5 h-3.5 text-primary-600" />
            <span className="font-extrabold">Live Attendance Portal</span>
            <span className="text-slate-300">•</span>
            <span className="text-primary-800 font-semibold">Every Mon & Tue • 4:00 PM – 6:00 PM</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Class Attendance Tracking
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium max-w-2xl leading-relaxed">
            Classes are held every <strong className="text-primary-700">Monday</strong> & <strong className="text-secondary-700">Tuesday</strong> (4:00 PM – 6:00 PM). Maintain at least <strong className="text-navy-900">70% attendance</strong> for graduation evaluation.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3 text-xs text-slate-600 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="font-extrabold text-navy-900">4:00 PM – 6:00 PM</p>
            <p className="text-[11px] text-slate-500 font-medium">{teacherName} • Live Cohort</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SLEEK, COMPACT 20-MINUTE LIVE ATTENDANCE REQUEST MESSAGE BANNER        */}
      {/* (Automatically disappears after 20 minutes or when closed)                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSessionActive && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/80 to-purple-50 border-2 border-primary-400/80 shadow-md shadow-primary-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            {/* Left: Message details and 20 min timer */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/20">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                    Live Request
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 text-[11px] font-bold border border-primary-200">
                    <Timer className="w-3 h-3 text-primary-600" />
                    <span>Time Left: {formatTimer(remainingSeconds)}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold hidden md:inline">
                    (20 min window)
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-navy-900 mt-1 truncate">
                  {teacherName} requested class attendance ({liveSession.class_day?.toUpperCase()})
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  {liveSession.message || 'Please accept to verify your presence for today’s session.'}
                </p>
              </div>
            </div>

            {/* Right: Small, quick action button or status pill */}
            <div className="shrink-0 flex items-center gap-2">
              {!myResponse || (myResponse.status !== 'approved' && !activeSessionInfo?.isAlreadyMarkedPresentToday) ? (
                <Button
                  onClick={() => handleAcceptAttendance(liveSession.id)}
                  isLoading={isAccepting}
                  variant="primary"
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>Accept Attendance</span>
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3.5 py-1.5 rounded-xl shadow-2xs">
                  <CheckCheck className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Verified Present!</span>
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Small Attendance Warning Message - Shown ONLY when below 70% */}
      {isLowAttendance && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 shadow-2xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-rose-950 truncate">
                Attendance Deficit Alert ({percentage}%) • Minimum 70% Required
              </p>
              <p className="text-[11px] text-rose-800 font-medium">
                Your attendance has fallen below 70%. Please attend upcoming Monday & Tuesday sessions (4:00 PM – 6:00 PM) to maintain eligibility.
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-black text-rose-700 bg-white px-3 py-1 rounded-xl border border-rose-200 shadow-2xs">
            {percentage}% (Req: 70%)
          </span>
        </motion.div>
      )}

      {/* Main Stats Row: Average Card (5 Cols) + 3 Small Graph Cards for Present, Absent, Leave (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Card
          className={`lg:col-span-5 p-6 rounded-3xl shadow-sm transition-all flex flex-col justify-between ${
            isLowAttendance
              ? 'bg-rose-50/60 border-2 border-rose-300 ring-4 ring-rose-100/60'
              : 'bg-white/80 backdrop-blur-xl border border-white/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-navy-900 tracking-tight">Cumulative Attendance Rate</h3>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isLowAttendance ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isLowAttendance ? 'Deficit Warning' : 'Good Standing'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live ratio calculated across all Monday & Tuesday sessions (4:00 PM – 6:00 PM)
            </p>
          </div>

          <div className="relative h-48 flex items-center justify-center my-3">
            {isLoading ? (
              <Skeleton className="h-44 w-44 rounded-full" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mainPieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={76}
                      strokeWidth={3}
                      stroke="#fff"
                    >
                      {mainPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span
                    className={`text-3xl sm:text-4xl font-black ${
                      isLowAttendance ? 'text-rose-600' : 'text-navy-900'
                    }`}
                  >
                    <AnimatedCounter value={percentage} />%
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                      isLowAttendance ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  >
                    {isLowAttendance ? 'Below 70% Alert' : 'Attendance Avg'}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-50/80">
              <span className="block text-emerald-700 font-extrabold text-sm">{presentCount}</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Present</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50/80">
              <span className="block text-rose-700 font-extrabold text-sm">{absentCount}</span>
              <span className="text-[10px] font-bold text-rose-600 uppercase">Absent</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/80">
              <span className="block text-amber-700 font-extrabold text-sm">{leaveCount}</span>
              <span className="text-[10px] font-bold text-amber-600 uppercase">Leave</span>
            </div>
          </div>
        </Card>

        {/* 3 Small Graph Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {/* Small Graph 1: PRESENT */}
          <Card className="p-5 bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Present</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3 flex items-center justify-center relative h-24">
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie
                    data={[
                      { value: presentCount || 0.1, fill: '#10B981' },
                      { value: Math.max(0, totalClasses - presentCount), fill: '#E2E8F0' },
                    ]}
                    dataKey="value"
                    innerRadius={28}
                    outerRadius={40}
                    strokeWidth={2}
                    stroke="#fff"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#E2E8F0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-emerald-700">{presentPct}%</span>
              </div>
            </div>

            <div>
              <p className="text-2xl font-black text-navy-900 tracking-tight">
                <AnimatedCounter value={presentCount} /> <span className="text-xs font-medium text-slate-400">/ {totalClasses}</span>
              </p>
              <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Sessions attended</p>
            </div>
          </Card>

          {/* Small Graph 2: ABSENT */}
          <Card className="p-5 bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Absent</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
                <XCircle className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3 flex items-center justify-center relative h-24">
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie
                    data={[
                      { value: absentCount || 0.1, fill: '#EF4444' },
                      { value: Math.max(0, totalClasses - absentCount), fill: '#E2E8F0' },
                    ]}
                    dataKey="value"
                    innerRadius={28}
                    outerRadius={40}
                    strokeWidth={2}
                    stroke="#fff"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#EF4444" />
                    <Cell fill="#E2E8F0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-rose-600">{absentPct}%</span>
              </div>
            </div>

            <div>
              <p className="text-2xl font-black text-navy-900 tracking-tight">
                <AnimatedCounter value={absentCount} /> <span className="text-xs font-medium text-slate-400">sessions</span>
              </p>
              <p className="text-[11px] text-rose-600 font-bold mt-0.5">Unexcused missed</p>
            </div>
          </Card>

          {/* Small Graph 3: LEAVE */}
          <Card className="p-5 bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Leave</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-2xs">
                <Coffee className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3 flex items-center justify-center relative h-24">
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie
                    data={[
                      { value: leaveCount || 0.1, fill: '#F59E0B' },
                      { value: Math.max(0, totalClasses - leaveCount), fill: '#E2E8F0' },
                    ]}
                    dataKey="value"
                    innerRadius={28}
                    outerRadius={40}
                    strokeWidth={2}
                    stroke="#fff"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#F59E0B" />
                    <Cell fill="#E2E8F0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-amber-600">{leavePct}%</span>
              </div>
            </div>

            <div>
              <p className="text-2xl font-black text-navy-900 tracking-tight">
                <AnimatedCounter value={leaveCount} /> <span className="text-xs font-medium text-slate-400">leaves</span>
              </p>
              <p className="text-[11px] text-amber-600 font-bold mt-0.5">Authorized permits</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Monday & Tuesday Schedule Timeline Matrix (Collapsible Dropdown) */}
      <Card className="p-6 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-sm space-y-4">
        <button
          type="button"
          onClick={() => setIsMatrixOpen(!isMatrixOpen)}
          className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
              isMatrixOpen ? 'bg-secondary-100 text-secondary-700' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
            }`}>
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-navy-900 tracking-tight group-hover:text-primary-700 transition-colors">
                Class Schedule Matrix (Monday & Tuesday Cohort • 4:00 PM – 6:00 PM)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Live verification record for every scheduled class session.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl group-hover:bg-slate-200 transition">
              {isMatrixOpen ? 'Close Matrix ▲' : 'Open Schedule Matrix ▼'}
            </span>
            <div className={`w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-transform duration-300 ${
              isMatrixOpen ? 'rotate-180 bg-primary-100 text-primary-700' : ''
            }`}>
              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        <AnimatePresence>
          {isMatrixOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden space-y-5 pt-4 border-t border-slate-100"
            >
              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
                <span className="text-slate-500 font-medium">Session Status Key:</span>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Leave
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Upcoming
                  </span>
                </div>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-1">
                {currentMonthClassDays.map((item) => {
                  const status = getRecordStatus(item.date);

                  const statusColors = {
                    present: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950',
                    absent: 'bg-rose-50/80 border-rose-200/80 text-rose-950',
                    leave: 'bg-amber-50/80 border-amber-200/80 text-amber-950',
                    upcoming: 'bg-slate-50 border-slate-200 text-slate-400',
                    pending: 'bg-blue-50/50 border-blue-200 text-primary-800',
                  };

                  return (
                    <div
                      key={item.date}
                      className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-between min-h-[115px] shadow-2xs ${
                        statusColors[status as keyof typeof statusColors]
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                        {item.day}
                      </div>
                      <div className="text-base font-extrabold my-1">{item.label}</div>
                      <div>
                        {status === 'present' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Present
                          </span>
                        )}
                        {status === 'absent' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-full shadow-2xs">
                            <XCircle className="w-3 h-3 text-rose-500" /> Absent
                          </span>
                        )}
                        {status === 'leave' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded-full shadow-2xs">
                            <Coffee className="w-3 h-3 text-amber-500" /> Leave
                          </span>
                        )}
                        {status === 'upcoming' && (
                          <span className="text-[11px] font-semibold text-slate-400">
                            Upcoming
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="text-[11px] font-semibold text-primary-600">
                            Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ========================================================================= */}
      {/* 3. PREVIOUS CLASS ATTENDANCE HISTORY WITH ADVANCED FLOATING FILTER DOCK    */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-navy-900 tracking-tight flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary-600" />
              Previous Class Attendance History
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Filter and search across all past Monday and Tuesday sessions (4:00 PM – 6:00 PM).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-full font-bold text-slate-700 shadow-2xs">
              Showing {filteredRecords.length} of {records.length} Recorded Sessions
            </span>
          </div>
        </div>

        {/* Filter Toolbar Card */}
        <Card className="p-5 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search date (e.g. 2026-09)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition cursor-pointer"
              >
                <option value="all">All Statuses (Present/Absent/Leave)</option>
                <option value="present">Present Only</option>
                <option value="absent">Absent Only</option>
                <option value="leave">Leave Only</option>
              </select>
            </div>

            {/* Day Filter */}
            <div className="flex items-center gap-2">
              <select
                value={dayFilter}
                onChange={(e: any) => setDayFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition cursor-pointer"
              >
                <option value="all">All Class Days (Monday & Tuesday)</option>
                <option value="monday">Monday Sessions Only</option>
                <option value="tuesday">Tuesday Sessions Only</option>
              </select>
            </div>

            {/* Date Range: Start to End */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                title="From Date"
                className="w-1/2 px-2.5 py-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-[11px] font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition cursor-pointer"
              />
              <span className="text-xs text-slate-400 font-bold">-</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                title="To Date"
                className="w-1/2 px-2.5 py-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-[11px] font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Filter Chips & Reset */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Quick Filters:
              </span>
              <button
                type="button"
                onClick={() => {
                  setQuickFilter('all');
                  setDayFilter('all');
                  setStatusFilter('all');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                  quickFilter === 'all' && dayFilter === 'all' && statusFilter === 'all'
                    ? 'bg-navy-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All History
              </button>
              <button
                type="button"
                onClick={() => {
                  setDayFilter('monday');
                  setQuickFilter('mondays');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                  dayFilter === 'monday'
                    ? 'bg-primary-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Mondays
              </button>
              <button
                type="button"
                onClick={() => {
                  setDayFilter('tuesday');
                  setQuickFilter('tuesdays');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                  dayFilter === 'tuesday'
                    ? 'bg-secondary-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tuesdays
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                  statusFilter === 'present'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
              >
                Present ({presentCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition ${
                  statusFilter === 'absent'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                }`}
              >
                Absent ({absentCount})
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-xl transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        </Card>

        {/* Filtered Attendance History Table */}
        {isLoading ? (
          <Skeleton className="h-48 rounded-3xl" />
        ) : filteredRecords.length === 0 ? (
          <Card className="p-10 text-center bg-white/80 rounded-3xl border border-slate-200/80 text-slate-400 space-y-3">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-navy-900">No attendance records match your filter criteria.</p>
            <p className="text-xs text-slate-500">Try adjusting your date range, status, or search keywords.</p>
            {hasActiveFilters && (
              <Button onClick={handleResetFilters} variant="outline" size="sm" className="mt-2">
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-navy-800 uppercase font-black text-[10px] tracking-wider">
                    <th className="py-4 px-6">Class Date</th>
                    <th className="py-4 px-6">Cohort Day</th>
                    <th className="py-4 px-6">Class Timing</th>
                    <th className="py-4 px-6">Attendance Status</th>
                    <th className="py-4 px-6">Teacher Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-navy-700">
                  {filteredRecords.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6 font-black text-navy-900">
                        {r.date}
                      </td>
                      <td className="py-4 px-6 capitalize font-semibold text-slate-600">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                          r.class_day?.toLowerCase() === 'monday'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                            : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                        }`}>
                          {r.class_day}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-semibold">
                        4:00 PM – 6:00 PM
                      </td>
                      <td className="py-4 px-6">
                        {r.status === 'present' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                            <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" /> Present
                          </span>
                        ) : r.status === 'leave' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-2xs">
                            <Coffee className="w-3.5 h-3.5 stroke-[2.5] text-amber-600" /> Approved Leave
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 shadow-2xs">
                            <X className="w-3.5 h-3.5 stroke-[3] text-rose-600" /> Absent
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0" />
                        <span className="font-semibold text-slate-600">{teacherName} (Live Classroom)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
