import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

const app = createApp();

let adminToken: string;
let memberToken: string;
let memberId: string;
let testLeadId: string;

beforeAll(async () => {
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash('AdminPass1!', 10);
  await prisma.user.create({
    data: { email: 'admin3@test.com', passwordHash: adminHash, name: 'Admin3', role: 'ADMIN' },
  });

  const memberHash = await bcrypt.hash('MemberPass1!', 10);
  const member = await prisma.user.create({
    data: { email: 'member3@test.com', passwordHash: memberHash, name: 'Member3', role: 'MEMBER' },
  });
  memberId = member.id;

  const aRes = await request(app).post('/api/auth/login').send({ email: 'admin3@test.com', password: 'AdminPass1!' });
  adminToken = aRes.body.token;
  const mRes = await request(app).post('/api/auth/login').send({ email: 'member3@test.com', password: 'MemberPass1!' });
  memberToken = mRes.body.token;

  // Create a test lead
  const created = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Perm Test Lead', email: 'permtest@example.com' });
  testLeadId = created.body.lead.id;
});

afterAll(async () => {
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// === DELETE LEAD — ADMIN only ===
describe('Permissions — DELETE lead', () => {
  it('MEMBER cannot delete a lead (403)', async () => {
    const res = await request(app)
      .delete(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('unauthenticated cannot delete a lead (401)', async () => {
    const res = await request(app).delete(`/api/leads/${testLeadId}`);
    expect(res.status).toBe(401);
  });

  it('ADMIN can delete a lead (204)', async () => {
    const created = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'To Delete', email: 'todel@perm.com' });
    const res = await request(app)
      .delete(`/api/leads/${created.body.lead.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });
});

// === ASSIGN LEAD — ADMIN only ===
describe('Permissions — ASSIGN lead', () => {
  it('MEMBER cannot assign a lead (403)', async () => {
    const res = await request(app)
      .patch(`/api/leads/${testLeadId}/assign`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ assignedToId: memberId });
    expect(res.status).toBe(403);
  });

  it('unauthenticated cannot assign a lead (401)', async () => {
    const res = await request(app)
      .patch(`/api/leads/${testLeadId}/assign`)
      .send({ assignedToId: memberId });
    expect(res.status).toBe(401);
  });

  it('ADMIN can assign a lead (200)', async () => {
    const res = await request(app)
      .patch(`/api/leads/${testLeadId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedToId: memberId });
    expect(res.status).toBe(200);
    expect(res.body.lead.assignedTo.id).toBe(memberId);
  });
});

// === USER MANAGEMENT — ADMIN only ===
describe('Permissions — USER management', () => {
  it('MEMBER cannot list users (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('MEMBER cannot create a user (403)', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ email: 'new@user.com', password: 'Pass1234!', name: 'New User', role: 'MEMBER' });
    expect(res.status).toBe(403);
  });

  it('unauthenticated cannot list users (401)', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('ADMIN can list users (200)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toBeInstanceOf(Array);
  });

  it('ADMIN can create a user (201)', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'newuser@perm.com', password: 'Pass1234!', name: 'New User', role: 'MEMBER' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('newuser@perm.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});

// === MEMBER restrictions on unassigned leads ===
describe('Permissions — MEMBER on unassigned leads', () => {
  let unassignedLeadId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Unassigned Lead', email: 'unassigned@perm.com' });
    unassignedLeadId = res.body.lead.id;
  });

  it('MEMBER cannot update status on unassigned lead (403)', async () => {
    const res = await request(app)
      .patch(`/api/leads/${unassignedLeadId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'CONTACTED' });
    expect(res.status).toBe(403);
  });

  it('MEMBER cannot add note to unassigned lead (403)', async () => {
    const res = await request(app)
      .post(`/api/leads/${unassignedLeadId}/notes`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ body: 'Sneaky note' });
    expect(res.status).toBe(403);
  });

  it('MEMBER cannot edit non-status fields even on assigned lead (403)', async () => {
    // Assign the lead first
    await request(app)
      .patch(`/api/leads/${testLeadId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedToId: memberId });

    const res = await request(app)
      .patch(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Sneaky Name Change' }); // Not allowed for member
    expect(res.status).toBe(403);
  });
});
