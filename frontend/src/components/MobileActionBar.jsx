import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSiteInfo, whatsappLink } from '../context/SiteInfoContext';
import { PhoneIcon, WhatsAppIcon } from './Icons';

const TEXT_FIELD = 'input:not([type="checkbox"]):not([type="radio"]), textarea, select';

const isTyping = () => Boolean(document.activeElement?.matches?.(TEXT_FIELD));

/**
 * Bottom bar shown on phones only (CSS hides it from 900px): Call, WhatsApp and
 * Enroll Now within thumb reach. It slides away while a form field is focused so
 * it never sits on top of the on-screen keyboard.
 */
export default function MobileActionBar() {
  const { info } = useSiteInfo();
  const { pathname } = useLocation();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const update = () => setHidden(isTyping());
    // focusout fires before the next field receives focus, so check on the next tick.
    const onFocusOut = () => window.setTimeout(update, 50);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  if (!info) return null;
  const onApplyPage = pathname.startsWith('/apply');

  return (
    <nav className={`mobile-action-bar ${hidden ? 'is-hidden' : ''}`} aria-label="Quick contact">
      <a href={info.phone_href} className="mab-item">
        <PhoneIcon size={20} />
        <span>Call</span>
      </a>
      <a
        href={whatsappLink(info, 'Hello, I would like to know more about your programmes.')}
        target="_blank"
        rel="noopener noreferrer"
        className="mab-item mab-whatsapp"
      >
        <WhatsAppIcon size={20} />
        <span>WhatsApp</span>
      </a>
      {onApplyPage ? null : (
        <Link to="/apply" className="mab-item mab-apply">
          Enroll Now
        </Link>
      )}
    </nav>
  );
}
