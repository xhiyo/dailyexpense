import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Tag,
  Check,
  AlertTriangle,
  Search,
  Sparkles,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import {
  CategoryIcon,
  AVAILABLE_VECTOR_ICONS,
  AVAILABLE_EMOJI_ICONS,
  isEmojiString
} from './CategoryIcon';
import { getCategoryStyles, hexToRgba, DEFAULT_CATEGORIES } from '../data/categories';
import { useTranslation } from '../i18n/LanguageContext';

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

export const CategoryManagerModal = ({
  isOpen,
  onClose,
  categories = [],
  onSaveCategories,
  onResetCategories,
  expenses = []
}) => {
  const { t, language, localizeCategoryName } = useTranslation();
  // View mode: 'list' | 'form'
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const modalContentRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const resetScroll = () => {
        if (modalContentRef.current) {
          modalContentRef.current.scrollTop = 0;
        }
      };
      resetScroll();
      const rAF = requestAnimationFrame(resetScroll);
      const t1 = setTimeout(resetScroll, 60);
      const t2 = setTimeout(resetScroll, 240);
      return () => {
        cancelAnimationFrame(rAF);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isOpen, view]);

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍔');
  const [color, setColor] = useState('#2563eb');
  const [error, setError] = useState('');

  // Icon Selector State
  const [iconTab, setIconTab] = useState('emoji'); // 'emoji' | 'vector'
  const [iconSearch, setIconSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Semua');

  // Category List Search
  const [categorySearch, setCategorySearch] = useState('');

  // Confirmation dialog states
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Hitung berapa kali kategori digunakan di expenses
  const getUsageCount = (catId) => {
    return expenses.filter(e => e.categoryId === catId).length;
  };

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
  };

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
  };

  const handleBackToList = () => {
    setView('list');
    setEditingId(null);
    setError('');
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Nama kategori tidak boleh kosong');
      return;
    }

    // Cek duplikasi nama (case-insensitive) selain yang sedang di-edit
    const duplicate = categories.some(
      c => c.name.toLowerCase() === cleanName.toLowerCase() && c.id !== editingId
    );
    if (duplicate) {
      setError('Nama kategori sudah digunakan. Gunakan nama lain.');
      return;
    }

    const styles = getCategoryStyles(color);

    if (editingId) {
      // Update kategori lama
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
      onSaveCategories(updated);
    } else {
      // Tambah kategori baru
      const newCat = {
        id: `cat_${Date.now()}`,
        name: cleanName,
        icon,
        color,
        bgLight: styles.bgLight,
        border: styles.border,
        isCustom: true
      };
      onSaveCategories([...categories, newCat]);
    }

    setView('list');
    setEditingId(null);
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const catId = categoryToDelete.id;

    // Filter keluar kategori yang dihapus
    const updated = categories.filter(c => c.id !== catId);
    onSaveCategories(updated, catId);
    setCategoryToDelete(null);

    // Jika sedang dalam form edit kategori tersebut, kembali ke list
    if (editingId === catId) {
      setView('list');
      setEditingId(null);
    }
  };

  const confirmReset = () => {
    onResetCategories();
    setShowResetConfirm(false);
    setView('list');
    setEditingId(null);
  };

  // Filtered Icons by Group & Search
  const matchesGroup = (itemGroup, targetGroup) => {
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

  // Filtered Categories List for List View
  const filteredCategoryList = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase();
    return categories.filter(cat => cat.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-category-manager"
        ref={modalContentRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            VIEW 1: DAFTAR KATEGORI (LIST VIEW)
           ======================================================== */}
        {view === 'list' && (
          <>
            {/* Header */}
            <div className="cat-modal-header">
              <div className="cat-modal-header-left">
                <div className="cat-modal-header-icon-box">
                  <Tag size={20} />
                </div>
                <div>
                  <h2 className="cat-modal-title">{t('categories.pageTitle')}</h2>
                  <p className="cat-modal-subtitle">
                    {categories.length} {language === 'en' ? 'categories active' : 'kategori pengeluaran terpasang'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Toolbar: Search + Tambah Kategori */}
            <div className="cat-list-toolbar">
              <div className="cat-search-field-wrap">
                <Search size={15} className="cat-search-dim-icon" />
                <input
                  type="text"
                  className="cat-search-input"
                  placeholder="Cari kategori..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
                {categorySearch && (
                  <button
                    type="button"
                    className="cat-search-clear-btn"
                    onClick={() => setCategorySearch('')}
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                type="button"
                className="btn-primary cat-btn-add"
                onClick={handleOpenAddForm}
              >
                <Plus size={16} />
                <span>{t('categories.addBtn')}</span>
              </button>
            </div>

            {/* Confirmation Banner: Reset */}
            {showResetConfirm && (
              <div className="cat-confirm-banner warning">
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
              <div className="cat-confirm-banner danger">
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

            {/* Proportional Category Rows */}
            <div className="cat-list-container">
              {filteredCategoryList.map((cat) => {
                const usage = getUsageCount(cat.id);
                return (
                  <div key={cat.id} className="cat-row-card">
                    {/* Left: Clean Icon without box */}
                    <div className="cat-row-icon-wrap">
                      <CategoryIcon name={cat.icon} size={24} color={cat.color} />
                    </div>

                    {/* Middle: Details */}
                    <div className="cat-row-details">
                      <div className="cat-row-name-line">
                        <span className="cat-row-name">{localizeCategoryName(cat)}</span>
                        {cat.isDefault && (
                          <span className="cat-badge-default">{t('categories.defaultBadge')}</span>
                        )}
                      </div>
                      <div className="cat-row-meta-line">
                        <span className={`cat-row-usage ${usage > 0 ? 'active' : 'empty'}`}>
                          {usage > 0 ? (language === 'en' ? `${usage} transactions` : `${usage} transaksi`) : (language === 'en' ? '0 transactions' : '0 transaksi')}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="cat-row-actions">
                      <button
                        type="button"
                        className="cat-action-btn edit"
                        onClick={() => handleOpenEditForm(cat)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                        <span>{t('common.edit')}</span>
                      </button>
                      <button
                        type="button"
                        className="cat-action-btn delete"
                        onClick={() => setCategoryToDelete(cat)}
                        disabled={categories.length <= 1}
                        title={categories.length <= 1 ? 'Minimal harus ada 1 kategori' : 'Hapus kategori'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredCategoryList.length === 0 && (
                <div className="cat-empty-search-box">
                  <Tag size={32} className="cat-empty-icon" />
                  <p>Tidak ada kategori dengan nama "{categorySearch}"</p>
                </div>
              )}
            </div>

            {/* List Footer */}
            <div className="cat-modal-footer">
              <button
                type="button"
                className="cat-btn-ghost-reset"
                onClick={() => setShowResetConfirm(true)}
              >
                <RotateCcw size={13} />
                <span>Reset ke 10 Default</span>
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Tutup
              </button>
            </div>
          </>
        )}

        {/* ========================================================
            VIEW 2: FORM TAMBAH / EDIT KATEGORI (EDITOR VIEW)
           ======================================================== */}
        {view === 'form' && (
          <form className="cat-editor-form" onSubmit={handleSubmitForm}>
            {/* Header with Back Button */}
            <div className="cat-modal-header">
              <div className="cat-modal-header-left">
                <button
                  type="button"
                  className="cat-back-btn"
                  onClick={handleBackToList}
                  title="Kembali ke daftar kategori"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="cat-header-separator" />
                <div>
                  <h2 className="cat-modal-title">
                    {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                  </h2>
                  <p className="cat-modal-subtitle">
                    {editingId
                      ? 'Perubahan akan otomatis terupdate di seluruh riwayat'
                      : 'Kategori baru siap dipakai saat mencatat pengeluaran'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Editor Body */}
            <div className="cat-editor-body">
              {/* Hero: Selected Icon Badge + Name Input */}
              <div className="cat-hero-field-wrapper">
                <div className="cat-label-row">
                  <label className="field-label required">Nama Kategori</label>
                  <span className="cat-char-counter">{name.length}/30</span>
                </div>
                <div className="cat-input-hero-group">
                  <div className="cat-selected-icon-badge" title="Ikon Terpilih">
                    <CategoryIcon name={icon} size={24} color={color} />
                  </div>
                  <input
                    type="text"
                    className={`form-input cat-name-input ${error ? 'input-error' : ''}`}
                    placeholder="Contoh: Kopi & Kafe, Laundry, Belanja Bulanan..."
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    maxLength={30}
                    autoFocus={!isMobile}
                  />
                </div>
                {error && <span className="cat-field-error">{error}</span>}
              </div>

              {/* Icon Picker Section */}
              <div className="cat-picker-section">
                {/* Header: Label + Segmented Tabs */}
                <div className="cat-picker-header">
                  <label className="field-label" style={{ marginBottom: 0 }}>Pilih Ikon</label>
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
                      Vektor ({AVAILABLE_VECTOR_ICONS.length})
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="cat-icon-search-box">
                  <Search size={15} className="cat-search-dim-icon" />
                  <input
                    type="text"
                    className="cat-icon-search-input"
                    placeholder={iconTab === 'emoji' ? 'Cari emoji (kopi, makan, belanja, bensin...)' : 'Cari simbol vektor (car, heart, coffee...)'}
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

                {/* Group Filter Chips */}
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

                {/* Icon Grid Surface */}
                <div className="cat-icons-surface">
                  {iconTab === 'emoji' ? (
                    <div className="cat-icons-grid">
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
                    <div className="cat-icons-grid">
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
                              size={20}
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

            {/* Editor Footer */}
            <div className="cat-modal-footer">
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
    </div>
  );
};

export default CategoryManagerModal;
