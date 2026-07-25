import React, { useState, useEffect, useCallback } from 'react';
import { usersApi, User, CreateUserData } from '../api/client';
import { AppLayout } from '../components/AppLayout';
import { RoleBadge } from '../components/StatusBadge';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<CreateUserData>>({ role: 'MEMBER' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersApi.list();
      setUsers(res.data.users);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      if (!createForm.email || !createForm.password || !createForm.name || !createForm.role) return;
      await usersApi.create(createForm as CreateUserData);
      setShowCreate(false);
      setCreateForm({ role: 'MEMBER' });
      fetchUsers();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setCreateError(axiosErr.response?.data?.error || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-left">
            <h2>Team Members</h2>
            <p>Manage access and roles for your team</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Add User
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <h3>No users found</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="td-primary">{u.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{u.email}</div>
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>
                      <span className="chip" style={{ color: u.active ? 'var(--color-accent-400)' : 'var(--color-danger-400)' }}>
                        {u.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Add New User</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>

            {createError && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{createError}</div>}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" required value={createForm.name || ''} onChange={e => setCreateForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" required value={createForm.email || ''} onChange={e => setCreateForm(f => ({...f, email: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input className="form-input" type="password" required minLength={8} value={createForm.password || ''} onChange={e => setCreateForm(f => ({...f, password: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={createForm.role || 'MEMBER'} onChange={e => setCreateForm(f => ({...f, role: e.target.value as 'ADMIN' | 'MEMBER'}))}>
                  <option value="MEMBER">Member (Limited access)</option>
                  <option value="ADMIN">Admin (Full access)</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
