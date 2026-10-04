import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  StudentProfile,
  TeacherProfile,
  Course,
  Topic,
  Video,
  Attendance,
  VideoProgress,
  Notification,
  NotificationToken,
  PasswordReset,
  ActivityLog,
  ClassSettings,
  Assignment,
  AssignmentSubmission,
  AttendanceSession
} from '../models/types.js';

interface DatabaseSchema {
  users: User[];
  student_profiles: StudentProfile[];
  teacher_profiles: TeacherProfile[];
  courses: Course[];
  topics: Topic[];
  videos: Video[];
  attendance: Attendance[];
  video_progress: VideoProgress[];
  notifications: Notification[];
  notification_tokens: NotificationToken[];
  password_resets: PasswordReset[];
  activity_logs: ActivityLog[];
  class_settings: ClassSettings;
  assignments: Assignment[];
  assignment_submissions: AssignmentSubmission[];
  attendance_sessions: AttendanceSession[];
}

const isVercel = Boolean(process.env.VERCEL);

const findExistingDbSource = (): string | null => {
  const dirCandidates = [
    typeof __dirname !== 'undefined' ? path.resolve(__dirname, '..', '..', 'data', 'database.json') : '',
    typeof __dirname !== 'undefined' ? path.resolve(__dirname, '..', 'data', 'database.json') : '',
    path.resolve(process.cwd(), 'backend', 'data', 'database.json'),
    path.resolve(process.cwd(), 'data', 'database.json'),
  ].filter(Boolean);

  for (const cand of dirCandidates) {
    if (fs.existsSync(cand)) {
      return cand;
    }
  }
  return null;
};

const DATA_DIR = isVercel
  ? path.join('/tmp', 'data')
  : (findExistingDbSource() ? path.dirname(findExistingDbSource()!) : path.resolve(process.cwd(), 'backend', 'data'));
