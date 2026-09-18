import React from 'react';
import { X, Share, PlusSquare, Smartphone, Check } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export const InstallPromptModal = ({ isOpen, onClose }) => {
  const { language } = useTranslation();

  if (!isOpen) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="install-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="install-modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="install-modal-header">
          <div className="install-modal-title-row">
            <div className="install-modal-icon-badge">
              <Smartphone size={22} className="text-primary" />
            </div>
            <div>
              <h3 className="install-modal-title">
                {language === 'en' ? 'Install SpendWise App' : 'Pasang Aplikasi SpendWise'}
              </h3>
              <p className="install-modal-subtitle">
                {language === 'en'
                  ? 'Fast, lightweight & works like a native app'
                  : 'Cepat, ringan & bekerja seperti aplikasi HP'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="install-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="install-modal-body">
          <div className="install-steps-list">
            {isIOS ? (
              <>
                <div className="install-step-item">
                  <div className="install-step-icon">
                    <Share size={18} />
                  </div>
                  <div className="install-step-text">
                    <strong>
                      {language === 'en' ? '1. Tap the Share button' : '1. Ketuk tombol Bagikan (Share)'}
                    </strong>
                    <span>
                      {language === 'en'
                        ? 'Located at the bottom bar in Safari'
                        : 'Ikon kotak dengan panah ke atas di bilah bawah Safari'}
                    </span>
                  </div>
                </div>

                <div className="install-step-item">
                  <div className="install-step-icon">
                    <PlusSquare size={18} />
                  </div>
                  <div className="install-step-text">
                    <strong>
                      {language === 'en'
                        ? '2. Select "Add to Home Screen"'
                        : '2. Pilih "Tambahkan ke Layar Utama"'}
                    </strong>
                    <span>
                      {language === 'en'
                        ? 'Scroll down and tap "Add to Home Screen"'
                        : 'Gulir ke bawah dan ketuk opsi Tambahkan ke Layar Utama'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="install-step-item">
                  <div className="install-step-icon">
                    <Smartphone size={18} />
                  </div>
                  <div className="install-step-text">
                    <strong>
                      {language === 'en' ? '1. Browser Menu' : '1. Buka Menu Browser'}
                    </strong>
                    <span>
                      {language === 'en'
                        ? 'Tap the three dots (⋮) icon in Chrome or your browser'
                        : 'Ketuk ikon titik tiga (⋮) di pojok kanan atas browser'}
                    </span>
                  </div>
                </div>

                <div className="install-step-item">
                  <div className="install-step-icon">
                    <PlusSquare size={18} />
                  </div>
                  <div className="install-step-text">
                    <strong>
                      {language === 'en'
                        ? '2. Install or Add to Home Screen'
                        : '2. Pilih "Pasang Aplikasi" / "Tambahkan"'}
                    </strong>
                    <span>
                      {language === 'en'
                        ? 'Tap "Install app" or "Add to Home screen"'
                        : 'Pilih opsi Pasang Aplikasi atau Tambahkan ke Layar Utama'}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="install-step-item is-highlight">
              <div className="install-step-icon text-success">
                <Check size={18} />
              </div>
              <div className="install-step-text">
                <strong className="text-success">
                  {language === 'en' ? 'Done!' : 'Selesai!'}
                </strong>
                <span>
                  {language === 'en'
                    ? 'SpendWise will appear on your Home Screen without browser address bars'
                    : 'SpendWise langsung muncul di Home Screen HP Anda tanpa baris URL'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="install-modal-footer">
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 16px' }}
            onClick={onClose}
          >
            <span>{language === 'en' ? 'Got It!' : 'Saya Mengerti'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
