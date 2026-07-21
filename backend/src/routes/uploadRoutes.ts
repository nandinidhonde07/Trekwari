import { Router } from 'express';
import { uploadImage } from '../controllers/uploadController';

const router = Router();

// POST /api/upload - Direct Image Upload
router.post('/', uploadImage);

export default router;
