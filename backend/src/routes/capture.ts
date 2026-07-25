import { Router } from 'express';
import { capturePublicLead } from '../controllers/captureController';

const router = Router();

// Public — no auth required
router.post('/', capturePublicLead);

export default router;
