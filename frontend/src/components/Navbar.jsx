import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSiteInfo } from '../context/SiteInfoContext';
import BrandNames from './BrandNames';
import { CloseIcon, MenuIcon, PhoneIcon, WhatsAppIcon } from './Icons';
import Logo from './Logo';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/programmes', label: 'Programmes' },
  { to: '/short-courses', label: 'Short Courses' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const DESKTOP_QUERY = '(min-width: 1100px)';

/** Sticky site header with both institution names and a mobile hamburger menu. */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { info } = useSiteInfo();

  // Close the mobile menu after navigating, pressing Escape or widening to desktop.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onResize = (event) => event.matches && setOpen(false);
    document.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onResize);
    };
  }, [open]);

  // Stop the page behind the open menu from scrolling on phones.
  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    return () => document.body.classList.remove('nav-open');
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

        {open ? <div className="nav-backdrop" aria-hidden="true" onClick={() => setOpen(false)} /> : null}

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
          {info ? (
            <div className="nav-quick">
              <a href={info.phone_href} className="btn btn-outline-light">
                <PhoneIcon size={18} /> Call us
              </a>
              <a href={info.whatsapp_url} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <WhatsAppIcon size={18} /> WhatsApp
              </a>
            </div>
          ) : null}
          {info ? (
            <p className="nav-classtime">
              Classes: {info.class_time.display} {info.class_time.timezone_short}
            </p>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
