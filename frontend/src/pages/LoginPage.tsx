import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/leads';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow" />
      <div className="login-bg-glow-2" />

      <div className="login-card">
        <div className="login-logo">
          <h1>LeadPro</h1>
          <p>Lead Management Platform</p>
        </div>

        <div className="card card-glass">
          <h2 style={{ marginBottom: 'var(--space-6)', fontSize: '1.3rem' }}>Welcome back</h2>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              id="btn-login"
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>Demo credentials</div>
            <div>Admin: admin@leadpro.com / Admin@1234</div>
            <div>Member: member@leadpro.com / Member@1234</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <a href="/capture" style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Submit a lead via our public form →
          </a>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <Footer />
      </div>
    </div>
  );
}
