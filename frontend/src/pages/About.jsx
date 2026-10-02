import { getProgrammes } from '../api/public';
import ClassTimeBox from '../components/ClassTimeBox';
import EnrollCta from '../components/EnrollCta';
import { ShieldCheckIcon } from '../components/Icons';
import Logo from '../components/Logo';
import PageHero from '../components/PageHero';
import PlaceholderNote from '../components/PlaceholderNote';
import Seo from '../components/Seo';
import { ErrorMessage, Loader } from '../components/Status';
import StudyAnywhereBadge from '../components/StudyAnywhereBadge';
import { useSiteInfo } from '../context/SiteInfoContext';
import useApi from '../hooks/useApi';

/**
 * About page. Text wrapped in <PlaceholderNote> was not supplied by the school
 * and should be reviewed / replaced before launch.
 */
export default function About() {
  const { info } = useSiteInfo();
  const programmes = useApi(() => getProgrammes(), []);

  return (
    <>
      <Seo
        title="About Us"
        description="Manna College and Manna Bible Institute: quality theological education, equipping leaders and transforming lives through our TVET accredited Virtual Satellite Class."
      />
      <PageHero
        eyebrow="About us"
        title="Equipping Leaders. Transforming Lives."
        lead={info?.taglines.theology}
      />

      {/* Mission */}
      <section className="section" aria-labelledby="mission-heading">
        <div className="container about-grid">
          <div>
            <p className="eyebrow">Our mission</p>
            <h2 id="mission-heading" className="section-title">
              {info?.taglines.mission || 'Equipping Leaders. Transforming Lives.'}
            </h2>
            <PlaceholderNote>
              <p>
                Our mission is to provide quality theological and professional education that equips men and women
                for faithful service in the church, the workplace and the community. Through our Virtual Satellite
                Class, students anywhere can grow in knowledge, character and practical skill without leaving their
                families, jobs or ministries.
              </p>
            </PlaceholderNote>
          </div>
          <div className="about-aside">
            <StudyAnywhereBadge />
            <ClassTimeBox />
          </div>
        </div>
      </section>

      {/* Two institutions */}
      <section className="section section-alt" aria-labelledby="institutions-heading">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Sister institutions</p>
            <h2 id="institutions-heading" className="section-title">
              Manna College &amp; Manna Bible Institute
            </h2>
          </div>
          <div className="two-col">
            <article className="info-card">
              <h3>Manna College</h3>
              {info ? (
                <p className="info-card-link">
                  <a href={info.websites[0]?.url} target="_blank" rel="noopener noreferrer">
                    {info.websites[0]?.label}
                  </a>
                </p>
              ) : null}
              <PlaceholderNote>
                <p>
                  Manna College offers TVET accredited Certificate and Diploma programmes that combine sound
                  academic content with practical, career-focused training.
                </p>
              </PlaceholderNote>
            </article>
            <article className="info-card">
              <h3>Manna Bible Institute</h3>
              {info ? (
                <p className="info-card-link">
                  <a href={info.websites[1]?.url} target="_blank" rel="noopener noreferrer">
                    {info.websites[1]?.label}
                  </a>
                </p>
              ) : null}
              <PlaceholderNote>
                <p>
                  Manna Bible Institute is the sister institution of Manna College, focused on theological education
                  and ministry training rooted in the Word of God.
                </p>
              </PlaceholderNote>
            </article>
          </div>
          <PlaceholderNote>
            <p className="about-relationship">
              Together, the two institutions run a shared Virtual Satellite Class so that students can study
              ministry, chaplaincy and counselling online, wherever they are.
            </p>
          </PlaceholderNote>
        </div>
      </section>

      {/* Emblem */}
      <section className="section" aria-labelledby="emblem-heading">
        <div className="container emblem">
          <div className="emblem-logo">
            <Logo size={220} />
          </div>
          <div>
            <p className="eyebrow">Our emblem</p>
            <h2 id="emblem-heading" className="section-title">
              The Alpha and the Omega
            </h2>
            <p>
              Our emblem shows an open Bible bearing the Greek letters <strong lang="el">Α</strong> (Alpha) and{' '}
              <strong lang="el">Ω</strong> (Omega), the first and last letters of the Greek alphabet, framed by a gold
              laurel wreath.
            </p>
            <PlaceholderNote>
              <ul className="emblem-list">
                <li>
                  <strong>The open Bible</strong>: the Word of God at the centre of all we teach.
                </li>
                <li>
                  <strong>Alpha and Omega</strong>: “I am the Alpha and the Omega, the First and the Last, the
                  Beginning and the End” (Revelation 22:13). Christ is the beginning and the goal of our learning.
                </li>
                <li>
                  <strong>The laurel wreath</strong>: excellence, achievement and the reward of faithful service.
                </li>
              </ul>
            </PlaceholderNote>
          </div>
        </div>
      </section>

      {/* Accreditation */}
      <section className="section section-alt" aria-labelledby="accreditation-heading">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Accreditation</p>
            <h2 id="accreditation-heading" className="section-title">
              We are TVET accredited
            </h2>
            <p className="section-lead">
              Our Certificate and Diploma programmes are accredited under Kenya&apos;s Technical and Vocational
              Education and Training (TVET) system.
            </p>
          </div>
          {programmes.loading ? <Loader label="Loading programmes…" /> : null}
          {programmes.error ? <ErrorMessage error={programmes.error} onRetry={programmes.reload} /> : null}
          {programmes.data ? (
            <ul className="accreditation-list">
              {programmes.data.map((programme) => (
                <li key={programme.slug}>
                  <ShieldCheckIcon size={22} />
                  <span>
                    <strong>{programme.title}</strong> ({programme.level_label})
                    {programme.accreditation_note ? `: ${programme.accreditation_note}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <EnrollCta />
    </>
  );
}
