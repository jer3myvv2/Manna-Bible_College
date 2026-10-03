import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { forgotPassword } from '../../api/admin';
import FormField from '../../components/FormField';
import AdminAuthCard from './AdminAuthCard';

/** Step 1 of password recovery: ask for a reset link by email. */
export default function AdminForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!identifier.trim()) {
      setFieldError('Enter your username or email address.');
      return;
    }
    setSubmitting(true);
    setFieldError('');
    setError('');
    try {
      setResult(await forgotPassword(identifier.trim()));
    } catch (err) {
      setFieldError(getFieldErrors(err).identifier || '');
      setError(getErrorMessage(err, 'We could not send the reset link. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const backToLogin = <Link to="/admin/login" className="admin-login-back">← Back to sign in</Link>;

  if (result) {
    return (
      <AdminAuthCard title="Check your email" footer={backToLogin}>
        <div className="auth-success">
          <span className="auth-success-icon" aria-hidden="true">
            <MailCheck size={30} strokeWidth={1.8} />
          </span>
          <p role="status">{result.message}</p>
        </div>
        {result.dev_note ? <div className="alert alert-info">{result.dev_note}</div> : null}
        <p className="muted small">
          Didn&apos;t get it? Check your spam folder, or{' '}
          <button type="button" className="link-button" onClick={() => setResult(null)}>
            try again
          </button>
        </p>
      </AdminAuthCard>
    );
  }

  return (
    <AdminAuthCard title="Forgot password?" seoTitle="Forgot password" footer={backToLogin}>
      <p className="muted">
        Enter your admin username or email address and we&apos;ll email you a link to choose a new password.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="identifier"
          label="Username or email"
          required
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          error={fieldError}
        />
        {error && !fieldError ? (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        ) : null}
        <button type="submit" className="btn btn-gold btn-block" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AdminAuthCard>
  );
}
