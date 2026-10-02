import { CheckIcon } from './Icons';

/**
 * Module card with a maroon "MODULE I" header strip and a bulleted unit list.
 * `included` is true/false when a level is selected, or null when none is.
 */
export default function ModuleCard({ module, included = null, levelNumber = null }) {
  const stateClass = included === true ? 'is-included' : included === false ? 'is-excluded' : '';
  return (
    <article className={`module-card ${stateClass}`} aria-labelledby={`module-${module.id}-title`}>
      <header className="module-card-head">
        <span className="module-card-number">MODULE {module.roman}</span>
        {included === true ? (
          <span className="module-card-flag">
            <CheckIcon size={16} strokeWidth={2.6} /> Level {levelNumber}
          </span>
        ) : null}
      </header>
      <div className="module-card-body">
        <h3 id={`module-${module.id}-title`} className="module-card-title">
          {module.title}
        </h3>
        <ul className="module-card-units">
          {module.units.map((unit) => (
            <li key={unit.id}>{unit.name}</li>
          ))}
        </ul>
        {included === false ? (
          <p className="module-card-note">Not required for Level {levelNumber}</p>
        ) : null}
      </div>
    </article>
  );
}
