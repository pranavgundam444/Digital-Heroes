import prisma from '../config/prisma';
import { LeadStatus, LeadQuery, PaginatedResponse } from '../types';
import { Prisma } from '@prisma/client';

export type LeadWithRelations = Prisma.LeadGetPayload<{
  include: {
    assignedTo: { select: { id: true; name: true; email: true } };
  };
}>;

export async function findLeads(query: LeadQuery): Promise<PaginatedResponse<LeadWithRelations>> {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const skip = (page - 1) * limit;

  const where: Prisma.LeadWhereInput = {};

  if (query.status) {
    where.status = query.status as LeadStatus;
  }
  if (query.assignedTo) {
    where.assignedToId = query.assignedTo === 'unassigned' ? null : query.assignedTo;
  }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search } },
      { email: { contains: query.search } },
      { company: { contains: query.search } },
    ];
  }

  const allowedSortFields: Record<string, string> = {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    name: 'name',
    status: 'status',
    email: 'email',
  };
  const sortField = allowedSortFields[query.sortBy || 'createdAt'] || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createLead(data: Prisma.LeadCreateInput) {
  return prisma.lead.create({
    data,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateLead(id: string, data: Prisma.LeadUpdateInput) {
  return prisma.lead.update({
    where: { id },
    data,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteLead(id: string) {
  return prisma.lead.delete({ where: { id } });
}

export async function findLeadByEmail(email: string) {
  return prisma.lead.findUnique({ where: { email } });
}
