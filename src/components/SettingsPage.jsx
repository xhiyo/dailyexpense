import React, { useState } from 'react';
import { Check, FileSpreadsheet } from 'lucide-react';
import { CURRENCIES, getBudgetPresets, convertCurrencyAmount } from '../data/categories';
import { formatCurrency, ACCENT_COLORS } from '../utils/storage';
import { UserAvatar } from './UserAvatar';
import { useTranslation } from '../i18n/LanguageContext';

export const SettingsPage = ({
  theme,
  toggleTheme,
  accentColor,
  onUpdateAccentColor,
  currency,
  onUpdateCurrency,
  dailyBudget,
  onUpdateDailyBudget,
  onOpenBudgetModal,
  onExportCSV,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onResetData,
  onBackToDashboard,
  onOpenCookieSettings
}) => {
  const { t, language, setLanguage } = useTranslation();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleConfirmReset = () => {
    onResetData();
    setShowResetConfirm(false);
  };

  return (
    <div className="tab-settings-view">
      {/* Header Banner */}
      <div className="page-header-banner">
        <div>
          <h2 className="page-heading">{t('settings.pageTitle')}</h2>
          <p className="page-subheading">
            {t('settings.pageSubtitle')}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={onBackToDashboard}
        >
          <span>{t('common.back')}</span>
        </button>
      </div>

      <div className="settings-modern-grid">
        {/* Card 1: Bahasa Tampilan (Display Language) */}
        <div className="settings-modern-card settings-language-card" style={{ gridColumn: '1 / -1' }}>
          <div className="settings-modern-card-header">
            <h4 className="settings-card-title">{t('settings.languageTitle')}</h4>
            <p className="settings-card-subtitle">{t('settings.languageSubtitle')}</p>
          </div>

          <div className="settings-language-list">
            {/* English (US) - Default */}
            <div
              className={`settings-language-tile ${language === 'en' ? 'is-active' : ''}`}
              onClick={() => setLanguage('en')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setLanguage('en')}
              aria-label="Select English language"
            >
              <div className="language-tile-left">
                <span className="language-tile-flag" aria-hidden="true">🇺🇸</span>
                <div className="language-tile-details">
                  <div className="language-tile-title-row">
                    <strong className="language-tile-name">{t('settings.langEnTitle')}</strong>
                    <span className="language-tile-default-badge">Default</span>
                  </div>
                  <span className="language-tile-desc">{t('settings.langEnDesc')}</span>
                </div>
              </div>
              {language === 'en' && (
                <div className="language-tile-badge">
                  <Check size={12} strokeWidth={3} />
                  <span>{t('common.active')}</span>
                </div>
              )}
            </div>

            {/* Bahasa Indonesia */}
            <div
              className={`settings-language-tile ${language === 'id' ? 'is-active' : ''}`}
              onClick={() => setLanguage('id')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setLanguage('id')}
              aria-label="Pilih Bahasa Indonesia"
            >
              <div className="language-tile-left">
                <span className="language-tile-flag" aria-hidden="true">🇮🇩</span>
                <div className="language-tile-details">
                  <div className="language-tile-title-row">
                    <strong className="language-tile-name">{t('settings.langIdTitle')}</strong>
                  </div>
                  <span className="language-tile-desc">{t('settings.langIdDesc')}</span>
                </div>
              </div>
              {language === 'id' && (
                <div className="language-tile-badge">
                  <Check size={12} strokeWidth={3} />
                  <span>{t('common.active')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Tema & Tampilan Antarmuka */}
        <div className="settings-modern-card settings-theme-card-full">
          <div className="settings-modern-card-header">
            <h4 className="settings-card-title">{t('settings.themeTitle')}</h4>
            <p className="settings-card-subtitle">{t('settings.themeSubtitle')}</p>
          </div>

          {/* Sub-bagian 1: Pratinjau Window Mockup Mode Terang & Gelap */}
          <div className="settings-theme-preview-grid">
            {/* Mockup Window Mode Terang */}
            <div
              className={`theme-mockup-card ${theme === 'light' ? 'is-active' : ''}`}
              onClick={() => theme !== 'light' && toggleTheme()}
              role="button"
              tabIndex={0}
              aria-label={t('settings.lightModeTitle')}
            >
              <div className="mockup-window-frame frame-light">
                <div className="mockup-titlebar">
                  <div className="mockup-traffic-dots">
                    <span className="traffic-dot dot-red" />
                    <span className="traffic-dot dot-yellow" />
                    <span className="traffic-dot dot-green" />
                  </div>
                  <div className="mockup-window-title">{t('settings.lightModeTitle')}</div>
                  <div className="mockup-header-placeholder" />
                </div>
                <div className="mockup-app-body">
                  <div className="mockup-sidebar">
                    <div className="mockup-sidebar-logo" />
                    <div className="mockup-nav-item is-active" />
                    <div className="mockup-nav-item" />
                    <div className="mockup-nav-item" />
                  </div>
                  <div className="mockup-content-preview">
                    <div className="mockup-stats-card">
                      <div className="mockup-stat-line short" />
                      <div className="mockup-stat-line long" />
                    </div>
                    <div className="mockup-chart-row">
                      <div className="mockup-chart-bar" style={{ height: '35%' }} />
                      <div className="mockup-chart-bar" style={{ height: '55%' }} />
                      <div className="mockup-chart-bar is-highlight" style={{ height: '90%' }} />
                      <div className="mockup-chart-bar" style={{ height: '65%' }} />
                      <div className="mockup-chart-bar" style={{ height: '45%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="theme-card-footer">
                <div className="theme-radio-circle">
                  {theme === 'light' && <Check size={12} strokeWidth={3} />}
                </div>
                <div className="theme-footer-info">
                  <div className="theme-footer-title-row">
                    <strong className="theme-mode-title">{t('settings.lightModeTitle')}</strong>
                    {theme === 'light' && <span className="theme-active-pill">{t('common.active')}</span>}
                  </div>
                  <span className="theme-mode-desc">{t('settings.lightModeDesc')}</span>
                </div>
              </div>
            </div>

            {/* Mockup Window Mode Gelap */}
            <div
              className={`theme-mockup-card ${theme === 'dark' ? 'is-active' : ''}`}
              onClick={() => theme !== 'dark' && toggleTheme()}
              role="button"
              tabIndex={0}
              aria-label={t('settings.darkModeTitle')}
            >
              <div className="mockup-window-frame frame-dark">
                <div className="mockup-titlebar">
                  <div className="mockup-traffic-dots">
                    <span className="traffic-dot dot-red" />
                    <span className="traffic-dot dot-yellow" />
                    <span className="traffic-dot dot-green" />
                  </div>
                  <div className="mockup-window-title">{t('settings.darkModeTitle')}</div>
                  <div className="mockup-header-placeholder" />
                </div>
                <div className="mockup-app-body">
                  <div className="mockup-sidebar">
                    <div className="mockup-sidebar-logo" />
                    <div className="mockup-nav-item is-active" />
                    <div className="mockup-nav-item" />
                    <div className="mockup-nav-item" />
                  </div>
                  <div className="mockup-content-preview">
                    <div className="mockup-stats-card">
                      <div className="mockup-stat-line short" />
                      <div className="mockup-stat-line long" />
                    </div>
                    <div className="mockup-chart-row">
                      <div className="mockup-chart-bar" style={{ height: '35%' }} />
                      <div className="mockup-chart-bar" style={{ height: '55%' }} />
                      <div className="mockup-chart-bar is-highlight" style={{ height: '90%' }} />
                      <div className="mockup-chart-bar" style={{ height: '65%' }} />
                      <div className="mockup-chart-bar" style={{ height: '45%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="theme-card-footer">
                <div className="theme-radio-circle">
                  {theme === 'dark' && <Check size={12} strokeWidth={3} />}
                </div>
                <div className="theme-footer-info">
                  <div className="theme-footer-title-row">
                    <strong className="theme-mode-title">{t('settings.darkModeTitle')}</strong>
                    {theme === 'dark' && <span className="theme-active-pill">{t('common.active')}</span>}
                  </div>
                  <span className="theme-mode-desc">{t('settings.darkModeDesc')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-bagian 2: Palet Warna Aksen Aplikasi */}
          <div className="settings-accent-section">
            <div className="settings-accent-header">
              <span className="settings-accent-label">{t('settings.accentColorTitle')}</span>
              <span className="settings-accent-sublabel">{t('settings.accentColorSubtitle')}</span>
            </div>

            <div className="accent-palette-grid">
              {ACCENT_COLORS.map((item) => {
                const isSelected = (accentColor || '#2563eb').toLowerCase() === item.hex.toLowerCase();
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`accent-swatch-button ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onUpdateAccentColor && onUpdateAccentColor(item.hex)}
                    title={`Color: ${item.name}`}
                  >
                    <div
                      className="accent-swatch-circle"
                      style={{
                        backgroundColor: item.hex,
                        boxShadow: isSelected
                          ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${item.hex}, 0 6px 14px ${item.hex}55`
                          : undefined
                      }}
                    >
                      {isSelected && <Check size={13} color="#ffffff" strokeWidth={3.5} />}
                    </div>
                    <span className="accent-swatch-name">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Format Mata Uang Utama */}
        <div className="settings-modern-card">
          <div className="settings-modern-card-header">
            <h4 className="settings-card-title">{t('settings.currencyTitle')}</h4>
            <p className="settings-card-subtitle">{t('settings.currencySubtitle')}</p>
          </div>

          <div className="settings-currency-list">
            {CURRENCIES.map((c) => {
              const isSelected = currency === c.symbol;
              const sampleFormatted = formatCurrency(convertCurrencyAmount(75000, 'Rp', c.symbol), c.symbol);
              return (
                <div
                  key={c.code}
                  className={`settings-currency-tile ${isSelected ? 'is-active' : ''}`}
                  onClick={() => onUpdateCurrency(c.symbol)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="currency-tile-left">
                    <span className="currency-tile-symbol font-mono">{c.symbol}</span>
                    <div className="currency-tile-details">
                      <strong className="currency-tile-name">{c.name}</strong>
                      <span className="currency-tile-sample font-mono">
                        {t('settings.currencySample', { sample: sampleFormatted })}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="currency-tile-badge">
                      <Check size={12} />
                      <span>{t('common.active')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 4: Batas Anggaran Harian */}
        <div className="settings-modern-card settings-budget-card">
          <div className="settings-modern-card-header">
            <h4 className="settings-card-title">{t('settings.budgetTitle')}</h4>
            <p className="settings-card-subtitle">{t('settings.budgetSubtitle')}</p>
          </div>

          <div className="settings-budget-hero-box">
            <div className="settings-budget-top-row">
              <div className="budget-amount-wrapper">
                <span className="budget-hero-amount font-mono">
                  {dailyBudget > 0 ? formatCurrency(dailyBudget, currency) : `${currency} ∞`}
                </span>
                <span className="budget-hero-unit">{t('common.perDay')}</span>
              </div>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={onOpenBudgetModal}
              >
                <span>{dailyBudget > 0 ? t('settings.editLimitBtn') : t('settings.setLimitBtn')}</span>
              </button>
            </div>

            <div className="settings-budget-display-row">
              <p className="budget-hero-description">
                {dailyBudget > 0
                  ? t('settings.budgetHeroDesc')
                  : t('settings.budgetHeroDescUnlimited')}
              </p>
            </div>

            <div className="settings-budget-stats-grid">
              <div className="budget-stat-chip">
                <span className="stat-chip-label">{t('summary.monthlyProjection')}</span>
                <strong className="stat-chip-val font-mono">
                  {dailyBudget > 0 ? formatCurrency(dailyBudget * 30, currency) : `${currency} ∞`}
                </strong>
              </div>
            </div>

            {/* Quick Preset Selector */}
            <div className="settings-budget-quick-presets">
              <span className="quick-presets-label">{t('settings.quickPresetsLabel', { currency })}</span>
              <div className="quick-presets-list">
                {getBudgetPresets(currency).map((item) => {
                  const isSelected = dailyBudget === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`budget-preset-pill ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => onUpdateDailyBudget && onUpdateDailyBudget(item.value)}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Ekspor Laporan Excel */}
        <div className="settings-modern-card">
          <div className="settings-modern-card-header">
            <h4 className="settings-card-title">{t('settings.exportTitle')}</h4>
            <p className="settings-card-subtitle">{t('settings.exportSubtitle')}</p>
          </div>

          <div className="settings-export-options-list">
            <div className="settings-export-row">
              <div className="export-row-body">
                <strong className="export-row-title">{t('settings.exportExcelTitle')}</strong>
                <p className="export-row-desc">{t('settings.exportExcelDesc')}</p>
              </div>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={onExportCSV}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FileSpreadsheet size={15} />
                <span>{t('settings.downloadExcelBtn')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 6: Sesi Akun & Privasi */}
        <div className="settings-modern-card">
          <div className="settings-modern-card-header">
            <h4 className="settings-card-title">{t('profile.personalInfoTitle')}</h4>
            <p className="settings-card-subtitle">{t('profile.personalInfoDesc')}</p>
          </div>

          <div className="settings-session-content">
            {currentUser ? (
              <div className="settings-user-pill-card">
                <UserAvatar user={currentUser} size={48} />
                <div className="settings-user-info-text">
                  <div className="settings-user-name-row">
                    <strong className="settings-user-display-name">{currentUser.name}</strong>
                    <span className="settings-user-role-badge">
                      {currentUser.role || 'Personal'}
                    </span>
                  </div>
                  <span className="settings-user-display-email">{currentUser.email || 'Registered User'}</span>
                </div>
                <div className="settings-user-action-buttons">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={onOpenAuthModal}
                  >
                    {t('profile.switchAccountBtn')}
                  </button>
                  <button
                    type="button"
                    className="btn-danger-outline btn-sm"
                    onClick={onLogout}
                    title={t('profile.logOutBtn')}
                  >
                    <span>{t('profile.logOutBtn')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="settings-guest-pill-card">
                <div>
                  <strong>{t('header.guest')}</strong>
                  <p>{t('auth.signInSubtitle')}</p>
                </div>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={onOpenAuthModal}
                >
                  {t('header.signInAccount')}
                </button>
              </div>
            )}

            <div className="settings-system-meta-list">
              <div className="system-meta-item">
                <span className="meta-label">{t('profile.appVersion')}</span>
                <span className="meta-value font-mono">SpendWise v1.0</span>
              </div>
              <div className="system-meta-item">
                <span className="meta-label">{t('profile.dataSecurity')}</span>
                <span className="meta-value text-success">
                  {t('profile.securityVal')}
                </span>
              </div>
              {onOpenCookieSettings && (
                <div className="system-meta-item">
                  <span className="meta-label">{t('cookieConsent.settingsSectionTitle')}</span>
                  <button
                    type="button"
                    className="kpi-action-link"
                    style={{ fontWeight: '600', textDecoration: 'none' }}
                    onClick={onOpenCookieSettings}
                  >
                    {t('cookieConsent.manageBtn')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 7: Zona Berbahaya (Danger Zone) */}
        <div className="settings-modern-card card-danger-modern">
          <div className="settings-modern-card-header">
            <h4 className="settings-card-title text-danger">{t('settings.dangerTitle')}</h4>
            <p className="settings-card-subtitle">{t('settings.dangerSubtitle')}</p>
          </div>

          <div className="settings-danger-content">
            <p className="danger-explanation-text">
              {t('settings.resetConfirmDesc')}
            </p>

            {!showResetConfirm ? (
              <button
                type="button"
                className="btn-danger-outline"
                onClick={() => setShowResetConfirm(true)}
              >
                <span>{t('settings.resetDataBtn')}</span>
              </button>
            ) : (
              <div className="danger-inline-confirmation">
                <div className="confirmation-warning-box">
                  <span>{t('settings.resetConfirmTitle')}</span>
                </div>
                <div className="confirmation-actions-row">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    className="btn-danger-solid btn-sm"
                    onClick={handleConfirmReset}
                  >
                    {t('common.yes')}, {t('common.reset')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
