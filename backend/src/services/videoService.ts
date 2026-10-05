import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { Video, VideoProgress } from '../models/types.js';
import { NotificationService } from './notificationService.js';
import { EmailService } from './emailService.js';
import { ENV } from '../config/env.js';

export class VideoService {
  /**
   * Get single video with course and topic context + student progress + navigation links
   */
  public static getVideoWithContext(videoId: string, studentId?: string) {
    const video = db.videos.find(v => v.id === videoId);
    if (!video) throw new Error('Video not found');

    const course = db.courses.find(c => c.id === video.course_id);
    const topic = db.topics.find(t => t.id === video.topic_id);

    // Get all videos in this course sorted in sequence
    const topicsInCourse = db.topics
      .filter(t => t.course_id === video.course_id)
      .sort((a, b) => a.order_index - b.order_index);

    const topicMap = new Map(topicsInCourse.map(t => [t.id, t.title]));

    // Sequential list of all videos across all topics in the course
    const allCourseVideos: (Video & { topicTitle: string; isCompleted: boolean })[] = [];
    const studentCompletedSet = new Set(
      studentId
        ? db.video_progress.filter(vp => vp.student_id === studentId && vp.completed).map(vp => vp.video_id)
        : []
    );

    const seenVideoIds = new Set<string>();
    topicsInCourse.forEach(t => {
      const vids = db.videos
        .filter(v => v.topic_id === t.id)
        .sort((a, b) => a.order_index - b.order_index);
      
      vids.forEach(v => {
        if (!seenVideoIds.has(v.id)) {
          seenVideoIds.add(v.id);
          allCourseVideos.push({
            ...v,
            topicTitle: t.title,
            isCompleted: studentCompletedSet.has(v.id),
          });
        }
      });
    });

    const currentIndex = allCourseVideos.findIndex(v => v.id === videoId);
    const prevVideo = currentIndex > 0 ? allCourseVideos[currentIndex - 1] : null;
    const nextVideo = currentIndex >= 0 && currentIndex < allCourseVideos.length - 1 ? allCourseVideos[currentIndex + 1] : null;

    let progress: VideoProgress | null = null;
    if (studentId) {
      progress = db.video_progress.find(vp => vp.student_id === studentId && vp.video_id === videoId) || null;
      if (!progress) {
        // Auto-create initial watched record
        progress = {
          id: uuidv4(),
          student_id: studentId,
          video_id: videoId,
          watched: true,
          completed: false,
          progress_seconds: 0,
          updated_at: new Date().toISOString(),
        };
        db.video_progress.push(progress);
        db.save();
      }
    }

    // Get Teacher profile for the video
    const teacherProfile = db.teacher_profiles[0] || {
      full_name: 'Prof. Alex Vance',
      avatar_url: '',
    };

    return {
      video,
      course,
      topic,
      teacher: teacherProfile,
      progress,
      allCourseVideos,
      prevVideoId: prevVideo ? prevVideo.id : null,
      nextVideoId: nextVideo ? nextVideo.id : null,
    };
  }

