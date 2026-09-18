export const DEFAULT_CATEGORIES = [
  {
    id: 'food',
    name: 'Makanan & Minuman',
    icon: '🍔',
    color: '#f97316',
    bgLight: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.3)',
    isDefault: true
  },
  {
    id: 'groceries',
    name: 'Belanja Bulanan',
    icon: '🛒',
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    isDefault: true
  },
  {
    id: 'transport',
    name: 'Transportasi & Bensin',
    icon: '🚗',
    color: '#3b82f6',
    bgLight: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.3)',
    isDefault: true
  },
  {
    id: 'utilities',
    name: 'Tagihan & Listrik',
    icon: '⚡',
    color: '#eab308',
    bgLight: 'rgba(234, 179, 8, 0.12)',
    border: 'rgba(234, 179, 8, 0.3)',
    isDefault: true
  },
  {
    id: 'shopping',
    name: 'Belanja & Fashion',
    icon: '🛍️',
    color: '#ec4899',
    bgLight: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.3)',
    isDefault: true
  },
  {
    id: 'health',
    name: 'Kesehatan & Medis',
    icon: '💊',
    color: '#ef4444',
    bgLight: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    isDefault: true
  },
  {
    id: 'entertainment',
    name: 'Hiburan & Hobi',
    icon: '🎬',
    color: '#8b5cf6',
    bgLight: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.3)',
    isDefault: true
  },
  {
    id: 'education',
    name: 'Pendidikan & Buku',
    icon: '📚',
    color: '#06b6d4',
    bgLight: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.3)',
    isDefault: true
  },
  {
    id: 'coffee',
    name: 'Kopi & Nongkrong',
    icon: '☕',
    color: '#d97706',
    bgLight: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.3)',
    isDefault: true
  },
  {
    id: 'other',
    name: 'Lain-lain',
    icon: '🏷️',
    color: '#64748b',
    bgLight: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.3)',
    isDefault: true
  }
];

export const CATEGORIES = DEFAULT_CATEGORIES;

