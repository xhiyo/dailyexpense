import { DEFAULT_DAILY_BUDGET } from '../data/initialData';
import { DEFAULT_PEOPLE, DEFAULT_CATEGORIES, CATEGORIES, PAYMENT_METHODS } from '../data/categories';
import { getAuthCookie, setAuthCookie, removeAuthCookie } from './cookie';
import XLSX from 'xlsx-js-style';

// Legacy keys for one-time auto-migration
const LEGACY_EXPENSES_KEY = 'spendwise_expenses_v4';
const LEGACY_PEOPLE_KEY = 'spendwise_people_v4';
const LEGACY_BUDGET_KEY = 'spendwise_daily_budget_v4';
const LEGACY_CURRENCY_KEY = 'spendwise_currency_v4';
const LEGACY_CATEGORIES_KEY = 'spendwise_categories_v5';

// Base keys for per-user isolation
const EXPENSES_BASE_KEY = 'spendwise_expenses_v5';
const PEOPLE_BASE_KEY = 'spendwise_people_v5';
const BUDGET_BASE_KEY = 'spendwise_daily_budget_v5';
const CURRENCY_BASE_KEY = 'spendwise_currency_v5';
const CATEGORIES_BASE_KEY = 'spendwise_categories_v6';

// Global keys
const THEME_KEY = 'spendwise_theme_v4';
const AUTH_KEY = 'spendwise_auth_user_v4';

/**
 * Generate a safe, isolated localStorage key based on user ID.
 * If userId is not provided or 'guest', scopes data to guest.
 */
