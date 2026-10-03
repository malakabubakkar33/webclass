import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuthService, StudentSignupInput } from '../services/authService.js';
import { StorageService } from '../services/storageService.js';
import { loginSchema, signupSchema, changePasswordSchema, updateProfileSchema } from '../validators/authValidator.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, password } = loginSchema.parse(req.body);
      const result = await AuthService.login(identifier, password);
      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Login failed' });
    }
  }

  public static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = signupSchema.parse(req.body) as unknown as StudentSignupInput;
      const result = await AuthService.registerStudent(validated);
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Signup failed' });
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const profile = await AuthService.getProfile(req.user.userId);
      res.json({
        success: true,
        data: profile,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const validated = updateProfileSchema.parse(req.body);
      const updated = await AuthService.updateProfile(req.user.userId, validated);
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      await AuthService.changePassword(req.user.userId, currentPassword, newPassword);
      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  public static async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file || !req.file.buffer) {
        res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
        return;
      }
      const ext = path.extname(req.file.originalname) || '.png';
      const destinationPath = `avatar-${uuidv4()}${ext}`;

      const { url } = await StorageService.uploadBuffer(
        'avatars',
        req.file.buffer,
        destinationPath,
        req.file.mimetype || 'image/png'
      );

      res.json({
        success: true,
        message: 'Image uploaded successfully from your device',
        data: { avatarUrl: url },
      });
    } catch (err: any) {
      console.error('[UploadAvatar Error]:', err);
      res.status(500).json({ success: false, message: err.message || 'Avatar upload failed' });
    }
  }

  public static async getTeacherSetupStatus(req: Request, res: Response): Promise<void> {
    try {
      const { db } = await import('../config/database.js');
      const teacherUser = db.users.find(u => u.role === 'teacher');
      const teacherProfile = db.teacher_profiles[0];
      const isSetupCompleted = Boolean(teacherUser?.is_setup_completed || teacherProfile?.is_setup_completed);

      res.json({
        success: true,
        data: {
          isSetupCompleted,
          teacherName: teacherProfile ? teacherProfile.full_name : 'Prof. Alex Vance',
          username: teacherUser ? teacherUser.username : 'teacher',
          avatarUrl: teacherProfile ? teacherProfile.avatar_url : '',
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async setupTeacher(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, username, avatarUrl, password, confirmPassword } = req.body;
      if (!fullName || fullName.trim().length < 2) {
        res.status(400).json({ success: false, message: 'Full name must be at least 2 characters.' });
        return;
      }
      if (!username || username.trim().length < 3) {
        res.status(400).json({ success: false, message: 'Username must be at least 3 characters.' });
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        res.status(400).json({ success: false, message: 'Username can only contain letters, numbers, and underscores.' });
        return;
      }
      if (!password || password.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        res.status(400).json({ success: false, message: 'Passwords do not match.' });
        return;
      }

      const { db } = await import('../config/database.js');
      const bcrypt = (await import('bcryptjs')).default;
      const { signToken } = await import('../utils/jwt.js');

      let teacherUser = db.users.find(u => u.role === 'teacher');
      if (!teacherUser) {
        res.status(404).json({ success: false, message: 'Teacher account record not found in system.' });
        return;
      }

      // STRICT: Only one teacher account is allowed in the entire system.
      if (teacherUser.is_setup_completed) {
        res.status(403).json({
          success: false,
          message: 'Instructor account has already been initialized. Only one teacher account is permitted in this institution. Please sign in.',
        });
        return;
      }

      const cleanUsername = username.trim().toLowerCase();
      const existingUser = db.users.find(u => u.id !== teacherUser!.id && u.username.toLowerCase() === cleanUsername);
      if (existingUser) {
        res.status(400).json({ success: false, message: `The username "${username}" is already in use. Please select a unique username.` });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      teacherUser.username = cleanUsername;
      teacherUser.password_hash = passwordHash;
      teacherUser.is_setup_completed = true;
      teacherUser.updated_at = new Date().toISOString();

      let teacherProfile = db.teacher_profiles[0];
      const finalAvatar = avatarUrl?.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`;

      if (!teacherProfile) {
        teacherProfile = {
          id: 'teacher-profile-uuid',
          user_id: teacherUser.id,
          full_name: fullName.trim(),
          username: cleanUsername,
          email: teacherUser.email,
          mobile_number: '+1 (555) 019-2834',
          avatar_url: finalAvatar,
          bio: 'Lead Full-Stack Web Development Architect & Classroom Instructor with 12+ years of production experience.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_setup_completed: true,
        };
        db.teacher_profiles.push(teacherProfile);
      } else {
        teacherProfile.full_name = fullName.trim();
        teacherProfile.username = cleanUsername;
        teacherProfile.avatar_url = finalAvatar;
        teacherProfile.is_setup_completed = true;
        teacherProfile.updated_at = new Date().toISOString();
      }

      db.logActivity({
        actor_user_id: teacherUser.id,
        event_type: 'TEACHER_SETUP',
        title: 'Instructor Account Configured',
        description: `${fullName.trim()} (@${cleanUsername}) set up their instructor credentials.`,
        reference_type: 'teacher',
        reference_id: teacherUser.id,
      });

      db.save();

      const token = signToken({
        userId: teacherUser.id,
        role: 'teacher',
        username: teacherUser.username,
        email: teacherUser.email,
      });

      res.status(200).json({
        success: true,
        message: 'Teacher portal setup completed successfully!',
        data: {
          token,
          user: {
            id: teacherUser.id,
            role: 'teacher',
            username: teacherUser.username,
            fullName: teacherProfile.full_name,
            avatarUrl: teacherProfile.avatar_url,
            email: teacherUser.email,
            is_setup_completed: true,
          },
        },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Setup failed' });
    }
  }

  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
        return;
      }
      const result = await AuthService.generatePasswordResetOtp(email);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to send OTP.' });
    }
  }

  public static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        res.status(400).json({ success: false, message: 'Email and 5-digit verification code are required.' });
        return;
      }
      const result = await AuthService.verifyOtp(email, otp);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'OTP verification failed.' });
    }
  }

  public static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword, confirmPassword } = req.body;
      if (!email || !otp || !newPassword) {
        res.status(400).json({ success: false, message: 'Email, 5-digit verification code, and new password are required.' });
        return;
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        res.status(400).json({ success: false, message: 'Passwords do not match.' });
        return;
      }
      const result = await AuthService.verifyOtpAndResetPassword(email, otp, newPassword);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Password reset failed.' });
    }
  }
}
