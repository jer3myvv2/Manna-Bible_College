import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import MobileActionBar from './MobileActionBar';
import Navbar from './Navbar';
import WhatsAppButton from './WhatsAppButton';

/**
 * Layout shared by every public page: skip link, header, footer, and the contact
 * shortcuts (floating WhatsApp button on larger screens, bottom action bar on phones).
 */
export default function PublicLayout() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <MobileActionBar />
    </>
  );
}
