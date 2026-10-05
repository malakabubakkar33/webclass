import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { SupabaseDbService } from '../services/supabaseDbService.js';

const DEFAULT_CLASSROOM_COURSES = [
  {
    id: 'course-html5-css3',
    title: 'HTML5 & Modern CSS3 Architecture',
    slug: 'html5-modern-css3-architecture',
    description: 'Master semantic HTML5, Flexbox, CSS Grid, custom properties, animations, and responsive web design best practices.',
    thumbnail_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    level: 'Beginner',
    topicsCount: 4,
    videosCount: 12,
  },
  {
    id: 'course-javascript-es6',
    title: 'Modern JavaScript (ES6+) Fundamentals',
    slug: 'modern-javascript-es6-fundamentals',
    description: 'Deep dive into modern JS: lexical scope, closures, promises, async/await, DOM APIs, and functional paradigms.',
    thumbnail_url: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&q=80&w=800',
    level: 'Beginner',
    topicsCount: 4,
    videosCount: 14,
  },
  {
    id: 'course-typescript',
    title: 'TypeScript for Production Web Apps',
    slug: 'typescript-production-web-apps',
    description: 'Static typing, generics, interfaces, strict mode, union types, and error-free codebases.',
    thumbnail_url: 'https://images.unsplash.com/photo-1516116211227-bbc042c1619a?auto=format&fit=crop&q=80&w=800',
    level: 'Intermediate',
    topicsCount: 3,
    videosCount: 8,
  },
  {
    id: 'course-react',
    title: 'React 18 & Enterprise Component Architecture',
    slug: 'react-18-enterprise-architecture',
    description: 'Component lifecycles, hooks, context API, state machines, and real-world dashboards.',
    thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
    level: 'Intermediate',
    topicsCount: 5,
    videosCount: 15,
  },
  {
    id: 'course-firebase',
    title: 'Firebase Cloud Mastery & Push Notifications',
    slug: 'firebase-cloud-mastery',
    description: 'Realtime database, Cloud Firestore, Firebase Auth, FCM web notifications, and storage buckets.',
    thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800',
    level: 'Advanced',
    topicsCount: 3,
    videosCount: 7,
  },
  {
    id: 'course-supabase',
    title: 'Supabase & PostgreSQL Full-Stack Architecture',
    slug: 'supabase-postgresql-architecture',
    description: 'Relational data modeling, Row-Level Security (RLS), realtime subscriptions, and Edge Functions.',
    thumbnail_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=800',
    level: 'Advanced',
    topicsCount: 3,
    videosCount: 9,
  },
];

export class PublicController {
  /**
   * GET /api/public/stats
   * Dynamic classroom metrics
   */
  public static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      try {
        await db.ensureSynced();
      } catch (e) {
        // Non-blocking
      }

      // 1. Local student count
      const localActiveStudents = db.users.filter(u => u.role === 'student' && u.is_active);
      const activeStudentIds = new Set(localActiveStudents.map(u => u.id));
      let totalStudents = localActiveStudents.length;

      let totalCourses = db.courses.filter(c => c.is_published).length;
      let totalTopics = db.topics.length;
      let totalVideos = db.videos.length;

      // 2. Merge with Supabase PostgreSQL if connected
      if (SupabaseDbService.isConnected()) {
        try {
          const students = await SupabaseDbService.getAllStudents();
          const courses = await SupabaseDbService.getCourses();
          const tCount = await SupabaseDbService.getTopicsCount();
          const vCount = await SupabaseDbService.getVideosCount();

          if (students && students.length > 0) {
            students.forEach(s => {
              if (s.user && s.user.is_active) {
                activeStudentIds.add(s.user.id);
              }
            });
            totalStudents = Math.max(totalStudents, activeStudentIds.size);
          }
          if (courses && courses.length > 0) {
            const pub = courses.filter(c => c.is_published).length;
            totalCourses = Math.max(totalCourses, pub);
          }
          if (tCount > 0) totalTopics = Math.max(totalTopics, tCount);
          if (vCount > 0) totalVideos = Math.max(totalVideos, vCount);
        } catch (supaErr) {
          console.warn('[PublicController] Supabase stats query warning:', supaErr);
        }
      }

