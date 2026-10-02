import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import BrandNames from './BrandNames';
import { CloseIcon, MenuIcon } from './Icons';
import Logo from './Logo';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/programmes', label: 'Programmes' },
  { to: '/short-courses', label: 'Short Courses' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

/** Sticky site header with both institution names and a mobile hamburger menu. */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile menu after navigating or pressing Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link to="/" className="brand" aria-label="Manna College and Manna Bible Institute, home">
          <Logo size={52} decorative />
          <BrandNames />
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseIcon size={26} /> : <MenuIcon size={26} />}
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>

        <nav
          id="primary-navigation"
          className={`primary-nav ${open ? 'is-open' : ''}`}
          aria-label="Main navigation"
        >
          <ul className="nav-links">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className="nav-link">
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <Link to="/apply" className="btn btn-gold nav-cta">
            Enroll Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
