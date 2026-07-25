import { Request, Response } from 'express';
import { createNewLead, CreateLeadSchema } from '../services/leadService';

// POST /api/capture — public, no auth required
export async function capturePublicLead(req: Request, res: Response): Promise<void> {
  try {
    const parsed = CreateLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const lead = await createNewLead(parsed.data, null);
    res.status(201).json({
      message: 'Thank you! We will be in touch soon.',
      leadId: lead.id,
    });
  } catch (err) {
    const error = err as Error;
    if (error.message === 'EMAIL_CONFLICT') {
      res.status(409).json({ error: 'This email has already been submitted' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
