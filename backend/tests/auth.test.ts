import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

const app = createApp();

let adminToken: string;
let memberToken: string;
let adminId: string;
let memberId: string;

beforeAll(async () => {
  // Clean up
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  // Create admin
  const adminHash = await bcrypt.hash('AdminPass1!', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: adminHash,
      name: 'Test Admin',
      role: 'ADMIN',
    },
  });
  adminId = admin.id;

  // Create member
  const memberHash = await bcrypt.hash('MemberPass1!', 10);
  const member = await prisma.user.create({
    data: {
      email: 'member@test.com',
      passwordHash: memberHash,
      name: 'Test Member',
      role: 'MEMBER',
    },
  });
  memberId = member.id;

  // Login both
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'AdminPass1!' });
  adminToken = adminRes.body.token;

  const memberRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'member@test.com', password: 'MemberPass1!' });
  memberToken = memberRes.body.token;
});

afterAll(async () => {
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('Auth — Login', () => {
  it('should login with valid credentials and return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'AdminPass1!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'WrongPassword' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('should return 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'SomePassword1!' });
    expect(res.status).toBe(401);
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'SomePassword1!' });
    expect(res.status).toBe(400);
  });
});

describe('Auth — Protected Routes', () => {
  it('should return 401 when no token provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should return 401 for malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  it('should return current user when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@test.com');
    expect(res.body.user.passwordHash).toBeUndefined(); // Never expose password hash
  });

  it('should logout and clear cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

export { adminToken, memberToken, adminId, memberId, app };
