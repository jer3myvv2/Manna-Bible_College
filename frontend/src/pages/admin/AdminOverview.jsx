import { CheckCircle2, ClipboardList, Inbox, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminName } from '../../api/client';
import { getStats } from '../../api/admin';
import { BarListChart, ChartCard, ColumnChart, TimelineChart } from '../../components/admin/charts';
import StatTile from '../../components/admin/StatTile';
import { ErrorMessage, Loader } from '../../components/Status';
import { useLiveVersion } from '../../context/AdminNotifications';
import useApi from '../../hooks/useApi';
import { formatNumber, shortDay, timeAgo } from '../../utils/format';

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

function greeting() {
  const hour = Number(new Date().toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Africa/Nairobi' }));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Dashboard home: KPI tiles, a date-range filter, Recharts charts and recent applicants. */
export default function AdminOverview() {
  const [days, setDays] = useState(30);
  const version = useLiveVersion(); // bumps when new applications / messages arrive
  const { data, loading, error, reload } = useApi(() => getStats({ days }), [days, version]);

  if (loading && !data) return <Loader label="Loading dashboard…" />;
  if (error && !data) return <ErrorMessage error={error} onRetry={reload} />;

  const { totals, kpis, range } = data;
  const refreshing = loading; // previous render stays visible (dimmed) while new numbers load
  const rangeLabel = `last ${range.days} days`;
  const admitted = range.by_status.find((row) => row.status === 'Admitted')?.count || 0;

  const timelineTable = {
    columns: ['Day', 'Applications', 'Messages'],
    rows: range.timeline.map((row) => [shortDay(row.date), row.applications, row.messages]),
  };
  const statusRows = range.by_status.map((row) => ({ label: row.status, count: row.count }));
  const programmeRows = range.by_programme.map((row) => ({ label: row.short_title, count: row.count }));
  const levelRows = range.by_level.map((row) => ({ label: `Level ${row.level}`, count: row.count, award: row.award }));

  return (
    <div className="ov">
      <header className="ov-hero">
        <div>
          <p className="ov-greet">
            {greeting()}, {getAdminName()}
          </p>
          <h1>Admissions dashboard</h1>
          <p className="ov-sub">
            {formatNumber(kpis.applications_last_7)} new application{kpis.applications_last_7 === 1 ? '' : 's'} this week ·{' '}
            {formatNumber(totals.unread_messages)} unread message{totals.unread_messages === 1 ? '' : 's'}
          </p>
        </div>
        <div className="ov-hero-actions">
          <Link to="/admin/applications?status=New" className="btn btn-gold btn-sm">
            Review new applications
          </Link>
          <Link to="/admin/messages" className="btn btn-outline-light btn-sm">
            Open inbox
          </Link>
        </div>
      </header>

      <section className="kpi-row" aria-label="Key figures">
        <StatTile
          label="Applications"
          value={totals.applications}
          icon={ClipboardList}
          to="/admin/applications"
          hint={`${formatNumber(kpis.applications_last_7)} new in the last 7 days`}
          delta={{ current: kpis.applications_last_7, previous: kpis.applications_prev_7, period: 'vs the 7 days before' }}
          spark={kpis.applications_daily_14}
        />
        <StatTile
          label="Awaiting contact"
          value={totals.new_applications}
          icon={PhoneCall}
          to="/admin/applications?status=New"
          hint="Applications with status New"
        />
        <StatTile
          label={`Admitted (${rangeLabel})`}
          value={admitted}
          icon={CheckCircle2}
          to="/admin/applications?status=Admitted"
          hint={range.applications ? `${Math.round((admitted / range.applications) * 100)}% of ${formatNumber(range.applications)} applications` : 'No applications in this period'}
        />
        <StatTile
          label="Unread messages"
          value={totals.unread_messages}
          icon={Inbox}
          to="/admin/messages"
          hint={`${formatNumber(kpis.messages_last_7)} received in the last 7 days`}
          delta={{ current: kpis.messages_last_7, previous: kpis.messages_prev_7, period: 'vs the 7 days before' }}
        />
      </section>

      <div className="ov-filter">
        <span className="ov-filter-label" id="range-label">
          Charts show the
        </span>
        <div className="seg" role="group" aria-labelledby="range-label">
          {RANGES.map((option) => (
            <button
              key={option.days}
              type="button"
              aria-pressed={days === option.days}
              onClick={() => setDays(option.days)}
            >
              Last {option.label}
            </button>
          ))}
        </div>
        {error ? <span className="ov-filter-error">Could not refresh: {error.message}</span> : null}
      </div>

      <div className="ov-grid">
        <ChartCard
          className="span-2"
          title="Applications over time"
          subtitle={`${formatNumber(range.applications)} application${range.applications === 1 ? '' : 's'} in the ${rangeLabel} (East Africa Time)`}
          table={timelineTable}
          refreshing={refreshing}
        >
          <TimelineChart data={range.timeline} />
        </ChartCard>

        <section className={`cc ov-recent ${refreshing ? 'is-refreshing' : ''}`} aria-labelledby="recent-heading">
          <div className="cc-head">
            <div>
              <h2 id="recent-heading" className="cc-title">
                Recent applications
              </h2>
              <p className="cc-sub">Newest first, all time</p>
            </div>
            <Link to="/admin/applications" className="cc-link">
              View all
            </Link>
          </div>
          {data.recent_applications.length === 0 ? (
            <p className="empty-state">No applications yet. They will appear here the moment they arrive.</p>
          ) : (
            <ul className="recent">
              {data.recent_applications.slice(0, 5).map((application) => (
                <li key={application.id}>
                  <Link to={`/admin/applications?q=${encodeURIComponent(application.reference)}`} className="recent-item">
                    <span className="recent-avatar" aria-hidden="true">
                      {application.full_name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                    <span className="recent-text">
                      <strong>{application.full_name}</strong>
                      <span>
                        {application.programme_short_title} · Level {application.level}
                      </span>
                    </span>
                    <span className="recent-meta">
                      <span className={`status-pill status-${application.status.toLowerCase()}`}>{application.status}</span>
                      <time dateTime={application.created_at}>{timeAgo(application.created_at)}</time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <ChartCard
          title="Application status"
          subtitle={`Where the ${rangeLabel}' applications stand`}
          table={{ columns: ['Status', 'Applications'], rows: statusRows.map((row) => [row.label, row.count]) }}
          refreshing={refreshing}
        >
          <BarListChart data={statusRows} labelWidth={92} />
        </ChartCard>

        <ChartCard
          title="By programme"
          subtitle={`Applications per programme, ${rangeLabel}`}
          table={{ columns: ['Programme', 'Applications'], rows: programmeRows.map((row) => [row.label, row.count]) }}
          refreshing={refreshing}
        >
          <BarListChart data={programmeRows} labelWidth={150} />
        </ChartCard>

        <ChartCard
          title="By level"
          subtitle={`Level 4 Certificate to Level 6 Diploma, ${rangeLabel}`}
          table={{
            columns: ['Level', 'Award', 'Applications'],
            rows: levelRows.map((row) => [row.label, row.award, row.count]),
          }}
          refreshing={refreshing}
        >
          <ColumnChart data={levelRows} />
        </ChartCard>

      </div>
    </div>
  );
}
