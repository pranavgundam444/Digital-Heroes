import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>LeadPro</h1>
        <span>Lead Management Platform</span>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-nav-label">Main</span>

        <NavLink
          to="/leads"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          id="nav-leads"
        >
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0zm-4.07 11c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Leads
        </NavLink>

        {isAdmin && (
          <>
            <span className="sidebar-nav-label">Admin</span>

            <NavLink
              to="/users"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              id="nav-users"
            >
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
              Users
            </NavLink>
          </>
        )}

        <span className="sidebar-nav-label">Resources</span>

        <a
          href="/capture"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
          id="nav-capture-form"
        >
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
          </svg>
          Public Form ↗
        </a>
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout" id="btn-logout">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
