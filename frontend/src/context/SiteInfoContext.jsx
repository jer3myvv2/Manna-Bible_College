/**
 * Site-wide institution details (contact info, class time, taglines) loaded once
 * from GET /api/info, so they are edited in a single place on the backend.
 */
import { createContext, useContext } from 'react';
import { getInfo } from '../api/public';
import useApi from '../hooks/useApi';

const SiteInfoContext = createContext({ info: null, loading: true, error: null, reload: () => {} });

export function SiteInfoProvider({ children }) {
  const { data, loading, error, reload } = useApi(getInfo, []);
  return (
    <SiteInfoContext.Provider value={{ info: data, loading, error, reload }}>
      {children}
    </SiteInfoContext.Provider>
  );
}

export function useSiteInfo() {
  return useContext(SiteInfoContext);
}

/** Build a WhatsApp link with an optional pre-filled message. */
export function whatsappLink(info, text) {
  if (!info?.whatsapp_url) return null;
  return text ? `${info.whatsapp_url}?text=${encodeURIComponent(text)}` : info.whatsapp_url;
}
