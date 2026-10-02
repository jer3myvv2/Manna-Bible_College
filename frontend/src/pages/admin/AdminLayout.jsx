import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken, getAdminName } from '../../api/client';
import {
  ClipboardCheckIcon,
  GridIcon,
  InboxIcon,
  LayersIcon,
  LogoutIcon,
  MegaphoneIcon,
  BookIcon,
  AwardIcon,
} from '../../components/Icons';
import Logo from '../../components/Logo';
import Seo from '../../components/Seo';

const NAV = [
  { to: '/admin', label: 'Overview', icon: GridIcon, end: true },
  { to: '/admin/applications', label: 'Applications', icon: ClipboardCheckIcon },
  { to: '/admin/messages', label: 'Messages', icon: InboxIcon },
  { to: '/admin/programmes', label: 'Programmes', icon: LayersIcon },
  { to: '/admin/electives', label: 'Short courses', icon: BookIcon },
  { to: '/admin/announcements', label: 'Announcements', icon: MegaphoneIcon },
  { to: '/admin/levels', label: 'Levels', icon: AwardIcon },
];

/** Admin shell: sidebar navigation (tabs on mobile) and a top bar with logout. */
export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    clearToken();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <Seo title="Admin" noIndex />
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-brand">
          <Logo size={40} decorative />
          <span>
            Manna Admin
            <small>Dashboard</small>
          </span>
        </Link>
        <nav aria-label="Admin navigation">
          <ul className="admin-nav">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className="admin-nav-link">
                  <Icon size={20} /> <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span>
            Signed in as <strong>{getAdminName()}</strong>
          </span>
          <div className="admin-topbar-actions">
            <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
              View website
            </a>
            <button type="button" className="btn btn-sm btn-maroon" onClick={logout}>
              <LogoutIcon size={18} /> Log out
            </button>
          </div>
        </header>
        <main className="admin-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
