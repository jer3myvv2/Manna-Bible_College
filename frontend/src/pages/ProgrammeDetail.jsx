import { ArrowRight, BookOpen, ChevronRight, Layers, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getProgramme } from '../api/public';
import ClassTimeBox from '../components/ClassTimeBox';
import EnrollCta from '../components/EnrollCta';
import { WhatsAppIcon } from '../components/Icons';
import LevelProgression from '../components/LevelProgression';
import ModuleCard from '../components/ModuleCard';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import { ErrorMessage, Loader } from '../components/Status';
import StudyAnywhereBadge from '../components/StudyAnywhereBadge';
import { useSiteInfo, whatsappLink } from '../context/SiteInfoContext';
import useApi from '../hooks/useApi';
import '../styles/programmes.css';
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
            <Reveal as="nav" aria-label="Breadcrumb" className="breadcrumbs">
              <ol className="pd-crumbs">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <ChevronRight size={14} aria-hidden="true" />
                  <Link to="/programmes">Programmes</Link>
                </li>
                <li aria-current="page">
                  <ChevronRight size={14} aria-hidden="true" />
                  {programme.short_title}
                </li>
              </ol>
            </Reveal>
            <Reveal as="h1" delay={100} className="programme-hero-title">
              <span className="programme-hero-award">{awardPrefix}</span>
              <span className="programme-hero-name">{programme.short_title}</span>
            </Reveal>
            <Reveal as="p" delay={180} className="programme-hero-level">
              {programme.level_label}
              {programme.accreditation_note ? (
                <span className="badge badge-on-dark">
                  <ShieldCheck size={16} strokeWidth={2} aria-hidden="true" /> {programme.accreditation_note}
                </span>
              ) : null}
            </Reveal>
            {programme.tagline ? (
              <Reveal as="p" delay={260} className="programme-hero-tagline">
                {programme.tagline}
              </Reveal>
            ) : null}
            <Reveal delay={340} className="pd-badge">
              <StudyAnywhereBadge />
            </Reveal>
            <Reveal delay={420} className="pd-hero-actions">
              <Link to={applyUrl} className="btn btn-gold btn-lg">
                Apply for this programme
                <ArrowRight size={20} strokeWidth={2.2} aria-hidden="true" />
              </Link>
              {chat ? (
                <a className="btn btn-outline-light btn-lg" href={chat} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon size={20} /> Ask on WhatsApp
                </a>
              ) : null}
            </Reveal>
          </div>
          {programme.hero_image ? (
            <Reveal variant="zoom" delay={200} className="programme-hero-media">
              <img src={programme.hero_image} alt="" width="480" height="300" />
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* Level progression + class time */}
      <section className="section section-tight" aria-label="Levels and class time">
        <div className="container">
          {programme.description ? (
            <Reveal as="p" className="programme-description">
              {programme.description}
            </Reveal>
          ) : null}
          <div className="pd-pair">
            <Reveal variant="left">
              <LevelProgression
                levels={programme.levels}
                selectedLevel={activeLevel}
                onSelect={setSelectedLevel}
              />
            </Reveal>
            <Reveal variant="right" delay={150}>
              <ClassTimeBox />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Structure & units */}
      <section className="section section-tight" aria-labelledby="structure-heading">
        <div className="container">
          <Reveal as="h2" id="structure-heading" className="pd-heading">
            <span className="pd-heading-icon" aria-hidden="true">
              <Layers size={24} strokeWidth={1.9} />
            </span>
            Our Programme Structure &amp; Units
          </Reveal>

          <Reveal className="level-selector" role="group" aria-label="Show the modules included in a level">
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
          </Reveal>
          <p className="level-selector-status" aria-live="polite">
            {level
              ? `Level ${level.level_number} (${level.award}) requires Module ${level.modules_required}.`
              : `Showing all ${programme.module_count} modules and ${programme.unit_count} units.`}
          </p>

          <div className="module-grid">
            {programme.modules.map((module, index) => (
              <Reveal key={module.id} delay={(index % 3) * 100} className="pd-module">
                <ModuleCard
                  module={module}
                  included={level ? module.number <= level.max_module : null}
                  levelNumber={level?.level_number}
                />
              </Reveal>
            ))}
          </div>

          <div className="center-actions">
            <Link to={applyUrl} className="btn btn-maroon btn-lg">
              Apply for this programme{level ? ` (Level ${level.level_number})` : ''}
              <ArrowRight size={20} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Electives (Chaplaincy) */}
      {programme.electives.length ? (
        <section className="section section-alt" aria-labelledby="electives-heading">
          <div className="container">
            <Reveal as="h2" id="electives-heading" className="pd-heading">
              <span className="pd-heading-icon" aria-hidden="true">
                <BookOpen size={24} strokeWidth={1.9} />
              </span>
              {programme.short_title} Electives / Short Courses
            </Reveal>
            <ol className="pd-electives" role="list">
              {programme.electives.map((elective, index) => (
                <Reveal as="li" key={elective.id} delay={(index % 4) * 70}>
                  {elective.name}
                </Reveal>
              ))}
            </ol>
            <p className="center-actions">
              <Link to="/short-courses" className="btn btn-outline">
                Browse all short courses
                <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
              </Link>
            </p>
          </div>
        </section>
      ) : null}

      <EnrollCta title={`Enroll in ${programme.short_title}`} applyTo={applyUrl} applyLabel="Apply now" />
    </>
  );
}