import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  Clock, 
  Layers, 
  AlertCircle
} from 'lucide-react';
import { formatCurrency, exportToExcel } from '../utils/storage';
import { useTranslation } from '../i18n/LanguageContext';

export const ExportModal = ({
  isOpen,
  onClose,
  expenses = [],
  categories = null,
  currency = 'Rp',
  onExportSuccess
}) => {
  const { t, language } = useTranslation();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  // Format YYYY-MM-DD
  const formatDateISO = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Format date human readable (e.g. 17 Sep 2026)
  const formatHumanDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const [y, m, d] = isoStr.split('-');
      const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      return dateObj.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  const todayStr = formatDateISO(now);

  // States
  const [rangeType, setRangeType] = useState('30days'); // '7days' | '30days' | 'month' | 'custom' | 'all'
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [customStartDate, setCustomStartDate] = useState(() => {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return formatDateISO(firstDay);
  });
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  // Month names for dropdown
  const monthList = useMemo(() => {
    if (language === 'en') {
      return [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
      ];
    }
    return [
      { value: 1, label: 'Januari' },
      { value: 2, label: 'Februari' },
      { value: 3, label: 'Maret' },
      { value: 4, label: 'April' },
      { value: 5, label: 'Mei' },
      { value: 6, label: 'Juni' },
      { value: 7, label: 'Juli' },
      { value: 8, label: 'Agustus' },
      { value: 9, label: 'September' },
      { value: 10, label: 'Oktober' },
      { value: 11, label: 'November' },
      { value: 12, label: 'Desember' }
    ];
  }, [language]);

  // Available years from expenses
  const yearList = useMemo(() => {
    const yearsSet = new Set([currentYear, currentYear - 1]);
    expenses.forEach(e => {
      if (e.date) {
        const y = parseInt(e.date.slice(0, 4), 10);
        if (!isNaN(y) && y > 2000 && y < 2100) {
          yearsSet.add(y);
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [expenses, currentYear]);

  // Compute active date boundaries
  const activeDateRange = useMemo(() => {
    if (rangeType === 'all') {
      return { 
        start: null, 
        end: null, 
        label: language === 'en' ? 'All Recorded Transactions' : 'Seluruh Riwayat Transaksi' 
      };
    }

    if (rangeType === '7days') {
      const dStart = new Date(now);
      dStart.setDate(dStart.getDate() - 6);
      const start = formatDateISO(dStart);
      const end = todayStr;
      return { 
        start, 
        end, 
        label: `${formatHumanDate(start)} — ${formatHumanDate(end)}` 
      };
    }

    if (rangeType === '30days') {
      const dStart = new Date(now);
      dStart.setDate(dStart.getDate() - 29);
      const start = formatDateISO(dStart);
      const end = todayStr;
      return { 
        start, 
        end, 
        label: `${formatHumanDate(start)} — ${formatHumanDate(end)}` 
      };
    }

    if (rangeType === 'month') {
      const m = String(selectedMonth).padStart(2, '0');
      const start = `${selectedYear}-${m}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const end = `${selectedYear}-${m}-${String(lastDay).padStart(2, '0')}`;
      const mObj = monthList.find(x => x.value === selectedMonth);
      return { 
        start, 
        end, 
        label: `${mObj ? mObj.label : m} ${selectedYear}` 
      };
    }

    if (rangeType === 'custom') {
      let start = customStartDate || todayStr;
      let end = customEndDate || todayStr;
      if (start > end) {
        const tmp = start;
        start = end;
        end = tmp;
      }
      return { 
        start, 
        end, 
        label: `${formatHumanDate(start)} — ${formatHumanDate(end)}` 
      };
    }

    return { start: null, end: null, label: '' };
  }, [rangeType, selectedMonth, selectedYear, customStartDate, customEndDate, todayStr, monthList, language]);

  // Filtered transactions
  const filteredExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    const { start, end } = activeDateRange;

    return expenses
      .filter(e => {
        if (!e.date) return false;
        if (start && e.date < start) return false;
        if (end && e.date > end) return false;
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [expenses, activeDateRange]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  if (!isOpen) return null;

  const handleDownload = () => {
    let filename = `laporan_pengeluaran_${todayStr}.xlsx`;

    if (rangeType === '7days') {
      filename = `laporan_pengeluaran_7hari_${todayStr}.xlsx`;
    } else if (rangeType === '30days') {
      filename = `laporan_pengeluaran_30hari_${todayStr}.xlsx`;
    } else if (rangeType === 'month') {
      const mObj = monthList.find(x => x.value === selectedMonth);
      const mLabel = mObj ? mObj.label.toLowerCase() : selectedMonth;
      filename = `laporan_pengeluaran_${mLabel}_${selectedYear}.xlsx`;
    } else if (rangeType === 'custom') {
      filename = `laporan_pengeluaran_${customStartDate || 'awal'}_sd_${customEndDate || 'akhir'}.xlsx`;
    } else if (rangeType === 'all') {
      filename = `laporan_pengeluaran_semua_${todayStr}.xlsx`;
    }

    exportToExcel(filteredExpenses, categories, currency, filename, activeDateRange.label);
    if (onExportSuccess) {
      onExportSuccess(filteredExpenses.length);
    }
    onClose();
  };

  const tabs = [
    { id: '7days', label: language === 'en' ? '7 Days' : '7 Hari' },
    { id: '30days', label: language === 'en' ? '30 Days' : '30 Hari' },
    { id: 'month', label: language === 'en' ? 'Monthly' : 'Bulanan' },
    { id: 'custom', label: language === 'en' ? 'Custom' : 'Kustom' },
    { id: 'all', label: language === 'en' ? 'All' : 'Semua' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content export-fixed-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="export-fixed-header">
          <div className="export-fixed-title-row">
            <div className="export-fixed-badge">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="export-fixed-title">{t('exportModal.title')}</h2>
              <p className="export-fixed-desc">{t('exportModal.subtitle')}</p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="export-fixed-body">
          {/* Segmented Control Tabs */}
          <div className="export-segmented-container">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`export-segmented-tab ${rangeType === tab.id ? 'active' : ''}`}
                onClick={() => setRangeType(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub-Slot with Locked Constant Height (Absolutely Zero Height Shift) */}
          <div className="export-fixed-slot">
            {rangeType === 'month' ? (
              <div className="export-slot-month-row">
                <div className="export-slot-field">
                  <label className="export-slot-label">{t('exportModal.selectMonth')}</label>
                  <select
                    className="export-clean-input"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  >
                    {monthList.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="export-slot-field">
                  <label className="export-slot-label">{t('exportModal.selectYear')}</label>
                  <select
                    className="export-clean-input"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {yearList.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : rangeType === 'custom' ? (
              <div className="export-slot-custom-row">
                <div className="export-slot-field">
                  <label className="export-slot-label">{t('exportModal.startDate')}</label>
                  <input
                    type="date"
                    className="export-clean-input"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="export-slot-field">
                  <label className="export-slot-label">{t('exportModal.endDate')}</label>
                  <input
                    type="date"
                    className="export-clean-input"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="export-slot-info-box">
                {rangeType === '7days' && <Clock size={16} className="export-slot-icon" />}
                {rangeType === '30days' && <Calendar size={16} className="export-slot-icon" />}
                {rangeType === 'all' && <Layers size={16} className="export-slot-icon" />}
                <span className="export-slot-info-text">{activeDateRange.label}</span>
              </div>
            )}
          </div>

          {/* Clean Summary Card with Locked Constant Height */}
          <div className="export-summary-card">
            <div className="export-summary-header">
              <span className="export-summary-subtitle">{t('exportModal.periodLabel')}</span>
              <span className="export-summary-badge" title={activeDateRange.label}>
                {activeDateRange.label}
              </span>
            </div>

            <div className="export-summary-body-fixed">
              {filteredExpenses.length === 0 ? (
                <div className="export-warning-alert">
                  <AlertCircle size={15} />
                  <span>{t('exportModal.noTransactions')}</span>
                </div>
              ) : (
                <div className="export-summary-metrics">
                  <div className="export-metric-item">
                    <span className="export-metric-label">{t('exportModal.totalCount')}</span>
                    <span className="export-metric-val">
                      {filteredExpenses.length} <small>{language === 'en' ? 'tx' : 'transaksi'}</small>
                    </span>
                  </div>
                  <div className="export-metric-divider" />
                  <div className="export-metric-item">
                    <span className="export-metric-label">{t('exportModal.totalAmount')}</span>
                    <span className="export-metric-val amount-val">
                      {formatCurrency(totalAmount, currency)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="export-fixed-footer">
          <button
            type="button"
            className="btn btn-secondary export-btn-cancel"
            onClick={onClose}
          >
            {t('exportModal.cancelBtn')}
          </button>
          <button
            type="button"
            className="btn btn-primary export-btn-download"
            onClick={handleDownload}
            disabled={filteredExpenses.length === 0}
          >
            <Download size={16} />
            <span>{t('exportModal.downloadBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
