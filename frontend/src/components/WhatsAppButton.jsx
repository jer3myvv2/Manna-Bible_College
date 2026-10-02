import { useSiteInfo } from '../context/SiteInfoContext';
import { WhatsAppIcon } from './Icons';

/**
 * Floating "Chat with us on WhatsApp" button (bottom-right on tablets and desktops).
 * On phones the MobileActionBar takes its place.
 */
export default function WhatsAppButton() {
  const { info } = useSiteInfo();
  if (!info?.whatsapp_url) return null;
  return (
    <a
      className="whatsapp-float"
      href={info.whatsapp_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp (opens in a new tab)"
    >
      <WhatsAppIcon size={30} />
      <span className="whatsapp-float-label">Chat with us</span>
    </a>
  );
}
