import React from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge: string;
  iconBg: string;
  iconColor: string;
}

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();

  const features: FeatureItem[] = [
    {
      icon: FolderTree,
      title: 'Structured Learning',
      description: 'Organized courses and folder-style topics make learning simple, systematic, and easy to follow from day one.',
      badge: 'Curriculum',
      iconBg: 'bg-blue-50',
      iconColor: 'text-primary-600',
    },
    {
      icon: UploadCloud,
      title: 'Teacher Uploaded Lessons',
      description: 'Your teacher can upload new lessons and videos directly into the course curriculum with instant availability.',
      badge: 'Content Delivery',
      iconBg: 'bg-purple-50',
      iconColor: 'text-secondary-600',
    },
    {
      icon: TrendingUp,
      title: 'Student Progress',
      description: 'Students can track their learning progress, monitor completed lessons, and maintain high study momentum.',
      badge: 'Analytics',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      icon: CalendarCheck2,
      title: 'Attendance Tracking',
      description: 'Attendance is managed seamlessly for the class\'s Monday and Thursday sessions with accurate percentage reporting.',
      badge: 'Classroom',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      icon: BellRing,
      title: 'Notifications',
      description: 'Students receive timely notifications when new topics, video lessons, and course modules are published.',
      badge: 'Alerts',
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
    },
    {
      icon: MailCheck,
      title: 'Email Updates',
      description: 'Important class announcements and administrative updates can be delivered straight through email notifications.',
      badge: 'Communication',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      icon: LayoutDashboard,
      title: 'Student Portal',
      description: 'Every registered student gets a personal learning dashboard with courses, attendance history, and profile controls.',
      badge: 'Learner Experience',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
    {
      icon: UserCheck,
      title: 'Teacher Portal',
      description: 'The teacher can manage courses, students, video uploads, and classroom attendance all from one unified dashboard.',
      badge: 'Administration',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Accounts',
      description: 'Students and teacher use secure role-based accounts with protected endpoints and privacy-first visibility controls.',
      badge: 'Security',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
  ];

  return (
    <div className="w-full bg-[#F8FAFC] pt-8 sm:pt-10 pb-16 min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary-600 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Classroom Capabilities
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight">
            Everything Your Class Needs
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            A comprehensive, modern educational platform specifically built to support structured web development training, active attendance, and video lectures.
          </p>
        </div>

        {/* 9 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <Card className="h-full p-8 bg-white border border-slate-200/90 hover:border-primary-300 hover:shadow-xl transition-all duration-300 rounded-3xl flex flex-col justify-between group">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-14 h-14 rounded-2xl ${feat.iconBg} ${feat.iconColor} flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform duration-200`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 bg-slate-50 rounded-lg">
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-navy-900 group-hover:text-primary-600 transition-colors">
                      {feat.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center text-xs font-semibold text-primary-600 gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Included in SMIT Web Class</span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Workflow Showcase */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900">
              One Unified Workflow
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              From course upload to live lecture tracking, both instructor and students stay completely synchronized.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600 text-white font-extrabold flex items-center justify-center mx-auto text-sm">
                1
              </div>
              <h4 className="text-base font-bold text-navy-900">Instructor Publishes</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The teacher uploads topics, video lectures, and schedules class days through the teacher portal.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-600 text-white font-extrabold flex items-center justify-center mx-auto text-sm">
                2
              </div>
              <h4 className="text-base font-bold text-navy-900">Database Syncs</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The centralized backend updates public curriculum previews and unlocks full media for enrolled learners.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center mx-auto text-sm">
                3
              </div>
              <h4 className="text-base font-bold text-navy-900">Students Excel</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Students watch lessons, verify attendance, and build real-world web applications.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl p-8 sm:p-12 text-center text-white space-y-4 shadow-lg shadow-primary-500/20">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Experience Modern Learning?
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto">
            Join our active cohort and begin your journey through modern frontend, backend, and full-stack web development.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => navigate('/signup')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto bg-white text-primary-700 hover:bg-blue-50 border-none font-bold"
              rightIcon={<ArrowRight className="w-5 h-5 text-primary-700" />}
            >
              Join Class Now
            </Button>
            <Button
              onClick={() => navigate('/courses')}
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto text-white hover:bg-white/10 border border-white/30"
            >
              Browse Curriculum
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
