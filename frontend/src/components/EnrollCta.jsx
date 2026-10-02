import { Link } from 'react-router-dom';
import { useSiteInfo, whatsappLink } from '../context/SiteInfoContext';
import { WhatsAppIcon } from './Icons';

/** Maroon call-to-action band with gold text. */
export default function EnrollCta({
  title = 'Ready to advance your calling?',
  text,
  applyTo = '/apply',
  applyLabel = 'Enroll Today',
}) {
  const { info } = useSiteInfo();
  const body =
    text ||
    (info
      ? `Join our ${info.mode} and study from any location, ${info.class_time.display} ${info.class_time.timezone_short}. We are TVET accredited.`
      : 'Join our Virtual Satellite Class and study from any location.');
  const chat = whatsappLink(info, 'Hello, I would like to know more about enrolling.');

  return (
    <section className="cta-band" aria-labelledby="cta-heading">
      <div className="container cta-inner">
        <div>
          <h2 id="cta-heading" className="cta-title">
            {title}
          </h2>
          <p className="cta-text">{body}</p>
        </div>
        <div className="cta-actions">
          <Link to={applyTo} className="btn btn-gold btn-lg">
            {applyLabel}
          </Link>
          {chat ? (
            <a className="btn btn-outline-light btn-lg" href={chat} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={20} /> Chat on WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
