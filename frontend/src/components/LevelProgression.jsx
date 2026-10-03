import { ClipboardCheck } from 'lucide-react';
import '../styles/components-modern.css';

/** "Certificate | Diploma" and "Level 4, 5 & 6" labels from the level rows. */
export function levelSummary(levels = []) {
  const sorted = [...levels].sort((a, b) => a.level_number - b.level_number);
  const awards = [...new Set(sorted.map((level) => level.award))].join(' | ');
  const numbers = sorted.map((level) => level.level_number);
  let levelText = '';
  if (numbers.length === 1) levelText = `Level ${numbers[0]}`;
  if (numbers.length > 1) levelText = `Level ${numbers.slice(0, -1).join(', ')} & ${numbers[numbers.length - 1]}`;
  return { awards, levelText };
}

/**
 * Level Progression box (clipboard icon + table).
 * Pass `selectedLevel` and `onSelect` to make the rows act as a level picker.
 */
export default function LevelProgression({ levels = [], selectedLevel = null, onSelect, className = '' }) {
  const { awards, levelText } = levelSummary(levels);
  const interactive = typeof onSelect === 'function';

  return (
    <section className={`lv ${className}`} aria-labelledby="level-progression-heading">
      <div className="lv-head">
        <span className="lv-icon" aria-hidden="true">
          <ClipboardCheck size={30} strokeWidth={1.7} />
        </span>
        <div>
          <h3 id="level-progression-heading">Level Progression</h3>
          <p>
            {awards}, {levelText}
          </p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="lv-table">
          <caption className="sr-only">Modules required for each level</caption>
          <thead>
            <tr>
              <th scope="col">Level</th>
              <th scope="col">Award</th>
              <th scope="col">Modules required</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => {
              const selected = selectedLevel === level.level_number;
              return (
                <tr key={level.id} className={selected ? 'is-selected' : undefined}>
                  <th scope="row">
                    {interactive ? (
                      <button
                        type="button"
                        className="lv-row-button"
                        aria-pressed={selected}
                        onClick={() => onSelect(selected ? null : level.level_number)}
                      >
                        Level {level.level_number}
                      </button>
                    ) : (
                      `Level ${level.level_number}`
                    )}
                  </th>
                  <td>{level.award}</td>
                  <td>Module {level.modules_required}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}