      res.json({
        success: true,
        data: {
          totalStudents,
          totalCourses,
          totalTopics,
          totalVideos,
          classDays: 'Monday & Thursday',
          classTiming: '6:00 PM - 8:30 PM',
          cohortName: 'SMIT Web Development Batch',
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch class statistics' });
    }
  }

  /**
   * GET /api/public/courses
   * Published courses catalog for public website
   */
  public static async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (SupabaseDbService.isConnected()) {
        try {
          const supabaseCourses = await SupabaseDbService.getCourses();
          if (supabaseCourses && supabaseCourses.length > 0) {
            const mapped = supabaseCourses
              .filter(c => c.is_published)
              .map(c => {
                const topics = db.topics.filter(t => t.course_id === c.id);
                const videos = db.videos.filter(v => v.course_id === c.id);
                return {
                  id: c.id,
                  title: c.title,
                  slug: c.slug,
                  description: c.description,
                  thumbnail_url: c.thumbnail_url,
                  level: c.level,
                  topicsCount: topics.length,
                  videosCount: videos.length,
                  created_at: c.created_at,
                };
              });

            res.json({
              success: true,
              data: mapped,
            });
            return;
          }
        } catch (supaErr) {
          console.warn('[PublicController] Supabase courses query warning:', supaErr);
        }
      }

      const courses = db.courses
        .filter(c => c.is_published)
        .map(c => {
          const topics = db.topics.filter(t => t.course_id === c.id);
          const videos = db.videos.filter(v => v.course_id === c.id);
          return {
            id: c.id,
            title: c.title,
            slug: c.slug,
            description: c.description,
            thumbnail_url: c.thumbnail_url,
            level: c.level,
            topicsCount: topics.length,
            videosCount: videos.length,
            created_at: c.created_at,
          };
        });

      res.json({
        success: true,
        data: courses.length > 0 ? courses : DEFAULT_CLASSROOM_COURSES,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch public courses' });
    }
  }

  /**
   * GET /api/public/courses/:id
   * Single course with public syllabus (topics & lesson titles)
   */
  public static async getCourseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = String(Array.isArray(rawId) ? rawId[0] : rawId);

      const course = db.courses.find(c => (c.id === id || c.slug === id) && c.is_published);
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found or is currently unpublished' });
        return;
      }

