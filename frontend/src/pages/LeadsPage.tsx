import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsApi, Lead, LeadStatus, LeadListParams, User, usersApi, CreateLeadData } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { StatusBadge } from '../components/StatusBadge';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'PROPOSAL', label: 'Proposal' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function LeadsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Create lead modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<CreateLeadData & { source: string; message: string }>>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: LeadListParams = {
        page,
        limit: 20,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter as LeadStatus;
      if (assignedFilter) params.assignedTo = assignedFilter;

      const res = await leadsApi.list(params);
      setLeads(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setError('Failed to load leads.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, assignedFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (isAdmin) {
      usersApi.list().then((res) => setUsers(res.data.users)).catch(() => {});
    }
  }, [isAdmin]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortIcon = (field: string) => {
    if (sortBy !== field) return ' ↕';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await leadsApi.create({
        name: createForm.name || '',
        email: createForm.email || '',
        phone: createForm.phone,
        company: createForm.company,
        source: createForm.source,
        message: createForm.message,
      });
      setShowCreate(false);
      setCreateForm({});
      fetchLeads();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setCreateError(axiosErr.response?.data?.error || 'Failed to create lead');
    } finally {
      setCreating(false);
    }
  };

  // Stats
  const statusCounts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-left">
            <h2>Leads</h2>
            <p>{pagination.total} total leads in your pipeline</p>
          </div>
          <button id="btn-create-lead" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Lead
          </button>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              id="leads-search"
              type="text"
              className="form-input search-input"
              placeholder="Search by name, email, company..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            id="filter-status"
            className="form-select filter-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {isAdmin && (
            <select
              id="filter-assignee"
              className="form-select filter-select"
              value={assignedFilter}
              onChange={(e) => { setAssignedFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Table */}
        {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className={sortBy === 'name' ? 'sorted' : ''}>
                  Name{sortIcon('name')}
                </th>
                <th>Company</th>
                <th onClick={() => handleSort('status')} className={sortBy === 'status' ? 'sorted' : ''}>
                  Status{sortIcon('status')}
                </th>
                <th>Assigned To</th>
                <th onClick={() => handleSort('createdAt')} className={sortBy === 'createdAt' ? 'sorted' : ''}>
                  Created{sortIcon('createdAt')}
                </th>
                <th onClick={() => handleSort('updatedAt')} className={sortBy === 'updatedAt' ? 'sorted' : ''}>
                  Updated{sortIcon('updatedAt')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <h3>No leads found</h3>
                      <p>Try adjusting your filters or create a new lead.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} id={`lead-row-${lead.id}`}>
                    <td>
                      <div className="td-primary">{lead.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{lead.email}</div>
                    </td>
                    <td>{lead.company || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}</td>
                    <td><StatusBadge status={lead.status} /></td>
                    <td>
                      {lead.assignedTo ? (
                        <span className="chip">{lead.assignedTo.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Unassigned</span>
                      )}
                    </td>
                    <td>{formatDate(lead.createdAt)}</td>
                    <td>{formatDate(lead.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {!loading && leads.length > 0 && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="pagination-controls">
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  id="btn-prev-page"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={p}
                      className={`page-btn${p === page ? ' active' : ''}`}
                      onClick={() => setPage(p)}
                      id={`btn-page-${p}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  id="btn-next-page"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Lead Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal" id="modal-create-lead">
            <div className="modal-header">
              <h3 className="modal-title">Create New Lead</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {createError && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{createError}</div>}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} id="form-create-lead">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" placeholder="Full Name" required
                    value={createForm.name || ''} onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" placeholder="email@co.com" required
                    value={createForm.email || ''} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="+1 (555) 000-0000"
                    value={createForm.phone || ''} onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input className="form-input" placeholder="Company name"
                    value={createForm.company || ''} onChange={(e) => setCreateForm(f => ({ ...f, company: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Source</label>
                <select className="form-select" value={createForm.source || ''} onChange={(e) => setCreateForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="">Select source...</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="cold outreach">Cold Outreach</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-textarea" placeholder="Initial message or notes..."
                  value={createForm.message || ''} onChange={(e) => setCreateForm(f => ({ ...f, message: e.target.value }))} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating} id="btn-submit-create-lead">
                  {creating ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Creating...</> : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