  /**
   * Upload / Register new video lesson (Teacher Only)
   */
  public static async createVideo(
    teacherId: string,
    data: {
      courseId: string;
      topicId: string;
      title: string;
      description?: string;
      videoUrl: string;
      storagePath?: string;
      thumbnailUrl?: string;
      duration?: string;
      orderIndex?: number;
    }
  ): Promise<Video> {
    const course = db.courses.find(c => c.id === data.courseId);
    if (!course) throw new Error('Course not found');

    const topic = db.topics.find(t => t.id === data.topicId);
    if (!topic) throw new Error('Topic not found');

    const existingInTopic = db.videos.filter(v => v.topic_id === data.topicId);
    const orderIndex = data.orderIndex || existingInTopic.length + 1;

    const newVideo: Video = {
      id: `video-${uuidv4().slice(0, 8)}`,
      course_id: data.courseId,
      topic_id: data.topicId,
      title: data.title.trim(),
      description: data.description || `Comprehensive lesson tutorial on ${data.title}.`,
      video_url: data.videoUrl,
      storage_path: data.storagePath || '',
      thumbnail_url: data.thumbnailUrl || course.thumbnail_url,
      duration: data.duration || '15:00',
      order_index: orderIndex,
      uploaded_by: teacherId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.videos.push(newVideo);
    db.save();

    db.logActivity({
      actor_user_id: teacherId,
      event_type: 'VIDEO_UPLOADED',
      title: 'New Lesson Uploaded',
      description: `Uploaded lesson "${newVideo.title}" to ${course.title}.`,
      reference_type: 'video',
      reference_id: newVideo.id,
    });

    // 1. In-app & FCM Notifications
    await NotificationService.broadcastToStudents(
      'video_uploaded',
      'New Lesson Available',
      `New video lesson "${newVideo.title}" uploaded in ${course.title} (${topic.title}).`,
      'video',
      newVideo.id
    );

    // 2. Email Notifications to students with Resend
    const teacherProfile = db.teacher_profiles[0];
    const teacherName = teacherProfile ? teacherProfile.full_name : 'Your Instructor';
    const studentsWithEmail = db.student_profiles
      .filter(sp => sp.email)
      .map(sp => ({ email: sp.email, name: sp.full_name }));

    const lessonUrl = `${ENV.CLIENT_URL}/student/videos/${newVideo.id}`;

    // Dispatched asynchronously in background
    EmailService.sendBroadcastLessonEmail(studentsWithEmail, {
      courseTitle: course.title,
      topicTitle: topic.title,
      lessonTitle: newVideo.title,
      lessonUrl,
      teacherName,
    }).catch((err: any) => console.error('[VideoService] Broadcast email error:', err));

    return newVideo;
  }

  /**
   * Update video progress (Student)
   */
  public static updateProgress(
    studentId: string,
    videoId: string,
    completed: boolean,
    progressSeconds: number = 0
  ) {
    let progress = db.video_progress.find(
      vp => vp.student_id === studentId && vp.video_id === videoId
    );

    if (progress) {
      progress.progress_seconds = progressSeconds;
      if (completed && !progress.completed) {
        progress.completed = true;
        progress.completed_at = new Date().toISOString();

        const studentProfile = db.student_profiles.find(sp => sp.user_id === studentId);
        const studentName = studentProfile ? studentProfile.full_name : 'A student';
        const vid = db.videos.find(v => v.id === videoId);

        db.logActivity({
          actor_user_id: studentId,
          event_type: 'LESSON_COMPLETED',
          title: 'Student Completed Lesson',
          description: `${studentName} completed "${vid?.title || 'a lesson'}".`,
          reference_type: 'video',
          reference_id: videoId,
        });
      } else if (!completed && progress.completed) {
        progress.completed = false;
        progress.completed_at = null;
      }
      progress.updated_at = new Date().toISOString();
    } else {
      progress = {
        id: uuidv4(),
        student_id: studentId,
        video_id: videoId,
        watched: true,
        completed,
        progress_seconds: progressSeconds,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      db.video_progress.push(progress);
    }

    db.save();
    return progress;
  }

  /**
   * Delete video (Teacher Only)
   */
  public static deleteVideo(videoId: string): void {
    const index = db.videos.findIndex(v => v.id === videoId);
    if (index === -1) throw new Error('Video not found');

    db.videos.splice(index, 1);
    // Remove associated progress records
    const remainingProgress = db.video_progress.filter(vp => vp.video_id !== videoId);
    db.video_progress.length = 0;
    db.video_progress.push(...remainingProgress);

    db.save();
  }

  /**
   * Update video details (e.g. Google Drive URL or title)
   */
  public static updateVideo(
    videoId: string,
    data: {
      title?: string;
      description?: string;
      videoUrl?: string;
      storagePath?: string;
      thumbnailUrl?: string;
      duration?: string;
    }
  ): Video {
    const video = db.videos.find(v => v.id === videoId);
    if (!video) throw new Error('Video not found');

    if (data.title !== undefined) video.title = data.title.trim();
    if (data.description !== undefined) video.description = data.description;
    if (data.videoUrl !== undefined) video.video_url = data.videoUrl;
    if (data.storagePath !== undefined) video.storage_path = data.storagePath;
    if (data.thumbnailUrl !== undefined) video.thumbnail_url = data.thumbnailUrl;
    if (data.duration !== undefined) video.duration = data.duration;
    video.updated_at = new Date().toISOString();

    db.save();
    return video;
  }
}
