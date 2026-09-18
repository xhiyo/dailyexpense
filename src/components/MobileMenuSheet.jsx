import React from 'react';
import {
  User,
  Sliders,
  FileSpreadsheet,
  LogOut,
  LogIn,
  Sun,
  Moon,
  X,
  Target,
  UserPlus,
  Check,
  ChevronRight,
  Globe,
  Smartphone
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { formatCurrency } from '../utils/storage';
import { useTranslation } from '../i18n/LanguageContext';
import { triggerInstallPrompt, isStandalone } from '../utils/pwa';

export const MobileMenuSheet = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuthModal,
  onLogout,
  linkedAccounts = [],
  onSwitchAccount,
  onOpenAddAccount,
  onSelectTab,
  theme,
  toggleTheme,
  dailyBudget = 0,
  currency = 'Rp',
  onOpenBudgetModal,
  onExportCSV,
  onOpenInstallGuide
}) => {
  const { t, language, setLanguage } = useTranslation();

  if (!isOpen) return null;

  const handleInstallApp = async () => {
    if (isStandalone()) {
      alert(language === 'en' ? 'SpendWise is already installed on your device!' : 'SpendWise sudah terpasang di perangkat Anda!');
      onClose();
      return;
    }
    const res = await triggerInstallPrompt();
    if (res.outcome === 'manual_required') {
      if (onOpenInstallGuide) onOpenInstallGuide();
    }
    onClose();
  };

  const handleNavigate = (tab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <div className="mobile-sheet-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mobile-sheet-content animate-slideUp" onClick={(e) => e.stopPropagation()}>
        {/* Drag handle */}
        <div className="mobile-sheet-handle-bar">
          <div className="mobile-sheet-handle" />
        </div>

        {/* Sheet Header */}
        <div className="mobile-sheet-header">
          <h3 className="mobile-sheet-title">{t('nav.menu')}</h3>
          <button
            type="button"
            className="mobile-sheet-close-btn"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mobile-sheet-body">
          {/* User Profile Card */}
          <div className="mobile-user-card">
            {currentUser ? (
              <>
                <div
                  className="mobile-user-main"
                  onClick={() => handleNavigate('profile')}
                  role="button"
                  tabIndex={0}
                >
                  <UserAvatar user={currentUser} size={42} />
                  <div className="mobile-user-info">
                    <div className="mobile-user-name-row">
                      <span className="mobile-user-name">{currentUser.name}</span>
                      <span className="mobile-user-tag">{t('profile.activeBadge')}</span>
                    </div>
                    <span className="mobile-user-email">{currentUser.email}</span>
                  </div>
                  <ChevronRight size={18} className="mobile-chevron-icon" />
                </div>

                {/* Linked Accounts Quick Switcher on Mobile */}
                {linkedAccounts.length > 1 && (
                  <div className="mobile-linked-accounts-strip">
                    <span className="mobile-linked-label">
                      {t('profile.switchAccountBtn')} ({linkedAccounts.length}/3):
                    </span>
                    <div className="mobile-linked-chips">
                      {linkedAccounts.map((acc) => {
                        const isActive = acc.id === currentUser.id;
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            className={`mobile-account-chip ${isActive ? 'is-active' : ''}`}
                            onClick={() => {
                              if (!isActive && onSwitchAccount) {
                                onSwitchAccount(acc);
                              }
                            }}
                          >
                            <UserAvatar user={acc} size={20} />
                            <span className="mobile-chip-name">{acc.name?.split(' ')[0]}</span>
                            {isActive && <Check size={12} className="mobile-chip-check" />}
                          </button>
                        );
                      })}
                      {linkedAccounts.length < 3 && onOpenAddAccount && (
                        <button
                          type="button"
                          className="mobile-account-chip chip-add"
                          onClick={() => {
                            onOpenAddAccount();
                            onClose();
                          }}
                        >
                          <UserPlus size={13} />
                          <span>+ {t('profile.linkAccountBtn')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="mobile-guest-card">
                <div className="mobile-guest-info">
                  <div className="mobile-guest-avatar">
                    <User size={22} />
                  </div>
                  <div>
                    <h4 className="mobile-guest-title">{t('header.signInAccount')}</h4>
                    <p className="mobile-guest-desc">
                      {language === 'en'
                        ? 'Sync expenses and access from multiple devices.'
                        : 'Simpan riwayat belanja Anda dengan aman.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary mobile-guest-login-btn"
                  onClick={() => {
                    onOpenAuthModal();
                    onClose();
                  }}
                >
                  <LogIn size={15} />
                  <span>{t('header.signInAccount')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Action Tiles */}
          <div className="mobile-action-tiles">
            {/* Profil */}
            <button
              type="button"
              className="mobile-tile-btn"
              onClick={() => {
                if (!currentUser) {
                  onOpenAuthModal();
                  onClose();
                } else {
                  handleNavigate('profile');
                }
              }}
            >
              <div className="mobile-tile-icon-box tile-purple">
                <User size={18} />
              </div>
              <div className="mobile-tile-content">
                <span className="mobile-tile-label">{t('nav.profile')}</span>
                <span className="mobile-tile-sub">
                  {currentUser ? (language === 'en' ? 'Account & security' : 'Akun & keamanan') : (language === 'en' ? 'Sign in to access' : 'Masuk akun')}
                </span>
              </div>
              <ChevronRight size={16} className="mobile-tile-arrow" />
            </button>

            {/* Pengaturan */}
            <button
              type="button"
              className="mobile-tile-btn"
              onClick={() => handleNavigate('settings')}
            >
              <div className="mobile-tile-icon-box tile-blue">
                <Sliders size={18} />
              </div>
              <div className="mobile-tile-content">
                <span className="mobile-tile-label">{t('nav.settings')}</span>
                <span className="mobile-tile-sub">
                  {language === 'en' ? 'Themes, currency, & language' : 'Tema, mata uang, & bahasa'}
                </span>
              </div>
              <ChevronRight size={16} className="mobile-tile-arrow" />
            </button>

            {/* Batas Limit Harian Shortcut */}
            <button
              type="button"
              className="mobile-tile-btn"
              onClick={() => {
                if (onOpenBudgetModal) onOpenBudgetModal();
                onClose();
              }}
            >
              <div className="mobile-tile-icon-box tile-amber">
                <Target size={18} />
              </div>
              <div className="mobile-tile-content">
                <span className="mobile-tile-label">{t('summary.dailyBudget')}</span>
                <span className="mobile-tile-sub font-mono">
                  {dailyBudget > 0 ? formatCurrency(dailyBudget, currency) : (language === 'en' ? 'No limit set' : 'Tanpa batas')}
                </span>
              </div>
              <ChevronRight size={16} className="mobile-tile-arrow" />
            </button>

            {/* Ekspor Excel */}
            <button
              type="button"
              className="mobile-tile-btn"
              onClick={() => {
                if (onExportCSV) onExportCSV();
                onClose();
              }}
            >
              <div className="mobile-tile-icon-box tile-green">
                <FileSpreadsheet size={18} />
              </div>
              <div className="mobile-tile-content">
                <span className="mobile-tile-label">{t('nav.exportExcel')}</span>
                <span className="mobile-tile-sub">
                  {language === 'en' ? 'Download .xlsx report' : 'Unduh laporan .xlsx'}
                </span>
              </div>
              <ChevronRight size={16} className="mobile-tile-arrow" />
            </button>

            {/* Pasang Aplikasi Mobile (PWA) */}
            <button
              type="button"
              className="mobile-tile-btn"
              onClick={handleInstallApp}
            >
              <div className="mobile-tile-icon-box tile-blue">
                <Smartphone size={18} />
              </div>
              <div className="mobile-tile-content">
                <span className="mobile-tile-label">
                  {language === 'en' ? 'Install App' : 'Pasang Aplikasi'}
                </span>
                <span className="mobile-tile-sub">
                  {language === 'en' ? 'Add to Home Screen' : 'Tambahkan ke Layar Utama'}
                </span>
              </div>
              <ChevronRight size={16} className="mobile-tile-arrow" />
            </button>
          </div>

          {/* Quick Preferences Bar (Theme & Language) */}
          <div className="mobile-quick-prefs-row">
            {/* Theme toggle */}
            <div className="mobile-pref-pill">
              <span className="mobile-pref-label">{theme === 'dark' ? t('settings.darkModeTitle') : t('settings.lightModeTitle')}</span>
              <button
                type="button"
                className="mobile-theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={t('header.switchTheme')}
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>

            {/* Language toggle */}
            <div className="mobile-pref-pill">
              <span className="mobile-pref-label">
                <Globe size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                {language === 'en' ? 'English' : 'Indonesia'}
              </span>
              <div className="mobile-lang-switch">
                <button
                  type="button"
                  className={`mobile-lang-btn ${language === 'en' ? 'is-active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`mobile-lang-btn ${language === 'id' ? 'is-active' : ''}`}
                  onClick={() => setLanguage('id')}
                >
                  ID
                </button>
              </div>
            </div>
          </div>

          {/* Logout Button (if logged in) */}
          {currentUser && (
            <div className="mobile-logout-section">
              <button
                type="button"
                className="mobile-logout-btn"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
              >
                <LogOut size={16} />
                <span>{t('nav.logOut')} ({currentUser.name?.split(' ')[0]})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
