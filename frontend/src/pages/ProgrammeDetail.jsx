import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getProgramme } from '../api/public';
import ClassTimeBox from '../components/ClassTimeBox';
import EnrollCta from '../components/EnrollCta';
import { ShieldCheckIcon, WhatsAppIcon } from '../components/Icons';
import LevelProgression from '../components/LevelProgression';
import ModuleCard from '../components/ModuleCard';
import Seo from '../components/Seo';
import { ErrorMessage, Loader } from '../components/Status';
import StudyAnywhereBadge from '../components/StudyAnywhereBadge';
import { useSiteInfo, whatsappLink } from '../context/SiteInfoContext';
import useApi from '../hooks/useApi';
import NotFound from './NotFound';

/** Poster-style programme page with a level selector that highlights modules. */
export default function ProgrammeDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { info } = useSiteInfo();
  const { data: programme, loading, error, reload } = useApi(() => getProgramme(slug), [slug]);
  // A level can be pre-selected with ?level=5 (handy for sharing links).
  const [selectedLevel, setSelectedLevel] = useState(() => Number(searchParams.get('level')) || null);

  if (loading) {
    return (
      <div className="container section">
        <Loader label="Loading programme…" />
      </div>
    );
  }
  if (error?.status === 404) return <NotFound message="We could not find that programme." />;
  if (error) {
    return (
      <div className="container section">
        <ErrorMessage error={error} onRetry={reload} />
      </div>
    );
  }

  const level = programme.levels.find((item) => item.level_number === selectedLevel) || null;
  const activeLevel = level ? level.level_number : null;
  const awardPrefix = programme.title.endsWith(programme.short_title)
    ? programme.title.slice(0, -programme.short_title.length).trim()
    : programme.award_label;
  const applyUrl = `/apply?programme=${encodeURIComponent(programme.slug)}${activeLevel ? `&level=${activeLevel}` : ''}`;
  const chat = whatsappLink(info, `Hello, I would like to know more about the ${programme.title}.`);

  return (
    <>
      <Seo
        title={programme.title}
        description={`${programme.title} (${programme.level_label}) via our Virtual Satellite Class. ${programme.module_count} modules, ${programme.unit_count} units. ${programme.tagline || ''}`.trim()}
      />

      {/* Hero */}
      <section className="programme-hero">
        <div className="container programme-hero-inner">
          <div className="programme-hero-copy">
            <nav aria-label="Breadcrumb" className="breadcrumbs">
              <ol>
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/programmes">Programmes</Link>
                </li>
                <li aria-current="page">{programme.short_title}</li>
              </ol>
            </nav>
            <h1 className="programme-hero-title">
              <span className="programme-hero-award">{awardPrefix}</span>
              <span className="programme-hero-name">{programme.short_title}</span>
            </h1>
            <p className="programme-hero-level">
              {programme.level_label}
              {programme.accreditation_note ? (
                <span className="badge badge-on-dark">
                  <ShieldCheckIcon size={16} /> {programme.accreditation_note}
                </span>
              ) : null}
            </p>
            {programme.tagline ? <p className="programme-hero-tagline">{programme.tagline}</p> : null}
            <StudyAnywhereBadge />
            <div className="hero-actions">
              <Link to={applyUrl} className="btn btn-gold btn-lg">
                Apply for this programme
              </Link>
              {chat ? (
                <a className="btn btn-outline-light btn-lg" href={chat} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon size={20} /> Ask on WhatsApp
                </a>
              ) : null}
            </div>
          </div>
          {programme.hero_image ? (
            <div className="programme-hero-media">
              <img src={programme.hero_image} alt="" width="480" height="300" />
            </div>
          ) : null}
        </div>
      </section>

      {/* Level progression + class time */}
      <section className="section section-tight" aria-label="Levels and class time">
        <div className="container">
          {programme.description ? <p className="programme-description">{programme.description}</p> : null}
          <div className="info-pair">
            <LevelProgression
              levels={programme.levels}
              selectedLevel={activeLevel}
              onSelect={setSelectedLevel}
            />
            <ClassTimeBox />
          </div>
        </div>
      </section>

      {/* Structure & units */}
      <section className="section section-tight" aria-labelledby="structure-heading">
        <div className="container">
          <h2 id="structure-heading" className="heading-bar">
            Our Programme Structure &amp; Units
          </h2>

          <div className="level-selector" role="group" aria-label="Show the modules included in a level">
            <span className="level-selector-label">Show modules for:</span>
            {programme.levels.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`chip ${activeLevel === item.level_number ? 'is-active' : ''}`}
                aria-pressed={activeLevel === item.level_number}
                onClick={() => setSelectedLevel(item.level_number)}
              >
                Level {item.level_number} <span className="chip-sub">{item.award}</span>
              </button>
            ))}
            <button
              type="button"
              className={`chip ${activeLevel === null ? 'is-active' : ''}`}
              aria-pressed={activeLevel === null}
              onClick={() => setSelectedLevel(null)}
            >
              All modules
            </button>
          </div>
          <p className="level-selector-status" aria-live="polite">
            {level
              ? `Level ${level.level_number} (${level.award}) requires Module ${level.modules_required}.`
              : `Showing all ${programme.module_count} modules and ${programme.unit_count} units.`}
          </p>

          <div className="module-grid">
            {programme.modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                included={level ? module.number <= level.max_module : null}
                levelNumber={level?.level_number}
              />
            ))}
          </div>

          <div className="center-actions">
            <Link to={applyUrl} className="btn btn-maroon btn-lg">
              Apply for this programme{level ? ` (Level ${level.level_number})` : ''}
            </Link>
          </div>
        </div>
      </section>

      {/* Electives (Chaplaincy) */}
      {programme.electives.length ? (
        <section className="section section-alt" aria-labelledby="electives-heading">
          <div className="container">
            <h2 id="electives-heading" className="heading-bar">
              {programme.short_title} Electives / Short Courses
            </h2>
            <ol className="electives-list" role="list">
              {programme.electives.map((elective) => (
                <li key={elective.id}>{elective.name}</li>
              ))}
            </ol>
            <p className="center-actions">
              <Link to="/short-courses" className="btn btn-outline">
                Browse all short courses
              </Link>
            </p>
          </div>
        </section>
      ) : null}

      <EnrollCta title={`Enroll in ${programme.short_title}`} applyTo={applyUrl} applyLabel="Apply now" />
    </>
  );
}
