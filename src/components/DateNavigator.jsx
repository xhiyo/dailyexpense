import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
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
  // Generous range offset: 90 days in the past and 60 days in future (151 days total)
  // This avoids infinite prepending layout shifts during normal mobile swipe browsing.
  const [range, setRange] = useState({ left: -90, right: 60 });

  // Refs for tracking prepending scroll adjustments without jitter
  const isPrependingRef = useRef(false);
  const prevScrollWidthRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const hasInitialCenteredRef = useRef(false);

  // Mouse & Touch drag tracking state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged = useRef(false);
  const lastDragEndTime = useRef(0);
  const touchActive = useRef(false);

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

  // Auto-scroll the active date pill into center view
  const scrollToActivePill = useCallback((behavior = 'smooth') => {
    if (stripRef.current) {
      const activeEl = stripRef.current.querySelector('.date-nav-pill-btn.is-selected');
      if (activeEl) {
        const container = stripRef.current;
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        if (containerRect.width === 0) return;
        const relativeLeft = activeRect.left - containerRect.left + container.scrollLeft;
        const scrollLeftTarget = relativeLeft - (container.clientWidth / 2) + (activeEl.clientWidth / 2);

        isProgrammaticScrollRef.current = true;
        container.scrollTo({
          left: Math.max(0, scrollLeftTarget),
          behavior
        });

        const resetDuration = behavior === 'smooth' ? 450 : 60;
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, resetDuration);
      }
    }
  }, []);

  // If selectedDate changes from outside and is far outside the current range: re-anchor
  useEffect(() => {
    if (!selectedDate) return;
    const base = parseLocalDate(baseDateStr);
    const sel = parseLocalDate(selectedDate);
    const diffDays = Math.round((sel - base) / (1000 * 60 * 60 * 24));

    if (diffDays < range.left - 10 || diffDays > range.right + 10) {
      setBaseDateStr(selectedDate);
      setRange({ left: -90, right: 60 });
      requestAnimationFrame(() => {
        scrollToActivePill('auto');
      });
    }
  }, [selectedDate, baseDateStr, range.left, range.right, scrollToActivePill]);

  // Adjust scroll position after prepending items to left
  useLayoutEffect(() => {
    if (isPrependingRef.current && stripRef.current) {
      const newScrollWidth = stripRef.current.scrollWidth;
      const diff = newScrollWidth - prevScrollWidthRef.current;
      stripRef.current.scrollLeft += diff;
      isPrependingRef.current = false;
    }
  }, [range.left]);

  const userTappedPillRef = useRef(false);

  // Center active date pill on initial mount once layout is ready
  useEffect(() => {
    if (!stripRef.current || hasInitialCenteredRef.current) return;

    const centerPill = () => {
      if (stripRef.current && stripRef.current.clientWidth > 0) {
        scrollToActivePill('auto');
        hasInitialCenteredRef.current = true;
      }
    };

    centerPill();

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (!hasInitialCenteredRef.current) {
          centerPill();
        }
      });
      ro.observe(stripRef.current);
    }

    return () => {
      if (ro) ro.disconnect();
    };
  }, [scrollToActivePill]);

  // When selectedDate changes:
  // If user tapped a pill in the strip, DO NOT force-scroll or jitter!
  // If date was changed externally (arrows, today button, date picker), smoothly scroll it into view.
  useEffect(() => {
    if (!selectedDate) return;

    if (userTappedPillRef.current) {
      userTappedPillRef.current = false;
      return;
    }

    if (hasInitialCenteredRef.current) {
      scrollToActivePill('smooth');
    }
  }, [selectedDate, scrollToActivePill]);

  // Infinite scroll event listener: safely append/prepend when user is near edge and NOT touching
  const handleScroll = () => {
    if (!stripRef.current) return;
    if (!hasInitialCenteredRef.current) return;
    if (isProgrammaticScrollRef.current) return;
    // CRITICAL: NEVER prepend/append while user has their finger down or is dragging!
    if (touchActive.current || isDragging) return;

    const { scrollLeft, scrollWidth, clientWidth } = stripRef.current;

    // Near left edge (< 100px and has scrolled away from 0): prepend 30 days
    if (scrollLeft > 10 && scrollLeft < 100 && !isPrependingRef.current) {
      prevScrollWidthRef.current = scrollWidth;
      isPrependingRef.current = true;
      setRange(prev => ({ ...prev, left: prev.left - 30 }));
    }
    // Near right edge (< 100px from end): append 30 days
    else if (scrollLeft + clientWidth > scrollWidth - 100) {
      setRange(prev => ({ ...prev, right: prev.right + 30 }));
    }
  };

  // Touch gesture handlers for mobile: Prevents swipes/scrolls from accidentally clicking pills!
  const handleTouchStart = (e) => {
    if (!stripRef.current) return;
    touchActive.current = true;
    const touch = e.touches[0];
    dragStartX.current = touch.clientX;
    dragStartY.current = touch.clientY;
    dragScrollLeft.current = stripRef.current.scrollLeft;
    hasDragged.current = false;
  };

  const handleTouchMove = (e) => {
    if (!touchActive.current || !stripRef.current) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - dragStartX.current);
    const diffY = Math.abs(touch.clientY - dragStartY.current);

    // If movement exceeds 6px (swipe or page scroll), mark as dragged!
    if (diffX > 6 || diffY > 6) {
      hasDragged.current = true;
      lastDragEndTime.current = Date.now();
    }
  };

  const handleTouchEnd = () => {
    touchActive.current = false;
    if (hasDragged.current) {
      lastDragEndTime.current = Date.now();
      // Keep hasDragged true for 350ms to swallow delayed synthetic clicks
      setTimeout(() => {
        hasDragged.current = false;
      }, 350);
    }
  };

  const handleTouchCancel = () => {
    touchActive.current = false;
    hasDragged.current = false;
  };

  // Mouse drag-to-scroll handlers for desktop
  const handleMouseDown = (e) => {
    if (e.button !== 0 || !stripRef.current) return;
    setIsDragging(true);
    dragStartX.current = e.pageX - stripRef.current.offsetLeft;
    dragScrollLeft.current = stripRef.current.scrollLeft;
    hasDragged.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !stripRef.current) return;
    const x = e.pageX - stripRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.4;
    if (Math.abs(walk) > 6) {
      hasDragged.current = true;
      lastDragEndTime.current = Date.now();
    }
    stripRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (hasDragged.current) {
        lastDragEndTime.current = Date.now();
        setTimeout(() => {
          hasDragged.current = false;
        }, 350);
      }
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (hasDragged.current) {
        lastDragEndTime.current = Date.now();
        setTimeout(() => {
          hasDragged.current = false;
        }, 350);
      }
    }
  };

  // Handle deliberate tap on a date pill
  const handlePillClick = (e, dayIso) => {
    // If the user just swiped or scrolled, BLOCK CLICK completely!
    if (hasDragged.current || (Date.now() - lastDragEndTime.current < 350)) {
      e.preventDefault();
      return;
    }

    if (dayIso === selectedDate) {
      userTappedPillRef.current = false;
      return;
    }

    userTappedPillRef.current = true;
    onSelectDate(dayIso);

    // If pill is near or partially cut off by screen edge, gently nudge it into view
    const targetPill = e.currentTarget;
    if (stripRef.current && targetPill) {
      const containerRect = stripRef.current.getBoundingClientRect();
      const pillRect = targetPill.getBoundingClientRect();
      const edgeThreshold = 28;

      if (pillRect.left < containerRect.left + edgeThreshold) {
        stripRef.current.scrollBy({
          left: pillRect.left - containerRect.left - edgeThreshold,
          behavior: 'smooth'
        });
      } else if (pillRect.right > containerRect.right - edgeThreshold) {
        stripRef.current.scrollBy({
          left: pillRect.right - containerRect.right + edgeThreshold,
          behavior: 'smooth'
        });
      }
    }
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

      {/* Smooth Sliding Pill Strip */}
      <div
        className={`date-nav-pill-strip ${isDragging ? 'is-dragging' : ''}`}
        ref={stripRef}
        onScroll={handleScroll}
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
              onClick={(e) => handlePillClick(e, day.iso)}
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
