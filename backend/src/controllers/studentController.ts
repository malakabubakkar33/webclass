import { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

export class StudentController {
  /**
   * Get all students with attendance summary and progress (Teacher only)
   */
  public static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }

      try {
        await db.ensureSynced();
      } catch (e) {}

      const students = db.users
        .filter(u => u.role === 'student')
        .map(u => {
          const profile = db.student_profiles.find(sp => sp.user_id === u.id);
          const studentAttendance = db.attendance.filter(a => a.student_id === u.id);
          const totalClasses = studentAttendance.length;
          const presentCount = studentAttendance.filter(a => a.status === 'present').length;
          const attendancePercent = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

          const completedLessons = db.video_progress.filter(vp => vp.student_id === u.id && vp.completed).length;

          return {
            id: u.id,
            fullName: profile ? profile.full_name : u.username,
            username: u.username,
            email: u.email,
            mobileNumber: profile ? profile.mobile_number : 'N/A',
            rollNumber: profile ? profile.roll_number : 'N/A',
            avatarUrl: profile ? profile.avatar_url : '',
            isActive: u.is_active,
            showOnPublicDirectory: profile?.show_on_public_directory !== false,
            attendancePercent,
            totalClasses,
            presentCount,
            completedLessons,
            joinedDate: u.created_at,
          };
        })
        .sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());

      res.json({
        success: true,
        data: students,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Toggle student account active/disabled status (Teacher only)
   */
  public static async toggleStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const rawId = req.params.id;
      const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
      const student = db.users.find(u => u.id === id && u.role === 'student');
      if (!student) {
        res.status(404).json({ success: false, message: 'Student account not found' });
        return;
      }

      student.is_active = !student.is_active;
      student.updated_at = new Date().toISOString();
      db.save();

      res.json({
        success: true,
        message: `Student account ${student.is_active ? 'enabled' : 'disabled'} successfully`,
        data: { isActive: student.is_active },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Update student details (Teacher only)
   */
  public static async updateStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const rawId = req.params.id;
      const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
      const { fullName, rollNumber, mobileNumber, email } = req.body;

      const student = db.users.find(u => u.id === id && u.role === 'student');
      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }

      if (email && email !== student.email) {
        if (db.users.some(u => u.id !== id && u.email.toLowerCase() === email.toLowerCase())) {
          res.status(400).json({ success: false, message: 'Email is already used by another user' });
          return;
        }
        student.email = email;
      }

      const profile = db.student_profiles.find(sp => sp.user_id === id);
      if (profile) {
        if (fullName) profile.full_name = fullName;
        if (rollNumber) profile.roll_number = rollNumber;
        if (mobileNumber) profile.mobile_number = mobileNumber;
        if (email) profile.email = email;
        profile.updated_at = new Date().toISOString();
      }

      student.updated_at = new Date().toISOString();
      db.save();

      res.json({
        success: true,
        message: 'Student details updated successfully',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Toggle student visibility on public directory (Teacher only)
   */
  public static async togglePublicVisibility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const rawId = req.params.id;
      const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
      const profile = db.student_profiles.find(sp => sp.user_id === id);
      if (!profile) {
        res.status(404).json({ success: false, message: 'Student profile not found' });
        return;
      }

      profile.show_on_public_directory = profile.show_on_public_directory === false ? true : false;
      profile.updated_at = new Date().toISOString();
      db.save();

      res.json({
        success: true,
        message: `Student public directory visibility set to ${profile.show_on_public_directory ? 'visible' : 'hidden'}`,
        data: { showOnPublicDirectory: profile.show_on_public_directory },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Get single student detailed profile & progress (Teacher only)
   */
  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const rawId = req.params.id;
      const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
      const user = db.users.find(u => u.id === id && u.role === 'student');
      if (!user) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }
      const profile = db.student_profiles.find(sp => sp.user_id === id);
      const attendanceRecords = db.attendance
        .filter(a => a.student_id === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const totalClasses = attendanceRecords.length;
      const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
      const attendancePercent = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

      const progressRecords = db.video_progress.filter(vp => vp.student_id === id);
      const completedLessons = progressRecords.filter(vp => vp.completed).length;

      const courseBreakdown = db.courses.map(course => {
        const courseVideos = db.videos.filter(v => v.course_id === course.id);
        const completedInCourse = courseVideos.filter(v =>
          progressRecords.some(vp => vp.video_id === v.id && vp.completed)
        ).length;
        return {
          courseId: course.id,
          title: course.title,
          totalVideos: courseVideos.length,
          completedVideos: completedInCourse,
          progressPercent: courseVideos.length > 0 ? Math.round((completedInCourse / courseVideos.length) * 100) : 0,
        };
      });

      const recentActivities = db.activity_logs
        .filter(l => l.actor_user_id === id)
        .slice(0, 10);

      res.json({
        success: true,
        data: {
          student: {
            id: user.id,
            fullName: profile ? profile.full_name : user.username,
            username: user.username,
            email: user.email,
            mobileNumber: profile ? profile.mobile_number : 'N/A',
            rollNumber: profile ? profile.roll_number : 'N/A',
            avatarUrl: profile ? profile.avatar_url : '',
            isActive: user.is_active,
            joinedDate: user.created_at,
            showOnPublicDirectory: profile?.show_on_public_directory !== false,
          },
          attendanceSummary: {
            totalClasses,
            presentCount,
            absentCount: totalClasses - presentCount,
            attendancePercent,
            records: attendanceRecords,
          },
          learningProgress: {
            completedLessons,
            courses: courseBreakdown,
          },
          recentActivities,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Enroll a new student directly (Teacher only)
   */
  public static async createStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const { fullName, rollNumber, email, mobileNumber, password } = req.body;
      if (!fullName || !rollNumber || !email) {
        res.status(400).json({ success: false, message: 'Full name, roll number, and email are required.' });
        return;
      }

      // Generate a clean alphanumeric username
      const rawUsername = (fullName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + rollNumber.toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 20);
      const username = rawUsername.length >= 3 ? rawUsername : `student_${Date.now().toString().slice(-4)}`;

      const { AuthService } = await import('../services/authService.js');
      const result = await AuthService.registerStudent({
        fullName: fullName.trim(),
        username,
        rollNumber: rollNumber.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        mobileNumber: (mobileNumber || '03001234567').trim(),
        password: password || 'Smit@12345',
      });

      res.status(201).json({
        success: true,
        message: 'Student enrolled successfully',
        data: result.user,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to enroll student' });
    }
  }

  /**
   * Drop / Expel a student from class due to low attendance (< 65%)
   */
  public static async dropStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const rawId = req.params.id;
      const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
      const { reason } = req.body;

      const user = db.users.find(u => u.id === id && u.role === 'student');
      if (!user) {
        res.status(404).json({ success: false, message: 'Student account not found' });
        return;
      }

      const profile = db.student_profiles.find(sp => sp.user_id === id);
      const dropReason = reason || 'Enrollment terminated due to critical attendance deficit (<65%). Contact instructor Sir Tatheer for appeal.';

      user.is_active = false;
      user.is_dropped = true;
      user.dropped_reason = dropReason;
      user.dropped_at = new Date().toISOString();
      user.updated_at = new Date().toISOString();

      if (profile) {
        profile.is_dropped = true;
        profile.dropped_reason = dropReason;
        profile.dropped_at = user.dropped_at;
        profile.updated_at = user.updated_at;
      }

      db.logActivity({
        actor_user_id: req.user.userId,
        event_type: 'STUDENT_REGISTERED',
        title: 'Student Dropped from Class',
        description: `${profile?.full_name || user.username} was dropped from class due to critical attendance deficit (<65%).`,
        reference_type: 'student',
        reference_id: user.id,
      });

      db.save();

      res.json({
        success: true,
        message: `${profile?.full_name || user.username} has been dropped and removed from class enrollment.`,
        data: { id: user.id, isDropped: true, isActive: false },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to drop student' });
    }
  }

  /**
   * Send institutional attendance warning notification to student
   */
  public static async sendAttendanceWarning(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const rawId = req.params.id;
      const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
      const { percent } = req.body;

      const user = db.users.find(u => u.id === id && u.role === 'student');
      if (!user) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }

      const profile = db.student_profiles.find(sp => sp.user_id === id);
      const { NotificationService } = await import('../services/notificationService.js');
      const teacherName = db.teacher_profiles[0]?.full_name || 'Sir Tatheer';

      await NotificationService.createNotification(
        id,
        'attendance_warning',
        '⚠️ Critical Attendance Warning - Action Required',
        `Your class attendance is currently at ${percent || 60}%. Institutional policy requires at least 70% attendance for graduation eligibility. Students with attendance below 65% are subject to class expulsion. Please attend every Monday & Tuesday session (4:00 PM – 6:00 PM). - ${teacherName}`,
        'attendance',
        id
      );

      db.save();

      res.json({
        success: true,
        message: `Attendance warning successfully dispatched to ${profile?.full_name || user.username}.`,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Failed to send warning' });
    }
  }
}
