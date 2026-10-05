import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderTree,
  UploadCloud,
  TrendingUp,
  CalendarCheck2,
  BellRing,
  MailCheck,
  UserCheck,
  ShieldCheck,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
  Smartphone,
  Database
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge: string;
  category: 'learning' | 'management' | 'security' | 'technology';
  iconBg: string;
  iconColor: string;
  accentColor: string;
}

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'learning' | 'management' | 'security'>('all');

  const features: FeatureItem[] = [
    {
      icon: FolderTree,
      title: 'Structured Syllabus & Topics',
      description: 'Organized course curriculum with folder-style topics makes mastering concepts simple, systematic, and easy to follow.',
      badge: 'Curriculum',
      category: 'learning',
      iconBg: 'bg-blue-50',
      iconColor: 'text-primary-600',
      accentColor: 'border-primary-200',
    },
    {
      icon: UploadCloud,
      title: 'Video Lectures & Files',
      description: 'Stream classroom video recordings, access starter files, and download project source code uploaded directly by your teacher.',
      badge: 'Media Delivery',
      category: 'learning',
      iconBg: 'bg-purple-50',
      iconColor: 'text-secondary-600',
      accentColor: 'border-purple-200',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Progress Tracking',
      description: 'Keep tabs on completed topics, video watch progress, and maintain weekly learning momentum with detailed visual metrics.',
      badge: 'Analytics',
      category: 'learning',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      accentColor: 'border-emerald-200',
    },
    {
      icon: CalendarCheck2,
      title: 'Attendance Sessions',
      description: 'Mon & Thu session check-ins with automated attendance percentage, streak logs, and verification badges for active students.',
      badge: 'Attendance',
      category: 'management',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      accentColor: 'border-amber-200',
    },
    {
      icon: BellRing,
      title: 'Web Push & Instant Alerts',
      description: 'Receive real-time desktop & mobile browser notifications the instant new lessons, assignments, or notices are published.',
      badge: 'Real-Time Alerts',
      category: 'management',
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      accentColor: 'border-sky-200',
    },
    {
      icon: MailCheck,
      title: 'Transactional Email Updates',
      description: 'Automated 5-digit security codes, password resets, and curriculum announcements delivered straight to your email inbox.',
      badge: 'Communications',
      category: 'management',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      accentColor: 'border-indigo-200',
    },
    {
      icon: LayoutDashboard,
      title: 'Dedicated Student Portal',
      description: 'Every student gets their personal command center with assignments, active courses, attendance logs, and profile settings.',
      badge: 'Learner Experience',
      category: 'learning',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      accentColor: 'border-rose-200',
    },
    {
      icon: UserCheck,
      title: 'Teacher Administration Hub',
      description: 'Instructors can upload lessons, approve attendance, grade student assignments, and broadcast notices from one unified interface.',
      badge: 'Instructor Tools',
      category: 'management',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      accentColor: 'border-violet-200',
    },
    {
      icon: ShieldCheck,
      title: 'Role-Based Security & PWA',
      description: 'Protected routes, JWT authentication, offline PWA caching, and Row Level Security ensure fast and secure learning anywhere.',
      badge: 'Security & PWA',
      category: 'security',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      accentColor: 'border-teal-200',
    },
  ];

  const filteredFeatures = selectedCategory === 'all'
    ? features
    : features.filter((f) => f.category === selectedCategory);

  return (
    <div className="w-full bg-[#F8FAFC] pt-6 sm:pt-8 pb-16 min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* COMPACT TOP BAR: Direct visibility into features without tall empty header */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary-600 text-xs font-bold uppercase tracking-wider mb-2 border border-primary-200/60">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Capabilities</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              Classroom Features & Architecture
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl">
              Engineered specifically for web development learners with video streaming, real-time attendance, and role-based portals.
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
            {[
              { id: 'all', label: 'All Features' },
              { id: 'learning', label: 'Learning' },
              { id: 'management', label: 'Classroom' },
              { id: 'security', label: 'Security & PWA' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-primary-600 text-white shadow-xs font-extrabold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 9 DIRECT FEATURE BOXES (Front & Center Visibility) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
              >
                <Card className="h-full p-6 sm:p-7 bg-white border border-slate-200/90 hover:border-primary-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl flex flex-col justify-between group">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl ${feat.iconBg} ${feat.iconColor} flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform duration-200 shadow-2xs`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant="primary" className="bg-slate-100 text-slate-700 font-bold border-none text-[11px]">
                        {feat.badge}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-navy-950 group-hover:text-primary-600 transition-colors">
                        {feat.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        {feat.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-primary-600 group-hover:text-primary-700">
                    <span className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Live in Production
                    </span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="bg-gradient-to-r from-primary-900 to-navy-950 text-white rounded-3xl p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl sm:text-2xl font-black">Experience the Platform Firsthand</h3>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Log in to the student portal to track your learning journey, submit assignments, and stream video lectures.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => navigate('/signup')}
              variant="primary"
              size="md"
              className="font-bold text-xs sm:text-sm shadow-md shadow-primary-500/30"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Join Our Class
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              size="md"
              className="text-white border-white/20 hover:bg-white/10 font-bold text-xs sm:text-sm"
            >
              Portal Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
