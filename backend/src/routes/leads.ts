import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import {
  listLeads,
  createLead,
  getLead,
  updateLead,
  assignLeadToUser,
  deleteLead,
  listNotes,
  addNote,
  listActivity,
} from '../controllers/leadController';

const router = Router();

// All lead routes require authentication
router.use(requireAuth);

router.get('/', listLeads);
router.post('/', createLead);
router.get('/:id', getLead);
router.patch('/:id', updateLead); // Permission granularity inside controller
router.patch('/:id/assign', requireRole('ADMIN'), assignLeadToUser);
router.delete('/:id', requireRole('ADMIN'), deleteLead);

router.get('/:id/notes', listNotes);
router.post('/:id/notes', addNote); // Permission granularity inside controller

router.get('/:id/activity', listActivity);

export default router;
