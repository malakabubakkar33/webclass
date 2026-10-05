import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Avatar } from '../../components/ui/Avatar.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import {
  CalendarCheck,
  Check,
  X,
  Users,
  Save,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  AlertTriangle,
  Radio,
  Send,
  Sparkles,
  RefreshCw,
  Search,
  Hand,
  ShieldCheck,
  ShieldAlert,
  UserX,
  AlertOctagon,
  ChevronDown,
  Lock,
  Unlock,
  CheckCheck,
  Flame,
  FileWarning,
  ExternalLink,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TeacherAttendancePage: React.FC = () => {
  const { success, error, info } = useToast();

  // Helper to get closest Monday or Tuesday date
  const getInitialClassDate = () => {
    const today = new Date();
    const day = today.getDay(); // 0 Sun, 1 Mon, 2 Tue, 3 Wed, 4 Thu, 5 Fri, 6 Sat
    const target = new Date(today);
    if (day === 1 || day === 2) {
      // today is Monday or Tuesday
    } else if (day === 0) {
      target.setDate(today.getDate() + 1); // Next Monday
    } else {
      // Wed, Thu, Fri, Sat -> Next Monday
      target.setDate(today.getDate() + (8 - day));
    }
    return target.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState<string>(getInitialClassDate());
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  const [isValidClassDay, setIsValidClassDay] = useState(true);

  // Roster & Attendance state
  const [studentsRoster, setStudentsRoster] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'leave'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Live Attendance Session state
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [approvingStudentId, setApprovingStudentId] = useState<string | null>(null);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [remainingSessionSeconds, setRemainingSessionSeconds] = useState(0);

  // Navigation Filter Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'present' | 'absent' | 'leave' | 'atRisk' | 'dropped'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drop / Expulsion Modal State
  const [studentToDrop, setStudentToDrop] = useState<any | null>(null);
  const [dropReason, setDropReason] = useState('');
  const [isDropping, setIsDropping] = useState(false);

  // Warning Dispatch State
  const [sendingWarningId, setSendingWarningId] = useState<string | null>(null);

  // Class Time Enforcement (Mon & Tue, 4:00 PM – 6:00 PM PKT)
  const [currentTime, setCurrentTime] = useState(new Date());
  const [overrideClassWindow, setOverrideClassWindow] = useState(false);

  // Keep clock updated every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Determine if right now is within the official class window: Monday or Tuesday, 16:00 to 18:00
  const isClassWindowActive = useMemo(() => {
    if (overrideClassWindow) return true;
    const day = currentTime.getDay(); // 1 = Monday, 2 = Tuesday
    const hours = currentTime.getHours();
    const isMonOrTue = day === 1 || day === 2;
    const isBetween4And6 = hours >= 16 && hours < 18;
    return isMonOrTue && isBetween4And6;
  }, [currentTime, overrideClassWindow]);

  // Formatted countdown or status to next class session
  const classWindowMessage = useMemo(() => {
    if (isClassWindowActive) {
      return '🟢 Official Class Session is Active (4:00 PM – 6:00 PM)';
    }
    const day = currentTime.getDay();
    const hours = currentTime.getHours();
    if (day === 1 || day === 2) {
      if (hours < 16) {
        return `Today's class session begins at 4:00 PM PKT (${16 - hours}h remaining)`;
      } else {
        return 'Today’s session concluded at 6:00 PM PKT';
      }
    }
    const daysUntilNext = day === 0 ? 1 : (8 - day);
    return `Next official session starts Monday at 4:00 PM PKT (in ${daysUntilNext} day${daysUntilNext > 1 ? 's' : ''})`;
  }, [currentTime, isClassWindowActive]);

  // Check if selected date is a valid Monday or Tuesday
  useEffect(() => {
    if (!selectedDate) return;
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const dayNum = d.getDay();
      if (dayNum === 1) {
        setSelectedDay('monday');
        setIsValidClassDay(true);
      } else if (dayNum === 2) {
        setSelectedDay('tuesday');
        setIsValidClassDay(true);
      } else {
        const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        setSelectedDay(names[dayNum]?.toLowerCase() || 'other');
        setIsValidClassDay(false);
      }
    }
  }, [selectedDate]);

  // Load roster and attendance for selected date
  const loadDateAttendance = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const res = await api.getAttendanceByDate(dateStr);
      if (res.data?.success) {
        const data = res.data.data;
        setStudentsRoster(data.students || []);

        const initialMap: Record<string, 'present' | 'absent' | 'leave'> = {};
        (data.students || []).forEach((s: any) => {
          initialMap[s.studentId] = s.status || 'present';
        });
        setAttendanceMap(initialMap);
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to load class attendance');
    } finally {
      setIsLoading(false);
    }
  };

  // Load active session
  const loadActiveSession = async () => {
    try {
      const res = await api.getActiveAttendanceSession();
      if (res.data?.success && res.data.data?.session) {
        const sessionData = res.data.data.session;
        setActiveSession(sessionData);
        setRemainingSessionSeconds(res.data.data.remainingSeconds || 0);

        // Pre-mark any approved students from the session without unnecessary re-renders
        if (sessionData.responses) {
          setAttendanceMap((prev) => {
            let hasChanged = false;
            const next = { ...prev };
            sessionData.responses.forEach((r: any) => {
              if (r.status === 'approved' && next[r.student_id] !== 'present') {
                next[r.student_id] = 'present';
                hasChanged = true;
              }
            });
            return hasChanged ? next : prev;
          });
        }
      } else {
        setActiveSession(null);
        setRemainingSessionSeconds(0);
      }
    } catch (e) {
      setActiveSession(null);
    }
  };

  useEffect(() => {
    if (isValidClassDay) {
      loadDateAttendance(selectedDate);
    }
    loadActiveSession();

    // Auto-poll active session every 4 seconds when tab is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadActiveSession();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedDate, isValidClassDay]);

  // Session timer countdown in browser
  useEffect(() => {
    if (remainingSessionSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSessionSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSessionSeconds]);

  // Quick preset dates generator (Recent Monday and Tuesdays)
  const quickClassDates = useMemo(() => {
    const list: { label: string; date: string; isCurrent: boolean }[] = [];
    const base = new Date();
    // Search last 3 weeks for Monday & Tuesday
    for (let i = -7; i <= 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const day = d.getDay();
      if (day === 1 || day === 2) {
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = day === 1 ? 'Mon' : 'Tue';
        const formatted = `${dayLabel} (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
        list.push({
          label: formatted,
          date: dateStr,
          isCurrent: dateStr === selectedDate,
        });
      }
    }
    // Return unique & sorted near current
    return list.slice(0, 5);
  }, [selectedDate]);

  // Set student status manually
  const handleSetStudentStatus = (studentId: string, status: 'present' | 'absent' | 'leave') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Bulk mark all
  const handleMarkAll = (status: 'present' | 'absent' | 'leave') => {
    const updated: Record<string, 'present' | 'absent' | 'leave'> = {};
    studentsRoster.forEach((s) => {
      // Don't mark dropped students
      if (!s.isDropped) {
        updated[s.studentId] = status;
      }
    });
    setAttendanceMap((prev) => ({ ...prev, ...updated }));
    success(`All active students set to ${status.toUpperCase()}`);
  };

  // Save official attendance
  const handleSaveAttendance = async () => {
    if (!isValidClassDay) {
      error('Attendance can only be recorded on official Mondays and Tuesdays.');
      return;
    }

    setIsSaving(true);
    try {
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await api.saveAttendance({
        date: selectedDate,
        records,
      });

      success(`Official attendance recorded for ${selectedDay.toUpperCase()}, ${selectedDate}! Students notified.`, 'Attendance Saved 🎉');
      loadDateAttendance(selectedDate);
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  // Broadcast Attendance Request (Single Top-Right Button)
  const handleBroadcastRequest = async () => {
    setIsStartingSession(true);
    try {
      const msg = `Official attendance request for ${selectedDay.toUpperCase()} (${selectedDate}) (4:00 PM - 6:00 PM). Please click Accept.`;
      const res = await api.startAttendanceSession({
        date: selectedDate,
        message: msg,
      });
      if (res.data?.success) {
        success('Live attendance request broadcasted! Enrolled students notified with instant check-in prompt.', 'Beacon Active 📡');
        loadActiveSession();
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to broadcast attendance request');
    } finally {
      setIsStartingSession(false);
    }
  };

  // 1-Click "Mark All Accepted Students as Present"
  const handleMarkAllAccepted = async () => {
    if (!activeSession) return;
    setIsApprovingAll(true);
    try {
      const res = await api.approveAllAcceptedAttendance(activeSession.id);
      if (res.data?.success) {
        const next = { ...attendanceMap };
        (activeSession.responses || []).forEach((r: any) => {
          next[r.student_id] = 'present';
        });
        setAttendanceMap(next);

        success(`Marked ${res.data.data?.approvedCount || 0} accepted students as Present! 🎉`, 'Batch Verified');
        loadActiveSession();
        loadDateAttendance(selectedDate);
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to mark accepted students');
    } finally {
      setIsApprovingAll(false);
    }
  };

  // 1-Click Individual Student Verification
  const handleApproveIndividualStudent = async (studentId: string) => {
    if (!activeSession) return;
    setApprovingStudentId(studentId);
    try {
      const res = await api.approveStudentAttendance({
        sessionId: activeSession.id,
        studentId,
      });
      if (res.data?.success) {
        setAttendanceMap((prev) => ({
          ...prev,
          [studentId]: 'present',
        }));
        success('Student verified as Present!', 'Marked Present ✅');
        loadActiveSession();
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to verify student');
    } finally {
      setApprovingStudentId(null);
    }
  };

  // Close live broadcast session
  const handleCloseSession = async () => {
    if (!activeSession) return;
    setIsClosingSession(true);
    try {
      const res = await api.closeAttendanceSession(activeSession.id);
      if (res.data?.success) {
        success('Attendance broadcast closed.', 'Session Ended');
        setActiveSession(null);
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to close session');
    } finally {
      setIsClosingSession(false);
    }
  };

  // Dispatch Institutional Warning Notice (< 70%)
  const handleSendWarning = async (student: any) => {
    setSendingWarningId(student.studentId);
    try {
      const res = await api.sendAttendanceWarning(student.studentId, student.cumulativePercentage);
      if (res.data?.success) {
        success(`Critical attendance warning dispatched to ${student.fullName}!`, 'Warning Sent ⚠️');
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to send warning notice');
    } finally {
      setSendingWarningId(null);
    }
  };

  // Drop / Expel Student from Class (< 65%)
  const handleConfirmDropStudent = async () => {
    if (!studentToDrop) return;
    setIsDropping(true);
    try {
      const res = await api.dropStudent(studentToDrop.studentId, dropReason);
      if (res.data?.success) {
        success(`${studentToDrop.fullName} has been dropped and expelled from class.`, 'Student Expelled 🚫');
        setStudentToDrop(null);
        setDropReason('');
        loadDateAttendance(selectedDate);
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to drop student');
    } finally {
      setIsDropping(false);
    }
  };

  // Compute stats and categorization
  const rosterStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let atRisk = 0; // cumulative < 65% and not dropped
    let dropped = 0;
    let greenCount = 0; // 80-100%
    let yellowCount = 0; // 70-79%
    let redCount = 0; // < 70%

    studentsRoster.forEach((s) => {
      if (s.isDropped) {
        dropped++;
      } else {
        const status = attendanceMap[s.studentId] || s.status || 'present';
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'leave') leave++;

        const pct = s.cumulativePercentage ?? 100;
        if (pct >= 80) greenCount++;
        else if (pct >= 70) yellowCount++;
        else redCount++;

        if (pct < 65) atRisk++;
      }
    });

    return {
      total: studentsRoster.length,
      activeCount: studentsRoster.length - dropped,
      present,
      absent,
      leave,
      atRisk,
      dropped,
      greenCount,
      yellowCount,
      redCount,
    };
  }, [studentsRoster, attendanceMap]);

  // Filter students by active tab and search query
  const filteredStudents = useMemo(() => {
    return studentsRoster.filter((s) => {
      // Query search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = s.fullName?.toLowerCase().includes(q);
        const rollMatch = s.rollNumber?.toLowerCase().includes(q);
        const userMatch = s.username?.toLowerCase().includes(q);
        if (!nameMatch && !rollMatch && !userMatch) return false;
      }

      // Tab match
      if (activeTab === 'all') return true;
      if (activeTab === 'dropped') return !!s.isDropped;

      // If student is dropped, hide them from standard marking tabs
      if (s.isDropped) return false;

      const currentStatus = attendanceMap[s.studentId] || s.status || 'present';
      if (activeTab === 'present') return currentStatus === 'present';
      if (activeTab === 'absent') return currentStatus === 'absent';
      if (activeTab === 'leave') return currentStatus === 'leave';
      if (activeTab === 'atRisk') return (s.cumulativePercentage ?? 100) < 65;

      return true;
    });
  }, [studentsRoster, activeTab, searchQuery, attendanceMap]);

  // Quick lookup of active session responses for real-time check-in badge
  const sessionAcceptedMap = useMemo(() => {
    const map = new Map<string, { status: string; acceptedAt?: string }>();
    if (activeSession && Array.isArray(activeSession.responses)) {
      activeSession.responses.forEach((r: any) => {
        map.set(r.student_id, {
          status: r.status,
          acceptedAt: r.submitted_at,
        });
      });
    }
    return map;
  }, [activeSession]);

  // Formatting helper for seconds to mm:ss
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Teacher Attendance Control Deck
            </h1>
            <Badge variant="primary" size="md" className="font-semibold">
              Mon & Tue • 4:00 PM – 6:00 PM
            </Badge>
            {activeSession && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Live Broadcast Active ({formatSeconds(remainingSessionSeconds)})
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>Official Attendance Record for Saylani Mass IT Training (SMIT) Web Cohort.</span>
            <span className="text-slate-400 font-medium">•</span>
            <span className={isClassWindowActive ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-medium'}>
              {classWindowMessage}
            </span>
          </p>
        </div>

        {/* Top-Right: Prominent Broadcast Button */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {/* Subtle Dev / Testing override toggle */}
          <button
            type="button"
            onClick={() => setOverrideClassWindow(!overrideClassWindow)}
            className="text-[11px] text-slate-400 hover:text-slate-700 underline flex items-center gap-1"
            title="Allows sending attendance broadcast outside the official 4:00 PM - 6:00 PM window for testing purposes"
          >
            {overrideClassWindow ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3" />}
            {overrideClassWindow ? 'Class Window Override: ON (Testing)' : 'Test Mode Override'}
          </button>

          <Button
            size="md"
            variant={activeSession ? 'secondary' : isClassWindowActive ? 'primary' : 'outline'}
            onClick={handleBroadcastRequest}
            isLoading={isStartingSession}
            disabled={!isClassWindowActive && !overrideClassWindow}
            className={`shadow-md font-semibold transition-all ${
              isClassWindowActive
                ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/25 ring-2 ring-primary-500/20'
                : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed'
            }`}
            leftIcon={<Radio className={`w-4 h-4 ${isClassWindowActive ? 'animate-pulse text-white' : 'text-slate-400'}`} />}
          >
            {activeSession ? 'Re-broadcast Request' : 'Broadcast Attendance Request'}
          </Button>
        </div>
      </div>

      {/* 2. Calendar Selector & Quick Class Date Chips */}
      <Card className="p-4 bg-slate-50/70 border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Date Picker Input */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <Calendar className="w-4 h-4 text-primary-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm font-semibold text-slate-800 bg-transparent focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {isValidClassDay ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedDay.toUpperCase()} Session (Valid)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-100/70 text-rose-800 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Non-Class Day ({selectedDay.toUpperCase()})
                </span>
              )}
            </div>
          </div>

          {/* Quick Date Chips (Monday & Tuesday Only) */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Cohort Sessions:</span>
            {quickClassDates.map((item) => (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedDate(item.date)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  item.date === selectedDate
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 3. Live Beacon Active Banner (when an attendance broadcast is active) */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-2 border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Live Check-in Broadcast Running
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ⏱️ {formatSeconds(remainingSessionSeconds)} left
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  <span className="font-semibold text-emerald-700">
                    {activeSession.responses?.length || 0} students
                  </span>{' '}
                  have accepted the request. Click below to verify all accepted students as Present instantly.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleMarkAllAccepted}
                isLoading={isApprovingAll}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 font-bold"
                leftIcon={<CheckCheck className="w-4 h-4" />}
              >
                Mark All Accepted as Present ({activeSession.responses?.length || 0})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseSession}
                isLoading={isClosingSession}
                className="text-slate-600 hover:bg-slate-100 border-slate-300"
              >
                End Call
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Navigation Tab Bar (Present, Absent, Late/Leave, At-Risk <65%, Dropped) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            All Students
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/50 text-current">
              {rosterStats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('present')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'present'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Present
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
              {rosterStats.present}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('absent')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'absent'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white hover:bg-rose-50 text-rose-700 border border-slate-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Absent
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800">
              {rosterStats.absent}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leave')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'leave'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white hover:bg-amber-50 text-amber-700 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Leave / Late
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800">
              {rosterStats.leave}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('atRisk')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'atRisk'
                ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-500/30'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            At-Risk (&lt; 65%)
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-200 text-rose-900 font-extrabold">
              {rosterStats.atRisk}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dropped')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dropped'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <UserX className="w-3.5 h-3.5 text-slate-500" />
            Expelled / Dropped
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {rosterStats.dropped}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* 5. Main Unified Student Roster Table */}
      <Card className="overflow-hidden border border-slate-200/80 shadow-sm">
        {/* Table Top Action Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Batch Quick Controls:
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMarkAll('present')}
              className="text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs font-semibold py-1 h-auto"
            >
              All Present
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMarkAll('absent')}
              className="text-rose-700 hover:bg-rose-50 border-rose-200 text-xs font-semibold py-1 h-auto"
            >
              All Absent
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMarkAll('leave')}
              className="text-amber-700 hover:bg-amber-50 border-amber-200 text-xs font-semibold py-1 h-auto"
            >
              All Leave
            </Button>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAttendance}
              isLoading={isSaving}
              className="bg-primary-600 hover:bg-primary-700 font-bold shadow-md shadow-primary-500/20"
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Attendance Record
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Student Profile</th>
                <th className="py-3 px-4">Live Check-in Status</th>
                <th className="py-3 px-4">Overall Standing</th>
                <th className="py-3 px-4 text-center">Session Marking</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="h-10 bg-slate-100 rounded-lg w-48" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-6 bg-slate-100 rounded w-24" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-6 bg-slate-100 rounded w-20" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-8 bg-slate-100 rounded w-36 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-8 bg-slate-100 rounded w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No students match this tab or filter.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try choosing another tab or clearing search.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const currentStatus = attendanceMap[student.studentId] || student.status || 'present';
                  const liveCheckin = sessionAcceptedMap.get(student.studentId);
                  const cumulativePct = student.cumulativePercentage ?? 100;
                  const isDropped = student.isDropped;

                  // Overall standing colors: Green (80-100), Yellow (70-79), Red (<70)
                  const standingBadge =
                    cumulativePct >= 80 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {cumulativePct}% • Good
                      </span>
                    ) : cumulativePct >= 70 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {cumulativePct}% • Warning
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {cumulativePct}% • Critical Deficit
                      </span>
                    );

                  return (
                    <tr
                      key={student.studentId}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isDropped ? 'bg-slate-50/90 opacity-60' : ''
                      }`}
                    >
                      {/* Profile */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={student.fullName}
                            src={student.avatarUrl}
                            size="md"
                            className="border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{student.fullName}</span>
                              {isDropped && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                                  Expelled
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                              <span className="text-primary-700 font-semibold">{student.rollNumber}</span>
                              <span>•</span>
                              <span>@{student.username}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Live Check-in Status */}
                      <td className="py-3 px-4">
                        {isDropped ? (
                          <span className="text-xs text-slate-400 italic">Account Inactive</span>
                        ) : liveCheckin ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Hand className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                              Check-in Accepted
                            </span>
                            {currentStatus !== 'present' && (
                              <button
                                type="button"
                                onClick={() => handleApproveIndividualStudent(student.studentId)}
                                disabled={approvingStudentId === student.studentId}
                                className="text-[11px] px-2 py-0.5 rounded font-bold bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-sm"
                              >
                                {approvingStudentId === student.studentId ? 'Stamping...' : 'Stamp Present'}
                              </button>
                            )}
                          </div>
                        ) : activeSession ? (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            Awaiting response...
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Overall Standing */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {standingBadge}
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                cumulativePct >= 80
                                  ? 'bg-emerald-500'
                                  : cumulativePct >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, cumulativePct))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Marking Controls */}
                      <td className="py-3 px-4">
                        {isDropped ? (
                          <span className="text-xs text-rose-500 font-semibold block text-center">
                            Expelled / Dropped
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-xl w-fit mx-auto border border-slate-200/80">
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.studentId, 'present')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:bg-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.studentId, 'absent')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                currentStatus === 'absent'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:bg-white'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.studentId, 'leave')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                currentStatus === 'leave'
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:bg-white'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Leave
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Actions (<65% Drop, <70% Warning) */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If student is below 70%, 1-click warning notice */}
                          {!isDropped && cumulativePct < 70 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendWarning(student)}
                              isLoading={sendingWarningId === student.studentId}
                              className="text-amber-700 hover:bg-amber-50 border-amber-300 text-xs font-semibold py-1 px-2.5 h-auto"
                              leftIcon={<AlertTriangle className="w-3 h-3 text-amber-600" />}
                              title="Dispatches an official attendance warning to this student's portal"
                            >
                              Warning
                            </Button>
                          )}

                          {/* If student is below 65%, allow dropping from class */}
                          {!isDropped && cumulativePct < 65 ? (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setStudentToDrop(student);
                                setDropReason(
                                  `Attendance rate fell to ${cumulativePct}% (below mandatory 65% benchmark). Contact instructor Sir Tatheer for appeal.`
                                );
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-1 px-2.5 h-auto shadow-sm"
                              leftIcon={<UserX className="w-3.5 h-3.5" />}
                            >
                              Drop Student
                            </Button>
                          ) : isDropped ? (
                            <span className="text-xs text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Dropped
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Compliant
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 6. Bottom Cumulative Performance Directory (Strict 80-100 Green, 70-79 Yellow, <70 Red) */}
      <Card className="p-6 bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary-600" />
                Cumulative Performance & Institutional Standing Directory
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Official institutional criteria: <span className="text-emerald-700 font-semibold">80–100% Good Standing (Green)</span> •{' '}
                <span className="text-amber-700 font-semibold">70–79% Passing Warning (Yellow)</span> •{' '}
                <span className="text-rose-700 font-semibold">&lt; 70% Critical Deficit (Red)</span> •{' '}
                <span className="text-rose-900 font-bold">&lt; 65% Expulsion Threshold</span>
              </p>
            </div>

            {/* Quick summary counters */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                🟢 {rosterStats.greenCount} Good Standing
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                🟡 {rosterStats.yellowCount} Warning
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                🔴 {rosterStats.redCount} Critical Deficit
              </span>
            </div>
          </div>
        </div>

        {/* Directory Student List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentsRoster.map((student) => {
            const pct = student.cumulativePercentage ?? 100;
            const isDropped = student.isDropped;

            const cardBorder = isDropped
              ? 'border-slate-300 bg-slate-50/70'
              : pct >= 80
              ? 'border-emerald-200 bg-emerald-50/20'
              : pct >= 70
              ? 'border-amber-200 bg-amber-50/20'
              : 'border-rose-300 bg-rose-50/30';

            const statusColor = isDropped
              ? 'text-slate-500'
              : pct >= 80
              ? 'text-emerald-700'
              : pct >= 70
              ? 'text-amber-700'
              : 'text-rose-700';

            return (
              <div
                key={student.studentId}
                className={`p-4 rounded-xl border ${cardBorder} transition-all hover:shadow-md flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={student.fullName} src={student.avatarUrl} size="sm" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{student.fullName}</h4>
                        <span className="text-[11px] font-mono text-primary-700 font-semibold">
                          {student.rollNumber}
                        </span>
                      </div>
                    </div>
                    <span className={`text-base font-extrabold ${statusColor}`}>{pct}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 80 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span>
                      Attended: <strong className="text-slate-800">{student.presentCount ?? 0}</strong> / {student.totalClasses ?? 0} classes
                    </span>
                    <span className={`font-semibold ${statusColor}`}>
                      {isDropped ? 'Expelled' : pct >= 80 ? 'Good Standing' : pct >= 70 ? 'Warning Zone' : 'Critical Deficit'}
                    </span>
                  </div>
                </div>

                {/* Direct Action */}
                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  {!isDropped && pct < 70 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendWarning(student)}
                      isLoading={sendingWarningId === student.studentId}
                      className="w-full text-xs font-bold text-amber-700 hover:bg-amber-100/70 border-amber-300 py-1"
                      leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                    >
                      Send Warning Notice
                    </Button>
                  ) : !isDropped && pct < 65 ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setStudentToDrop(student);
                        setDropReason(
                          `Attendance rate fell to ${pct}% (below mandatory 65% benchmark). Contact instructor Sir Tatheer for appeal.`
                        );
                      }}
                      className="w-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white py-1"
                      leftIcon={<UserX className="w-3.5 h-3.5" />}
                    >
                      Drop / Expel
                    </Button>
                  ) : isDropped ? (
                    <span className="text-xs text-rose-500 font-bold block text-center w-full">
                      🚫 Enrollment Terminated
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1 w-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Attendance Criterion Satisfied
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 7. Drop / Expel Confirmation Modal */}
      <AnimatePresence>
        {studentToDrop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <AlertOctagon className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Confirm Class Expulsion / Drop Student
              </h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                You are about to terminate enrollment for{' '}
                <strong className="text-slate-900">{studentToDrop.fullName}</strong> (Roll: {studentToDrop.rollNumber}).
                Their cumulative attendance is{' '}
                <strong className="text-rose-600">{studentToDrop.cumulativePercentage ?? 0}%</strong> (below the 65% cutoff).
              </p>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 my-4 text-xs text-rose-800 leading-relaxed">
                <strong>Institutional Impact:</strong> The student account will be disabled immediately. When they attempt to open their portal, they will see the dedicated expulsion screen with instructions to contact Sir Tatheer for appeal.
              </div>

              <div className="space-y-1.5 mb-5">
                <label className="text-xs font-semibold text-slate-700">Official Expulsion Reason:</label>
                <textarea
                  rows={3}
                  value={dropReason}
                  onChange={(e) => setDropReason(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="Enter expulsion reason..."
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStudentToDrop(null)}
                  disabled={isDropping}
                  className="text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmDropStudent}
                  isLoading={isDropping}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  leftIcon={<UserX className="w-4 h-4" />}
                >
                  Confirm Expulsion
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
