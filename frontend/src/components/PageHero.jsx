/** Compact maroon hero used at the top of inner pages. */
export default function PageHero({ eyebrow, title, lead, children }) {
  return (
    <section className="page-hero">
      <div className="container page-hero-inner">
        {eyebrow ? <p className="page-hero-eyebrow">{eyebrow}</p> : null}
        <h1 className="page-hero-title">{title}</h1>
        {lead ? <p className="page-hero-lead">{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}
