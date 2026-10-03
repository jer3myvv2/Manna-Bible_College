import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { exportApplications, getApplications, getLevels, getProgrammes, updateApplication } from '../../api/admin';
import { DownloadIcon, SearchIcon } from '../../components/Icons';
import { ErrorMessage, Loader } from '../../components/Status';
import useAction from '../../hooks/useAction';
import { useLiveVersion } from '../../context/AdminNotifications';
import useApi from '../../hooks/useApi';
import { formatDate } from '../../utils/format';

const STATUSES = ['New', 'Contacted', 'Admitted', 'Rejected'];
const PER_PAGE = 25;

/** Remove empty values so they are not sent as query parameters. */
const compact = (params) => Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null));

/** Applications table: filter, search, change status, export CSV. */
export default function AdminApplications() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    programme_id: '',
    level: '',
    status: searchParams.get('status') || '',
    q: searchParams.get('q') || '',
  });
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [rowStatus, runRow] = useAction();
  const [exportStatus, runExport] = useAction();

  const programmes = useApi(getProgrammes, []);
  const levels = useApi(getLevels, []);
  const params = compact({ ...filters, page, per_page: PER_PAGE });
  const version = useLiveVersion(); // refetch when new applications arrive
  const applications = useApi(() => getApplications(params), [JSON.stringify(params), version]);

  // Links from notifications and the dashboard set ?q= / ?status= while this page is open.
  const urlQuery = searchParams.get('q');
  const urlStatus = searchParams.get('status');
  useEffect(() => {
    if (urlQuery !== null) setSearch(urlQuery);
    if (urlStatus !== null) setFilters((current) => ({ ...current, status: urlStatus }));
  }, [urlQuery, urlStatus]);

  // Debounce the search box so we don't query on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => (current.q === search.trim() ? current : { ...current, q: search.trim() }));
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const changeFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const changeStatus = async (application, status) => {
    setSavingId(application.id);
    const result = await runRow(() => updateApplication(application.id, { status }), `Status updated to ${status}.`);
    setSavingId(null);
    if (result.ok) {
      applications.setData((current) => ({
        ...current,
        items: current.items.map((item) => (item.id === application.id ? result.data : item)),
      }));
    }
  };

  const data = applications.data;

  return (
    <>
      <div className="admin-page-head">
        <h1>Applications</h1>
        <button
          type="button"
          className="btn btn-sm btn-gold"
          onClick={() => runExport(() => exportApplications(compact(filters)))}
          disabled={exportStatus.busy}
        >
          <DownloadIcon size={18} /> {exportStatus.busy ? 'Preparing…' : 'Export CSV'}
        </button>
      </div>
      {exportStatus.error ? <div className="alert alert-error" role="alert">{exportStatus.error}</div> : null}

      <div className="admin-filters">
        <div className="search-box">
          <label htmlFor="app-search" className="sr-only">
            Search by name, email, phone or reference
          </label>
          <SearchIcon size={18} />
          <input
            id="app-search"
            type="search"
            placeholder="Search name, phone or reference"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <label className="sr-only" htmlFor="filter-programme">
          Programme
        </label>
        <select id="filter-programme" name="programme_id" className="form-control" value={filters.programme_id} onChange={changeFilter}>
          <option value="">All programmes</option>
          {(programmes.data || []).map((programme) => (
            <option key={programme.id} value={programme.id}>
              {programme.short_title}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-level">
          Level
        </label>
        <select id="filter-level" name="level" className="form-control" value={filters.level} onChange={changeFilter}>
          <option value="">All levels</option>
          {(levels.data || []).map((level) => (
            <option key={level.id} value={level.level_number}>
              Level {level.level_number}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-status">
          Status
        </label>
        <select id="filter-status" name="status" className="form-control" value={filters.status} onChange={changeFilter}>
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite">
        {rowStatus.error ? <div className="alert alert-error">{rowStatus.error}</div> : null}
        {rowStatus.success ? <div className="alert alert-success">{rowStatus.success}</div> : null}
      </div>

      {applications.loading && !data ? <Loader label="Loading applications…" /> : null}
      {applications.error ? <ErrorMessage error={applications.error} onRetry={applications.reload} /> : null}

      {data ? (
        <section className="admin-panel">
          <p className="muted">
            {data.total} application{data.total === 1 ? '' : 's'} found
            {applications.loading ? ' · updating…' : ''}
          </p>
          {data.items.length === 0 ? (
            <p className="empty-state">No applications match these filters.</p>
          ) : (
            <div className="table-scroll">
              <table className="admin-table admin-table-cards">
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Name</th>
                    <th scope="col">Programme</th>
                    <th scope="col">Level</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Date</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((application) => (
                    <Fragment key={application.id}>
                      <tr className={expandedId === application.id ? 'is-expanded' : undefined}>
                        <td className="nowrap cell-ref" data-label="Reference">
                          {application.reference}
                        </td>
                        <td className="cell-wide cell-name">
                          <strong>{application.full_name}</strong>
                          <br />
                          <a href={`mailto:${application.email}`} className="muted small">
                            {application.email}
                          </a>
                        </td>
                        <td data-label="Programme">{application.programme_short_title}</td>
                        <td className="num" data-label="Level">
                          {application.level}
                        </td>
                        <td className="nowrap" data-label="Phone">
                          <a href={`tel:${application.phone}`}>{application.phone}</a>
                        </td>
                        <td className="nowrap" data-label="Date">
                          {formatDate(application.created_at)}
                        </td>
                        <td data-label="Status">
                          <label className="sr-only" htmlFor={`status-${application.id}`}>
                            Status for {application.full_name}
                          </label>
                          <select
                            id={`status-${application.id}`}
                            className={`form-control status-select status-${application.status.toLowerCase()}`}
                            value={application.status}
                            disabled={savingId === application.id}
                            onChange={(event) => changeStatus(application, event.target.value)}
                          >
                            {STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="cell-action">
                          <button
                            type="button"
                            className="btn btn-link"
                            aria-expanded={expandedId === application.id}
                            aria-controls={`application-${application.id}-details`}
                            onClick={() => setExpandedId(expandedId === application.id ? null : application.id)}
                          >
                            {expandedId === application.id ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                      {expandedId === application.id ? (
                        <tr className="detail-row">
                          <td colSpan={8} id={`application-${application.id}-details`}>
                            <dl className="detail-grid">
                              <div><dt>Programme</dt><dd>{application.programme_title}</dd></div>
                              <div><dt>Country</dt><dd>{application.country}</dd></div>
                              <div><dt>County / City</dt><dd>{application.county_or_city}</dd></div>
                              <div><dt>Highest education</dt><dd>{application.highest_education}</dd></div>
                              <div><dt>Church / Organisation</dt><dd>{application.church_or_organisation || '—'}</dd></div>
                              <div><dt>How they heard</dt><dd>{application.how_did_you_hear || '—'}</dd></div>
                              <div className="span-all"><dt>Message</dt><dd className="pre-wrap">{application.message || '—'}</dd></div>
                              <div><dt>Submitted</dt><dd>{formatDate(application.created_at, true)}</dd></div>
                              <div>
                                <dt>Contact</dt>
                                <dd>
                                  <a
                                    href={`https://wa.me/${application.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    WhatsApp
                                  </a>{' '}
                                  · <a href={`mailto:${application.email}`}>Email</a>
                                </dd>
                              </div>
                            </dl>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.pages > 1 ? (
            <nav className="pagination" aria-label="Applications pages">
              <button type="button" className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span>
                Page {data.page} of {data.pages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                disabled={page >= data.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </nav>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
