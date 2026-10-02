import { useSiteInfo } from '../context/SiteInfoContext';
import { ClockIcon } from './Icons';

/** Class-time box with clock icon: 8:00PM – 9:30PM, East Africa Time (EAT). */
export default function ClassTimeBox({ className = '' }) {
  const { info } = useSiteInfo();
  if (!info) return null;
  const { class_time: time } = info;
  return (
    <section className={`classtime-box ${className}`} aria-labelledby="classtime-heading">
      <span className="classtime-icon" aria-hidden="true">
        <ClockIcon size={40} strokeWidth={1.6} />
      </span>
      <div>
        <h3 id="classtime-heading" className="classtime-label">
          Class Time
        </h3>
        <p className="classtime-time">
          <time>{time.start}</time> – <time>{time.end}</time>
        </p>
        <p className="classtime-zone">{time.timezone}</p>
        <p className="classtime-mode">{info.mode} · Live online</p>
      </div>
    </section>
  );
}
