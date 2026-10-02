/**
 * Labelled form control with hint and error message wired up for screen readers.
 * Renders an <input> by default; pass as="select" or as="textarea" for others.
 */
export default function FormField({
  id,
  label,
  error,
  hint,
  required = false,
  as = 'input',
  children,
  className = '',
  ...inputProps
}) {
  const Control = as;
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ');
  return (
    <div className={`form-field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required ? (
          <span className="form-required" aria-hidden="true">
            {' '}*
          </span>
        ) : (
          <span className="form-optional"> (optional)</span>
        )}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="form-hint">
          {hint}
        </p>
      ) : null}
      <Control
        id={id}
        name={id}
        className="form-control"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        aria-required={required || undefined}
        {...inputProps}
      >
        {children}
      </Control>
      {error ? (
        <p id={`${id}-error`} className="form-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
