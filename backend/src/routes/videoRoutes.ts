import { Router } from 'express';
import { VideoController } from '../controllers/videoController.js';
import { authenticate, requireTeacher, requireStudent } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = Router();

// Stream or retrieve lesson details with navigation
router.get('/:id', authenticate, VideoController.getById);

// Teacher video upload to storage
router.post('/upload', authenticate, requireTeacher, upload.single('video'), VideoController.uploadVideoFile);

// Save lesson metadata in database and dispatch notifications
router.post('/', authenticate, requireTeacher, VideoController.create);

// Student watch progress update
router.post('/:id/progress', authenticate, requireStudent, VideoController.updateProgress);

// Teacher update video (e.g. Google Drive link, title, description)
router.put('/:id', authenticate, requireTeacher, VideoController.update);

// Teacher delete video
router.delete('/:id', authenticate, requireTeacher, VideoController.delete);

export default router;
