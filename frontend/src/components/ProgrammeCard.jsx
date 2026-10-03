import { ArrowRight, GraduationCap, Layers, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/components-modern.css';

/** Summary card for a programme (title, level badge, module/unit counts, link). */
export default function ProgrammeCard({ programme }) {
  const awardPrefix = programme.title.replace(new RegExp(`\\s*${escapeRegExp(programme.short_title)}\\s*$`), '');
  return (
    <article className="pc">
      <div className="pc-media">
        {programme.hero_image ? (
          <img src={programme.hero_image} alt="" loading="lazy" width="480" height="300" />
        ) : (
          <span className="pc-placeholder" aria-hidden="true">
            <GraduationCap size={56} strokeWidth={1.5} />
          </span>
        )}
        <span className="pc-category">{programme.category}</span>
      </div>
      <div className="pc-body">
        <p className="pc-award">{awardPrefix || programme.award_label}</p>
        <h3 className="pc-title">
          <Link to={`/programmes/${programme.slug}`}>{programme.short_title}</Link>
        </h3>
        <div className="pc-badges">
          <span className="badge badge-gold">{programme.level_label}</span>
          {programme.accreditation_note ? (
            <span className="badge badge-outline">
              <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" /> {programme.accreditation_note}
            </span>
          ) : null}
        </div>
        <p className="pc-meta">
          <Layers size={18} strokeWidth={1.9} aria-hidden="true" /> {programme.module_count} modules ·{' '}
          {programme.unit_count} units
          {programme.elective_count ? ` · ${programme.elective_count} electives` : ''}
        </p>
        {programme.description ? <p className="pc-text">{programme.description}</p> : null}
        <Link
          to={`/programmes/${programme.slug}`}
          className="pc-link"
          aria-label={`Learn more about ${programme.title}`}
        >
          Learn more <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}