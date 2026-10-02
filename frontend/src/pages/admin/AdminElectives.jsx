import { useState } from 'react';
import { createElective, deleteElective, getElectives, getProgrammes, updateElective } from '../../api/admin';
import { ErrorMessage, Loader } from '../../components/Status';
import useAction from '../../hooks/useAction';
import useApi from '../../hooks/useApi';

/** Electives / short courses editor. */
export default function AdminElectives() {
  const electives = useApi(getElectives, []);
  const programmes = useApi(getProgrammes, []);
  const [status, run] = useAction();
  const [newItem, setNewItem] = useState({ name: '', programme_id: '' });

  const mutate = async (action, message) => {
    const result = await run(action, message);
    if (result.ok) electives.reload();
    return result;
  };

  const add = async (event) => {
    event.preventDefault();
    const result = await mutate(
      () => createElective({ name: newItem.name, programme_id: newItem.programme_id || null }),
      'Short course added.',
    );
    if (result.ok) setNewItem({ name: '', programme_id: '' });
  };

  return (
    <>
      <div className="admin-page-head">
        <h1>Short courses / electives</h1>
      </div>

      <section className="admin-panel">
        <form className="inline-form" onSubmit={add}>
          <h2>Add a short course</h2>
          <label htmlFor="new-elective-name">Name</label>
          <input
            id="new-elective-name"
            className="form-control"
            value={newItem.name}
            onChange={(event) => setNewItem((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <label htmlFor="new-elective-programme">Programme</label>
          <ProgrammeSelect
            id="new-elective-programme"
            programmes={programmes.data}
            value={newItem.programme_id}
            onChange={(value) => setNewItem((current) => ({ ...current, programme_id: value }))}
          />
          <button type="submit" className="btn btn-sm btn-gold" disabled={status.busy || !newItem.name.trim()}>
            Add
          </button>
        </form>
      </section>

      <div aria-live="polite">
        {status.error ? <div className="alert alert-error">{status.error}</div> : null}
        {status.success ? <div className="alert alert-success">{status.success}</div> : null}
      </div>

      {electives.loading && !electives.data ? <Loader label="Loading short courses…" /> : null}
      {electives.error ? <ErrorMessage error={electives.error} onRetry={electives.reload} /> : null}

      {electives.data ? (
        <section className="admin-panel">
          <p className="muted">{electives.data.length} short courses. Lower order numbers are listed first.</p>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Name</th>
                  <th scope="col">Linked programme</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {electives.data.map((elective) => (
                  <ElectiveRow
                    key={elective.id}
                    elective={elective}
                    programmes={programmes.data}
                    mutate={mutate}
                    busy={status.busy}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}

function ProgrammeSelect({ id, programmes, value, onChange }) {
  return (
    <select id={id} className="form-control" value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
      <option value="">Not linked (standalone)</option>
      {(programmes || []).map((programme) => (
        <option key={programme.id} value={programme.id}>
          {programme.short_title}
        </option>
      ))}
    </select>
  );
}

function ElectiveRow({ elective, programmes, mutate, busy }) {
  const [values, setValues] = useState({
    name: elective.name,
    order: elective.order,
    programme_id: elective.programme_id ? String(elective.programme_id) : '',
  });
  const dirty =
    values.name !== elective.name ||
    Number(values.order) !== elective.order ||
    values.programme_id !== (elective.programme_id ? String(elective.programme_id) : '');

  const save = () =>
    mutate(
      () =>
        updateElective(elective.id, {
          name: values.name,
          order: Number(values.order),
          programme_id: values.programme_id || null,
        }),
      'Short course saved.',
    );

  const remove = () => {
    if (!window.confirm(`Delete the short course "${elective.name}"?`)) return;
    mutate(() => deleteElective(elective.id), 'Short course deleted.');
  };

  return (
    <tr>
      <td>
        <label className="sr-only" htmlFor={`elective-${elective.id}-order`}>
          Order
        </label>
        <input
          id={`elective-${elective.id}-order`}
          type="number"
          className="form-control input-xs"
          value={values.order}
          onChange={(event) => setValues((current) => ({ ...current, order: event.target.value }))}
        />
      </td>
      <td>
        <label className="sr-only" htmlFor={`elective-${elective.id}-name`}>
          Name
        </label>
        <input
          id={`elective-${elective.id}-name`}
          className="form-control"
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
        />
      </td>
      <td>
        <label className="sr-only" htmlFor={`elective-${elective.id}-programme`}>
          Linked programme
        </label>
        <ProgrammeSelect
          id={`elective-${elective.id}-programme`}
          programmes={programmes}
          value={values.programme_id}
          onChange={(value) => setValues((current) => ({ ...current, programme_id: value }))}
        />
      </td>
      <td>
        <div className="inline-actions">
          <button type="button" className="btn btn-sm btn-maroon" onClick={save} disabled={!dirty || busy}>
            Save
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={remove} disabled={busy}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
