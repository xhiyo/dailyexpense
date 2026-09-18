import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Users,
  Target,
  Coins,
  RotateCcw,
  Check
} from 'lucide-react';
import { CURRENCIES, getBudgetPresets } from '../data/categories';
import { formatCurrency, formatNumberWithDots, parseCleanNumber } from '../utils/storage';

const AVATAR_PRESETS = ['🧑‍💼', '👩‍💼', '👨‍💻', '👩‍🎨', '🏃‍♂️', '🧑‍🍳', '👩‍🎤', '🦁', '🌟', '🚀'];
const COLOR_PRESETS = [
  '#2563eb', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#64748b'  // Slate
];

export const PeopleManagerModal = ({
  isOpen,
  onClose,
  people = [],
  onAddPerson,
  onRemovePerson,
  expenses = [],
  dailyBudget = 0,
  onUpdateDailyBudget,
  currency = 'Rp',
  onUpdateCurrency,
  onResetData
}) => {
  const [activeSection, setActiveSection] = useState('budget'); // 'budget' | 'people' | 'settings'

  // Form Anggota Baru
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('🧑‍💼');
  const [newColor, setNewColor] = useState('#2563eb');
  const [nameError, setNameError] = useState('');

  // Form Anggaran
  const [budgetInput, setBudgetInput] = useState(dailyBudget > 0 ? formatNumberWithDots(dailyBudget) : '0');

  useEffect(() => {
    if (isOpen) {
      setBudgetInput(dailyBudget > 0 ? formatNumberWithDots(dailyBudget) : '0');
    }
  }, [isOpen, dailyBudget]);

  if (!isOpen) return null;

  const handleAddPerson = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setNameError('Mohon masukkan nama anggota');
      return;
    }

    const newPerson = {
      id: `p-${Date.now()}`,
      name: newName.trim(),
      avatar: newAvatar,
      color: newColor
    };

    onAddPerson(newPerson);
    setNewName('');
    setNameError('');
  };

  const handleBudgetChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setBudgetInput('');
      return;
    }
    const cleanDigits = raw.replace(/[^\d]/g, '');
    if (!cleanDigits) {
      setBudgetInput('0');
      return;
    }
    const num = parseInt(cleanDigits, 10);
    setBudgetInput(num.toLocaleString('id-ID'));
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const val = parseCleanNumber(budgetInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateDailyBudget(val);
      onClose();
    }
  };

  const getPersonStats = (personId) => {
    const personExpenses = expenses.filter(e => e.personId === personId);
    const totalSpent = personExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      count: personExpenses.length,
      totalSpent
    };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-people-manager" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-text">
            <h2 className="modal-title">Budget & People Management</h2>
            <p className="modal-subtitle">Configure daily budget targets, currency, and household / team members</p>
          </div>
          <button
            id="close-settings-modal-btn"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="manager-tabs-bar">
          <button
            className={`manager-tab-btn ${activeSection === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveSection('budget')}
          >
            <Target size={15} />
            <span>Daily Budget</span>
          </button>
          <button
            className={`manager-tab-btn ${activeSection === 'people' ? 'active' : ''}`}
            onClick={() => setActiveSection('people')}
          >
            <Users size={15} />
            <span>Members ({people.length})</span>
          </button>
          <button
            className={`manager-tab-btn ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection('settings')}
          >
            <Coins size={15} />
            <span>Preferences & Data</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="manager-modal-body">
          {/* 1. DAILY BUDGET TARGET */}
          {activeSection === 'budget' && (
            <div className="budget-section-content">
              <div className="budget-info-banner">
                <Target size={20} className="text-accent" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Daily Spending Target</strong>
                  <p>
                    The target budget you wish to cap per day in Indonesian Rupiah. The app alerts you whenever daily spend surpasses this limit.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveBudget} className="budget-edit-form">
                <div className="form-group">
                  <label className="field-label" htmlFor="daily-budget-input">
                    Daily Budget Limit ({currency})
                  </label>
                  <div className="amount-input-container">
                    <span className="amount-currency-symbol font-mono">{currency}</span>
                    <input
                      id="daily-budget-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="0 (Tanpa batas limit)"
                      className="amount-input font-mono"
                      value={budgetInput}
                      onChange={handleBudgetChange}
                    />
                  </div>
                  <div style={{ marginTop: 6, fontSize: '0.84rem' }}>
                    {parseCleanNumber(budgetInput) > 0 ? (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>
                        ✓ Target: {formatCurrency(parseCleanNumber(budgetInput), currency)} / hari
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>
                        *Target <strong>Rp 0</strong> = Mode tanpa batas limit pengeluaran harian
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="quick-budget-presets">
                  <span className="presets-title">Quick Presets ({currency}):</span>
                  {getBudgetPresets(currency).map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className="preset-pill-btn font-mono"
                      onClick={() => setBudgetInput(preset.value === 0 ? '0' : (currency === 'Rp' ? preset.value.toLocaleString('id-ID') : String(preset.value)))}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="modal-footer" style={{ marginTop: 20 }}>
                  <button type="button" className="btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Daily Budget
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. MANAGE MEMBERS */}
          {activeSection === 'people' && (
            <div className="people-section-content">
              <div className="people-cards-list">
                {people.map((person) => {
                  const stats = getPersonStats(person.id);
                  return (
                    <div key={person.id} className="person-manager-card">
                      <div className="person-card-left">
                        <div
                          className="person-avatar-badge"
                          style={{ borderColor: person.color }}
                        >
                          {person.avatar}
                        </div>
                        <div className="person-manager-info">
                          <h4 className="person-manager-name">{person.name}</h4>
                          <span className="person-manager-sub">
                            {stats.count} {stats.count === 1 ? 'transaction' : 'transactions'} recorded
                          </span>
                        </div>
                      </div>

                      <div className="person-card-right">
                        <div className="person-manager-spend font-mono">
                          {formatCurrency(stats.totalSpent, currency)}
                        </div>
                        {people.length > 1 && (
                          <button
                            className="action-btn-mini delete-btn"
                            onClick={() => onRemovePerson(person.id)}
                            title={`Remove ${person.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Person */}
              <div className="add-person-box">
                <h4 className="add-person-title">Add New Member</h4>
                <form onSubmit={handleAddPerson} className="add-person-form">
                  <div className="form-group">
                    <label className="field-label" htmlFor="new-person-name">Member Name</label>
                    <input
                      id="new-person-name"
                      type="text"
                      placeholder="e.g. Personal, Family, Office"
                      className={`form-input ${nameError ? 'input-error' : ''}`}
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                        if (nameError) setNameError('');
                      }}
                    />
                    {nameError && <span className="field-error-msg">{nameError}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="form-group">
                    <label className="field-label">Select Avatar</label>
                    <div className="avatar-picker-grid">
                      {AVATAR_PRESETS.map((avatar) => (
                        <button
                          type="button"
                          key={avatar}
                          className={`avatar-btn ${newAvatar === avatar ? 'selected' : ''}`}
                          onClick={() => setNewAvatar(avatar)}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div className="form-group">
                    <label className="field-label">Select Color Accent</label>
                    <div className="color-picker-grid">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          type="button"
                          key={color}
                          className={`color-swatch-btn ${newColor === color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewColor(color)}
                        >
                          {newColor === color && <Check size={14} color="#ffffff" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="add-person-submit-btn"
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Plus size={16} />
                    <span>Add Member</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 3. PREFERENCES & BACKUP */}
          {activeSection === 'settings' && (
            <div className="settings-section-content">
              <div className="form-group">
                <label className="field-label">Primary Currency</label>
                <select
                  className="form-input"
                  value={currency}
                  onChange={(e) => onUpdateCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.symbol}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Data Danger Zone */}
              <div className="settings-danger-card">
                <div className="danger-card-info">
                  <RotateCcw size={20} className="text-danger" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <h5 className="danger-title">Clear All Data</h5>
                    <p className="danger-desc">
                      Wipe all recorded expenses and reset application data to a clean state.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-danger-outline"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all expenses and reset data? This cannot be undone.')) {
                      onResetData();
                      onClose();
                    }
                  }}
                >
                  Clear All Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
