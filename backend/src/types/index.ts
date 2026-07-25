import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';
export type ActivityType = 'CREATED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'UNASSIGNED' | 'NOTE_ADDED' | 'DETAILS_EDITED';
export type Role = 'ADMIN' | 'MEMBER';

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface LeadQuery extends PaginationQuery {
  status?: LeadStatus;
  assignedTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
