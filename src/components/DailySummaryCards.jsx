import React, { useMemo } from 'react';
import {
  Calendar,
  SlidersHorizontal,
  TrendingUp,
  PieChart,
  Plus
} from 'lucide-react';
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

  const selectedDateObject = useMemo(() => {
    if (!selectedDate) return new Date();
    const parts = selectedDate.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }, [selectedDate]);

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
    <section className="summary-cards-wrapper">
      {/* 1. MOBILE HERO WALLET CARD (Fintech Neobank Design for Mobile Screens) */}
      <div className="mobile-wallet-card">
        {/* Top bar of wallet card */}
        <div className="wallet-card-header">
          <div className="wallet-date-badge">
            <Calendar size={13} className="wallet-badge-icon" />
            <span className="wallet-date-text">
              {isToday
                ? t('summary.totalSpentToday')
                : selectedDateObject.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="wallet-dot">•</span>
            <span className="wallet-tx-count">
              {transactionCount} {t('common.transactions').toLowerCase()}
            </span>
          </div>

          {onOpenBudgetModal && (
            <button
              type="button"
              className="wallet-budget-btn"
              onClick={onOpenBudgetModal}
              aria-label={hasBudget ? t('settings.editLimitBtn') : t('settings.setLimitBtn')}
            >
              <SlidersHorizontal size={12} />
              <span>{hasBudget ? t('settings.editLimitBtn') : t('settings.setLimitBtn')}</span>
            </button>
          )}
        </div>

        {/* Main Spend Amount Display */}
        <div className="wallet-main-display">
          <span className="wallet-spend-caption">
            {isToday
              ? (language === 'en' ? "Today's Total Expense" : 'Total Keluar Hari Ini')
              : (language === 'en' ? 'Date Expense' : 'Pengeluaran Tanggal Ini')}
          </span>
          <div className="wallet-spend-amount font-mono">
            {formatCurrency(totalSpent, currency)}
          </div>
        </div>

        {/* Budget Progress & Status */}
        <div className="wallet-budget-section">
          {hasBudget ? (
            <>
              <div className="wallet-budget-meta">
                <div className="wallet-budget-left">
                  {isOverBudget ? (
                    <span className="budget-status-tag tag-danger">
                      {language === 'en' ? 'Over Budget' : 'Melebihi Limit'} +{formatCurrency(totalSpent - dailyBudget, currency)}
                    </span>
                  ) : (
                    <span className="budget-status-tag tag-success">
                      {language === 'en' ? 'Remaining' : 'Sisa Kuota'} {formatCurrency(remainingBudget, currency)}
                    </span>
                  )}
                </div>
                <span className="wallet-budget-limit font-mono">
                  {budgetUsedPct}% • {language === 'en' ? 'Limit' : 'Batas'}: {formatCurrency(dailyBudget, currency)}
                </span>
              </div>
              <div className="wallet-progress-bar">
                <div
                  className={`wallet-progress-fill ${isOverBudget ? 'fill-danger' : budgetUsedPct > 80 ? 'fill-warning' : 'fill-primary'}`}
                  style={{ width: `${budgetUsedPct}%` }}
                />
              </div>
            </>
          ) : (
            <div className="wallet-no-budget">
              <span className="wallet-no-budget-text">
                {language === 'en' ? 'No daily limit set (Unlimited)' : 'Batas harian belum dipasang (Bebas)'}
              </span>
              {onOpenBudgetModal && (
                <button
                  type="button"
                  className="wallet-set-budget-link"
                  onClick={onOpenBudgetModal}
                >
                  <Plus size={12} />
                  <span>{t('settings.setLimitBtn')}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Split Row: Month Total & Top Category */}
        <div className="wallet-card-footer">
          {/* Sub-stat 1: Month Total */}
          <div className="wallet-sub-stat">
            <div className="wallet-sub-label">
              <TrendingUp size={12} className="wallet-sub-icon text-accent" />
              <span>{monthLabel}</span>
            </div>
            <div className="wallet-sub-value font-mono">
              {formatCurrency(monthTotal, currency)}
            </div>
            <div className="wallet-sub-meta">
              {monthTransactionCount} {t('common.transactions').toLowerCase()}
            </div>
          </div>

          <div className="wallet-sub-divider" />

          {/* Sub-stat 2: Top Category */}
          <div className="wallet-sub-stat">
            <div className="wallet-sub-label">
              <PieChart size={12} className="wallet-sub-icon text-accent" />
              <span>{t('summary.topCategory')}</span>
            </div>
            {topCategory ? (
              <>
                <div className="wallet-top-cat-row">
                  <span
                    className="wallet-cat-dot"
                    style={{ backgroundColor: topCategory.color || 'var(--accent-primary)' }}
                  />
                  <span
                    className="wallet-sub-value wallet-cat-name"
                    style={{ color: topCategory.color || 'var(--text-primary)' }}
                    title={localizeCategoryName(topCategory)}
                  >
                    {localizeCategoryName(topCategory)}
                  </span>
                </div>
                <div className="wallet-sub-meta font-mono">
                  {formatCurrency(topCategory.amount, currency)} ({topCategory.share}%)
                </div>
              </>
            ) : (
              <>
                <div className="wallet-sub-value text-muted" style={{ fontSize: '0.85rem' }}>
                  {language === 'en' ? 'None' : 'Belum ada'}
                </div>
                <div className="wallet-sub-meta">
                  0 {t('common.transactions').toLowerCase()}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. DESKTOP 4-COLUMN KPI GRID (Visible on screens > 768px) */}
      <div className="kpi-grid-section desktop-kpi-grid">
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
      </div>
    </section>
  );
};
