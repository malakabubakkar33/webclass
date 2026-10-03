import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../services/api.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Avatar } from '../../components/ui/Avatar.js';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Mail,
  Phone,
  Hash,
  Lock,
  Camera,
  Sparkles,
  GraduationCap,
  Upload,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    mobileNumber: '',
    rollNumber: '',
    email: '',
    avatarUrl: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  // Client-side image compression and direct Cloud Storage upload
  const handlePhotoSelected = async (file: File) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    setPhotoUploadError(null);

    try {
      // 1. Fast client compression to max 500x500 JPEG (~50-80KB)
      const { blob, dataUrl } = await new Promise<{ blob: Blob; dataUrl: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
          const img = new Image();
          img.onerror = reject;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 500;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve({ blob: file, dataUrl: reader.result as string });
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            canvas.toBlob(
              (b) => {
                resolve({ blob: b || file, dataUrl: compressedDataUrl });
              },
              'image/jpeg',
              0.85
            );
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      });

      // Show immediate local preview
      setFormData((prev) => ({ ...prev, avatarUrl: dataUrl }));

      // 2. Upload to Cloud Supabase Storage
      const uploadData = new FormData();
      uploadData.append('avatar', blob, 'avatar.jpg');
      const res = await api.uploadAvatar(uploadData);
      if (res.data?.success && res.data.data?.avatarUrl) {
        setFormData((prev) => ({ ...prev, avatarUrl: res.data.data.avatarUrl }));
      }
    } catch (err: any) {
      console.warn('[PhotoUpload] Cloud upload fallback to compressed data URL:', err);
      // Even if direct upload has slow network, dataUrl is safely kept in avatarUrl
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Dynamic Password Strength Meter
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200', textClass: 'text-slate-400', hint: '' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8 && /[0-9]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    if (pass.length >= 10 && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', textClass: 'text-rose-600', hint: 'Add numbers & symbols' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', textClass: 'text-amber-600', hint: 'Good start, add capital letters' };
    if (score === 3) return { score: 3, label: 'Smart', color: 'bg-emerald-500', textClass: 'text-emerald-600', hint: 'Smart and secure password' };
    return { score: 4, label: 'Strong', color: 'bg-blue-600', textClass: 'text-blue-600', hint: 'Excellent high-security password' };
  };

  const passStrength = getPasswordStrength(formData.password);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!formData.username.trim() || formData.username.length < 3)
      errs.username = 'Username must be at least 3 alphanumeric characters';
    if (!formData.mobileNumber.trim()) errs.mobileNumber = 'Mobile number is required';
    if (!formData.rollNumber.trim()) errs.rollNumber = 'Roll number (SMIT ID) is required (e.g. WD-2026-004)';
    if (!formData.email.trim() || !formData.email.includes('@'))
      errs.email = 'Please provide a valid email address';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!formData.password || formData.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsLoading(true);
    try {
      const submissionData = { ...formData };
      if (!submissionData.avatarUrl || submissionData.avatarUrl.trim() === '') {
        submissionData.avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(submissionData.fullName || 'Student')}`;
      }

      await signup(submissionData);
      success('Student account created successfully! Welcome to the classroom.', 'Registration Complete');
      navigate('/student/dashboard');
    } catch (err: any) {
      const serverMsg =
        typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : err.response?.data?.error ||
            (Array.isArray(err.response?.data?.errors)
              ? err.response.data.errors.map((e: any) => e.message).join(', ')
              : null) ||
            err.message ||
            'Signup failed. Please check your information and try again.';
      error(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary-100/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-secondary-100/25 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container - Full-size & Spacious */}
      <div className="max-w-4xl w-full mx-auto relative z-10">
        {/* Top Header Navigation Bar with Back Button & Official Brand Logo */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/80">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-primary-600 hover:border-primary-300 shadow-xs hover:shadow-sm transition-all duration-200 text-sm font-bold group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </button>

          {/* Official SMIT Brand Logo (Consistent with Main Website) */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-secondary-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-xl font-black text-navy-900 tracking-tight leading-none block">SMIT Web Class</span>
              <span className="text-[11px] font-semibold text-primary-600 tracking-wider uppercase block mt-0.5">Web Development Cohort</span>
            </div>
          </Link>
        </div>

        {/* Stepper Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-primary-700 text-xs font-bold border border-blue-200/60 mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>Join Class Enrollment</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
            Create Student Account
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium max-w-lg mx-auto">
            Join the official SMIT Web Development cohort with your student credentials.
          </p>

          {/* Stepper Progress Badges */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {[
              { num: 1, label: 'Student Details' },
              { num: 2, label: 'Profile Picture' },
              { num: 3, label: 'Security & Password' },
            ].map(({ num, label }) => (
              <div key={num} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
                      step === num
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25 ring-4 ring-primary-100'
                        : step > num
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                  >
                    {step > num ? <Check className="w-4 h-4" /> : num}
                  </div>
                  <span
                    className={`text-xs font-bold hidden sm:inline ${
                      step === num ? 'text-primary-700' : step > num ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {num < 3 && (
                  <div
                    className={`w-8 sm:w-16 h-1 rounded-full transition-all ${
                      step > num ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Main Container (Full Size) */}
        <div className="bg-white rounded-3xl sm:rounded-4xl shadow-xl shadow-slate-200/50 border border-slate-200/90 p-8 sm:p-12 transition-all">
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-extrabold text-navy-900">Step 1: Student Information</h2>
                  <p className="text-xs text-slate-500 mt-1">Provide your official class enrollment and identity details.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Sarah Chen"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    error={errors.fullName}
                    leftIcon={<User className="w-4 h-4" />}
                  />

                  <Input
                    label="Username"
                    placeholder="e.g. sarahc"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    error={errors.username}
                    leftIcon={<User className="w-4 h-4" />}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Roll Number (SMIT ID) */}
                  <div className="space-y-1">
                    <Input
                      label="Roll Number (SMIT ID)"
                      placeholder="e.g. SMIT-2026-004 or WD-2026-004"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      error={errors.rollNumber}
                      leftIcon={<Hash className="w-4 h-4" />}
                    />
                    <p className="text-[11px] text-slate-400 font-medium pl-1">
                      Your permanent SMIT Student ID. Unique and used for official roll call.
                    </p>
                  </div>

                  <Input
                    label="Mobile Number"
                    type="tel"
                    placeholder="e.g. +92 300 1234567"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    error={errors.mobileNumber}
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. sarah.chen@student.smit.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleNextStep}
                    variant="primary"
                    size="lg"
                    className="font-bold shadow-md shadow-primary-500/20 px-8"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to Profile Picture
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Upload Profile Picture From Device */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-8 text-center"
              >
                <div className="text-left border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-extrabold text-navy-900">Step 2: Upload Profile Picture</h2>
                  <p className="text-xs text-slate-500 mt-1">Upload your official photo so instructors and peers can identify you.</p>
                </div>

                {/* Avatar Preview */}
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <Avatar
                      src={formData.avatarUrl}
                      name={formData.fullName || 'Student'}
                      size="xl"
                      className="ring-4 ring-primary-100 shadow-xl w-32 h-32 text-4xl"
                    />
                    <label className="absolute -bottom-1 -right-1 w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary-700 transition">
                      <Camera className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        disabled={isUploadingPhoto}
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handlePhotoSelected(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <span className="text-sm font-bold text-navy-900 mt-4">{formData.fullName || 'Student Name'}</span>
                  <span className="text-xs text-slate-500 font-medium">{formData.rollNumber || 'SMIT ID'}</span>
                </div>

                {/* Upload Box */}
                <div className="p-8 bg-slate-50/80 rounded-3xl border-2 border-dashed border-slate-300 hover:border-primary-500 transition text-center space-y-4">
                  <Upload className="w-10 h-10 text-primary-600 mx-auto" />
                  <div>
                    <p className="text-sm font-extrabold text-navy-900">Upload Image from your Device</p>
                    <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP up to 10MB (Automatically optimized)</p>
                  </div>

                  <label className="inline-block">
                    <span className="px-5 py-2.5 bg-white border border-slate-200 hover:border-primary-500 text-primary-600 text-xs font-extrabold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2 hover:bg-blue-50/50 transition">
                      {isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin text-primary-600" /> : <Camera className="w-4 h-4" />}
                      {isUploadingPhoto ? 'Uploading to Cloud...' : 'Browse Device Files'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      disabled={isUploadingPhoto}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handlePhotoSelected(e.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  {formData.avatarUrl && (
                    <p className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1.5 pt-1">
                      <Check className="w-4 h-4" /> Photo ready for your profile
                    </p>
                  )}
                  {photoUploadError && (
                    <p className="text-xs font-bold text-rose-500 pt-1">{photoUploadError}</p>
                  )}
                </div>

                <div className="pt-4 flex justify-between">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    size="lg"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    variant="primary"
                    size="lg"
                    disabled={isUploadingPhoto}
                    isLoading={isUploadingPhoto}
                    className="font-bold shadow-md shadow-primary-500/20 px-8"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isUploadingPhoto ? 'Uploading Photo...' : 'Continue to Security'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Security & Passwords */}
            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-extrabold text-navy-900">Step 3: Security & Password</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Set a secure password for your student portal. Includes real-time strength signals.
                  </p>
                </div>

                {/* Create Password Input */}
                <div className="space-y-2">
                  <Input
                    label="Create Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter at least 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={errors.password}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-navy-900 focus:outline-none p-1 transition"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {/* Password Strength Signal Meter */}
                  {formData.password && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                          {passStrength.score >= 3 ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                          )}
                          Password Strength:
                        </span>
                        <span className={`font-black uppercase tracking-wider ${passStrength.textClass}`}>
                          {passStrength.label}
                        </span>
                      </div>

                      {/* 4 Visual Signal Bars */}
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map((barIndex) => (
                          <div
                            key={barIndex}
                            className={`h-full rounded-full transition-all duration-300 ${
                              passStrength.score >= barIndex ? passStrength.color : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>

                      {passStrength.hint && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Tip: {passStrength.hint}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-slate-400 hover:text-navy-900 focus:outline-none p-1 transition"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {formData.confirmPassword && (
                    <div className="pt-1 pl-1">
                      {formData.password === formData.confirmPassword ? (
                        <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Passwords match perfectly
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                          Passwords do not match yet
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-6 flex justify-between gap-4">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    variant="outline"
                    size="lg"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="font-bold shadow-lg shadow-primary-500/25 flex-1 py-3.5"
                    isLoading={isLoading}
                    rightIcon={<Check className="w-5 h-5" />}
                  >
                    Create Student Account
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-extrabold text-primary-600 hover:text-primary-700 transition underline underline-offset-2">
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
