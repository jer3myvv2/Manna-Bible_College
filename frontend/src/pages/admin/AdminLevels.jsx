import { useState } from 'react';
import { getLevels, updateLevel } from '../../api/admin';
import { ErrorMessage, Loader } from '../../components/Status';
import useAction from '../../hooks/useAction';
import useApi from '../../hooks/useApi';

/** Edit the Level Progression table (award names and module requirements). */
export default function AdminLevels() {
  const levels = useApi(getLevels, []);
  const [status, run] = useAction();

  const save = async (level, values) => {
    const result = await run(
      () =>
        updateLevel(level.id, {
          award: values.award,
          modules_required: values.modules_required,
          max_module: Number(values.max_module),
        }),
      `Level ${level.level_number} saved.`,
    );
    if (result.ok) {
      levels.setData((current) => current.map((item) => (item.id === level.id ? result.data : item)));
    }
  };

  return (
    <>
      <div className="admin-page-head">
        <h1>Level progression</h1>
      </div>
      <p className="muted">
        These rows apply to every programme. “Highest module” controls which modules are highlighted when a visitor
        picks a level on a programme page.
      </p>

      <div aria-live="polite">
        {status.error ? <div className="alert alert-error">{status.error}</div> : null}
        {status.success ? <div className="alert alert-success">{status.success}</div> : null}
      </div>

      {levels.loading && !levels.data ? <Loader label="Loading levels…" /> : null}
      {levels.error ? <ErrorMessage error={levels.error} onRetry={levels.reload} /> : null}

      {levels.data ? (
        <section className="admin-panel">
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Level</th>
                  <th scope="col">Award</th>
                  <th scope="col">Modules required (label)</th>
                  <th scope="col">Highest module</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {levels.data.map((level) => (
                  <LevelRow key={level.id} level={level} onSave={save} busy={status.busy} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}

function LevelRow({ level, onSave, busy }) {
  const [values, setValues] = useState({
    award: level.award,
    modules_required: level.modules_required,
    max_module: level.max_module,
  });
  const dirty =
    values.award !== level.award ||
    values.modules_required !== level.modules_required ||
    Number(values.max_module) !== level.max_module;
  const change = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <tr>
      <th scope="row">Level {level.level_number}</th>
      <td>
        <label className="sr-only" htmlFor={`level-${level.id}-award`}>
          Award for level {level.level_number}
        </label>
        <input id={`level-${level.id}-award`} name="award" className="form-control" value={values.award} onChange={change} />
      </td>
      <td>
        <label className="sr-only" htmlFor={`level-${level.id}-modules`}>
          Modules required for level {level.level_number}
        </label>
        <input
          id={`level-${level.id}-modules`}
          name="modules_required"
          className="form-control"
          value={values.modules_required}
          onChange={change}
        />
      </td>
      <td>
        <label className="sr-only" htmlFor={`level-${level.id}-max`}>
          Highest module for level {level.level_number}
        </label>
        <input
          id={`level-${level.id}-max`}
          name="max_module"
          type="number"
          min="1"
          max="12"
          className="form-control input-xs"
          value={values.max_module}
          onChange={change}
        />
      </td>
      <td>
        <button type="button" className="btn btn-sm btn-maroon" onClick={() => onSave(level, values)} disabled={!dirty || busy}>
          Save
        </button>
      </td>
    </tr>
  );
}
