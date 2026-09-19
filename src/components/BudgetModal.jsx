import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { formatCurrency, formatNumberWithDots, parseCleanNumber } from '../utils/storage';
import { getBudgetPresets } from '../data/categories';
import { useTranslation } from '../i18n/LanguageContext';

export const BudgetModal = ({
  isOpen,
  onClose,
  dailyBudget = 0,
  onUpdateDailyBudget,
  currency = 'Rp',
  currentUser = null
}) => {
  const { t, language } = useTranslation();
  const isRupiah = currency === 'Rp' || currency === 'IDR';

  const formatValue = (val) => {
    if (!val || val === 0) return '0';
    return isRupiah ? formatNumberWithDots(val, 'Rp') : String(val);
  };

  const [budgetInput, setBudgetInput] = useState(() => formatValue(dailyBudget));
  const modalRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const resetScroll = () => {
        if (modalRef.current) {
          modalRef.current.scrollTop = 0;
        }
      };
      resetScroll();
      const rAF = requestAnimationFrame(resetScroll);
      const t1 = setTimeout(resetScroll, 60);
      const t2 = setTimeout(resetScroll, 240);
      return () => {
        cancelAnimationFrame(rAF);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setBudgetInput(formatValue(dailyBudget));
    }
  }, [isOpen, dailyBudget, currency]);

  if (!isOpen) return null;

  const handleBudgetChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setBudgetInput('');
      return;
    }
    if (isRupiah) {
      const cleanDigits = raw.replace(/[^\d]/g, '');
      if (!cleanDigits) {
        setBudgetInput('0');
        return;
      }
      const num = parseInt(cleanDigits, 10);
      setBudgetInput(num.toLocaleString('id-ID'));
    } else {
      const cleaned = raw.replace(',', '.').replace(/[^\d.]/g, '');
      const parts = cleaned.split('.');
      const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
      setBudgetInput(formatted);
    }
  };

  const parsedVal = parseCleanNumber(budgetInput, isRupiah);

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (!isNaN(parsedVal) && parsedVal >= 0) {
      onUpdateDailyBudget(parsedVal);
      onClose();
    }
  };

  const presets = getBudgetPresets(currency);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content budget-dialog-card" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-text">
            <h2 className="modal-title">{t('budgetModal.title')}</h2>
            <p className="modal-subtitle">
              {!currentUser
                ? (language === 'en'
                    ? 'Set your daily limit (automatically saved to your account when you sign in)'
                    : 'Atur batas harian (otomatis disimpan ke akun Anda saat Anda masuk)')
                : t('budgetModal.subtitle')}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="budget-dialog-body">
          <div className="budget-callout-notice">
            <p>
              {!currentUser
                ? (language === 'en'
                    ? 'The limit amount you set here will be preserved and applied directly once you register or log in.'
                    : 'Nominal batas yang Anda tentukan di sini akan langsung disimpan dan diterapkan ke akun Anda begitu Anda masuk atau mendaftar.')
                : (language === 'en'
                    ? 'Target daily spending limit to stay on track. Dashboard indicators will visually warn you if spending exceeds 80% or passes the target.'
                    : 'Target batas pengeluaran harian yang ingin Anda kendalikan. Kartu ringkasan pada Dashboard akan otomatis memberi indikator warna saat pengeluaran mendekati atau melampaui batas ini.')}
            </p>
          </div>

          <form onSubmit={handleSaveBudget} className="budget-form-content">
            <div className="form-group">
              <label className="field-label" htmlFor="daily-budget-input">
                {t('budgetModal.inputLabel')}
              </label>
              <div className="budget-input-box">
                <span className="budget-currency-tag font-mono">{currency}</span>
                <input
                  id="daily-budget-input"
                  type="text"
                  inputMode="numeric"
                  placeholder={language === 'en' ? '0 (or leave empty for unlimited)' : '0 (atau kosongkan untuk tanpa batas)'}
                  className="budget-number-input font-mono"
                  value={budgetInput}
                  onChange={handleBudgetChange}
                  autoFocus={!isMobile}
                />
              </div>

              <div className="budget-preview-feedback">
                {parsedVal > 0 ? (
                  <div className="budget-active-feedback">
                    <span className="feedback-primary">
                      ✓ {language === 'en' ? 'Active Limit:' : 'Batas Aktif:'} {formatCurrency(parsedVal, currency)} {t('common.perDay')}
                    </span>
                    <span className="feedback-secondary font-mono">
                      {t('summary.monthlyProjection')}: {formatCurrency(parsedVal * 30, currency)}
                    </span>
                  </div>
                ) : (
                  <span className="budget-zero-feedback">
                    *{language === 'en'
                      ? `Limit ${currency} ∞ = Unlimited mode (expenses tracked freely without alerts)`
                      : `Batas ${currency} ∞ = Mode Bebas (seluruh pengeluaran dicatat tanpa batas limit harian)`}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Presets Grid */}
            <div className="budget-presets-wrapper">
              <span className="budget-presets-title">{t('budgetModal.quickPresetsLabel')}</span>
              <div className="budget-presets-grid">
                {presets.map((preset) => {
                  const isSelected = parsedVal === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      className={`budget-choice-pill font-mono ${isSelected ? 'is-active' : ''}`}
                      onClick={() => setBudgetInput(preset.value === 0 ? '0' : (isRupiah ? preset.value.toLocaleString('id-ID') : String(preset.value)))}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer-row">
              <button type="button" className="btn-secondary" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn-primary">
                {!currentUser
                  ? (language === 'en' ? 'Save & Continue' : 'Simpan & Lanjut Masuk')
                  : t('budgetModal.saveBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
