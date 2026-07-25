import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthRequest, AuthPayload } from '../types';

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Check httpOnly cookie first
    if (req.cookies?.token) {
      token = req.cookies.token;
    }
    // Fall back to Authorization header (Bearer token)
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
