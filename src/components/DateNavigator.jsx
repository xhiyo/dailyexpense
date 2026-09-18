import React, { useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/storage';
import { useTranslation } from '../i18n/LanguageContext';

export const DateNavigator = ({
  selectedDate,
  onSelectDate,
  expenses = [],
  currency = 'Rp'
}) => {
  const { t, language } = useTranslation();
  const dateInputRef = useRef(null);
  const stripRef = useRef(null);
  const locale = language === 'en' ? 'en-US' : 'id-ID';

  const parseLocalDate = (dateStr) => {
    const parts = dateStr.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const formatToISO = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = useMemo(() => formatToISO(new Date()), []);
  const isSelectedToday = selectedDate === todayStr;

  // Auto-scroll the active date pill into view on mobile
  useEffect(() => {
    if (stripRef.current) {
      const activeEl = stripRef.current.querySelector('.date-nav-pill-btn.is-selected');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }
    }
  }, [selectedDate]);

  const handleShiftDay = (delta) => {
    const current = parseLocalDate(selectedDate);
    current.setDate(current.getDate() + delta);
    onSelectDate(formatToISO(current));
  };

  const handleOpenPicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
          return;
        } catch (_) {
          // fallback
        }
      }
      dateInputRef.current.focus();
    }
  };

  const dayStrip = useMemo(() => {
    const baseDate = parseLocalDate(selectedDate);
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const iso = formatToISO(d);
      
      const dayTotal = expenses
        .filter(e => e.date === iso)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      days.push({
        iso,
        date: d,
        weekday: d.toLocaleDateString(locale, { weekday: 'short' }),
        dayNumber: d.getDate(),
        total: dayTotal,
        isToday: iso === todayStr,
        isSelected: iso === selectedDate
      });
    }
    return days;
  }, [selectedDate, expenses, todayStr, locale]);

  const selectedDateObject = parseLocalDate(selectedDate);
  const formattedFullDate = selectedDateObject.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="modern-date-nav-wrapper">
      {/* Top Bar: Clean Date Title & Controls */}
      <div className="date-nav-topbar">
        <div className="date-nav-current-info">
          <h2 className="date-nav-heading">{formattedFullDate}</h2>
          {isSelectedToday ? (
            <span className="date-nav-today-tag">{t('date.today')}</span>
          ) : (
            <button
              type="button"
              className="date-nav-jump-today"
              onClick={() => onSelectDate(todayStr)}
            >
              <RotateCcw size={12} />
              {language === 'en' ? 'Back to Today' : 'Kembali ke Hari Ini'}
            </button>
          )}
        </div>

        <div className="date-nav-controls">
          <button
            type="button"
            className="date-nav-arrow"
            onClick={() => handleShiftDay(-1)}
            title={language === 'en' ? 'Previous day' : 'Hari Sebelumnya'}
            aria-label="Previous day"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="date-nav-picker-wrap" title={t('date.selectDate')}>
            <button
              type="button"
              className="date-nav-picker-button"
              onClick={handleOpenPicker}
            >
              <Calendar size={14} className="date-nav-picker-icon" />
              <span>{t('date.selectDate')}</span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              className="date-nav-hidden-input"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) onSelectDate(e.target.value);
              }}
              onClick={(e) => {
                if (typeof e.currentTarget.showPicker === 'function') {
                  try {
                    e.currentTarget.showPicker();
                  } catch (_) {
                    // ignore
                  }
                }
              }}
              aria-label={t('date.selectDate')}
            />
          </div>

          <button
            type="button"
            className="date-nav-arrow"
            onClick={() => handleShiftDay(1)}
            title={language === 'en' ? 'Next day' : 'Hari Berikutnya'}
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Symmetric 7-Day Pill Selector with Identical Heights */}
      <div className="date-nav-pill-strip" ref={stripRef}>
        {dayStrip.map((day) => (
          <button
            key={day.iso}
            type="button"
            className={`date-nav-pill-btn ${day.isSelected ? 'is-selected' : ''} ${day.isToday ? 'is-today' : ''}`}
            onClick={() => onSelectDate(day.iso)}
          >
            <span className="pill-weekday">{day.weekday}</span>
            <span className="pill-daynumber font-mono">{day.dayNumber}</span>
            <div className="pill-spend-slot">
              {day.total > 0 ? (
                <span className="pill-has-spend font-mono">
                  {formatCurrency(day.total, currency)}
                </span>
              ) : (
                <span className="pill-zero-spend font-mono">
                  {formatCurrency(0, currency)}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
