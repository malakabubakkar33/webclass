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

        if (this.data.assignments.length === 0) {
          this.seedAssignments();
          this.save();
        }

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

  public async syncWithSupabase(): Promise<void> {
    const supabase = (await import('./supabase.js')).getSupabase();
    if (!supabase) return;
    try {
      const [uRes, spRes, cRes, topRes, vRes, attRes, asRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('student_profiles').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('topics').select('*'),
        supabase.from('videos').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('assignments').select('*'),
      ]);

      if (uRes.data && uRes.data.length > 0) {
        const existingIds = new Set(this.data.users.map((u: User) => u.id));
        for (const u of uRes.data) {
          if (!existingIds.has(u.id)) {
            this.data.users.push(u as User);
          } else {
            const idx = this.data.users.findIndex((item: User) => item.id === u.id);
            if (idx !== -1) this.data.users[idx] = u as User;
          }
        }
      }

      if (spRes.data && spRes.data.length > 0) {
        const existingIds = new Set(this.data.student_profiles.map((p: StudentProfile) => p.id));
        for (const p of spRes.data) {
          if (!existingIds.has(p.id)) {
            this.data.student_profiles.push(p as StudentProfile);
          } else {
            const idx = this.data.student_profiles.findIndex((item: StudentProfile) => item.id === p.id);
            if (idx !== -1) this.data.student_profiles[idx] = p as StudentProfile;
          }
        }
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
      if (attRes.data && attRes.data.length > 0) {
        this.data.attendance = attRes.data as Attendance[];
      }
      if (asRes.data && asRes.data.length > 0) {
        this.data.assignments = asRes.data as Assignment[];
      }
      console.log(`[DatabaseStore] Synced with Supabase: ${this.data.users.length} users, ${this.data.courses.length} courses.`);
    } catch (err: any) {
      // Non-blocking notice
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
    console.log('[Database] Seeding initial classroom data...');
    const salt = bcrypt.genSaltSync(10);
    const teacherPasswordHash = bcrypt.hashSync('Password123!', salt);
    const studentPasswordHash = bcrypt.hashSync('Password123!', salt);

    // 1. Single Teacher / Admin Account
    const teacherUserId = 'teacher-admin-uuid-001';
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
      id: uuidv4(),
      user_id: teacherUserId,
      full_name: 'Prof. Alex Vance',
      username: 'teacher',
      email: 'teacher@webcraft.edu',
      mobile_number: '+1 (555) 019-2834',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      bio: 'Lead Full-Stack Web Development Architect & Classroom Instructor with 12+ years of production experience.',
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.users.push(teacherUser);
    this.data.teacher_profiles.push(teacherProfile);

    // 2. Initial Students
    const studentSeedList = [
      {
        id: 'student-uuid-001',
        name: 'Sarah Chen',
        username: 'sarahc',
        email: 'sarah.chen@student.webcraft.edu',
        roll: 'WD-2026-001',
        mobile: '+1 (555) 234-5678',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256'
      },
      {
        id: 'student-uuid-002',
        name: 'Michael Rodriguez',
        username: 'michaelr',
        email: 'michael.r@student.webcraft.edu',
        roll: 'WD-2026-002',
        mobile: '+1 (555) 345-6789',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256'
      },
      {
        id: 'student-uuid-003',
        name: 'Aaliyah Khan',
        username: 'aaliyahk',
        email: 'aaliyah.k@student.webcraft.edu',
        roll: 'WD-2026-003',
        mobile: '+1 (555) 456-7890',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256'
      }
    ];

    studentSeedList.forEach((s) => {
      const u: User = {
        id: s.id,
        role: 'student',
        username: s.username,
        email: s.email,
        password_hash: studentPasswordHash,
        is_active: true,
        created_at: new Date('2026-02-01T09:00:00Z').toISOString(),
        updated_at: new Date().toISOString(),
      };
      const p: StudentProfile = {
        id: uuidv4(),
        user_id: s.id,
        full_name: s.name,
        username: s.username,
        email: s.email,
        mobile_number: s.mobile,
        roll_number: s.roll,
        avatar_url: s.avatar,
        show_on_public_directory: true,
        created_at: new Date('2026-02-01T09:00:00Z').toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.users.push(u);
      this.data.student_profiles.push(p);
    });

    // 3. Courses required: HTML, CSS, JavaScript, TypeScript, React, Firebase, Supabase
    const coursesDefinition = [
      {
        id: 'course-html',
        title: 'HTML5 Semantic Web Architecture',
        slug: 'html',
        description: 'Master modern semantic markup, accessible forms, audio/video integration, and document layout foundations.',
        thumbnail_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
        level: 'Beginner' as const,
        topics: [
          {
            title: 'Introduction to HTML5',
            desc: 'History, document declaration, viewport configuration, and metadata.',
            videos: [
              { title: 'Welcome to Web Development & HTML5', duration: '12:45', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
              { title: 'Anatomy of an HTML Document', duration: '16:20', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
            ]
          },
          {
            title: 'HTML Structure & Semantics',
            desc: 'Header, nav, main, section, article, aside, and footer elements.',
            videos: [
              { title: 'Semantic Tags vs Generic Divs', duration: '14:10', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }
            ]
          },
          {
            title: 'Headings & Paragraphs',
            desc: 'Typography hierarchy, line breaks, and text formatting tags.',
            videos: [
              { title: 'Structuring Text with Heading Hierarchy', duration: '10:15', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' }
            ]
          },
          {
            title: 'Links & Images',
            desc: 'Hyperlinks, image optimization, responsive picture tags, and alt text.',
            videos: [
              { title: 'Working with Responsive Images and Links', duration: '15:30', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' }
            ]
          },
          {
            title: 'Forms & Input Validation',
            desc: 'Creating interactive user input forms, radio buttons, selects, and attributes.',
            videos: [
              { title: 'Building Bulletproof Web Forms', duration: '22:15', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4' }
            ]
          },
          {
            title: 'Tables & Tabular Data',
            desc: 'Thead, tbody, tfoot, scope, colspan, and rowspan for clean tables.',
            videos: [
              { title: 'Designing Accessible Tabular Data', duration: '11:40', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' }
            ]
          }
        ]
      },
      {
        id: 'course-css',
        title: 'Modern CSS3 & Responsive Design',
        slug: 'css',
        description: 'Deep dive into Flexbox, CSS Grid, custom properties, animations, and Tailwind utility systems.',
        thumbnail_url: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&q=80&w=600',
        level: 'Beginner' as const,
        topics: [
          {
            title: 'The CSS Box Model & Selectors',
            desc: 'Margins, borders, padding, content box vs border box, specificity.',
            videos: [
              { title: 'Mastering the CSS Box Model', duration: '18:25', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' }
            ]
          },
          {
            title: 'Flexbox Layout Essentials',
            desc: 'Justify-content, align-items, flex direction, grow, shrink, and wrap.',
            videos: [
              { title: 'Complete Guide to CSS Flexbox', duration: '24:50', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4' }
            ]
          },
          {
            title: 'CSS Grid & Modern Two-Dimensional Layouts',
            desc: 'Grid template columns, minmax, auto-fit, auto-fill, and grid areas.',
            videos: [
              { title: 'Building Dynamic Grids effortlessly', duration: '20:10', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' }
            ]
          }
        ]
      },
      {
        id: 'course-javascript',
        title: 'JavaScript Deep Dive & DOM Engineering',
        slug: 'javascript',
        description: 'Core language mechanisms, closures, prototypes, asynchronous JavaScript, Promises, and the Event Loop.',
        thumbnail_url: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&q=80&w=600',
        level: 'Intermediate' as const,
        topics: [
          {
            title: 'Modern ES6+ Syntax & Scope',
            desc: 'Let, const, arrow functions, destructuring, and template literals.',
            videos: [
              { title: 'ES6+ Features You Must Know', duration: '21:05', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4' }
            ]
          },
          {
            title: 'Asynchronous JS, Promises & Async/Await',
            desc: 'Handling asynchronous workflows, try/catch, fetch API, and microtask queues.',
            videos: [
              { title: 'Demystifying Promises and Async/Await', duration: '26:30', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4' }
            ]
          }
        ]
      },
      {
        id: 'course-typescript',
        title: 'TypeScript for Production Web Apps',
        slug: 'typescript',
        description: 'Static typing, interfaces, generics, utility types, unions, and configuring strict type safety.',
        thumbnail_url: 'https://images.unsplash.com/photo-1516116211227-bbc15456b3e3?auto=format&fit=crop&q=80&w=600',
        level: 'Intermediate' as const,
        topics: [
          {
            title: 'TypeScript Fundamentals & Type Annotations',
            desc: 'Primitives, arrays, tuples, enums, and type inference.',
            videos: [
              { title: 'Getting Started with Strong Typing', duration: '17:40', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }
            ]
          },
          {
            title: 'Generics & Advanced Utility Types',
            desc: 'Generic functions, Pick, Omit, Partial, and conditional types.',
            videos: [
              { title: 'Mastering Generics in Real Applications', duration: '25:15', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' }
            ]
          }
        ]
      },
      {
        id: 'course-react',
        title: 'React 18 & Enterprise Component Architecture',
        slug: 'react',
        description: 'Hooks, state management, context, TanStack Query caching, custom hooks, and memoization patterns.',
        thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600',
        level: 'Intermediate' as const,
        topics: [
          {
            title: 'React Hooks Core (useState, useEffect)',
            desc: 'Component lifecycles, effect dependencies, cleanups, and synchronization.',
            videos: [
              { title: 'useEffect and Component State in Depth', duration: '28:40', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }
            ]
          },
          {
            title: 'Custom Hooks & State Encapsulation',
            desc: 'Extracting reusable business logic into clean custom hooks.',
            videos: [
              { title: 'Architecting Scalable Custom Hooks', duration: '22:15', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' }
            ]
          }
        ]
      },
      {
        id: 'course-firebase',
        title: 'Firebase Cloud Mastery & Push Notifications',
        slug: 'firebase',
        description: 'Firebase Cloud Messaging (FCM), Cloud Firestore, Authentication, and real-time client sync.',
        thumbnail_url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=600',
        level: 'Advanced' as const,
        topics: [
          {
            title: 'Firebase Push Notifications with FCM',
            desc: 'Service workers, device token registration, payload construction, and delivery.',
            videos: [
              { title: 'Setting Up Firebase Cloud Messaging', duration: '19:50', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' }
            ]
          }
        ]
      },
      {
        id: 'course-supabase',
        title: 'Supabase & PostgreSQL Full-Stack Architecture',
        slug: 'supabase',
        description: 'Relational data modeling, Row-Level Security (RLS) policies, Supabase Storage buckets, and Edge functions.',
        thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600',
        level: 'Advanced' as const,
        topics: [
          {
            title: 'PostgreSQL Schema Design & Constraints',
            desc: 'Foreign keys, indexes, triggers, and cascading constraints.',
            videos: [
              { title: 'Relational Modeling in Supabase', duration: '24:10', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4' }
            ]
          },
          {
            title: 'Supabase Storage & Access Control',
            desc: 'Creating secure buckets for avatars, video assets, and signed URLs.',
            videos: [
              { title: 'Secure File Storage with Supabase', duration: '18:35', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' }
            ]
          }
        ]
      }
    ];

    coursesDefinition.forEach((cDef) => {
      const course: Course = {
        id: cDef.id,
        title: cDef.title,
        slug: cDef.slug,
        description: cDef.description,
        thumbnail_url: cDef.thumbnail_url,
        level: cDef.level,
        created_by: teacherUserId,
        is_published: true,
        created_at: new Date('2026-02-01T10:00:00Z').toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.courses.push(course);

      cDef.topics.forEach((tDef, tIdx) => {
        const topicId = `topic-${cDef.slug}-${tIdx + 1}`;
        const topic: Topic = {
          id: topicId,
          course_id: course.id,
          title: tDef.title,
          description: tDef.desc,
          order_index: tIdx + 1,
          created_at: new Date('2026-02-02T10:00:00Z').toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.data.topics.push(topic);

        tDef.videos.forEach((vDef, vIdx) => {
          const videoId = `video-${cDef.slug}-${tIdx + 1}-${vIdx + 1}`;
          const video: Video = {
            id: videoId,
            course_id: course.id,
            topic_id: topic.id,
            title: vDef.title,
            description: `Comprehensive video tutorial covering ${vDef.title} with code demonstrations and real examples.`,
            video_url: vDef.url,
            storage_path: `course-videos/${cDef.slug}/${videoId}.mp4`,
            thumbnail_url: cDef.thumbnail_url,
            duration: vDef.duration,
            order_index: vIdx + 1,
            uploaded_by: teacherUserId,
            created_at: new Date('2026-02-03T11:00:00Z').toISOString(),
            updated_at: new Date().toISOString(),
          };
          this.data.videos.push(video);

          // Mark first 2 videos completed for Sarah Chen as realistic initial progress
          if (cDef.slug === 'html' && (vIdx === 0 || tIdx === 0)) {
            this.data.video_progress.push({
              id: uuidv4(),
              student_id: 'student-uuid-001',
              video_id: video.id,
              watched: true,
              completed: true,
              progress_seconds: 400,
              completed_at: new Date('2026-02-10T14:20:00Z').toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        });
      });
    });

    // 4. Attendance Seed (Strictly Monday & Thursday)
    // 2026 Mondays and Thursdays
    const classDates: { date: string; day: 'monday' | 'thursday' }[] = [
      { date: '2026-09-07', day: 'monday' },
      { date: '2026-09-10', day: 'thursday' },
      { date: '2026-09-14', day: 'monday' },
      { date: '2026-09-17', day: 'thursday' },
      { date: '2026-09-21', day: 'monday' },
      { date: '2026-09-24', day: 'thursday' },
      { date: '2026-09-28', day: 'monday' },
    ];

    classDates.forEach((cd) => {
      this.data.attendance.push(
        {
          id: uuidv4(),
          student_id: 'student-uuid-001',
          date: cd.date,
          class_day: cd.day,
          status: 'present',
          marked_by: teacherUserId,
          created_at: new Date(`${cd.date}T18:00:00Z`).toISOString(),
          updated_at: new Date(`${cd.date}T18:00:00Z`).toISOString(),
        },
        {
          id: uuidv4(),
          student_id: 'student-uuid-002',
          date: cd.date,
          class_day: cd.day,
          status: cd.date === '2026-09-17' ? 'absent' : 'present',
          marked_by: teacherUserId,
          created_at: new Date(`${cd.date}T18:00:00Z`).toISOString(),
          updated_at: new Date(`${cd.date}T18:00:00Z`).toISOString(),
        },
        {
          id: uuidv4(),
          student_id: 'student-uuid-003',
          date: cd.date,
          class_day: cd.day,
          status: cd.date === '2026-09-21' ? 'absent' : 'present',
          marked_by: teacherUserId,
          created_at: new Date(`${cd.date}T18:00:00Z`).toISOString(),
          updated_at: new Date(`${cd.date}T18:00:00Z`).toISOString(),
        }
      );
    });

    // 5. Initial Notifications for Sarah Chen
    this.data.notifications.push(
      {
        id: uuidv4(),
        user_id: 'student-uuid-001',
        type: 'video_uploaded',
        title: 'New Lesson Available',
        message: 'Prof. Alex Vance uploaded "Relational Modeling in Supabase" in Supabase & PostgreSQL.',
        reference_type: 'video',
        reference_id: 'video-supabase-1-1',
        is_read: false,
        created_at: new Date('2026-09-28T12:00:00Z').toISOString(),
      },
      {
        id: uuidv4(),
        user_id: 'student-uuid-001',
        type: 'attendance_marked',
        title: 'Attendance Recorded',
        message: 'Your attendance for Monday, Sep 28 has been marked as Present.',
        reference_type: 'attendance',
        reference_id: '2026-09-28',
        is_read: true,
        created_at: new Date('2026-09-28T18:05:00Z').toISOString(),
      }
    );

    console.log('[Database] Seeded 1 teacher, 3 students, 7 courses, topics, videos, and attendance.');
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

  private seedAssignments() {
    console.log('[Database] Seeding initial web development assignments...');
    const teacherId = 'teacher-admin-uuid-001';

    const sampleAssignments: Assignment[] = [
      {
        id: 'assign-html-portfolio',
        course_id: 'course-html',
        topic_id: 'topic-html-1',
        teacher_id: teacherId,
        title: 'HTML5 Semantic Web Architecture & Portfolio',
        description: 'Design and code a fully accessible, semantic multi-page HTML portfolio following modern HTML5 web standards.',
        instructions: 'Create an accessible, semantic HTML5 structure including <header>, <nav>, <main>, <article>, <section>, <aside>, and <footer> tags. Implement structured form controls with validation attributes.',
        requirements: [
          'Use valid HTML5 doctype and meta tags for responsive viewport',
          'Include semantic tags: header, nav, main, article, section, footer',
          'Build a comprehensive contact form with required field validation',
          'Validate markup using W3C HTML validator without errors',
          'Submit clean PDF documentation or design screenshot images (PDF, PNG, JPG, WEBP)'
        ],
        due_at: '2026-10-15T23:59:59Z',
        max_marks: 100,
        allowed_file_types: ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
        max_file_size_mb: 20,
        max_submissions: 3,
        allow_resubmission: true,
        published: true,
        created_at: new Date('2026-09-20T10:00:00Z').toISOString(),
        updated_at: new Date('2026-09-20T10:00:00Z').toISOString(),
      },
      {
        id: 'assign-css-flexbox',
        course_id: 'course-css',
        topic_id: 'topic-css-1',
        teacher_id: teacherId,
        title: 'Modern CSS Flexbox & Grid Dashboard Layout',
        description: 'Construct a responsive multi-column SaaS analytics dashboard layout using CSS Flexbox and modern CSS Grid techniques.',
        instructions: 'Implement mobile-first responsive breakpoints. Utilize CSS custom properties (variables) for theme consistency. Ensure no horizontal page overflow across screen widths from 320px to 1920px.',
        requirements: [
          'Mobile-first responsive design using CSS Flexbox and Grid',
          'Use CSS custom properties (variables) for colors and typography',
          'Smooth hover micro-animations and transition states',
          'Clean, well-commented vanilla CSS stylesheet without frameworks'
        ],
        due_at: '2026-10-22T23:59:59Z',
        max_marks: 100,
        allowed_file_types: ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
        max_file_size_mb: 25,
        max_submissions: 2,
        allow_resubmission: true,
        published: true,
        created_at: new Date('2026-09-24T12:00:00Z').toISOString(),
        updated_at: new Date('2026-09-24T12:00:00Z').toISOString(),
      },
      {
        id: 'assign-js-dom-quiz',
        course_id: 'course-js',
        topic_id: 'topic-js-1',
        teacher_id: teacherId,
        title: 'Interactive JavaScript DOM Quiz Application',
        description: 'Build an interactive web-based quiz application that dynamically renders questions, tracks scores, and stores high scores in localStorage.',
        instructions: 'Use modern ES6+ syntax (arrow functions, template literals, destructuring). Handle DOM event listeners cleanly. Implement a countdown timer and dynamic results summary.',
        requirements: [
          'Dynamic rendering of questions from a JavaScript array of objects',
          'Score tracking with localStorage high-score persistence',
          'Interactive feedback indicators for correct and incorrect answers',
          'Robust error handling and restart capability'
        ],
        due_at: '2026-11-05T23:59:59Z',
        max_marks: 100,
        allowed_file_types: ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
        max_file_size_mb: 30,
        max_submissions: 2,
        allow_resubmission: false,
        published: true,
        created_at: new Date('2026-09-28T14:00:00Z').toISOString(),
        updated_at: new Date('2026-09-28T14:00:00Z').toISOString(),
      },
    ];

    this.data.assignments = sampleAssignments;
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

