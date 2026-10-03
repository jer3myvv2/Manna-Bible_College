import { BookOpen, Brain, GraduationCap, LayoutGrid } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getProgrammes } from '../api/public';
import EnrollCta from '../components/EnrollCta';
import PageHero from '../components/PageHero';
import ProgrammeCard from '../components/ProgrammeCard';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import { EmptyState, ErrorMessage, Loader } from '../components/Status';
import useApi from '../hooks/useApi';
import { joinList, sameText } from '../utils/format';
import '../styles/programmes.css';

const CATEGORY_ICONS = { theology: BookOpen, psychology: Brain };
const categoryIcon = (name) => CATEGORY_ICONS[String(name).toLowerCase()] || GraduationCap;

/** All programmes, filterable by category (?category=Theology). */
export default function Programmes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const { data, loading, error, reload } = useApi(() => getProgrammes(), []);

  const categories = [...new Set((data || []).map((programme) => programme.category))];
  const visible = (data || []).filter((programme) => !category || sameText(programme.category, category));

  const description = data?.length
    ? `Online ${data[0].award_label} programmes (${data[0].level_label}) in ${joinList(data.map((p) => p.short_title))}.`
    : 'Online Certificate and Diploma programmes from Manna College & Manna Bible Institute.';

  const chooseCategory = (value) => {
    if (value) setSearchParams({ category: value });
    else setSearchParams({});
  };

  return (
    <>
      <Seo title="Programmes" description={description} />
      <PageHero
        eyebrow="Virtual Satellite Class"
        title="Our Programmes"
        lead="TVET accredited Certificate and Diploma programmes, studied fully online from any location."
      />

      <section className="pg-section" aria-labelledby="programme-list-heading">
        <div className="container">
          <h2 id="programme-list-heading" className="sr-only">
            Programme list
          </h2>
          {categories.length > 1 ? (
            <Reveal className="pg-filter" role="group" aria-label="Filter programmes by category">
              <button
                type="button"
                className={`chip ${!category ? 'is-active' : ''}`}
                aria-pressed={!category}
                onClick={() => chooseCategory('')}
              >
                <LayoutGrid size={18} strokeWidth={2} aria-hidden="true" />
                All programmes
              </button>
              {categories.map((name) => {
                const Icon = categoryIcon(name);
                return (
                  <button
                    key={name}
                    type="button"
                    className={`chip ${sameText(name, category) ? 'is-active' : ''}`}
                    aria-pressed={sameText(name, category)}
                    onClick={() => chooseCategory(name)}
                  >
                    <Icon size={18} strokeWidth={2} aria-hidden="true" />
                    {name}
                  </button>
                );
              })}
            </Reveal>
          ) : null}

          {loading ? <Loader label="Loading programmes…" /> : null}
          {error ? <ErrorMessage error={error} onRetry={reload} /> : null}
          {data && visible.length === 0 ? (
            <EmptyState>No programmes match this category.</EmptyState>
          ) : null}
          {visible.length ? (
            // key restarts the reveal animation whenever the filter changes
            <div className="pg-grid" aria-live="polite" key={category || 'all'}>
              {visible.map((programme, index) => (
                <Reveal key={programme.slug} delay={index * 110}>
                  <ProgrammeCard programme={programme} />
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