import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatNumber } from '../../utils/format';
import { Sparkline } from './charts';

/**
 * KPI tile: label · value · optional delta (signed, vs a named period, icon + text,
 * coloured by whether the direction is good) · optional 14-day sparkline.
 */
export default function StatTile({ label, value, icon: Icon, to, delta, hint, spark }) {
  let deltaNode = null;
  if (delta) {
    const diff = delta.current - delta.previous;
    const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
    const good = direction === 'flat' ? null : (direction === 'up') === (delta.upIsGood ?? true);
    const DeltaIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
    const sign = diff > 0 ? '+' : diff < 0 ? '−' : '±';
    deltaNode = (
      <span className={`kpi-delta ${good === null ? 'is-flat' : good ? 'is-good' : 'is-bad'}`}>
        <DeltaIcon size={15} strokeWidth={2.4} aria-hidden="true" />
        {sign}
        {formatNumber(Math.abs(diff))} {delta.period}
      </span>
    );
  }

  const content = (
    <>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {Icon ? (
          <span className="kpi-icon" aria-hidden="true">
            <Icon size={19} strokeWidth={2} />
          </span>
        ) : null}
      </div>
      <span className="kpi-value">{typeof value === 'number' ? formatNumber(value) : value}</span>
      {hint ? <span className="kpi-hint">{hint}</span> : null}
      {deltaNode}
      {spark ? <Sparkline values={spark} /> : null}
    </>
  );

  return to ? (
    <Link to={to} className="kpi">
      {content}
    </Link>
  ) : (
    <div className="kpi">{content}</div>
  );
}
