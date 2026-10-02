import { useCallback, useState } from 'react';
import { getErrorMessage, getFieldErrors } from '../api/client';

/**
 * Track a mutation (save / delete) with busy, error and success messages.
 *
 *   const [status, run] = useAction();
 *   const result = await run(() => updateLevel(id, data), 'Level saved.');
 *   if (result.ok) ...
 */
export default function useAction() {
  const [status, setStatus] = useState({ busy: false, error: '', success: '', fields: {} });

  const run = useCallback(async (action, successMessage = '') => {
    setStatus({ busy: true, error: '', success: '', fields: {} });
    try {
      const data = await action();
      setStatus({ busy: false, error: '', success: successMessage, fields: {} });
      return { ok: true, data };
    } catch (error) {
      setStatus({ busy: false, error: getErrorMessage(error), success: '', fields: getFieldErrors(error) });
      return { ok: false, error };
    }
  }, []);

  const clear = useCallback(() => setStatus({ busy: false, error: '', success: '', fields: {} }), []);

  return [status, run, clear];
}
