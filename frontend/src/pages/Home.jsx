import {
  ArrowRight,
  Award,
  CalendarClock,
  GraduationCap,
  Laptop,
  Megaphone,
  Moon,
  ShieldCheck,
  Sparkles,
  Users,
  Wifi,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAnnouncements, getLevels, getProgrammes } from '../api/public';
import ClassTimeBox from '../components/ClassTimeBox';
import EnrollCta from '../components/EnrollCta';
import LevelProgression from '../components/LevelProgression';
import ProgrammeCard from '../components/ProgrammeCard';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import { EmptyState, ErrorMessage, Loader } from '../components/Status';
import StudyAnywhereBadge from '../components/StudyAnywhereBadge';
import { useSiteInfo } from '../context/SiteInfoContext';
import useApi from '../hooks/useApi';
import { formatDate, joinList } from '../utils/format';
import '../styles/home.css';

const ICON = { strokeWidth: 1.9, 'aria-hidden': true };

export default function Home() {
  const { info } = useSiteInfo();
  const programmes = useApi(() => getProgrammes(), []);
  const levels = useApi(getLevels, []);
  const announcements = useApi(getAnnouncements, []);

  const programmeNames = joinList((programmes.data || []).map((programme) => programme.short_title));
  const awardLabel = programmes.data?.[0]?.award_label;
  const levelLabel = programmes.data?.[0]?.level_label;

  return (
    <>
      <Seo
        description="Advance your calling with the Manna College & Manna Bible Institute Virtual Satellite Class: TVET accredited Certificate and Diploma programmes you can study online from anywhere."
      />

      {/* Hero */}
      <section className="hm-hero" aria-labelledby="hero-heading">
        <div className="container hm-hero-inner">
          <div className="hm-hero-copy">
            <h1 id="hero-heading" className="hm-hero-heading">
              <Reveal as="span" variant="up" className="hm-kicker">
                <Sparkles size={16} {...ICON} />
                Advance Your Calling with Our
              </Reveal>
              <Reveal as="span" variant="up" delay={100} className="hm-virtual">
                VIRTUAL
              </Reveal>
              <Reveal as="span" variant="up" delay={200} className="hm-satellite">
                SATELLITE CLASS
              </Reveal>
            </h1>
            {programmeNames ? (
              <Reveal as="p" delay={300} className="hm-hero-subtitle">
                {awardLabel} in <strong>{programmeNames}</strong>
                {levelLabel ? <span className="hm-hero-levels"> ({levelLabel})</span> : null}
              </Reveal>
            ) : null}
            {info ? (
              <Reveal as="p" delay={380} className="hm-hero-tagline">
                {info.taglines.theology}
              </Reveal>
            ) : null}
            <Reveal delay={450} className="hm-badge-wrap">
              <StudyAnywhereBadge />
            </Reveal>
            <Reveal delay={520} className="hm-hero-actions">
              <Link to="/apply" className="btn btn-gold btn-lg hm-btn">
                Enroll Today
                <ArrowRight size={20} {...ICON} />
              </Link>
              <Link to="/programmes" className="btn btn-outline-light btn-lg hm-btn">
                View Programmes
              </Link>
            </Reveal>
          </div>

          <Reveal variant="zoom" delay={250} className="hm-hero-media">
            <div className="hm-hero-frame">
              <img
                src="/images/hero-african-student-studying-on-laptop.jpg"
                alt="A smiling student studying online on a laptop"
                width="900"
                height="964"
              />
            </div>
            <span className="hm-float hm-float-a">
              <ShieldCheck size={18} {...ICON} /> TVET Accredited
            </span>
            <span className="hm-float hm-float-b">
              <Wifi size={18} {...ICON} /> 100% Online
            </span>
          </Reveal>
        </div>
      </section>

      {/* Highlight strip */}
      <section className="hm-highlights" aria-label="Highlights">
        <div className="container hm-highlights-grid">
          <Reveal className="hm-highlight">
            <span className="hm-icon-tile">
              <ShieldCheck size={28} {...ICON} />
            </span>
            <div>
              <h2>TVET Accredited</h2>
              <p>Recognised Certificate and Diploma awards.</p>
            </div>
          </Reveal>
          <Reveal delay={120} className="hm-highlight">
            <span className="hm-icon-tile">
              <Wifi size={28} {...ICON} />
            </span>
            <div>
              <h2>100% Online</h2>
              <p>Study from any location on your laptop, tablet or smartphone.</p>
            </div>
          </Reveal>
          <Reveal delay={240} className="hm-highlight">
            <span className="hm-icon-tile">
              <Moon size={28} {...ICON} />
            </span>
            <div>
              <h2>Evening Classes</h2>
              <p>
                {info
                  ? `${info.class_time.start} – ${info.class_time.end} ${info.class_time.timezone_short}`
                  : 'Live evening classes'}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Programmes */}
      <section className="hm-section" aria-labelledby="programmes-heading">
        <div className="container">
          <Reveal className="hm-head">
            <p className="hm-eyebrow">
              <GraduationCap size={16} {...ICON} /> Our programmes
            </p>
            <h2 id="programmes-heading" className="hm-title">
              Certificate &amp; Diploma Programmes
            </h2>
            <p className="hm-lead">
              {awardLabel ? `${awardLabel} programmes, ${levelLabel}. ` : ''}
              Open a programme to see every module and unit.
            </p>
          </Reveal>
          {programmes.loading ? <Loader label="Loading programmes…" /> : null}
          {programmes.error ? <ErrorMessage error={programmes.error} onRetry={programmes.reload} /> : null}
          {programmes.data && programmes.data.length === 0 ? (
            <EmptyState>No programmes are open for enrolment right now.</EmptyState>
          ) : null}
          {programmes.data?.length ? (
            <div className="hm-programme-grid">
              {programmes.data.map((programme, index) => (
                <Reveal key={programme.slug} delay={index * 120} className="hm-stretch">
                  <ProgrammeCard programme={programme} />
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Level progression */}
      <section className="hm-section hm-section-tint" aria-labelledby="levels-heading">
        <div className="container">
          <Reveal className="hm-head">
            <p className="hm-eyebrow">
              <Award size={16} {...ICON} /> How you progress
            </p>
            <h2 id="levels-heading" className="hm-title">
              Level Progression
            </h2>
            <p className="hm-lead">The same clear path applies to every programme.</p>
          </Reveal>
          {levels.loading ? <Loader label="Loading levels…" /> : null}
          {levels.error ? <ErrorMessage error={levels.error} onRetry={levels.reload} /> : null}
          {levels.data ? (
            <div className="info-pair hm-info-pair">
              <Reveal variant="left">
                <LevelProgression levels={levels.data} />
              </Reveal>
              <Reveal variant="right" delay={150}>
                <ClassTimeBox />
              </Reveal>
            </div>
          ) : null}
        </div>
      </section>

      {/* Why study with us */}
      <section className="hm-section" aria-labelledby="why-heading">
        <div className="container">
          <Reveal className="hm-head">
            <p className="hm-eyebrow">
              <Sparkles size={16} {...ICON} /> Why study with us
            </p>
            <h2 id="why-heading" className="hm-title">
              Quality education that fits your life
            </h2>
          </Reveal>
          <div className="hm-feature-grid">
            <Reveal as="article" delay={0} className="hm-feature">
              <span className="hm-feature-icon">
                <CalendarClock size={28} {...ICON} />
              </span>
              <h3>Flexible schedule</h3>
              <p>
                Live classes run in the evening
                {info ? ` (${info.class_time.display} ${info.class_time.timezone_short})` : ''}, so you can keep
                working and serving while you study.
              </p>
            </Reveal>
            <Reveal as="article" delay={100} className="hm-feature">
              <span className="hm-feature-icon">
                <Laptop size={28} {...ICON} />
              </span>
              <h3>Study from anywhere</h3>
              <p>Join from home, church or work on your laptop, tablet or smartphone. All you need is internet.</p>
            </Reveal>
            <Reveal as="article" delay={200} className="hm-feature">
              <span className="hm-feature-icon">
                <Award size={28} {...ICON} />
              </span>
              <h3>Accredited certificates</h3>
              <p>We are TVET accredited, so your Certificate and Diploma awards are recognised.</p>
            </Reveal>
            <Reveal as="article" delay={300} className="hm-feature">
              <span className="hm-feature-icon">
                <Users size={28} {...ICON} />
              </span>
              <h3>Equipping leaders</h3>
              <p>
                Practical training that equips leaders for ministry, chaplaincy and counselling, transforming
                lives in the church and the community.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section className="hm-section hm-section-tint" aria-labelledby="news-heading">
        <div className="container">
          <Reveal className="hm-head">
            <p className="hm-eyebrow">
              <Megaphone size={16} {...ICON} /> News &amp; intakes
            </p>
            <h2 id="news-heading" className="hm-title">
              Announcements
            </h2>
          </Reveal>
          {announcements.loading ? <Loader label="Loading announcements…" /> : null}
          {announcements.error ? (
            <ErrorMessage error={announcements.error} onRetry={announcements.reload} />
          ) : null}
          {announcements.data && announcements.data.length === 0 ? (
            <EmptyState>
              There are no announcements right now. Contact us for the next intake date.
            </EmptyState>
          ) : null}
          {announcements.data?.length ? (
            <div className="hm-news-grid">
              {announcements.data.map((item, index) => (
                <Reveal as="article" key={item.id} delay={(index % 3) * 100} className="hm-news">
                  <span className="hm-news-icon">
                    <Megaphone size={24} {...ICON} />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p className="hm-news-date">
                      <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                    </p>
                    <p className="hm-news-body">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <Reveal variant="fade">
        <EnrollCta />
      </Reveal>
    </>
  );
}