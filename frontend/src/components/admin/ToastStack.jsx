import { ClipboardList, Mail, X } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminNotifications } from '../../context/AdminNotifications';

const TOAST_MS = 9000;

function Toast({ toast, onDismiss, onOpen }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.toastId), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast.toastId, onDismiss]);

  return (
    <div className="toast">
      <span className="toast-icon" aria-hidden="true">
        {toast.type === 'application' ? <ClipboardList size={18} /> : <Mail size={18} />}
      </span>
      <div className="toast-text">
        <strong>{toast.title}</strong>
        <p>{toast.body}</p>
        <button type="button" className="toast-open" onClick={() => onOpen(toast)}>
          View
        </button>
      </div>
      <button type="button" className="toast-close" onClick={() => onDismiss(toast.toastId)} aria-label="Dismiss">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Pop-up cards for new applications and messages (bottom-right). */
export default function ToastStack() {
  const { toasts, dismissToast } = useAdminNotifications();
  const navigate = useNavigate();

  const open = (toast) => {
    dismissToast(toast.toastId);
    navigate(toast.link);
  };

  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.toastId} toast={toast} onDismiss={dismissToast} onOpen={open} />
      ))}
    </div>
  );
}
