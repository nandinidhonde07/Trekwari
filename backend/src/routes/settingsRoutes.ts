import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { requireAuth, requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getSettings);
router.put('/', requireAuth, requireSuperAdmin, updateSettings);

export default router;
