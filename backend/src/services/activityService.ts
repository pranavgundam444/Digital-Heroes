import { createActivity } from '../repositories/activityRepository';
import { ActivityType } from '../types';

export async function logActivity(data: {
  leadId: string;
  userId?: string | null;
  type: ActivityType;
  description: string;
}) {
  return createActivity(data);
}
