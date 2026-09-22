import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Search,
  Check,
  AlertTriangle,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import {
  CategoryIcon,
  AVAILABLE_VECTOR_ICONS,
  AVAILABLE_EMOJI_ICONS,
  isEmojiString
} from './CategoryIcon';
import { getCategoryStyles } from '../data/categories';
import { useTranslation } from '../i18n/LanguageContext';
import { scrollAppToTop } from '../utils/storage';

const COLOR_PRESETS = [
  '#f97316', // Orange
  '#10b981', // Emerald
  '#2563eb', // Royal Blue
  '#eab308', // Amber / Yellow
  '#ec4899', // Pink
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#64748b'  // Slate
];

const ICON_GROUPS = [
  'Semua',
  'Kuliner',
  'Transport',
  'Belanja',
  'Tagihan',
  'Kesehatan',
  'Hiburan',
  'Finansial',
  'Lainnya'
];

export const CategoriesPage = ({
  categories = [],
  currentUser,
  onSaveCategories,
  onResetCategories,
  expenses = [],
  onBackToDashboard
}) => {
  const { t, language, localizeCategoryName } = useTranslation();
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // View mode: 'list' | 'form'
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍔');
  const [color, setColor] = useState('#2563eb');
  const [error, setError] = useState('');

  // Icon Selector State
  const [iconTab, setIconTab] = useState('emoji'); // 'emoji' | 'vector'
  const [iconSearch, setIconSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Semua');

  // Filter & Search in List View
  const [categorySearch, setCategorySearch] = useState('');

  // Confirmation dialogs
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Pre-calculate usage map for optimal performance
  const usageMap = useMemo(() => {
    const map = {};
    (expenses || []).forEach(e => {
      if (e.categoryId) {
        map[e.categoryId] = (map[e.categoryId] || 0) + 1;
      }
    });
    return map;
  }, [expenses]);

  const getUsageCount = (catId) => usageMap[catId] || 0;

  // Stats for the KPI strip
  const stats = useMemo(() => {
    const total = categories.length;
    const totalTransactions = expenses.filter(e => e.categoryId).length;
    return { total, totalTransactions };
  }, [categories, expenses]);

  // Open add form
  const handleOpenAddForm = () => {
    setEditingId(null);
    setName('');
    setIcon('🍔');
    setColor(COLOR_PRESETS[categories.length % COLOR_PRESETS.length]);
    setIconTab('emoji');
    setIconSearch('');
    setSelectedGroup('Semua');
    setError('');
    setView('form');
    scrollAppToTop(false);
    requestAnimationFrame(() => scrollAppToTop(false));
    setTimeout(() => scrollAppToTop(false), 50);
  };

  // Open edit form
  const handleOpenEditForm = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    const catIcon = cat.icon || '🏷️';
    setIcon(catIcon);
    setColor(cat.color || '#2563eb');
    setIconTab(isEmojiString(catIcon) ? 'emoji' : 'vector');
    setIconSearch('');
    setSelectedGroup('Semua');
    setError('');
    setView('form');
    scrollAppToTop(false);
    requestAnimationFrame(() => scrollAppToTop(false));
    setTimeout(() => scrollAppToTop(false), 50);
  };

  const handleBackToList = () => {
    setView('list');
    setEditingId(null);
    setError('');
    scrollAppToTop(false);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Nama kategori tidak boleh kosong');
      return;
    }

    // Check duplicate name
    const duplicate = categories.some(
      c => c.name.toLowerCase() === cleanName.toLowerCase() && c.id !== editingId
    );
    if (duplicate) {
      setError('Nama kategori sudah digunakan. Gunakan nama lain.');
      return;
    }

    const styles = getCategoryStyles(color);

    if (editingId) {
      // Update existing
      const updated = categories.map(cat => {
        if (cat.id === editingId) {
          return {
            ...cat,
            name: cleanName,
            icon,
            color,
            bgLight: styles.bgLight,
            border: styles.border
          };
        }
        return cat;
      });
      onSaveCategories(updated, null);
    } else {
      // Add new
      const newCat = {
        id: `cat-${Date.now()}`,
        name: cleanName,
        icon,
        color,
        bgLight: styles.bgLight,
        border: styles.border,
        isDefault: false
      };
      onSaveCategories([...categories, newCat], null);
    }

    setView('list');
    setEditingId(null);
    setError('');
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    if (categories.length <= 1) {
      alert('Minimal harus ada 1 kategori aktif dalam aplikasi.');
      setCategoryToDelete(null);
      return;
    }

    const updated = categories.filter(c => c.id !== categoryToDelete.id);
    onSaveCategories(updated, categoryToDelete.id);
    setCategoryToDelete(null);
  };

  const confirmReset = () => {
    onResetCategories();
    setShowResetConfirm(false);
  };

  // Filter icon search & groups
  const matchesGroup = (itemGroup, targetGroup) => {
    if (!itemGroup) return false;
    if (targetGroup === 'Semua') return true;
    if (targetGroup === 'Lainnya') {
      return ['Umum', 'Lifestyle', 'Keluarga', 'Sosial', 'Peliharaan', 'Edukasi', 'Pendidikan'].includes(itemGroup);
    }
    return itemGroup.toLowerCase().includes(targetGroup.toLowerCase());
  };

  const filteredEmojis = useMemo(() => {
    return AVAILABLE_EMOJI_ICONS.filter(item => {
      const matchGrp = matchesGroup(item.group, selectedGroup);
      if (!matchGrp) return false;
      if (!iconSearch.trim()) return true;
      const q = iconSearch.toLowerCase();
      return item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q) || item.emoji.includes(q);
    });
  }, [iconSearch, selectedGroup]);

  const filteredVectors = useMemo(() => {
    return AVAILABLE_VECTOR_ICONS.filter(item => {
      const matchGrp = matchesGroup(item.group, selectedGroup);
      if (!matchGrp) return false;
      if (!iconSearch.trim()) return true;
      const q = iconSearch.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q);
    });
  }, [iconSearch, selectedGroup]);

  // Filtered categories for list view
  const filteredCategoryList = useMemo(() => {
    let result = categories;
    if (categorySearch.trim()) {
      const q = categorySearch.toLowerCase();
      result = result.filter(cat => cat.name.toLowerCase().includes(q));
    }
    return result;
  }, [categories, categorySearch]);

  const previewStyles = getCategoryStyles(color);

  // If user is not logged in, nothing to render (auth overlay handles it)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="tab-categories-view">
      {/* ========================================================
          VIEW 1: DAFTAR KATEGORI (PAGE LIST VIEW)
         ======================================================== */}
      {view === 'list' && (
        <>
          {/* Header Banner */}
          <div className="page-header-banner">
            <div className="page-header-left">
              <h2 className="page-heading">{t('categories.pageTitle')}</h2>
              <p className="page-subheading">
                {t('categories.pageSubtitle')}
              </p>
            </div>

            <div className="page-header-actions">
              <button
                type="button"
                className="btn-secondary cat-header-back-btn"
                onClick={onBackToDashboard}
                title={t('common.back')}
                aria-label={t('common.back')}
              >
                <ArrowLeft size={16} />
                <span>{t('common.back')}</span>
              </button>
              <button
                type="button"
                className="btn-secondary cat-header-reset-btn"
                onClick={() => setShowResetConfirm(true)}
                title={t('categories.resetConfirmTitle')}
              >
                <RotateCcw size={14} />
                <span>{isMobile ? (language === 'en' ? 'Reset' : 'Reset') : t('categories.resetBtn')}</span>
              </button>
              <button
                type="button"
                className="btn-primary cat-header-add-btn"
                onClick={handleOpenAddForm}
              >
                <Plus size={16} />
                <span>{isMobile ? (language === 'en' ? 'Tambah' : 'Tambah') : t('categories.addBtn')}</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Meta Row */}
          <div className="cat-page-metrics-row">
            <div className="cat-metric-tile">
              <span className="cat-metric-label">{t('categories.totalTitle')}</span>
              <strong className="cat-metric-val font-mono">{stats.total} {language === 'en' ? 'Categories' : 'Kategori'}</strong>
            </div>

            <div className="cat-metric-tile">
              <span className="cat-metric-label">{t('categories.txTitle')}</span>
              <strong className="cat-metric-val font-mono">
                {stats.totalTransactions} {t('common.records')}
              </strong>
            </div>
          </div>

          {/* Confirmation Banner: Reset */}
          {showResetConfirm && (
            <div className="cat-page-confirm-banner warning">
              <div className="cat-confirm-icon-wrap warning">
                <AlertTriangle size={18} />
              </div>
              <div className="cat-confirm-text">
                <strong>{t('categories.resetConfirmTitle')}</strong>
                <p>{t('categories.resetConfirmDesc')}</p>
              </div>
              <div className="cat-confirm-actions">
                <button type="button" className="btn-danger-small" onClick={confirmReset}>
                  {t('common.yes')}, {t('categories.resetBtn')}
                </button>
                <button type="button" className="btn-secondary-small" onClick={() => setShowResetConfirm(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Banner: Delete */}
          {categoryToDelete && (
            <div className="cat-page-confirm-banner danger">
              <div className="cat-confirm-icon-wrap danger">
                <AlertTriangle size={18} />
              </div>
              <div className="cat-confirm-text">
                <strong>Hapus Kategori "{categoryToDelete.name}"?</strong>
                <p>
                  {getUsageCount(categoryToDelete.id) > 0
                    ? `${getUsageCount(categoryToDelete.id)} transaksi terkait akan otomatis dipindahkan ke kategori "Lain-lain".`
                    : 'Kategori ini belum memiliki catatan transaksi dan aman untuk dihapus.'}
                </p>
              </div>
              <div className="cat-confirm-actions">
                <button type="button" className="btn-danger-small" onClick={confirmDeleteCategory}>
                  Ya, Hapus
                </button>
                <button type="button" className="btn-secondary-small" onClick={() => setCategoryToDelete(null)}>
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="cat-page-toolbar">
            <div className="cat-search-field-wrap">
              <Search size={15} className="cat-search-dim-icon" />
              <input
                type="text"
                className="cat-search-input"
                placeholder="Cari nama kategori..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
              {categorySearch && (
                <button
                  type="button"
                  className="cat-search-clear-btn"
                  onClick={() => setCategorySearch('')}
                  aria-label="Bersihkan pencarian"
                >
                  ×
                </button>
              )}
            </div>

            <span className="cat-toolbar-counter">
              {filteredCategoryList.length} {language === 'en' ? 'Categories' : 'Kategori'}
            </span>
          </div>

          {/* Categories Responsive Grid */}
          <div className="cat-cards-grid">
            {filteredCategoryList.map((cat) => {
              const usage = getUsageCount(cat.id);
              return (
                <div key={cat.id} className="cat-grid-card">
                  <div className="cat-grid-card-main">
                    {/* Clean Icon without box or background */}
                    <div className="cat-grid-card-icon">
                      <CategoryIcon name={cat.icon} size={28} color={cat.color} />
                    </div>

                    {/* Information */}
                    <div className="cat-grid-card-info">
                      <h4 className="cat-grid-card-name" title={localizeCategoryName(cat)}>
                        {localizeCategoryName(cat)}
                      </h4>
                      <div className="cat-grid-card-meta-row">
                        <span className={cat.isDefault ? 'cat-badge-default' : 'cat-badge-custom'}>
                          {cat.isDefault ? t('categories.defaultBadge') : t('categories.customBadge')}
                        </span>
                        <span className="cat-grid-card-meta-bullet">•</span>
                        <span className={`cat-grid-card-usage ${usage > 0 ? 'active' : 'empty'}`}>
                          {usage > 0 ? t('categories.activeUsage', { count: usage }) : t('categories.emptyUsage')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="cat-grid-card-footer">
                    <button
                      type="button"
                      className="cat-action-btn edit"
                      onClick={() => handleOpenEditForm(cat)}
                    >
                      <Pencil size={13} />
                      <span>{t('common.edit')}</span>
                    </button>

                    <button
                      type="button"
                      className="cat-action-btn delete"
                      onClick={() => setCategoryToDelete(cat)}
                      disabled={categories.length <= 1}
                      title={categories.length <= 1 ? (language === 'en' ? 'Minimum 1 category required' : 'Minimal harus ada 1 kategori') : t('common.delete')}
                    >
                      <Trash2 size={13} />
                      <span>{t('common.delete')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCategoryList.length === 0 && (
            <div className="cat-page-empty-box">
              <Tag size={36} className="cat-empty-icon" />
              <h4>Tidak ada kategori ditemukan</h4>
              <p>
                {categorySearch
                  ? `Tidak ada kategori yang cocok dengan pencarian "${categorySearch}".`
                  : 'Tidak ada kategori pada filter ini.'}
              </p>
              {categorySearch && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => setCategorySearch('')}
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================
          VIEW 2: FORM TAMBAH / EDIT KATEGORI (FULL PAGE EDITOR)
         ======================================================== */}
      {view === 'form' && (
        <form className="cat-page-editor" onSubmit={handleSubmitForm}>
          {/* Header Banner with Back Button */}
          <div className="page-header-banner">
            <div className="page-header-left">
              <h2 className="page-heading">
                {editingId ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
              </h2>
              <p className="page-subheading">
                {editingId
                  ? 'Perubahan nama dan ikon akan diperbarui pada seluruh transaksi terkait'
                  : 'Kategori baru siap langsung digunakan untuk mencatat pengeluaran'}
              </p>
            </div>

            <div className="page-header-actions">
              <button
                type="button"
                className="btn-secondary cat-header-back-btn"
                onClick={handleBackToList}
                title={language === 'en' ? 'Back to List' : 'Kembali ke Daftar'}
              >
                <ArrowLeft size={16} />
                <span>{language === 'en' ? 'Back' : 'Kembali'}</span>
              </button>
              <button type="submit" className="btn-primary cat-header-add-btn">
                <Check size={16} />
                <span>{isMobile ? (editingId ? (language === 'en' ? 'Save' : 'Simpan') : (language === 'en' ? 'Tambah' : 'Tambah')) : (editingId ? 'Simpan Perubahan' : 'Tambah Kategori')}</span>
              </button>
            </div>
          </div>

          {/* 2-Column Responsive Editor Grid */}
          <div className="cat-editor-grid">
            {/* Column 1: Metadata & Color */}
            <div className="cat-editor-card">
              <div className="cat-card-header">
                <div className="profile-card-header-icon">
                  <Tag size={18} />
                </div>
                <div className="cat-card-header-info">
                  <h4 className="profile-card-title">Informasi Dasar Kategori</h4>
                  <p className="profile-card-desc">Tentukan nama dan warna pengenal kategori</p>
                </div>
              </div>

              {/* Category Name Input */}
              <div className="form-group">
                <div className="cat-label-row">
                  <label className="form-label" htmlFor="cat-name-input">
                    Nama Kategori <span className="text-danger">*</span>
                  </label>
                  <span className="cat-char-counter">{name.length}/30</span>
                </div>
                <div className="cat-input-hero-group">
                  <div
                    className="cat-selected-icon-badge"
                    style={{
                      backgroundColor: previewStyles.bgLight,
                      borderColor: previewStyles.border
                    }}
                    title="Ikon Terpilih"
                  >
                    <CategoryIcon name={icon} size={24} color={color} />
                  </div>
                  <input
                    id="cat-name-input"
                    type="text"
                    className={`form-input cat-name-input ${error ? 'input-error' : ''}`}
                    placeholder="Contoh: Kopi & Kafe, Belanja Bulanan, Investasi..."
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    maxLength={30}
                    autoFocus={!isMobile}
                    required
                  />
                </div>
                {error && <span className="cat-field-error">{error}</span>}
              </div>

              {/* Color Palette Selector */}
              <div className="form-group">
                <label className="form-label">Warna Aksen Kategori</label>
                <div className="cat-color-palette-grid">
                  {COLOR_PRESETS.map((hex) => {
                    const isSelected = color === hex;
                    return (
                      <button
                        key={hex}
                        type="button"
                        className={`cat-color-swatch-btn ${isSelected ? 'selected' : ''}`}
                        style={{ backgroundColor: hex }}
                        onClick={() => setColor(hex)}
                        title={`Pilih warna ${hex}`}
                      >
                        {isSelected && <Check size={14} className="cat-color-check-icon" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="cat-preview-card-box">
                <span className="cat-preview-card-label">Pratinjau Tampilan di Aplikasi</span>
                <div className="cat-preview-items-row">
                  {/* Badge chip preview */}
                  <span
                    className="cat-mini-chip"
                    style={{
                      backgroundColor: previewStyles.bgLight,
                      color: previewStyles.color,
                      borderColor: previewStyles.border,
                      padding: '5px 12px',
                      fontSize: '0.82rem'
                    }}
                  >
                    <CategoryIcon name={icon} size={15} color={color} style={{ marginRight: 6 }} />
                    {name || 'Nama Kategori'}
                  </span>

                  {/* Circle badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: color
                      }}
                    />
                    <span>{name || 'Nama Kategori'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Icon Picker */}
            <div className="cat-editor-card">
              <div className="cat-card-header">
                <div className="profile-card-header-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                  <Sparkles size={18} />
                </div>
                <div className="cat-card-header-info">
                  <h4 className="profile-card-title">Pilih Ikon Kategori</h4>
                  <p className="profile-card-desc">Gunakan emoji atau simbol vektor yang sesuai</p>
                </div>
              </div>

              {/* Segmented Tab: Emoji vs Vector */}
              <div className="cat-picker-header">
                <div className="cat-segmented-tabs">
                  <button
                    type="button"
                    className={`cat-segment-btn ${iconTab === 'emoji' ? 'active' : ''}`}
                    onClick={() => setIconTab('emoji')}
                  >
                    Emoji ({AVAILABLE_EMOJI_ICONS.length})
                  </button>
                  <button
                    type="button"
                    className={`cat-segment-btn ${iconTab === 'vector' ? 'active' : ''}`}
                    onClick={() => setIconTab('vector')}
                  >
                    Simbol Vektor ({AVAILABLE_VECTOR_ICONS.length})
                  </button>
                </div>
              </div>

              {/* Icon Search Field */}
              <div className="cat-icon-search-box">
                <Search size={15} className="cat-search-dim-icon" />
                <input
                  type="text"
                  className="cat-icon-search-input"
                  placeholder={
                    iconTab === 'emoji'
                      ? 'Cari emoji (kopi, makan, belanja, bensin, obat...)'
                      : 'Cari simbol vektor (car, heart, coffee, home...)'
                  }
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                />
                {iconSearch && (
                  <button
                    type="button"
                    className="cat-search-clear-btn"
                    onClick={() => setIconSearch('')}
                    aria-label="Bersihkan pencarian"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Groups Strip */}
              <div className="cat-groups-strip">
                {ICON_GROUPS.map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    className={`cat-group-chip ${selectedGroup === grp ? 'active' : ''}`}
                    onClick={() => setSelectedGroup(grp)}
                  >
                    {grp}
                  </button>
                ))}
              </div>

              {/* Icon Grid */}
              <div className="cat-icons-surface page-surface">
                {iconTab === 'emoji' ? (
                  <div className="cat-icons-grid page-grid">
                    {filteredEmojis.map((item) => {
                      const isSelected = icon === item.emoji;
                      return (
                        <button
                          key={item.emoji}
                          type="button"
                          className={`cat-icon-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => setIcon(item.emoji)}
                          title={item.label}
                        >
                          <span className="cat-emoji-char">{item.emoji}</span>
                        </button>
                      );
                    })}
                    {filteredEmojis.length === 0 && (
                      <div className="cat-empty-icons-msg">
                        Tidak ada emoji yang cocok dengan "{iconSearch}".
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="cat-icons-grid page-grid">
                    {filteredVectors.map((item) => {
                      const isSelected = icon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          className={`cat-icon-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => setIcon(item.name)}
                          title={item.label}
                        >
                          <CategoryIcon
                            name={item.name}
                            size={22}
                            color={isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'}
                          />
                        </button>
                      );
                    })}
                    {filteredVectors.length === 0 && (
                      <div className="cat-empty-icons-msg">
                        Tidak ada ikon vektor yang cocok dengan "{iconSearch}".
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="cat-editor-bottom-bar">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBackToList}
            >
              Batal
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>{editingId ? 'Simpan Perubahan' : 'Tambah Kategori'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CategoriesPage;
