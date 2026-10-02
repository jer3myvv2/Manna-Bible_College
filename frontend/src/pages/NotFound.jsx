import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Seo from '../components/Seo';

/** Branded 404 page. */
export default function NotFound({ message = 'The page you are looking for does not exist or has moved.' }) {
  return (
    <>
      <Seo title="Page not found" noIndex />
      <section className="not-found">
        <div className="container not-found-inner">
          <Logo size={140} />
          <p className="not-found-code">404</p>
          <h1 className="not-found-title">Page not found</h1>
          <p className="not-found-text">{message}</p>
          <div className="hero-actions center">
            <Link to="/" className="btn btn-gold btn-lg">
              Go to home page
            </Link>
            <Link to="/programmes" className="btn btn-outline-light btn-lg">
              View programmes
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
