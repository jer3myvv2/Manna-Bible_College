import { Link } from 'react-router-dom';
import { getStats } from '../../api/admin';
import { ErrorMessage, Loader } from '../../components/Status';
import useApi from '../../hooks/useApi';
import { formatDate } from '../../utils/format';

/** Dashboard home: stats cards, applications by programme / level, recent applications. */
export default function AdminOverview() {
  const { data, loading, error, reload } = useApi(getStats, []);

  if (loading && !data) return <Loader label="Loading dashboard…" />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;

  const { totals, by_status: byStatus, by_level: byLevel, by_programme: byProgramme } = data;
  const statuses = Object.keys(byStatus);

  return (
    <>
      <div className="admin-page-head">
        <h1>Overview</h1>
        <button type="button" className="btn btn-sm btn-outline" onClick={reload}>
          Refresh
        </button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total applications" value={totals.applications} to="/admin/applications" />
        <StatCard label="New applications" value={totals.new_applications} to="/admin/applications?status=New" accent />
        <StatCard label="Unread messages" value={totals.unread_messages} to="/admin/messages" accent={totals.unread_messages > 0} />
        <StatCard label="Active programmes" value={`${totals.active_programmes} / ${totals.programmes}`} to="/admin/programmes" />
        <StatCard label="Short courses" value={totals.electives} to="/admin/electives" />
        <StatCard label="Published announcements" value={totals.announcements} to="/admin/announcements" />
      </div>

      <section className="admin-panel">
        <h2>Applications by programme and status</h2>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Programme</th>
                {statuses.map((status) => (
                  <th scope="col" key={status} className="num">
                    {status}
                  </th>
                ))}
                <th scope="col" className="num">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {byProgramme.map((row) => (
                <tr key={row.programme_id}>
                  <th scope="row">{row.short_title}</th>
                  {statuses.map((status) => (
                    <td key={status} className="num">
                      {row.by_status[status] || 0}
                    </td>
                  ))}
                  <td className="num">
                    <strong>{row.total}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">All programmes</th>
                {statuses.map((status) => (
                  <td key={status} className="num">
                    {byStatus[status]}
                  </td>
                ))}
                <td className="num">
                  <strong>{totals.applications}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="admin-two-col">
        <section className="admin-panel">
          <h2>Applications by level</h2>
          <ul className="level-stats">
            {Object.entries(byLevel).map(([level, count]) => (
              <li key={level}>
                <span>Level {level}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </section>
        <section className="admin-panel">
          <h2>Recent applications</h2>
          {data.recent_applications.length === 0 ? (
            <p className="muted">No applications yet.</p>
          ) : (
            <ul className="recent-list">
              {data.recent_applications.map((application) => (
                <li key={application.id}>
                  <div>
                    <strong>{application.full_name}</strong>
                    <span className="muted">
                      {' '}
                      · {application.programme_short_title}, Level {application.level}
                    </span>
                  </div>
                  <div className="recent-meta">
                    <span className={`status-pill status-${application.status.toLowerCase()}`}>{application.status}</span>
                    <span className="muted">{formatDate(application.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/applications" className="btn btn-sm btn-outline">
            View all applications
          </Link>
        </section>
      </div>
    </>
  );
}

function StatCard({ label, value, to, accent = false }) {
  return (
    <Link to={to} className={`stat-card ${accent ? 'stat-card-accent' : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </Link>
  );
}
