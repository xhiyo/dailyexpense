import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Calendar } from 'lucide-react';
import { formatCurrency, formatCalendarSpend } from '../utils/storage';
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
    if (!dateStr) return new Date();
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

  // Base anchor date for the range
  const [baseDateStr, setBaseDateStr] = useState(selectedDate || todayStr);
  // Range offset: days relative to baseDateStr (initially 30 days past and 30 days future = 61 days)
  const [range, setRange] = useState({ left: -30, right: 30 });

  // Refs for tracking prepending scroll adjustments without jitter
  const isPrependingRef = useRef(false);
  const prevScrollWidthRef = useRef(0);

  // Mouse drag-to-scroll state for desktop
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged = useRef(false);

  // Fast O(1) expense lookup map
  const expenseMap = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      if (e.date) {
        map[e.date] = (map[e.date] || 0) + Number(e.amount || 0);
      }
    });
    return map;
  }, [expenses]);

  // If selectedDate changes from outside (e.g. date picker or analytics jump)
  // Check if it's within current range; if not, re-anchor baseDate
  useEffect(() => {
    if (!selectedDate) return;
    const base = parseLocalDate(baseDateStr);
    const sel = parseLocalDate(selectedDate);
    const diffDays = Math.round((sel - base) / (1000 * 60 * 60 * 24));

    if (diffDays < range.left - 5 || diffDays > range.right + 5) {
      setBaseDateStr(selectedDate);
      setRange({ left: -30, right: 30 });
    }
  }, [selectedDate, baseDateStr, range.left, range.right]);

  // Adjust scroll position after prepending items to left
  useLayoutEffect(() => {
    if (isPrependingRef.current && stripRef.current) {
      const newScrollWidth = stripRef.current.scrollWidth;
      const diff = newScrollWidth - prevScrollWidthRef.current;
      stripRef.current.scrollLeft += diff;
      isPrependingRef.current = false;
    }
  }, [range.left]);

  // Auto-scroll the active date pill into center view smoothly
  const scrollToActivePill = (behavior = 'smooth') => {
    if (stripRef.current) {
      const activeEl = stripRef.current.querySelector('.date-nav-pill-btn.is-selected');
      if (activeEl) {
        const container = stripRef.current;
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const relativeLeft = activeRect.left - containerRect.left + container.scrollLeft;
        const scrollLeftTarget = relativeLeft - (container.clientWidth / 2) + (activeEl.clientWidth / 2);
        container.scrollTo({
          left: Math.max(0, scrollLeftTarget),
          behavior
        });
      }
    }
  };

  // Initial center scroll on mount or when selectedDate changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToActivePill('smooth');
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedDate, baseDateStr]);

  // Infinite scroll event listener
  const handleScroll = () => {
    if (!stripRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = stripRef.current;

    // Near left edge (< 250px): prepend 20 days
    if (scrollLeft < 250 && !isPrependingRef.current) {
      prevScrollWidthRef.current = scrollWidth;
      isPrependingRef.current = true;
      setRange(prev => ({ ...prev, left: prev.left - 20 }));
    }
    // Near right edge (< 250px from end): append 20 days
    else if (scrollLeft + clientWidth > scrollWidth - 250) {
      setRange(prev => ({ ...prev, right: prev.right + 20 }));
    }
  };

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e) => {
    if (!stripRef.current) return;
    setIsDragging(true);
    dragStartX.current = e.pageX - stripRef.current.offsetLeft;
    dragScrollLeft.current = stripRef.current.scrollLeft;
    hasDragged.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !stripRef.current) return;
    const x = e.pageX - stripRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDragged.current = true;
    }
    stripRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

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
    const baseDate = parseLocalDate(baseDateStr);
    const days = [];
    for (let i = range.left; i <= range.right; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const iso = formatToISO(d);
      const dayTotal = expenseMap[iso] || 0;

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
  }, [baseDateStr, range.left, range.right, expenseMap, todayStr, selectedDate, locale]);

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
              title={language === 'en' ? 'Back to Today' : 'Kembali ke Hari Ini'}
            >
              <RotateCcw size={12} />
              <span>{language === 'en' ? 'Today' : 'Hari Ini'}</span>
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

      {/* Unlimited Continuous Sliding Pill Strip */}
      <div
        className={`date-nav-pill-strip ${isDragging ? 'is-dragging' : ''}`}
        ref={stripRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {dayStrip.map((day) => {
          const fullSpend = formatCurrency(day.total, currency);
          const displaySpend = formatCalendarSpend(day.total, currency, language);
          return (
            <button
              key={day.iso}
              type="button"
              className={`date-nav-pill-btn ${day.isSelected ? 'is-selected' : ''} ${day.isToday ? 'is-today' : ''}`}
              onClick={() => {
                if (hasDragged.current) return;
                onSelectDate(day.iso);
              }}
              title={`${day.weekday}, ${day.dayNumber} - ${fullSpend}`}
            >
              <span className="pill-weekday">{day.weekday}</span>
              <span className="pill-daynumber">{day.dayNumber}</span>
              <div className="pill-spend-slot" title={fullSpend}>
                {day.total > 0 ? (
                  <span className="pill-has-spend">
                    {displaySpend}
                  </span>
                ) : (
                  <span className="pill-zero-spend">
                    {displaySpend}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
