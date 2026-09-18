import React, { useState, useMemo, useEffect } from 'react';
import { Search, Edit2, Trash2, Plus } from 'lucide-react';
import { getCategoryById, CATEGORIES, PAYMENT_METHODS } from '../data/categories';
import { formatCurrency } from '../utils/storage';
import { useTranslation } from '../i18n/LanguageContext';

export const ExpenseList = ({
  expenses = [],
  selectedDate,
  currency = 'Rp',
  categories = CATEGORIES,
  onEditExpense,
  onDeleteExpense,
  onOpenAddModal,
  showAllDates = false,
  currentUser = null
}) => {
  const { t, language, localizeCategoryName } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('time-desc');
  const [filterDateMode, setFilterDateMode] = useState(showAllDates ? 'all' : 'selected');

  useEffect(() => {
    setFilterDateMode(showAllDates ? 'all' : 'selected');
  }, [showAllDates]);

  // Helper to extract creation timestamp for reliable tie-breaking
  const getCreatedTimestamp = (item) => {
    if (item.createdAt && typeof item.createdAt === 'number') {
      return item.createdAt;
    }
    if (item.id && typeof item.id === 'string' && item.id.startsWith('exp-')) {
      const parts = item.id.split('-');
      const ts = parseInt(parts[1], 10);
      if (!isNaN(ts)) return ts;
    }
    return 0;
  };

  const getTimeString = (item) => {
    if (item.time && item.time.trim() !== '') return item.time;
    const ts = getCreatedTimestamp(item);
    if (ts && ts > 1000000000000) {
      const d = new Date(ts);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return '00:00';
  };

  const getExpenseDisplayTime = (item) => {
    return getTimeString(item);
  };

  // Filter & sort expenses
  const filteredExpenses = useMemo(() => {
    let list = expenses;

    // Filter Date
    if (filterDateMode === 'selected' && selectedDate) {
      list = list.filter(e => e.date === selectedDate);
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(e =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(e => (e.categoryId || e.category) === selectedCategory);
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'amount-desc') {
        const diff = Number(b.amount || 0) - Number(a.amount || 0);
        if (diff !== 0) return diff;
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        if (dateDiff !== 0) return dateDiff;
        const timeDiff = getTimeString(b).localeCompare(getTimeString(a));
        if (timeDiff !== 0) return timeDiff;
        return getCreatedTimestamp(b) - getCreatedTimestamp(a);
      }
      if (sortBy === 'amount-asc') {
        const diff = Number(a.amount || 0) - Number(b.amount || 0);
        if (diff !== 0) return diff;
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        if (dateDiff !== 0) return dateDiff;
        const timeDiff = getTimeString(b).localeCompare(getTimeString(a));
        if (timeDiff !== 0) return timeDiff;
        return getCreatedTimestamp(b) - getCreatedTimestamp(a);
      }
      if (sortBy === 'time-asc') {
        const dateDiff = (a.date || '').localeCompare(b.date || '');
        if (dateDiff !== 0) return dateDiff;
        const timeDiff = getTimeString(a).localeCompare(getTimeString(b));
        if (timeDiff !== 0) return timeDiff;
        return getCreatedTimestamp(a) - getCreatedTimestamp(b);
      }
      // default: 'time-desc' (Newest)
      const dateDiff = (b.date || '').localeCompare(a.date || '');
      if (dateDiff !== 0) return dateDiff;
      const timeDiff = getTimeString(b).localeCompare(getTimeString(a));
      if (timeDiff !== 0) return timeDiff;
      return getCreatedTimestamp(b) - getCreatedTimestamp(a);
    });
  }, [expenses, selectedDate, filterDateMode, searchTerm, selectedCategory, sortBy]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [filteredExpenses]);

  const getMethodName = (methodId) => {
    const item = PAYMENT_METHODS.find(m => m.id === methodId);
    if (!item) return language === 'en' ? 'Cash' : 'Tunai';
    return item.name;
  };

  return (
    <section className="modern-expense-section">
      {/* Section Header with Action */}
      <div className="modern-section-header">
        <div className="section-heading-wrap">
          <h3 className="modern-section-title">
            {filterDateMode === 'all'
              ? (language === 'en' ? 'All Expense Records' : 'Semua Riwayat Transaksi')
              : (language === 'en' ? 'Today\'s Transactions' : 'Daftar Transaksi Hari Ini')}
          </h3>
          <span className="section-heading-meta">
            {filteredExpenses.length} {t('common.transactions').toLowerCase()} • Total: <strong className="font-mono">{formatCurrency(totalFilteredAmount, currency)}</strong>
          </span>
        </div>

        <button
          type="button"
          className="btn-add-primary"
          onClick={onOpenAddModal}
        >
          <Plus size={16} />
          <span>{t('expenses.newExpenseBtn')}</span>
        </button>
      </div>

      {/* Modern Filter & Search Toolbar */}
      <div className="modern-toolbar">
        {/* Search Input */}
        <div className="modern-search-input-wrap">
          <Search size={15} className="modern-search-icon" />
          <input
            type="text"
            className="modern-search-input"
            placeholder={t('expenses.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="modern-clear-search"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="modern-filter-group">
          {/* Date Scope Toggle */}
          <div className="modern-select-pill">
            <select
              value={filterDateMode}
              onChange={(e) => setFilterDateMode(e.target.value)}
              aria-label="Filter date scope"
            >
              <option value="selected">{t('date.selectedDate')}</option>
              <option value="all">{t('date.allDates')}</option>
            </select>
          </div>

          {/* Category Selector */}
          <div className="modern-select-pill">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter category"
            >
              <option value="all">{t('expenses.filterAll')}</option>
              {(categories || CATEGORIES).map(cat => (
                <option key={cat.id} value={cat.id}>
                  {localizeCategoryName(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="modern-select-pill">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort transactions"
            >
              <option value="time-desc">{language === 'en' ? 'Newest' : 'Terbaru'}</option>
              <option value="time-asc">{language === 'en' ? 'Oldest' : 'Terlama'}</option>
              <option value="amount-desc">{language === 'en' ? 'Highest Amount' : 'Nominal Tertinggi'}</option>
              <option value="amount-asc">{language === 'en' ? 'Lowest Amount' : 'Nominal Terendah'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List Feed */}
      {filteredExpenses.length === 0 ? (
        <div className="modern-empty-state">
          <p className="empty-state-title">
            {!currentUser
              ? (language === 'en' ? 'Guest Mode Active' : 'Akun Belum Dibuat')
              : (language === 'en' ? t('expenses.noExpensesTitle') : 'Belum ada transaksi')}
          </p>
          <p className="empty-state-desc">
            {!currentUser
              ? (language === 'en'
                  ? 'Sign in or create a free account to keep your expenses organized with private isolated storage.'
                  : 'Anda belum memiliki akun. Buat akun gratis terlebih dahulu untuk mulai mencatat dan mengelola pengeluaran harian Anda.')
              : searchTerm || selectedCategory !== 'all'
                ? t('expenses.noSearchDesc')
                : t('expenses.noExpensesDesc')}
          </p>
          <button
            type="button"
            className="btn-add-primary"
            onClick={onOpenAddModal}
          >
            <Plus size={15} />
            <span>{!currentUser ? t('header.signInAccount') : t('expenses.newExpenseBtn')}</span>
          </button>
        </div>
      ) : (
        <div className="modern-transaction-list">
          {filteredExpenses.map((expense) => {
            const cat = getCategoryById(expense.categoryId, categories);
            const localizedCatName = localizeCategoryName(cat);

            return (
              <div key={expense.id} className="modern-transaction-item">
                {/* Clean Category Dot Indicator */}
                <div className="tx-indicator-cell">
                  <span
                    className="tx-category-indicator"
                    style={{ backgroundColor: cat.color || '#2563eb' }}
                    title={localizedCatName}
                  />
                </div>

                {/* Info Center */}
                <div className="tx-details">
                  <div className="tx-title-row">
                    <span className="tx-title">{expense.title}</span>
                    <span className="tx-cat-badge">
                      {localizedCatName}
                    </span>
                  </div>

                  <div className="tx-sub-row">
                    <span className="tx-time">
                      {expense.date !== selectedDate ? `${expense.date} • ` : ''}
                      {getExpenseDisplayTime(expense)}
                    </span>
                    <span className="tx-bullet">•</span>
                    <span className="tx-method">{getMethodName(expense.paymentMethod)}</span>
                    {expense.notes && (
                      <>
                        <span className="tx-bullet">•</span>
                        <span className="tx-notes">{expense.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="tx-amount-col">
                  <span className="tx-amount-value font-mono">
                    -{formatCurrency(expense.amount, currency)}
                  </span>
                </div>

                {/* Actions (Edit & Delete) */}
                <div className="tx-actions-col">
                  <button
                    type="button"
                    className="tx-action-btn"
                    onClick={() => onEditExpense(expense)}
                    title={t('common.edit')}
                    aria-label="Edit expense"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="tx-action-btn btn-delete"
                    onClick={() => onDeleteExpense(expense.id)}
                    title={t('common.delete')}
                    aria-label="Delete expense"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
