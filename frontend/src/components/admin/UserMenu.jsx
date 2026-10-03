import { ChevronDown, ExternalLink, LogOut, Settings } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearToken, getAdminName } from '../../api/client';
import useDismiss from '../../hooks/useDismiss';

/** Avatar button with a small account menu: Settings, View website, Log out. */
export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const name = getAdminName();
  const initials = name.slice(0, 2).toUpperCase();

  const logout = () => {
    clearToken();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="um" ref={ref}>
      <button
        type="button"
        className="um-button"
        aria-expanded={open}
        aria-controls="user-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="um-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="um-name">{name}</span>
        <ChevronDown size={16} aria-hidden="true" />
        <span className="sr-only">Account menu</span>
      </button>
      {open ? (
        <div id="user-menu" className="um-panel">
          <div className="um-who">
            <span className="um-avatar um-avatar-lg" aria-hidden="true">
              {initials}
            </span>
            <div>
              <strong>{name}</strong>
              <small>Administrator</small>
            </div>
          </div>
          <Link to="/admin/settings" className="um-item" onClick={close}>
            <Settings size={18} aria-hidden="true" /> Settings
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className="um-item" onClick={close}>
            <ExternalLink size={18} aria-hidden="true" /> View website
          </a>
          <button type="button" className="um-item um-logout" onClick={logout}>
            <LogOut size={18} aria-hidden="true" /> Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