export const getUserStorageKey = (baseKey, userId) => {
  if (!userId || String(userId).trim() === '' || userId === 'guest') {
    return `${baseKey}_guest`;
  }
  const safeId = String(userId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${baseKey}_u_${safeId}`;
};

export const loadCurrentUser = () => {
  try {
    localStorage.removeItem('spendwise_auth_user_v3');

    // 1. Try loading from Auth Cookie first
    const cookieUser = getAuthCookie();
    if (cookieUser && cookieUser.email && !cookieUser.email.includes('alex.johnson') && cookieUser.id !== 'user-01') {
      // Synchronize with localStorage & linked accounts
      try {
        localStorage.setItem(AUTH_KEY, JSON.stringify(cookieUser));
      } catch (_) {}
      addLinkedAccount(cookieUser);
      return cookieUser;
    }

    // 2. Fallback to localStorage
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email && !parsed.email.includes('alex.johnson') && parsed.id !== 'user-01') {
        // Synchronize back to cookie & linked accounts
        setAuthCookie(parsed, true);
        addLinkedAccount(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load user from cookie/localStorage:', err);
  }
  saveCurrentUser(null);
  return null;
};

const LINKED_ACCOUNTS_KEY = 'spendwise_linked_accounts_v1';

export const MAX_LINKED_ACCOUNTS = 3;

export const loadLinkedAccounts = () => {
  try {
    const raw = localStorage.getItem(LINKED_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(u => u && u.id && u.email).slice(0, MAX_LINKED_ACCOUNTS);
      }
    }
  } catch (err) {
    console.error('Failed to load linked accounts:', err);
  }
  return [];
};

export const saveLinkedAccounts = (accounts) => {
  try {
    const cleanList = Array.isArray(accounts)
      ? accounts.filter(u => u && u.id && u.email).slice(0, MAX_LINKED_ACCOUNTS)
      : [];
    localStorage.setItem(LINKED_ACCOUNTS_KEY, JSON.stringify(cleanList));
    return cleanList;
  } catch (err) {
    console.error('Failed to save linked accounts:', err);
    return [];
  }
};

export const addLinkedAccount = (user) => {
  if (!user || !user.id || !user.email) return loadLinkedAccounts();
  try {
    const existing = loadLinkedAccounts();
    const cleanEmail = (user.email || '').toLowerCase().trim();
    const index = existing.findIndex(
      u => u.id === user.id || (u.email && u.email.toLowerCase().trim() === cleanEmail)
    );
    let updated;
    const cleanUser = {
      id: user.id,
      name: user.name || cleanEmail.split('@')[0],
      email: user.email,
      avatar: user.avatar || '',
      role: user.role || 'Personal Account',
      provider: user.provider || 'local',
      idToken: user.idToken || null,
      refreshToken: user.refreshToken || null,
      lastActive: Date.now()
    };
    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...updated[index], ...cleanUser };
    } else {
      if (existing.length >= MAX_LINKED_ACCOUNTS) {
        // Maximum 3 accounts limit enforced
        return existing;
      }
      updated = [...existing, cleanUser];
    }
    saveLinkedAccounts(updated);
    return updated;
  } catch (err) {
    console.error('Failed to add linked account:', err);
    return loadLinkedAccounts();
  }
};

export const removeLinkedAccount = (userId) => {
  try {
    const existing = loadLinkedAccounts();
    const updated = existing.filter(u => u.id !== userId);
    saveLinkedAccounts(updated);
    return updated;
  } catch (err) {
    console.error('Failed to remove linked account:', err);
    return loadLinkedAccounts();
  }
};

export const saveCurrentUser = (user, rememberMe = true) => {
  try {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      setAuthCookie(user, rememberMe);
      addLinkedAccount(user);
    } else {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem('spendwise_auth_user_v3');
      removeAuthCookie();
    }
  } catch (err) {
    console.error('Failed to save user:', err);
  }
};

/**
 * Load expenses for specific user.
 * Performs seamless one-time migration from legacy key if user has no data yet.
 */
export const loadExpenses = (userId = null) => {
  const key = getUserStorageKey(EXPENSES_BASE_KEY, userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // Auto-migration: If this is the active user (or guest) and user key is not set,
    // check if legacy global key exists to preserve previously recorded data.
    const legacyRaw = localStorage.getItem(LEGACY_EXPENSES_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
        saveExpenses(legacyParsed, userId);
        localStorage.removeItem(LEGACY_EXPENSES_KEY);
        return legacyParsed;
      }
    }
  } catch (err) {
    console.error(`Failed to load expenses for user ${userId}:`, err);
  }

  saveExpenses([], userId);
  return [];
};

export const saveExpenses = (expenses, userId = null) => {
  const key = getUserStorageKey(EXPENSES_BASE_KEY, userId);
  try {
    localStorage.setItem(key, JSON.stringify(expenses));
  } catch (err) {
    console.error(`Failed to save expenses for user ${userId}:`, err);
  }
};

export const loadPeople = (userId = null) => {
  const key = getUserStorageKey(PEOPLE_BASE_KEY, userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load people:', err);
  }
  savePeople(DEFAULT_PEOPLE, userId);
  return DEFAULT_PEOPLE;
};

export const savePeople = (people, userId = null) => {
  const key = getUserStorageKey(PEOPLE_BASE_KEY, userId);
  try {
    localStorage.setItem(key, JSON.stringify(people));
  } catch (err) {
    console.error('Failed to save people:', err);
  }
};

export const loadCategories = (userId = null) => {
  const key = getUserStorageKey(CATEGORIES_BASE_KEY, userId);
  try {
    // Clean up any legacy shared category key to prevent leakage across accounts
    localStorage.removeItem(LEGACY_CATEGORIES_KEY);

    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Failed to load categories for user ${userId}:`, err);
  }

  // Each account has its own isolated category list, defaulting to the 10 standard categories
  const freshDefaults = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  saveCategories(freshDefaults, userId);
  return freshDefaults;
};

export const saveCategories = (categories, userId = null) => {
  const key = getUserStorageKey(CATEGORIES_BASE_KEY, userId);
  try {
    localStorage.setItem(key, JSON.stringify(categories));
  } catch (err) {
    console.error(`Failed to save categories for user ${userId}:`, err);
  }
};

