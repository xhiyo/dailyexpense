import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/storage';
import { getCategoryById } from '../data/categories';
import { useTranslation } from '../i18n/LanguageContext';

export const DailySummaryCards = ({
  expenses = [],
  selectedDate,
  dailyBudget = 0,
  currency = 'Rp',
  categories = [],
  onOpenBudgetModal
}) => {
  const { t, language, localizeCategoryName } = useTranslation();
  const locale = language === 'en' ? 'en-US' : 'id-ID';

  const {
    totalSpent,
    transactionCount,
    topCategory,
    monthTotal,
    monthTransactionCount
  } = useMemo(() => {
    const currentDayItems = expenses.filter(e => e.date === selectedDate);
    const total = currentDayItems.reduce((sum, e) => sum + Number(e.amount), 0);

    // Top Category
    const catMap = {};
    currentDayItems.forEach(e => {
      catMap[e.categoryId] = (catMap[e.categoryId] || 0) + Number(e.amount);
    });
    let topCat = null;
    let maxCatVal = 0;
    Object.entries(catMap).forEach(([catId, amount]) => {
      if (amount > maxCatVal) {
        maxCatVal = amount;
        topCat = {
          ...getCategoryById(catId, categories),
          amount,
          share: total > 0 ? Math.round((amount / total) * 100) : 0
        };
      }
    });

    // Month Total & Items
    const yearMonth = selectedDate ? selectedDate.slice(0, 7) : '';
    const currentMonthItems = yearMonth ? expenses.filter(e => e.date.startsWith(yearMonth)) : [];
    const mTotal = currentMonthItems.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      totalSpent: total,
      transactionCount: currentDayItems.length,
      topCategory: topCat,
      monthTotal: mTotal,
      monthTransactionCount: currentMonthItems.length
    };
  }, [expenses, selectedDate, categories]);

  const { monthLabel, monthFullTitle } = useMemo(() => {
    if (!selectedDate) {
      return {
        monthLabel: t('summary.thisMonthSpend'),
        monthFullTitle: ''
      };
    }
    const parts = selectedDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    const monthFull = d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

    const today = new Date();
    const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const isCurrentMonth = selectedDate.startsWith(currentYM);

    return {
      monthLabel: isCurrentMonth
        ? t('summary.thisMonthSpend')
        : `${t('summary.monthSpend')} ${monthFull}`,
      monthFullTitle: monthFull
    };
  }, [selectedDate, locale, t]);

  const isToday = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return selectedDate === `${y}-${m}-${d}`;
  }, [selectedDate]);

  const hasBudget = Boolean(dailyBudget && dailyBudget > 0);
  const budgetUsedPct = hasBudget ? Math.min(Math.round((totalSpent / dailyBudget) * 100), 100) : 0;
  const isOverBudget = hasBudget && totalSpent > dailyBudget;
  const remainingBudget = hasBudget ? Math.max(0, dailyBudget - totalSpent) : 0;

  return (
    <section className="kpi-grid-section">
      {/* Card 1: Today / Selected Day Spend */}
      <div className="kpi-card kpi-card-hero">
        <div className="kpi-card-header">
          <span className="kpi-label">
            {isToday
              ? t('summary.totalSpentToday')
              : (language === 'en' ? 'Selected Date Spend' : 'Pengeluaran Tanggal Ini')}
          </span>
        </div>
        <div className="kpi-body">
          <div className="kpi-amount font-mono">
            {formatCurrency(totalSpent, currency)}
          </div>
        </div>
        <div className="kpi-footer">
          <span className="kpi-meta-text">
            {transactionCount} {t('common.transactions').toLowerCase()}
          </span>
        </div>
      </div>

      {/* Card 2: Daily Budget Target */}
      <div className="kpi-card kpi-card-hero">
        <div className="kpi-card-header">
          <span className="kpi-label">{t('summary.dailyBudget')}</span>
          {onOpenBudgetModal && (
            <button
              type="button"
              className="kpi-action-link"
              onClick={onOpenBudgetModal}
            >
              {hasBudget ? t('settings.editLimitBtn') : t('settings.setLimitBtn')}
            </button>
          )}
        </div>
        <div className="kpi-body">
          <div className="kpi-amount font-mono">
            {!hasBudget ? (
              <span className="kpi-amount font-mono">{currency} ∞</span>
            ) : isOverBudget ? (
              <span className="text-danger">
                +{formatCurrency(totalSpent - dailyBudget, currency)}
              </span>
            ) : (
              <span className="text-success">
                {formatCurrency(remainingBudget, currency)}
              </span>
            )}
          </div>
        </div>
        <div className="kpi-footer">
          <div className="kpi-progress-wrap">
            <div className="kpi-progress-track">
              <div
                className={`kpi-progress-fill ${!hasBudget ? '' : isOverBudget ? 'fill-danger' : budgetUsedPct > 80 ? 'fill-warning' : 'fill-primary'}`}
                style={{ width: `${hasBudget ? budgetUsedPct : 0}%` }}
              />
            </div>
            <div className="kpi-progress-meta">
              <span>{hasBudget ? `${budgetUsedPct}% used` : t('summary.statusUnlimited')}</span>
              <span>{hasBudget ? `Target: ${formatCurrency(dailyBudget, currency)}` : `Limit: ${currency} ∞`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Month Total */}
      <div className="kpi-card kpi-card-secondary" title={monthFullTitle}>
        <div className="kpi-card-header">
          <span className="kpi-label">{monthLabel}</span>
        </div>
        <div className="kpi-body">
          <div className="kpi-amount font-mono">
            {formatCurrency(monthTotal, currency)}
          </div>
        </div>
        <div className="kpi-footer">
          <span className="kpi-meta-text">
            {monthTransactionCount} {t('common.transactions').toLowerCase()}{monthFullTitle ? ` • ${monthFullTitle}` : ''}
          </span>
        </div>
      </div>

      {/* Card 4: Top Category */}
      <div className="kpi-card kpi-card-secondary">
        <div className="kpi-card-header">
          <span className="kpi-label">{t('summary.topCategory')}</span>
        </div>
        <div className="kpi-body">
          {topCategory ? (
            <div className="kpi-top-category-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: topCategory.color || 'var(--accent-primary)',
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${topCategory.color}66`
                }}
              />
              <div
                className="kpi-top-category-name"
                style={{ color: topCategory.color || 'var(--text-primary)', fontWeight: '700' }}
                title={localizeCategoryName(topCategory)}
              >
                {localizeCategoryName(topCategory)}
              </div>
            </div>
          ) : (
            <div className="kpi-placeholder-text">
              {language === 'en' ? 'No expenses' : 'Belum ada pengeluaran'}
            </div>
          )}
        </div>
        <div className="kpi-footer">
          {topCategory ? (
            <span className="kpi-meta-text">
              <strong className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
                {formatCurrency(topCategory.amount, currency)}
              </strong>
              {' '}({topCategory.share}% {language === 'en' ? 'of day' : 'hari ini'})
            </span>
          ) : (
            <span className="kpi-meta-text">
              {language === 'en' ? '0 transactions recorded' : '0 transaksi tercatat'}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
