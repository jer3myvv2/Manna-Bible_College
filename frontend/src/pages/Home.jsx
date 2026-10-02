import { Link } from 'react-router-dom';
import { getAnnouncements, getLevels, getProgrammes } from '../api/public';
import ClassTimeBox from '../components/ClassTimeBox';
import EnrollCta from '../components/EnrollCta';
import {
  AwardIcon,
  CalendarIcon,
  LaptopIcon,
  MegaphoneIcon,
  MoonIcon,
  ShieldCheckIcon,
  UsersIcon,
  WifiIcon,
} from '../components/Icons';
import LevelProgression from '../components/LevelProgression';
import ProgrammeCard from '../components/ProgrammeCard';
import Seo from '../components/Seo';
import { EmptyState, ErrorMessage, Loader } from '../components/Status';
import StudyAnywhereBadge from '../components/StudyAnywhereBadge';
import { useSiteInfo } from '../context/SiteInfoContext';
import useApi from '../hooks/useApi';
import { formatDate, joinList } from '../utils/format';

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
      <section className="hero" aria-labelledby="hero-heading">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1 id="hero-heading" className="hero-heading">
              <span className="hero-kicker">Advance Your Calling with Our</span>
              <span className="hero-virtual">VIRTUAL</span>
              <span className="hero-satellite">SATELLITE CLASS</span>
            </h1>
            {programmeNames ? (
              <p className="hero-subtitle">
                {awardLabel} in <strong>{programmeNames}</strong>
                {levelLabel ? <span className="hero-levels"> ({levelLabel})</span> : null}
              </p>
            ) : null}
            {info ? <p className="hero-tagline">{info.taglines.theology}</p> : null}
            <StudyAnywhereBadge className="hero-badge" />
            <div className="hero-actions hero-actions-split">
              <Link to="/apply" className="btn btn-gold btn-lg">
                Enroll Today
              </Link>
              <Link to="/programmes" className="btn btn-outline-light btn-lg">
                View Programmes
              </Link>
            </div>
          </div>
          <div className="hero-media">
            <div className="hero-arch">
              <img
                src="/images/hero-african-student-studying-on-laptop.jpg"
                alt="A smiling student studying online on a laptop"
                width="900"
                height="964"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Highlight strip */}
      <section className="highlights" aria-label="Highlights">
        <div className="container highlights-grid">
          <div className="highlight-card">
            <ShieldCheckIcon size={34} />
            <div>
              <h2>TVET Accredited</h2>
              <p>Recognised Certificate and Diploma awards.</p>
            </div>
          </div>
          <div className="highlight-card">
            <WifiIcon size={34} />
            <div>
              <h2>100% Online</h2>
              <p>Study from any location on your laptop, tablet or smartphone.</p>
            </div>
          </div>
          <div className="highlight-card">
            <MoonIcon size={34} />
            <div>
              <h2>Evening Classes</h2>
              <p>
                {info
                  ? `${info.class_time.start} – ${info.class_time.end} ${info.class_time.timezone_short}`
                  : 'Live evening classes'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programmes */}
      <section className="section" aria-labelledby="programmes-heading">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Our programmes</p>
            <h2 id="programmes-heading" className="section-title">
              Certificate &amp; Diploma Programmes
            </h2>
            <p className="section-lead">
              {awardLabel ? `${awardLabel} programmes, ${levelLabel}. ` : ''}
              Open a programme to see every module and unit.
            </p>
          </div>
          {programmes.loading ? <Loader label="Loading programmes…" /> : null}
          {programmes.error ? <ErrorMessage error={programmes.error} onRetry={programmes.reload} /> : null}
          {programmes.data && programmes.data.length === 0 ? (
            <EmptyState>No programmes are open for enrolment right now.</EmptyState>
          ) : null}
          {programmes.data?.length ? (
            <div className="programme-grid">
              {programmes.data.map((programme) => (
                <ProgrammeCard key={programme.slug} programme={programme} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Level progression */}
      <section className="section section-alt" aria-labelledby="levels-heading">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">How you progress</p>
            <h2 id="levels-heading" className="section-title">
              Level Progression
            </h2>
            <p className="section-lead">The same clear path applies to every programme.</p>
          </div>
          {levels.loading ? <Loader label="Loading levels…" /> : null}
          {levels.error ? <ErrorMessage error={levels.error} onRetry={levels.reload} /> : null}
          {levels.data ? (
            <div className="info-pair">
              <LevelProgression levels={levels.data} />
              <ClassTimeBox />
            </div>
          ) : null}
        </div>
      </section>

      {/* Why study with us */}
      <section className="section" aria-labelledby="why-heading">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Why study with us</p>
            <h2 id="why-heading" className="section-title">
              Quality education that fits your life
            </h2>
          </div>
          <div className="feature-grid">
            <article className="feature">
              <span className="feature-icon" aria-hidden="true">
                <CalendarIcon size={30} />
              </span>
              <h3>Flexible schedule</h3>
              <p>
                Live classes run in the evening
                {info ? ` (${info.class_time.display} ${info.class_time.timezone_short})` : ''}, so you can keep
                working and serving while you study.
              </p>
            </article>
            <article className="feature">
              <span className="feature-icon" aria-hidden="true">
                <LaptopIcon size={30} />
              </span>
              <h3>Study from anywhere</h3>
              <p>Join from home, church or work on your laptop, tablet or smartphone. All you need is internet.</p>
            </article>
            <article className="feature">
              <span className="feature-icon" aria-hidden="true">
                <AwardIcon size={30} />
              </span>
              <h3>Accredited certificates</h3>
              <p>We are TVET accredited, so your Certificate and Diploma awards are recognised.</p>
            </article>
            <article className="feature">
              <span className="feature-icon" aria-hidden="true">
                <UsersIcon size={30} />
              </span>
              <h3>Equipping leaders</h3>
              <p>
                Practical training that equips leaders for ministry, chaplaincy and counselling, transforming
                lives in the church and the community.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section className="section section-alt" aria-labelledby="news-heading">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">News &amp; intakes</p>
            <h2 id="news-heading" className="section-title">
              Announcements
            </h2>
          </div>
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
            <div className="announcement-list">
              {announcements.data.map((item) => (
                <article key={item.id} className="announcement">
                  <span className="announcement-icon" aria-hidden="true">
                    <MegaphoneIcon size={26} />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p className="announcement-date">
                      <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                    </p>
                    <p className="announcement-body">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <EnrollCta />
    </>
  );
}
