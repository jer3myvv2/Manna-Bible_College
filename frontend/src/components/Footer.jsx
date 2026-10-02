import { Link } from 'react-router-dom';
import { getProgrammes } from '../api/public';
import { useSiteInfo } from '../context/SiteInfoContext';
import useApi from '../hooks/useApi';
import BrandNames from './BrandNames';
import { ClockIcon, GlobeIcon, MailIcon, PersonIcon, PhoneIcon, WhatsAppIcon } from './Icons';
import Logo from './Logo';

/** Footer replicating the poster footer band plus contact details. */
export default function Footer() {
  const { info } = useSiteInfo();
  const programmes = useApi(() => getProgrammes(), []);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-band">
        <div className="container footer-band-inner">
          <span className="footer-band-icon" aria-hidden="true">
            <PersonIcon size={30} />
          </span>
          <p className="footer-band-text">
            <strong>ENROLL TODAY!</strong> <span>WE ARE TVET ACCREDITED</span>
          </p>
          <Link to="/apply" className="btn btn-maroon">
            Apply now
          </Link>
        </div>
      </div>

      <div className="container footer-grid">
        <div className="footer-col footer-brand">
          <Link to="/" className="footer-logo-link" aria-label="Home">
            <Logo size={64} decorative />
            <BrandNames className="brand-names-stacked" />
          </Link>
          {info ? <p className="footer-tagline">{info.taglines.theology}</p> : null}
          {info ? (
            <p className="footer-classtime">
              <ClockIcon size={18} /> {info.mode}: {info.class_time.display} {info.class_time.timezone_short}
            </p>
          ) : null}
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Programmes</h2>
          {programmes.loading ? <p className="footer-muted">Loading…</p> : null}
          {programmes.error ? <p className="footer-muted">Programmes are unavailable right now.</p> : null}
          <ul className="footer-links">
            {(programmes.data || []).map((programme) => (
              <li key={programme.slug}>
                <Link to={`/programmes/${programme.slug}`}>{programme.short_title}</Link>
              </li>
            ))}
            <li>
              <Link to="/short-courses">Short Courses</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Quick links</h2>
          <ul className="footer-links">
            <li><Link to="/apply">Apply / Enroll</Link></li>
            <li><Link to="/about">About us</Link></li>
            <li><Link to="/contact">Contact us</Link></li>
            <li><Link to="/programmes">All programmes</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Contact us</h2>
          {info ? (
            <ul className="footer-contact">
              <li>
                <PhoneIcon size={18} />
                <a href={info.phone_href}>{info.phone}</a>
              </li>
              <li>
                <WhatsAppIcon size={18} />
                <a href={info.whatsapp_url} target="_blank" rel="noopener noreferrer">
                  WhatsApp {info.whatsapp}
                </a>
              </li>
              {info.emails.map((email) => (
                <li key={email}>
                  <MailIcon size={18} />
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              ))}
              {info.websites.map((site) => (
                <li key={site.url}>
                  <GlobeIcon size={18} />
                  <a href={site.url} target="_blank" rel="noopener noreferrer">
                    {site.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footer-muted">Loading contact details…</p>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
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
