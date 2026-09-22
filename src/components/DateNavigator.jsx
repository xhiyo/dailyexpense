import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Calendar } from 'lucide-react';
import { formatCurrency, formatCalendarSpend } from '../utils/storage';
import { useTranslation } from '../i18n/LanguageContext';

// Fixed, stable window: 15 days in the past and 15 days in future (31 days total, ~1 full month)
// Avoids 90-day offsets that caused June bugs and eliminates infinite scroll jitter.
const RANGE_OFFSET = 15;

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

  // Base anchor date for the ±15-day range window
  const [baseDateStr, setBaseDateStr] = useState(selectedDate || todayStr);

  const hasInitialCenteredRef = useRef(false);
  const userTappedPillRef = useRef(false);

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

  // If selectedDate changes from outside (picker, arrows, today button)
  // and moves outside the comfortable ±12 day buffer, re-anchor baseDateStr
  useEffect(() => {
    if (!selectedDate) return;
    const base = parseLocalDate(baseDateStr);
    const sel = parseLocalDate(selectedDate);
    const diffDays = Math.round((sel - base) / (1000 * 60 * 60 * 24));

    if (Math.abs(diffDays) > 12) {
      setBaseDateStr(selectedDate);
    }
  }, [selectedDate, baseDateStr]);

  // Center the selected date pill inside the strip container
  const centerSelectedPill = useCallback((behavior = 'auto') => {
    const container = stripRef.current;
    if (!container || container.clientWidth === 0) return false;
    const activeEl = container.querySelector('.date-nav-pill-btn.is-selected');
    if (activeEl) {
      const scrollLeftTarget = activeEl.offsetLeft - (container.clientWidth / 2) + (activeEl.clientWidth / 2);
      if (behavior === 'auto') {
        container.scrollLeft = Math.max(0, scrollLeftTarget);
      } else {
        container.scrollTo({
          left: Math.max(0, scrollLeftTarget),
          behavior: 'smooth'
        });
      }
      return true;
    }
    return false;
  }, []);

  // Instant positioning before first paint (zero flash, zero layout jump)
  useLayoutEffect(() => {
    const centered = centerSelectedPill('auto');
    if (centered) {
      hasInitialCenteredRef.current = true;
    }
  }, [baseDateStr, centerSelectedPill]);

  // Robust observer fallback for cases where initial layout width was 0 (e.g. during tab animations)
  useEffect(() => {
    if (hasInitialCenteredRef.current || !stripRef.current) return;

    if (centerSelectedPill('auto')) {
      hasInitialCenteredRef.current = true;
      return;
    }

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (!hasInitialCenteredRef.current) {
          if (centerSelectedPill('auto')) {
            hasInitialCenteredRef.current = true;
            if (ro) ro.disconnect();
          }
        }
      });
      ro.observe(stripRef.current);
    }

    const timer = setTimeout(() => {
      if (!hasInitialCenteredRef.current) {
        if (centerSelectedPill('auto')) {
          hasInitialCenteredRef.current = true;
        }
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      if (ro) ro.disconnect();
    };
  }, [centerSelectedPill]);

  // Smooth scroll when selectedDate changes from outside (e.g. arrows, today button, date picker)
  // NEVER force-scroll if the user tapped a pill in the strip (prevents "geser sendiri")
  useEffect(() => {
    if (!selectedDate || !hasInitialCenteredRef.current) return;

    if (userTappedPillRef.current) {
      userTappedPillRef.current = false;
      return;
    }

    centerSelectedPill('smooth');
  }, [selectedDate, centerSelectedPill]);

  // Mobile Touch Gestures: accurately distinguish swipes from deliberate taps
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const swipeEndTime = useRef(0);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartX.current);
    const dy = Math.abs(touch.clientY - touchStartY.current);
    if (dx > 8 || dy > 8) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (isSwiping.current) {
      swipeEndTime.current = Date.now();
      setTimeout(() => {
        isSwiping.current = false;
      }, 200);
    }
  };

  const handleTouchCancel = () => {
    isSwiping.current = false;
  };

  // Desktop Mouse Drag to Scroll
  const [isMouseDown, setIsMouseDown] = useState(false);
  const mouseStartX = useRef(0);
  const mouseScrollLeft = useRef(0);
  const hasMouseDragged = useRef(false);

  const handleMouseDown = (e) => {
    if (e.button !== 0 || !stripRef.current) return;
    setIsMouseDown(true);
    mouseStartX.current = e.pageX;
    mouseScrollLeft.current = stripRef.current.scrollLeft;
    hasMouseDragged.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown || !stripRef.current) return;
    const walk = e.pageX - mouseStartX.current;
    if (Math.abs(walk) > 5) {
      hasMouseDragged.current = true;
    }
    stripRef.current.scrollLeft = mouseScrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  // Deliberate Pill Click
  const handlePillClick = (dayIso) => {
    // If user was swiping or dragging, suppress accidental click
    if (isSwiping.current || (Date.now() - swipeEndTime.current < 200)) {
      return;
    }
    if (hasMouseDragged.current) {
      return;
    }

    if (dayIso === selectedDate) {
      return;
    }

    userTappedPillRef.current = true;
    onSelectDate(dayIso);
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

  // Generate stable 31-day strip around baseDateStr
  const dayStrip = useMemo(() => {
    const baseDate = parseLocalDate(baseDateStr);
    const days = [];
    for (let i = -RANGE_OFFSET; i <= RANGE_OFFSET; i++) {
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
  }, [baseDateStr, expenseMap, todayStr, selectedDate, locale]);

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

      {/* Smooth, Stable Sliding Pill Strip */}
      <div
        className={`date-nav-pill-strip ${isMouseDown ? 'is-dragging' : ''}`}
        ref={stripRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
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
              onClick={() => handlePillClick(day.iso)}
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
