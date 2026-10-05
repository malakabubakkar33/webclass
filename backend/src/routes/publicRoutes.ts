import { Router } from 'express';
import { PublicController } from '../controllers/publicController.js';

const router = Router();

router.get('/stats', PublicController.getStats);
router.get('/courses', PublicController.getCourses);
router.get('/courses/:id', PublicController.getCourseById);
router.get('/students', PublicController.getStudents);
router.get('/top-students', PublicController.getTopStudents);
router.get('/teacher', PublicController.getTeacher);

export default router;
