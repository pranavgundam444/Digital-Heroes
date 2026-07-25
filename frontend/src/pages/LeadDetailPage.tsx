import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  leadsApi,
  usersApi,
  Lead,
  Note,
  Activity,
  LeadStatus,
  User,
} from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { StatusBadge } from '../components/StatusBadge';

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'PROPOSAL', label: 'Proposal' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
];

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status/Assign state
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Note state
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Edit lead modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [leadRes, notesRes, activityRes] = await Promise.all([
        leadsApi.get(id),
        leadsApi.getNotes(id),
        leadsApi.getActivity(id),
      ]);
      setLead(leadRes.data.lead);
      setNotes(notesRes.data.notes);
      setActivities(activityRes.data.activities);

      if (isAdmin) {
        const usersRes = await usersApi.list();
        setUsers(usersRes.data.users);
      }
    } catch {
      setError('Failed to load lead details. It may have been deleted or you do not have permission.');
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canEditDetails = isAdmin;
  const canUpdateStatus = isAdmin || lead?.assignedToId === currentUser?.id;
  const canAddNote = isAdmin || lead?.assignedToId === currentUser?.id;
  const canDelete = isAdmin;

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!id || !lead) return;
    const newStatus = e.target.value as LeadStatus;
    setUpdating(true);
    setUpdateError('');
    try {
      await leadsApi.update(id, { status: newStatus });
      fetchData(); // Refresh to get updated activity trail
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setUpdateError(axiosErr.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!id || !lead) return;
    const newAssignee = e.target.value || null;
    setUpdating(true);
    setUpdateError('');
    try {
      await leadsApi.assign(id, newAssignee);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setUpdateError(axiosErr.response?.data?.error || 'Failed to assign lead');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNote.trim()) return;
    setAddingNote(true);
    setUpdateError('');
    try {
      await leadsApi.addNote(id, newNote);
      setNewNote('');
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setUpdateError(axiosErr.response?.data?.error || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setUpdating(true);
    setUpdateError('');
    try {
      await leadsApi.update(id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone ?? undefined,
        company: editForm.company ?? undefined,
        source: editForm.source ?? undefined,
      });
      setShowEdit(false);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setUpdateError(axiosErr.response?.data?.error || 'Failed to update details');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this lead? This cannot be undone.')) return;
    try {
      await leadsApi.delete(id);
      navigate('/leads');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      alert(axiosErr.response?.data?.error || 'Failed to delete lead');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="loading-page">
          <div className="spinner" />
          <span>Loading lead details...</span>
        </div>
      </AppLayout>
    );
  }

  if (error || !lead) {
    return (
      <AppLayout>
        <div className="page-container">
          <div className="alert alert-error">{error || 'Lead not found'}</div>
          <button className="btn btn-ghost" onClick={() => navigate('/leads')} style={{ marginTop: 'var(--space-4)' }}>
            ← Back to Leads
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leads')} style={{ paddingLeft: 0 }}>
            ← Back to Leads
          </button>
        </div>

        {updateError && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            {updateError}
          </div>
        )}

        <div className="lead-detail-grid">
          {/* Main Content (Left) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

            {/* Lead Header & Details */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>{lead.name}</h2>
                    <StatusBadge status={lead.status} />
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {lead.company ? `${lead.company} • ` : ''}{lead.email}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {canEditDetails && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditForm(lead); setShowEdit(true); }}>
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-field">
                  <span className="detail-field-label">Email</span>
                  <span className="detail-field-value"><a href={`mailto:${lead.email}`}>{lead.email}</a></span>
                </div>
                <div className="detail-field">
                  <span className="detail-field-label">Phone</span>
                  <span className="detail-field-value">{lead.phone || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-field-label">Source</span>
                  <span className="detail-field-value" style={{ textTransform: 'capitalize' }}>{lead.source || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-field-label">Created</span>
                  <span className="detail-field-value">{formatTime(lead.createdAt)}</span>
                </div>
              </div>

              {lead.message && (
                <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="detail-field-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>Initial Message</span>
                  <div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {lead.message}
                  </div>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="card">
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Notes</h3>

              {canAddNote ? (
                <form onSubmit={handleAddNote} style={{ marginBottom: 'var(--space-6)' }}>
                  <textarea
                    className="form-textarea"
                    placeholder="Add a note about this lead..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    style={{ minHeight: '80px', marginBottom: 'var(--space-3)' }}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={addingNote || !newNote.trim()}>
                      {addingNote ? 'Adding...' : 'Add Note'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="alert alert-info" style={{ marginBottom: 'var(--space-6)' }}>
                  Only the assigned member or an admin can add notes.
                </div>
              )}

              <div className="notes-list">
                {notes.length === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
                    <p>No notes yet.</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="note-card">
                      <div className="note-header">
                        <span className="note-author">{note.user.name}</span>
                        <span className="note-time">{formatTime(note.createdAt)}</span>
                      </div>
                      <div className="note-body">{note.body}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Sidebar Content (Right) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

            {/* Controls Card */}
            <div className="card">
              <h3 style={{ marginBottom: 'var(--space-4)', fontSize: '1.1rem' }}>Manage Lead</h3>

              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={lead.status}
                  onChange={handleStatusChange}
                  disabled={!canUpdateStatus || updating}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {!canUpdateStatus && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                    Only the assigned member or an admin can change status.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select
                  className="form-select"
                  value={lead.assignedToId || ''}
                  onChange={handleAssignChange}
                  disabled={!isAdmin || updating}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                  {/* If not admin, still show the current assignee but disable it */}
                  {!isAdmin && !users.find(u => u.id === lead.assignedToId) && lead.assignedTo && (
                    <option value={lead.assignedTo.id}>{lead.assignedTo.name}</option>
                  )}
                </select>
                {!isAdmin && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                    Only admins can reassign leads.
                  </span>
                )}
              </div>
            </div>

            {/* Activity Trail */}
            <div className="card">
              <h3 style={{ marginBottom: 'var(--space-4)', fontSize: '1.1rem' }}>Activity History</h3>

              <div className="activity-timeline">
                {activities.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No activity recorded.</p>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-dot">
                        {activity.type === 'CREATED' && '✨'}
                        {activity.type === 'STATUS_CHANGED' && '🔄'}
                        {activity.type === 'ASSIGNED' && '👤'}
                        {activity.type === 'UNASSIGNED' && '➖'}
                        {activity.type === 'NOTE_ADDED' && '📝'}
                        {activity.type === 'DETAILS_EDITED' && '✏️'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-description">{activity.description}</div>
                        <div className="activity-time">{formatTime(activity.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Edit Lead Details</h3>
              <button className="modal-close" onClick={() => setShowEdit(false)}>×</button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" required value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" required value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <input className="form-input" value={editForm.company || ''} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Source</label>
                <input className="form-input" value={editForm.source || ''} onChange={e => setEditForm(f => ({ ...f, source: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
