import { Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendanceService.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { db } from '../config/database.js';

export class AttendanceController {
  /**
   * Teacher starts/broadcasts a live attendance session
   */
  public static async startSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }

      const { date, message } = req.body;
      const sessionDate = date || new Date().toISOString().split('T')[0];
      const session = await AttendanceService.startSession(req.user.userId, sessionDate, message);

      res.json({
        success: true,
        message: 'Attendance request sent to all students!',
        data: session,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Get currently active attendance session
   */
  public static async getActiveSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = AttendanceService.getActiveSession(req.user.userId, req.user.role);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Student accepts attendance request
   */
  public static async acceptSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'student') {
        res.status(403).json({ success: false, message: 'Student access required' });
        return;
      }

      const { sessionId } = req.body;
      if (!sessionId) {
        res.status(400).json({ success: false, message: 'sessionId is required' });
        return;
      }

      const result = await AttendanceService.studentAcceptRequest(req.user.userId, sessionId);
      res.json({
        success: true,
        message: 'Attendance request accepted! You are marked Present for today’s session. 🎉',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Teacher marks student present from active session
   */
  public static async approveStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }

      const { sessionId, studentId } = req.body;
      if (!sessionId || !studentId) {
        res.status(400).json({ success: false, message: 'sessionId and studentId are required' });
        return;
      }

      const result = await AttendanceService.teacherApproveStudent(req.user.userId, sessionId, studentId);
      res.json({
        success: true,
        message: 'Student attendance marked as Present!',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Teacher marks all accepted students as present
   */
  public static async approveAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }

      const { sessionId } = req.body;
      if (!sessionId) {
        res.status(400).json({ success: false, message: 'sessionId is required' });
        return;
      }

      const result = await AttendanceService.teacherApproveAllAccepted(req.user.userId, sessionId);
      res.json({
        success: true,
        message: `Marked ${result.approvedCount} students as Present!`,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Teacher closes active attendance session
   */
  public static async closeSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }

      const { sessionId } = req.body;
      if (!sessionId) {
        res.status(400).json({ success: false, message: 'sessionId is required' });
        return;
      }

      const session = await AttendanceService.closeSession(req.user.userId, sessionId);
      res.json({
        success: true,
        message: 'Attendance session closed.',
        data: session,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getByDate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const { date } = req.query;
      if (!date || typeof date !== 'string') {
        res.status(400).json({ success: false, message: 'date query parameter is required (YYYY-MM-DD)' });
        return;
      }

      const result = AttendanceService.getAttendanceByDate(date);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async saveAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const { date, records } = req.body;
      if (!date || !Array.isArray(records)) {
        res.status(400).json({ success: false, message: 'date and records array are required' });
        return;
      }

      const saved = await AttendanceService.saveClassAttendance(req.user.userId, date, records);

      db.logActivity({
        actor_user_id: req.user.userId,
        event_type: 'ATTENDANCE_MARKED',
        title: 'Class Attendance Recorded',
        description: `Recorded attendance for ${records.length} students on ${date} (4:00 PM - 6:00 PM).`,
        reference_type: 'attendance',
        reference_id: date,
      });

      res.json({
        success: true,
        message: 'Attendance saved successfully',
        data: saved,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getStudentSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const rawParam = req.params.studentId;
      const paramId = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      const studentId = req.user.role === 'student' ? req.user.userId : (paramId || req.user.userId);
      const summary = AttendanceService.getStudentAttendance(studentId);
      res.json({
        success: true,
        data: summary,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const history = AttendanceService.getAttendanceHistory();
      res.json({
        success: true,
        data: history,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
