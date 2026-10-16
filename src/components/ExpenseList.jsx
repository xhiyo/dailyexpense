import React, { useState, useMemo, useEffect } from 'react';
import { Search, Edit2, Trash2, Plus } from 'lucide-react';
import { getCategoryById, CATEGORIES, PAYMENT_METHODS, hexToRgba } from '../data/categories';
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
    if (item.time && item.time.trim() !== '') return item.time;
    const ts = getCreatedTimestamp(item);
    if (ts && ts > 1000000000000) {
      const d = new Date(ts);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return '--:--';
  };

  // Safe parsing of YYYY-MM-DD avoiding any timezone shifts
  const parseYMD = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.trim().split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m, d);
  };

  const formatYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = useMemo(() => formatYMD(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatYMD(d);
  }, []);

  // Format date header details in Gojek style
  const getDateInfo = (dateStr) => {
    const d = parseYMD(dateStr);
    const isToday = dateStr === todayStr;
    const isYesterday = dateStr === yesterdayStr;
    const locale = language === 'en' ? 'en-US' : 'id-ID';

    let title = '';
    let subtitle = '';

    if (isToday) {
      title = language === 'en' ? 'Today' : 'Hari ini';
      subtitle = d
        ? d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
        : dateStr;
    } else if (isYesterday) {
      title = language === 'en' ? 'Yesterday' : 'Kemarin';
      subtitle = d
        ? d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
        : dateStr;
    } else if (d && !isNaN(d.getTime())) {
      title = d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
      subtitle = d.toLocaleDateString(locale, { weekday: 'long' });
    } else {
      title = dateStr || (language === 'en' ? 'Other' : 'Lainnya');
      subtitle = '';
    }

    return { title, subtitle, isToday, isYesterday, dateStr };
  };

  const getPaymentMethodDisplay = (methodId) => {
    const item = PAYMENT_METHODS.find(m => m.id === methodId);
    if (!item) return language === 'en' ? 'Cash' : 'Tunai';
    if (language === 'en') {
      if (item.id === 'wallet') return 'GoPay / E-Wallet';
      if (item.id === 'transfer') return 'Bank Transfer';
      if (item.id === 'cash') return 'Cash';
      if (item.id === 'card') return 'Debit / Credit Card';
      return item.name;
    }
    if (item.id === 'wallet') return 'GoPay / E-Wallet';
    if (item.id === 'transfer') return 'Transfer Bank';
    if (item.id === 'cash') return 'Tunai';
    if (item.id === 'card') return 'Kartu Debit/Kredit';
    return item.name;
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
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  // Group filtered expenses by date for Gojek-style date grouping
  const groupedExpenses = useMemo(() => {
    if (!filteredExpenses.length) return [];

    const dateMap = new Map();
    for (const exp of filteredExpenses) {
      const d = exp.date || 'unknown';
      if (!dateMap.has(d)) {
        dateMap.set(d, []);
      }
      dateMap.get(d).push(exp);
    }

    const dateKeys = Array.from(dateMap.keys());

    dateKeys.sort((a, b) => {
      if (sortBy === 'time-asc') {
        return a.localeCompare(b);
      }
      return b.localeCompare(a);
    });

    return dateKeys.map(dateKey => {
      const items = dateMap.get(dateKey) || [];
      const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return {
        dateKey,
        dateInfo: getDateInfo(dateKey),
        items,
        totalAmount
      };
    });
  }, [filteredExpenses, sortBy, language, todayStr, yesterdayStr]);

  const isSelectedToday = selectedDate === todayStr;

  return (
    <section className="modern-expense-section" id="expense-list-section">
      {/* Section Header with Action */}
      <div className="modern-section-header">
        <div className="section-heading-wrap">
          <h3 className="modern-section-title">
            {filterDateMode === 'all'
              ? (language === 'en' ? 'Transaction History' : 'Riwayat Transaksi')
              : isSelectedToday
                ? (language === 'en' ? "Today's Transactions" : 'Transaksi Hari Ini')
                : (language === 'en' ? 'Transactions on Selected Date' : 'Transaksi Tanggal Terpilih')}
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

      {/* Transaction List Feed (Gojek-style Grouped by Date) */}
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
        <div className="gojek-transactions-feed" id="transactions-feed">
          {groupedExpenses.map((group) => (
            <div key={group.dateKey} className="gojek-date-group">
              {/* Pembatas Tanggal / Clean Date Boundary Header */}
              <div className="gojek-date-header">
                <div className="gojek-date-header-left">
                  <span className="gojek-date-title">{group.dateInfo.title}</span>
                  {group.dateInfo.subtitle && (
                    <>
                      <span className="gojek-date-dot">•</span>
                      <span className="gojek-date-subtext">
                        {group.dateInfo.subtitle}
                      </span>
                    </>
                  )}
                </div>

                <div className="gojek-date-header-right">
                  <span className="gojek-date-count">
                    {group.items.length}{' '}
                    {language === 'en'
                      ? group.items.length === 1
                        ? 'transaction'
                        : 'transactions'
                      : 'transaksi'}
                  </span>
                  <span className="gojek-date-sep">•</span>
                  <span className="gojek-date-total font-mono">
                    Total: {formatCurrency(group.totalAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Transactions list card for this date */}
              <div className="gojek-date-card">
                {group.items.map((expense) => {
                  const cat = getCategoryById(expense.categoryId, categories);
                  const localizedCatName = localizeCategoryName(cat);
                  const paymentDisplay = getPaymentMethodDisplay(expense.paymentMethod);
                  const displayTime = getExpenseDisplayTime(expense);

                  return (
                    <div
                      key={expense.id}
                      className="gojek-transaction-row"
                      onClick={() => onEditExpense && onEditExpense(expense)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onEditExpense && onEditExpense(expense);
                        }
                      }}
                      title={language === 'en' ? 'Click to edit expense' : 'Klik untuk edit transaksi'}
                    >
                      {/* Main Transaction Details */}
                      <div className="gojek-tx-content">
                        <div className="gojek-tx-main-line">
                          <span
                            className="tx-category-indicator"
                            style={{ backgroundColor: cat.color || 'var(--accent-primary, #2563eb)' }}
                            title={localizedCatName}
                          />
                          <span className="gojek-tx-title" title={expense.title}>
                            {expense.title}
                          </span>
                          <span
                            className="gojek-tx-cat-chip"
                            style={{
                              color: cat.color || 'var(--text-secondary)',
                              borderColor: hexToRgba(cat.color || '#2563eb', 0.25)
                            }}
                          >
                            {localizedCatName}
                          </span>
                        </div>

                        <div className="gojek-tx-meta-line">
                          <span className="gojek-meta-time">{displayTime}</span>
                          <span className="gojek-meta-sep">•</span>
                          <span className="gojek-meta-method">{paymentDisplay}</span>
                          {expense.notes && (
                            <>
                              <span className="gojek-meta-sep">•</span>
                              <span className="gojek-meta-notes" title={expense.notes}>
                                {expense.notes}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Amount & Quick Actions */}
                      <div className="gojek-tx-right-block">
                        <span className="gojek-tx-amount font-mono">
                          -{formatCurrency(expense.amount, currency)}
                        </span>
                        <div
                          className="gojek-tx-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="gojek-action-btn btn-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditExpense && onEditExpense(expense);
                            }}
                            title={t('common.edit')}
                            aria-label="Edit expense"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="gojek-action-btn btn-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteExpense && onDeleteExpense(expense.id);
                            }}
                            title={t('common.delete')}
                            aria-label="Delete expense"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
