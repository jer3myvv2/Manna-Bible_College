import { Check, MinusCircle } from 'lucide-react';
import '../styles/programmes.css';

/**
 * Module card with a maroon "MODULE I" header strip and a bulleted unit list.
 * `included` is true/false when a level is selected, or null when none is.
 */
export default function ModuleCard({ module, included = null, levelNumber = null }) {
  const stateClass = included === true ? 'is-included' : included === false ? 'is-excluded' : '';
  return (
    <article className={`mc ${stateClass}`} aria-labelledby={`module-${module.id}-title`}>
      <header className="mc-head">
        <span className="mc-number">MODULE {module.roman}</span>
        {included === true ? (
          <span className="mc-flag">
            <Check size={16} strokeWidth={2.8} aria-hidden="true" /> Level {levelNumber}
          </span>
        ) : null}
      </header>
      <div className="mc-body">
        <h3 id={`module-${module.id}-title`} className="mc-title">
          {module.title}
        </h3>
        <ul className="mc-units">
          {module.units.map((unit) => (
            <li key={unit.id}>{unit.name}</li>
          ))}
        </ul>
        {included === false ? (
          <p className="mc-note">
            <MinusCircle size={16} strokeWidth={2} aria-hidden="true" /> Not required for Level {levelNumber}
          </p>
        ) : null}
      </div>
    </article>
  );
}