export const loadDailyBudget = (userId = null) => {
  const isGuest = !userId || String(userId).trim() === '' || userId === 'guest';
  const key = getUserStorageKey(BUDGET_BASE_KEY, userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const val = parseFloat(raw);
      if (!isNaN(val) && val >= 0) {
        // Auto-migrate legacy 150000 or previous uncustomized 0 to DEFAULT_DAILY_BUDGET (100k)
        const isExplicit = localStorage.getItem(`${key}_explicit`) === 'true';
        if (!isExplicit && (val === 150000 || val === 0)) {
          saveDailyBudget(DEFAULT_DAILY_BUDGET, userId);
          return DEFAULT_DAILY_BUDGET;
        }
        return val;
      }
    }

    // Auto-migration only for registered authenticated accounts, never for guest!
    if (!isGuest) {
      const legacyRaw = localStorage.getItem(LEGACY_BUDGET_KEY);
      if (legacyRaw !== null) {
        const val = parseFloat(legacyRaw);
        localStorage.removeItem(LEGACY_BUDGET_KEY);
        if (!isNaN(val) && val >= 0 && val !== 150000 && val !== 0) {
          saveDailyBudget(val, userId, true);
          return val;
        }
      }
    } else {
      localStorage.removeItem(LEGACY_BUDGET_KEY);
    }
  } catch (err) {
    console.error(`Failed to load budget for user ${userId}:`, err);
  }

  saveDailyBudget(DEFAULT_DAILY_BUDGET, userId);
  return DEFAULT_DAILY_BUDGET;
};

export const saveDailyBudget = (budget, userId = null, isExplicit = false) => {
  const key = getUserStorageKey(BUDGET_BASE_KEY, userId);
  try {
    localStorage.setItem(key, budget.toString());
    if (isExplicit) {
      localStorage.setItem(`${key}_explicit`, 'true');
    }
  } catch (err) {
    console.error(`Failed to save budget for user ${userId}:`, err);
  }
};

export const loadCurrency = (userId = null) => {
  const key = getUserStorageKey(CURRENCY_BASE_KEY, userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw && raw !== '$') return raw;

    const legacyRaw = localStorage.getItem(LEGACY_CURRENCY_KEY);
    if (legacyRaw && legacyRaw !== '$') {
      localStorage.removeItem(LEGACY_CURRENCY_KEY);
      saveCurrency(legacyRaw, userId);
      return legacyRaw;
    }
  } catch (err) {
    console.error(`Failed to load currency for user ${userId}:`, err);
  }

  saveCurrency('Rp', userId);
  return 'Rp';
};

export const saveCurrency = (symbol, userId = null) => {
  const key = getUserStorageKey(CURRENCY_BASE_KEY, userId);
  try {
    localStorage.setItem(key, symbol);
  } catch (err) {
    console.error(`Failed to save currency for user ${userId}:`, err);
  }
};

export const loadTheme = () => {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch (err) {
    console.error('Failed to load theme:', err);
  }
  return 'light'; // clean white default
};

export const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
};

const LANGUAGE_KEY = 'spendwise_language_v1';

export const loadLanguage = () => {
  try {
    const raw = localStorage.getItem(LANGUAGE_KEY);
    if (raw === 'en' || raw === 'id') return raw;
  } catch (err) {
    console.error('Failed to load language:', err);
  }
  return 'en'; // Default language is English
};

export const saveLanguage = (lang) => {
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
  } catch (err) {
    console.error('Failed to save language:', err);
  }
};

export const ACCENT_COLORS = [
  { id: 'blue', name: 'Royal Blue (Standar)', hex: '#2563eb', hover: '#1d4ed8' },
  { id: 'violet', name: 'Royal Violet', hex: '#7c3aed', hover: '#6d28d9' },
  { id: 'emerald', name: 'Emerald Green', hex: '#059669', hover: '#047857' },
  { id: 'amber', name: 'Sunset Amber', hex: '#d97706', hover: '#b45309' },
  { id: 'rose', name: 'Crimson Rose', hex: '#e11d48', hover: '#be123c' },
  { id: 'cyan', name: 'Ocean Cyan', hex: '#0284c7', hover: '#0369a1' }
];

const ACCENT_COLOR_KEY = 'spendwise_accent_color_v1';

