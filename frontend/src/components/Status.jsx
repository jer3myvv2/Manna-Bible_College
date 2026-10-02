/** Loading, error and empty states used with every API call. */

export function Loader({ label = 'Loading…', inline = false }) {
  return (
    <div className={`loader ${inline ? 'loader-inline' : ''}`} role="status" aria-live="polite">
      <span className="loader-spinner" aria-hidden="true" />
      <span className="loader-label">{label}</span>
    </div>
  );
}

export function ErrorMessage({ error, onRetry, title = 'We could not load this content.' }) {
  const message = typeof error === 'string' ? error : error?.message;
  return (
    <div className="alert alert-error" role="alert">
      <p className="alert-title">{title}</p>
      {message ? <p>{message}</p> : null}
      {onRetry ? (
        <button type="button" className="btn btn-sm btn-outline" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ children }) {
  return <p className="empty-state">{children}</p>;
}
