import { Request, Response } from 'express';
import { z } from 'zod';
import { loginUser } from '../services/authService';
import { findUserById } from '../repositories/userRepository';
import { config } from '../config/env';
import { AuthRequest } from '../types';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const token = await loginUser(parsed.data.email, parsed.data.password);

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Also return token in body for API clients
    res.status(200).json({ token, message: 'Login successful' });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Invalid email or password' });
    } else if (error.message === 'ACCOUNT_DISABLED') {
      res.status(401).json({ error: 'Account is disabled' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await findUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}
