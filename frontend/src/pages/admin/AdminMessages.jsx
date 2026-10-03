import { useState } from 'react';
import { deleteMessage, getMessages, updateMessage } from '../../api/admin';
import { ErrorMessage, Loader } from '../../components/Status';
import useAction from '../../hooks/useAction';
import { useLiveVersion } from '../../context/AdminNotifications';
import useApi from '../../hooks/useApi';
import { formatDate } from '../../utils/format';

/** Contact-form inbox: read, mark read / unread, delete. */
export default function AdminMessages() {
  const version = useLiveVersion(); // refetch when new messages arrive
  const messages = useApi(getMessages, [version]);
  const [openId, setOpenId] = useState(null);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [status, run] = useAction();

  const replaceMessage = (updated) =>
    messages.setData((current) => current.map((message) => (message.id === updated.id ? updated : message)));

  const setRead = async (message, isRead) => {
    const result = await run(() => updateMessage(message.id, { is_read: isRead }));
    if (result.ok) replaceMessage(result.data);
  };

  const toggleOpen = (message) => {
    const opening = openId !== message.id;
    setOpenId(opening ? message.id : null);
    if (opening && !message.is_read) setRead(message, true);
  };

  const remove = async (message) => {
    if (!window.confirm(`Delete the message from ${message.name}? This cannot be undone.`)) return;
    const result = await run(() => deleteMessage(message.id), 'Message deleted.');
    if (result.ok) messages.setData((current) => current.filter((item) => item.id !== message.id));
  };

  const list = (messages.data || []).filter((message) => !onlyUnread || !message.is_read);
  const unreadCount = (messages.data || []).filter((message) => !message.is_read).length;

  return (
    <>
      <div className="admin-page-head">
        <h1>Messages {unreadCount ? <span className="count-badge">{unreadCount} unread</span> : null}</h1>
        <label className="toggle">
          <input type="checkbox" checked={onlyUnread} onChange={(event) => setOnlyUnread(event.target.checked)} /> Show
          unread only
        </label>
      </div>

      <div aria-live="polite">
        {status.error ? <div className="alert alert-error">{status.error}</div> : null}
        {status.success ? <div className="alert alert-success">{status.success}</div> : null}
      </div>

      {messages.loading && !messages.data ? <Loader label="Loading messages…" /> : null}
      {messages.error ? <ErrorMessage error={messages.error} onRetry={messages.reload} /> : null}
      {messages.data && list.length === 0 ? <p className="empty-state">No messages to show.</p> : null}

      <ul className="message-list">
        {list.map((message) => (
          <li key={message.id} className={`message-item ${message.is_read ? '' : 'is-unread'}`}>
            <button
              type="button"
              className="message-summary"
              aria-expanded={openId === message.id}
              onClick={() => toggleOpen(message)}
            >
              <span className="message-from">
                {!message.is_read ? <span className="unread-dot" aria-label="Unread" /> : null}
                <strong>{message.name}</strong>
                <span className="muted small">{formatDate(message.created_at, true)}</span>
              </span>
              <span className="message-subject">{message.subject}</span>
            </button>
            {openId === message.id ? (
              <div className="message-body">
                <p className="pre-wrap">{message.message}</p>
                <p className="muted small">
                  <a href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}>{message.email}</a>
                  {message.phone ? (
                    <>
                      {' · '}
                      <a href={`tel:${message.phone}`}>{message.phone}</a>
                    </>
                  ) : null}
                </p>
                <div className="inline-actions">
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => setRead(message, !message.is_read)}>
                    Mark as {message.is_read ? 'unread' : 'read'}
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(message)}>
                    Delete
                  </button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
