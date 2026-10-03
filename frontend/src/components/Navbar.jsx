import { ArrowRight, BookOpen, ChevronRight, GraduationCap, House, Info, Mail, Menu, Phone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSiteInfo } from '../context/SiteInfoContext';
import '../styles/chrome-modern.css';
import BrandNames from './BrandNames';
import { WhatsAppIcon } from './Icons';
import Logo from './Logo';

const LINKS = [
  { to: '/', label: 'Home', end: true, Icon: House },
  { to: '/programmes', label: 'Programmes', Icon: GraduationCap },
  { to: '/short-courses', label: 'Short Courses', Icon: BookOpen },
  { to: '/about', label: 'About', Icon: Info },
  { to: '/contact', label: 'Contact', Icon: Mail },
];

const DESKTOP_QUERY = '(min-width: 1100px)';

/** Sticky site header with both institution names and a mobile hamburger menu. */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // Add a soft shadow once the page has scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nb ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container nb-inner">
        <Link to="/" className="nb-brand" aria-label="Manna College and Manna Bible Institute, home">
          <span className="nb-logo">
            <Logo size={44} decorative />
          </span>
          <BrandNames />
        </Link>

        <button
          type="button"
          className="nb-toggle"
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={24} strokeWidth={2.2} aria-hidden="true" /> : <Menu size={24} strokeWidth={2.2} aria-hidden="true" />}
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>

        {open ? <div className="nb-backdrop" aria-hidden="true" onClick={() => setOpen(false)} /> : null}

        <nav id="primary-navigation" className={`nb-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          <ul className="nb-links">
            {LINKS.map(({ to, label, end, Icon }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => `nb-link ${isActive ? 'is-active' : ''}`}>
                  <Icon className="nb-link-icon" size={20} strokeWidth={1.9} aria-hidden="true" />
                  <span>{label}</span>
                  <ChevronRight className="nb-chevron" size={18} aria-hidden="true" />
                </NavLink>
              </li>
            ))}
          </ul>
          <Link to="/apply" className="btn btn-maroon nb-cta">
            Enroll Now
            <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
          </Link>
          {info ? (
            <div className="nb-quick">
              <a href={info.phone_href} className="btn btn-outline">
                <Phone size={18} strokeWidth={2} aria-hidden="true" /> Call us
              </a>
              <a href={info.whatsapp_url} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <WhatsAppIcon size={18} /> WhatsApp
              </a>
            </div>
          ) : null}
          {info ? (
            <p className="nb-classtime">
              Classes: {info.class_time.display} {info.class_time.timezone_short}
            </p>
          ) : null}
        </nav>
      </div>
    </header>
  );
}