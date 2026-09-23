import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Calendar } from 'lucide-react';
import { formatCurrency, formatCalendarSpend } from '../utils/storage';
import { useTranslation } from '../i18n/LanguageContext';

// Stable ±15 day window around base anchor (31 days total, ~1 full month)
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

  const parseLocalDate = useCallback((dateStr) => {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) {
      return isNaN(dateStr.getTime()) ? new Date() : new Date(dateStr.getTime());
    }
    const cleanStr = String(dateStr).split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    const fallback = new Date(cleanStr);
    return isNaN(fallback.getTime()) ? new Date() : fallback;
  }, []);

  const formatToISO = useCallback((d) => {
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      d = new Date();
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Always compute current date fresh so next-day rollover is instantaneous
  const todayStr = formatToISO(new Date());
  const isSelectedToday = (selectedDate || todayStr) === todayStr;

  // Base anchor date for the ±15-day range window
  const [baseDateStr, setBaseDateStr] = useState(() => selectedDate || todayStr);

  const isInitialMountRef = useRef(true);
  const lastScrollOrDragTime = useRef(0);
  const isMouseDown = useRef(false);
  const mouseStartX = useRef(0);
  const mouseScrollLeft = useRef(0);
  const hasMouseDragged = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

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

  // Center the selected date pill inside the strip container with sub-pixel precision
  const centerSelectedPill = useCallback((behavior = 'auto') => {
    const container = stripRef.current;
    if (!container) return false;
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0) return false;

    const activeEl = container.querySelector('.date-nav-pill-btn.is-selected');
    if (!activeEl) return false;

    const activeRect = activeEl.getBoundingClientRect();
    const activeCenter = (activeRect.left - containerRect.left) + container.scrollLeft + (activeRect.width / 2);
    const scrollTarget = activeCenter - (containerRect.width / 2);
    const maxScroll = Math.max(0, container.scrollWidth - containerRect.width);
    const finalScroll = Math.max(0, Math.min(scrollTarget, maxScroll));

    if (behavior === 'auto') {
      container.scrollLeft = finalScroll;
    } else {
      container.scrollTo({
        left: finalScroll,
        behavior: 'smooth'
      });
    }
    return true;
  }, []);

  // Instant positioning before first paint (zero layout jump, zero flash of leftmost date)
  useLayoutEffect(() => {
    centerSelectedPill('auto');
  }, [baseDateStr, centerSelectedPill]);

  // Immediate frame fallback for cases where initial layout width was 0 during tab mount
  useEffect(() => {
    const animId = requestAnimationFrame(() => {
      centerSelectedPill('auto');
    });

    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && stripRef.current) {
      ro = new ResizeObserver(() => {
        if (isInitialMountRef.current) {
          centerSelectedPill('auto');
        }
      });
      ro.observe(stripRef.current);
    }

    return () => {
      cancelAnimationFrame(animId);
      if (ro) ro.disconnect();
    };
  }, [centerSelectedPill]);

  // Handle selectedDate changes after initial mount
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (!selectedDate) return;

    const base = parseLocalDate(baseDateStr);
    const sel = parseLocalDate(selectedDate);
    const diffDays = Math.round((sel - base) / (1000 * 60 * 60 * 24));

    if (Math.abs(diffDays) > 12) {
      // Re-anchor window to selected date (useLayoutEffect will instantly center it)
      setBaseDateStr(selectedDate);
    } else {
      // Smoothly glide to center for nearby day selection
      centerSelectedPill('smooth');
    }
  }, [selectedDate, baseDateStr, centerSelectedPill, parseLocalDate]);

  // Desktop Mouse Drag with Global Window Listeners (prevents stuck drag states)
  const handleMouseDown = (e) => {
    if (e.button !== 0 || !stripRef.current) return;
    isMouseDown.current = true;
    mouseStartX.current = e.pageX;
    mouseScrollLeft.current = stripRef.current.scrollLeft;
    hasMouseDragged.current = false;
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isMouseDown.current || !stripRef.current) return;
      const walk = e.pageX - mouseStartX.current;
      if (Math.abs(walk) > 5) {
        hasMouseDragged.current = true;
        setIsDraggingState(true);
      }
      stripRef.current.scrollLeft = mouseScrollLeft.current - walk;
    };

    const handleGlobalMouseUp = () => {
      if (isMouseDown.current) {
        isMouseDown.current = false;
        setIsDraggingState(false);
        if (hasMouseDragged.current) {
          lastScrollOrDragTime.current = Date.now();
          setTimeout(() => {
            hasMouseDragged.current = false;
          }, 150);
        }
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleScroll = () => {
    lastScrollOrDragTime.current = Date.now();
  };

  // Deliberate Pill Click
  const handlePillClick = (dayIso) => {
    // If user was dragging or scrolling in the last 150ms, suppress click
    if (hasMouseDragged.current || (Date.now() - lastScrollOrDragTime.current < 150)) {
      return;
    }

    if (dayIso === selectedDate) {
      centerSelectedPill('smooth');
      return;
    }

    onSelectDate(dayIso);
  };

  const handleShiftDay = (delta) => {
    const current = parseLocalDate(selectedDate || todayStr);
    current.setDate(current.getDate() + delta);
    onSelectDate(formatToISO(current));
  };

  const handleJumpToToday = () => {
    const today = formatToISO(new Date());
    setBaseDateStr(today);
    onSelectDate(today);
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
        isSelected: iso === (selectedDate || todayStr)
      });
    }
    return days;
  }, [baseDateStr, expenseMap, todayStr, selectedDate, locale, parseLocalDate, formatToISO]);

  const selectedDateObject = parseLocalDate(selectedDate || todayStr);
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
              onClick={handleJumpToToday}
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
              value={selectedDate || todayStr}
              onChange={(e) => {
                if (e.target.value) {
                  setBaseDateStr(e.target.value);
                  onSelectDate(e.target.value);
                }
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
        className={`date-nav-pill-strip ${isDraggingState ? 'is-dragging' : ''}`}
        ref={stripRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
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
