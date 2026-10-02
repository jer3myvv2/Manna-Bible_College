import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createProgramme, deleteProgramme, getProgrammes, updateProgramme } from '../../api/admin';
import { ErrorMessage, Loader } from '../../components/Status';
import useAction from '../../hooks/useAction';
import useApi from '../../hooks/useApi';
import ProgrammeForm from './ProgrammeForm';

/** Programme list with create, activate / deactivate and delete. */
export default function AdminProgrammes() {
  const navigate = useNavigate();
  const programmes = useApi(getProgrammes, []);
  const [showCreate, setShowCreate] = useState(false);
  const [createStatus, runCreate] = useAction();
  const [status, run] = useAction();

  const create = async (values) => {
    const result = await runCreate(() => createProgramme(values), 'Programme created.');
    if (result.ok) navigate(`/admin/programmes/${result.data.id}`);
  };

  const toggleActive = async (programme) => {
    const result = await run(
      () => updateProgramme(programme.id, { is_active: !programme.is_active }),
      `${programme.short_title} is now ${programme.is_active ? 'hidden from' : 'shown on'} the website.`,
    );
    if (result.ok) programmes.reload();
  };

  const remove = async (programme) => {
    const ok = window.confirm(
      `Delete "${programme.title}" with all its modules and units? This cannot be undone.`,
    );
    if (!ok) return;
    const result = await run(() => deleteProgramme(programme.id), 'Programme deleted.');
    if (result.ok) programmes.reload();
  };

  return (
    <>
      <div className="admin-page-head">
        <h1>Programmes</h1>
        <button type="button" className="btn btn-sm btn-gold" onClick={() => setShowCreate((value) => !value)}>
          {showCreate ? 'Cancel' : 'New programme'}
        </button>
      </div>

      {showCreate ? (
        <section className="admin-panel">
          <h2>New programme</h2>
          {createStatus.error ? <div className="alert alert-error" role="alert">{createStatus.error}</div> : null}
          <ProgrammeForm onSubmit={create} submitLabel="Create programme" busy={createStatus.busy} fieldErrors={createStatus.fields} />
        </section>
      ) : null}

      <div aria-live="polite">
        {status.error ? <div className="alert alert-error">{status.error}</div> : null}
        {status.success ? <div className="alert alert-success">{status.success}</div> : null}
      </div>

      {programmes.loading && !programmes.data ? <Loader label="Loading programmes…" /> : null}
      {programmes.error ? <ErrorMessage error={programmes.error} onRetry={programmes.reload} /> : null}

      {programmes.data ? (
        <section className="admin-panel">
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Programme</th>
                  <th scope="col">Category</th>
                  <th scope="col" className="num">Modules</th>
                  <th scope="col" className="num">Units</th>
                  <th scope="col" className="num">Applications</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programmes.data.map((programme) => (
                  <tr key={programme.id}>
                    <td>
                      <strong>{programme.title}</strong>
                      <br />
                      <span className="muted small">/programmes/{programme.slug}</span>
                    </td>
                    <td>{programme.category}</td>
                    <td className="num">{programme.module_count}</td>
                    <td className="num">{programme.unit_count}</td>
                    <td className="num">{programme.application_count}</td>
                    <td>
                      <span className={`status-pill ${programme.is_active ? 'status-admitted' : 'status-rejected'}`}>
                        {programme.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        <Link to={`/admin/programmes/${programme.id}`} className="btn btn-sm btn-maroon">
                          Edit
                        </Link>
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => toggleActive(programme)}>
                          {programme.is_active ? 'Hide' : 'Show'}
                        </button>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(programme)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
