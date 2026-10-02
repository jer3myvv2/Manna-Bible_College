import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import Navbar from './Navbar';
import WhatsAppButton from './WhatsAppButton';

/** Layout shared by every public page: skip link, header, footer, WhatsApp button. */
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
    </>
  );
}
