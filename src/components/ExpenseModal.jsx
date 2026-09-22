import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Calendar, Clock, CreditCard, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { CATEGORIES, PAYMENT_METHODS, getQuickAmountChips } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';
import { formatNumberWithDots, parseCleanNumber } from '../utils/storage';
import { useTranslation } from '../i18n/LanguageContext';

export const ExpenseModal = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  defaultDate,
  currency = 'Rp',
  categories = CATEGORIES,
  onOpenCategoryModal
}) => {
  const { t, language, localizeCategoryName } = useTranslation();
  const isRupiah = currency === 'Rp' || currency === 'IDR';

  const formatToISO = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = useMemo(() => formatToISO(new Date()), []);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate || todayStr);
  const [time, setTime] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'food');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [showAllCategories, setShowAllCategories] = useState(false);
  const modalContentRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Always reset modal scroll position to top when opened
  useEffect(() => {
    if (isOpen) {
      const resetScroll = () => {
        if (modalContentRef.current) {
          modalContentRef.current.scrollTop = 0;
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
    if (expenseToEdit) {
      setTitle(expenseToEdit.title || '');
      setAmount(
        expenseToEdit.amount !== undefined
          ? (isRupiah ? formatNumberWithDots(Math.round(expenseToEdit.amount), 'Rp') : String(expenseToEdit.amount))
          : ''
      );
      setDate(expenseToEdit.date || defaultDate);
      setTime(expenseToEdit.time || '');
      setCategoryId(expenseToEdit.categoryId || categories[0]?.id || 'food');
      setPaymentMethod(expenseToEdit.paymentMethod || 'wallet');
      setNotes(expenseToEdit.notes || '');
    } else {
      setTitle('');
      setAmount('');
      setDate(defaultDate || todayStr);
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setCategoryId(categories[0]?.id || 'food');
      setPaymentMethod('wallet');
      setNotes('');
    }
    setErrors({});
  }, [expenseToEdit, defaultDate, isOpen, categories, currency, isRupiah, todayStr]);

  if (!isOpen) return null;

  const handleQuickAddAmount = (addValue) => {
    const current = parseCleanNumber(amount, isRupiah);
    const updated = Math.round((current + addValue) * 100) / 100;
    setAmount(isRupiah ? formatNumberWithDots(updated, 'Rp') : String(updated));
    if (errors.amount) setErrors(prev => ({ ...prev, amount: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    const numAmount = parseCleanNumber(amount, isRupiah);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = language === 'en' ? 'Please enter a valid amount' : 'Mohon masukkan nominal yang valid';
    }

    if (!title.trim()) {
      newErrors.title = language === 'en' ? 'Please enter expense title' : 'Mohon isi nama pengeluaran';
    }

    if (!date) {
      newErrors.date = language === 'en' ? 'Please select a date' : 'Mohon pilih tanggal';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const expenseData = {
      id: expenseToEdit ? expenseToEdit.id : `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: title.trim(),
      amount: numAmount,
      date,
      time: time || '12:00',
      categoryId,
      paymentMethod,
      notes: notes.trim(),
      createdAt: expenseToEdit?.createdAt || Date.now()
    };

    onSave(expenseData);
  };

  const allCats = categories || CATEGORIES;
  let visibleCategories = allCats;
  if (!showAllCategories && allCats.length > 4) {
    const first4 = allCats.slice(0, 4);
    const isSelectedInFirst4 = first4.some((c) => c.id === categoryId);
    if (isSelectedInFirst4) {
      visibleCategories = first4;
    } else {
      const selectedCat = allCats.find((c) => c.id === categoryId);
      visibleCategories = selectedCat ? [...allCats.slice(0, 3), selectedCat] : first4;
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-content"
        ref={modalContentRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div>
            <h2 className="modal-title">
              {expenseToEdit ? t('modal.editTitle') : t('modal.addTitle')}
            </h2>
            <p className="modal-subtitle">
              {expenseToEdit
                ? (language === 'en' ? 'Update your transaction details' : 'Perbarui detail transaksi pengeluaran')
                : (language === 'en' ? 'Record daily spending details' : 'Catat detail pengeluaran harian Anda')}
            </p>
          </div>
          <button
            id="close-expense-modal-btn"
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('common.close')}
            title={t('common.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* 1. Amount */}
          <div className="form-group">
            <label className="field-label" htmlFor="expense-amount">
              {t('modal.fieldAmount')} ({currency})
            </label>
            <div className={`amount-input-container ${errors.amount ? 'input-error' : ''}`}>
              <span className="amount-currency-symbol font-mono">{currency}</span>
              <input
                id="expense-amount"
                type="text"
                inputMode={isRupiah ? 'numeric' : 'decimal'}
                placeholder="0"
                className="amount-input font-mono"
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (isRupiah) {
                    const digits = raw.replace(/[^\d]/g, '');
                    if (!digits) {
                      setAmount('');
                    } else {
                      const num = parseInt(digits, 10);
                      setAmount(num.toLocaleString('id-ID'));
                    }
                  } else {
                    const cleaned = raw.replace(',', '.').replace(/[^\d.]/g, '');
                    const parts = cleaned.split('.');
                    const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
                    setAmount(formatted);
                  }
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: null }));
                }}
                autoFocus={!isMobile}
              />
            </div>
            {errors.amount && <span className="field-error-msg">{errors.amount}</span>}

            {/* Quick Nominal Chips */}
            <div className="quick-amount-tags">
              <span className="quick-amount-label">{t('modal.quickChipsLabel')}</span>
              {getQuickAmountChips(currency).map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  className="quick-amount-btn font-mono"
                  onClick={() => handleQuickAddAmount(chip.value)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Description / Note */}
          <div className="form-group">
            <label className="field-label" htmlFor="expense-title">
              {t('modal.fieldTitle')}
            </label>
            <input
              id="expense-title"
              type="text"
              placeholder={t('modal.fieldTitlePlaceholder')}
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: null }));
              }}
            />
            {errors.title && <span className="field-error-msg">{errors.title}</span>}
          </div>

          {/* 3. Category (Max 4 by default + expand toggle) */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="field-label">{t('modal.fieldCategory')}</label>
              {onOpenCategoryModal && (
                <button
                  type="button"
                  className="btn-text-action"
                  onClick={onOpenCategoryModal}
                >
                  <Tag size={12} /> {t('nav.categories')}
                </button>
              )}
            </div>
            <div className="category-pill-wrap">
              {visibleCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                const catName = localizeCategoryName(cat);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-pill-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => setCategoryId(cat.id)}
                    style={{
                      '--cat-accent': cat.color || 'var(--accent-primary)'
                    }}
                  >
                    <span className="category-pill-icon">
                      <CategoryIcon name={cat.icon} size={15} color={isSelected ? '#ffffff' : cat.color} />
                    </span>
                    <span className="category-pill-text">{catName}</span>
                  </button>
                );
              })}

              {allCats.length > 4 && (
                <button
                  type="button"
                  className="category-pill-btn category-pill-toggle"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  title={
                    showAllCategories
                      ? (language === 'en' ? 'Show less categories' : 'Tampilkan lebih sedikit')
                      : (language === 'en' ? 'View all categories' : 'Lihat semua kategori')
                  }
                >
                  {showAllCategories ? (
                    <>
                      <ChevronUp size={14} />
                      <span className="category-pill-text">{language === 'en' ? 'Show Less' : 'Lebih Sedikit'}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      <span className="category-pill-text">
                        {language === 'en'
                          ? `+${allCats.length - 4} More`
                          : `+${allCats.length - 4} Lainnya`}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 4. Date & Time (Clean, Native Mobile 2-Column Row) */}
          <div className="expense-datetime-row">
            <div className="form-group">
              <label className="field-label" htmlFor="expense-date">
                <Calendar size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                {t('modal.fieldDate')}
              </label>
              <input
                id="expense-date"
                type="date"
                className={`form-input expense-date-input ${errors.date ? 'input-error' : ''}`}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors(prev => ({ ...prev, date: null }));
                }}
              />
              {errors.date && <span className="field-error-msg">{errors.date}</span>}
            </div>

            <div className="form-group">
              <label className="field-label" htmlFor="expense-time">
                <Clock size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                {language === 'en' ? 'Time' : 'Waktu'}
              </label>
              <input
                id="expense-time"
                type="time"
                className="form-input expense-time-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* 5. Payment Method */}
          <div className="form-group">
            <label className="field-label" htmlFor="expense-method">
              <CreditCard size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {language === 'en' ? 'Payment Method' : 'Metode Pembayaran'}
            </label>
            <select
              id="expense-method"
              className="select-input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Additional Notes (Optional) */}
          <div className="form-group">
            <label className="field-label" htmlFor="expense-notes">
              <Tag size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {t('modal.fieldNotes')}
            </label>
            <input
              id="expense-notes"
              type="text"
              placeholder={t('modal.fieldNotesPlaceholder')}
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              id="save-expense-submit-btn"
              className="btn btn-primary"
            >
              {expenseToEdit ? t('modal.updateBtn') : t('modal.saveBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
