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
  UserCheck
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
  username: string;
  rollNumber: string;
  avatarUrl: string;
  joinedDate: string;
}

export const StudentsPage: React.FC = () => {
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
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
        if (res.data?.success) {
          setStudents(res.data.data || []);
        } else {
          setError('Unable to load student directory.');
        }
      })
      .catch((err) => {
        console.error('Failed to load students:', err);
        setError('Unable to load student directory.');
      })
      .finally(() => setLoadingStudents(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
      );
    });
  }, [students, searchQuery]);

  return (
    <div className="w-full bg-[#F8FAFC] pt-8 sm:pt-10 pb-16 min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary-600 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Class Community
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight">
            Our Class Community
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            Meet the students learning and building together in our SMIT Web Development class.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 1. FIRST: LARGE TEACHER PROFILE CARD */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <GraduationCap className="w-4 h-4 text-primary-600" />
            <span>Class Instructor</span>
          </div>

          {loadingTeacher ? (
            <Card className="p-8 sm:p-10 bg-white border border-slate-200/90 rounded-3xl">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <Skeleton className="w-36 h-36 rounded-3xl" />
                <div className="flex-1 space-y-3 w-full">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-9 w-64" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </Card>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row items-stretch">
              {/* Teacher Photo - Full Box Cover */}
              <div className="relative w-full md:w-80 min-h-[260px] md:min-h-full shrink-0 bg-slate-100">
                <img
                  src={
                    getMediaUrl(teacher?.avatarUrl) ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'
                  }
                  alt={teacher?.fullName || 'Lead Instructor'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600';
                  }}
                />
                <div className="absolute top-4 left-4 bg-primary-600/95 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl shadow-md text-xs font-bold flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  <span>Lead Instructor</span>
                </div>
              </div>

              {/* Teacher Details */}
              <div className="flex-1 p-8 sm:p-10 text-center md:text-left space-y-3 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/60 text-primary-700 text-xs font-bold uppercase tracking-wider w-fit mx-auto md:mx-0">
                  <UserCheck className="w-3.5 h-3.5" />
                  {teacher?.role || 'Lead Instructor & Admin'}
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
                  {teacher?.fullName || 'Prof. Alex Vance'}
                </h2>

                <p className="text-slate-600 text-base leading-relaxed max-w-3xl">
                  {teacher?.bio ||
                    'Leading our SMIT Web Development class with structured lessons, practical projects, code reviews, and continuous guidance.'}
                </p>

                <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-5 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    Class Days: Monday & Thursday
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Verified Classroom Administrator
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. THEN: ALL REGISTERED STUDENTS */}
        {/* ========================================================================= */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
                Meet Our Students
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Active students registered in our SMIT Web Development cohort.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
              />
            </div>
          </div>

          {/* Student Cards Grid */}
          {loadingStudents ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <Card key={i} className="p-6 text-center space-y-4">
                  <Skeleton className="w-20 h-20 rounded-2xl mx-auto" />
                  <Skeleton className="h-5 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-md mx-auto">
              <RefreshCw className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-navy-900">{error}</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Unable to load the student list from the database.
              </p>
              <Button onClick={fetchData} variant="primary" size="sm">
                Try Again
              </Button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-md mx-auto">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-navy-900">
                {searchQuery ? 'No matching students found' : 'No students registered yet'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? 'Try searching by a different name or roll number.'
                  : 'New students will appear here automatically upon enrollment.'}
              </p>
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6">
              {filteredStudents.map((student) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="h-full bg-white border border-slate-200/90 hover:border-primary-400 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between group">
                    {/* Student Full Cover Photo Header */}
                    <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
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
                      <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 shadow-2xs">
                        Active
                      </div>
                    </div>

                    {/* Student Public Info */}
                    <div className="p-3.5 text-center flex flex-col justify-between flex-1">
                      <h3 className="text-sm font-bold text-navy-900 group-hover:text-primary-600 transition-colors line-clamp-1 w-full">
                        {student.fullName}
                      </h3>

                      <div className="mt-2 inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-blue-50/80 text-primary-700 text-[11px] font-semibold">
                        SMIT ID: {student.rollNumber || 'Active Student'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