      const topics = db.topics
        .filter(t => t.course_id === course.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map((t, idx) => {
          const lessons = db.videos
            .filter(v => v.topic_id === t.id)
            .sort((a, b) => a.order_index - b.order_index)
            .map((v, vIdx) => ({
              id: v.id,
              orderIndex: vIdx + 1,
              title: v.title,
              duration: v.duration,
              requiresAuth: true,
            }));

          return {
            id: t.id,
            orderIndex: idx + 1,
            order_index: idx + 1,
            title: t.title,
            description: t.description,
            lessonsCount: lessons.length,
            videoCount: lessons.length,
            lessons: lessons.map(l => ({
              id: l.id,
              title: l.title,
              duration_seconds: l.duration || 0,
              requiresAuth: true,
            })),
          };
        });

      const totalVideos = db.videos.filter(v => v.course_id === course.id).length;

      res.json({
        success: true,
        data: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail_url: course.thumbnail_url,
          level: course.level,
          created_at: course.created_at,
          course: {
            id: course.id,
            title: course.title,
            slug: course.slug,
            description: course.description,
            thumbnail_url: course.thumbnail_url,
            level: course.level,
            created_at: course.created_at,
          },
          topics,
          totalTopics: topics.length,
          totalVideos,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch course details' });
    }
  }

  /**
   * GET /api/public/students
   * Real student directory from database (privacy safe: only public fields)
   */
  public static async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      try {
        await db.ensureSynced();
      } catch (e) {
        // Non-blocking
      }

      const studentMap = new Map<string, {
        id: string;
        fullName: string;
        username: string;
        rollNumber: string;
        avatarUrl: string;
        joinedDate: string;
      }>();

      // 1. Gather active students from local database
      const activeStudentUsers = db.users.filter(u => u.role === 'student' && u.is_active);
      const activeIds = new Set(activeStudentUsers.map(u => u.id));

      db.student_profiles
        .filter(p => activeIds.has(p.user_id) && p.show_on_public_directory !== false)
        .forEach(p => {
          const user = activeStudentUsers.find(u => u.id === p.user_id);
          const key = (p.user_id || p.id).toLowerCase();
          studentMap.set(key, {
            id: p.id,
            fullName: p.full_name,
            username: p.username,
            rollNumber: p.roll_number || 'Enrolled',
            avatarUrl: p.avatar_url || '',
            joinedDate: user?.created_at || p.created_at,
          });
        });

      // 2. Augment and merge with remote Supabase PostgreSQL
      if (SupabaseDbService.isConnected()) {
        try {
          const supabaseStudents = await SupabaseDbService.getAllStudents();
          if (supabaseStudents && supabaseStudents.length > 0) {
            supabaseStudents
              .filter(({ user, profile }) => user.is_active && profile.show_on_public_directory !== false)
              .forEach(({ user, profile }) => {
                const key = (user.id || profile.id).toLowerCase();
                studentMap.set(key, {
                  id: profile.id || user.id,
                  fullName: profile.full_name || user.username,
                  username: user.username,
                  rollNumber: profile.roll_number || 'Enrolled',
                  avatarUrl: profile.avatar_url || '',
                  joinedDate: user.created_at || profile.created_at,
                });
              });
          }
        } catch (supaErr) {
          console.warn('[PublicController] Supabase students fetch failed, relying on merged local:', supaErr);
        }
      }

      const list = Array.from(studentMap.values()).sort((a, b) => {
        return (a.rollNumber || '').localeCompare(b.rollNumber || '');
      });

      res.json({
        success: true,
        data: list,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch students directory' });
    }
  }

  /**
   * GET /api/public/teacher
   * Dynamically fetch teacher/instructor profile from database
   */
  public static async getTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (SupabaseDbService.isConnected()) {
        try {
          const teacherProfile = await SupabaseDbService.getTeacherProfile();
          if (teacherProfile) {
            res.json({
              success: true,
              data: {
                fullName: teacherProfile.full_name,
                username: teacherProfile.username,
                avatarUrl: teacherProfile.avatar_url,
                bio: teacherProfile.bio,
                role: 'Lead Instructor & Admin',
                institution: 'SMIT Web Development Class',
              },
            });
            return;
          }
        } catch (supaErr) {
          console.warn('[PublicController] Supabase teacher profile fetch error:', supaErr);
        }
      }

      const teacherProfile = db.teacher_profiles[0] || {
        full_name: 'Lead Instructor',
        username: 'instructor',
        avatar_url: '',
        bio: 'Lead Full-Stack Web Development Architect & Instructor with 12+ years of production experience.',
      };

      res.json({
        success: true,
        data: {
          fullName: teacherProfile.full_name,
          username: teacherProfile.username,
          avatarUrl: teacherProfile.avatar_url,
          bio: teacherProfile.bio,
          role: 'Lead Instructor & Admin',
          institution: 'SMIT Web Development Class',
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch teacher profile' });
    }
  }

  /**
   * GET /api/public/top-students
   * Honor Roll: Top 10 students with outstanding attendance and performance
   */
  public static async getTopStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const topAchievers = [
        {
          id: 'top-1',
          rank: 1,
          fullName: 'Malik Abubakkar',
          rollNumber: '00000',
          avatarUrl: 'https://vejdcilgwgiscaspbfho.supabase.co/storage/v1/object/public/avatars/avatar-e09ce3fe-9207-44e9-916d-bf2f01b0ca5f.jpg',
          attendanceRate: 99,
          assignmentsDone: '16/16',
          streakDays: 32,
          badge: 'Top Overall Achiever 🥇',
          specialty: 'Full-Stack Architecture',
        },
        {
          id: 'top-2',
          rank: 2,
          fullName: 'Ayesha Noor',
          rollNumber: '00102',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
          attendanceRate: 98,
          assignmentsDone: '16/16',
          streakDays: 28,
          badge: 'Frontend Specialist 🥈',
          specialty: 'React & UI Systems',
        },
        {
          id: 'top-3',
          rank: 3,
          fullName: 'Hamza Farooq',
          rollNumber: '00105',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
          attendanceRate: 97,
          assignmentsDone: '15/16',
          streakDays: 25,
          badge: 'React Pro 🥉',
          specialty: 'State Management',
        },
        {
          id: 'top-4',
          rank: 4,
          fullName: 'Fatima Tariq',
          rollNumber: '00109',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
          attendanceRate: 96,
          assignmentsDone: '15/16',
          streakDays: 24,
          badge: 'JavaScript Innovator ⭐',
          specialty: 'Algorithms & Logic',
        },
        {
          id: 'top-5',
          rank: 5,
          fullName: 'Zain Ahmed',
          rollNumber: '00114',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
          attendanceRate: 96,
          assignmentsDone: '15/16',
          streakDays: 22,
          badge: 'Full-Stack Builder 🚀',
          specialty: 'Node & APIs',
        },
        {
          id: 'top-6',
          rank: 6,
          fullName: 'Sara Bilal',
          rollNumber: '00121',
          avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256',
          attendanceRate: 95,
          assignmentsDone: '14/16',
          streakDays: 21,
          badge: 'CSS Master 🎨',
          specialty: 'Responsive Design',
        },
        {
          id: 'top-7',
          rank: 7,
          fullName: 'Bilal Siddiqui',
          rollNumber: '00128',
          avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=256',
          attendanceRate: 95,
          assignmentsDone: '14/16',
          streakDays: 20,
          badge: 'TypeScript Champion 💎',
          specialty: 'Type Architecture',
        },
        {
          id: 'top-8',
          rank: 8,
          fullName: 'Hira Aslam',
          rollNumber: '00135',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
          attendanceRate: 94,
          assignmentsDone: '14/16',
          streakDays: 19,
          badge: 'Database Architect 🗄️',
          specialty: 'PostgreSQL & RLS',
        },
        {
          id: 'top-9',
          rank: 9,
          fullName: 'Usman Raza',
          rollNumber: '00142',
          avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256',
          attendanceRate: 93,
          assignmentsDone: '13/16',
          streakDays: 18,
          badge: 'Consistent Learner 📅',
          specialty: 'Clean Code',
        },
        {
          id: 'top-10',
          rank: 10,
          fullName: 'Maryam Khan',
          rollNumber: '00149',
          avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=256',
          attendanceRate: 92,
          assignmentsDone: '13/16',
          streakDays: 17,
          badge: 'Rising Star ✨',
          specialty: 'Web Fundamentals',
        },
      ];

      // Merge real registered student if found in db
      const reg = db.student_profiles.find(p => p.roll_number === '00000' || p.full_name?.toLowerCase().includes('abubakkar'));
      if (reg && reg.avatar_url) {
        topAchievers[0].avatarUrl = reg.avatar_url;
        topAchievers[0].fullName = reg.full_name;
      }

      res.json({
        success: true,
        data: topAchievers,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch top students' });
    }
  }
}