const DB_FILE = isVercel ? path.join('/tmp', 'data', 'database.json') : path.join(DATA_DIR, 'database.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    users: [],
    student_profiles: [],
    teacher_profiles: [],
    courses: [],
    topics: [],
    videos: [],
    attendance: [],
    video_progress: [],
    notifications: [],
    notification_tokens: [],
    password_resets: [],
    activity_logs: [],
    assignments: [],
    assignment_submissions: [],
    attendance_sessions: [],
    class_settings: {
      id: 'smit-web-class-settings-01',
      class_name: 'SMIT Web Development Class',
      teacher_id: 'teacher-admin-uuid-001',
      class_days: ['monday', 'tuesday'],
      class_start_time: '16:00',
      class_end_time: '18:00',
      timezone: 'Asia/Karachi',
      location: 'SMIT Main Campus / Live Cohort',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.warn('[Database] Failed to create DATA_DIR:', e);
      }
    }

    // In Vercel serverless, copy initial seed database to writable /tmp directory
    if (isVercel && !fs.existsSync(DB_FILE)) {
      const sourceFile = findExistingDbSource();
      if (sourceFile) {
        try {
          fs.copyFileSync(sourceFile, DB_FILE);
          console.log(`[Database] Initialized /tmp database from source: ${sourceFile}`);
        } catch (e) {
          console.warn('[Database] Seed copy to /tmp error:', e);
        }
      }
    }

    const fileToRead = fs.existsSync(DB_FILE) ? DB_FILE : findExistingDbSource();

    if (fileToRead && fs.existsSync(fileToRead)) {
      try {
        const raw = fs.readFileSync(fileToRead, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.activity_logs) this.data.activity_logs = [];
        if (!this.data.assignments) this.data.assignments = [];
        if (!this.data.assignment_submissions) this.data.assignment_submissions = [];
        if (!this.data.attendance_sessions) this.data.attendance_sessions = [];

        // Automatic deduplication to guarantee zero duplicate courses/topics/videos
        const dedupe = <T extends { id: string }>(arr: T[] = []): T[] => {
          const map = new Map<string, T>();
          for (const item of arr) {
            if (item && item.id && !map.has(item.id)) {
              map.set(item.id, item);
            }
          }
          return Array.from(map.values());
        };

        this.data.courses = dedupe(this.data.courses);
        this.data.topics = dedupe(this.data.topics);
        this.data.videos = dedupe(this.data.videos);
        this.data.assignments = dedupe(this.data.assignments);
        this.data.users = dedupe(this.data.users);

        // Dedupe student_profiles strictly by user_id (keep latest updated)
        const profileMap = new Map<string, StudentProfile>();
        for (const p of this.data.student_profiles) {
          if (p && p.user_id) {
            const existing = profileMap.get(p.user_id);
            if (!existing || new Date(p.updated_at || p.created_at || 0) >= new Date(existing.updated_at || existing.created_at || 0)) {
              profileMap.set(p.user_id, p);
            }
          }
        }
        this.data.student_profiles = Array.from(profileMap.values());

        if (!this.data.class_settings) {
          this.data.class_settings = {
            id: 'smit-web-class-settings-01',
            class_name: 'SMIT Web Development Class',
            teacher_id: 'teacher-admin-uuid-001',
            class_days: ['monday', 'tuesday'],
            class_start_time: '16:00',
            class_end_time: '18:00',
            timezone: 'Asia/Karachi',
            location: 'SMIT Main Campus / Live Cohort',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          this.save();
        }
        console.log('[Database] Loaded existing database from data/database.json');
        setTimeout(() => {
          this.syncWithSupabase().catch(() => {});
        }, 100);
        return;
      } catch (err) {
        console.error('[Database] Failed to read database.json, re-seeding...', err);
      }
    }

    this.seed();
    this.save();
    setTimeout(() => {
      this.syncWithSupabase().catch(() => {});
    }, 100);
  }

  private syncPromise: Promise<void> | null = null;
  private lastSyncTime: number = 0;

  public async ensureSynced(force = false): Promise<void> {
    const now = Date.now();
    if (!force && this.lastSyncTime > 0 && now - this.lastSyncTime < 15000) {
      return;
    }
    if (this.syncPromise) {
      return this.syncPromise;
    }
    this.syncPromise = this.syncWithSupabase()
      .then(() => {
        this.lastSyncTime = Date.now();
      })
      .finally(() => {
        this.syncPromise = null;
      });
    return this.syncPromise;
  }

  public async syncWithSupabase(): Promise<void> {
    const supabase = (await import('./supabase.js')).getSupabase();
    if (!supabase) return;
    try {
      const [uRes, spRes, tpRes, cRes, topRes, vRes, attRes, asRes, subRes, vpRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('student_profiles').select('*'),
        supabase.from('teacher_profiles').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('topics').select('*'),
        supabase.from('videos').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('assignments').select('*'),
        supabase.from('assignment_submissions').select('*'),
        supabase.from('video_progress').select('*'),
      ]);

      if (uRes.data && uRes.data.length > 0) {
        const remoteUsers = uRes.data as User[];
        const localTeacher = this.data.users.find(u => u.role === 'teacher');
        if (localTeacher && !remoteUsers.some(u => u.id === localTeacher.id || u.role === 'teacher')) {
          remoteUsers.push(localTeacher);
        }
        this.data.users = remoteUsers;
      }
      if (spRes.data) {
        this.data.student_profiles = spRes.data as StudentProfile[];
      }
      if (tpRes.data && tpRes.data.length > 0) {
        this.data.teacher_profiles = tpRes.data as TeacherProfile[];
      }
      if (cRes.data && cRes.data.length > 0) {
        this.data.courses = cRes.data as Course[];
      }
      if (topRes.data && topRes.data.length > 0) {
        this.data.topics = topRes.data as Topic[];
      }
      if (vRes.data && vRes.data.length > 0) {
        this.data.videos = vRes.data as Video[];
      }
      if (attRes.data) {
        this.data.attendance = attRes.data as Attendance[];
      }
      if (asRes.data) {
        this.data.assignments = asRes.data as Assignment[];
      }
      if (subRes.data) {
        this.data.assignment_submissions = subRes.data as AssignmentSubmission[];
      }
      if (vpRes.data) {
        this.data.video_progress = vpRes.data as VideoProgress[];
      }
      this.lastSyncTime = Date.now();
      console.log(`[DatabaseStore] Synced with Supabase: ${this.data.users.length} users, ${this.data.student_profiles.length} student profiles, ${this.data.courses.length} courses.`);
    } catch (err: any) {
      console.warn('[DatabaseStore] Supabase sync warning:', err?.message || err);
    }
  }

  private saveTimeout: NodeJS.Timeout | null = null;

  public save(immediate = false) {
    if (immediate) {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      this.doSave();
      return;
    }
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.doSave();
    }, 60);
  }

  private doSave() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFile(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8', (err) => {
        if (err) console.error('[Database] Error saving to database.json:', err);
      });
    } catch (err) {
      console.error('[Database] Error saving to database.json:', err);
    }
  }

  private seed() {
    console.log('[Database] Initializing clean production classroom with teacher account...');
    const salt = bcrypt.genSaltSync(10);
    const teacherPasswordHash = bcrypt.hashSync('Password123!', salt);

    const teacherUserId = 'b48f07b1-1234-4567-89ab-cdef01234567';
    const teacherUser: User = {
      id: teacherUserId,
      role: 'teacher',
      username: 'teacher',
      email: 'teacher@webcraft.edu',
      password_hash: teacherPasswordHash,
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
      updated_at: new Date().toISOString(),
    };

    const teacherProfile: TeacherProfile = {
      id: 'c59f07b1-1234-4567-89ab-cdef01234567',
      user_id: teacherUserId,
      full_name: 'Prof. Alex Vance',
      username: 'teacher',
      email: 'teacher@webcraft.edu',
      mobile_number: '+92 300 1234567',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      bio: 'Lead Full-Stack Web Development Architect & Classroom Instructor with 12+ years of production experience.',
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.users = [teacherUser];
    this.data.teacher_profiles = [teacherProfile];
    this.data.student_profiles = [];
    this.data.courses = [];
    this.data.topics = [];
    this.data.videos = [];
    this.data.attendance = [];
    this.data.attendance_sessions = [];
    this.data.video_progress = [];
    this.data.assignments = [];
    this.data.assignment_submissions = [];
    this.data.notifications = [];
    this.data.notification_tokens = [];
    this.data.password_resets = [];
    this.data.activity_logs = [];
    console.log('[Database] Initialized with 1 teacher. Courses & students clean for production.');
  }

  // Table Accessors & Methods
  get users(): User[] { return this.data.users; }
  get student_profiles(): StudentProfile[] { return this.data.student_profiles; }
  get teacher_profiles(): TeacherProfile[] { return this.data.teacher_profiles; }
  get courses(): Course[] { return this.data.courses; }
  get topics(): Topic[] { return this.data.topics; }
  get videos(): Video[] { return this.data.videos; }
  get attendance(): Attendance[] { return this.data.attendance; }
  get video_progress(): VideoProgress[] { return this.data.video_progress; }
  get notifications(): Notification[] { return this.data.notifications; }
  get notification_tokens(): NotificationToken[] { return this.data.notification_tokens; }
  get password_resets(): PasswordReset[] { return this.data.password_resets; }

  get activity_logs(): ActivityLog[] {
    if (!this.data.activity_logs) this.data.activity_logs = [];
    return this.data.activity_logs;
  }

  get class_settings(): ClassSettings {
    if (!this.data.class_settings) {
      this.data.class_settings = {
        id: 'smit-web-class-settings-01',
        class_name: 'SMIT Web Development Class',
        teacher_id: 'teacher-admin-uuid-001',
        class_days: ['monday', 'tuesday'],
        class_start_time: '16:00',
        class_end_time: '18:00',
        timezone: 'Asia/Karachi',
        location: 'SMIT Main Campus / Live Cohort',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.save();
    }
    return this.data.class_settings;
  }

  set class_settings(val: ClassSettings) {
    this.data.class_settings = val;
    this.save();
  }

  get assignments(): Assignment[] {
    if (!this.data.assignments) this.data.assignments = [];
    return this.data.assignments;
  }

  get assignment_submissions(): AssignmentSubmission[] {
    if (!this.data.assignment_submissions) this.data.assignment_submissions = [];
    return this.data.assignment_submissions;
  }

  get attendance_sessions(): AttendanceSession[] {
    if (!this.data.attendance_sessions) this.data.attendance_sessions = [];
    return this.data.attendance_sessions;
  }

  public logActivity(log: Omit<ActivityLog, 'id' | 'created_at'>): ActivityLog {
    const newLog: ActivityLog = {
      id: uuidv4(),
      ...log,
      created_at: new Date().toISOString(),
    };
    if (!this.data.activity_logs) {
      this.data.activity_logs = [];
    }
    this.data.activity_logs.unshift(newLog);
    // Keep max 200 activity logs
    if (this.data.activity_logs.length > 200) {
      this.data.activity_logs = this.data.activity_logs.slice(0, 200);
    }
    this.save();
    return newLog;
  }
}

export const db = new DatabaseStore();

