import Reveal from './Reveal';

/** Compact maroon hero used at the top of inner pages. */
export default function PageHero({ eyebrow, title, lead, children }) {
  return (
    <section className="page-hero">
      <div className="container page-hero-inner">
        {eyebrow ? (
          <Reveal as="p" className="page-hero-eyebrow">
            {eyebrow}
          </Reveal>
        ) : null}
        <Reveal as="h1" delay={100} className="page-hero-title">
          {title}
        </Reveal>
        {lead ? (
          <Reveal as="p" delay={200} className="page-hero-lead">
            {lead}
          </Reveal>
        ) : null}
        {children}
      </div>
    </section>
  );
}