import { Link } from 'react-router-dom';
import BrandNames from '../../components/BrandNames';
import Logo from '../../components/Logo';
import Seo from '../../components/Seo';

/** Branded card shared by the admin sign-in, forgot-password and reset-password pages. */
export default function AdminAuthCard({ title, seoTitle, children, footer }) {
  return (
    <div className="admin-login">
      <Seo title={seoTitle || title} noIndex />
      <main className="admin-login-card">
        <div className="admin-login-brand">
          <Logo size={88} decorative />
          <BrandNames className="brand-names-stacked" />
        </div>
        <h1>{title}</h1>
        {children}
        <div className="admin-login-footer">
          {footer}
          <Link to="/" className="admin-login-back">
            ← Back to website
          </Link>
        </div>
      </main>
    </div>
  );
}
