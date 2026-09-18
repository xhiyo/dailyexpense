import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { setCookieConsent, hasAnsweredCookieConsent } from '../utils/cookie';

export const CookieConsentBanner = ({ forceOpen = false, onClose = null }) => {
  const { language } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsVisible(true);
      return;
    }
    if (!hasAnsweredCookieConsent()) {
      setIsVisible(true);
    }
  }, [forceOpen]);

  const handleAccept = () => {
    setCookieConsent({
      necessary: true,
      preferences: true,
      analytics: true,
      status: 'accepted'
    });
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleDecline = () => {
    setCookieConsent({
      necessary: true,
      preferences: false,
      analytics: false,
      status: 'necessary_only'
    });
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-standard-bar">
      <div className="cookie-standard-content">
        <p className="cookie-standard-text">
          {language === 'en'
            ? 'We use cookies to enhance your browsing experience, save your session, and remember your settings.'
            : 'Situs ini menggunakan cookie untuk menyimpan sesi login dan preferensi Anda agar aplikasi berjalan optimal.'}
        </p>
        <div className="cookie-standard-actions">
          <button
            type="button"
            className="cookie-btn-decline"
            onClick={handleDecline}
          >
            {language === 'en' ? 'Decline' : 'Tolak'}
          </button>
          <button
            type="button"
            className="cookie-btn-accept"
            onClick={handleAccept}
          >
            {language === 'en' ? 'Accept' : 'Setuju'}
          </button>
        </div>
      </div>
    </div>
  );
};
