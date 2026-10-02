import { useState } from 'react';
import { createAnnouncement, deleteAnnouncement, getAnnouncements, updateAnnouncement } from '../../api/admin';
import FormField from '../../components/FormField';
import { ErrorMessage, Loader } from '../../components/Status';
import useAction from '../../hooks/useAction';
import useApi from '../../hooks/useApi';
import { formatDate } from '../../utils/format';

/** Announcements (intake dates, news) shown on the home page when published. */
export default function AdminAnnouncements() {
  const announcements = useApi(getAnnouncements, []);
  const [status, run] = useAction();
  const [editing, setEditing] = useState(null); // announcement object, 'new', or null

  const mutate = async (action, message) => {
    const result = await run(action, message);
    if (result.ok) announcements.reload();
    return result;
  };

  const save = async (values) => {
    const result =
      editing === 'new'
        ? await mutate(() => createAnnouncement(values), 'Announcement created.')
        : await mutate(() => updateAnnouncement(editing.id, values), 'Announcement saved.');
    if (result.ok) setEditing(null);
  };

  const remove = (announcement) => {
    if (!window.confirm(`Delete the announcement "${announcement.title}"?`)) return;
    mutate(() => deleteAnnouncement(announcement.id), 'Announcement deleted.');
  };

  return (
    <>
      <div className="admin-page-head">
        <h1>Announcements</h1>
        <button type="button" className="btn btn-sm btn-gold" onClick={() => setEditing(editing === 'new' ? null : 'new')}>
          {editing === 'new' ? 'Cancel' : 'New announcement'}
        </button>
      </div>

      <div aria-live="polite">
        {status.error ? <div className="alert alert-error">{status.error}</div> : null}
        {status.success ? <div className="alert alert-success">{status.success}</div> : null}
      </div>

      {editing === 'new' ? (
        <section className="admin-panel">
          <h2>New announcement</h2>
          <AnnouncementForm onSubmit={save} onCancel={() => setEditing(null)} busy={status.busy} fieldErrors={status.fields} />
        </section>
      ) : null}

      {announcements.loading && !announcements.data ? <Loader label="Loading announcements…" /> : null}
      {announcements.error ? <ErrorMessage error={announcements.error} onRetry={announcements.reload} /> : null}
      {announcements.data && announcements.data.length === 0 ? (
        <p className="empty-state">No announcements yet.</p>
      ) : null}

      <div className="announcement-admin-list">
        {(announcements.data || []).map((announcement) => (
          <section key={announcement.id} className="admin-panel">
            {editing?.id === announcement.id ? (
              <>
                <h2>Edit announcement</h2>
                <AnnouncementForm
                  initial={announcement}
                  onSubmit={save}
                  onCancel={() => setEditing(null)}
                  busy={status.busy}
                  fieldErrors={status.fields}
                />
              </>
            ) : (
              <>
                <div className="announcement-admin-head">
                  <h2>{announcement.title}</h2>
                  <span className={`status-pill ${announcement.is_published ? 'status-admitted' : 'status-contacted'}`}>
                    {announcement.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="muted small">{formatDate(announcement.created_at, true)}</p>
                <p className="pre-wrap">{announcement.body}</p>
                <div className="inline-actions">
                  <button type="button" className="btn btn-sm btn-maroon" onClick={() => setEditing(announcement)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() =>
                      mutate(
                        () => updateAnnouncement(announcement.id, { is_published: !announcement.is_published }),
                        announcement.is_published ? 'Announcement unpublished.' : 'Announcement published.',
                      )
                    }
                  >
                    {announcement.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(announcement)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

function AnnouncementForm({ initial, onSubmit, onCancel, busy, fieldErrors = {} }) {
  const [values, setValues] = useState({
    title: initial?.title || '',
    body: initial?.body || '',
    is_published: initial ? initial.is_published : true,
  });
  const prefix = initial ? `announcement-${initial.id}` : 'announcement-new';

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <form
      className="admin-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
      noValidate
    >
      <FormField
        id={`${prefix}-title`}
        name="title"
        label="Title"
        required
        value={values.title}
        onChange={handleChange}
        error={fieldErrors.title}
      />
      <FormField
        id={`${prefix}-body`}
        name="body"
        label="Text"
        as="textarea"
        rows={5}
        required
        value={values.body}
        onChange={handleChange}
        error={fieldErrors.body}
      />
      <label className="toggle">
        <input type="checkbox" name="is_published" checked={values.is_published} onChange={handleChange} /> Published
        (visible on the home page)
      </label>
      <div className="form-actions form-actions-end">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-gold" disabled={busy}>
          {busy ? 'Saving…' : 'Save announcement'}
        </button>
      </div>
    </form>
  );
}
