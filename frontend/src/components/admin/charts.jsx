/**
 * Dashboard charts (Recharts), following the data-viz method:
 * - one series per chart, so every chart uses categorical slot 1 and needs no legend
 * - slot colours validated (validate_palette.js, light mode, #ffffff surface):
 *     slot 1 #9b2240 (maroon step), slot 2 #b8860b (gold step): all checks pass, >= 3:1 contrast
 * - thin marks: bars <= 24px with 4px rounded data-ends; 2px lines; 10% area wash
 * - hairline solid gridlines; text in ink tokens, never the series colour
 * - every chart has a Table view, and keeps its previous render (dimmed) while refreshing
 */
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber, shortDay } from '../../utils/format';

export const SERIES_1 = '#9b2240';
export const SERIES_2 = '#b8860b';
const INK = '#2b1a1d';
const INK_SECONDARY = '#5c4a4d';
const INK_MUTED = '#6e5d60';
const GRID = '#efe8dc';
const AXIS = '#d9cdbb';
const DE_EMPHASIS = '#cbbfc1';
const SURFACE = '#ffffff';

const tick = { fill: INK_MUTED, fontSize: 12 };

/** Card that owns a chart's title, subtitle and its Table-view twin. */
export function ChartCard({ title, subtitle, table, refreshing = false, className = '', children }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={`cc ${refreshing ? 'is-refreshing' : ''} ${className}`} aria-label={title}>
      <div className="cc-head">
        <div>
          <h2 className="cc-title">{title}</h2>
          {subtitle ? <p className="cc-sub">{subtitle}</p> : null}
        </div>
        {table ? (
          <button
            type="button"
            className="cc-toggle"
            aria-pressed={showTable}
            onClick={() => setShowTable((value) => !value)}
          >
            {showTable ? 'Chart' : 'Table'}
          </button>
        ) : null}
      </div>
      <div className="cc-body">
        {showTable && table ? (
          <div className="table-scroll">
            <table className="cc-table">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr>
                  {table.columns.map((column, index) => (
                    <th key={column} scope="col" className={index ? 'num' : undefined}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) =>
                      index === 0 ? (
                        <th key={index} scope="row">
                          {cell}
                        </th>
                      ) : (
                        <td key={index} className="num">
                          {typeof cell === 'number' ? formatNumber(cell) : cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

/** Tooltip: the value leads (strong), the label follows; a short line key carries the series. */
function VizTooltip({ active, payload, label, labelFormatter, unit }) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  return (
    <div className="viz-tooltip">
      <div className="viz-tooltip-row">
        <span className="viz-tooltip-key" style={{ background: point.color || SERIES_1 }} aria-hidden="true" />
        <span className="viz-tooltip-value">{formatNumber(point.value)}</span>
        <span className="viz-tooltip-label">{point.value === 1 ? unit.replace(/s$/, '') : unit}</span>
      </div>
      <div className="viz-tooltip-sub">{labelFormatter ? labelFormatter(label, point.payload) : label}</div>
    </div>
  );
}

/** Area chart of one daily series with a crosshair that snaps to the nearest day. */
export function TimelineChart({ data, dataKey = 'applications', unit = 'applications', height = 260 }) {
  const lastIndex = data.length - 1;
  const endDot = ({ cx, cy, index }) =>
    index === lastIndex ? (
      <circle key="end" cx={cx} cy={cy} r={4.5} fill={SERIES_1} stroke={SURFACE} strokeWidth={2} />
    ) : null;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDay}
            tick={tick}
            tickLine={false}
            axisLine={{ stroke: AXIS }}
            minTickGap={28}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            domain={[0, (max) => Math.max(max, 4)]}
            tick={tick}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: SERIES_1, strokeWidth: 1 }}
            content={<VizTooltip unit={unit} labelFormatter={(day) => shortDay(day)} />}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            name={unit}
            stroke={SERIES_1}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={SERIES_1}
            fillOpacity={0.1}
            dot={endDot}
            activeDot={{ r: 5, fill: SERIES_1, stroke: SURFACE, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bars for comparing a few categories; value at each bar's tip. */
export function BarListChart({ data, unit = 'applications', labelWidth = 120 }) {
  const height = data.length * 46 + 12;
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 6, right: 40, left: 4, bottom: 6 }} barCategoryGap={14}>
          <XAxis type="number" hide allowDecimals={false} domain={[0, (max) => Math.max(max, 1)]} />
          <YAxis
            type="category"
            dataKey="label"
            width={labelWidth}
            tick={{ fill: INK_SECONDARY, fontSize: 13 }}
            tickLine={false}
            axisLine={{ stroke: AXIS }}
          />
          <Tooltip cursor={{ fill: 'rgba(155, 34, 64, 0.06)' }} content={<VizTooltip unit={unit} />} />
          <Bar dataKey="count" name={unit} fill={SERIES_1} barSize={18} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="count" position="right" fill={INK} fontSize={13} fontWeight={700} formatter={formatNumber} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Vertical columns for a short ordered set (e.g. Level 4 / 5 / 6); value on each cap. */
export function ColumnChart({ data, unit = 'applications', height = 220 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 26, right: 8, left: 8, bottom: 0 }} barCategoryGap="30%">
          <XAxis dataKey="label" tick={{ fill: INK_SECONDARY, fontSize: 13 }} tickLine={false} axisLine={{ stroke: AXIS }} />
          <YAxis hide allowDecimals={false} domain={[0, (max) => Math.max(max, 1)]} />
          <Tooltip cursor={{ fill: 'rgba(155, 34, 64, 0.06)' }} content={<VizTooltip unit={unit} />} />
          <Bar dataKey="count" name={unit} fill={SERIES_1} barSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey="count" position="top" fill={INK} fontSize={13} fontWeight={700} formatter={formatNumber} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 14-day sparkline: the earlier week in the de-emphasis grey, the latest week in the accent. */
export function Sparkline({ values = [] }) {
  const split = Math.max(values.length - 8, 0);
  const data = values.map((value, index) => ({
    index,
    earlier: index <= split + 1 ? value : null,
    recent: index >= split + 1 ? value : null,
  }));
  const last = data.length - 1;
  return (
    <div className="kpi-spark" aria-hidden="true">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 6, left: 6, bottom: 5 }}>
          <YAxis hide domain={[0, (max) => Math.max(max, 1)]} />
          <Line dataKey="earlier" stroke={DE_EMPHASIS} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line
            dataKey="recent"
            stroke={SERIES_1}
            strokeWidth={2}
            isAnimationActive={false}
            dot={({ cx, cy, index }) =>
              index === last ? <circle key="end" cx={cx} cy={cy} r={4} fill={SERIES_1} stroke={SURFACE} strokeWidth={2} /> : null
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