export const hexToRgba = (hex, alpha = 0.12) => {
  if (!hex) return `rgba(100, 116, 139, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(100, 116, 139, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getCategoryStyles = (color) => ({
  bgLight: hexToRgba(color, 0.12),
  border: hexToRgba(color, 0.3)
});

export const PAYMENT_METHODS = [
  { id: 'wallet', name: 'E-Wallet / QRIS', icon: 'Smartphone' },
  { id: 'transfer', name: 'Bank Transfer', icon: 'Landmark' },
  { id: 'cash', name: 'Cash / Tunai', icon: 'Banknote' },
  { id: 'card', name: 'Debit / Credit Card', icon: 'CreditCard' }
];

export const QUICK_PRESETS = [
  { title: 'Kopi / Kafe', amount: 20000, categoryId: 'coffee', method: 'wallet' },
  { title: 'Makan Siang', amount: 35000, categoryId: 'food', method: 'wallet' },
  { title: 'Bensin Motor / Mobil', amount: 50000, categoryId: 'transport', method: 'cash' },
  { title: 'Belanja Supermarket', amount: 85000, categoryId: 'groceries', method: 'card' },
  { title: 'Ojek Online / Transport', amount: 18000, categoryId: 'transport', method: 'wallet' },
  { title: 'Camilan / Snack', amount: 15000, categoryId: 'food', method: 'cash' }
];

export const CURRENCIES = [
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah (Rp)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (S$)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' }
];

// Standar Kurs Konversi Referensi (1 unit mata uang asing = sekian Rupiah IDR)
export const EXCHANGE_RATES = {
  'Rp': 1,
  'IDR': 1,
  '$': 16000,
  'USD': 16000,
  'S$': 12000,
  'SGD': 12000,
  '€': 17500,
  'EUR': 17500
};

/**
 * Konversi nominal uang dari satu mata uang ke mata uang lain berdasarkan kurs acuan.
 */
export const convertCurrencyAmount = (amount, fromCurrency = 'Rp', toCurrency = 'Rp') => {
  const num = Number(amount) || 0;
  if (num === 0) return 0;
  const fromSym = (fromCurrency || 'Rp').trim();
  const toSym = (toCurrency || 'Rp').trim();
  if (fromSym === toSym) return num;

  const fromRate = EXCHANGE_RATES[fromSym] || 1;
  const toRate = EXCHANGE_RATES[toSym] || 1;

  // Konversi ke basis IDR terlebih dahulu, lalu ke target mata uang
  const inIDR = num * fromRate;
  const inTarget = inIDR / toRate;

  // Jika target Rupiah, bulatkan ke ratusan terdekat
  if (toSym === 'Rp' || toSym === 'IDR') {
    return Math.round(inTarget / 100) * 100;
  }

  // Jika target mata uang asing (EUR, USD, SGD):
  if (inTarget >= 100) {
    return Math.round(inTarget);
  }
  return Math.round(inTarget * 100) / 100;
};

/**
 * Mendapatkan pilihan cepat batas anggaran (presets) sesuai mata uang yang aktif.
 */
export const getBudgetPresets = (currency = 'Rp') => {
  const sym = (currency || 'Rp').trim();
  if (sym === 'Rp' || sym === 'IDR') {
    return [
      { label: 'Rp ∞ (Bebas)', value: 0 },
      { label: '50 Ribu', value: 50000 },
      { label: '100 Ribu', value: 100000 },
      { label: '200 Ribu', value: 200000 },
      { label: '500 Ribu', value: 500000 },
      { label: '1 Juta', value: 1000000 }
    ];
  }
  if (sym === '€') {
    return [
      { label: '€ ∞ (Bebas)', value: 0 },
      { label: '€ 10', value: 10 },
      { label: '€ 25', value: 25 },
      { label: '€ 50', value: 50 },
      { label: '€ 100', value: 100 },
      { label: '€ 200', value: 200 }
    ];
  }
  if (sym === '$') {
    return [
      { label: '$ ∞ (Bebas)', value: 0 },
      { label: '$ 10', value: 10 },
      { label: '$ 25', value: 25 },
      { label: '$ 50', value: 50 },
      { label: '$ 100', value: 100 },
      { label: '$ 200', value: 200 }
    ];
  }
  if (sym === 'S$') {
    return [
      { label: 'S$ ∞ (Bebas)', value: 0 },
      { label: 'S$ 15', value: 15 },
      { label: 'S$ 35', value: 35 },
      { label: 'S$ 70', value: 70 },
      { label: 'S$ 150', value: 150 },
      { label: 'S$ 300', value: 300 }
    ];
  }
  return [
    { label: `${sym} ∞ (Bebas)`, value: 0 },
    { label: `${sym} 10`, value: 10 },
    { label: `${sym} 25`, value: 25 },
    { label: `${sym} 50`, value: 50 },
    { label: `${sym} 100`, value: 100 }
  ];
};

/**
 * Mendapatkan tombol cepat tambah nominal di form transaksi sesuai mata uang.
 */
export const getQuickAmountChips = (currency = 'Rp') => {
  const sym = (currency || 'Rp').trim();
  if (sym === 'Rp' || sym === 'IDR') {
    return [
      { label: '+10k', value: 10000 },
      { label: '+25k', value: 25000 },
      { label: '+50k', value: 50000 },
      { label: '+100k', value: 100000 }
    ];
  }
  if (sym === '€' || sym === '$') {
    return [
      { label: '+5', value: 5 },
      { label: '+10', value: 10 },
      { label: '+25', value: 25 },
      { label: '+50', value: 50 }
    ];
  }
  return [
    { label: '+5', value: 5 },
    { label: '+15', value: 15 },
    { label: '+30', value: 30 },
    { label: '+50', value: 50 }
  ];
};

export const DEFAULT_PEOPLE = [
  { id: 'p1', name: 'Self', avatar: '👤', color: '#2563eb' }
];

export const getCategoryById = (id, customCategories = null) => {
  const list = (customCategories && customCategories.length > 0) ? customCategories : DEFAULT_CATEGORIES;
  const found = list.find(cat => cat.id === id);
  if (found) return found;

  const defFound = DEFAULT_CATEGORIES.find(cat => cat.id === id);
  if (defFound) return defFound;

  return {
    id: id || 'other',
    name: id ? (id.charAt(0).toUpperCase() + id.slice(1)) : 'Lain-lain',
    icon: '🏷️',
    color: '#64748b',
    bgLight: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.3)'
  };
};
