import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  Code2,
  Hammer,
  RotateCw,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  Flame,
  Database,
  ArrowRight,
  ChevronRight,
  Award,
  Video,
  Users
} from 'lucide-react';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { api } from '../../services/api.js';

interface TeacherData {
  fullName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  role: string;
}

interface StatsData {
  classDays: string;
  classTiming: string;
  totalStudents?: number;
  totalCourses?: number;
  totalVideos?: number;
}

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getPublicTeacher().then((res) => res.data?.data),
      api.getPublicStats().then((res) => res.data?.data),
      api.getPublicStudents().then((res) => res.data?.data || []),
    ])
      .then(([teacherData, statsData, studentsData]) => {
        if (teacherData) setTeacher(teacherData);
        if (statsData) {
          statsData.totalStudents = Math.max(statsData.totalStudents || 0, Array.isArray(studentsData) ? studentsData.length : 0);
          setStats(statsData);
        }
      })
      .catch((err) => console.error('Failed to load about data:', err))
      .finally(() => setLoading(false));
  }, []);

  const technologies = [
    {
      name: 'HTML5',
      category: 'Structure',
      desc: 'Semantic markup, modern audio/video integration, and web accessibility standards.',
      color: 'from-orange-500/10 to-orange-500/5 text-orange-600 border-orange-200/80',
    },
    {
      name: 'CSS3 & Tailwind',
      category: 'Styling',
      desc: 'Responsive layouts, Flexbox, Grid systems, and clean modern utility tokens.',
      color: 'from-sky-500/10 to-sky-500/5 text-sky-600 border-sky-200/80',
    },
    {
      name: 'JavaScript (ES6+)',
      category: 'Core Logic',
      desc: 'Asynchronous event loops, DOM manipulation, promises, and modern API fetching.',
      color: 'from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-200/80',
    },
    {
      name: 'TypeScript',
      category: 'Type Safety',
      desc: 'Static type checking, interfaces, generics, and production scale architecture.',
      color: 'from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-200/80',
    },
    {
      name: 'React 18',
      category: 'Frontend UI',
      desc: 'Component architecture, custom hooks, virtual DOM, and modular client routing.',
      color: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600 border-cyan-200/80',
    },
    {
      name: 'Firebase',
      category: 'Backend & Cloud',
      desc: 'Authentication, Firestore cloud database, FCM notifications, and security rules.',
      color: 'from-amber-600/10 to-amber-600/5 text-amber-600 border-amber-200/80',
    },
    {
      name: 'Supabase',
      category: 'Relational DB',
      desc: 'PostgreSQL database power, Row Level Security, instant REST APIs, and file storage.',
      color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-200/80',
    },
  ];

  const learningSteps = [
    {
      step: '01',
      title: 'Learn',
      desc: 'Understand deep foundational concepts through teacher-led video lessons, live code demonstrations, and clear syllabus folders.',
      icon: BookOpen,
      iconColor: 'text-primary-600 bg-blue-50 border-blue-200/60',
      badge: 'Step 1: Theory',
    },
    {
      step: '02',
      title: 'Practice',
      desc: 'Solve real algorithmic challenges, implement component designs, and complete structured exercises tailored to each class topic.',
      icon: Code2,
      iconColor: 'text-purple-600 bg-purple-50 border-purple-200/60',
      badge: 'Step 2: Exercises',
    },
    {
      step: '03',
      title: 'Build',
      desc: 'Construct full-scale, responsive web applications from scratch, deploying modern frontends connected to real databases.',
      icon: Hammer,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
      badge: 'Step 3: Projects',
    },
    {
      step: '04',
      title: 'Improve',
      desc: 'Receive personalized instructor reviews, refine code architecture, optimize web performance, and maintain consistent attendance.',
      icon: RotateCw,
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200/60',
      badge: 'Step 4: Mastery',
    },
  ];

  return (
    <div className="w-full bg-[#F8FAFC] pt-8 sm:pt-10 pb-16 min-h-[75vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* ========================================================================= */}
        {/* 1. HEADER & OUR CLASS STORY */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 text-primary-600 text-xs font-bold uppercase tracking-wider border border-primary-200/60 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Educational Mission & Vision
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-navy-900 tracking-tight leading-tight">
            About SMIT Web Class
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed pt-2">
            SMIT Web Class is a dedicated learning environment for students who want to build strong foundations in modern web development.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 2. LEARNING APPROACH: CONNECTED ROADMAP (BOXES WITH CONNECTING LINES) */}
        {/* ========================================================================= */}
        <div className="space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-secondary-600 text-xs font-bold uppercase tracking-wider mb-2">
              4-Step Roadmap
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Our Learning Approach
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              A continuous, connected pedagogical framework engineered to turn beginners into production-ready engineers.
            </p>
          </div>

          {/* Interactive Steps with Beautiful Connected Line */}
          <div className="relative">
            {/* Horizontal connecting gradient track behind boxes for desktop */}
            <div className="hidden lg:block absolute top-14 left-16 right-16 h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-amber-500 rounded-full z-0" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative z-10">
              {learningSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="relative group">
                    <Card className="h-full p-7 bg-white border border-slate-200/90 group-hover:border-primary-400 group-hover:shadow-xl group-hover:-translate-y-1.5 transition-all duration-300 rounded-3xl flex flex-col justify-between relative overflow-hidden">
                      {/* Top Accent Stripe */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 opacity-70 group-hover:opacity-100 transition-opacity" />

                      <div className="space-y-4">
                        {/* Header with Step Circle & Number */}
                        <div className="flex items-center justify-between">
                          <div className={`w-14 h-14 rounded-2xl ${step.iconColor} border flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-7 h-7" />
                          </div>
                          <span className="text-2xl font-black text-slate-200 group-hover:text-primary-300 transition-colors">
                            {step.step}
                          </span>
                        </div>

                        {/* Step Badge */}
                        <span className="inline-block text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-lg">
                          {step.badge}
                        </span>

                        <h3 className="text-xl font-bold text-navy-900 group-hover:text-primary-600 transition-colors">
                          {step.title}
                        </h3>

                        <p className="text-sm text-slate-600 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>

                      {/* Bottom Process Link */}
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Phase {idx + 1} of 4</span>
                        <ChevronRight className="w-4 h-4 text-primary-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>

                    {/* Connecting line node & arrow between adjacent boxes on desktop */}
                    {idx < 3 && (
                      <div className="hidden lg:flex absolute -right-4 top-12 z-20 w-8 items-center justify-center pointer-events-none">
                        <div className="w-4 h-4 rounded-full bg-white border-2 border-primary-500 shadow-md flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary-600" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. CLASS SCHEDULE & ATTENDANCE WITH DIVIDER LINE & CONNECTED BOXES */}
        {/* ========================================================================= */}
        <div id="schedule" className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                  Classroom Routine
                </div>
                <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">
                  Class Schedule & Routine
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-primary-700 bg-primary-50 px-4 py-2 rounded-xl border border-primary-200/60 shadow-xs">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <span>{stats?.classDays || 'Monday & Thursday'}</span>
                </div>
                {stats?.totalStudents ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200/60 shadow-xs">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{stats.totalStudents} {stats.totalStudents === 1 ? 'Student Joined' : 'Students Joined'}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Schedule Boxes with Visual Connector Line Between Them */}
            <div className="relative">
              {/* Central vertical divider line on medium+ screens */}
              <div className="hidden md:block absolute top-6 bottom-6 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-primary-200 via-secondary-300 to-primary-200 z-10">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-secondary-500 shadow-xs flex items-center justify-center text-[8px] font-bold text-secondary-700">
                  +
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-0">
                {/* Box 1: Monday Sessions */}
                <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-50/60 via-slate-50 to-white border border-blue-100/80 space-y-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-extrabold shadow-sm">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <Badge variant="blue" className="font-bold">
                      Session 1: Monday
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-navy-900">
                    Interactive Concept & Code Lecture
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Weekly introduction of core concepts, architecture deep dives, and live code along. Topics are explored with interactive examples and immediate student Q&A.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-primary-700">
                    <Clock className="w-4 h-4" />
                    <span>6:00 PM – 8:30 PM (Evening Cohort)</span>
                  </div>
                </div>

                {/* Box 2: Thursday Sessions */}
                <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-50/60 via-slate-50 to-white border border-purple-100/80 space-y-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-secondary-600 text-white flex items-center justify-center font-extrabold shadow-sm">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <Badge variant="purple" className="font-bold">
                      Session 2: Thursday
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-navy-900">
                    Hands-On Lab & Attendance Verification
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Practical project implementation, student code review, assignment grading, and mandatory attendance check-ins recorded in the database.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-secondary-700">
                    <Clock className="w-4 h-4" />
                    <span>6:00 PM – 8:30 PM (Evening Cohort)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. ONE DEDICATED TEACHER */}
        {/* ========================================================================= */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary-600 text-xs font-bold uppercase tracking-wider mb-2">
              Instructor Profile
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              One Dedicated Teacher
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Every lesson, code review, and curriculum decision is led by a single dedicated instructor who knows each student's progress.
            </p>
          </div>

          {loading ? (
            <Card className="p-10 bg-white border border-slate-200/90 rounded-3xl">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <Skeleton className="w-44 h-44 rounded-3xl" />
                <div className="flex-1 space-y-3 w-full">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-9 w-60" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 sm:p-12 bg-white border border-slate-200/90 rounded-3xl shadow-sm relative overflow-hidden">
              {/* Decorative top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600" />

              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 sm:gap-12">
                {/* Teacher Photo with Enhanced Border */}
                <div className="relative shrink-0">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-primary-500/15 bg-slate-100 ring-2 ring-primary-100">
                    <img
                      src={
                        teacher?.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
                      }
                      alt={teacher?.fullName || 'Teacher Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-tr from-primary-600 to-secondary-600 text-white p-2.5 rounded-2xl shadow-lg border-2 border-white">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </div>

                {/* Teacher Bio & Key Points */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider border border-primary-200/60">
                    <Award className="w-3.5 h-3.5 text-primary-600" />
                    {teacher?.role || 'Lead Instructor & Admin'}
                  </div>

                  <h3 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
                    {teacher?.fullName || 'Prof. Alex Vance'}
                  </h3>

                  <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                    {teacher?.bio ||
                      'Leading our SMIT Web Development class with structured lessons, practical projects, code reviews and continuous guidance from foundational HTML to modern full-stack architectures.'}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-5 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5 text-navy-800 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Individual Student Code Reviews
                    </span>
                    <span className="flex items-center gap-1.5 text-navy-800 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Direct Cohort Mentorship
                    </span>
                    <span className="flex items-center gap-1.5 text-navy-800 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Live Monday & Thursday Sessions
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 5. LEARNING ENVIRONMENT WITH CONNECTING DESIGN LINES */}
        {/* ========================================================================= */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              The Learning Environment
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              How our students consistently build momentum and turn concepts into working production web apps.
            </p>
          </div>

          <div className="relative">
            {/* Horizontal line connecting the 3 environment pillars on desktop */}
            <div className="hidden md:block absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-blue-200 via-purple-300 to-emerald-200 -translate-y-1/2 z-0 pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              <Card className="p-8 bg-white border border-slate-200/90 rounded-3xl shadow-sm hover:shadow-lg hover:border-primary-300 transition-all text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary-600 flex items-center justify-center mx-auto border border-blue-100">
                  <Layers className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-navy-900">Structured Syllabus</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Folder-style topics break down complex engineering into digestible daily lessons with code references.
                </p>
              </Card>

              <Card className="p-8 bg-white border border-slate-200/90 rounded-3xl shadow-sm hover:shadow-lg hover:border-secondary-300 transition-all text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-secondary-600 flex items-center justify-center mx-auto border border-purple-100">
                  <Code2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-navy-900">Hands-On Code Drills</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Active coding right inside real code editors rather than passive watching. Every lesson includes a working code output.
                </p>
              </Card>

              <Card className="p-8 bg-white border border-slate-200/90 rounded-3xl shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-navy-900">Attendance & Guidance</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Consistent class attendance combined with teacher guidance ensures nobody falls behind the cohort.
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. TECHNOLOGY PATH */}
        {/* ========================================================================= */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Our Technology Path
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Industry-standard tools and frameworks mastered throughout the SMIT Web Development curriculum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technologies.map((tech) => (
              <Card
                key={tech.name}
                className={`p-6 bg-white border rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-1 transition-all ${tech.color}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-navy-900">{tech.name}</h4>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {tech.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {tech.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center py-6">
          <Button
            onClick={() => navigate('/signup')}
            variant="primary"
            size="lg"
            className="shadow-xl shadow-primary-500/25 px-10 text-base"
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Enroll in SMIT Web Class
          </Button>
        </div>
      </div>
    </div>
  );
};
