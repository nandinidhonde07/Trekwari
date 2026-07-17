import { Router } from 'express';
import { 
  getPolicies, getPolicyById, createPolicy, 
  updatePolicy, duplicatePolicy, deletePolicy, assignPolicy 
} from '../controllers/policyController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getPolicies);
router.get('/:id', getPolicyById);

// Admin-only routes
router.post('/', requireAuth, requireAdmin, createPolicy);
router.put('/:id', requireAuth, requireAdmin, updatePolicy);
router.post('/:id/duplicate', requireAuth, requireAdmin, duplicatePolicy);
router.delete('/:id', requireAuth, requireAdmin, deletePolicy);
router.post('/assign', requireAuth, requireAdmin, assignPolicy);

export default router;