export const loadAccentColor = () => {
  try {
    const raw = localStorage.getItem(ACCENT_COLOR_KEY);
    if (raw && /^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  } catch (err) {
    console.error('Failed to load accent color:', err);
  }
  return '#2563eb';
};

export const saveAccentColor = (color) => {
  try {
    localStorage.setItem(ACCENT_COLOR_KEY, color);
  } catch (err) {
    console.error('Failed to save accent color:', err);
  }
};

// Format tampilan mata uang dengan presisi yang sesuai (Rupiah bulat, valas dengan desimal wajar)
export const formatCurrency = (amount, symbol = 'Rp') => {
  const num = Number(amount) || 0;
  const sym = (symbol || 'Rp').trim();

  if (sym === 'Rp' || sym === 'IDR') {
    const formatted = Math.round(num).toLocaleString('id-ID');
    return `${sym} ${formatted}`;
  }

  // Untuk USD, EUR, SGD: jika bilangan bulat, tampilkan tanpa desimal; jika ada sen/desimal, tampilkan 2 desimal
  const isWhole = Number.isInteger(num) || Math.round(num * 100) % 100 === 0;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2
  });
  return `${sym} ${formatted}`;
};

// Format angka dengan pemisah ribuan titik Indonesia (contoh: 50000 -> "50.000") atau standar valas
export const formatNumberWithDots = (val, symbol = 'Rp') => {
  if (val === '' || val === null || val === undefined) return '';
  const sym = (symbol || 'Rp').trim();
  if (sym === 'Rp' || sym === 'IDR') {
    const digits = String(val).replace(/[^\d]/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('id-ID');
  }
  const num = Number(val);
  if (isNaN(num)) return String(val);
  const isWhole = Number.isInteger(num) || Math.round(num * 100) % 100 === 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2
  });
};

