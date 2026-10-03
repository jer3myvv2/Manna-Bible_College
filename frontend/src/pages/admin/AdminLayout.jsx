import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopbar from '../../components/admin/AdminTopbar';
import ToastStack from '../../components/admin/ToastStack';
import Seo from '../../components/Seo';
import { AdminNotificationsProvider } from '../../context/AdminNotifications';
import '../../styles/admin-shell.css';

const TITLES = [
  ['/admin/applications', 'Applications'],
  ['/admin/messages', 'Messages'],
  ['/admin/programmes', 'Programmes'],
  ['/admin/electives', 'Short courses'],
  ['/admin/announcements', 'Announcements'],
  ['/admin/levels', 'Levels'],
  ['/admin/settings', 'Settings'],
];
const COLLAPSE_KEY = 'manna_admin_sidebar';

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

/** Admin shell: sidebar, frosted top bar, live notification toasts and the page outlet. */
export default function AdminLayout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = TITLES.find(([path]) => pathname.startsWith(path))?.[1] || 'Dashboard';

  useEffect(() => setMobileOpen(false), [pathname]);

  // Phone drawer: Escape closes it and the page behind does not scroll.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (event) => event.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.classList.add('nav-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('nav-open');
    };
  }, [mobileOpen]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, value ? 'expanded' : 'collapsed');
      } catch {
        /* ignore storage errors */
      }
      return !value;
    });
  }, []);

  return (
    <AdminNotificationsProvider>
      <div className={`ash ${collapsed ? 'is-collapsed' : ''}`}>
        <Seo title={`${title} · Admin`} noIndex />
        <a href="#admin-content" className="skip-link">
          Skip to content
        </a>
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        {mobileOpen ? <div className="ash-backdrop" aria-hidden="true" onClick={() => setMobileOpen(false)} /> : null}
        <div className="ash-main">
          <AdminTopbar title={title} menuOpen={mobileOpen} onOpenMenu={() => setMobileOpen(true)} />
          <main id="admin-content" className="admin-content" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
        <ToastStack />
      </div>
    </AdminNotificationsProvider>
  );
}
