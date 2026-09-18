import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Sliders,
  Tag,
  X,
  FileSpreadsheet,
  LogOut,
  User,
  LogIn,
  UserPlus,
  ChevronsUpDown,
  Check
} from 'lucide-react';
import { SpendWiseLogo } from './SpendWiseLogo';
import { UserAvatar } from './UserAvatar';
import { useTranslation } from '../i18n/LanguageContext';

export const Sidebar = ({
  activeTab,
  onSelectTab,
  dailyBudget = 0,
  currency = 'Rp',
  onExportCSV,
  currentUser,
  onOpenAuthModal,
  onLogout,
  isOpen,
  onClose,
  unreadTransactionsCount = 0,
  linkedAccounts = [],
  onSwitchAccount,
  onOpenAddAccount,
  onRemoveLinkedAccount
}) => {
  const { t } = useTranslation();
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const switcherRef = useRef(null);

  // Close switcher popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setIsAccountSwitcherOpen(false);
      }
    };
    if (isAccountSwitcherOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isAccountSwitcherOpen]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="modern-sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside className={`modern-sidebar ${isOpen ? 'is-open' : ''}`}>
        {/* Sidebar Brand Header */}
        <div className="modern-sidebar-header">
          <div
            className="sidebar-brand-link"
            onClick={() => {
              onSelectTab('dashboard');
              if (window.innerWidth <= 768 && isOpen) onClose();
            }}
          >
            <SpendWiseLogo size={34} />
            <div className="sidebar-brand-info">
              <span className="sidebar-brand-name">SpendWise</span>
              <span className="sidebar-brand-desc">{t('header.appTagline')}</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label={t('header.closeMenu')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="modern-sidebar-nav">
          <div className="sidebar-nav-section">
            <span className="sidebar-section-title">{t('nav.menu')}</span>

            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === 'dashboard' ? 'is-active' : ''}`}
              onClick={() => {
                onSelectTab('dashboard');
                if (window.innerWidth <= 768 && isOpen) onClose();
              }}
            >
              <LayoutDashboard size={16} />
              <span className="nav-btn-label">{t('nav.dashboard')}</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === 'transactions' ? 'is-active' : ''}`}
              onClick={() => {
                onSelectTab('transactions');
                if (window.innerWidth <= 768 && isOpen) onClose();
              }}
            >
              <ReceiptText size={16} />
              <span className="nav-btn-label">{t('nav.transactions')}</span>
              {unreadTransactionsCount > 0 && (
                <span className="nav-btn-badge font-mono badge-unread" title={`${unreadTransactionsCount} ${t('common.records')}`}>
                  {unreadTransactionsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === 'profile' ? 'is-active' : ''}`}
              onClick={() => {
                if (!currentUser) {
                  onOpenAuthModal();
                  if (window.innerWidth <= 768 && isOpen) onClose();
                  return;
                }
                onSelectTab('profile');
                if (window.innerWidth <= 768 && isOpen) onClose();
              }}
            >
              <User size={16} />
              <span className="nav-btn-label">{t('nav.profile')}</span>
            </button>
          </div>

          <div className="sidebar-nav-section">
            <span className="sidebar-section-title">{t('nav.settings')}</span>

            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === 'categories' ? 'is-active' : ''}`}
              onClick={() => {
                if (!currentUser) {
                  onOpenAuthModal();
                  if (window.innerWidth <= 768 && isOpen) onClose();
                  return;
                }
                onSelectTab('categories');
                if (window.innerWidth <= 768 && isOpen) onClose();
              }}
            >
              <Tag size={16} />
              <span className="nav-btn-label">{t('nav.categories')}</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === 'settings' ? 'is-active' : ''}`}
              onClick={() => {
                onSelectTab('settings');
                if (window.innerWidth <= 768 && isOpen) onClose();
              }}
            >
              <Sliders size={16} />
              <span className="nav-btn-label">{t('nav.settings')}</span>
            </button>
          </div>

          <div className="sidebar-nav-section">
            <span className="sidebar-section-title">{t('nav.export')}</span>

            <button
              type="button"
              className="sidebar-nav-btn"
              onClick={() => {
                onExportCSV();
                if (window.innerWidth <= 768 && isOpen) onClose();
              }}
            >
              <FileSpreadsheet size={16} />
              <span className="nav-btn-label">{t('nav.exportExcel')}</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer: User profile or Sign In & Multi-Account Switcher */}
        <div className="sidebar-footer">
          {currentUser ? (
            <div className="sidebar-account-container" ref={switcherRef}>
              {/* Linked Accounts Switcher Popover (opens upward above user card) */}
              {isAccountSwitcherOpen && (
                <div className="sidebar-switcher-popover animate-fadeInUp">
                  <div className="sidebar-switcher-popover-header">
                    <div className="switcher-header-title">
                      <span>{t('profile.linkedAccountsTitle')}</span>
                      <span className="switcher-count-pill font-mono">{linkedAccounts.length}/3</span>
                    </div>
                    <button
                      type="button"
                      className="switcher-close-btn"
                      onClick={() => setIsAccountSwitcherOpen(false)}
                      aria-label="Close"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="sidebar-switcher-list">
                    {linkedAccounts.map(account => {
                      const isActive = account.id === currentUser.id;
                      return (
                        <div
                          key={account.id}
                          className={`sidebar-switcher-item ${isActive ? 'is-active' : ''}`}
                          onClick={() => {
                            if (!isActive && onSwitchAccount) {
                              onSwitchAccount(account);
                              setIsAccountSwitcherOpen(false);
                              if (window.innerWidth <= 768 && isOpen) onClose();
                            }
                          }}
                        >
                          <UserAvatar user={account} size={28} />
                          <div className="switcher-item-details">
                            <div className="switcher-item-name-row">
                              <span className="switcher-item-name">{account.name}</span>
                              {isActive && (
                                <span className="switcher-item-active-badge">
                                  <Check size={10} /> {t('profile.activeBadge')}
                                </span>
                              )}
                            </div>
                            <span className="switcher-item-email font-mono">{account.email}</span>
                          </div>

                          {!isActive && onRemoveLinkedAccount && (
                            <div className="switcher-item-action-btns" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                className="switcher-item-unlink-btn"
                                onClick={() => {
                                  setIsAccountSwitcherOpen(false);
                                  onRemoveLinkedAccount(account);
                                }}
                                title={t('profile.unlinkAccount')}
                                aria-label={t('profile.unlinkAccount')}
                              >
                                {t('profile.unlinkAccount')}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="sidebar-switcher-footer">
                    {linkedAccounts.length < 3 ? (
                      <button
                        type="button"
                        className="switcher-add-new-btn"
                        onClick={() => {
                          setIsAccountSwitcherOpen(false);
                          if (onOpenAddAccount) onOpenAddAccount();
                          else onOpenAuthModal();
                          if (window.innerWidth <= 768 && isOpen) onClose();
                        }}
                      >
                        <UserPlus size={13} />
                        <span>{t('profile.linkAccountBtn')}</span>
                      </button>
                    ) : (
                      <span className="switcher-max-reached-note">
                        {language === 'en' ? 'Max 3 accounts linked' : 'Maksimal 3 akun tertaut'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Active User Card */}
              <div
                className={`sidebar-user-card ${activeTab === 'profile' ? 'is-active' : ''}`}
                onClick={() => {
                  onSelectTab('profile');
                  if (window.innerWidth <= 768 && isOpen) onClose();
                }}
                title={t('nav.profile')}
                style={{ cursor: 'pointer' }}
              >
                <UserAvatar user={currentUser} size={32} />
                <div className="user-mini-details">
                  <div className="user-mini-name-row">
                    <span className="user-mini-name">{currentUser.name}</span>
                    {linkedAccounts.length > 1 && (
                      <span
                        className="user-accounts-badge font-mono"
                        title={`${linkedAccounts.length}/3 ${t('profile.linkedAccountsTitle')}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAccountSwitcherOpen(prev => !prev);
                        }}
                      >
                        {linkedAccounts.length}
                      </span>
                    )}
                  </div>
                  <span className="user-mini-email">{currentUser.email}</span>
                </div>
                <div className="user-mini-controls">
                  {linkedAccounts.length > 1 && (
                    <button
                      type="button"
                      className={`user-mini-switcher-btn ${isAccountSwitcherOpen ? 'is-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAccountSwitcherOpen(prev => !prev);
                      }}
                      title={t('profile.switchAccountBtn')}
                      aria-label={t('profile.switchAccountBtn')}
                    >
                      <ChevronsUpDown size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="user-mini-logout"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLogout();
                    }}
                    title={t('nav.logOut')}
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="sidebar-login-btn"
              onClick={() => {
                onOpenAuthModal();
                if (window.innerWidth <= 768 && isOpen) onClose();
              }}
            >
              <LogIn size={15} />
              <span>{t('header.signInAccount')}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
