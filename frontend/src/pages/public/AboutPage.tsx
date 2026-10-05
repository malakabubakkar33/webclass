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
  Users,
  MapPin
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
      color: 'border-orange-200/80 bg-orange-50/50',
      badgeColor: 'text-orange-700 bg-orange-100',
    },
    {
      name: 'CSS3 & Tailwind',
      category: 'Styling',
      desc: 'Responsive layouts, Flexbox, Grid systems, and clean modern utility design tokens.',
      color: 'border-sky-200/80 bg-sky-50/50',
      badgeColor: 'text-sky-700 bg-sky-100',
    },
    {
      name: 'JavaScript (ES6+)',
      category: 'Core Logic',
      desc: 'Asynchronous event loops, DOM manipulation, promises, and modern API fetching.',
      color: 'border-amber-200/80 bg-amber-50/50',
      badgeColor: 'text-amber-700 bg-amber-100',
    },
    {
      name: 'TypeScript',
      category: 'Type Safety',
      desc: 'Static type checking, interfaces, generics, and production scale architecture.',
      color: 'border-blue-200/80 bg-blue-50/50',
      badgeColor: 'text-blue-700 bg-blue-100',
    },
    {
      name: 'React 18',
      category: 'Frontend UI',
      desc: 'Component architecture, custom hooks, virtual DOM, and modular client routing.',
      color: 'border-cyan-200/80 bg-cyan-50/50',
      badgeColor: 'text-cyan-700 bg-cyan-100',
    },
    {
      name: 'Firebase & FCM',
      category: 'Cloud & Alerts',
      desc: 'Authentication, Firestore cloud database, FCM notifications, and security rules.',
      color: 'border-amber-200/80 bg-amber-50/50',
      badgeColor: 'text-amber-800 bg-amber-100',
    },
    {
      name: 'Supabase & Postgres',
      category: 'Database & RLS',
      desc: 'PostgreSQL database power, Row Level Security, instant REST APIs, and file storage.',
      color: 'border-emerald-200/80 bg-emerald-50/50',
      badgeColor: 'text-emerald-700 bg-emerald-100',
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
      title: 'Master',
      desc: 'Receive personalized instructor reviews, refine code architecture, optimize web performance, and maintain consistent attendance.',
      icon: RotateCw,
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200/60',
      badge: 'Step 4: Review',
    },
  ];

  return (
    <div className="w-full bg-[#F8FAFC] pt-6 sm:pt-8 pb-16 min-h-[75vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* ========================================================================= */}
        {/* 1. HEADER & MISSION */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-primary-600 text-xs font-bold uppercase tracking-wider border border-primary-200/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Classroom Vision & Pedagogy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-navy-950 tracking-tight leading-tight">
            About SMIT Web Class
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            SMIT Web Class is a structured full-stack learning platform designed to help students master web technologies through instructor guidance, practical code exercises, active attendance tracking, and production web applications.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 2. CLASS SCHEDULE & COHORT TIMINGS */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                Active Cohort Timings
              </div>
              <h2 className="text-2xl font-extrabold text-navy-950">
                Weekly Class Schedule
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Punctual attendance is recorded every session to cultivate consistency and professional work ethics.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-primary-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Days</p>
                  <p className="text-sm font-extrabold text-navy-900 mt-0.5">Monday & Thursday</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-secondary-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Hours</p>
                  <p className="text-sm font-extrabold text-navy-900 mt-0.5">4:00 PM – 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. 4-STEP ROADMAP */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Our 4-Step Learning Method
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              A proven framework built to transform zero-experience learners into full-stack engineers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {learningSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <Card
                  key={step.title}
                  className="p-6 bg-white border border-slate-200/90 hover:border-primary-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl ${step.iconColor} border flex items-center justify-center shadow-2xs`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xl font-black text-slate-300">
                        {step.step}
                      </span>
                    </div>

                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                      {step.badge}
                    </span>

                    <h3 className="text-base font-bold text-navy-950">
                      {step.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {step.desc}
                    </p>
                  </div>

                  <div className="pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>Phase {idx + 1} of 4</span>
                    <ChevronRight className="w-3.5 h-3.5 text-primary-500" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. INSTRUCTOR SPOTLIGHT */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <img
              src={
                teacher?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
              }
              alt={teacher?.fullName || 'Lead Instructor'}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-primary-200 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256';
              }}
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <Badge variant="primary" className="bg-primary-50 text-primary-700 font-bold border border-primary-200/60 text-xs">
              {teacher?.role || 'Lead Instructor & Admin'}
            </Badge>
            <h3 className="text-xl sm:text-2xl font-black text-navy-950">
              {teacher?.fullName || 'Prof. Alex Vance'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {teacher?.bio ||
                'Guiding students with structured lessons, practical projects, code reviews, and continuous guidance from foundational HTML to modern full-stack architectures.'}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Live Code Reviews
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Monday & Thursday Sessions
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. TECHNOLOGY PATH */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Curriculum Tech Stack
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Modern tools and production libraries taught throughout the program.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {technologies.map((tech) => (
              <Card
                key={tech.name}
                className={`p-5 bg-white border rounded-2xl shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all ${tech.color}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-extrabold text-navy-950">{tech.name}</h4>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${tech.badgeColor}`}>
                    {tech.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {tech.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-2">
          <Button
            onClick={() => navigate('/signup')}
            variant="primary"
            size="lg"
            className="shadow-xl shadow-primary-500/25 px-10 text-base font-bold"
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Enroll in SMIT Web Class
          </Button>
        </div>
      </div>
    </div>
  );
};
