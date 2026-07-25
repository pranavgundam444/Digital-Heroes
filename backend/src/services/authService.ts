import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { findUserByEmail } from '../repositories/userRepository';
import { AuthPayload, Role } from '../types';

export async function loginUser(email: string, password: string): Promise<string> {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  if (!user.active) {
    throw new Error('ACCOUNT_DISABLED');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role as Role,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.bcryptRounds);
}
