import { ArrowRight, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteInfo, whatsappLink } from '../context/SiteInfoContext';
import '../styles/components-modern.css';
import { WhatsAppIcon } from './Icons';

/** Maroon call-to-action panel with gold button. */
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
    <section className="cta2" aria-labelledby="cta-heading">
      <div className="container">
        <div className="cta2-panel">
          <GraduationCap className="cta2-watermark" size={260} strokeWidth={1} aria-hidden="true" />
          <div className="cta2-copy">
            <h2 id="cta-heading" className="cta2-title">
              {title}
            </h2>
            <p className="cta2-text">{body}</p>
          </div>
          <div className="cta2-actions">
            <Link to={applyTo} className="btn btn-gold btn-lg">
              {applyLabel}
              <ArrowRight size={20} strokeWidth={2.2} aria-hidden="true" />
            </Link>
            {chat ? (
              <a className="btn btn-outline-light btn-lg" href={chat} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={20} /> Chat on WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}