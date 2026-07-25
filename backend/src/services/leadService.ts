import { z } from 'zod';
import {
  findLeads,
  findLeadById,
  createLead,
  updateLead,
  deleteLead,
  findLeadByEmail,
} from '../repositories/leadRepository';
import { findNotesByLeadId, createNote } from '../repositories/noteRepository';
import { findActivitiesByLeadId } from '../repositories/activityRepository';
import { logActivity } from './activityService';
import { LeadQuery } from '../types';

export const CreateLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  message: z.string().optional(),
});

export const UpdateLeadSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']).optional(),
});

export const AssignLeadSchema = z.object({
  assignedToId: z.string().nullable(),
});

export const CreateNoteSchema = z.object({
  body: z.string().min(1, 'Note body is required').max(5000),
});

export async function getLeads(query: LeadQuery) {
  return findLeads(query);
}

export async function getLeadById(id: string) {
  const lead = await findLeadById(id);
  if (!lead) throw new Error('NOT_FOUND');
  return lead;
}

export async function createNewLead(
  data: z.infer<typeof CreateLeadSchema>,
  actorId?: string | null
) {
  const existing = await findLeadByEmail(data.email);
  if (existing) throw new Error('EMAIL_CONFLICT');

  const lead = await createLead(data);

  await logActivity({
    leadId: lead.id,
    userId: actorId,
    type: 'CREATED',
    description: `Lead created${actorId ? ' manually' : ' via public form'}`,
  });

  return lead;
}

export async function updateLeadDetails(
  id: string,
  data: z.infer<typeof UpdateLeadSchema>,
  actorId: string,
  actorName: string
) {
  const lead = await findLeadById(id);
  if (!lead) throw new Error('NOT_FOUND');

  const oldStatus = lead.status;
  const updated = await updateLead(id, data);

  // Log status change specifically
  if (data.status && data.status !== oldStatus) {
    await logActivity({
      leadId: id,
      userId: actorId,
      type: 'STATUS_CHANGED',
      description: `Status changed from ${oldStatus} to ${data.status} by ${actorName}`,
    });
  }

  // Log general edit if other fields changed
  const otherFields = Object.keys(data).filter((k) => k !== 'status');
  if (otherFields.length > 0) {
    await logActivity({
      leadId: id,
      userId: actorId,
      type: 'DETAILS_EDITED',
      description: `Details edited by ${actorName}: ${otherFields.join(', ')}`,
    });
  }

  return updated;
}

export async function assignLead(
  id: string,
  assignedToId: string | null,
  actorId: string,
  actorName: string,
  assigneeName?: string
) {
  const lead = await findLeadById(id);
  if (!lead) throw new Error('NOT_FOUND');

  const updated = await updateLead(id, {
    assignedTo: assignedToId ? { connect: { id: assignedToId } } : { disconnect: true }
  });

  if (assignedToId === null) {
    await logActivity({
      leadId: id,
      userId: actorId,
      type: 'UNASSIGNED',
      description: `Lead unassigned by ${actorName}`,
    });
  } else {
    await logActivity({
      leadId: id,
      userId: actorId,
      type: 'ASSIGNED',
      description: `Lead assigned to ${assigneeName || assignedToId} by ${actorName}`,
    });
  }

  return updated;
}

export async function removeLead(id: string) {
  const lead = await findLeadById(id);
  if (!lead) throw new Error('NOT_FOUND');
  return deleteLead(id);
}

export async function getLeadNotes(leadId: string) {
  const lead = await findLeadById(leadId);
  if (!lead) throw new Error('NOT_FOUND');
  return findNotesByLeadId(leadId);
}

export async function addLeadNote(
  leadId: string,
  userId: string,
  body: string,
  authorName: string
) {
  const lead = await findLeadById(leadId);
  if (!lead) throw new Error('NOT_FOUND');

  const note = await createNote({ leadId, userId, body });

  await logActivity({
    leadId,
    userId,
    type: 'NOTE_ADDED',
    description: `Note added by ${authorName}`,
  });

  return note;
}

export async function getLeadActivity(leadId: string) {
  const lead = await findLeadById(leadId);
  if (!lead) throw new Error('NOT_FOUND');
  return findActivitiesByLeadId(leadId);
}
