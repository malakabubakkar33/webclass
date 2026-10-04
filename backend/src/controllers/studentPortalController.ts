import { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { SupabaseDbService } from '../services/supabaseDbService.js';

export class StudentPortalController {
  /**
   * GET /api/students/dashboard
   * Full data payload for the advanced Student Dashboard
   */
  public static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const studentId = req.user.userId;
      let profile = db.student_profiles.find((p) => p.user_id === studentId);
      let user = db.users.find((u) => u.id === studentId);

      if ((!profile || !user) && SupabaseDbService.isConnected()) {
        try {
          if (!profile) {
            const sp = await SupabaseDbService.getStudentProfile(studentId);
            if (sp) {
              profile = sp;
              if (!db.student_profiles.some(p => p.user_id === sp.user_id)) {
                db.student_profiles.push(sp);
              }
            }
          }
          if (!user) {
            const u = await SupabaseDbService.getUserById(studentId);
            if (u) {
              user = u;
              if (!db.users.some(usr => usr.id === u.id)) {
                db.users.push(u);
              }
            }
          }
        } catch (e) {
          console.warn('[StudentPortalController] Supabase profile fetch fallback notice:', e);
        }
      }

      const publishedCourses = db.courses.filter((c) => c.is_published);
      const publishedCourseIds = new Set(publishedCourses.map((c) => c.id));
      const allVideos = db.videos.filter((v) => publishedCourseIds.has(v.course_id));

      const studentProgress = db.video_progress.filter((vp) => vp.student_id === studentId);
      const completedVideoIds = new Set(studentProgress.filter((vp) => vp.completed).map((vp) => vp.video_id));

      const completedCount = allVideos.filter((v) => completedVideoIds.has(v.id)).length;
      const totalVideosCount = allVideos.length;
      const overallProgress = totalVideosCount > 0 ? Math.round((completedCount / totalVideosCount) * 100) : 0;

      // Attendance Metrics
      const studentAttendance = db.attendance.filter((a) => a.student_id === studentId);
      const totalClasses = studentAttendance.length;
      const presentCount = studentAttendance.filter((a) => a.status === 'present').length;
      const absentCount = studentAttendance.filter((a) => a.status === 'absent').length;
      const leaveCount = studentAttendance.filter((a) => a.status === 'leave').length;
      const countableSessions = Math.max(1, totalClasses - leaveCount);
      const attendanceRate = totalClasses > 0 ? Math.round((presentCount / (totalClasses > leaveCount ? countableSessions : totalClasses)) * 100) : 100;

      // Assignments Metrics
      const publishedAssignments = db.assignments.filter((a) => a.published);
      const studentSubmissions = db.assignment_submissions.filter((s) => s.student_id === studentId);
      const completedAssignments = studentSubmissions.filter((s) => s.status === 'submitted' || s.status === 'graded').length;
      const totalAssignments = publishedAssignments.length;
      const pendingAssignments = Math.max(0, totalAssignments - completedAssignments);

      // Next Upcoming Assignment
      const upcomingAssignment = publishedAssignments
        .filter((a) => new Date(a.due_at).getTime() > Date.now())
        .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())[0] || publishedAssignments[0] || null;

      // Course Progress Breakdown
      const courseProgress = publishedCourses.map((course) => {
        const topics = db.topics.filter((t) => t.course_id === course.id);
        const videos = db.videos.filter((v) => v.course_id === course.id);
        const completedInCourse = videos.filter((v) => completedVideoIds.has(v.id)).length;
        const progressPercentage = videos.length > 0 ? Math.round((completedInCourse / videos.length) * 100) : 0;

        return {
          id: course.id,
          title: course.title,
          slug: course.slug,
          level: course.level,
          thumbnailUrl: course.thumbnail_url,
          topicsCount: topics.length,
          videosCount: videos.length,
          completedVideosCount: completedInCourse,
          progressPercentage,
        };
      });

      // Continue Learning (Last watched video or first incomplete video)
      let continueLearning: any = null;
      const lastWatchedProgress = [...studentProgress]
        .filter((vp) => vp.watched)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

      if (lastWatchedProgress) {
        const lastVid = allVideos.find((v) => v.id === lastWatchedProgress.video_id);
        if (lastVid) {
          const c = publishedCourses.find((course) => course.id === lastVid.course_id);
          const t = db.topics.find((topic) => topic.id === lastVid.topic_id);
          continueLearning = {
            videoId: lastVid.id,
            courseId: c?.id,
            courseTitle: c?.title || 'Web Development',
            topicTitle: t?.title || 'Current Topic',
            lessonTitle: lastVid.title,
            duration: lastVid.duration || '15:00',
            progressSeconds: lastWatchedProgress.progress_seconds,
            isCompleted: lastWatchedProgress.completed,
            progressPercent: lastWatchedProgress.completed ? 100 : Math.min(85, Math.max(15, Math.round((lastWatchedProgress.progress_seconds / 600) * 100))),
          };
        }
      }

      if (!continueLearning && allVideos.length > 0) {
        const firstIncomplete = allVideos.find((v) => !completedVideoIds.has(v.id)) || allVideos[0];
        const c = publishedCourses.find((course) => course.id === firstIncomplete.course_id);
        const t = db.topics.find((topic) => topic.id === firstIncomplete.topic_id);
        continueLearning = {
          videoId: firstIncomplete.id,
          courseId: c?.id,
          courseTitle: c?.title || 'Web Development',
          topicTitle: t?.title || 'Introduction',
          lessonTitle: firstIncomplete.title,
          duration: firstIncomplete.duration || '12:00',
          progressSeconds: 0,
          isCompleted: false,
          progressPercent: 0,
        };
      }

      // Latest Lessons / Topics From Teacher (Sorted by created_at DESC)
      const nowMs = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      const latestLessons = [...allVideos]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4)
        .map((v) => {
          const c = publishedCourses.find((course) => course.id === v.course_id);
          const t = db.topics.find((topic) => topic.id === v.topic_id);
          const isCompleted = completedVideoIds.has(v.id);
          const isNew = nowMs - new Date(v.created_at).getTime() <= sevenDaysMs;

          return {
            id: v.id,
            courseId: c?.id,
            courseTitle: c?.title || 'Course',
            topicId: t?.id,
            topicTitle: t?.title || 'Module',
            lessonTitle: v.title,
            duration: v.duration || '15:00',
            publishedDate: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            isCompleted,
            isNew,
          };
        });

      // Learning Progress Timeline (Grouped by date for Recharts)
      const completedList = studentProgress
        .filter((vp) => vp.completed && vp.completed_at)
        .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime());

      const progressMap = new Map<string, number>();
      completedList.forEach((vp) => {
        const d = new Date(vp.completed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        progressMap.set(d, (progressMap.get(d) || 0) + 1);
      });

      let cumulative = 0;
      let learningProgressTimeline = Array.from(progressMap.entries()).map(([date, count]) => {
        cumulative += count;
        return {
          date,
          completed: count,
          total: cumulative,
        };
      });

      // If freshly registered or low history, generate an encouraging baseline curve
      if (learningProgressTimeline.length === 0) {
        const today = new Date();
        learningProgressTimeline = [
          { date: 'Day 1', completed: 0, total: 0 },
          { date: 'Week 1', completed: Math.max(1, Math.min(completedCount, 2)), total: Math.max(1, Math.min(completedCount, 2)) },
          { date: 'Today', completed: completedCount, total: completedCount },
        ];
      }

      // Recent Activity Log
      const recentActivity = db.activity_logs
        .filter((l) => l.actor_user_id === studentId || l.event_type === 'TOPIC_CREATED' || l.event_type === 'VIDEO_UPLOADED' || l.event_type === 'ASSIGNMENT_CREATED')
        .slice(0, 6);

      const teacherProfile = db.teacher_profiles[0];
      const instructor = {
        fullName: teacherProfile ? teacherProfile.full_name : 'Class Instructor',
        username: teacherProfile ? teacherProfile.username : 'teacher',
        avatarUrl: teacherProfile ? teacherProfile.avatar_url : '',
        bio: teacherProfile ? teacherProfile.bio : '',
        email: teacherProfile ? teacherProfile.email : '',
      };

      res.json({
        success: true,
        data: {
          student: {
            id: studentId,
            fullName: profile ? profile.full_name : (user?.username || req.user.username || 'Enrolled Student'),
            rollNumber: profile?.roll_number || 'STUDENT',
            avatarUrl: profile?.avatar_url || (profile?.full_name ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name)}` : ''),
          },
          instructor,
          stats: {
            overallProgress,
            completedLessons: completedCount,
            totalLessons: totalVideosCount,
            attendanceRate,
            totalClasses,
            presentCount,
            absentCount,
            assignments: {
              total: totalAssignments,
              completed: completedAssignments,
              pending: pendingAssignments,
            },
          },
          welcome: {
            currentCourse: continueLearning?.courseTitle || courseProgress[0]?.title || 'Web Development',
            latestLesson: latestLessons[0]?.lessonTitle || 'Web Standards Intro',
            nextAssignment: upcomingAssignment ? upcomingAssignment.title : 'No pending assignments',
            attendanceStatus: `${attendanceRate}% Attendance Fidelity`,
          },
          continueLearning,
          latestLessons,
          courseProgress,
          attendanceOverview: {
            rate: attendanceRate,
            presentCount,
            absentCount,
            leaveCount,
            totalClasses,
            pieData: [
              { name: 'Present', value: Math.max(presentCount, 1), color: '#10B981' },
              { name: 'Absent', value: absentCount, color: '#EF4444' },
              { name: 'Leave', value: leaveCount, color: '#F59E0B' },
            ],
          },
          learningProgressTimeline,
          recentActivity,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/students/courses/:id/roadmap
   * Full data payload for the two-part Learning Roadmap view
   */
  public static async getCourseRoadmap(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = String(req.params.id);
      const studentId = req.user?.userId;

      const course = db.courses.find((c) => c.id === courseId || c.slug === courseId);
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }

      const rawTopics = db.topics
        .filter((t) => t.course_id === course.id)
        .sort((a, b) => a.order_index - b.order_index);
      const seenTopicIds = new Set<string>();
      const topics = rawTopics.filter((t) => {
        if (seenTopicIds.has(t.id)) return false;
        seenTopicIds.add(t.id);
        return true;
      });

      const allCourseVideos = db.videos.filter((v) => v.course_id === course.id);

      const studentCompletedSet = new Set(
        studentId
          ? db.video_progress
              .filter((vp) => vp.student_id === studentId && vp.completed)
              .map((vp) => vp.video_id)
          : []
      );

      const totalCompleted = allCourseVideos.filter((v) => studentCompletedSet.has(v.id)).length;
      const progressPercentage = allCourseVideos.length > 0
        ? Math.round((totalCompleted / allCourseVideos.length) * 100)
        : 0;

      const nowMs = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      let foundCurrent = false;

      const roadmapTopics = topics.map((topic, index) => {
        const rawTopicVideos = db.videos
          .filter((v) => v.topic_id === topic.id)
          .sort((a, b) => a.order_index - b.order_index);
        const seenVids = new Set<string>();
        const topicVideos = rawTopicVideos.filter((v) => {
          if (seenVids.has(v.id)) return false;
          seenVids.add(v.id);
          return true;
        });

        const topicLessons = topicVideos.map((v, vIndex) => ({
          id: v.id,
          lessonNumber: String(vIndex + 1).padStart(2, '0'),
          title: v.title,
          description: v.description,
          duration: v.duration || '15:00',
          isCompleted: studentCompletedSet.has(v.id),
          isNew: nowMs - new Date(v.created_at).getTime() <= sevenDaysMs,
        }));

        const completedInTopic = topicLessons.filter((l) => l.isCompleted).length;
        const isTopicCompleted = topicLessons.length > 0 && completedInTopic === topicLessons.length;

        // Current topic logic: first incomplete topic is marked as Current
        let isCurrent = false;
        if (!isTopicCompleted && !foundCurrent) {
          isCurrent = true;
          foundCurrent = true;
        }

        const isNew = nowMs - new Date(topic.created_at).getTime() <= sevenDaysMs;

        return {
          id: topic.id,
          topicNumber: String(index + 1).padStart(2, '0'),
          title: topic.title,
          description: topic.description,
          orderIndex: topic.order_index,
          lessonCount: topicLessons.length,
          completedCount: completedInTopic,
          isCompleted: isTopicCompleted,
          isCurrent,
          isNew,
          lessons: topicLessons,
        };
      });

      // If all completed, mark first topic as current
      if (!foundCurrent && roadmapTopics.length > 0) {
        roadmapTopics[0].isCurrent = true;
      }

      // Latest Content from Teacher in this Course (published_at DESC)
      const latestVideo = [...allCourseVideos].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0] || null;

      let latestTeacherContent: any = null;
      if (latestVideo) {
        const t = topics.find((topic) => topic.id === latestVideo.topic_id);
        latestTeacherContent = {
          videoId: latestVideo.id,
          title: latestVideo.title,
          topicTitle: t ? t.title : 'Curriculum Module',
          duration: latestVideo.duration || '15:00',
          publishedDate: new Date(latestVideo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isNew: nowMs - new Date(latestVideo.created_at).getTime() <= sevenDaysMs,
          description: latestVideo.description,
        };
      }

      // Continue Where Left Off in this course
      let continueWhereLeftOff: any = null;
      if (studentId) {
        const studentCourseProgress = db.video_progress.filter((vp) =>
          allCourseVideos.some((v) => v.id === vp.video_id && vp.student_id === studentId)
        );
        const lastWatched = studentCourseProgress.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0];

        if (lastWatched) {
          const v = allCourseVideos.find((vid) => vid.id === lastWatched.video_id);
          const t = topics.find((topic) => topic.id === v?.topic_id);
          if (v) {
            continueWhereLeftOff = {
              videoId: v.id,
              lessonTitle: v.title,
              topicTitle: t?.title || 'Current Topic',
              progressPercent: lastWatched.completed ? 100 : 65,
              duration: v.duration || '15:00',
            };
          }
        }
      }

      res.json({
        success: true,
        data: {
          course: {
            id: course.id,
            title: course.title,
            slug: course.slug,
            description: course.description,
            level: course.level,
            thumbnailUrl: course.thumbnail_url,
            totalTopics: topics.length,
            totalVideos: allCourseVideos.length,
            totalCompleted,
            progressPercentage,
          },
          latestTeacherContent,
          continueWhereLeftOff,
          topics: roadmapTopics,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
