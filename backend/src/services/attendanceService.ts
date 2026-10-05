import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import {
  Attendance,
  ClassDay,
  AttendanceStatus,
  AttendanceSession,
  AttendanceSessionResponse
} from '../models/types.js';
import { NotificationService } from './notificationService.js';

export class AttendanceService {
  /**
   * Validate that the date is a Monday or Tuesday
   */
  public static getClassDay(dateString: string): ClassDay | null {
    // Treat date as YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);

    const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday, 2 is Tuesday
    if (dayOfWeek === 1) return 'monday';
    if (dayOfWeek === 2) return 'tuesday';
    return null;
  }

  /**
   * Start / Broadcast an Attendance Session (Teacher sends attendance request)
   */
  public static async startSession(
    teacherId: string,
    dateString: string,
    message?: string
  ): Promise<AttendanceSession> {
    const classDay = this.getClassDay(dateString) || 'monday';

    // Close any previously active sessions
    db.attendance_sessions.forEach(s => {
      if (s.status === 'active') {
        s.status = 'closed';
        s.closed_at = new Date().toISOString();
      }
    });

    const newSession: AttendanceSession = {
      id: uuidv4(),
      date: dateString,
      class_day: classDay,
      start_time: '16:00',
      end_time: '18:00',
      status: 'active',
      initiated_by: teacherId,
      message: message || `Live Attendance Request for ${classDay.toUpperCase()} Session (4:00 PM - 6:00 PM)`,
      created_at: new Date().toISOString(),
      responses: [],
    };

    db.attendance_sessions.unshift(newSession);
    db.save();

    // Broadcast notification only to students NOT yet marked present for today
    const teacherName = db.teacher_profiles[0]?.full_name || 'Class Instructor';
    const activeUnverifiedStudents = db.users
      .filter(u => u.role === 'student' && u.is_active && !u.is_dropped)
      .filter(u => !db.attendance.some(a => a.student_id === u.id && a.date === dateString && a.status === 'present'));

    for (const student of activeUnverifiedStudents) {
      NotificationService.createNotification(
        student.id,
        'attendance_request',
        '📢 Class Attendance is Now Open!',
        `${teacherName} has requested attendance for today's ${classDay.toUpperCase()} class (4:00 PM - 6:00 PM). Please accept the request now to be marked present.`,
        'attendance_session',
        newSession.id
      ).catch(() => {});
    }

    // Log Activity
    db.logActivity({
      actor_user_id: teacherId,
      event_type: 'ATTENDANCE_MARKED',
      title: 'Attendance Request Broadcasted',
      description: `Teacher opened a live attendance session for ${classDay.toUpperCase()} (${dateString}) from 4:00 PM to 6:00 PM.`,
      reference_type: 'attendance_session',
      reference_id: newSession.id,
    });

    return newSession;
  }

  /**
   * Get the current active session, along with user context (if student)
   * Automatically expires after 20 minutes.
   */
  public static getActiveSession(userId?: string, role?: string) {
    const active = db.attendance_sessions.find(s => s.status === 'active');
    if (!active) return null;

    // 20 minutes validity window
    const sessionCreatedAt = new Date(active.created_at).getTime();
    const elapsedMs = Date.now() - sessionCreatedAt;
    const twentyMinsMs = 20 * 60 * 1000;

    if (elapsedMs >= twentyMinsMs) {
      active.status = 'closed';
      active.closed_at = new Date().toISOString();
      db.save();
      return null;
    }

    let studentResponse = null;
    let isAlreadyMarkedPresentToday = false;

    if (userId && role === 'student') {
      studentResponse = active.responses.find(r => r.student_id === userId) || null;

      // Check if student is marked present in db.attendance for this date
      const alreadyPresent = db.attendance.find(
        a => a.student_id === userId && a.date === active.date && a.status === 'present'
      );
      if (alreadyPresent) {
        isAlreadyMarkedPresentToday = true;
        if (!studentResponse) {
          studentResponse = {
            student_id: userId,
            student_name: 'Student',
            roll_number: 'N/A',
            avatar_url: '',
            status: 'approved',
            submitted_at: alreadyPresent.created_at || new Date().toISOString(),
            approved_at: alreadyPresent.updated_at || new Date().toISOString(),
          };
        }
      }
    }

    const remainingSeconds = Math.max(0, Math.floor((twentyMinsMs - elapsedMs) / 1000));

    return {
      session: active,
      studentResponse,
      remainingSeconds,
      isAlreadyMarkedPresentToday,
      totalResponses: active.responses.length,
      approvedCount: active.responses.filter(r => r.status === 'approved').length,
      pendingCount: active.responses.filter(r => r.status === 'submitted').length,
    };
  }

