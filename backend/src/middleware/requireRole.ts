import { Response, NextFunction } from 'express';
import { AuthRequest, Role } from '../types';

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({
        error: 'Forbidden: insufficient permissions',
        required: roles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
}
