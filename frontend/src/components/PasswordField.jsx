import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

/**
 * Password input with a show/hide (eye) button and a Caps Lock warning,
 * so people can check what they typed before submitting.
 */
export default function PasswordField({
  id,
  label,
  value,
  onChange,
  name,
  hint,
  error,
  autoComplete = 'current-password',
  required = true,
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const checkCapsLock = (event) => setCapsLock(Boolean(event.getModifierState?.('CapsLock')));
  const describedBy =
    [hint ? `${id}-hint` : null, capsLock ? `${id}-caps` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={`form-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="form-hint">
          {hint}
        </p>
      ) : null}
      <div className="password-input">
        <input
          id={id}
          name={name || id}
          type={visible ? 'text' : 'password'}
          className="form-control"
          value={value}
          onChange={onChange}
          onKeyDown={checkCapsLock}
          onKeyUp={checkCapsLock}
          onBlur={() => setCapsLock(false)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          aria-controls={id}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={20} strokeWidth={2} aria-hidden="true" /> : <Eye size={20} strokeWidth={2} aria-hidden="true" />}
        </button>
      </div>
      {capsLock ? (
        <p id={`${id}-caps`} className="form-hint caps-warning" role="status">
          Caps Lock is on
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="form-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
