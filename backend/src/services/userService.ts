import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';
import {
  findAllUsers,
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
} from '../repositories/userRepository';

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(200),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  active: z.boolean().optional(),
});

export async function getAllUsers() {
  return findAllUsers();
}

export async function getUserById(id: string) {
  const user = await findUserById(id);
  if (!user) throw new Error('NOT_FOUND');
  return user;
}

export async function createNewUser(data: z.infer<typeof CreateUserSchema>) {
  const existing = await findUserByEmail(data.email);
  if (existing) throw new Error('EMAIL_CONFLICT');

  const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);
  return createUser({
    email: data.email,
    passwordHash,
    name: data.name,
    role: data.role,
  });
}

export async function updateUserById(id: string, data: z.infer<typeof UpdateUserSchema>) {
  const existing = await findUserById(id);
  if (!existing) throw new Error('NOT_FOUND');

  if (data.email && data.email !== existing.email) {
    const emailTaken = await findUserByEmail(data.email);
    if (emailTaken) throw new Error('EMAIL_CONFLICT');
  }

  const updateData: Record<string, unknown> = {};
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.role) updateData.role = data.role;
  if (typeof data.active === 'boolean') updateData.active = data.active;
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);
  }

  return updateUser(id, updateData);
}
