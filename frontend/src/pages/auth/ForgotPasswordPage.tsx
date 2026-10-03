import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Clock,
  Shield,
  KeyRound,
  Check,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  // Steps: 1 = Enter Email, 2 = Verify OTP, 3 = Set New Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState('');

  // 5-digit OTP state array
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '']);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Passwords
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // 10-Minute (600s) Session Timer
  const [sessionTimeLeft, setSessionTimeLeft] = useState(600);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Countdown timer for Resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Session 10-minute timer
  useEffect(() => {
    if (!isSessionActive || sessionTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          setIsSessionActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSessionActive, sessionTimeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Request 5-digit OTP sent to email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      error('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.forgotPassword(cleanEmail);
      if (res.data?.success) {
        success(
          res.data.message || '5-digit verification code dispatched to your email!',
          'Live Email Dispatched 📩'
        );
        setStep(2);
        setOtpDigits(['', '', '', '', '']);
        setResendCooldown(60);
        setSessionTimeLeft(600);
        setIsSessionActive(true);
        setTimeout(() => {
          digitInputRefs.current[0]?.focus();
        }, 150);
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to dispatch verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    if (cleanVal.length > 1) {
      handlePastedCode(cleanVal);
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal[0];
    setOtpDigits(newDigits);

    if (index < 4) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePastedCode = (pasted: string) => {
    const digits = pasted.replace(/\D/g, '').slice(0, 5).split('');
    const newDigits = [...otpDigits];
    digits.forEach((d, i) => {
      if (i < 5) newDigits[i] = d;
    });
    setOtpDigits(newDigits);
    const nextIndex = Math.min(digits.length, 4);
    digitInputRefs.current[nextIndex]?.focus();
  };

  // Step 2: Dedicated OTP Verification Check
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpDigits.join('').trim();
    if (cleanOtp.length !== 5) {
      error('Please enter the complete 5-digit verification code.');
      return;
    }
    if (sessionTimeLeft <= 0) {
      error('Your OTP session has expired. Please click "Resend Code".');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.verifyOtp({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
      });

      if (res.data?.success) {
        success('Verification code verified successfully! Now create your new password.', 'Code Verified ✅');
        setStep(3);
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Invalid or expired verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      if (res.data?.success) {
        success('A fresh 5-digit verification code was sent to your email!', 'Code Re-Dispatched 📨');
        setOtpDigits(['', '', '', '', '']);
        setResendCooldown(60);
        setSessionTimeLeft(600);
        setIsSessionActive(true);
        digitInputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Save New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpDigits.join('').trim();
    if (!newPassword || newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPassword({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        newPassword,
        confirmPassword,
      });

      if (res.data?.success) {
        success('Password updated successfully! You can now log into your portal.', 'Security Verified 🔒');
        setIsSessionActive(false);
        setStep(4);
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic Password Strength Meter
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200', textClass: 'text-slate-400' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8 && /[0-9]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    if (pass.length >= 10 && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', textClass: 'text-rose-600' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', textClass: 'text-amber-600' };
    if (score === 3) return { score: 3, label: 'Smart', color: 'bg-emerald-500', textClass: 'text-emerald-600' };
    return { score: 4, label: 'Strong', color: 'bg-blue-600', textClass: 'text-blue-600' };
  };

  const passStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:px-6 relative overflow-hidden">
      {/* Dynamic ambient backdrop aura */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-200/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-indigo-200/25 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Brand Header */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 text-navy-900 hover:text-primary-600 transition font-bold text-sm group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-secondary-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-navy-900 leading-none">SMIT Web Class</span>
            <span className="text-[10px] text-primary-600 font-semibold uppercase tracking-wider mt-0.5">Account Security</span>
          </div>
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto relative z-10 my-auto">
        <Card className="p-7 sm:p-9 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-200/60 transition-all">
          <AnimatePresence mode="wait">
            {/* ========================================================================= */}
            {/* STEP 1: REQUEST 5-DIGIT OTP                                               */}
            {/* ========================================================================= */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleRequestOtp}
                className="space-y-6"
              >
                <div className="text-center space-y-2.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary-700 text-xs font-bold border border-blue-200/60 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                    <span>Password Recovery</span>
                  </div>
                  <h1 className="text-2xl font-black text-navy-900 tracking-tight">Forgot Password?</h1>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Enter your registered email address. We will dispatch a <strong>5-digit verification code</strong> directly to your inbox.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-2">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition text-slate-900 placeholder:text-slate-400 font-medium"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                    <span>Teacher & Student Accounts</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <Shield className="w-3 h-3" /> Encrypted Delivery
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-lg shadow-primary-500/25 font-bold py-3.5 rounded-2xl"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Send 5-Digit OTP Code
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="w-full justify-center text-slate-500 hover:text-navy-900"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Return to Sign In
                  </Button>
                </div>
              </motion.form>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: DEDICATED OTP VERIFICATION TAB                                     */}
            {/* ========================================================================= */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleVerifyOtp}
                className="space-y-5"
              >
                {/* Session Header Status */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-navy-900 text-[11px] tracking-wide uppercase">
                        Active Verification Session
                      </span>
                    </div>

                    {/* Live countdown */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        sessionTimeLeft < 120
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-blue-100/70 text-blue-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimer(sessionTimeLeft)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        sessionTimeLeft < 120 ? 'bg-rose-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${(sessionTimeLeft / 600) * 100}%` }}
                    />
                  </div>

                  {/* Destination info + Direct Gmail button */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[220px]">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate font-semibold text-slate-700">{email}</span>
                    </div>
                    <a
                      href="https://mail.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      <span>Open Inbox</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* 5 Distinct OTP Input Boxes */}
                <div className="text-center pt-2">
                  <h2 className="text-xl font-extrabold text-navy-900 mb-1">Verify Security Code</h2>
                  <p className="text-xs text-slate-500 mb-4">Enter the 5-digit code sent to your email.</p>

                  <div className="flex justify-center items-center gap-2.5 sm:gap-3">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          digitInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={(e) => {
                          e.preventDefault();
                          handlePastedCode(e.clipboardData.getData('text'));
                        }}
                        className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-2xl border-2 transition-all outline-none ${
                          digit
                            ? 'bg-blue-50/70 border-primary-500 text-primary-900 shadow-md shadow-primary-500/10'
                            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/15'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-4 px-2">
                    <span className="text-slate-400">Paste code directly</span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isLoading}
                      onClick={handleResendOtp}
                      className={`font-bold transition inline-flex items-center gap-1 ${
                        resendCooldown > 0
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-primary-600 hover:text-primary-700 underline'
                      }`}
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-lg shadow-primary-500/25 font-bold py-3.5 rounded-2xl"
                    isLoading={isLoading}
                    disabled={sessionTimeLeft <= 0}
                    rightIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Verify OTP Code
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSessionActive(false);
                      setStep(1);
                    }}
                    className="w-full text-center text-xs font-semibold text-slate-500 hover:text-navy-900 py-1 transition"
                  >
                    ← Change Email Address
                  </button>
                </div>
              </motion.form>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: DEDICATED NEW PASSWORD TAB (OPENED AFTER OTP MATCHES)             */}
            {/* ========================================================================= */}
            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleResetPassword}
                className="space-y-5"
              >
                <div className="text-center space-y-1 pb-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60 shadow-xs mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Code Verified for {email}</span>
                  </div>
                  <h2 className="text-2xl font-black text-navy-900 tracking-tight">Set New Password</h2>
                  <p className="text-xs text-slate-500">Choose a new, strong password to secure your account.</p>
                </div>

                {/* New Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider">
                      New Password
                    </label>
                    {newPassword && (
                      <span className={`text-[11px] font-black uppercase tracking-wider ${passStrength.textClass}`}>
                        {passStrength.label}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition font-medium"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* 4 Visual Signal Bars */}
                  {newPassword && (
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 mt-2">
                      {[1, 2, 3, 4].map((barIndex) => (
                        <div
                          key={barIndex}
                          className={`h-full rounded-full transition-all duration-300 ${
                            passStrength.score >= barIndex ? passStrength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-navy-800 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 transition font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div className="pt-1.5 pl-1">
                      {confirmPassword === newPassword ? (
                        <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Passwords match
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-rose-500">
                          Passwords do not match yet
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-lg shadow-primary-500/25 font-bold py-3.5 rounded-2xl"
                    isLoading={isLoading}
                    rightIcon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Save New Password
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full text-center text-xs font-semibold text-slate-500 hover:text-navy-900 py-1 transition"
                  >
                    ← Back to OTP verification
                  </button>
                </div>
              </motion.form>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: SUCCESS CONFIRMATION                                              */}
            {/* ========================================================================= */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4 space-y-4"
              >
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border-2 border-emerald-300 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-2xl font-black text-navy-900 tracking-tight">
                  Password Reset Successfully!
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Your SMIT Web Class account password has been safely verified and updated.
                </p>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-navy-900">Next Steps:</p>
                  <p>• Log into your student or instructor account with your new password.</p>
                  <p>• All previous sessions have been safely secured.</p>
                </div>
                <div className="pt-2">
                  <Button
                    onClick={() => navigate('/login')}
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-lg shadow-primary-500/25 font-bold py-3.5 rounded-2xl"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Proceed to Sign In
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Security badge footer */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            <span>End-to-End Encrypted Verification Powered by Resend TLS</span>
          </p>
        </div>
      </div>
    </div>
  );
};
