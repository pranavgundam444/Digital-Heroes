import { Response } from 'express';
import { AuthRequest } from '../types';
import {
  getLeads,
  getLeadById,
  createNewLead,
  updateLeadDetails,
  assignLead,
  removeLead,
  getLeadNotes,
  addLeadNote,
  getLeadActivity,
  CreateLeadSchema,
  UpdateLeadSchema,
  AssignLeadSchema,
  CreateNoteSchema,
} from '../services/leadService';
import { findUserById } from '../repositories/userRepository';

// GET /api/leads
export async function listLeads(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await getLeads(req.query as Record<string, string>);
    res.status(200).json(result);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/leads
export async function createLead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = CreateLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const lead = await createNewLead(parsed.data, req.user?.userId);
    res.status(201).json({ lead });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'EMAIL_CONFLICT') {
      res.status(409).json({ error: 'A lead with this email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// GET /api/leads/:id
export async function getLead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const lead = await getLeadById(req.params.id);
    res.status(200).json({ lead });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Lead not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// PATCH /api/leads/:id
export async function updateLead(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const parsed = UpdateLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // MEMBERs can only update status on leads assigned to them
    if (req.user.role === 'MEMBER') {
      const lead = await getLeadById(req.params.id);
      if (lead.assignedToId !== req.user.userId) {
        res.status(403).json({ error: 'Forbidden: you can only update leads assigned to you' });
        return;
      }
      // Members can only update status field
      const allowedKeys = new Set(['status']);
      const requestedKeys = Object.keys(parsed.data);
      const forbidden = requestedKeys.filter((k) => !allowedKeys.has(k));
      if (forbidden.length > 0) {
        res.status(403).json({
          error: 'Forbidden: members can only update status',
          forbidden,
        });
        return;
      }
    }

    const user = await findUserById(req.user.userId);
    const lead = await updateLeadDetails(
      req.params.id,
      parsed.data,
      req.user.userId,
      user?.name || req.user.email
    );
    res.status(200).json({ lead });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Lead not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// PATCH /api/leads/:id/assign (ADMIN only — enforced in route middleware)
export async function assignLeadToUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const parsed = AssignLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    let assigneeName: string | undefined;
    if (parsed.data.assignedToId) {
      const assignee = await findUserById(parsed.data.assignedToId);
      if (!assignee) {
        res.status(404).json({ error: 'Assignee user not found' });
        return;
      }
      assigneeName = assignee.name;
    }

    const user = await findUserById(req.user.userId);
    const lead = await assignLead(
      req.params.id,
      parsed.data.assignedToId,
      req.user.userId,
      user?.name || req.user.email,
      assigneeName
    );
    res.status(200).json({ lead });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Lead not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// DELETE /api/leads/:id (ADMIN only — enforced in route middleware)
export async function deleteLead(req: AuthRequest, res: Response): Promise<void> {
  try {
    await removeLead(req.params.id);
    res.status(204).send();
  } catch (err) {
    const error = err as Error;
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Lead not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// GET /api/leads/:id/notes
export async function listNotes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const notes = await getLeadNotes(req.params.id);
    res.status(200).json({ notes });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Lead not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// POST /api/leads/:id/notes
export async function addNote(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const parsed = CreateNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    // MEMBERs can only add notes to leads assigned to them
    if (req.user.role === 'MEMBER') {
      const lead = await getLeadById(req.params.id);
      if (lead.assignedToId !== req.user.userId) {
        res.status(403).json({ error: 'Forbidden: you can only add notes to leads assigned to you' });
        return;
      }
    }

    const user = await findUserById(req.user.userId);
    const note = await addLeadNote(
      req.params.id,
      req.user.userId,
      parsed.data.body,
      user?.name || req.user.email
    );
    res.status(201).json({ note });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Lead not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// GET /api/leads/:id/activity
export async function listActivity(req: AuthRequest, res: Response): Promise<void> {
  try {
    const activities = await getLeadActivity(req.params.id);
    res.status(200).json({ activities });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'Lead not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
