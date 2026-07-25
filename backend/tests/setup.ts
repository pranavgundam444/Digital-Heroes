import { execSync } from 'child_process';
import path from 'path';

export default async function globalSetup() {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'file:./test.db';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.BCRYPT_ROUNDS = '1';

  // Run prisma migrations on test database
  try {
    execSync('npx prisma db push --force-reset', {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
      stdio: 'pipe',
    });
  } catch (e) {
    console.error('Failed to setup test database:', e);
    throw e;
  }
}
