import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { SupabaseDbService } from './supabaseDbService.js';
import { User, StudentProfile, TeacherProfile, PasswordReset } from '../models/types.js';
import { signToken, TokenPayload } from '../utils/jwt.js';
import { NotificationService } from './notificationService.js';
import { EmailService } from './emailService.js';
import { StorageService } from './storageService.js';

export interface StudentSignupInput {
  fullName: string;
  username: string;
  mobileNumber: string;
  rollNumber: string;
  email: string;
  avatarUrl?: string;
  password: string;
}

export class AuthService {
  /**
   * Unified login for both Teacher and Student.
   * Accepts username, roll number (for student), or email.
   * Queries Supabase PostgreSQL with local cache fallback.
   */
  public static async login(identifier: string, password: string): Promise<{
    token: string;
    user: {
      id: string;
      role: 'student' | 'teacher';
      username: string;
      email: string;
      fullName: string;
      avatarUrl: string;
      rollNumber?: string;
      isDropped?: boolean;
      droppedReason?: string;
    };
  }> {
    const trimmedId = identifier.trim();

    // 0. Primary query: Supabase PostgreSQL
    let user: User | null = null;
    let studentProfile: StudentProfile | null = null;
    let teacherProfile: TeacherProfile | null = null;

    if (SupabaseDbService.isConnected()) {
      try {
        user = await SupabaseDbService.findUserByIdentifier(trimmedId);
        if (user) {
          if (user.role === 'student') {
            studentProfile = await SupabaseDbService.getStudentProfile(user.id);
          } else {
            teacherProfile = await SupabaseDbService.getTeacherProfile(user.id);
          }
        }
      } catch (e: any) {
        console.warn('[AuthService] Supabase user query notice:', e?.message || e);
      }
    }

    // Fallback: Local database store
    if (!user) {
      // 1. Direct match on username or email in db.users (Case insensitive)
      user = db.users.find(
        u => u.username.toLowerCase() === trimmedId.toLowerCase() ||
             u.email.toLowerCase() === trimmedId.toLowerCase()
      ) || null;

      // 1b. Allow 'teacher' or 'admin' alias to match teacher account
      if (!user && (trimmedId.toLowerCase() === 'teacher' || trimmedId.toLowerCase() === 'admin')) {
        user = db.users.find(u => u.role === 'teacher') || null;
      }

      // 2. If not found, match on student roll number, profile email, or profile username
      if (!user) {
        const sp = db.student_profiles.find(
          p => (p.roll_number && p.roll_number.trim().toLowerCase() === trimmedId.toLowerCase()) ||
               (p.email && p.email.trim().toLowerCase() === trimmedId.toLowerCase()) ||
               (p.username && p.username.trim().toLowerCase() === trimmedId.toLowerCase())
        );
        if (sp) {
          user = db.users.find(u => u.id === sp.user_id) || null;
        }
      }

      // 3. Fallback: match roll number ignoring formatting differences (e.g. WD-2026-001 vs WD2026001)
      if (!user) {
        const cleanId = trimmedId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (cleanId.length >= 4) {
          const sp = db.student_profiles.find(p => {
            if (!p.roll_number) return false;
            const cleanRoll = p.roll_number.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return cleanRoll === cleanId;
          });
          if (sp) {
            user = db.users.find(u => u.id === sp.user_id) || null;
          }
        }
      }
    }

    if (!user) {
      throw new Error('No registered account found with this username, roll number, or email. Please check your spelling or register.');
    }

    if (!user.is_active) {
      if (user.is_dropped) {
        throw new Error(`CLASS EXPULSION NOTICE: Your enrollment has been terminated. ${user.dropped_reason || 'Critical attendance deficit (<65%).'} Contact instructor Sir Tatheer for appeal.`);
      }
      throw new Error('Your account is currently disabled. Please contact your instructor.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Incorrect password. Please verify your password or use the Forgot Password link to reset it.');
    }

    let fullName = user.username;
    let avatarUrl = '';
    let rollNumber: string | undefined = undefined;

    if (user.role === 'student') {
      const sp = studentProfile || db.student_profiles.find(p => p.user_id === user!.id);
      if (sp) {
        fullName = sp.full_name;
        avatarUrl = sp.avatar_url;
        rollNumber = sp.roll_number;
      }
    } else {
      const tp = teacherProfile || db.teacher_profiles.find(p => p.user_id === user!.id) || db.teacher_profiles[0];
      if (tp) {
        fullName = tp.full_name;
        avatarUrl = tp.avatar_url;
      }
    }

    const payload: TokenPayload = {
      userId: user.id,
      role: user.role,
      username: user.username,
      email: user.email,
    };

    const token = signToken(payload);

    return {
      token,
      user: {
        id: user.id,
        role: user.role,
        username: user.username,
        email: user.email,
        fullName,
        avatarUrl,
        rollNumber,
        isDropped: !!user.is_dropped,
        droppedReason: user.dropped_reason,
      },
    };
  }

