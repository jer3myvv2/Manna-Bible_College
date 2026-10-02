import { useSearchParams } from 'react-router-dom';
import { getProgrammes } from '../api/public';
import EnrollCta from '../components/EnrollCta';
import PageHero from '../components/PageHero';
import ProgrammeCard from '../components/ProgrammeCard';
import Seo from '../components/Seo';
import { EmptyState, ErrorMessage, Loader } from '../components/Status';
import useApi from '../hooks/useApi';
import { joinList, sameText } from '../utils/format';

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

      <section className="section" aria-labelledby="programme-list-heading">
        <div className="container">
          <h2 id="programme-list-heading" className="sr-only">
            Programme list
          </h2>
          {categories.length > 1 ? (
            <div className="filter-bar" role="group" aria-label="Filter programmes by category">
              <button
                type="button"
                className={`chip ${!category ? 'is-active' : ''}`}
                aria-pressed={!category}
                onClick={() => chooseCategory('')}
              >
                All programmes
              </button>
              {categories.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`chip ${sameText(name, category) ? 'is-active' : ''}`}
                  aria-pressed={sameText(name, category)}
                  onClick={() => chooseCategory(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          ) : null}

          {loading ? <Loader label="Loading programmes…" /> : null}
          {error ? <ErrorMessage error={error} onRetry={reload} /> : null}
          {data && visible.length === 0 ? (
            <EmptyState>No programmes match this category.</EmptyState>
          ) : null}
          {visible.length ? (
            <div className="programme-grid" aria-live="polite">
              {visible.map((programme) => (
                <ProgrammeCard key={programme.slug} programme={programme} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <EnrollCta />
    </>
  );
}
