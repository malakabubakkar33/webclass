import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../services/api.js';
import { Button } from '../../components/ui/Button.js';
import {
  GraduationCap,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  Layers,
  Video,
  ShieldCheck,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Role selector tab
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [isTeacherSetupCompleted, setIsTeacherSetupCompleted] = useState<boolean>(true);
  const [teacherInfo, setTeacherInfo] = useState<{ teacherName?: string; username?: string }>({});

  useEffect(() => {
    const checkTeacherStatus = async () => {
      try {
        const res = await api.getTeacherSetupStatus();
        if (res.data?.success && res.data.data) {
          setIsTeacherSetupCompleted(Boolean(res.data.data.isSetupCompleted));
          setTeacherInfo(res.data.data);
        }
      } catch (err) {
        console.error('Failed to get teacher status', err);
      }
    };
    checkTeacherStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      errors.identifier =
        selectedRole === 'teacher'
          ? 'Teacher username is required'
          : 'Username or Roll Number is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(identifier, password);
      success(`Welcome back, ${user.fullName}!`, 'Authenticated');

      // Auto-route based on role
      if (user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSwitch = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
    setFieldErrors({});
    setIdentifier('');
    setPassword('');
  };

  const handleQuickFill = (type: 'student' | 'teacher') => {
    if (type === 'student') {
      setSelectedRole('student');
      setIdentifier('malikabubakkar11');
      setPassword('Password123!');
    } else {
      setSelectedRole('teacher');
      setIdentifier('teacher');
      setPassword('Password123!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between py-4 sm:py-6 px-4 sm:px-6 relative overflow-hidden">
      {/* Ambient background blur elements */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-primary-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-secondary-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navbar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between z-20 mb-3 sm:mb-6">
        <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-secondary-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black text-navy-950 tracking-tight block">
              SMIT Web Class
            </span>
            <span className="text-[10px] font-bold text-primary-600 tracking-wider uppercase block">
              Unified Portal Login
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary-600 transition bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-4xl mx-auto my-auto z-10">
        <div className="bg-white rounded-3xl sm:rounded-4xl shadow-xl shadow-slate-200/60 border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Side: Features & Value Proposition */}
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-50/90 via-slate-50 to-purple-50/80 p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-primary-200/60 text-primary-700 shadow-2xs mb-4">
                <Sparkles className="w-3.5 h-3.5 text-secondary-600" />
                <span className="text-[10px] font-bold tracking-wide uppercase">
                  Classroom Access
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-navy-950 tracking-tight leading-snug">
                One Class. One Portal. Continuous Momentum.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Log into your personalized learning portal to track attendance, stream recorded lessons, and submit code assignments.
              </p>
            </div>

            {/* Feature Points */}
            <div className="my-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white text-primary-600 flex items-center justify-center border border-primary-100 shadow-2xs shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-900">Modular Topics</h4>
                  <p className="text-[11px] text-slate-500">HTML5 to full-stack PostgreSQL</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white text-secondary-600 flex items-center justify-center border border-purple-100 shadow-2xs shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-900">Recorded Lessons</h4>
                  <p className="text-[11px] text-slate-500">Review video lectures anytime</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-900">Attendance Verification</h4>
                  <p className="text-[11px] text-slate-500">Mon & Thu 4:00 PM – 6:00 PM</p>
                </div>
              </div>
            </div>

            {/* Trust Footer */}
            <div className="pt-3 border-t border-slate-200/60 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>JWT & Role-Protected Endpoints</span>
            </div>
          </div>

          {/* Right Side: Sign In Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto space-y-5">
              {/* Form Title & Role Selector */}
              <div>
                <h3 className="text-2xl font-black text-navy-950 tracking-tight">
                  Sign In to SMIT Class
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your role to access your dedicated learning portal.
                </p>

                {/* Role Switcher Tabs */}
                <div className="mt-4 p-1 bg-slate-100 rounded-2xl flex items-center gap-1 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('student')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedRole === 'student'
                        ? 'bg-white text-primary-700 shadow-xs'
                        : 'text-slate-600 hover:text-navy-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Student Login
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('teacher')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedRole === 'teacher'
                        ? 'bg-white text-secondary-700 shadow-xs'
                        : 'text-slate-600 hover:text-navy-900'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Teacher & Admin
                  </button>
                </div>
              </div>

              {/* Quick 1-Click Demo Fill for easy testing on Mobile & PC */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <KeyRound className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                <span className="font-semibold">Quick Demo Fill:</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('student')}
                  className="font-bold text-primary-700 hover:underline bg-white px-2 py-0.5 rounded border border-primary-200 shadow-2xs"
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('teacher')}
                  className="font-bold text-secondary-700 hover:underline bg-white px-2 py-0.5 rounded border border-purple-200 shadow-2xs"
                >
                  Teacher
                </button>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                    {selectedRole === 'teacher' ? 'Teacher Username / Admin ID' : 'Username, Roll Number, or Email'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={
                        selectedRole === 'teacher'
                          ? teacherInfo?.username || 'teacher'
                          : 'Username, Roll Number, or Email'
                      }
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition ${
                        fieldErrors.identifier ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                      }`}
                      autoFocus
                    />
                  </div>
                  {fieldErrors.identifier && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">
                      {fieldErrors.identifier}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 transition hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-11 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition ${
                        fieldErrors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Teacher First-Time Setup Prompt */}
                {selectedRole === 'teacher' && !isTeacherSetupCompleted && (
                  <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-secondary-900 font-medium">
                      <Sparkles className="w-4 h-4 text-secondary-600 shrink-0" />
                      <span>First time opening the portal?</span>
                    </div>
                    <Link
                      to="/teacher/setup"
                      className="text-secondary-700 font-bold hover:text-secondary-900 underline ml-2 shrink-0"
                    >
                      Set Up Credentials →
                    </Link>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full font-bold shadow-md shadow-primary-500/25 justify-center"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Sign In as {selectedRole === 'teacher' ? 'Instructor' : 'Student'}
                  </Button>
                </div>
              </form>

              {/* Bottom Registration Link */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-center text-xs text-slate-600">
                <span>Not registered in our class yet?</span>
                <Link
                  to="/signup"
                  className="font-bold text-primary-600 hover:text-primary-700 transition ml-1.5 underline"
                >
                  Create Student Account →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer text */}
      <footer className="text-center text-xs text-slate-400 py-2">
        © 2026 SMIT Web Class. Light Theme • Secure Learning Platform
      </footer>
    </div>
  );
};
