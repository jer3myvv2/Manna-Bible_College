import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Manna College & Manna Bible Institute';
const DEFAULT_DESCRIPTION =
  'TVET accredited online Certificate and Diploma programmes (Level 4, 5 & 6). Study from any location through our Virtual Satellite Class.';

/** Per-page <title> and meta description. */
export default function Seo({ title, description = DEFAULT_DESCRIPTION, noIndex = false }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Virtual Satellite Class`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}
    </Helmet>
  );
}
