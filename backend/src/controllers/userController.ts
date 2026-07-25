import { Request, Response } from 'express';
import {
  getAllUsers,
  getUserById,
  createNewUser,
  updateUserById,
  CreateUserSchema,
  UpdateUserSchema,
} from '../services/userService';

// GET /api/users (ADMIN only)
export async function listUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await getAllUsers();
    res.status(200).json({ users });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/users (ADMIN only)
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const user = await createNewUser(parsed.data);
    res.status(201).json({ user });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'EMAIL_CONFLICT') {
      res.status(409).json({ error: 'A user with this email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// GET /api/users/:id (ADMIN only)
export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const user = await getUserById(req.params.id);
    res.status(200).json({ user });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// PATCH /api/users/:id (ADMIN only)
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const parsed = UpdateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const user = await updateUserById(req.params.id, parsed.data);
    res.status(200).json({ user });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'User not found' });
    } else if (error.message === 'EMAIL_CONFLICT') {
      res.status(409).json({ error: 'Email already in use' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
