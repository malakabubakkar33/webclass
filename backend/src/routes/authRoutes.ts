import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/login', AuthController.login);
router.post('/signup', AuthController.signup);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/reset-password', AuthController.resetPassword);
router.post('/upload-avatar', upload.single('avatar'), AuthController.uploadAvatar);
router.get('/teacher-setup-status', AuthController.getTeacherSetupStatus);
router.post('/teacher-setup', AuthController.setupTeacher);
router.get('/me', authenticate, AuthController.getMe);
router.put('/profile', authenticate, AuthController.updateMe);
router.post('/change-password', authenticate, AuthController.changePassword);

export default router;
