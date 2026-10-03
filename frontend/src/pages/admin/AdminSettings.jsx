import { Bell, KeyRound, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getErrorMessage, getFieldErrors, setToken } from '../../api/client';
import { changePassword, getMe, updateMe } from '../../api/admin';
import FormField from '../../components/FormField';
import PasswordField from '../../components/PasswordField';
import { ErrorMessage, Loader } from '../../components/Status';
import { useAdminNotifications } from '../../context/AdminNotifications';
import useApi from '../../hooks/useApi';
import { timeAgo } from '../../utils/format';
import { PASSWORD_HINT, passwordProblem } from '../../utils/password';

const EMPTY_PASSWORDS = { current: '', next: '', confirm: '' };

/** Account settings: email for reset links, change password, notification preferences. */
export default function AdminSettings() {
  const me = useApi(getMe, []);

  if (me.loading && !me.data) return <Loader label="Loading settings…" />;
  if (me.error && !me.data) return <ErrorMessage error={me.error} onRetry={me.reload} />;

  return (
    <div className="settings">
      <div className="admin-page-head">
        <div>
          <h1>Settings</h1>
          <p className="muted">Manage your account, password and notifications.</p>
        </div>
      </div>
      <div className="settings-grid">
        <ProfileSection admin={me.data} onSaved={me.setData} />
        <PasswordSection admin={me.data} />
        <NotificationSection />
      </div>
    </div>
  );
}

function SectionHeader({ id, icon: Icon, title, text }) {
  return (
    <div className="settings-head">
      <span className="settings-icon" aria-hidden="true">
        <Icon size={20} strokeWidth={2} />
      </span>
      <div>
        <h2 id={id}>{title}</h2>
        <p className="muted small">{text}</p>
      </div>
    </div>
  );
}

function ProfileSection({ admin, onSaved }) {
  const [email, setEmail] = useState(admin.email || '');
  const [status, setStatus] = useState({ saving: false, error: '', field: '', saved: false });

  const save = async (event) => {
    event.preventDefault();
    setStatus({ saving: true, error: '', field: '', saved: false });
    try {
      const updated = await updateMe({ email: email.trim() });
      onSaved(updated);
      setEmail(updated.email || '');
      setStatus({ saving: false, error: '', field: '', saved: true });
    } catch (err) {
      setStatus({ saving: false, error: getErrorMessage(err), field: getFieldErrors(err).email || '', saved: false });
    }
  };

  return (
    <section className="admin-panel settings-card" aria-labelledby="profile-heading">
      <SectionHeader id="profile-heading" icon={UserRound} title="Profile" text="Your sign-in name and the email that receives password reset links." />
      <form onSubmit={save} noValidate>
        <div className="form-field">
          <label htmlFor="settings-username" className="form-label">
            Username
          </label>
          <input id="settings-username" className="form-control" value={admin.username} readOnly disabled />
          <p className="form-hint">Usernames are set on the server (ADMIN_USERNAME in backend/.env).</p>
        </div>
        <FormField
          id="settings-email"
          label="Email for password resets"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setStatus((current) => ({ ...current, saved: false, field: '' }));
          }}
          error={status.field}
          hint="Used by “Forgot password?” on the sign-in page."
        />
        {status.error && !status.field ? (
          <div className="alert alert-error" role="alert">
            {status.error}
          </div>
        ) : null}
        {status.saved ? (
          <div className="alert alert-success" role="status">
            Email saved.
          </div>
        ) : null}
        <div className="form-actions form-actions-end">
          <button type="submit" className="btn btn-maroon" disabled={status.saving}>
            {status.saving ? 'Saving…' : 'Save email'}
          </button>
        </div>
      </form>
    </section>
  );
}

