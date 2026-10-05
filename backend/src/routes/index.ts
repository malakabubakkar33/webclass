import { Router } from 'express';
import authRoutes from './authRoutes.js';
import courseRoutes from './courseRoutes.js';
import topicRoutes from './topicRoutes.js';
import videoRoutes from './videoRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import studentRoutes from './studentRoutes.js';
import teacherRoutes from './teacherRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';
import bunnyRoutes from './bunnyRoutes.js';

import publicRoutes from './publicRoutes.js';

const router = Router();

router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/topics', topicRoutes);
router.use('/videos', videoRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/students', studentRoutes);
router.use('/teacher', teacherRoutes);
router.use('/notifications', notificationRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/bunny', bunnyRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SMIT Web Class API',
  });
});

export default router;
