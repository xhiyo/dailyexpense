import React from 'react';
import {
  Menu,
  User,
  Sun,
  Moon
} from 'lucide-react';
import { formatCurrency } from '../utils/storage';
import { UserAvatar } from './UserAvatar';
import { useTranslation } from '../i18n/LanguageContext';

import { SpendWiseLogo } from './SpendWiseLogo';

export const Header = ({
  onToggleSidebar,
  onOpenMenu,
  activeTab,
  totalSpendToday,
  currency,
  currentUser,
  onOpenProfile,
  onOpenAuthModal,
  theme,
  toggleTheme
}) => {
  const { t } = useTranslation();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return t('nav.dashboard');
      case 'transactions':
        return t('nav.transactions');
      case 'categories':
        return t('categories.pageTitle');
      case 'settings':
        return t('settings.pageTitle');
      case 'profile':
        return t('profile.pageTitle');
      default:
        return t('nav.dashboard');
    }
  };

  const handleMenuClick = () => {
    if (onOpenMenu) {
      onOpenMenu();
    } else if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  return (
    <header className="modern-topbar">
      <div className="topbar-inner">
        {/* Left: Mobile branding / Desktop Page Title */}
        <div className="topbar-left-col">
          {/* Mobile App Branding & Navigation */}
          <div className="mobile-brand-header">
            <div className="mobile-brand-logo-wrap" onClick={handleMenuClick} role="button" tabIndex={0}>
              <SpendWiseLogo size={28} />
              <div className="mobile-brand-text">
                <span className="mobile-app-name">SpendWise</span>
                <span className="mobile-app-page-tag">{getPageTitle()}</span>
              </div>
            </div>
          </div>

          {/* Desktop Title */}
          <h1 className="topbar-heading desktop-only-heading">{getPageTitle()}</h1>
        </div>

        {/* Right Actions */}
        <div className="topbar-right-col">
          {/* Quick Spend Today Indicator */}
          <div className="topbar-spend-badge">
            <span className="spend-pill-label">{t('header.todaySpend')}:</span>
            <span className="spend-pill-val font-mono">{formatCurrency(totalSpendToday, currency)}</span>
          </div>

          {/* Theme Switcher Button */}
          <button
            type="button"
            className="topbar-theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('settings.lightModeTitle') : t('settings.darkModeTitle')}
            aria-label={t('header.switchTheme')}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Dedicated Profile Picture Button */}
          <div className="topbar-user-wrap">
            <button
              type="button"
              id="topbar-profile-btn"
              className={`topbar-avatar-btn ${currentUser ? '' : 'is-guest'} ${activeTab === 'profile' ? 'is-active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!currentUser) {
                  if (onOpenAuthModal) onOpenAuthModal();
                } else {
                  if (onOpenProfile) onOpenProfile();
                }
              }}
              title={currentUser ? `${t('nav.profile')} - ${currentUser.name || 'User'}` : t('header.signInAccount')}
              aria-label={currentUser ? t('nav.profile') : t('header.signInAccount')}
            >
              {currentUser ? (
                <UserAvatar user={currentUser} size={34} />
              ) : (
                <div className="topbar-guest-avatar">
                  <User size={18} />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
