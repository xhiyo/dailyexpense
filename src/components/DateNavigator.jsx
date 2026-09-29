import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Calendar } from 'lucide-react';
import { formatCurrency, formatCalendarSpend } from '../utils/storage';
import { useTranslation } from '../i18n/LanguageContext';

// Infinite scroll configuration
const INITIAL_PAST_DAYS = 60;   // ~2 months buffer in past
const INITIAL_FUTURE_DAYS = 60; // ~2 months buffer in future
const EXPAND_CHUNK = 45;        // Prepend/append 45 days (~1.5 months) when nearing boundaries
const SCROLL_THRESHOLD = 600;   // Distance in px from edge to trigger expansion

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

  // Current date
  const todayStr = formatToISO(new Date());
  const isSelectedToday = (selectedDate || todayStr) === todayStr;

  // Base anchor date and dynamic infinite buffer days
  const [baseDateStr, setBaseDateStr] = useState(() => selectedDate || todayStr);
  const [pastDays, setPastDays] = useState(INITIAL_PAST_DAYS);
  const [futureDays, setFutureDays] = useState(INITIAL_FUTURE_DAYS);

  const isInitialMountRef = useRef(true);
  const isReadyRef = useRef(false);
  const isExpandingPastRef = useRef(false);
  const isExpandingFutureRef = useRef(false);
  const prevScrollWidthRef = useRef(0);

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

  // Center the selected date pill inside the strip container
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

  // Instant positioning before first paint when base date changes or on mount
  useLayoutEffect(() => {
    centerSelectedPill('auto');
    isReadyRef.current = true;
  }, [baseDateStr, centerSelectedPill]);

  // Synchronously compensate scroll offset when prepending past days to eliminate visual jump
  useLayoutEffect(() => {
    if (isExpandingPastRef.current && stripRef.current) {
      const newScrollWidth = stripRef.current.scrollWidth;
      const delta = newScrollWidth - prevScrollWidthRef.current;
      if (delta > 0) {
        stripRef.current.scrollLeft += delta;
        if (isMouseDown.current) {
          mouseScrollLeft.current += delta;
        }
      }
      isExpandingPastRef.current = false;
    }
    if (isExpandingFutureRef.current) {
      isExpandingFutureRef.current = false;
    }
  }, [pastDays, futureDays]);

  // ResizeObserver fallback for zero-width tab initial mount
  useEffect(() => {
    const animId = requestAnimationFrame(() => {
      centerSelectedPill('auto');
      isReadyRef.current = true;
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

  // Check infinite scroll boundary thresholds
  const checkInfiniteScroll = useCallback(() => {
    const container = stripRef.current;
    if (!container || !isReadyRef.current || container.clientWidth === 0) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    // Approaching left edge (past dates)
    if (scrollLeft < SCROLL_THRESHOLD && !isExpandingPastRef.current) {
      isExpandingPastRef.current = true;
      prevScrollWidthRef.current = scrollWidth;
      setPastDays(prev => prev + EXPAND_CHUNK);
    }

    // Approaching right edge (future dates)
    const distanceToRight = scrollWidth - (scrollLeft + clientWidth);
    if (distanceToRight < SCROLL_THRESHOLD && !isExpandingFutureRef.current) {
      isExpandingFutureRef.current = true;
      setFutureDays(prev => prev + EXPAND_CHUNK);
    }
  }, []);

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

    // If selected date is near or outside the loaded window, re-anchor around selectedDate
    if (diffDays <= -pastDays + 10 || diffDays >= futureDays - 10) {
      isReadyRef.current = false;
      setBaseDateStr(selectedDate);
      setPastDays(INITIAL_PAST_DAYS);
      setFutureDays(INITIAL_FUTURE_DAYS);
    } else {
      // Smoothly glide to center for nearby day selection
      centerSelectedPill('smooth');
    }
  }, [selectedDate, baseDateStr, pastDays, futureDays, centerSelectedPill, parseLocalDate]);

  // Desktop Mouse Drag with Global Window Listeners
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
      checkInfiniteScroll();
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
  }, [checkInfiniteScroll]);

  // Desktop Mouse Wheel Listener: converts vertical mouse wheel over strip to horizontal infinite scroll
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      const isTrackpadHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = isTrackpadHorizontal ? e.deltaX : e.deltaY;

      if (delta !== 0) {
        e.preventDefault();
        el.scrollLeft += delta;
        lastScrollOrDragTime.current = Date.now();
        checkInfiniteScroll();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [checkInfiniteScroll]);

  // Handle native scroll event (covers mobile touch scroll and desktop momentum)
  const handleScroll = () => {
    lastScrollOrDragTime.current = Date.now();
    checkInfiniteScroll();
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
    const nextIso = formatToISO(current);

    const base = parseLocalDate(baseDateStr);
    const diffDays = Math.round((current - base) / (1000 * 60 * 60 * 24));

    if (diffDays <= -pastDays + 15) {
      if (!isExpandingPastRef.current) {
        isExpandingPastRef.current = true;
        if (stripRef.current) {
          prevScrollWidthRef.current = stripRef.current.scrollWidth;
        }
        setPastDays(prev => prev + EXPAND_CHUNK);
      }
    } else if (diffDays >= futureDays - 15) {
      if (!isExpandingFutureRef.current) {
        isExpandingFutureRef.current = true;
        setFutureDays(prev => prev + EXPAND_CHUNK);
      }
    }

    onSelectDate(nextIso);
  };

  const handleJumpToToday = () => {
    const today = formatToISO(new Date());
    const base = parseLocalDate(baseDateStr);
    const sel = parseLocalDate(today);
    const diffDays = Math.round((sel - base) / (1000 * 60 * 60 * 24));

    if (Math.abs(diffDays) > 30) {
      isReadyRef.current = false;
      setBaseDateStr(today);
      setPastDays(INITIAL_PAST_DAYS);
      setFutureDays(INITIAL_FUTURE_DAYS);
    }
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

  // Generate continuous date strip spanning pastDays and futureDays
  const dayStrip = useMemo(() => {
    const baseDate = parseLocalDate(baseDateStr);
    const by = baseDate.getFullYear();
    const bm = baseDate.getMonth();
    const bd = baseDate.getDate();
    const days = [];

    for (let i = -pastDays; i <= futureDays; i++) {
      const d = new Date(by, bm, bd + i);
      const iso = formatToISO(d);
      const dayTotal = expenseMap[iso] || 0;
      const isFirstOfMonth = d.getDate() === 1;
      const monthShort = d.toLocaleDateString(locale, { month: 'short' });

      days.push({
        iso,
        date: d,
        weekday: d.toLocaleDateString(locale, { weekday: 'short' }),
        dayNumber: d.getDate(),
        monthShort,
        isFirstOfMonth,
        total: dayTotal,
        isToday: iso === todayStr,
        isSelected: iso === (selectedDate || todayStr)
      });
    }
    return days;
  }, [baseDateStr, pastDays, futureDays, expenseMap, todayStr, selectedDate, locale, parseLocalDate, formatToISO]);

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
                  isReadyRef.current = false;
                  setBaseDateStr(e.target.value);
                  setPastDays(INITIAL_PAST_DAYS);
                  setFutureDays(INITIAL_FUTURE_DAYS);
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

      {/* Smooth, Infinite Sliding Pill Strip */}
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
              className={`date-nav-pill-btn ${day.isSelected ? 'is-selected' : ''} ${day.isToday ? 'is-today' : ''} ${day.isFirstOfMonth ? 'pill-is-first-of-month' : ''}`}
              onClick={() => handlePillClick(day.iso)}
              title={`${day.weekday}, ${day.dayNumber} ${day.monthShort} - ${fullSpend}`}
            >
              <span className={`pill-weekday ${day.isFirstOfMonth ? 'pill-month-indicator' : ''}`}>
                {day.isFirstOfMonth ? day.monthShort.toUpperCase() : day.weekday}
              </span>
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
