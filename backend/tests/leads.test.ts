import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

const app = createApp();

let adminToken: string;
let memberToken: string;
let memberId: string;
let testLeadId: string;
let assignedLeadId: string;

beforeAll(async () => {
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash('AdminPass1!', 10);
  await prisma.user.create({
    data: { email: 'admin2@test.com', passwordHash: adminHash, name: 'Admin2', role: 'ADMIN' },
  });

  const memberHash = await bcrypt.hash('MemberPass1!', 10);
  const member = await prisma.user.create({
    data: { email: 'member2@test.com', passwordHash: memberHash, name: 'Member2', role: 'MEMBER' },
  });
  memberId = member.id;

  const aRes = await request(app).post('/api/auth/login').send({ email: 'admin2@test.com', password: 'AdminPass1!' });
  adminToken = aRes.body.token;

  const mRes = await request(app).post('/api/auth/login').send({ email: 'member2@test.com', password: 'MemberPass1!' });
  memberToken = mRes.body.token;
});

afterAll(async () => {
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('Leads — CRUD', () => {
  it('should create a lead (admin)', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Lead',
        email: 'testlead@example.com',
        company: 'TestCo',
        source: 'website',
      });
    expect(res.status).toBe(201);
    expect(res.body.lead.id).toBeDefined();
    expect(res.body.lead.status).toBe('NEW');
    testLeadId = res.body.lead.id;
  });

  it('should reject duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Duplicate', email: 'testlead@example.com' });
    expect(res.status).toBe(409);
  });

  it('should return 400 for invalid lead data', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'No Email Lead' }); // missing email
    expect(res.status).toBe(400);
  });

  it('should list leads with pagination', async () => {
    const res = await request(app)
      .get('/api/leads?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      limit: 5,
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  it('should filter leads by status', async () => {
    const res = await request(app)
      .get('/api/leads?status=NEW')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((lead: { status: string }) => {
      expect(lead.status).toBe('NEW');
    });
  });

  it('should search leads by name', async () => {
    const res = await request(app)
      .get('/api/leads?search=Test Lead')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should get lead by id', async () => {
    const res = await request(app)
      .get(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.lead.id).toBe(testLeadId);
  });

  it('should return 404 for non-existent lead', async () => {
    const res = await request(app)
      .get('/api/leads/nonexistentid123')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('admin should update any lead', async () => {
    const res = await request(app)
      .patch(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONTACTED', company: 'Updated Co' });
    expect(res.status).toBe(200);
    expect(res.body.lead.status).toBe('CONTACTED');
  });

  it('admin should delete a lead', async () => {
    const created = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'To Delete', email: 'delete@test.com' });
    const id = created.body.lead.id;

    const res = await request(app)
      .delete(`/api/leads/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });
});

describe('Leads — Notes and Activity', () => {
  it('should create a lead assigned to member for note tests', async () => {
    const created = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Assigned Lead', email: 'assigned@test.com' });
    assignedLeadId = created.body.lead.id;

    // Assign to member
    await request(app)
      .patch(`/api/leads/${assignedLeadId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedToId: memberId });
  });

  it('admin can add note to any lead', async () => {
    const res = await request(app)
      .post(`/api/leads/${testLeadId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ body: 'Admin note content' });
    expect(res.status).toBe(201);
    expect(res.body.note.body).toBe('Admin note content');
  });

  it('member can add note to assigned lead', async () => {
    const res = await request(app)
      .post(`/api/leads/${assignedLeadId}/notes`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ body: 'Member note content' });
    expect(res.status).toBe(201);
  });

  it('should list notes for a lead', async () => {
    const res = await request(app)
      .get(`/api/leads/${testLeadId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.notes).toBeInstanceOf(Array);
    expect(res.body.notes.length).toBeGreaterThan(0);
  });

  it('should list activity trail for a lead', async () => {
    const res = await request(app)
      .get(`/api/leads/${testLeadId}/activity`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.activities).toBeInstanceOf(Array);
    // Activity should include CREATED, STATUS_CHANGED, and NOTE_ADDED
    const types = res.body.activities.map((a: { type: string }) => a.type);
    expect(types).toContain('CREATED');
  });
});

describe('Leads — 401 without token', () => {
  it('GET /api/leads should return 401 without token', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });

  it('POST /api/leads should return 401 without token', async () => {
    const res = await request(app).post('/api/leads').send({ name: 'x', email: 'x@x.com' });
    expect(res.status).toBe(401);
  });
});
