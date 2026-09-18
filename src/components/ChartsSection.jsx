import React, { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
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

  // Timeframe options: '7days' | '30days' | 'month' | 'custom'
  const [timeframe, setTimeframe] = useState('7days');

  // Compute default custom dates: 14 days ending on selectedDate
  const [customStartDate, setCustomStartDate] = useState(() => {
    const parts = (selectedDate || '').split('-');
    const d = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
    d.setDate(d.getDate() - 13);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [customEndDate, setCustomEndDate] = useState(selectedDate);

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

  // Month label for the selected date
  const monthName = useMemo(() => {
    const d = parseLocalDate(selectedDate);
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }, [selectedDate, locale]);

  // Compute trend data based on selected timeframe
  const trendData = useMemo(() => {
    const days = [];
    const baseDate = parseLocalDate(selectedDate);

    if (timeframe === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        days.push(d);
      }
    } else if (timeframe === '30days') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        days.push(d);
      }
    } else if (timeframe === 'month') {
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
        isSelected: iso === selectedDate
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
  }, [expenses, selectedDate, dailyBudget, timeframe, customStartDate, customEndDate, locale]);

  const isDense = trendData.days.length > 7;

  return (
    <section className="modern-analytics-section">
      <div className="analytics-header-bar">
        <div className="analytics-title-wrap">
          <h3 className="analytics-title">{t('charts.title')}</h3>
          <span className="analytics-subtitle">
            {timeframe === '7days' && (language === 'en' ? 'Daily spending trend for the last 7 days' : 'Tren pengeluaran harian 7 hari terakhir')}
            {timeframe === '30days' && (language === 'en' ? 'Daily spending trend for the last 30 days' : 'Tren pengeluaran harian 30 hari terakhir')}
            {timeframe === 'month' && (language === 'en' ? `Monthly spending overview for ${monthName}` : `Tren pengeluaran kalender bulan ${monthName} (1 - ${trendData.days.length} hari)`)}
            {timeframe === 'custom' && `${language === 'en' ? 'Date range' : 'Rentang tanggal'}: ${customStartDate} - ${customEndDate} (${trendData.days.length} ${t('common.records').toLowerCase()})`}
          </span>
        </div>

        <div className="analytics-segmented-control">
          <button
            type="button"
            className={`segmented-btn ${timeframe === '7days' ? 'is-active' : ''}`}
            onClick={() => setTimeframe('7days')}
          >
            {language === 'en' ? '7 Days' : '7 Hari'}
          </button>
          <button
            type="button"
            className={`segmented-btn ${timeframe === '30days' ? 'is-active' : ''}`}
            onClick={() => setTimeframe('30days')}
          >
            {language === 'en' ? '30 Days' : '30 Hari'}
          </button>
          <button
            type="button"
            className={`segmented-btn ${timeframe === 'month' ? 'is-active' : ''}`}
            onClick={() => setTimeframe('month')}
          >
            {language === 'en' ? 'Month' : 'Bulanan'}
          </button>
          <button
            type="button"
            className={`segmented-btn ${timeframe === 'custom' ? 'is-active' : ''}`}
            onClick={() => setTimeframe('custom')}
          >
            <Calendar size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {language === 'en' ? 'Custom' : 'Kustom'}
          </button>
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

        {/* Dynamic Responsive Full-Width Bar Chart Container */}
        <div className="modern-bar-chart-container">
          <div className={`modern-bar-chart ${isDense ? 'is-dense' : ''}`}>
            {trendData.days.map((item) => {
              const heightPct = trendData.maxVal > 0
                ? Math.max(Math.min((item.total / trendData.maxVal) * 75, 75), item.total > 0 ? 8 : 0)
                : 0;
              return (
                <div
                  key={item.iso}
                  className={`bar-column ${item.isSelected ? 'bar-selected' : ''}`}
                  onClick={() => onSelectDate && onSelectDate(item.iso)}
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
