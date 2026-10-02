import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll to the top of the page whenever the route changes (unless linking to #anchor). */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
