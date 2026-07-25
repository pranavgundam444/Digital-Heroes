import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

const app = createApp();

let adminToken: string;
let memberToken: string;
let memberId: string;

beforeAll(async () => {
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash('AdminPass1!', 10);
  await prisma.user.create({
    data: { email: 'admin4@test.com', passwordHash: adminHash, name: 'Admin4', role: 'ADMIN' },
  });

  const memberHash = await bcrypt.hash('MemberPass1!', 10);
  const member = await prisma.user.create({
    data: { email: 'member4@test.com', passwordHash: memberHash, name: 'Member4', role: 'MEMBER' },
  });
  memberId = member.id;

  const aRes = await request(app).post('/api/auth/login').send({ email: 'admin4@test.com', password: 'AdminPass1!' });
  adminToken = aRes.body.token;
  const mRes = await request(app).post('/api/auth/login').send({ email: 'member4@test.com', password: 'MemberPass1!' });
  memberToken = mRes.body.token;
});

afterAll(async () => {
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

/**
 * End-to-End Flow A:
 * public capture → lead appears as NEW
 * → admin assigns to member
 * → member updates status and adds a note
 * → activity trail reflects all of it
 */
describe('E2E Flow A: Public Capture → Assign → Update → Note → Activity', () => {
  let leadId: string;

  it('Step 1: public capture form creates a lead as NEW', async () => {
    const res = await request(app)
      .post('/api/capture')
      .send({
        name: 'E2E Test Person',
        email: 'e2e.flow.a@example.com',
        company: 'FlowTest Inc.',
        message: 'Testing end-to-end flow',
      });
    expect(res.status).toBe(201);
    expect(res.body.leadId).toBeDefined();
    leadId = res.body.leadId;
  });

  it('Step 2: lead appears with status NEW', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.lead.status).toBe('NEW');
    expect(res.body.lead.assignedTo).toBeNull();
  });

  it('Step 3: admin assigns lead to member', async () => {
    const res = await request(app)
      .patch(`/api/leads/${leadId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedToId: memberId });
    expect(res.status).toBe(200);
    expect(res.body.lead.assignedTo.id).toBe(memberId);
  });

  it('Step 4: member updates status to CONTACTED', async () => {
    const res = await request(app)
      .patch(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'CONTACTED' });
    expect(res.status).toBe(200);
    expect(res.body.lead.status).toBe('CONTACTED');
  });

  it('Step 5: member adds a note', async () => {
    const res = await request(app)
      .post(`/api/leads/${leadId}/notes`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ body: 'Spoke to the client, they are very interested.' });
    expect(res.status).toBe(201);
    expect(res.body.note.body).toContain('very interested');
  });

  it('Step 6: activity trail reflects all events', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadId}/activity`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const activities = res.body.activities;
    const types = activities.map((a: { type: string }) => a.type);

    expect(types).toContain('CREATED');
    expect(types).toContain('ASSIGNED');
    expect(types).toContain('STATUS_CHANGED');
    expect(types).toContain('NOTE_ADDED');

    // Verify order: CREATED comes first
    const createdIdx = types.indexOf('CREATED');
    const assignedIdx = types.indexOf('ASSIGNED');
    const statusIdx = types.indexOf('STATUS_CHANGED');
    const noteIdx = types.indexOf('NOTE_ADDED');

    expect(createdIdx).toBeLessThan(assignedIdx);
    expect(assignedIdx).toBeLessThan(statusIdx);
    expect(statusIdx).toBeLessThan(noteIdx);
  });
});

/**
 * End-to-End Flow B:
 * member attempts all forbidden actions and is blocked
 */
describe('E2E Flow B: Member Forbidden Actions', () => {
  let leadId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Forbidden Test Lead', email: 'forbidden@flow.com' });
    leadId = res.body.lead.id;
  });

  it('MEMBER cannot delete a lead', async () => {
    const res = await request(app)
      .delete(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('MEMBER cannot reassign a lead', async () => {
    const res = await request(app)
      .patch(`/api/leads/${leadId}/assign`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ assignedToId: memberId });
    expect(res.status).toBe(403);
  });

  it('MEMBER cannot list users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('MEMBER cannot create a user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ email: 'illicit@user.com', password: 'Pass1234!', name: 'Illicit', role: 'ADMIN' });
    expect(res.status).toBe(403);
  });

  it('MEMBER cannot edit lead details (only status on assigned leads)', async () => {
    const res = await request(app)
      .patch(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Injected Name' });
    // Lead is not assigned to member, so 403
    expect(res.status).toBe(403);
  });

  it('Lead still exists and is unmodified after all blocked attempts', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.lead.name).toBe('Forbidden Test Lead');
    expect(res.body.lead.assignedTo).toBeNull();
  });
});

/**
 * Public capture — no auth tests
 */
describe('Public Capture Form', () => {
  it('accepts a valid submission without any auth token', async () => {
    const res = await request(app)
      .post('/api/capture')
      .send({
        name: 'Public User',
        email: 'public.user@noauth.com',
        company: 'NoAuth Corp',
      });
    expect(res.status).toBe(201);
    expect(res.body.message).toBeDefined();
    expect(res.body.leadId).toBeDefined();
  });

  it('rejects duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/capture')
      .send({ name: 'Public User', email: 'public.user@noauth.com' });
    expect(res.status).toBe(409);
  });

  it('rejects invalid form data with 400', async () => {
    const res = await request(app)
      .post('/api/capture')
      .send({ name: 'No Email' }); // Missing email
    expect(res.status).toBe(400);
  });
});
