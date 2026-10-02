import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getErrorMessage, getToken, setToken } from '../../api/client';
import { login } from '../../api/admin';
import BrandNames from '../../components/BrandNames';
import Logo from '../../components/Logo';
import Seo from '../../components/Seo';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Only ever return to an admin page after login (never an arbitrary URL).
  const from =
    typeof location.state?.from === 'string' &&
    location.state.from.startsWith('/admin/') &&
    !location.state.from.startsWith('/admin/login')
      ? location.state.from
      : '/admin';

  if (getToken()) return <Navigate to={from} replace />;

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError('Please enter your username and password.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await login(form.username.trim(), form.password);
      setToken(result.access_token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <Seo title="Admin login" noIndex />
      <main className="admin-login-card">
        <div className="admin-login-brand">
          <Logo size={88} decorative />
          <BrandNames className="brand-names-stacked" />
        </div>
        <h1>Admin sign in</h1>
        {searchParams.get('expired') ? (
          <div className="alert alert-info" role="status">
            Your session has ended. Please sign in again.
          </div>
        ) : null}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              className="form-control"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          {error ? (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          ) : null}
          <button type="submit" className="btn btn-gold btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <a href="/" className="admin-login-back">
          ← Back to website
        </a>
      </main>
    </div>
  );
}
