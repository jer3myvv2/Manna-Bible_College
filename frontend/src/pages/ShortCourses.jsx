import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getElectives } from '../api/public';
import EnrollCta from '../components/EnrollCta';
import { SearchIcon, WhatsAppIcon } from '../components/Icons';
import PageHero from '../components/PageHero';
import Seo from '../components/Seo';
import { EmptyState, ErrorMessage, Loader } from '../components/Status';
import { useSiteInfo, whatsappLink } from '../context/SiteInfoContext';
import useApi from '../hooks/useApi';

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

      <section className="section" aria-labelledby="courses-heading">
        <div className="container">
          <div className="courses-toolbar">
            <h2 id="courses-heading" className="section-title section-title-sm">
              {data ? `${data.length} courses` : 'Courses'}
            </h2>
            <div className="search-box">
              <label htmlFor="course-search" className="sr-only">
                Search short courses
              </label>
              <SearchIcon size={20} />
              <input
                id="course-search"
                type="search"
                placeholder="Search courses, e.g. trauma"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          {loading ? <Loader label="Loading short courses…" /> : null}
          {error ? <ErrorMessage error={error} onRetry={reload} /> : null}
          {data && filtered.length === 0 ? (
            <EmptyState>No courses match “{query}”. Try another word.</EmptyState>
          ) : null}
          <p className="sr-only" aria-live="polite">
            {data ? `${filtered.length} courses shown` : ''}
          </p>

          {filtered.length ? (
            <ul className="course-grid" role="list">
              {filtered.map((course) => (
                <li key={course.id} className="course-card">
                  <span className="course-number" aria-hidden="true">
                    {String(course.number).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="course-name">{course.name}</h3>
                    {course.programme_title ? (
                      <p className="course-programme">
                        Elective in{' '}
                        <Link to={`/programmes/${course.programme_slug}`}>{course.programme_title}</Link>
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {info ? (
            <div className="note-box">
              <p>
                Interested in a short course? Contact us for the next intake and to find out how electives fit
                into your programme.
              </p>
              <div className="note-box-actions">
                <a
                  className="btn btn-whatsapp"
                  href={whatsappLink(info, 'Hello, I would like to know more about your short courses.')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon size={20} /> Ask on WhatsApp
                </a>
                <Link to="/contact" className="btn btn-outline">
                  Contact us
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <EnrollCta />
    </>
  );
}
