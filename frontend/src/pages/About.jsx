import { Building2, GraduationCap, Landmark, ShieldCheck, Target } from 'lucide-react';
import { getProgrammes } from '../api/public';
import ClassTimeBox from '../components/ClassTimeBox';
import EnrollCta from '../components/EnrollCta';
import Logo from '../components/Logo';
import PageHero from '../components/PageHero';
import PlaceholderNote from '../components/PlaceholderNote';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import { ErrorMessage, Loader } from '../components/Status';
import StudyAnywhereBadge from '../components/StudyAnywhereBadge';
import { useSiteInfo } from '../context/SiteInfoContext';
import useApi from '../hooks/useApi';
import '../styles/pages-modern.css';

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
      <section className="pm-section" aria-labelledby="mission-heading">
        <div className="container ab-grid">
          <Reveal variant="left">
            <p className="pm-eyebrow">
              <Target size={16} strokeWidth={2} aria-hidden="true" /> Our mission
            </p>
            <h2 id="mission-heading" className="pm-title pm-title-left">
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
          </Reveal>
          <Reveal variant="right" delay={150} className="ab-aside">
            <StudyAnywhereBadge />
            <ClassTimeBox />
          </Reveal>
        </div>
      </section>

      {/* Two institutions */}
      <section className="pm-section pm-section-tint" aria-labelledby="institutions-heading">
        <div className="container">
          <Reveal className="pm-head">
            <p className="pm-eyebrow">
              <Landmark size={16} strokeWidth={2} aria-hidden="true" /> Sister institutions
            </p>
            <h2 id="institutions-heading" className="pm-title">
              Manna College &amp; Manna Bible Institute
            </h2>
          </Reveal>
          <div className="ab-two">
            <Reveal as="article" className="ab-card">
              <span className="ab-card-icon" aria-hidden="true">
                <GraduationCap size={28} strokeWidth={1.8} />
              </span>
              <h3>Manna College</h3>
              {info ? (
                <p className="ab-card-link">
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
            </Reveal>
            <Reveal as="article" delay={120} className="ab-card">
              <span className="ab-card-icon" aria-hidden="true">
                <Building2 size={28} strokeWidth={1.8} />
              </span>
              <h3>Manna Bible Institute</h3>
              {info ? (
                <p className="ab-card-link">
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
            </Reveal>
          </div>
          <Reveal delay={150}>
            <PlaceholderNote>
              <p className="ab-relationship">
                Together, the two institutions run a shared Virtual Satellite Class so that students can study
                ministry, chaplaincy and counselling online, wherever they are.
              </p>
            </PlaceholderNote>
          </Reveal>
        </div>
      </section>

      {/* Emblem */}
      <section className="pm-section" aria-labelledby="emblem-heading">
        <div className="container ab-emblem">
          <Reveal variant="zoom" className="ab-emblem-logo">
            <Logo size={220} />
          </Reveal>
          <Reveal variant="right" delay={150}>
            <p className="pm-eyebrow">Our emblem</p>
            <h2 id="emblem-heading" className="pm-title pm-title-left">
              The Alpha and the Omega
            </h2>
            <p>
              Our emblem shows an open Bible bearing the Greek letters <strong lang="el">Α</strong> (Alpha) and{' '}
              <strong lang="el">Ω</strong> (Omega), the first and last letters of the Greek alphabet, framed by a gold
              laurel wreath.
            </p>
            <PlaceholderNote>
              <ul className="ab-emblem-list">
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
          </Reveal>
        </div>
      </section>

      {/* Accreditation */}
      <section className="pm-section pm-section-tint" aria-labelledby="accreditation-heading">
        <div className="container">
          <Reveal className="pm-head">
            <p className="pm-eyebrow">
              <ShieldCheck size={16} strokeWidth={2} aria-hidden="true" /> Accreditation
            </p>
            <h2 id="accreditation-heading" className="pm-title">
              We are TVET accredited
            </h2>
            <p className="pm-lead">
              Our Certificate and Diploma programmes are accredited under Kenya&apos;s Technical and Vocational
              Education and Training (TVET) system.
            </p>
          </Reveal>
          {programmes.loading ? <Loader label="Loading programmes…" /> : null}
          {programmes.error ? <ErrorMessage error={programmes.error} onRetry={programmes.reload} /> : null}
          {programmes.data ? (
            <ul className="ab-accr">
              {programmes.data.map((programme, index) => (
                <Reveal as="li" key={programme.slug} delay={index * 100}>
                  <span className="ab-accr-icon" aria-hidden="true">
                    <ShieldCheck size={22} strokeWidth={1.9} />
                  </span>
                  <span>
                    <strong>{programme.title}</strong> ({programme.level_label})
                    {programme.accreditation_note ? `: ${programme.accreditation_note}` : ''}
                  </span>
                </Reveal>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <Reveal variant="fade">
        <EnrollCta />
      </Reveal>
    </>
  );
}