import prisma from '../config/prisma';
import { ActivityType } from '../types';

export async function createActivity(data: {
  leadId: string;
  userId?: string | null;
  type: ActivityType;
  description: string;
}) {
  return prisma.activity.create({
    data: {
      leadId: data.leadId,
      userId: data.userId ?? null,
      type: data.type,
      description: data.description,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function findActivitiesByLeadId(leadId: string) {
  return prisma.activity.findMany({
    where: { leadId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}