  /**
   * Student accepts attendance request - immediately marks Present and verifies
   */
  public static async studentAcceptRequest(
    studentId: string,
    sessionId: string
  ): Promise<{ session: AttendanceSession; response: AttendanceSessionResponse }> {
    let session = db.attendance_sessions.find(s => s.id === sessionId);
    if (!session || session.status !== 'active') {
      // Fallback: check if ANY session is currently active
      session = db.attendance_sessions.find(s => s.status === 'active');
    }

    if (!session) {
      throw new Error('No active attendance session found or session has expired.');
    }

    const sessionCreatedAt = new Date(session.created_at).getTime();
    if (Date.now() - sessionCreatedAt >= 20 * 60 * 1000) {
      session.status = 'closed';
      session.closed_at = new Date().toISOString();
      db.save();
      throw new Error('Attendance request has expired (20 minutes time limit exceeded).');
    }

    const student = db.users.find(u => u.id === studentId);
    if (!student) throw new Error('Student user not found.');

    const profile = db.student_profiles.find(sp => sp.user_id === studentId);
    const existing = session.responses.find(r => r.student_id === studentId);

    const dateString = session.date;
    const classDay = session.class_day;

    let response: AttendanceSessionResponse;

    if (existing) {
      existing.status = 'approved';
      if (!existing.approved_at) existing.approved_at = new Date().toISOString();
      response = existing;
    } else {
      response = {
        student_id: studentId,
        student_name: profile ? profile.full_name : student.username,
        roll_number: profile ? profile.roll_number : 'N/A',
        avatar_url: profile?.avatar_url || '',
        status: 'approved',
        submitted_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      };
      session.responses.unshift(response);
    }

    // Immediately record / update official attendance as present in db.attendance
    let existingAtt = db.attendance.find(
      a => a.student_id === studentId && a.date === dateString
    );

    if (existingAtt) {
      existingAtt.status = 'present';
      existingAtt.class_day = classDay;
      existingAtt.marked_by = session.initiated_by;
      existingAtt.updated_at = new Date().toISOString();
    } else {
      const newAtt: Attendance = {
        id: uuidv4(),
        student_id: studentId,
        date: dateString,
        class_day: classDay,
        status: 'present',
        marked_by: session.initiated_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.attendance.push(newAtt);
    }

    db.save();

    // Log activity
    db.logActivity({
      actor_user_id: studentId,
      event_type: 'ATTENDANCE_MARKED',
      title: 'Attendance Check-In Accepted',
      description: `${response.student_name} (${response.roll_number}) accepted live attendance request for ${classDay.toUpperCase()} (${dateString}) and was verified Present.`,
      reference_type: 'attendance',
      reference_id: dateString,
    });

    return { session, response };
  }

  /**
   * Teacher approves single student from session and marks present
   */
  public static async teacherApproveStudent(
    teacherId: string,
    sessionId: string,
    studentId: string
  ) {
    const session = db.attendance_sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Attendance session not found.');

    let resp = session.responses.find(r => r.student_id === studentId);
    if (!resp) {
      const student = db.users.find(u => u.id === studentId);
      const profile = db.student_profiles.find(sp => sp.user_id === studentId);
      resp = {
        student_id: studentId,
        student_name: profile ? profile.full_name : (student?.username || 'Student'),
        roll_number: profile ? profile.roll_number : 'N/A',
        avatar_url: profile?.avatar_url || '',
        status: 'approved',
        submitted_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      };
      session.responses.push(resp);
    } else {
      resp.status = 'approved';
      resp.approved_at = new Date().toISOString();
    }

    // Now record official attendance in db.attendance as present
    const dateString = session.date;
    const classDay = session.class_day;

    let existingAtt = db.attendance.find(
      a => a.student_id === studentId && a.date === dateString
    );

    if (existingAtt) {
      existingAtt.status = 'present';
      existingAtt.class_day = classDay;
      existingAtt.marked_by = teacherId;
      existingAtt.updated_at = new Date().toISOString();
    } else {
      const newAtt: Attendance = {
        id: uuidv4(),
        student_id: studentId,
        date: dateString,
        class_day: classDay,
        status: 'present',
        marked_by: teacherId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.attendance.push(newAtt);
    }

    db.save();

    // Notify student of verified attendance
    const teacherName = db.teacher_profiles[0]?.full_name || 'Class Instructor';
    NotificationService.createNotification(
      studentId,
      'attendance_marked',
      '✅ Attendance Verified Present',
      `Your attendance for ${classDay.toUpperCase()}, ${dateString} (4:00 PM - 6:00 PM) has been verified as PRESENT by ${teacherName}.`,
      'attendance',
      dateString
    ).catch(() => {});

    return { session, studentId, status: 'present' };
  }

  /**
   * Teacher marks all accepted/submitted students as Present
   */
  public static async teacherApproveAllAccepted(teacherId: string, sessionId: string) {
    const session = db.attendance_sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Attendance session not found.');

    const dateString = session.date;
    const classDay = session.class_day;
    const approvedStudentIds: string[] = [];
    const teacherName = db.teacher_profiles[0]?.full_name || 'Class Instructor';

    for (const resp of session.responses) {
      resp.status = 'approved';
      resp.approved_at = new Date().toISOString();
      approvedStudentIds.push(resp.student_id);

      let existingAtt = db.attendance.find(
        a => a.student_id === resp.student_id && a.date === dateString
      );

      if (existingAtt) {
        existingAtt.status = 'present';
        existingAtt.class_day = classDay;
        existingAtt.marked_by = teacherId;
        existingAtt.updated_at = new Date().toISOString();
      } else {
        const newAtt: Attendance = {
          id: uuidv4(),
          student_id: resp.student_id,
          date: dateString,
          class_day: classDay,
          status: 'present',
          marked_by: teacherId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.attendance.push(newAtt);
      }

      // Notify student
      NotificationService.createNotification(
        resp.student_id,
        'attendance_marked',
        '✅ Attendance Verified Present',
        `Your attendance for ${classDay.toUpperCase()}, ${dateString} (4:00 PM - 6:00 PM) has been verified as PRESENT by ${teacherName}.`,
        'attendance',
        dateString
      ).catch(() => {});
    }

    db.save();
    return { session, approvedCount: approvedStudentIds.length };
  }

  /**
   * Close active attendance session
   */
  public static async closeSession(teacherId: string, sessionId: string) {
    const session = db.attendance_sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found.');

    session.status = 'closed';
    session.closed_at = new Date().toISOString();
    db.save();

    return session;
  }

  /**
   * Teacher marks/saves attendance for a specific date (Monday or Tuesday)
   */
  public static async saveClassAttendance(
    teacherId: string,
    dateString: string,
    records: { studentId: string; status: AttendanceStatus }[]
  ): Promise<Attendance[]> {
    const classDay = this.getClassDay(dateString) || 'monday';

    const savedRecords: Attendance[] = [];

    for (const record of records) {
      // Find existing record for this student and date to prevent duplicates
      let existing = db.attendance.find(
        a => a.student_id === record.studentId && a.date === dateString
      );

      if (existing) {
        existing.status = record.status;
        existing.class_day = classDay;
        existing.marked_by = teacherId;
        existing.updated_at = new Date().toISOString();
        savedRecords.push(existing);
      } else {
        const newRecord: Attendance = {
          id: uuidv4(),
          student_id: record.studentId,
          date: dateString,
          class_day: classDay,
          status: record.status,
          marked_by: teacherId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.attendance.push(newRecord);
        savedRecords.push(newRecord);
      }

      // Notify student
      const displayStatus = record.status === 'present' ? 'Present' : record.status === 'leave' ? 'Leave' : 'Absent';
      NotificationService.createNotification(
        record.studentId,
        'attendance_marked',
        'Attendance Updated',
        `Your attendance for ${classDay.toUpperCase()}, ${dateString} (4:00 PM - 6:00 PM) has been marked as ${displayStatus}.`,
        'attendance',
        dateString
      ).catch(() => {});
    }

    db.save();
    return savedRecords;
  }

  /**
   * Get attendance for a specific date (for Teacher review)
   */
  public static getAttendanceByDate(dateString: string) {
    const records = db.attendance.filter(a => a.date === dateString);
    const allRecords = db.attendance;

    const students = db.users
      .filter(u => u.role === 'student')
      .map(u => {
        const profile = db.student_profiles.find(sp => sp.user_id === u.id);
        const record = records.find(r => r.student_id === u.id);

        // Compute cumulative attendance stats for this student across all sessions
        const studentHistory = allRecords.filter(a => a.student_id === u.id);
        const totalClasses = studentHistory.length;
        const presentCount = studentHistory.filter(r => r.status === 'present').length;
        const absentCount = studentHistory.filter(r => r.status === 'absent').length;
        const leaveCount = studentHistory.filter(r => r.status === 'leave').length;
        const countableSessions = Math.max(1, totalClasses - leaveCount);
        const cumulativePercentage = totalClasses > 0
          ? Math.round((presentCount / (totalClasses > leaveCount ? countableSessions : totalClasses)) * 100)
          : 100;

        return {
          studentId: u.id,
          fullName: profile ? profile.full_name : u.username,
          username: u.username,
          rollNumber: profile ? profile.roll_number : 'N/A',
          avatarUrl: profile ? profile.avatar_url : '',
          isActive: u.is_active,
          isDropped: !!u.is_dropped || !!profile?.is_dropped,
          droppedReason: u.dropped_reason || profile?.dropped_reason,
          status: record ? record.status : 'present', // Default to present
          isMarked: !!record,
          cumulativePercentage,
          totalClasses,
          presentCount,
          absentCount,
          leaveCount,
        };
      });

    return {
      date: dateString,
      classDay: this.getClassDay(dateString) || 'monday',
      students,
    };
  }

  /**
   * Get student's personal attendance summary and history (read-only for student)
   */
  public static getStudentAttendance(studentId: string) {
    const records = db.attendance
      .filter(a => a.student_id === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalClasses = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const leaveCount = records.filter(r => r.status === 'leave').length;
    // Authorized leave does not unfairly degrade the attendance ratio
    const countableSessions = Math.max(1, totalClasses - leaveCount);
    const percentage = totalClasses > 0 ? Math.round((presentCount / (totalClasses > leaveCount ? countableSessions : totalClasses)) * 100) : 100;

    return {
      totalClasses,
      presentCount,
      absentCount,
      leaveCount,
      percentage,
      records,
    };
  }

  /**
   * Get all attendance history grouped by date (for Teacher view)
   */
  public static getAttendanceHistory() {
    const datesMap = new Map<string, { date: string; classDay: string; total: number; present: number; absent: number; leave: number }>();

    db.attendance.forEach(a => {
      if (!datesMap.has(a.date)) {
        datesMap.set(a.date, {
          date: a.date,
          classDay: a.class_day,
          total: 0,
          present: 0,
          absent: 0,
          leave: 0,
        });
      }
      const entry = datesMap.get(a.date)!;
      entry.total += 1;
      if (a.status === 'present') entry.present += 1;
      else if (a.status === 'leave') entry.leave += 1;
      else entry.absent += 1;
    });

    return Array.from(datesMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
}
