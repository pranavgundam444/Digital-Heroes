import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminHash = await bcrypt.hash('Admin@1234', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@leadpro.com',
      passwordHash: adminHash,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Create member user
  const memberHash = await bcrypt.hash('Member@1234', 10);
  const member = await prisma.user.create({
    data: {
      email: 'member@leadpro.com',
      passwordHash: memberHash,
      name: 'Sarah Sales',
      role: 'MEMBER',
    },
  });

  // Create sample leads
  const lead1 = await prisma.lead.create({
    data: {
      name: 'John Smith',
      email: 'john.smith@techcorp.com',
      phone: '+1-555-0101',
      company: 'TechCorp Inc.',
      source: 'website',
      message: 'Interested in your enterprise plan',
      status: 'CONTACTED',
      assignedToId: member.id,
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      name: 'Emily Johnson',
      email: 'emily@startupxyz.io',
      phone: '+1-555-0202',
      company: 'StartupXYZ',
      source: 'referral',
      message: 'Looking for a CRM solution for our team of 15',
      status: 'QUALIFIED',
      assignedToId: member.id,
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      name: 'Michael Chen',
      email: 'mchen@enterprise.com',
      phone: '+1-555-0303',
      company: 'Enterprise Co.',
      source: 'linkedin',
      message: 'Needs demo of features',
      status: 'PROPOSAL',
      assignedToId: admin.id,
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      name: 'Lisa Rodriguez',
      email: 'lisa.r@smallbiz.net',
      source: 'website',
      status: 'NEW',
    },
  });

  const lead5 = await prisma.lead.create({
    data: {
      name: 'David Park',
      email: 'david@dataservices.co',
      company: 'Data Services LLC',
      source: 'cold outreach',
      status: 'WON',
      assignedToId: member.id,
    },
  });

  // Add activities for each lead
  await prisma.activity.createMany({
    data: [
      {
        leadId: lead1.id,
        userId: null,
        type: 'CREATED',
        description: 'Lead created via public form',
      },
      {
        leadId: lead1.id,
        userId: admin.id,
        type: 'ASSIGNED',
        description: `Lead assigned to ${member.name} by Admin User`,
      },
      {
        leadId: lead1.id,
        userId: member.id,
        type: 'STATUS_CHANGED',
        description: `Status changed from NEW to CONTACTED by ${member.name}`,
      },
      {
        leadId: lead2.id,
        userId: null,
        type: 'CREATED',
        description: 'Lead created via public form',
      },
      {
        leadId: lead2.id,
        userId: admin.id,
        type: 'ASSIGNED',
        description: `Lead assigned to ${member.name} by Admin User`,
      },
      {
        leadId: lead2.id,
        userId: member.id,
        type: 'STATUS_CHANGED',
        description: `Status changed from NEW to QUALIFIED by ${member.name}`,
      },
      {
        leadId: lead3.id,
        userId: admin.id,
        type: 'CREATED',
        description: 'Lead created manually',
      },
      {
        leadId: lead3.id,
        userId: admin.id,
        type: 'STATUS_CHANGED',
        description: 'Status changed from NEW to PROPOSAL by Admin User',
      },
      {
        leadId: lead4.id,
        userId: null,
        type: 'CREATED',
        description: 'Lead created via public form',
      },
      {
        leadId: lead5.id,
        userId: admin.id,
        type: 'CREATED',
        description: 'Lead created manually',
      },
      {
        leadId: lead5.id,
        userId: member.id,
        type: 'STATUS_CHANGED',
        description: `Status changed from NEW to WON by ${member.name}`,
      },
    ],
  });

  // Add notes
  const note1 = await prisma.note.create({
    data: {
      leadId: lead1.id,
      userId: member.id,
      body: 'Had a 30-minute call with John. Very interested in the enterprise plan. Sending pricing deck tomorrow.',
    },
  });

  await prisma.activity.create({
    data: {
      leadId: lead1.id,
      userId: member.id,
      type: 'NOTE_ADDED',
      description: `Note added by ${member.name}`,
    },
  });

  const note2 = await prisma.note.create({
    data: {
      leadId: lead2.id,
      userId: member.id,
      body: 'Emily confirmed they are evaluating 3 vendors. Budget is ~$500/month. Decision by end of quarter.',
    },
  });

  await prisma.activity.create({
    data: {
      leadId: lead2.id,
      userId: member.id,
      type: 'NOTE_ADDED',
      description: `Note added by ${member.name}`,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  ADMIN  → email: admin@leadpro.com | password: Admin@1234');
  console.log('  MEMBER → email: member@leadpro.com | password: Member@1234');
  console.log(`\n  Created ${5} leads, ${2} notes, ${11} activity entries`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
