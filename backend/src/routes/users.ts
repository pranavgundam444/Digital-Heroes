import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { listUsers, createUser, getUser, updateUser } from '../controllers/userController';

const router = Router();

// All user management routes require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

router.get('/', listUsers);
router.post('/', createUser);
router.get('/:id', getUser);
router.patch('/:id', updateUser);

export default router;
