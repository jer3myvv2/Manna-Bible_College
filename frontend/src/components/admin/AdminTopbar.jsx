import { ExternalLink, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

const TODAY = () =>
  new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Africa/Nairobi',
  });

/**
 * Frosted-glass top bar: see-through at the top of the page, gaining a soft
 * edge once content scrolls underneath it.
 */
export default function AdminTopbar({ title, menuOpen, onOpenMenu }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`atb ${scrolled ? 'is-scrolled' : ''}`}>
      <button
        type="button"
        className="atb-icon-btn atb-menu"
        onClick={onOpenMenu}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        aria-controls="admin-sidebar"
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <div className="atb-title">
        <span className="atb-crumb">Admin</span>
        <span className="atb-sep" aria-hidden="true">
          /
        </span>
        <strong>{title}</strong>
      </div>
      <span className="atb-date">{TODAY()}</span>
      <div className="atb-actions">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="atb-icon-btn atb-site"
          aria-label="View website (opens in a new tab)"
          title="View website"
        >
          <ExternalLink size={19} aria-hidden="true" />
        </a>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
