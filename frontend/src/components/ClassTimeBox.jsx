import { Clock } from 'lucide-react';
import { useSiteInfo } from '../context/SiteInfoContext';
import '../styles/components-modern.css';

/** Class-time box with clock icon: 8:00PM – 9:30PM, East Africa Time (EAT). */
export default function ClassTimeBox({ className = '' }) {
  const { info } = useSiteInfo();
  if (!info) return null;
  const { class_time: time } = info;
  return (
    <section className={`ct ${className}`} aria-labelledby="classtime-heading">
      <span className="ct-icon" aria-hidden="true">
        <Clock size={34} strokeWidth={1.8} />
      </span>
      <div>
        <h3 id="classtime-heading" className="ct-label">
          Class Time
        </h3>
        <p className="ct-time">
          <time>{time.start}</time> – <time>{time.end}</time>
        </p>
        <p className="ct-zone">{time.timezone}</p>
        <p className="ct-mode">{info.mode} · Live online</p>
      </div>
    </section>
  );
}