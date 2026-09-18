import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  Tag,
  Menu
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export const MobileBottomNav = ({
  activeTab,
  onSelectTab,
  onOpenAddExpense,
  unreadTransactionsCount = 0,
  onOpenMenu,
  isMenuOpen = false
}) => {
  const { t } = useTranslation();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation Bar">
      <div className="mobile-bottom-nav-inner">
        {/* Tab 1: Dashboard / Ringkasan */}
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'dashboard' && !isMenuOpen ? 'is-active' : ''}`}
          onClick={() => onSelectTab('dashboard')}
          aria-label={t('nav.dashboard')}
        >
          <div className="mobile-nav-icon-wrap">
            <LayoutDashboard size={20} />
          </div>
          <span className="mobile-nav-label">{t('nav.dashboard')}</span>
        </button>

        {/* Tab 2: Transactions / Riwayat */}
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'transactions' && !isMenuOpen ? 'is-active' : ''}`}
          onClick={() => onSelectTab('transactions')}
          aria-label={t('nav.transactions')}
        >
          <div className="mobile-nav-icon-wrap">
            <ReceiptText size={20} />
            {unreadTransactionsCount > 0 && (
              <span className="mobile-nav-badge font-mono">
                {unreadTransactionsCount > 99 ? '99+' : unreadTransactionsCount}
              </span>
            )}
          </div>
          <span className="mobile-nav-label">{t('nav.transactions')}</span>
        </button>

        {/* Tab 3: Center Elevated Floating Action Button (FAB) - Quick Add Expense */}
        <div className="mobile-fab-container">
          <button
            type="button"
            className="mobile-fab-btn"
            onClick={onOpenAddExpense}
            title={t('expenses.newExpenseBtn')}
            aria-label={t('expenses.newExpenseBtn')}
          >
            <div className="mobile-fab-glow" />
            <Plus size={24} className="mobile-fab-icon" />
          </button>
          <span className="mobile-fab-label">{t('expenses.addExpense')}</span>
        </div>

        {/* Tab 4: Categories / Kategori */}
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'categories' && !isMenuOpen ? 'is-active' : ''}`}
          onClick={() => onSelectTab('categories')}
          aria-label={t('nav.categories')}
        >
          <div className="mobile-nav-icon-wrap">
            <Tag size={20} />
          </div>
          <span className="mobile-nav-label">{t('nav.categories')}</span>
        </button>

        {/* Tab 5: Menu / Akun (Opens Mobile Menu Sheet) */}
        <button
          type="button"
          className={`mobile-nav-item ${isMenuOpen || activeTab === 'settings' || activeTab === 'profile' ? 'is-active' : ''}`}
          onClick={onOpenMenu}
          aria-label={t('nav.menu')}
        >
          <div className="mobile-nav-icon-wrap">
            <Menu size={20} />
          </div>
          <span className="mobile-nav-label">{t('nav.menu')}</span>
        </button>
      </div>
    </nav>
  );
};
