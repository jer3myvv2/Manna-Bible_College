import { Link } from 'react-router-dom';
import { ArrowRightIcon, LayersIcon, ShieldCheckIcon } from './Icons';

/** Summary card for a programme (title, level badge, module/unit counts, link). */
export default function ProgrammeCard({ programme }) {
  const awardPrefix = programme.title.replace(new RegExp(`\\s*${escapeRegExp(programme.short_title)}\\s*$`), '');
  return (
    <article className="programme-card">
      <div className="programme-card-media">
        {programme.hero_image ? (
          <img src={programme.hero_image} alt="" loading="lazy" width="480" height="300" />
        ) : null}
        <span className="programme-card-category">{programme.category}</span>
      </div>
      <div className="programme-card-body">
        <p className="programme-card-award">{awardPrefix || programme.award_label}</p>
        <h3 className="programme-card-title">
          <Link to={`/programmes/${programme.slug}`}>{programme.short_title}</Link>
        </h3>
        <div className="programme-card-badges">
          <span className="badge badge-gold">{programme.level_label}</span>
          {programme.accreditation_note ? (
            <span className="badge badge-outline">
              <ShieldCheckIcon size={14} /> {programme.accreditation_note}
            </span>
          ) : null}
        </div>
        <p className="programme-card-meta">
          <LayersIcon size={18} /> {programme.module_count} modules · {programme.unit_count} units
          {programme.elective_count ? ` · ${programme.elective_count} electives` : ''}
        </p>
        {programme.description ? <p className="programme-card-text">{programme.description}</p> : null}
        <Link
          to={`/programmes/${programme.slug}`}
          className="programme-card-link"
          aria-label={`Learn more about ${programme.title}`}
        >
          Learn more <ArrowRightIcon size={18} />
        </Link>
      </div>
    </article>
  );
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
