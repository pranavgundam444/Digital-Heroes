import prisma from '../config/prisma';

export async function findNotesByLeadId(leadId: string) {
  return prisma.note.findMany({
    where: { leadId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createNote(data: { leadId: string; userId: string; body: string }) {
  return prisma.note.create({
    data,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
