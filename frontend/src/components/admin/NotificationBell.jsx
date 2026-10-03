import { Bell, ClipboardList, Mail } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminNotifications } from '../../context/AdminNotifications';
import useDismiss from '../../hooks/useDismiss';
import { timeAgo } from '../../utils/format';

/** Bell with unread count and a dropdown of recent applications and messages. */
export default function NotificationBell() {
  const { items, unreadCount, markAllSeen, error } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  // Remember which items were unread when the panel opened, so they stay highlighted
  // while it is open even though opening marks them as seen.
  const [highlight, setHighlight] = useState(() => new Set());
  const ref = useRef(null);
  const navigate = useNavigate();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const toggle = () => {
    if (!open) {
      setHighlight(new Set(items.filter((item) => item.unread).map((item) => item.id)));
      if (unreadCount) markAllSeen();
    }
    setOpen(!open);
  };

  const go = (link) => {
    setOpen(false);
    navigate(link);
  };

  return (
    <div className="anb" ref={ref}>
      <button
        type="button"
        className={`atb-icon-btn anb-button ${unreadCount ? 'has-unread' : ''}`}
        aria-expanded={open}
        aria-controls="notification-panel"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        title="Notifications"
        onClick={toggle}
      >
        <Bell size={20} strokeWidth={2} aria-hidden="true" />
        {unreadCount ? (
          <span className="anb-count" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div id="notification-panel" className="anb-panel" role="region" aria-label="Notifications">
          <div className="anb-head">
            <strong>Notifications</strong>
            <span className="anb-live">
              <span className="anb-live-dot" aria-hidden="true" /> Live
            </span>
          </div>
          {error ? <p className="anb-error">Could not check for updates: {error}</p> : null}
          {items.length === 0 ? (
            <p className="anb-empty">You&apos;re all caught up. New applications and messages will appear here.</p>
          ) : (
            <ul className="anb-list">
              {items.map((item) => {
                const unread = highlight.has(item.id);
                return (
                  <li key={item.id}>
                    <button type="button" className={`anb-item ${unread ? 'is-unread' : ''}`} onClick={() => go(item.link)}>
                      <span className={`anb-item-icon anb-${item.type}`} aria-hidden="true">
                        {item.type === 'application' ? <ClipboardList size={18} /> : <Mail size={18} />}
                      </span>
                      <span className="anb-item-text">
                        <strong>{item.title}</strong>
                        <span>{item.body}</span>
                        <time dateTime={item.created_at}>{timeAgo(item.created_at)}</time>
                      </span>
                      {unread ? (
                        <span className="anb-dot">
                          <span className="sr-only">Unread</span>
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="anb-foot">
            <Link to="/admin/applications" onClick={close}>
              View applications
            </Link>
            <Link to="/admin/settings" onClick={close}>
              Notification settings
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
