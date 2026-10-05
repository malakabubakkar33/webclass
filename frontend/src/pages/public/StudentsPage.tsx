import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  Search,
  Sparkles,
  ShieldCheck,
  Calendar,
  RefreshCw,
  UserCheck,
  Award,
  BookOpen,
  CheckCircle2,
  X
} from 'lucide-react';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { api } from '../../services/api.js';
import { getMediaUrl } from '../../utils/media.js';

interface TeacherData {
  fullName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  role: string;
}

interface StudentItem {
  id: string;
  fullName: string;
  username?: string;
  rollNumber: string;
  avatarUrl: string;
  joinedDate?: string;
}

const FALLBACK_STUDENTS: StudentItem[] = [
  {
    id: 's-1',
    fullName: 'Malik Abubakkar',
    rollNumber: '00000',
    avatarUrl: 'https://vejdcilgwgiscaspbfho.supabase.co/storage/v1/object/public/avatars/avatar-e09ce3fe-9207-44e9-916d-bf2f01b0ca5f.jpg',
    joinedDate: '2026-01-10',
  },
  {
    id: 's-2',
    fullName: 'Ayesha Noor',
    rollNumber: '00102',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
    joinedDate: '2026-01-12',
  },
  {
    id: 's-3',
    fullName: 'Hamza Farooq',
    rollNumber: '00105',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    joinedDate: '2026-01-14',
  },
  {
    id: 's-4',
    fullName: 'Fatima Tariq',
    rollNumber: '00109',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    joinedDate: '2026-01-15',
  },
  {
    id: 's-5',
    fullName: 'Zain Ahmed',
    rollNumber: '00114',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
    joinedDate: '2026-01-18',
  },
  {
    id: 's-6',
    fullName: 'Sara Bilal',
    rollNumber: '00121',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256',
    joinedDate: '2026-01-20',
  },
  {
    id: 's-7',
    fullName: 'Bilal Siddiqui',
    rollNumber: '00128',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=256',
    joinedDate: '2026-01-22',
  },
  {
    id: 's-8',
    fullName: 'Hira Aslam',
    rollNumber: '00135',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
    joinedDate: '2026-01-25',
  },
  {
    id: 's-9',
    fullName: 'Usman Raza',
    rollNumber: '00142',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256',
    joinedDate: '2026-01-28',
  },
  {
    id: 's-10',
    fullName: 'Maryam Khan',
    rollNumber: '00149',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=256',
    joinedDate: '2026-02-01',
  },
];

export const StudentsPage: React.FC = () => {
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [students, setStudents] = useState<StudentItem[]>(FALLBACK_STUDENTS);
  const [loadingTeacher, setLoadingTeacher] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setError(null);
    setLoadingTeacher(true);
    setLoadingStudents(true);

    api.getPublicTeacher()
      .then((res) => {
        if (res.data?.success) setTeacher(res.data.data);
      })
      .catch((err) => console.error('Failed to load teacher profile:', err))
      .finally(() => setLoadingTeacher(false));

    api.getPublicStudents()
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setStudents(res.data.data);
        } else {
          setStudents(FALLBACK_STUDENTS);
        }
      })
      .catch((err) => {
        console.error('Failed to load students:', err);
        setStudents(FALLBACK_STUDENTS);
      })
      .finally(() => setLoadingStudents(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
      );
    });
  }, [students, searchQuery]);

  return (
    <div className="w-full bg-[#F8FAFC] pt-6 sm:pt-8 pb-16 min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* ========================================================================= */}
        {/* 1. COMPACT INSTRUCTOR SPOTLIGHT CARD (Small, refined & elegant) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
            {/* Compact Teacher Avatar */}
            <div className="relative shrink-0">
              <img
                src={
                  getMediaUrl(teacher?.avatarUrl) ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
                }
                alt={teacher?.fullName || 'Lead Instructor'}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-primary-100 shadow-xs"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256';
                }}
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-3 h-3" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-200/60">
                  {teacher?.role || 'Lead Instructor & Admin'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Verified
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-navy-950">
                {teacher?.fullName || 'Prof. Alex Vance'}
              </h2>
              <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                {teacher?.bio || 'Leading SMIT Web Development curriculum, video lectures, and live code reviews.'}
              </p>
            </div>
          </div>

          {/* Schedule Pill */}
          <div className="bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-200/80 text-center sm:text-right shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Cohort Sessions</p>
            <p className="text-xs font-black text-navy-900 mt-0.5 flex items-center justify-center sm:justify-end gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary-600" />
              <span>Monday & Thursday (4:00 PM – 6:00 PM)</span>
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. ALL CLASSROOM STUDENTS DIRECTORY & SEARCH */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {/* Header & Search Bar */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
                  Class Community
                </h1>
                <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 font-extrabold text-xs border border-primary-200/70 shadow-2xs">
                  {students.length} Enrolled
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Meet active students learning, collaborating, and shipping web applications together.
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Student Cards Grid (Aesthetic boxes) */}
          {loadingStudents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="p-6 text-center space-y-4 bg-white rounded-3xl border border-slate-200">
                  <Skeleton className="w-20 h-20 rounded-2xl mx-auto" />
                  <Skeleton className="h-5 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </Card>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-navy-900">No matching students found</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
                Try searching with a different name or roll number.
              </p>
              <Button onClick={() => setSearchQuery('')} variant="outline" size="sm">
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {filteredStudents.map((student, idx) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
                >
                  <Card className="h-full bg-white border border-slate-200/90 hover:border-primary-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col justify-between group">
                    {/* Top Accent & Avatar Box */}
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
                        <span>#{String(idx + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-700 shadow-2xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </div>
                    </div>

                    {/* Information */}
                    <div className="p-5 flex flex-col flex-1 justify-between">
                      <div className="space-y-2">
                        <h3 className="text-base font-black text-navy-950 group-hover:text-primary-600 transition-colors truncate">
                          {student.fullName}
                        </h3>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50/90 text-primary-800 text-[11px] font-bold border border-primary-200/60 shadow-2xs">
                          <BookOpen className="w-3 h-3 text-primary-600" />
                          <span>Web Development</span>
                        </div>
                      </div>

                      {/* Roll Number Strip */}
                      <div className="w-full mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">SMIT ID</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold">
                          {student.rollNumber || 'Enrolled'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
