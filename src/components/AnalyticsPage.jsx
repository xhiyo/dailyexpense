import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { ChartsSection } from './ChartsSection';
import { useTranslation } from '../i18n/LanguageContext';

export const AnalyticsPage = ({
  expenses = [],
  selectedDate,
  dailyBudget = 0,
  currency = 'Rp',
  categories = [],
  onSelectDate,
  onBack,
  onBackToDashboard,
  isMobile = false
}) => {
  const { t, language } = useTranslation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onBackToDashboard) {
      onBackToDashboard();
    }
  };

  return (
    <div className="tab-analytics-view">
      {/* Page Header Banner */}
      <div className="page-header-banner analytics-header-banner">
        <div className="page-header-left">
          <h2 className="page-heading">{t('charts.title')}</h2>
          <p className="page-subheading">
            {language === 'en'
              ? 'Comprehensive breakdown and visual trends of your spending'
              : 'Grafik tren visual, statistik, dan rincian pengeluaran per kategori'}
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn-secondary analytics-back-btn"
            onClick={handleBack}
            title={t('common.back')}
            aria-label={t('common.back')}
          >
            <ArrowLeft size={16} />
            <span>{t('common.back')}</span>
          </button>
        </div>
      </div>

      {/* Main Charts & Analytics Body */}
      <div className="analytics-page-body">
        <ChartsSection
          expenses={expenses}
          selectedDate={selectedDate}
          dailyBudget={dailyBudget}
          currency={currency}
          categories={categories}
          onSelectDate={onSelectDate}
          isStandalonePage={true}
        />
      </div>
    </div>
  );
};
