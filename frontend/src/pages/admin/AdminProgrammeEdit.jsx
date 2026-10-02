import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  createModule,
  createUnit,
  deleteModule,
  deleteUnit,
  getProgramme,
  updateModule,
  updateProgramme,
  updateUnit,
} from '../../api/admin';
import { ArrowLeftIcon } from '../../components/Icons';
import { ErrorMessage, Loader } from '../../components/Status';
import useAction from '../../hooks/useAction';
import useApi from '../../hooks/useApi';
import ProgrammeForm from './ProgrammeForm';

/** Edit one programme: its details, modules and units. */
export default function AdminProgrammeEdit() {
  const { id } = useParams();
  const programme = useApi(() => getProgramme(id), [id]);
  const [saveStatus, runSave] = useAction();
  const [status, run] = useAction();
  const [newModule, setNewModule] = useState({ number: '', title: '' });

  const save = async (values) => {
    const result = await runSave(() => updateProgramme(id, values), 'Programme details saved.');
    if (result.ok) programme.setData(result.data);
  };

  // Every module / unit change reloads the programme so the page always matches the database.
  const mutate = async (action, message) => {
    const result = await run(action, message);
    if (result.ok) programme.reload();
    return result;
  };

  const addModule = async (event) => {
    event.preventDefault();
    const result = await mutate(
      () => createModule(id, { number: Number(newModule.number), title: newModule.title }),
      'Module added.',
    );
    if (result.ok) setNewModule({ number: '', title: '' });
  };

  if (programme.loading && !programme.data) return <Loader label="Loading programme…" />;
  if (programme.error) return <ErrorMessage error={programme.error} onRetry={programme.reload} />;

  const data = programme.data;
  const nextNumber = Math.max(0, ...data.modules.map((module) => module.number)) + 1;

  return (
    <>
      <p>
        <Link to="/admin/programmes" className="back-link">
          <ArrowLeftIcon size={16} /> All programmes
        </Link>
      </p>
      <div className="admin-page-head">
        <h1>{data.title}</h1>
        {data.is_active ? (
          <a href={`/programmes/${data.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
            View on website
          </a>
        ) : null}
      </div>

      <section className="admin-panel">
        <h2>Programme details</h2>
        {saveStatus.error ? <div className="alert alert-error" role="alert">{saveStatus.error}</div> : null}
        {saveStatus.success ? <div className="alert alert-success" role="status">{saveStatus.success}</div> : null}
        <ProgrammeForm
          key={data.id}
          initial={data}
          onSubmit={save}
          busy={saveStatus.busy}
          fieldErrors={saveStatus.fields}
        />
      </section>

      <section className="admin-panel">
        <h2>Modules &amp; units</h2>
        <div aria-live="polite">
          {status.error ? <div className="alert alert-error">{status.error}</div> : null}
          {status.success ? <div className="alert alert-success">{status.success}</div> : null}
        </div>

        <div className="module-editor-grid">
          {data.modules.map((module) => (
            <ModuleEditor key={`${module.id}-${module.units.length}`} module={module} mutate={mutate} busy={status.busy} />
          ))}
        </div>

        <form className="inline-form" onSubmit={addModule}>
          <h3>Add a module</h3>
          <label htmlFor="new-module-number">Number</label>
          <input
            id="new-module-number"
            className="form-control input-xs"
            type="number"
            min="1"
            max="12"
            placeholder={String(nextNumber)}
            value={newModule.number}
            onChange={(event) => setNewModule((current) => ({ ...current, number: event.target.value }))}
            required
          />
          <label htmlFor="new-module-title">Title</label>
          <input
            id="new-module-title"
            className="form-control"
            value={newModule.title}
            onChange={(event) => setNewModule((current) => ({ ...current, title: event.target.value }))}
            required
          />
          <button type="submit" className="btn btn-sm btn-gold" disabled={status.busy}>
            Add module
          </button>
        </form>
      </section>
    </>
  );
}

/** One module card: rename / renumber, delete, and manage its units. */
function ModuleEditor({ module, mutate, busy }) {
  const [values, setValues] = useState({ number: module.number, title: module.title });
  const [newUnit, setNewUnit] = useState('');
  const dirty = Number(values.number) !== module.number || values.title !== module.title;

  const saveModule = (event) => {
    event.preventDefault();
    mutate(() => updateModule(module.id, { number: Number(values.number), title: values.title }), 'Module saved.');
  };

  const removeModule = () => {
    if (!window.confirm(`Delete Module ${module.roman} (${module.title}) and its ${module.units.length} units?`)) return;
    mutate(() => deleteModule(module.id), 'Module deleted.');
  };

  const addUnit = async (event) => {
    event.preventDefault();
    if (!newUnit.trim()) return;
    const result = await mutate(() => createUnit(module.id, { name: newUnit.trim() }), 'Unit added.');
    if (result.ok) setNewUnit('');
  };

  return (
    <article className="module-editor">
      <form className="module-editor-head" onSubmit={saveModule}>
        <label className="sr-only" htmlFor={`module-${module.id}-number`}>
          Module number
        </label>
        <span className="module-editor-prefix">Module</span>
        <input
          id={`module-${module.id}-number`}
          type="number"
          min="1"
          max="12"
          className="form-control input-xs"
          value={values.number}
          onChange={(event) => setValues((current) => ({ ...current, number: event.target.value }))}
        />
        <label className="sr-only" htmlFor={`module-${module.id}-title`}>
          Module title
        </label>
        <input
          id={`module-${module.id}-title`}
          className="form-control"
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
        />
        <div className="inline-actions">
          <button type="submit" className="btn btn-sm btn-maroon" disabled={!dirty || busy}>
            Save
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={removeModule} disabled={busy}>
            Delete
          </button>
        </div>
      </form>

      <ul className="unit-list">
        {module.units.map((unit) => (
          <UnitRow key={unit.id} unit={unit} mutate={mutate} busy={busy} />
        ))}
      </ul>

      <form className="unit-add" onSubmit={addUnit}>
        <label className="sr-only" htmlFor={`module-${module.id}-new-unit`}>
          New unit name for Module {module.roman}
        </label>
        <input
          id={`module-${module.id}-new-unit`}
          className="form-control"
          placeholder="New unit name"
          value={newUnit}
          onChange={(event) => setNewUnit(event.target.value)}
        />
        <button type="submit" className="btn btn-sm btn-gold" disabled={busy || !newUnit.trim()}>
          Add unit
        </button>
      </form>
    </article>
  );
}

/** A unit row: edit its name / order or delete it. */
function UnitRow({ unit, mutate, busy }) {
  const [values, setValues] = useState({ name: unit.name, order: unit.order });
  const dirty = values.name !== unit.name || Number(values.order) !== unit.order;

  const save = (event) => {
    event.preventDefault();
    mutate(() => updateUnit(unit.id, { name: values.name, order: Number(values.order) }), 'Unit saved.');
  };

  const remove = () => {
    if (!window.confirm(`Delete the unit "${unit.name}"?`)) return;
    mutate(() => deleteUnit(unit.id), 'Unit deleted.');
  };

  return (
    <li>
      <form className="unit-row" onSubmit={save}>
        <label className="sr-only" htmlFor={`unit-${unit.id}-order`}>
          Order
        </label>
        <input
          id={`unit-${unit.id}-order`}
          type="number"
          className="form-control input-xs"
          value={values.order}
          onChange={(event) => setValues((current) => ({ ...current, order: event.target.value }))}
        />
        <label className="sr-only" htmlFor={`unit-${unit.id}-name`}>
          Unit name
        </label>
        <input
          id={`unit-${unit.id}-name`}
          className="form-control"
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
        />
        <button type="submit" className="btn btn-sm btn-outline" disabled={!dirty || busy}>
          Save
        </button>
        <button type="button" className="btn btn-sm btn-danger-link" onClick={remove} disabled={busy} aria-label={`Delete ${unit.name}`}>
          ✕
        </button>
      </form>
    </li>
  );
}
