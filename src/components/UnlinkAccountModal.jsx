import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export const UnlinkAccountModal = ({
  isOpen,
  account,
  onClose,
  onConfirm
}) => {
  const { t, language } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !account) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="unlink-simple-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlink-dialog-title"
      >
        <div className="unlink-simple-header">
          <h4 id="unlink-dialog-title" className="unlink-simple-title">
            {language === 'en' ? 'Unlink Account' : 'Lepas Tautan Akun'}
          </h4>
          <button
            type="button"
            className="unlink-simple-close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={15} />
          </button>
        </div>

        <p className="unlink-simple-body">
          {language === 'en' ? (
            <>Unlink <strong>{account.name}</strong> ({account.email}) from this device?</>
          ) : (
            <>Lepas tautan akun <strong>{account.name}</strong> ({account.email}) dari perangkat ini?</>
          )}
        </p>

        <div className="unlink-simple-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => onConfirm(account)}
          >
            Unlink
          </button>
        </div>
      </div>
    </div>
  );
};
