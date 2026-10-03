import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { SupabaseDbService } from '../services/supabaseDbService.js';

export class PublicController {
  /**
   * GET /api/public/stats
   * Dynamic classroom metrics
   */
  public static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let totalStudents = db.users.filter(u => u.role === 'student' && u.is_active).length;
      let totalCourses = db.courses.filter(c => c.is_published).length;
      let totalTopics = db.topics.length;
      let totalVideos = db.videos.length;

      if (SupabaseDbService.isConnected()) {
        try {
          const students = await SupabaseDbService.getAllStudents();
          const courses = await SupabaseDbService.getCourses();
          const tCount = await SupabaseDbService.getTopicsCount();
          const vCount = await SupabaseDbService.getVideosCount();
          if (students && students.length >= 0) {
            totalStudents = students.filter(s => s.user.is_active).length;
          }
          if (courses && courses.length > 0) {
            totalCourses = courses.filter(c => c.is_published).length;
          }
          if (tCount > 0) totalTopics = tCount;
          if (vCount > 0) totalVideos = vCount;
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
        data: courses,
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
      if (SupabaseDbService.isConnected()) {
        try {
          const supabaseStudents = await SupabaseDbService.getAllStudents();
          if (supabaseStudents && supabaseStudents.length > 0) {
            const list = supabaseStudents
              .filter(({ user, profile }) => user.is_active && profile.show_on_public_directory !== false)
              .map(({ user, profile }) => ({
                id: profile.id || user.id,
                fullName: profile.full_name || user.username,
                username: user.username,
                rollNumber: profile.roll_number || 'Enrolled',
                avatarUrl: profile.avatar_url || '',
                joinedDate: user.created_at || profile.created_at,
              }))
              .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

            res.json({
              success: true,
              data: list,
            });
            return;
          }
        } catch (supaErr) {
          console.warn('[PublicController] Supabase students fetch failed, falling back to local:', supaErr);
        }
      }

      const activeStudentUsers = db.users.filter(u => u.role === 'student' && u.is_active);
      const activeIds = new Set(activeStudentUsers.map(u => u.id));

      const students = db.student_profiles
        .filter(p => activeIds.has(p.user_id) && p.show_on_public_directory !== false)
        .map(p => {
          const user = activeStudentUsers.find(u => u.id === p.user_id);
          return {
            id: p.id,
            fullName: p.full_name,
            username: p.username,
            rollNumber: p.roll_number,
            avatarUrl: p.avatar_url,
            joinedDate: user?.created_at || p.created_at,
          };
        })
        .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

      res.json({
        success: true,
        data: students,
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
}