  /**
   * Student Signup (multi-step form completion)
   * Validates duplicate username, roll number, email, hashes password with bcrypt,
   * inserts into Supabase PostgreSQL database, generates JWT, and sets active session.
   */
  public static async registerStudent(input: StudentSignupInput) {
    const username = input.username.trim().toLowerCase();
    const email = input.email.trim().toLowerCase();
    const rollNumber = input.rollNumber.trim().toUpperCase();

    // 1. Validation for username uniqueness in Supabase & local
    if (SupabaseDbService.isConnected()) {
      try {
        const existing = await SupabaseDbService.findUserByIdentifier(username);
        if (existing) {
          throw new Error(`The username "${input.username}" is already taken. Please choose another username.`);
        }
      } catch (e: any) {
        if (e.message && e.message.includes('already taken')) throw e;
      }
    }
    if (db.users.some(u => u.username.toLowerCase() === username)) {
      throw new Error(`The username "${input.username}" is already taken. Please choose another username.`);
    }

    // 2. Validation for email uniqueness in Supabase & local
    if (SupabaseDbService.isConnected()) {
      try {
        const existing = await SupabaseDbService.findUserByIdentifier(email);
        if (existing) {
          throw new Error(`The email address "${input.email}" is already registered. Please sign in or use another email.`);
        }
      } catch (e: any) {
        if (e.message && e.message.includes('already registered')) throw e;
      }
    }
    if (db.users.some(u => u.email.toLowerCase() === email)) {
      throw new Error(`The email address "${input.email}" is already registered. Please sign in or use another email.`);
    }

    // 3. Strict unique roll number check in Supabase & local
    if (SupabaseDbService.isConnected()) {
      try {
        const existing = await SupabaseDbService.findUserByIdentifier(rollNumber);
        if (existing) {
          throw new Error(`Roll Number "${input.rollNumber.trim()}" is already registered. An account with this roll number already exists. Each student must have a unique institutional roll number.`);
        }
      } catch (e: any) {
        if (e.message && e.message.includes('already registered')) throw e;
      }
    }
    const cleanNewRoll = rollNumber.replace(/[^a-zA-Z0-9]/g, '');
    const isRollTaken = db.student_profiles.some(p => {
      if (!p.roll_number) return false;
      const cleanExisting = p.roll_number.trim().toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
      return cleanExisting === cleanNewRoll;
    });

    if (isRollTaken) {
      throw new Error(`Roll Number "${input.rollNumber.trim()}" is already registered. An account with this roll number already exists. Each student must have a unique institutional roll number.`);
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(input.password, salt);

    const userId = uuidv4();
    const newUser: User = {
      id: userId,
      role: 'student',
      username,
      email,
      password_hash,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let finalAvatarUrl = input.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(input.fullName)}`;

    // Convert any direct base64 data URI to permanent Supabase Storage URL
    if (finalAvatarUrl && finalAvatarUrl.startsWith('data:image/')) {
      try {
        const matches = finalAvatarUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = mimeType.split('/')[1] || 'jpg';
          const destinationPath = `avatar-${uuidv4()}.${ext}`;
          const uploaded = await StorageService.uploadBuffer('avatars', buffer, destinationPath, mimeType);
          if (uploaded && uploaded.url) {
            finalAvatarUrl = uploaded.url;
          }
        }
      } catch (uploadErr) {
        console.warn('[AuthService] Base64 avatar conversion warning:', uploadErr);
      }
    }

    const newProfile: StudentProfile = {
      id: uuidv4(),
      user_id: userId,
      full_name: input.fullName.trim(),
      username,
      email,
      mobile_number: input.mobileNumber.trim(),
      roll_number: rollNumber,
      avatar_url: finalAvatarUrl,
      show_on_public_directory: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 4. Insert directly into Supabase PostgreSQL for permanent cloud storage
    if (SupabaseDbService.isConnected()) {
      try {
        await SupabaseDbService.insertStudent(newUser, newProfile);
        console.log(`[AuthService] Successfully persisted student in Supabase PostgreSQL: ${username} (${rollNumber})`);
      } catch (err: any) {
        console.error('[AuthService] Supabase student insert failed:', err.message);
        throw new Error(`Database registration failed: ${err.message}. Please check your details and try again.`);
      }
    }

    // Always keep in-memory / local sync
    db.users.push(newUser);
    db.student_profiles.push(newProfile);
    db.save();

    // Send welcome notification
    await NotificationService.createNotification(
      userId,
      'system',
      'Welcome to SMIT Web Class!',
      `Hello ${input.fullName}, your student account is active. Start exploring your courses today!`,
      'course',
      'course-html'
    );

    db.logActivity({
      actor_user_id: userId,
      event_type: 'STUDENT_REGISTERED',
      title: 'New Student Enrolled',
      description: `${input.fullName} joined the class with roll ${rollNumber}.`,
      reference_type: 'student',
      reference_id: userId,
    });

    const token = signToken({
      userId: newUser.id,
      role: 'student',
      username: newUser.username,
      email: newUser.email,
    });

    return {
      token,
      user: {
        id: newUser.id,
        role: newUser.role,
        username: newUser.username,
        email: newUser.email,
        fullName: newProfile.full_name,
        avatarUrl: newProfile.avatar_url,
        rollNumber: newProfile.roll_number,
      },
    };
  }

  /**
   * Get authenticated user profile details
   */
  /**
   * Get authenticated user profile details
   */
  public static async getProfile(userId: string) {
    let user = db.users.find(u => u.id === userId);

    if (SupabaseDbService.isConnected()) {
      try {
        const supaUser = await SupabaseDbService.getUserById(userId);
        if (supaUser) {
          user = supaUser;
          if (!db.users.some(u => u.id === supaUser.id)) {
            db.users.push(supaUser);
          }
        }
      } catch (err) {
        console.warn('[AuthService] Could not fetch user from Supabase, falling back to local:', err);
      }
    }

    if (!user) throw new Error('User not found');

    if (user.role === 'student') {
      let profile: StudentProfile | null = null;
      if (SupabaseDbService.isConnected()) {
        try {
          profile = await SupabaseDbService.getStudentProfile(userId);
        } catch (err) {
          console.warn('[AuthService] Supabase student profile error:', err);
        }
      }
      if (!profile) {
        profile = db.student_profiles.find(p => p.user_id === userId) ||
                  db.student_profiles.find(p => p.email.toLowerCase() === user!.email.toLowerCase()) ||
                  null;
      }
      return {
        id: user.id,
        role: user.role,
        username: user.username,
        email: user.email,
        is_dropped: !!user.is_dropped || !!profile?.is_dropped,
        dropped_reason: user.dropped_reason || profile?.dropped_reason,
        profile: profile || null,
      };
    } else {
      let profile: TeacherProfile | null = null;
      if (SupabaseDbService.isConnected()) {
        try {
          profile = await SupabaseDbService.getTeacherProfile(userId);
        } catch (err) {
          console.warn('[AuthService] Supabase teacher profile error:', err);
        }
      }
      if (!profile) {
        profile = db.teacher_profiles.find(p => p.user_id === userId) || db.teacher_profiles[0] || null;
      }
      return {
        id: user.id,
        role: user.role,
        username: user.username,
        email: user.email,
        profile: profile || null,
      };
    }
  }

  /**
   * Update Profile
   */
  public static async updateProfile(
    userId: string,
    updates: { fullName?: string; mobileNumber?: string; avatarUrl?: string; bio?: string }
  ) {
    let user = db.users.find(u => u.id === userId);
    if (SupabaseDbService.isConnected()) {
      try {
        const supaUser = await SupabaseDbService.getUserById(userId);
        if (supaUser) user = supaUser;
      } catch (err) {
        console.warn('[AuthService] getUserById error in updateProfile:', err);
      }
    }
    if (!user) throw new Error('User not found');

    if (user.role === 'student') {
      const supaUpdates: Partial<StudentProfile> = {};
      if (updates.fullName !== undefined) supaUpdates.full_name = updates.fullName;
      if (updates.mobileNumber !== undefined) supaUpdates.mobile_number = updates.mobileNumber;
      if (updates.avatarUrl !== undefined) supaUpdates.avatar_url = updates.avatarUrl;

      if (SupabaseDbService.isConnected() && Object.keys(supaUpdates).length > 0) {
        try {
          await SupabaseDbService.updateStudentProfile(userId, supaUpdates);
        } catch (err) {
          console.error('[AuthService] Failed to update student profile in Supabase:', err);
        }
      }

      let profile = db.student_profiles.find(p => p.user_id === userId);
      if (!profile) {
        profile = db.student_profiles.find(p => p.email.toLowerCase() === user!.email.toLowerCase());
      }
      if (profile) {
        if (updates.fullName !== undefined) profile.full_name = updates.fullName;
        if (updates.mobileNumber !== undefined) profile.mobile_number = updates.mobileNumber;
        if (updates.avatarUrl !== undefined) profile.avatar_url = updates.avatarUrl;
        profile.updated_at = new Date().toISOString();
      } else {
        profile = {
          id: uuidv4(),
          user_id: user.id,
          full_name: updates.fullName || user.username,
          username: user.username,
          email: user.email,
          mobile_number: updates.mobileNumber || '',
          roll_number: 'WD-' + user.username.slice(0, 4).toUpperCase(),
          avatar_url: updates.avatarUrl || '',
          show_on_public_directory: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.student_profiles.push(profile);
      }
    } else {
      const supaUpdates: Partial<TeacherProfile> = {};
      if (updates.fullName !== undefined) supaUpdates.full_name = updates.fullName;
      if (updates.mobileNumber !== undefined) supaUpdates.mobile_number = updates.mobileNumber;
      if (updates.avatarUrl !== undefined) supaUpdates.avatar_url = updates.avatarUrl;
      if (updates.bio !== undefined) supaUpdates.bio = updates.bio;

      if (SupabaseDbService.isConnected() && Object.keys(supaUpdates).length > 0) {
        try {
          await SupabaseDbService.updateTeacherProfile(userId, supaUpdates);
        } catch (err) {
          console.error('[AuthService] Failed to update teacher profile in Supabase:', err);
        }
      }

      const profile = db.teacher_profiles.find(p => p.user_id === userId) || db.teacher_profiles[0];
      if (profile) {
        if (updates.fullName !== undefined) profile.full_name = updates.fullName;
        if (updates.mobileNumber !== undefined) profile.mobile_number = updates.mobileNumber;
        if (updates.avatarUrl !== undefined) profile.avatar_url = updates.avatarUrl;
        if (updates.bio !== undefined) profile.bio = updates.bio;
        profile.updated_at = new Date().toISOString();
      }
    }

    db.save();
    return this.getProfile(userId);
  }


  /**
   * Change password
   */
  public static async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(oldPass, user.password_hash);
    if (!isMatch) throw new Error('Current password is incorrect.');

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPass, salt);
    user.updated_at = new Date().toISOString();
    db.save();
    return true;
  }

  /**
   * Step 1: Request 5-digit OTP sent to user's Gmail/Email
   */
  public static async generatePasswordResetOtp(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }

    const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error(`No registered student or instructor account found with the email "${email}". Please verify your email.`);
    }

    if (user.is_active === false) {
      throw new Error('This account has been deactivated. Please contact your instructor.');
    }

    // Generate strict 5-digit numeric OTP (10000 - 99999)
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Invalidate prior unused OTPs for this email
    db.password_resets.forEach(pr => {
      if (pr.email && pr.email.toLowerCase() === cleanEmail && !pr.used) {
        pr.used = true;
      }
    });

    const resetRecord: PasswordReset = {
      id: uuidv4(),
      user_id: user.id,
      email: cleanEmail,
      otp,
      token: otp,
      expires_at: expiresAt,
      used: false,
      created_at: new Date().toISOString(),
    };

    db.password_resets.push(resetRecord);
    db.save();

    // Find display name for professional greeting
    let userName = user.username;
    if (user.role === 'student') {
      const sp = db.student_profiles.find(p => p.user_id === user.id);
      if (sp) userName = sp.full_name;
    } else {
      const tp = db.teacher_profiles.find(p => p.user_id === user.id) || db.teacher_profiles[0];
      if (tp) userName = tp.full_name;
    }

    // Send the real email via EmailService
    const emailResult = await EmailService.sendPasswordResetOtp({
      to: cleanEmail,
      otp,
      userName,
    });

    return {
      success: true,
      message:
        emailResult.destination && emailResult.destination !== cleanEmail
          ? `Verification code dispatched to ${emailResult.destination} (Resend Sandbox). Please check your Gmail inbox.`
          : `A 5-digit verification code has been dispatched to ${cleanEmail}. Please check your Gmail inbox.`,
      email: cleanEmail,
      delivered: emailResult.delivered,
      destination: emailResult.destination || cleanEmail,
    };
  }

  /**
   * Step 2: Verify 5-digit OTP and reset password
   */
  public static async verifyOtpAndResetPassword(email: string, otp: string, newPass: string) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail) {
      throw new Error('Email is required.');
    }
    if (!cleanOtp || cleanOtp.length !== 5 || !/^\d{5}$/.test(cleanOtp)) {
      throw new Error('Please enter a valid 5-digit verification code.');
    }
    if (!newPass || newPass.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const resetRecord = db.password_resets.find(
      pr => pr.email && pr.email.toLowerCase() === cleanEmail &&
            pr.otp === cleanOtp &&
            !pr.used &&
            new Date(pr.expires_at).getTime() > Date.now()
    );

    if (!resetRecord) {
      throw new Error('Invalid or expired 5-digit verification code. Please request a new code.');
    }

    const user = db.users.find(u => u.id === resetRecord.user_id || u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('Associated user account was not found.');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPass, salt);
    user.updated_at = new Date().toISOString();

    // Mark OTP as used
    resetRecord.used = true;

    db.logActivity({
      actor_user_id: user.id,
      event_type: 'USER_PASSWORD_RESET',
      title: 'Password Reset Via 5-Digit OTP',
      description: `${user.username} (${user.role}) successfully reset their account password via email verification code.`,
      reference_type: 'user',
      reference_id: user.id,
    });

    db.save();

    return {
      success: true,
      message: 'Password updated successfully! You can now sign in with your new credentials.',
    };
  }

  /**
   * Separate Step: Verify 5-digit OTP without changing password yet
   */
  public static async verifyOtp(email: string, otp: string) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail) {
      throw new Error('Email is required.');
    }
    if (!cleanOtp || cleanOtp.length !== 5 || !/^\d{5}$/.test(cleanOtp)) {
      throw new Error('Please enter a valid 5-digit verification code.');
    }

    const resetRecord = db.password_resets.find(
      pr => pr.email && pr.email.toLowerCase() === cleanEmail &&
            pr.otp === cleanOtp &&
            !pr.used &&
            new Date(pr.expires_at).getTime() > Date.now()
    );

    if (!resetRecord) {
      throw new Error('Invalid or expired 5-digit verification code. Please request a new code.');
    }

    return {
      success: true,
      message: 'Verification code confirmed. You can now set your new password.',
    };
  }
}
