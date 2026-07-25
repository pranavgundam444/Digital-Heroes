/// <reference types="vite/client" />
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token from localStorage (fallback for environments where cookies don't work)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/capture')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ============ Auth ============
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; message: string }>('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ user: User }>('/auth/me'),
};

// ============ Leads ============
export const leadsApi = {
  list: (params?: LeadListParams) =>
    api.get<PaginatedLeadResponse>('/leads', { params }),
  get: (id: string) => api.get<{ lead: Lead }>(`/leads/${id}`),
  create: (data: CreateLeadData) => api.post<{ lead: Lead }>('/leads', data),
  update: (id: string, data: UpdateLeadData) => api.patch<{ lead: Lead }>(`/leads/${id}`, data),
  assign: (id: string, assignedToId: string | null) =>
    api.patch<{ lead: Lead }>(`/leads/${id}/assign`, { assignedToId }),
  delete: (id: string) => api.delete(`/leads/${id}`),
  getNotes: (id: string) => api.get<{ notes: Note[] }>(`/leads/${id}/notes`),
  addNote: (id: string, body: string) => api.post<{ note: Note }>(`/leads/${id}/notes`, { body }),
  getActivity: (id: string) => api.get<{ activities: Activity[] }>(`/leads/${id}/activity`),
};

// ============ Users ============
export const usersApi = {
  list: () => api.get<{ users: User[] }>('/users'),
  get: (id: string) => api.get<{ user: User }>(`/users/${id}`),
  create: (data: CreateUserData) => api.post<{ user: User }>('/users', data),
  update: (id: string, data: UpdateUserData) => api.patch<{ user: User }>(`/users/${id}`, data),
};

// ============ Capture ============
export const captureApi = {
  submit: (data: CreateLeadData) =>
    api.post<{ message: string; leadId: string }>('/capture', data),
};

// ============ Types ============
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';
export type ActivityType = 'CREATED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'UNASSIGNED' | 'NOTE_ADDED' | 'DETAILS_EDITED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  active: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  message?: string | null;
  status: LeadStatus;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  leadId: string;
  userId: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export interface Activity {
  id: string;
  leadId: string;
  userId?: string | null;
  type: ActivityType;
  description: string;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
}

export interface PaginatedLeadResponse {
  data: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeadListParams {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  assignedTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLeadData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  message?: string;
}

export interface UpdateLeadData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  message?: string;
  status?: LeadStatus;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'ADMIN' | 'MEMBER';
  active?: boolean;
}
