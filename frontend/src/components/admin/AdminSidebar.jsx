import {
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Layers,
  Megaphone,
  Settings,
  X,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import logoUrl from '../../assets/logo.svg';
import { useAdminNotifications } from '../../context/AdminNotifications';
import Logo from '../Logo';

const SECTIONS = [
  { label: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    label: 'Admissions',
    items: [
      { to: '/admin/applications', label: 'Applications', icon: ClipboardList, badge: 'new_applications', badgeLabel: 'new' },
      { to: '/admin/messages', label: 'Messages', icon: Inbox, badge: 'unread_messages', badgeLabel: 'unread' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/programmes', label: 'Programmes', icon: Layers },
      { to: '/admin/electives', label: 'Short courses', icon: BookOpen },
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/admin/levels', label: 'Levels', icon: GraduationCap },
    ],
  },
  { label: 'Account', items: [{ to: '/admin/settings', label: 'Settings', icon: Settings }] },
];

/**
 * Admin sidebar: grouped navigation with a glowing gold active marker, live
 * badges (new applications, unread messages) and a laurel watermark. Collapses
 * to an icon rail on desktop and becomes a slide-out drawer on phones.
 */
export default function AdminSidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) {
  const { counts, error, loaded } = useAdminNotifications();

  return (
    <aside id="admin-sidebar" className={`asb ${mobileOpen ? 'is-open' : ''}`} aria-label="Admin sidebar">
      <img className="asb-watermark" src={logoUrl} alt="" aria-hidden="true" />

      <div className="asb-head">
        <Link to="/admin" className="asb-brand" aria-label="Manna Admin dashboard">
          <Logo size={44} decorative />
          <span className="asb-brand-text">
            <strong>Manna Admin</strong>
            <small>College · Bible Institute</small>
          </span>
        </Link>
        <button type="button" className="asb-close" onClick={onCloseMobile} aria-label="Close menu">
          <X size={22} />
        </button>
      </div>

      <nav className="asb-nav" aria-label="Admin navigation">
        {SECTIONS.map((section) => (
          <div className="asb-section" key={section.label}>
            <p className="asb-section-label">{section.label}</p>
            <ul>
              {section.items.map(({ to, label, icon: Icon, end, badge, badgeLabel }) => {
                const count = badge ? counts?.[badge] || 0 : 0;
                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className="asb-link"
                      title={collapsed ? label : undefined}
                      onClick={onCloseMobile}
                    >
                      <span className="asb-icon" aria-hidden="true">
                        <Icon size={19} strokeWidth={2} />
                      </span>
                      <span className="asb-label">{label}</span>
                      {count ? (
                        <span className="asb-badge">
                          {count > 99 ? '99+' : count}
                          <span className="sr-only"> {badgeLabel}</span>
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="asb-foot">
        <div className={`asb-live ${error ? 'is-offline' : ''}`} role="status" title="New applications and messages appear automatically">
          <span className="asb-live-dot" aria-hidden="true" />
          <span className="asb-label">{error ? 'Reconnecting…' : loaded ? 'Live updates on' : 'Connecting…'}</span>
        </div>
        <button
          type="button"
          className="asb-collapse"
          onClick={onToggleCollapsed}
          aria-pressed={collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          <span className="asb-label">Collapse</span>
        </button>
      </div>
    </aside>
  );
}
