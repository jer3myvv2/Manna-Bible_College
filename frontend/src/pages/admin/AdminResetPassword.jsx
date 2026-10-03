import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { clearToken, getErrorMessage, getFieldErrors } from '../../api/client';
import { checkResetToken, resetPassword } from '../../api/admin';
import PasswordField from '../../components/PasswordField';
import { Loader } from '../../components/Status';
import { PASSWORD_HINT, passwordProblem } from '../../utils/password';
import AdminAuthCard from './AdminAuthCard';

/** Step 2 of password recovery: the link from the email lands here. */
export default function AdminResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [link, setLink] = useState({ checking: true, username: '', error: '' });
  const [values, setValues] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check the link first so an expired or used link is reported straight away.
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setLink({ checking: false, username: '', error: 'This reset link is incomplete. Please request a new one.' });
      return undefined;
    }
    checkResetToken(token)
      .then((data) => !cancelled && setLink({ checking: false, username: data.username, error: '' }))
      .catch((err) => !cancelled && setLink({ checking: false, username: '', error: getErrorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = {};
    const problem = passwordProblem(values.password, link.username);
    if (problem) found.password = problem;
    if (values.confirm !== values.password) found.confirm = 'The passwords do not match.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      await resetPassword(token, values.password);
      clearToken(); // any old session in this browser is no longer valid
      navigate('/admin/login?reset=1', { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setSubmitError(getErrorMessage(err, 'We could not change your password. Please try again.'));
      setSubmitting(false);
    }
  };

  const backToLogin = <Link to="/admin/login" className="admin-login-back">← Back to sign in</Link>;

  if (link.checking) {
    return (
      <AdminAuthCard title="Choose a new password" footer={backToLogin}>
        <Loader label="Checking your reset link…" />
      </AdminAuthCard>
    );
  }

  if (link.error) {
    return (
      <AdminAuthCard title="Reset link problem" seoTitle="Reset password" footer={backToLogin}>
        <div className="alert alert-error" role="alert">
          {link.error}
        </div>
        <Link to="/admin/forgot-password" className="btn btn-gold btn-block">
          Request a new link
        </Link>
      </AdminAuthCard>
    );
  }

  return (
    <AdminAuthCard title="Choose a new password" seoTitle="Reset password" footer={backToLogin}>
      <p className="muted">
        Resetting the password for <strong>{link.username}</strong>.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        {/* Lets password managers save the new password against the right username */}
        <input type="text" name="username" value={link.username} autoComplete="username" readOnly hidden />
        <PasswordField
          id="password"
          label="New password"
          hint={PASSWORD_HINT}
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <PasswordField
          id="confirm"
          label="Confirm new password"
          autoComplete="new-password"
          value={values.confirm}
          onChange={handleChange}
          error={errors.confirm}
        />
        {submitError && !errors.password ? (
          <div className="alert alert-error" role="alert">
            {submitError}
          </div>
        ) : null}
        <button type="submit" className="btn btn-gold btn-block" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AdminAuthCard>
  );
}
