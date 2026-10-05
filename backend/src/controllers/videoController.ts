import { Response, NextFunction } from 'express';
import { VideoService } from '../services/videoService.js';
import { StorageService } from '../services/storageService.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

export class VideoController {
  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
      const studentId = req.user?.role === 'student' ? req.user.userId : undefined;
      const result = VideoService.getVideoWithContext(id, studentId);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message || 'Video not found' });
    }
  }

  public static async uploadVideoFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No video file provided' });
        return;
      }

      const destinationPath = `lessons/${Date.now()}-${req.file.originalname}`;
      const uploadResult = req.file.buffer
        ? await StorageService.uploadBuffer(
            'course-videos',
            req.file.buffer,
            destinationPath,
            req.file.mimetype
          )
        : await StorageService.uploadFile(
            'course-videos',
            req.file.path,
            destinationPath,
            req.file.mimetype
          );

      res.json({
        success: true,
        message: 'Video file uploaded successfully to storage',
        data: uploadResult,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const { courseId, topicId, title, description, videoUrl, storagePath, thumbnailUrl, duration, orderIndex } = req.body;

      if (!courseId || !topicId || !title || !videoUrl) {
        res.status(400).json({
          success: false,
          message: 'courseId, topicId, title, and videoUrl are required',
        });
        return;
      }

      const newVideo = await VideoService.createVideo(req.user.userId, {
        courseId,
        topicId,
        title,
        description,
        videoUrl,
        storagePath,
        thumbnailUrl,
        duration,
        orderIndex,
      });

      res.status(201).json({
        success: true,
        message: 'Video lesson published successfully and students notified!',
        data: newVideo,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateProgress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'student') {
        res.status(403).json({ success: false, message: 'Only students can track video progress' });
        return;
      }
      const rawId = req.params.id;
      const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
      const { completed, progressSeconds } = req.body;

      const updated = VideoService.updateProgress(
        req.user.userId,
        id,
        completed ?? true,
        progressSeconds || 0
      );

      res.json({
        success: true,
        message: completed ? 'Lesson marked as completed!' : 'Progress saved',
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const rawId = req.params.id;
      const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
      const { title, description, videoUrl, storagePath, thumbnailUrl, duration } = req.body;

      const updated = VideoService.updateVideo(id, {
        title,
        description,
        videoUrl,
        storagePath,
        thumbnailUrl,
        duration,
      });

      res.json({
        success: true,
        message: 'Video lesson updated successfully',
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'teacher') {
        res.status(403).json({ success: false, message: 'Teacher access required' });
        return;
      }
      const rawId = req.params.id;
      const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
      VideoService.deleteVideo(id);
      res.json({
        success: true,
        message: 'Video lesson deleted successfully',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