// Parse input nominal (baik "50.000", "50k", atau desimal valas "12.50")
export const parseCleanNumber = (val, isRupiah = true) => {
  if (val === 0) return 0;
  if (!val) return 0;
  const str = String(val).trim().toLowerCase();
  if (str.endsWith('k') || str.endsWith('rb')) {
    const num = parseFloat(str.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    return Math.round(num * 1000);
  }
  if (isRupiah) {
    const digits = str.replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }
  // Valas (USD, EUR, SGD): izinkan angka dengan titik/koma desimal
  const normalized = str.replace(',', '.').replace(/[^\d.]/g, '');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
};

// Ekspor ke format Microsoft Excel murni (.xlsx) lengkap dengan tabel berdesain profesional, filter, dan warna
export const exportToExcel = (expenses, categories = null, currency = 'Rp', customFilename = null, periodLabel = '') => {
  const activeCategories = categories || DEFAULT_CATEGORIES;
  const categoryMap = Object.fromEntries(activeCategories.map(c => [c.id, c.name]));
  const sym = (currency || 'Rp').trim();

  // 1. Buat Workbook Excel Baru
  const wb = XLSX.utils.book_new();

  // 2. Siapkan Data Header & Rekap
  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const now = new Date();
  const printDate = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const titleRow = ['SPENDWISE - LAPORAN PENGELUARAN KEUANGAN', '', '', '', '', '', '', ''];
  const subtitleRow = [
    `Periode: ${periodLabel || 'Semua Data'}   |   Dicetak: ${printDate}   |   Jumlah Transaksi: ${expenses.length}   |   Total: ${sym} ${Math.round(totalAmount).toLocaleString('id-ID')}`,
    '', '', '', '', '', '', ''
  ];
  const emptyRow = ['', '', '', '', '', '', '', ''];
  const headers = ['No', 'Tanggal', 'Waktu', 'Nama Pengeluaran', 'Kategori', 'Metode Pembayaran', `Nominal (${sym})`, 'Catatan'];

  const paymentMethodMap = {
    wallet: 'E-Wallet / QRIS',
    qris: 'E-Wallet / QRIS',
    ewallet: 'E-Wallet / QRIS',
    transfer: 'Bank Transfer',
    bank: 'Bank Transfer',
    cash: 'Cash / Tunai',
    tunai: 'Cash / Tunai',
    card: 'Debit / Credit Card',
    debit: 'Debit / Credit Card',
    credit: 'Debit / Credit Card'
  };
  (PAYMENT_METHODS || []).forEach(pm => {
    paymentMethodMap[pm.id] = pm.name;
  });

  const getPaymentMethodLabel = (methodId) => {
    if (!methodId) return 'Cash / Tunai';
    const key = String(methodId).toLowerCase().trim();
    return paymentMethodMap[key] || methodId;
  };

  const dataRows = expenses.map((e, idx) => [
    idx + 1,
    e.date || '',
    e.time || '',
    e.title || '',
    categoryMap[e.categoryId] || e.categoryId || '-',
    getPaymentMethodLabel(e.paymentMethod),
    Number(e.amount) || 0,
    e.notes || ''
  ]);

  const totalRow = [
    'TOTAL PENGELUARAN', '', '', '', '', '',
    totalAmount,
    ''
  ];

  const sheetData = [
    titleRow,
    subtitleRow,
    emptyRow,
    headers,
    ...dataRows,
    totalRow
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // 3. Penggabungan Sel (Merges)
  ws['!merges'] = [
    // Banner judul utama A1:H1
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    // Subtitle ringkasan A2:H2
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    // Label Total Pengeluaran A(N):F(N)
    { s: { r: sheetData.length - 1, c: 0 }, e: { r: sheetData.length - 1, c: 5 } }
  ];

  // 4. Lebar Kolom yang Nyaman & Pas (Auto-width optimal)
  ws['!cols'] = [
    { wch: 6 },   // No
    { wch: 14 },  // Tanggal
    { wch: 10 },  // Waktu
    { wch: 32 },  // Nama Pengeluaran
    { wch: 22 },  // Kategori
    { wch: 20 },  // Metode Pembayaran
    { wch: 20 },  // Nominal
    { wch: 30 }   // Catatan
  ];

  // 5. Filter Dropdown Interaktif Excel (Auto-Filter pada baris 4)
  const lastDataRowIdx = 3 + expenses.length;
  if (expenses.length > 0) {
    ws['!autofilter'] = {
      ref: `A4:H${lastDataRowIdx + 1}`
    };
  }

  // 6. Freeze Panes (Header tetap terkunci saat di-scroll)
  ws['!freeze'] = {
    xSplit: 0,
    ySplit: 4
  };

  // 7. Styling Elegan Khas Microsoft Excel (Emerald Green Theme)
  const titleStyle = {
    font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F5132' } }, // Emerald tua
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const subtitleStyle = {
    font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '0F5132' } },
    fill: { fgColor: { rgb: 'D1E7DD' } }, // Mint lembut
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const headerStyle = {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '107C41' } }, // Excel Emerald Green
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'medium', color: { rgb: '0F5132' } },
      bottom: { style: 'medium', color: { rgb: '0F5132' } },
      left: { style: 'thin', color: { rgb: '198754' } },
      right: { style: 'thin', color: { rgb: '198754' } }
    }
  };

  const dataEvenStyle = {
    font: { name: 'Calibri', sz: 10, color: { rgb: '1F2937' } },
    fill: { fgColor: { rgb: 'FFFFFF' } },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } }
    }
  };

  const dataOddStyle = {
    font: { name: 'Calibri', sz: 10, color: { rgb: '1F2937' } },
    fill: { fgColor: { rgb: 'F9FAFB' } }, // Zebra striping lembut
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } }
    }
  };

  const totalLabelStyle = {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0F5132' } },
    fill: { fgColor: { rgb: 'D1E7DD' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '0F5132' } },
      bottom: { style: 'double', color: { rgb: '0F5132' } },
      left: { style: 'thin', color: { rgb: '0F5132' } },
      right: { style: 'thin', color: { rgb: '0F5132' } }
    }
  };

  const totalAmountStyle = {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0F5132' } },
    fill: { fgColor: { rgb: 'D1E7DD' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    numFmt: '#,##0',
    border: {
      top: { style: 'thin', color: { rgb: '0F5132' } },
      bottom: { style: 'double', color: { rgb: '0F5132' } },
      left: { style: 'thin', color: { rgb: '0F5132' } },
      right: { style: 'thin', color: { rgb: '0F5132' } }
    }
  };

  // 8. Terapkan Style ke Seluruh Grid Tabel
  for (let R = 0; R < sheetData.length; ++R) {
    for (let C = 0; C < 8; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) {
        ws[cellRef] = { t: 's', v: '' };
      }

      if (R === 0) {
        ws[cellRef].s = titleStyle;
      } else if (R === 1) {
        ws[cellRef].s = subtitleStyle;
      } else if (R === 2) {
        // Baris kosong pemisah
      } else if (R === 3) {
        ws[cellRef].s = headerStyle;
      } else if (R < sheetData.length - 1) {
        const isOdd = (R - 4) % 2 === 1;
        const baseStyle = isOdd ? { ...dataOddStyle } : { ...dataEvenStyle };

        if (C === 0 || C === 1 || C === 2) {
          // No, Tanggal, Waktu -> Rata Tengah
          ws[cellRef].s = {
            ...baseStyle,
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        } else if (C === 6) {
          // Nominal -> Rata Kanan & Format Angka Excel
          ws[cellRef].t = 'n';
          ws[cellRef].s = {
            ...baseStyle,
            alignment: { horizontal: 'right', vertical: 'center' },
            numFmt: '#,##0'
          };
        } else {
          // Teks lainnya -> Rata Kiri
          ws[cellRef].s = {
            ...baseStyle,
            alignment: { horizontal: 'left', vertical: 'center' }
          };
        }
      } else if (R === sheetData.length - 1) {
        // Baris Total Pengeluaran
        if (C === 6) {
          ws[cellRef].t = 'n';
          ws[cellRef].s = totalAmountStyle;
        } else {
          ws[cellRef].s = totalLabelStyle;
        }
      }
    }
  }

  // Tinggi Baris
  ws['!rows'] = [
    { hpt: 32 }, // Title
    { hpt: 22 }, // Subtitle
    { hpt: 10 }, // Empty
    { hpt: 26 }, // Headers
    ...expenses.map(() => ({ hpt: 20 })),
    { hpt: 26 }  // Total row
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Pengeluaran');

  // 9. Generate & Unduh File .xlsx Asli
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);

  let finalFilename = customFilename || `laporan_pengeluaran_${new Date().toISOString().slice(0, 10)}.xlsx`;
  if (!finalFilename.endsWith('.xlsx')) {
    finalFilename = finalFilename.replace(/\.[^/.]+$/, '') + '.xlsx';
  }

  link.setAttribute('download', finalFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = exportToExcel;

// Reset data hanya untuk akun yang sedang aktif
export const resetAllData = (userId = null) => {
  saveExpenses([], userId);
  saveCurrency('Rp', userId);
  saveDailyBudget(DEFAULT_DAILY_BUDGET, userId);
  saveCategories(DEFAULT_CATEGORIES, userId);
  saveLastViewedTxTime(Date.now(), userId);
  return {
    expenses: [],
    currency: 'Rp',
    dailyBudget: DEFAULT_DAILY_BUDGET,
    categories: DEFAULT_CATEGORIES
  };
};

const LAST_VIEWED_TX_KEY = 'spendwise_last_viewed_tx_v2';

export const loadLastViewedTxTime = (userId = null) => {
  const key = getUserStorageKey(LAST_VIEWED_TX_KEY, userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const val = parseInt(raw, 10);
      if (!isNaN(val)) return val;
    }
  } catch (err) {
    console.error('Failed to load last viewed tx time:', err);
  }
  // Default to current time so existing historical records are not marked as unread
  const now = Date.now();
  saveLastViewedTxTime(now, userId);
  return now;
};

export const saveLastViewedTxTime = (timestamp, userId = null) => {
  const key = getUserStorageKey(LAST_VIEWED_TX_KEY, userId);
  try {
    localStorage.setItem(key, String(timestamp));
  } catch (err) {
    console.error('Failed to save last viewed tx time:', err);
  }
};
