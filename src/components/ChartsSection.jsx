import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../utils/storage';
import { useTranslation } from '../i18n/LanguageContext';

export const ChartsSection = ({
  expenses = [],
  selectedDate,
  dailyBudget = 0,
  currency = 'Rp',
  onSelectDate
}) => {
  const { t, language } = useTranslation();
  const locale = language === 'en' ? 'en-US' : 'id-ID';

  const todayISO = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Timeframe options: '7days' | '30days' | 'month' | 'custom'
  const [timeframe, setTimeframe] = useState('7days');
  // Period offset: 0 = current period, 1 = previous period, etc.
  const [periodOffset, setPeriodOffset] = useState(0);

  // Selected bar date state for in-chart inspection without causing full-page scrolling
  const [selectedBarDate, setSelectedBarDate] = useState(() => selectedDate || todayISO);

  // Drag-to-scroll & slide ref and state
  const chartScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged = useRef(false);

  // Sync selectedBarDate when selectedDate prop changes from outside (e.g. DateNavigator)
  useEffect(() => {
    if (selectedDate) {
      setSelectedBarDate(selectedDate);
    }
  }, [selectedDate]);

  // Compute default custom dates: 14 days ending today
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [customEndDate, setCustomEndDate] = useState(todayISO);

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

  const handleResetToToday = () => {
    setPeriodOffset(0);
    setSelectedBarDate(todayISO);
  };

  const handleShiftPeriod = (delta) => {
    setPeriodOffset(prev => Math.max(0, prev + delta));
  };

  // Compute trend data based on selected timeframe and periodOffset
  const trendData = useMemo(() => {
    const days = [];
    const baseDate = new Date();

    if (timeframe === '7days') {
      baseDate.setDate(baseDate.getDate() - (periodOffset * 7));
      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        days.push(d);
      }
    } else if (timeframe === '30days') {
      baseDate.setDate(baseDate.getDate() - (periodOffset * 30));
      for (let i = 29; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        days.push(d);
      }
    } else if (timeframe === 'month') {
      baseDate.setMonth(baseDate.getMonth() - periodOffset);
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= lastDay; day++) {
        days.push(new Date(year, month, day));
      }
    } else if (timeframe === 'custom') {
      const start = parseLocalDate(customStartDate);
      const end = parseLocalDate(customEndDate);
      if (start <= end) {
        const cur = new Date(start);
        while (cur <= end && days.length < 60) {
          days.push(new Date(cur));
          cur.setDate(cur.getDate() + 1);
        }
      } else {
        days.push(new Date(baseDate));
      }
    }

    let maxVal = dailyBudget || 0;
    let totalAllDays = 0;
    let highestDay = null;

    const computedDays = days.map((d) => {
      const iso = formatToISO(d);
      const dayItems = expenses.filter(e => e.date === iso);
      const dayTotal = dayItems.reduce((sum, e) => sum + Number(e.amount), 0);

      totalAllDays += dayTotal;
      if (dayTotal > maxVal) maxVal = dayTotal;

      const itemObj = {
        iso,
        date: d,
        weekday: d.toLocaleDateString(locale, { weekday: 'short' }),
        dayMonth: d.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        total: dayTotal,
        count: dayItems.length,
        isOverBudget: dailyBudget > 0 && dayTotal > dailyBudget,
        isSelected: iso === selectedBarDate
      };

      if (!highestDay || dayTotal > highestDay.total) {
        highestDay = itemObj;
      }

      return itemObj;
    });

    const averagePerDay = computedDays.length > 0 ? Math.round(totalAllDays / computedDays.length) : 0;

    return {
      days: computedDays,
      maxVal: maxVal > 0 ? maxVal : 100000,
      totalAllDays,
      averagePerDay,
      highestDay: highestDay && highestDay.total > 0 ? highestDay : null
    };
  }, [expenses, selectedBarDate, dailyBudget, timeframe, periodOffset, customStartDate, customEndDate, locale]);

  // Month label for the active month in view
  const monthName = useMemo(() => {
    if (!trendData.days.length) return '';
    const refDate = trendData.days[Math.floor(trendData.days.length / 2)]?.date || new Date();
    return refDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }, [trendData.days, locale]);

  // Selected Day item for active day inspection
  const activeDayItem = useMemo(() => {
    if (!trendData.days.length) return null;
    return trendData.days.find(d => d.iso === selectedBarDate) || trendData.days[trendData.days.length - 1];
  }, [trendData.days, selectedBarDate]);

  // Auto-scroll the active bar into center view
  useEffect(() => {
    if (chartScrollRef.current) {
      const activeEl = chartScrollRef.current.querySelector('.bar-column.bar-selected');
      if (activeEl) {
        const container = chartScrollRef.current;
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const relativeLeft = activeRect.left - containerRect.left + container.scrollLeft;
        const scrollTarget = relativeLeft - (container.clientWidth / 2) + (activeEl.clientWidth / 2);
        container.scrollTo({
          left: Math.max(0, scrollTarget),
          behavior: 'smooth'
        });
      }
    }
  }, [selectedBarDate, periodOffset, timeframe]);

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e) => {
    if (!chartScrollRef.current) return;
    setIsDragging(true);
    dragStartX.current = e.pageX - chartScrollRef.current.offsetLeft;
    dragScrollLeft.current = chartScrollRef.current.scrollLeft;
    hasDragged.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !chartScrollRef.current) return;
    const x = e.pageX - chartScrollRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDragged.current = true;
    }
    chartScrollRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleBarClick = (e, item) => {
    if (hasDragged.current) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    // Tapping already selected bar toggles back to today
    if (selectedBarDate === item.iso && item.iso !== todayISO) {
      setSelectedBarDate(todayISO);
    } else {
      setSelectedBarDate(item.iso);
    }
  };

  const isDense = trendData.days.length > 7;

  return (
    <section className="modern-analytics-section">
      <div className="analytics-header-bar">
        <div className="analytics-title-wrap">
          <div className="analytics-title-row">
            <h3 className="analytics-title">{t('charts.title')}</h3>
            {(periodOffset !== 0 || selectedBarDate !== todayISO) && (
              <button
                type="button"
                className="analytics-today-pill-btn"
                onClick={handleResetToToday}
                title={language === 'en' ? 'Return to Today' : 'Kembali ke Hari Ini'}
              >
                <RotateCcw size={12} />
                <span>{language === 'en' ? 'Today' : 'Hari Ini'}</span>
              </button>
            )}
          </div>
          <span className="analytics-subtitle">
            {timeframe === '7days' && (periodOffset === 0
              ? (language === 'en' ? 'Daily spending trend for the last 7 days' : 'Tren pengeluaran harian 7 hari terakhir')
              : (language === 'en' ? `7-day period: ${trendData.days[0]?.dayMonth} - ${trendData.days[trendData.days.length - 1]?.dayMonth}` : `Periode 7 hari: ${trendData.days[0]?.dayMonth} - ${trendData.days[trendData.days.length - 1]?.dayMonth}`))}
            {timeframe === '30days' && (periodOffset === 0
              ? (language === 'en' ? 'Daily spending trend for the last 30 days' : 'Tren pengeluaran harian 30 hari terakhir')
              : (language === 'en' ? `30-day period: ${trendData.days[0]?.dayMonth} - ${trendData.days[trendData.days.length - 1]?.dayMonth}` : `Periode 30 hari: ${trendData.days[0]?.dayMonth} - ${trendData.days[trendData.days.length - 1]?.dayMonth}`))}
            {timeframe === 'month' && (language === 'en' ? `Monthly spending overview for ${monthName}` : `Tren pengeluaran kalender bulan ${monthName}`)}
            {timeframe === 'custom' && `${language === 'en' ? 'Date range' : 'Rentang tanggal'}: ${customStartDate} - ${customEndDate} (${trendData.days.length} ${t('common.records').toLowerCase()})`}
          </span>
        </div>

        <div className="analytics-actions-wrap">
          {/* Period Arrow Shift Controls (< and >) */}
          {timeframe !== 'custom' && (
            <div className="analytics-period-arrows">
              <button
                type="button"
                className="analytics-arrow-btn"
                onClick={() => handleShiftPeriod(1)}
                title={language === 'en' ? 'Previous period' : 'Periode sebelumnya'}
                aria-label="Previous period"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="analytics-arrow-btn"
                onClick={() => handleShiftPeriod(-1)}
                disabled={periodOffset <= 0}
                title={language === 'en' ? 'Next period' : 'Periode berikutnya'}
                aria-label="Next period"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <div className="analytics-segmented-control">
            <button
              type="button"
              className={`segmented-btn ${timeframe === '7days' ? 'is-active' : ''}`}
              onClick={() => { setTimeframe('7days'); setPeriodOffset(0); }}
            >
              {language === 'en' ? '7 Days' : '7 Hari'}
            </button>
            <button
              type="button"
              className={`segmented-btn ${timeframe === '30days' ? 'is-active' : ''}`}
              onClick={() => { setTimeframe('30days'); setPeriodOffset(0); }}
            >
              {language === 'en' ? '30 Days' : '30 Hari'}
            </button>
            <button
              type="button"
              className={`segmented-btn ${timeframe === 'month' ? 'is-active' : ''}`}
              onClick={() => { setTimeframe('month'); setPeriodOffset(0); }}
            >
              {language === 'en' ? 'Month' : 'Bulanan'}
            </button>
            <button
              type="button"
              className={`segmented-btn ${timeframe === 'custom' ? 'is-active' : ''}`}
              onClick={() => setTimeframe('custom')}
            >
              <Calendar size={13} className="segmented-btn-icon" style={{ marginRight: 4, verticalAlign: 'middle' }} />
              {language === 'en' ? 'Custom' : 'Kustom'}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Range Selector Bar */}
      {timeframe === 'custom' && (
        <div className="analytics-custom-range-bar">
          <div className="range-field">
            <span className="range-label">{language === 'en' ? 'From Date:' : 'Dari Tanggal:'}</span>
            <input
              type="date"
              className="range-input"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              aria-label="Start date"
            />
          </div>
          <span className="range-sep">{language === 'en' ? 'to' : 's/d'}</span>
          <div className="range-field">
            <span className="range-label">{language === 'en' ? 'To Date:' : 'Sampai Tanggal:'}</span>
            <input
              type="date"
              className="range-input"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              aria-label="End date"
            />
          </div>
        </div>
      )}

      <div className="analytics-content-body">
        {/* KPI Meta Summary Bar */}
        <div className="chart-meta-row">
          <div className="chart-meta-cell">
            <span className="chart-meta-label">{t('profile.totalSpent')}</span>
            <strong className="chart-meta-val font-mono">
              {formatCurrency(trendData.totalAllDays, currency)}
            </strong>
          </div>

          <div className="chart-meta-cell">
            <span className="chart-meta-label">{language === 'en' ? 'Avg / Day' : 'Rata-rata / Hari'}</span>
            <strong className="chart-meta-val font-mono">
              {formatCurrency(trendData.averagePerDay, currency)}
            </strong>
          </div>

          <div className="chart-meta-cell">
            <span className="chart-meta-label">
              {language === 'en' ? 'Peak Day' : 'Tertinggi'} {trendData.highestDay ? `(${trendData.highestDay.dayMonth})` : ''}
            </span>
            <strong className="chart-meta-val font-mono">
              {formatCurrency(trendData.highestDay ? trendData.highestDay.total : 0, currency)}
            </strong>
          </div>

          <div className="chart-meta-cell">
            <span className="chart-meta-label">{language === 'en' ? 'Period' : 'Periode'}</span>
            <strong className="chart-meta-val font-mono">
              {trendData.days.length} {language === 'en' ? 'Days' : 'Hari'}
            </strong>
          </div>
        </div>

        {/* Interactive Selected Day Inspector Card */}
        {activeDayItem && (
          <div className="analytics-active-day-card">
            {/* Top Row: Date & Actions */}
            <div className="active-day-header-row">
              <div className="active-day-tag-wrap">
                <span className={`active-day-tag ${activeDayItem.iso === todayISO ? 'is-today' : ''}`}>
                  {activeDayItem.iso === todayISO
                    ? (language === 'en' ? 'Today' : 'Hari Ini')
                    : activeDayItem.weekday}
                </span>
                <span className="active-day-date-str">
                  {activeDayItem.date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="active-day-actions">
                {activeDayItem.iso !== todayISO && (
                  <button
                    type="button"
                    className="active-day-back-today-btn"
                    onClick={handleResetToToday}
                    title={language === 'en' ? 'Return to Today' : 'Kembali ke Hari Ini'}
                  >
                    <RotateCcw size={12} />
                    <span>{language === 'en' ? 'Today' : 'Hari Ini'}</span>
                  </button>
                )}

                {onSelectDate && (
                  <button
                    type="button"
                    className="active-day-jump-btn"
                    onClick={() => {
                      onSelectDate(activeDayItem.iso);
                      const listEl = document.getElementById('expense-list-section') || document.querySelector('.modern-expense-section');
                      if (listEl) {
                        listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    title={language === 'en' ? 'View transactions for this date in the list above' : 'Buka daftar transaksi tanggal ini di atas'}
                  >
                    {t('charts.viewInList')} →
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Row: Spend Amount & Budget Pill */}
            <div className="active-day-body-row">
              <div className="active-day-amount-wrap">
                <strong className="active-day-amount font-mono">
                  {formatCurrency(activeDayItem.total, currency)}
                </strong>
                <span className="active-day-count-badge">
                  {activeDayItem.count > 0
                    ? `${activeDayItem.count} ${t('common.transactions').toLowerCase()}`
                    : (language === 'en' ? '0 transactions' : '0 transaksi')}
                </span>
              </div>

              <div className="active-day-status-wrap">
                {dailyBudget > 0 ? (
                  <div className={`active-day-budget-pill ${activeDayItem.isOverBudget ? 'is-over' : activeDayItem.total > 0 ? 'is-under' : 'is-zero'}`}>
                    <span className={`budget-pill-dot ${activeDayItem.isOverBudget ? 'dot-danger' : activeDayItem.total > 0 ? 'dot-success' : 'dot-neutral'}`} />
                    <span className="budget-pill-text">
                      {activeDayItem.isOverBudget
                        ? `${t('charts.overBudget')} (+${formatCurrency(activeDayItem.total - dailyBudget, currency)})`
                        : activeDayItem.total > 0
                          ? `${t('charts.withinBudget')} (${language === 'en' ? 'Rem.' : 'Sisa'} ${formatCurrency(dailyBudget - activeDayItem.total, currency)})`
                          : t('charts.noExpenseDay')}
                    </span>
                  </div>
                ) : (
                  <div className="active-day-budget-pill is-neutral">
                    <span className="budget-pill-dot dot-neutral" />
                    <span className="budget-pill-text">
                      {activeDayItem.total > 0
                        ? `${activeDayItem.count} ${t('common.transactions').toLowerCase()}`
                        : t('charts.noExpenseDay')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Responsive Full-Width Bar Chart Container with Horizontal Sliding */}
        <div
          className={`modern-bar-chart-container ${isDragging ? 'is-dragging' : ''}`}
          ref={chartScrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div className={`modern-bar-chart ${isDense ? 'is-dense' : ''}`}>
            {trendData.days.map((item) => {
              const heightPct = trendData.maxVal > 0
                ? Math.max(Math.min((item.total / trendData.maxVal) * 75, 75), item.total > 0 ? 8 : 0)
                : 0;
              return (
                <div
                  key={item.iso}
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.weekday}, ${item.dayMonth}: ${formatCurrency(item.total, currency)}`}
                  className={`bar-column ${item.isSelected ? 'bar-selected' : ''}`}
                  onClick={(e) => handleBarClick(e, item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleBarClick(e, item);
                    }
                  }}
                  title={`${item.weekday}, ${item.dayMonth}: ${formatCurrency(item.total, currency)} (${item.count} transactions)`}
                >
                  <div className="bar-track">
                    {item.total > 0 ? (
                      <div
                        className={`bar-fill ${item.isOverBudget ? 'fill-over' : item.isSelected ? 'fill-active' : ''}`}
                        style={{ height: `${heightPct}%` }}
                      >
                        <span className="bar-fill-tooltip font-mono">
                          {formatCurrency(item.total, currency)}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`bar-fill bar-fill-zero ${item.isSelected ? 'fill-active' : ''}`}
                        style={{ height: '6px' }}
                      >
                        <span className="bar-fill-tooltip font-mono">
                          {formatCurrency(0, currency)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="bar-label-day">{item.weekday}</span>
                  <span className="bar-label-date">{item.dayMonth}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

