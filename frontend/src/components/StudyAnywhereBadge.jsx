import { Laptop, Smartphone, Tablet } from 'lucide-react';
import '../styles/components-modern.css';

/** Rounded badge from the posters: "STUDY FROM ANY LOCATION on your Laptop, Tablet or Smart Phone". */
export default function StudyAnywhereBadge({ className = '' }) {
  return (
    <div className={`sab ${className}`}>
      <span className="sab-icons" aria-hidden="true">
        <Laptop size={24} strokeWidth={1.9} />
        <Tablet size={20} strokeWidth={1.9} />
        <Smartphone size={18} strokeWidth={1.9} />
      </span>
      <span className="sab-text">
        <strong>STUDY FROM ANY LOCATION</strong>
        <span>on your Laptop, Tablet or Smart Phone</span>
      </span>
    </div>
  );
}