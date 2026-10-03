import { ArrowRight, Clock, Globe, Mail, Phone, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProgrammes } from '../api/public';
import { useSiteInfo } from '../context/SiteInfoContext';
import useApi from '../hooks/useApi';
import '../styles/chrome-modern.css';
import BrandNames from './BrandNames';
import { WhatsAppIcon } from './Icons';
import Logo from './Logo';
import Reveal from './Reveal';

/** Footer replicating the poster footer band plus contact details. */
export default function Footer() {
  const { info } = useSiteInfo();
  const programmes = useApi(() => getProgrammes(), []);
  const year = new Date().getFullYear();

  return (
    <footer className="ft">
      <div className="container">
        <Reveal className="ft-band">
          <span className="ft-band-icon" aria-hidden="true">
            <UserRound size={28} strokeWidth={1.9} />
          </span>
          <p className="ft-band-text">
            <strong>ENROLL TODAY!</strong> <span>WE ARE TVET ACCREDITED</span>
          </p>
          <Link to="/apply" className="btn btn-maroon">
            Apply now
            <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </Reveal>
      </div>

      <div className="container ft-grid">
        <Reveal className="ft-col ft-brand">
          <Link to="/" className="ft-logo-link" aria-label="Home">
            <Logo size={64} decorative />
            <BrandNames className="brand-names-stacked" />
          </Link>
          {info ? <p className="ft-tagline">{info.taglines.theology}</p> : null}
          {info ? (
            <p className="ft-classtime">
              <Clock size={18} strokeWidth={1.9} aria-hidden="true" /> {info.mode}: {info.class_time.display}{' '}
              {info.class_time.timezone_short}
            </p>
          ) : null}
        </Reveal>

        <Reveal delay={100} className="ft-col">
          <h2 className="ft-heading">Programmes</h2>
          {programmes.loading ? <p className="ft-muted">Loading…</p> : null}
          {programmes.error ? <p className="ft-muted">Programmes are unavailable right now.</p> : null}
          <ul className="ft-links">
            {(programmes.data || []).map((programme) => (
              <li key={programme.slug}>
                <Link to={`/programmes/${programme.slug}`}>{programme.short_title}</Link>
              </li>
            ))}
            <li>
              <Link to="/short-courses">Short Courses</Link>
            </li>
          </ul>
        </Reveal>

        <Reveal delay={200} className="ft-col">
          <h2 className="ft-heading">Quick links</h2>
          <ul className="ft-links">
            <li><Link to="/apply">Apply / Enroll</Link></li>
            <li><Link to="/about">About us</Link></li>
            <li><Link to="/contact">Contact us</Link></li>
            <li><Link to="/programmes">All programmes</Link></li>
          </ul>
        </Reveal>

        <Reveal delay={300} className="ft-col">
          <h2 className="ft-heading">Contact us</h2>
          {info ? (
            <ul className="ft-contact">
              <li>
                <span className="ft-contact-icon"><Phone size={17} strokeWidth={1.9} aria-hidden="true" /></span>
                <a href={info.phone_href}>{info.phone}</a>
              </li>
              <li>
                <span className="ft-contact-icon"><WhatsAppIcon size={17} /></span>
                <a href={info.whatsapp_url} target="_blank" rel="noopener noreferrer">
                  WhatsApp {info.whatsapp}
                </a>
              </li>
              {info.emails.map((email) => (
                <li key={email}>
                  <span className="ft-contact-icon"><Mail size={17} strokeWidth={1.9} aria-hidden="true" /></span>
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              ))}
              {info.websites.map((site) => (
                <li key={site.url}>
                  <span className="ft-contact-icon"><Globe size={17} strokeWidth={1.9} aria-hidden="true" /></span>
                  <a href={site.url} target="_blank" rel="noopener noreferrer">
                    {site.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ft-muted">Loading contact details…</p>
          )}
        </Reveal>
      </div>

      <div className="ft-bottom">
        <div className="container ft-bottom-inner">
          <p>
            © {year} Manna College &amp; Manna Bible Institute. All rights reserved.
          </p>
          {info ? (
            <p>
              {info.websites.map((site, index) => (
                <span key={site.url}>
                  {index > 0 ? ' | ' : ''}
                  <a href={site.url} target="_blank" rel="noopener noreferrer">
                    {site.label}
                  </a>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}