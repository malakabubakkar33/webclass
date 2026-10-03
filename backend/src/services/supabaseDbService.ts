import { getSupabase } from '../config/supabase.js';
import {
  User,
  StudentProfile,
  TeacherProfile,
  Course,
  Topic,
  Video,
  Attendance,
  VideoProgress,
  Assignment,
  AssignmentSubmission,
  Notification,
  ActivityLog,
  ClassSettings,
  AttendanceSession,
} from '../models/types.js';

export class SupabaseDbService {
  public static isConnected(): boolean {
    return !!getSupabase();
  }

  // ====================================================================
  // USERS & PROFILES
  // ====================================================================

  public static async findUserByIdentifier(identifier: string): Promise<User | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const trimmed = identifier.trim().toLowerCase();

    // 0. Quick alias for teacher login
    if (trimmed === 'teacher' || trimmed === 'admin') {
      const { data: teacherUser } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'teacher')
        .limit(1);
      if (teacherUser && teacherUser.length > 0) {
        return teacherUser[0] as User;
      }
    }

    // 1. Direct match on username or email in users table (both quoted & direct)
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike."${trimmed}",email.ilike."${trimmed}"`)
        .limit(1);

      if (!error && users && users.length > 0) {
        return users[0] as User;
      }
    } catch (e) {
      // Fallback to exact match
      const { data: uByName } = await supabase.from('users').select('*').ilike('username', trimmed).limit(1);
      if (uByName && uByName.length > 0) return uByName[0] as User;
      const { data: uByEmail } = await supabase.from('users').select('*').ilike('email', trimmed).limit(1);
      if (uByEmail && uByEmail.length > 0) return uByEmail[0] as User;
    }

    // 2. Check student_profiles by roll_number, email, or username
    try {
      const { data: profiles, error: pErr } = await supabase
        .from('student_profiles')
        .select('user_id')
        .or(`roll_number.ilike."${trimmed}",email.ilike."${trimmed}",username.ilike."${trimmed}"`)
        .limit(1);

      if (!pErr && profiles && profiles.length > 0 && profiles[0].user_id) {
        const { data: userById } = await supabase
          .from('users')
          .select('*')
          .eq('id', profiles[0].user_id)
          .single();
        if (userById) return userById as User;
      }
    } catch (e) {
      // Fallback direct check on roll_number
      const { data: pByRoll } = await supabase.from('student_profiles').select('user_id').ilike('roll_number', trimmed).limit(1);
      if (pByRoll && pByRoll.length > 0) {
        const { data: userById } = await supabase.from('users').select('*').eq('id', pByRoll[0].user_id).single();
        if (userById) return userById as User;
      }
    }

    // 3. Normalized roll number check (e.g. WD-2026-001, WD2026001, SMIT123)
    const cleanId = trimmed.replace(/[^a-z0-9]/g, '');
    if (cleanId.length >= 3) {
      const { data: allProfiles } = await supabase
        .from('student_profiles')
        .select('user_id, roll_number');
      if (allProfiles && allProfiles.length > 0) {
        const matched = allProfiles.find(
          p => (p.roll_number || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanId
        );
        if (matched && matched.user_id) {
          const { data: userByProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', matched.user_id)
            .single();
          if (userByProfile) return userByProfile as User;
        }
      }
    }

    return null;
  }

  public static async getUserById(id: string): Promise<User | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error || !data) return null;
    return data as User;
  }

  public static async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from('student_profiles').select('*').eq('user_id', userId).single();
    if (error || !data) return null;
    return data as StudentProfile;
  }

  public static async getTeacherProfile(userId?: string): Promise<TeacherProfile | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    let query = supabase.from('teacher_profiles').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query.limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0] as TeacherProfile;
  }

  public static async getAllStudents(): Promise<Array<{ user: User; profile: StudentProfile }>> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data: users, error: uErr } = await supabase.from('users').select('*').eq('role', 'student');
    const { data: profiles, error: pErr } = await supabase.from('student_profiles').select('*');

    if (uErr || !users) return [];
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    return users.map(u => ({
      user: u as User,
      profile: (profileMap.get(u.id) || {}) as StudentProfile,
    }));
  }

  public static async insertStudent(user: User, profile: StudentProfile): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error: uErr } = await supabase.from('users').insert({
      id: user.id,
      role: 'student',
      username: user.username,
      email: user.email,
      password_hash: user.password_hash,
      is_active: user.is_active ?? true,
      is_dropped: user.is_dropped ?? false,
      dropped_reason: user.dropped_reason || '',
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString(),
    });

    if (uErr) {
      console.error('[SupabaseDbService] User insert failed:', uErr.message);
      throw new Error(`Failed to create student account in database: ${uErr.message}`);
    }

    const { error: pErr } = await supabase.from('student_profiles').insert({
      id: profile.id,
      user_id: user.id,
      full_name: profile.full_name,
      username: profile.username,
      email: profile.email,
      mobile_number: profile.mobile_number,
      roll_number: profile.roll_number,
      avatar_url: profile.avatar_url || '',
      show_on_public_directory: profile.show_on_public_directory ?? true,
      is_dropped: profile.is_dropped ?? false,
      dropped_reason: profile.dropped_reason || '',
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: profile.updated_at || new Date().toISOString(),
    });

    if (pErr) {
      console.error('[SupabaseDbService] Student profile insert failed:', pErr.message);
      // Clean up user
      await supabase.from('users').delete().eq('id', user.id);
      throw new Error(`Failed to create student profile in database: ${pErr.message}`);
    }

    return true;
  }

  public static async updateStudentProfile(userId: string, updates: Partial<StudentProfile>): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase
      .from('student_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    return !error;
  }

  public static async toggleStudentActive(userId: string, isActive: boolean): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId);
    return !error;
  }

  public static async dropStudent(userId: string, reason: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    await supabase
      .from('users')
      .update({ is_active: false, is_dropped: true, dropped_reason: reason, updated_at: new Date().toISOString() })
      .eq('id', userId);
    await supabase
      .from('student_profiles')
      .update({ is_dropped: true, dropped_reason: reason, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    return true;
  }

  // ====================================================================
  // COURSES, TOPICS & VIDEOS
  // ====================================================================

  public static async getCourses(): Promise<Course[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: true });
    if (error || !data) return [];
    return data as Course[];
  }

  public static async getCourseByIdOrSlug(idOrSlug: string): Promise<Course | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0] as Course;
  }

  public static async createCourse(course: Course): Promise<Course | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from('courses').insert(course).select().single();
    if (error || !data) {
      console.error('[SupabaseDbService] createCourse failed:', error?.message);
      return null;
    }
    return data as Course;
  }

  public static async updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('courses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return null;
    return data as Course;
  }

  public static async deleteCourse(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    return !error;
  }

  public static async getTopics(courseId?: string): Promise<Topic[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    let q = supabase.from('topics').select('*').order('order_index', { ascending: true });
    if (courseId) q = q.eq('course_id', courseId);
    const { data, error } = await q;
    if (error || !data) return [];
    return data as Topic[];
  }

  public static async createTopic(topic: Topic): Promise<Topic | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from('topics').insert(topic).select().single();
    if (error || !data) return null;
    return data as Topic;
  }

  public static async updateTopic(id: string, updates: Partial<Topic>): Promise<Topic | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('topics')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return null;
    return data as Topic;
  }

  public static async deleteTopic(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('topics').delete().eq('id', id);
    return !error;
  }

  public static async getVideos(courseId?: string, topicId?: string): Promise<Video[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    let q = supabase.from('videos').select('*').order('order_index', { ascending: true });
    if (courseId) q = q.eq('course_id', courseId);
    if (topicId) q = q.eq('topic_id', topicId);
    const { data, error } = await q;
    if (error || !data) return [];
    return data as Video[];
  }

  public static async getVideoById(id: string): Promise<Video | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from('videos').select('*').eq('id', id).single();
    if (error || !data) return null;
    return data as Video;
  }

  public static async createVideo(video: Video): Promise<Video | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from('videos').insert(video).select().single();
    if (error || !data) return null;
    return data as Video;
  }

  public static async deleteVideo(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('videos').delete().eq('id', id);
    return !error;
  }

  public static async getVideoProgress(studentId: string): Promise<VideoProgress[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('video_progress').select('*').eq('student_id', studentId);
    if (error || !data) return [];
    return data as VideoProgress[];
  }

  public static async updateVideoProgress(
    studentId: string,
    videoId: string,
    completed: boolean,
    progressSeconds: number = 0
  ): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('video_progress').upsert(
      {
        student_id: studentId,
        video_id: videoId,
        watched: true,
        completed,
        progress_seconds: progressSeconds,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,video_id' }
    );
    return !error;
  }

  // ====================================================================
  // ATTENDANCE
  // ====================================================================

  public static async getAttendance(studentId?: string, date?: string): Promise<Attendance[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    let q = supabase.from('attendance').select('*').order('date', { ascending: false });
    if (studentId) q = q.eq('student_id', studentId);
    if (date) q = q.eq('date', date);
    const { data, error } = await q;
    if (error || !data) return [];
    return data as Attendance[];
  }

  public static async saveAttendanceRecords(records: Array<{
    student_id: string;
    date: string;
    class_day: string;
    status: 'present' | 'absent' | 'leave';
    marked_by?: string;
  }>): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    const formatted = records.map(r => ({
      student_id: r.student_id,
      date: r.date,
      class_day: r.class_day,
      status: r.status,
      marked_by: r.marked_by,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('attendance').upsert(formatted, {
      onConflict: 'student_id,date',
    });

    if (error) {
      console.error('[SupabaseDbService] Attendance upsert error:', error.message);
      return false;
    }
    return true;
  }

  public static async getActiveAttendanceSession(): Promise<AttendanceSession | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0] as AttendanceSession;
  }

  public static async saveAttendanceSession(session: AttendanceSession): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('attendance_sessions').upsert(session);
    return !error;
  }

  // ====================================================================
  // ASSIGNMENTS & SUBMISSIONS
  // ====================================================================

  public static async getAssignments(courseId?: string): Promise<Assignment[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    let q = supabase.from('assignments').select('*').order('created_at', { ascending: false });
    if (courseId) q = q.eq('course_id', courseId);
    const { data, error } = await q;
    if (error || !data) return [];
    return data as Assignment[];
  }

  public static async getAssignmentById(id: string): Promise<Assignment | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from('assignments').select('*').eq('id', id).single();
    if (error || !data) return null;
    return data as Assignment;
  }

  public static async createAssignment(assignment: Assignment): Promise<Assignment | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from('assignments').insert(assignment).select().single();
    if (error || !data) return null;
    return data as Assignment;
  }

  public static async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('assignments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return null;
    return data as Assignment;
  }

  public static async deleteAssignment(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    return !error;
  }

  public static async getSubmissions(assignmentId?: string, studentId?: string): Promise<AssignmentSubmission[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    let q = supabase.from('assignment_submissions').select('*').order('submitted_at', { ascending: false });
    if (assignmentId) q = q.eq('assignment_id', assignmentId);
    if (studentId) q = q.eq('student_id', studentId);
    const { data, error } = await q;
    if (error || !data) return [];
    return data as AssignmentSubmission[];
  }

  public static async createSubmission(submission: AssignmentSubmission): Promise<AssignmentSubmission | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from('assignment_submissions').insert(submission).select().single();
    if (error || !data) return null;
    return data as AssignmentSubmission;
  }

  public static async gradeSubmission(submissionId: string, marks: number, feedback: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase
      .from('assignment_submissions')
      .update({
        marks,
        feedback,
        status: 'graded',
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId);
    return !error;
  }

  // ====================================================================
  // NOTIFICATIONS & AUDIT LOGS
  // ====================================================================

  public static async getNotifications(userId: string): Promise<Notification[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as Notification[];
  }

  public static async createNotification(notification: Notification): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('notifications').insert(notification);
    return !error;
  }

  public static async markNotificationAsRead(id: string, userId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', userId);
    return !error;
  }

  public static async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    return !error;
  }

  public static async logActivity(log: ActivityLog): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      await supabase.from('activity_logs').insert(log);
    } catch (e) {
      console.warn('[SupabaseDbService] Log activity error:', e);
    }
  }

  public static async getActivityLogs(limit = 30): Promise<ActivityLog[]> {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as ActivityLog[];
  }

  public static async getClassSettings(): Promise<ClassSettings | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from('class_settings').select('*').limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0] as ClassSettings;
  }

  public static async updateClassSettings(settings: ClassSettings): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('class_settings').upsert({
      ...settings,
      updated_at: new Date().toISOString(),
    });
    return !error;
  }
}
