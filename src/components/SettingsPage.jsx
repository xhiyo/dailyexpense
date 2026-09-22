import React, { useState, useEffect } from 'react';
import {
  Check,
  FileSpreadsheet,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Target,
  Moon,
  Sun,
  Bell,
  ArrowLeftRight,
  Trash2,
  ChevronRight,
  Globe,
  LogOut,
  User,
  X
} from 'lucide-react';
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
  onSyncToCloud,
  onBackToDashboard,
  onOpenCookieSettings,
  isMobile: isMobileProp,
  onSelectTab
}) => {
  const { t, language, setLanguage } = useTranslation();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // null | 'syncing' | 'done' | 'error'

  const [isMobileLocal, setIsMobileLocal] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobileLocal(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileLocal;

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spendwise_notifications');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const handleToggleNotifications = async () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('spendwise_notifications', String(next));
      if (next && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        try {
          await Notification.requestPermission();
        } catch {
          // ignore
        }
      }
    }
  };

  const currentCurrencyObj = CURRENCIES.find((c) => c.symbol === currency) || CURRENCIES[0];

  const handleSyncNow = async () => {
    if (!onSyncToCloud) return;
    setSyncStatus('syncing');
    try {
      await onSyncToCloud();
      setSyncStatus('done');
      setTimeout(() => setSyncStatus(null), 4000);
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const handleConfirmReset = () => {
    onResetData();
    setShowResetConfirm(false);
  };

  // Dedicated Native Mobile Layout (Matching user screenshot)
  if (isMobile) {
    return (
      <div className="mobile-settings-view">
        {/* Header (Exact typography & layout from user screenshot) */}
        <div className="mobile-settings-header">
          <h1 className="mobile-settings-title">{language === 'en' ? 'Settings' : 'Pengaturan'}</h1>
          <p className="mobile-settings-subtitle">{language === 'en' ? 'Manage your preferences' : 'Kelola preferensi Anda'}</p>
        </div>

        {/* User Account Tile (If logged in, show user row. If guest, show sign-in prompt) */}
        {currentUser ? (
          <div
            className="mobile-settings-user-card"
            onClick={() => onSelectTab && onSelectTab('profile')}
            role="button"
            tabIndex={0}
          >
            <UserAvatar user={currentUser} size={42} />
            <div className="mobile-user-details">
              <span className="mobile-user-name">{currentUser.name}</span>
              <span className="mobile-user-email">{currentUser.email || 'Personal Account'}</span>
            </div>
            <ChevronRight size={18} className="mobile-row-chevron" />
          </div>
        ) : (
          <div
            className="mobile-settings-guest-card"
            onClick={onOpenAuthModal}
            role="button"
            tabIndex={0}
          >
            <div className="mobile-guest-left">
              <div className="mobile-guest-icon-box">
                <User size={18} />
              </div>
              <div className="mobile-guest-text">
                <span className="mobile-guest-title">{language === 'en' ? 'Sign In / Register' : 'Masuk / Daftar Akun'}</span>
                <span className="mobile-guest-sub">{language === 'en' ? 'Sync expenses across devices' : 'Sinkronkan data dengan aman'}</span>
              </div>
            </div>
            <ChevronRight size={18} className="mobile-row-chevron" />
          </div>
        )}

        {/* Main Grouped List Card (From User Screenshot) */}
        <div className="mobile-settings-card">
          {/* Row 1: Daily Limit */}
          <button
            type="button"
            className="mobile-settings-row"
            onClick={onOpenBudgetModal}
            aria-label={language === 'en' ? 'Daily Limit' : 'Batas Limit Harian'}
          >
            <div className="mobile-row-left">
              <div className="mobile-row-icon-box box-target">
                <Target size={20} />
              </div>
              <div className="mobile-row-text">
                <span className="mobile-row-title">{language === 'en' ? 'Daily Limit' : 'Batas Limit'}</span>
                <span className="mobile-row-desc font-mono">
                  {dailyBudget > 0 ? formatCurrency(dailyBudget, currency) : (language === 'en' ? 'No limit set' : 'Tanpa batas')}
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="mobile-row-chevron" />
          </button>

          {/* Row 2: Dark Mode */}
          <button
            type="button"
            className="mobile-settings-row"
            onClick={toggleTheme}
            aria-label={language === 'en' ? 'Dark Mode' : 'Mode Gelap'}
          >
            <div className="mobile-row-left">
              <div className="mobile-row-icon-box box-moon">
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div className="mobile-row-text">
                <span className="mobile-row-title">{language === 'en' ? 'Dark Mode' : 'Mode Gelap'}</span>
                <span className="mobile-row-desc">
                  {theme === 'dark' ? (language === 'en' ? 'On' : 'Aktif') : (language === 'en' ? 'Off' : 'Mati')}
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="mobile-row-chevron" />
          </button>

          {/* Row 3: Notifications */}
          <button
            type="button"
            className="mobile-settings-row"
            onClick={handleToggleNotifications}
            aria-label={language === 'en' ? 'Notifications' : 'Notifikasi'}
          >
            <div className="mobile-row-left">
              <div className="mobile-row-icon-box box-bell">
                <Bell size={20} />
              </div>
              <div className="mobile-row-text">
                <span className="mobile-row-title">{language === 'en' ? 'Notifications' : 'Notifikasi'}</span>
                <span className="mobile-row-desc">
                  {notificationsEnabled ? (language === 'en' ? 'Enabled' : 'Aktif') : (language === 'en' ? 'Disabled' : 'Mati')}
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="mobile-row-chevron" />
          </button>

          {/* Row 4: Currency */}
          <button
            type="button"
            className="mobile-settings-row"
            onClick={() => setShowCurrencyPicker(true)}
            aria-label={language === 'en' ? 'Currency' : 'Mata Uang'}
          >
            <div className="mobile-row-left">
              <div className="mobile-row-icon-box box-currency">
                <ArrowLeftRight size={20} />
              </div>
              <div className="mobile-row-text">
                <span className="mobile-row-title">{language === 'en' ? 'Currency' : 'Mata Uang'}</span>
                <span className="mobile-row-desc">
                  {currentCurrencyObj ? `${currentCurrencyObj.code} (${currentCurrencyObj.name})` : currency}
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="mobile-row-chevron" />
          </button>

          {/* Row 5: Export Data */}
          <button
            type="button"
            className="mobile-settings-row"
            onClick={onExportCSV}
            aria-label={language === 'en' ? 'Export Data' : 'Ekspor Data'}
          >
            <div className="mobile-row-left">
              <div className="mobile-row-icon-box box-export">
                <FileSpreadsheet size={20} />
              </div>
              <div className="mobile-row-text">
                <span className="mobile-row-title">{language === 'en' ? 'Export Data' : 'Ekspor Data'}</span>
                <span className="mobile-row-desc">CSV / Excel</span>
              </div>
            </div>
            <ChevronRight size={18} className="mobile-row-chevron" />
          </button>

          {/* Row 6: Clear All Data */}
          <button
            type="button"
            className="mobile-settings-row row-danger"
            onClick={() => setShowResetConfirm(true)}
            aria-label={language === 'en' ? 'Clear All Data' : 'Hapus Semua Data'}
          >
            <div className="mobile-row-left">
              <div className="mobile-row-icon-box box-trash">
                <Trash2 size={20} />
              </div>
              <div className="mobile-row-text">
                <span className="mobile-row-title text-danger">{language === 'en' ? 'Clear All Data' : 'Hapus Semua Data'}</span>
                <span className="mobile-row-desc">{language === 'en' ? 'Delete history' : 'Hapus riwayat'}</span>
              </div>
            </div>
            <ChevronRight size={18} className="mobile-row-chevron" />
          </button>
        </div>

        {/* Secondary Preferences Card */}
        <div className="mobile-settings-card">
          {/* Language Switcher */}
          <button
            type="button"
            className="mobile-settings-row"
            onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
            aria-label={language === 'en' ? 'Language' : 'Bahasa'}
          >
            <div className="mobile-row-left">
              <div className="mobile-row-icon-box box-purple">
                <Globe size={20} />
              </div>
              <div className="mobile-row-text">
                <span className="mobile-row-title">{language === 'en' ? 'Language' : 'Bahasa'}</span>
                <span className="mobile-row-desc">
                  {language === 'en' ? 'English (US)' : 'Bahasa Indonesia'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="mobile-lang-chip">{language.toUpperCase()}</span>
              <ChevronRight size={18} className="mobile-row-chevron" />
            </div>
          </button>

          {/* Cloud Sync Status (if logged in) */}
          {currentUser && onSyncToCloud && (
            <button
              type="button"
              className="mobile-settings-row"
              onClick={handleSyncNow}
              disabled={syncStatus === 'syncing'}
              aria-label={language === 'en' ? 'Cloud Sync' : 'Sinkronisasi Cloud'}
            >
              <div className="mobile-row-left">
                <div className="mobile-row-icon-box box-blue">
                  <RefreshCw size={20} className={syncStatus === 'syncing' ? 'spin-icon' : ''} />
                </div>
                <div className="mobile-row-text">
                  <span className="mobile-row-title">{language === 'en' ? 'Cloud Sync' : 'Sinkronisasi Cloud'}</span>
                  <span className="mobile-row-desc">
                    {syncStatus === 'syncing'
                      ? (language === 'en' ? 'Syncing...' : 'Menyinkronkan...')
                      : syncStatus === 'done'
                      ? (language === 'en' ? 'All Synced!' : 'Semua Tersinkron!')
                      : (language === 'en' ? 'Auto-sync connected' : 'Sinkronisasi aktif')}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="mobile-row-chevron" />
            </button>
          )}
        </div>

        {/* Logout Row (if logged in) */}
        {currentUser && (
          <button
            type="button"
            className="mobile-settings-logout-btn"
            onClick={onLogout}
          >
            <LogOut size={17} />
            <span>{language === 'en' ? 'Log Out' : 'Keluar Akun'} ({currentUser.name?.split(' ')[0]})</span>
          </button>
        )}

        {/* Currency Bottom Modal Sheet */}
        {showCurrencyPicker && (
          <div className="mobile-picker-overlay" onClick={() => setShowCurrencyPicker(false)}>
            <div className="mobile-picker-sheet animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-picker-header">
                <h3 className="mobile-picker-title">{language === 'en' ? 'Select Currency' : 'Pilih Mata Uang'}</h3>
                <button
                  type="button"
                  className="mobile-picker-close"
                  onClick={() => setShowCurrencyPicker(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mobile-picker-list">
                {CURRENCIES.map((c) => {
                  const isSelected = currency === c.symbol;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      className={`mobile-picker-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        onUpdateCurrency(c.symbol);
                        setShowCurrencyPicker(false);
                      }}
                    >
                      <div className="picker-item-left">
                        <span className="picker-item-symbol font-mono">{c.symbol}</span>
                        <div className="picker-item-info">
                          <strong className="picker-item-code">{c.code}</strong>
                          <span className="picker-item-name">{c.name}</span>
                        </div>
                      </div>
                      {isSelected && <Check size={18} className="picker-item-check" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="mobile-picker-overlay" onClick={() => setShowResetConfirm(false)}>
            <div className="mobile-confirm-modal animate-scaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-confirm-icon-box">
                <Trash2 size={24} color="#ef4444" />
              </div>
              <h3 className="mobile-confirm-title">{language === 'en' ? 'Clear All Data?' : 'Hapus Semua Data?'}</h3>
              <p className="mobile-confirm-desc">
                {language === 'en'
                  ? 'This action will permanently delete all stored expense records from this device.'
                  : 'Tindakan ini akan menghapus semua riwayat catatan pengeluaran dari perangkat ini.'}
              </p>
              <div className="mobile-confirm-actions">
                <button
                  type="button"
                  className="btn-secondary mobile-confirm-cancel"
                  onClick={() => setShowResetConfirm(false)}
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="button"
                  className="btn-danger-solid mobile-confirm-delete"
                  onClick={handleConfirmReset}
                >
                  {language === 'en' ? 'Delete History' : 'Hapus Riwayat'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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

        {/* Card 7: Sinkronisasi Otomatis Cloud */}
        {onSyncToCloud && (
          <div className="settings-modern-card">
            <div className="settings-modern-card-header">
              <h4 className="settings-card-title">☁️ {language === 'en' ? 'Automatic Real-Time Cloud Sync' : 'Sinkronisasi Otomatis Real-Time'}</h4>
              <p className="settings-card-subtitle">
                {language === 'en'
                  ? 'All expenses and daily spending limits automatically sync between Laptop and Mobile.'
                  : 'Semua transaksi dan batas limit harian otomatis tersinkronisasi antara HP dan Laptop.'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(34, 197, 94, 0.12)',
                color: 'var(--color-success, #22c55e)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                width: 'fit-content'
              }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
                {language === 'en' ? 'Status: Connected & Auto-Syncing' : 'Status: Terhubung & Sinkron Otomatis Aktif'}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {language === 'en'
                  ? 'No manual push or pull needed. Whenever you add or edit transactions or change your spending limit on any device, it is updated everywhere automatically.'
                  : 'Tidak perlu push atau pull manual. Setiap kali Anda mencatat transaksi atau mengubah batas limit di HP maupun Laptop, data akan langsung terupdate otomatis.'}
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSyncNow}
                disabled={syncStatus === 'syncing'}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content', cursor: 'pointer' }}
              >
                {syncStatus === 'syncing' ? (
                  <><RefreshCw size={15} className="spin-icon" /> {language === 'en' ? 'Syncing...' : 'Menyinkronkan...'}</>
                ) : syncStatus === 'done' ? (
                  <><Check size={15} color="var(--color-success, #22c55e)" /> {language === 'en' ? 'Synced!' : 'Tersinkronkan!'}</>
                ) : syncStatus === 'error' ? (
                  <><RefreshCw size={15} /> {language === 'en' ? 'Retry Sync' : 'Coba Lagi'}</>
                ) : (
                  <><RefreshCw size={15} /> {language === 'en' ? 'Sync Now' : 'Sinkronkan Sekarang'}</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Card 8: Zona Berbahaya (Danger Zone) */}
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
