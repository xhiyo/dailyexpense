import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="toast-container" aria-live="polite">
      <div className={`toast-pill toast-${type}`}>
        <div className="toast-icon">
          {type === 'success' && <CheckCircle2 size={18} className="text-success" />}
          {type === 'error' && <AlertCircle size={18} className="text-danger" />}
          {type === 'info' && <Info size={18} className="text-accent" />}
        </div>
        <span className="toast-message">{message}</span>
        <button type="button" className="toast-close" onClick={onClose} aria-label="Close notification">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
