import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getElectives } from '../api/public';
import EnrollCta from '../components/EnrollCta';
import { WhatsAppIcon } from '../components/Icons';
import PageHero from '../components/PageHero';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import { EmptyState, ErrorMessage, Loader } from '../components/Status';
import { useSiteInfo, whatsappLink } from '../context/SiteInfoContext';
import useApi from '../hooks/useApi';
import '../styles/pages-modern.css';

/** Searchable grid of the elective / short courses. */
export default function ShortCourses() {
  const { info } = useSiteInfo();
  const { data, loading, error, reload } = useApi(() => getElectives(), []);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (data || [])
      .map((course, index) => ({ ...course, number: index + 1 }))
      .filter((course) => !term || course.name.toLowerCase().includes(term));
  }, [data, query]);

  return (
    <>
      <Seo
        title="Short Courses"
        description="Elective and short courses you can study online with Manna College & Manna Bible Institute."
      />
      <PageHero
        eyebrow="Electives"
        title="Short Courses"
        lead="Electives that deepen your skills in care, counselling and community service."
      />

      <section className="pm-section" aria-labelledby="courses-heading">
        <div className="container">
          <Reveal className="sc-toolbar">
            <h2 id="courses-heading" className="pm-title pm-title-left pm-title-sm">
              {data ? `${data.length} courses` : 'Courses'}
            </h2>
            <div className="sc-search">
              <label htmlFor="course-search" className="sr-only">
                Search short courses
              </label>
              <Search size={20} strokeWidth={2} aria-hidden="true" />
              <input
                id="course-search"
                type="search"
                placeholder="Search courses, e.g. trauma"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </Reveal>

          {loading ? <Loader label="Loading short courses…" /> : null}
          {error ? <ErrorMessage error={error} onRetry={reload} /> : null}
          {data && filtered.length === 0 ? (
            <EmptyState>No courses match “{query}”. Try another word.</EmptyState>
          ) : null}
          <p className="sr-only" aria-live="polite">
            {data ? `${filtered.length} courses shown` : ''}
          </p>

          {filtered.length ? (
            <ul className="sc-grid" role="list">
              {filtered.map((course, index) => (
                // only the first screenful staggers; later cards reveal on scroll
                <Reveal as="li" key={course.id} delay={(index % 6) * 60} className="sc-card">
                  <span className="sc-number" aria-hidden="true">
                    {String(course.number).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="sc-name">{course.name}</h3>
                    {course.programme_title ? (
                      <p className="sc-programme">
                        Elective in{' '}
                        <Link to={`/programmes/${course.programme_slug}`}>{course.programme_title}</Link>
                      </p>
                    ) : null}
                  </div>
                </Reveal>
              ))}
            </ul>
          ) : null}

          {info ? (
            <Reveal className="sc-note">
              <p>
                Interested in a short course? Contact us for the next intake and to find out how electives fit
                into your programme.
              </p>
              <div className="sc-note-actions">
                <a
                  className="btn btn-whatsapp"
                  href={whatsappLink(info, 'Hello, I would like to know more about your short courses.')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon size={20} /> Ask on WhatsApp
                </a>
                <Link to="/contact" className="btn btn-outline-light">
                  Contact us
                </Link>
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>

      <Reveal variant="fade">
        <EnrollCta />
      </Reveal>
    </>
  );
}