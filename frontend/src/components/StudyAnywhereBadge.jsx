import { LaptopIcon, SmartphoneIcon, TabletIcon } from './Icons';

/** Gold rounded badge from the posters: "STUDY FROM ANY LOCATION on your Laptop, Tablet or Smart Phone". */
export default function StudyAnywhereBadge({ className = '' }) {
  return (
    <div className={`study-badge ${className}`}>
      <span className="study-badge-icons" aria-hidden="true">
        <LaptopIcon size={26} />
        <TabletIcon size={22} />
        <SmartphoneIcon size={20} />
      </span>
      <span className="study-badge-text">
        <strong>STUDY FROM ANY LOCATION</strong>
        <span>on your Laptop, Tablet or Smart Phone</span>
      </span>
    </div>
  );
}
