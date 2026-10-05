import { Router, Request, Response } from 'express';
import { BunnyService } from '../services/bunnyService.js';
import { authenticate, requireTeacher } from '../middlewares/authMiddleware.js';

const router = Router();

// Check Bunny.net platform status & available libraries / zones
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await BunnyService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to query Bunny.net status',
    });
  }
});

// Create Video Library (Teacher only)
router.post('/create-library', authenticate, requireTeacher, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Library name is required' });
      return;
    }

    const result = await BunnyService.createLibrary(name);
    if (!result.success) {
      res.status(result.status || 400).json({
        success: false,
        message: result.message,
        data: result.data,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Bunny Video Library created successfully',
      data: result.data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