function PasswordSection({ admin }) {
  const [values, setValues] = useState(EMPTY_PASSWORDS);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ saving: false, error: '', success: '' });

  const change = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const save = async (event) => {
    event.preventDefault();
    const found = {};
    if (!values.current) found.current = 'Enter your current password.';
    const problem = passwordProblem(values.next, admin.username);
    if (problem) found.next = problem;
    else if (values.next === values.current) found.next = 'Choose a password that is different from your current one.';
    if (values.confirm !== values.next) found.confirm = 'The passwords do not match.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setStatus({ saving: true, error: '', success: '' });
    try {
      const result = await changePassword(values.current, values.next);
      setToken(result.access_token); // stay signed in here; other devices are signed out
      setValues(EMPTY_PASSWORDS);
      setStatus({ saving: false, error: '', success: result.message });
    } catch (err) {
      const fields = getFieldErrors(err);
      setErrors({ current: fields.current_password, next: fields.new_password });
      setStatus({ saving: false, error: getErrorMessage(err), success: '' });
    }
  };

  return (
    <section className="admin-panel settings-card" aria-labelledby="password-heading">
      <SectionHeader id="password-heading" icon={KeyRound} title="Change password" text="Changing your password signs out every other device." />
      <form onSubmit={save} noValidate>
        {/* Helps password managers update the right account */}
        <input type="text" name="username" value={admin.username} autoComplete="username" readOnly hidden />
        <PasswordField
          id="current"
          label="Current password"
          value={values.current}
          onChange={change}
          error={errors.current}
          autoComplete="current-password"
        />
        <PasswordField
          id="next"
          label="New password"
          hint={PASSWORD_HINT}
          value={values.next}
          onChange={change}
          error={errors.next}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm"
          label="Confirm new password"
          value={values.confirm}
          onChange={change}
          error={errors.confirm}
          autoComplete="new-password"
        />
        {status.error && !errors.current && !errors.next ? (
          <div className="alert alert-error" role="alert">
            {status.error}
          </div>
        ) : null}
        {status.success ? (
          <div className="alert alert-success" role="status">
            {status.success}
          </div>
        ) : null}
        <div className="form-actions form-actions-end">
          <button type="submit" className="btn btn-maroon" disabled={status.saving}>
            {status.saving ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </section>
  );
}

function NotificationSection() {
  const { prefs, setPrefs, checkedAt, error, refresh } = useAdminNotifications();
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported');
  const [, forceTick] = useState(0);

  // Keep "checked x seconds ago" fresh.
  useEffect(() => {
    const timer = window.setInterval(() => forceTick((n) => n + 1), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const toggleDesktop = async (event) => {
    await setPrefs({ desktop: event.target.checked });
    if (supported) setPermission(Notification.permission);
  };

  return (
    <section id="notifications" className="admin-panel settings-card" aria-labelledby="notifications-heading">
      <SectionHeader
        id="notifications-heading"
        icon={Bell}
        title="Notifications"
        text="New applications and contact messages appear live while the dashboard is open."
      />
      <div className="settings-live">
        <span className={`asb-live-dot ${error ? 'is-off' : ''}`} aria-hidden="true" />
        <span>
          {error ? `Could not check for updates: ${error}` : 'Live updates are on'}
          {checkedAt && !error ? <span className="muted"> · last checked {timeAgo(checkedAt)}</span> : null}
        </span>
        <button type="button" className="btn btn-sm btn-outline" onClick={refresh}>
          Check now
        </button>
      </div>
      <label className="switch">
        <input type="checkbox" checked={prefs.sound} onChange={(event) => setPrefs({ sound: event.target.checked })} />
        <span className="switch-track" aria-hidden="true" />
        <span>
          <strong>Play a sound</strong>
          <span className="muted small"> when a new application or message arrives</span>
        </span>
      </label>
      <label className="switch">
        <input type="checkbox" checked={prefs.desktop && permission === 'granted'} onChange={toggleDesktop} disabled={!supported || permission === 'denied'} />
        <span className="switch-track" aria-hidden="true" />
        <span>
          <strong>Desktop notifications</strong>
          <span className="muted small"> while the dashboard is open in another tab</span>
        </span>
      </label>
      {!supported ? <p className="form-hint">This browser does not support desktop notifications.</p> : null}
      {permission === 'denied' ? (
        <p className="form-hint">Notifications are blocked for this site. Allow them in your browser&apos;s site settings.</p>
      ) : null}
      <p className="form-hint">These preferences are saved in this browser only.</p>
    </section>
  );
}
