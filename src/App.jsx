import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';

import {
  loadExpenses,
  saveExpenses,
  loadDailyBudget,
  saveDailyBudget,
  loadCurrency,
  saveCurrency,
  loadTheme,
  saveTheme,
  loadCurrentUser,
  saveCurrentUser,
  loadLinkedAccounts,
  addLinkedAccount,
  removeLinkedAccount,
  loadCategories,
  saveCategories,
  exportToCSV,
  resetAllData,
  loadLastViewedTxTime,
  saveLastViewedTxTime,
  loadAccentColor,
  saveAccentColor,
  ACCENT_COLORS
} from './utils/storage';

import { DEFAULT_CATEGORIES, convertCurrencyAmount } from './data/categories';
import { DEFAULT_DAILY_BUDGET } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileMenuSheet } from './components/MobileMenuSheet';
import { DateNavigator } from './components/DateNavigator';
import { DailySummaryCards } from './components/DailySummaryCards';
import { ExpenseList } from './components/ExpenseList';
import { ChartsSection } from './components/ChartsSection';
import { ExpenseModal } from './components/ExpenseModal';
import { BudgetModal } from './components/BudgetModal';
import { CategoriesPage } from './components/CategoriesPage';
import { AuthModal } from './components/AuthModal';
import { ProfilePage } from './components/ProfilePage';
import { SettingsPage } from './components/SettingsPage';
import { ExportModal } from './components/ExportModal';
import { UnlinkAccountModal } from './components/UnlinkAccountModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { InstallPromptModal } from './components/InstallPromptModal';
import { Toast } from './components/Toast';
import { formatCurrency } from './utils/storage';
import {
  syncExpenseToFirestore,
  syncUserProfileToFirestore,
  syncAllLocalUsersToFirestore,
  fetchExpensesFromFirestore,
  deleteExpenseFromFirestore,
  syncAllExpensesToFirestore,
  fetchUserProfileFromFirestore
} from './utils/firebase';
import { useTranslation } from './i18n/LanguageContext';

const ROUTE_PATHS = {
  dashboard: '/',
  transactions: '/transactions',
  categories: '/categories',
  profile: '/profile',
  settings: '/settings'
};

const getRouteFromPathname = (pathname) => {
  const norm = (pathname || '/').toLowerCase().replace(/\/$/, '') || '/';
  if (norm === '' || norm === '/' || norm === '/home' || norm === '/dashboard' || norm === '/landing') {
    return 'dashboard';
  }
  if (norm === '/transactions' || norm === '/riwayat') return 'transactions';
  if (norm === '/categories' || norm === '/kategori') return 'categories';
  if (norm === '/profile' || norm === '/profil') return 'profile';
  if (norm === '/settings' || norm === '/pengaturan') return 'settings';
  return 'dashboard';
};

function App() {
  const { t, language } = useTranslation();

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [theme, setTheme] = useState(loadTheme);
  const [accentColor, setAccentColor] = useState(loadAccentColor);
  const [currentUser, setCurrentUser] = useState(loadCurrentUser);
  const [linkedAccounts, setLinkedAccounts] = useState(loadLinkedAccounts);
  const activeUserId = currentUser?.id || 'guest';
  const loadedUserIdRef = useRef(activeUserId);

  // Budget timestamp helpers — used for last-write-wins sync across devices
  const budgetTsKey = (uid) => `spendwise_budget_ts_v1_${String(uid).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const loadBudgetTs = (uid) => { try { return Number(localStorage.getItem(budgetTsKey(uid))) || 0; } catch { return 0; } };
  const saveBudgetTs = (uid, ts) => { try { localStorage.setItem(budgetTsKey(uid), String(ts)); } catch {} };

  // Auto-sync user profiles on load
  useEffect(() => {
    syncAllLocalUsersToFirestore();
    const storedLinked = loadLinkedAccounts();
    storedLinked.forEach(acc => {
      if (acc && acc.id) syncUserProfileToFirestore(acc);
    });
  }, []);

  // On startup: automatic cloud sync — fully transparent, no user action needed
  const didInitialSyncRef = useRef(false);
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === 'guest') return;
    if (didInitialSyncRef.current) return;
    didInitialSyncRef.current = true;

    const userId = currentUser.id;
    const idToken = currentUser.idToken || null;

    // --- BUDGET: last-write-wins based on timestamp ---
    const localBudget = loadDailyBudget(userId);
    const localBudgetTs = loadBudgetTs(userId);

    fetchUserProfileFromFirestore(userId, idToken).then(profile => {
      const cloudBudget = profile?.dailyBudget || 0;
      const cloudTs = profile?.budgetUpdatedAt || 0;

      if (cloudTs > localBudgetTs && cloudBudget > 0) {
        // Cloud is newer → use cloud budget
        setDailyBudget(cloudBudget);
        saveDailyBudget(cloudBudget, userId);
        saveBudgetTs(userId, cloudTs);
      } else if (localBudgetTs > cloudTs && localBudget > 0) {
        // Local is newer → push to cloud
        syncUserProfileToFirestore(currentUser, { dailyBudget: localBudget, budgetUpdatedAt: localBudgetTs });
      } else if (cloudBudget > 0 && localBudgetTs === 0) {
        // First time on this device, no local timestamp → use cloud
        setDailyBudget(cloudBudget);
        saveDailyBudget(cloudBudget, userId);
        saveBudgetTs(userId, cloudTs || Date.now());
      }
    }).catch(err => console.warn('Cloud budget sync error:', err));

    // --- EXPENSES: merge cloud + local (union by ID) ---
    fetchExpensesFromFirestore(userId, idToken).then(cloudExpenses => {
      if (cloudExpenses && cloudExpenses.length > 0) {
        setExpenses(prev => {
          const map = new Map();
          prev.forEach(e => map.set(String(e.id), e));
          cloudExpenses.forEach(e => map.set(String(e.id), e));
          const merged = Array.from(map.values());
          saveExpenses(merged, userId);
          return merged;
        });
      }
    }).catch(err => console.warn('Cloud expenses sync error:', err));

    // Push local expenses to cloud (backup)
    const localExp = loadExpenses(userId);
    if (localExp.length > 0) {
      syncAllExpensesToFirestore(userId, idToken, localExp);
    }
  }, [currentUser?.id]);

  // Sync linked accounts when currentUser changes and sync to Firestore
  useEffect(() => {
    if (currentUser?.id) {
      addLinkedAccount(currentUser);
      setLinkedAccounts(loadLinkedAccounts());
      // Only sync profile info (name/avatar/etc), NOT budget here.
      // Budget is only pushed when user explicitly sets it via handleUpdateDailyBudget.
      syncUserProfileToFirestore(currentUser);
    }
  }, [currentUser]);

  // Synchronize route state with browser URL
  const [activeTab, setActiveTab] = useState(() =>
    getRouteFromPathname(window.location.pathname)
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigateTo = (tabName, options = { replace: false }) => {
    setActiveTab(tabName);
    setIsMobileMenuOpen(false);
    const targetPath = ROUTE_PATHS[tabName] || '/';
    if (window.location.pathname !== targetPath) {
      if (options.replace) {
        window.history.replaceState({ tab: tabName }, '', targetPath);
      } else {
        window.history.pushState({ tab: tabName }, '', targetPath);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync browser popstate (Back / Forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromPathname(window.location.pathname);
      setActiveTab(route);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Normalize initial or alias URLs to canonical paths
  useEffect(() => {
    const currentPath = window.location.pathname;
    const targetPath = ROUTE_PATHS[activeTab] || '/';
    if (currentPath !== targetPath && getRouteFromPathname(currentPath) === activeTab) {
      window.history.replaceState({ tab: activeTab }, '', targetPath);
    }
  }, [activeTab]);

  const [selectedDate, setSelectedDate] = useState(getTodayISO);
  const [expenses, setExpenses] = useState(() => loadExpenses(activeUserId));
  const [dailyBudget, setDailyBudget] = useState(() => loadDailyBudget(activeUserId));
  const [currency, setCurrency] = useState(() => loadCurrency(activeUserId));
  const [categories, setCategories] = useState(() => loadCategories(activeUserId));
  const [lastViewedTxTime, setLastViewedTxTime] = useState(() => loadLastViewedTxTime(activeUserId));

  // Modals & Navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // AuthModal state - opens when explicitly requested or if visiting /login
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    return window.location.pathname === '/login';
  });
  const [isAuthRegisterMode, setIsAuthRegisterMode] = useState(false);
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);
  const [isCookieBannerOpen, setIsCookieBannerOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  const handleOpenLogin = () => {
    setIsLinkingAccount(false);
    setIsAuthRegisterMode(false);
    setIsAuthModalOpen(true);
  };

  const handleOpenAddAccount = () => {
    if (linkedAccounts.length >= 3) {
      showToast(
        language === 'en'
          ? 'Maximum 3 linked accounts allowed. Please unlink an account first.'
          : 'Maksimal 3 akun yang dapat ditautkan. Silakan lepas tautan salah satu akun terlebih dahulu.',
        'warning'
      );
      return;
    }
    setIsLinkingAccount(true);
    setIsAuthRegisterMode(false);
    setIsAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setIsLinkingAccount(false);
    setIsAuthRegisterMode(true);
    setIsAuthModalOpen(true);
  };

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [accountToUnlink, setAccountToUnlink] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const isFirstThemeMountRef = useRef(true);
  const themeTransitionTimerRef = useRef(null);

  // Sync theme & accent color to DOM root with smooth, synchronized transition
  useEffect(() => {
    if (isFirstThemeMountRef.current) {
      isFirstThemeMountRef.current = false;
    } else {
      const doc = document.documentElement;
      doc.classList.add('theme-transitioning');
      clearTimeout(themeTransitionTimerRef.current);
      themeTransitionTimerRef.current = setTimeout(() => {
        doc.classList.remove('theme-transitioning');
      }, 320);
    }

    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);

    const activeAccent = ACCENT_COLORS.find(
      (c) => c.hex.toLowerCase() === (accentColor || '').toLowerCase()
    ) || ACCENT_COLORS[0];

    const root = document.documentElement;
    root.style.setProperty('--accent-primary', activeAccent.hex);
    root.style.setProperty('--accent-hover', activeAccent.hover);
    root.style.setProperty(
      '--accent-subtle',
      theme === 'dark' ? `${activeAccent.hex}26` : `${activeAccent.hex}14`
    );
    root.style.setProperty(
      '--accent-border',
      theme === 'dark' ? `${activeAccent.hex}44` : `${activeAccent.hex}33`
    );
    root.style.setProperty('--accent-glow', `${activeAccent.hex}33`);
    root.style.setProperty('--border-focus', activeAccent.hex);
  }, [theme, accentColor]);

  // Synchronize data when active user changes (Login, Logout, Switch Account)
  useEffect(() => {
    if (loadedUserIdRef.current !== activeUserId) {
      const localExpenses = loadExpenses(activeUserId);
      setExpenses(localExpenses);

      // Migrate any pending guest budget to authenticated user account ONLY if explicitly requested
      const pendingBudgetRaw = localStorage.getItem('spendwise_pending_guest_budget');
      if (pendingBudgetRaw !== null && activeUserId !== 'guest') {
        const pendingVal = parseFloat(pendingBudgetRaw);
        localStorage.removeItem('spendwise_pending_guest_budget');
        if (!isNaN(pendingVal)) {
          saveDailyBudget(pendingVal, activeUserId);
          setDailyBudget(pendingVal);
        } else {
          setDailyBudget(loadDailyBudget(activeUserId));
        }
      } else {
        setDailyBudget(loadDailyBudget(activeUserId));
      }

      setCurrency(loadCurrency(activeUserId));
      setCategories(loadCategories(activeUserId));
      setLastViewedTxTime(loadLastViewedTxTime(activeUserId));
      loadedUserIdRef.current = activeUserId;

      // Cloud Sync: If user is authenticated, pull from Firestore Cloud Database
      if (currentUser?.id && activeUserId !== 'guest') {
        // Try with idToken first, then fallback to unauthenticated (for local-email accounts or expired tokens)
        const tryFetchExpenses = async () => {
          let cloudExpenses = await fetchExpensesFromFirestore(activeUserId, currentUser.idToken);
          // If first attempt returns empty but we have no local data either, try without token
          // (open Firestore rules may allow read, which helps local-email accounts)
          if ((!cloudExpenses || cloudExpenses.length === 0) && !currentUser.idToken) {
            cloudExpenses = await fetchExpensesFromFirestore(activeUserId, null);
          }
          return cloudExpenses;
        };

        tryFetchExpenses().then(cloudExpenses => {
          if (cloudExpenses && cloudExpenses.length > 0) {
            setExpenses(prev => {
              const map = new Map();
              prev.forEach(e => map.set(String(e.id), e));
              cloudExpenses.forEach(e => map.set(String(e.id), e));
              const merged = Array.from(map.values());
              saveExpenses(merged, activeUserId);
              return merged;
            });
          } else if (localExpenses && localExpenses.length > 0) {
            // Local expenses exist but cloud is empty: push to Firestore
            syncAllExpensesToFirestore(activeUserId, currentUser.idToken, localExpenses);
          }
          // If both cloud and local are empty, keep current state (don't reset to [])
        }).catch(err => console.warn('Cloud sync error:', err));

        // Restore cloud budget if exists
        const tryFetchProfile = async () => {
          let profile = await fetchUserProfileFromFirestore(activeUserId, currentUser.idToken);
          if (!profile && !currentUser.idToken) {
            profile = await fetchUserProfileFromFirestore(activeUserId, null);
          }
          return profile;
        };
        tryFetchProfile().then(profile => {
          if (profile?.dailyBudget !== null && profile?.dailyBudget !== undefined && profile.dailyBudget > 0) {
            setDailyBudget(profile.dailyBudget);
            saveDailyBudget(profile.dailyBudget, activeUserId);
          }
        }).catch(err => console.warn('Cloud profile sync error:', err));
      }
    }
  }, [activeUserId, currentUser]);

  // When user opens 'transactions' tab, clear unread notifications immediately
  useEffect(() => {
    if (activeTab === 'transactions') {
      const now = Date.now();
      setLastViewedTxTime(now);
      saveLastViewedTxTime(now, activeUserId);
    }
  }, [activeTab, activeUserId]);

  // Guard profile & categories tabs - if unauthenticated, directly show login overlay
  useEffect(() => {
    if ((activeTab === 'profile' || activeTab === 'categories') && !currentUser) {
      navigateTo('dashboard', { replace: true });
      handleOpenLogin();
    }
  }, [activeTab, currentUser]);

  // Compute unread new transactions (only shown when not on transactions tab)
  const unreadTransactionsCount = useMemo(() => {
    if (activeTab === 'transactions') return 0;
    return expenses.filter(e => {
      const created = e.createdAt || (typeof e.id === 'string' && e.id.startsWith('exp-') ? Number(e.id.replace('exp-', '')) : 0);
      return created > lastViewedTxTime;
    }).length;
  }, [expenses, lastViewedTxTime, activeTab]);

  // Persist expenses only for the currently active user context
  useEffect(() => {
    if (loadedUserIdRef.current === activeUserId) {
      saveExpenses(expenses, activeUserId);
    }
  }, [expenses, activeUserId]);

  // Persist daily budget
  useEffect(() => {
    if (loadedUserIdRef.current === activeUserId) {
      saveDailyBudget(dailyBudget, activeUserId);
    }
  }, [dailyBudget, activeUserId]);

  // Persist categories
  useEffect(() => {
    if (loadedUserIdRef.current === activeUserId) {
      saveCategories(categories, activeUserId);
    }
  }, [categories, activeUserId]);

  // Persist currency
  useEffect(() => {
    if (loadedUserIdRef.current === activeUserId) {
      saveCurrency(currency, activeUserId);
    }
  }, [currency, activeUserId]);

  // Persist user session
  useEffect(() => {
    saveCurrentUser(currentUser);
  }, [currentUser]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Compute total spent today
  const totalSpendToday = useMemo(() => {
    const todayStr = getTodayISO();
    return expenses
      .filter(e => e.date === todayStr)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  // Auth Handlers
  const handleLogin = (user) => {
    if (user?.isNewRegistration) {
      // New account registration: Daily limit defaults to 100k (DEFAULT_DAILY_BUDGET)
      const pendingBudgetRaw = localStorage.getItem('spendwise_pending_guest_budget');
      if (pendingBudgetRaw !== null) {
        const pendingVal = parseFloat(pendingBudgetRaw);
        localStorage.removeItem('spendwise_pending_guest_budget');
        if (!isNaN(pendingVal)) {
          saveDailyBudget(pendingVal, user.id, true);
          setDailyBudget(pendingVal);
        } else {
          saveDailyBudget(DEFAULT_DAILY_BUDGET, user.id);
          setDailyBudget(DEFAULT_DAILY_BUDGET);
        }
      } else {
        saveDailyBudget(DEFAULT_DAILY_BUDGET, user.id);
        setDailyBudget(DEFAULT_DAILY_BUDGET);
      }
    } else {
      // Existing login: check if there is a pending budget set while in guest mode before login
      const pendingBudgetRaw = localStorage.getItem('spendwise_pending_guest_budget');
      if (pendingBudgetRaw !== null) {
        const pendingVal = parseFloat(pendingBudgetRaw);
        localStorage.removeItem('spendwise_pending_guest_budget');
        if (!isNaN(pendingVal)) {
          saveDailyBudget(pendingVal, user.id);
          setDailyBudget(pendingVal);
        } else {
          setDailyBudget(loadDailyBudget(user.id));
        }
      } else {
        setDailyBudget(loadDailyBudget(user.id));
      }
    }

    if (isLinkingAccount) {
      const isAlreadyLinked = linkedAccounts.some(
        u => u.id === user.id || (u.email && user.email && u.email.toLowerCase().trim() === user.email.toLowerCase().trim())
      );
      if (!isAlreadyLinked && linkedAccounts.length >= 3) {
        showToast(
          language === 'en'
            ? 'Maximum 3 linked accounts limit reached.'
            : 'Maksimal 3 akun tertaut telah tercapai.',
          'warning'
        );
        setIsAuthModalOpen(false);
        setIsLinkingAccount(false);
        return;
      }
    }

    // Seamless local-to-cloud migration:
    // If user has local guest expenses, migrate them into the user's account and sync to Firestore
    const guestExpenses = loadExpenses('guest');
    let finalExpensesForUser = loadExpenses(user.id);
    if (guestExpenses && guestExpenses.length > 0) {
      const existingIds = new Set(finalExpensesForUser.map(e => String(e.id)));
      const newItemsFromGuest = guestExpenses.filter(e => !existingIds.has(String(e.id)));
      if (newItemsFromGuest.length > 0) {
        finalExpensesForUser = [...finalExpensesForUser, ...newItemsFromGuest];
        saveExpenses(finalExpensesForUser, user.id);
        saveExpenses([], 'guest'); // clean up guest storage
      }
    }

    // Always push local data to Firestore on every login so other devices can pull it later.
    // This is the key step that ensures cross-device sync even for local-email accounts.
    if (finalExpensesForUser.length > 0) {
      syncAllExpensesToFirestore(user.id, user.idToken, finalExpensesForUser);
    }

    // Immediately update UI with the user's local data so there's no blank flash
    setExpenses(finalExpensesForUser);

    const updatedList = addLinkedAccount(user);
    setLinkedAccounts(updatedList);
    setCurrentUser(user);
    saveCurrentUser(user);
    setIsAuthModalOpen(false);
    setIsAuthRegisterMode(false);
    setIsLinkingAccount(false);
    showToast(
      isLinkingAccount
        ? (language === 'en' ? `Account ${user.name} linked and activated!` : `Akun ${user.name} berhasil ditautkan dan diaktifkan!`)
        : user?.isNewRegistration
          ? (language === 'en' ? `Welcome to SpendWise, ${user.name}!` : `Selamat datang di SpendWise, ${user.name}!`)
          : (language === 'en' ? `Welcome back, ${user.name}!` : `Selamat datang kembali, ${user.name}!`)
    );
  };

  const handleSwitchAccount = (targetUser) => {
    if (!targetUser || targetUser.id === currentUser?.id) return;
    setCurrentUser(targetUser);
    saveCurrentUser(targetUser);
    showToast(
      language === 'en'
        ? `Switched to account ${targetUser.name}`
        : `Beralih ke akun ${targetUser.name} (${targetUser.email})`
    );
  };

  const handleRemoveLinkedAccount = (userId) => {
    const remaining = removeLinkedAccount(userId);
    setLinkedAccounts(remaining);
    if (currentUser?.id === userId) {
      if (remaining.length > 0) {
        handleSwitchAccount(remaining[0]);
      } else {
        handleLogout();
      }
    }
    showToast(
      language === 'en' ? 'Account unlinked from this device.' : 'Tautan akun berhasil dilepas.',
      'info'
    );
  };

  const handleRequestUnlink = (accountOrId) => {
    if (!accountOrId) return;
    if (typeof accountOrId === 'object' && accountOrId.id) {
      setAccountToUnlink(accountOrId);
    } else {
      const target = linkedAccounts.find(a => a.id === accountOrId);
      if (target) {
        setAccountToUnlink(target);
      } else {
        handleRemoveLinkedAccount(accountOrId);
      }
    }
  };

  const handleConfirmUnlink = (account) => {
    if (account && account.id) {
      handleRemoveLinkedAccount(account.id);
    }
    setAccountToUnlink(null);
  };

  const handleLogout = () => {
    if (currentUser?.id) {
      const remaining = removeLinkedAccount(currentUser.id);
      setLinkedAccounts(remaining);
      if (remaining.length > 0) {
        setCurrentUser(remaining[0]);
        saveCurrentUser(remaining[0]);
        showToast(
          language === 'en'
            ? `Logged out. Switched to ${remaining[0].name}`
            : `Keluar akun. Beralih ke akun ${remaining[0].name}`,
          'info'
        );
        return;
      }
    }
    setCurrentUser(null);
    saveCurrentUser(null);
    setLinkedAccounts([]);
    navigateTo('dashboard');
    showToast(language === 'en' ? 'You have logged out.' : 'Anda telah keluar dari akun.', 'info');
  };

  // Safe handler to open expense modal - strictly checks that user has an account
  const handleOpenAddExpense = () => {
    if (!currentUser) {
      showToast(language === 'en' ? 'Please sign in or create an account to record expenses.' : 'Silakan buat akun atau masuk terlebih dahulu untuk mencatat pengeluaran.', 'warning');
      handleOpenLogin();
      return;
    }
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  // Safe handler to open category manager - strictly checks that user has an account
  const handleOpenCategories = () => {
    if (!currentUser) {
      handleOpenLogin();
      return;
    }
    navigateTo('categories');
  };

  // Add or edit expense
  const handleSaveExpense = (expenseData) => {
    if (!currentUser) {
      showToast('Silakan buat akun atau masuk terlebih dahulu untuk mencatat pengeluaran.', 'warning');
      handleOpenLogin();
      return;
    }

    if (expenseToEdit) {
      setExpenses(prev => prev.map(e => (e.id === expenseData.id ? expenseData : e)));
      showToast(language === 'en' ? `Expense "${expenseData.title}" updated successfully` : `Pengeluaran "${expenseData.title}" berhasil diperbarui`);
    } else {
      setExpenses(prev => [expenseData, ...prev]);
      showToast(language === 'en' ? `Expense "${expenseData.title}" recorded successfully` : `Pengeluaran "${expenseData.title}" berhasil dicatat`);
    }

    // Sync with Firebase Firestore if user is authenticated
    if (currentUser?.id) {
      syncExpenseToFirestore(currentUser.id, currentUser.idToken, expenseData);
    }

    setIsExpenseModalOpen(false);
    setExpenseToEdit(null);
  };

  // Delete expense
  const handleDeleteExpense = (id) => {
    if (!currentUser) {
      showToast(language === 'en' ? 'This action requires an account.' : 'Aksi ini memerlukan akun terdaftar.', 'warning');
      handleOpenLogin();
      return;
    }
    const target = expenses.find(e => e.id === id);
    if (!target) return;

    if (window.confirm(language === 'en' ? `Delete expense "${target.title}"?` : `Hapus pengeluaran "${target.title}"?`)) {
      setExpenses(prev => {
        const updated = prev.filter(e => e.id !== id);
        saveExpenses(updated, activeUserId);
        return updated;
      });
      if (currentUser?.id) {
        deleteExpenseFromFirestore(currentUser.id, currentUser.idToken, id);
      }
      showToast(language === 'en' ? `Expense "${target.title}" has been deleted` : `Pengeluaran "${target.title}" telah dihapus`, 'info');
    }
  };

  // Quick preset add
  const handleQuickAddPreset = (preset) => {
    if (!currentUser) {
      showToast('Silakan buat akun atau masuk terlebih dahulu untuk mencatat pengeluaran.', 'warning');
      handleOpenLogin();
      return;
    }
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newExpense = {
      id: `exp-${Date.now()}`,
      title: preset.title,
      amount: preset.amount,
      date: selectedDate,
      time: timeStr,
      categoryId: preset.categoryId,
      paymentMethod: preset.method || 'wallet',
      notes: 'Quick 1-click entry',
      createdAt: Date.now()
    };

    setExpenses(prev => [newExpense, ...prev]);
    if (currentUser?.id) {
      syncExpenseToFirestore(currentUser.id, currentUser.idToken, newExpense);
    }
    showToast(`Recorded ${preset.title} (${formatCurrency(preset.amount, currency)})`);
  };

  // Update daily budget limit
  const handleUpdateDailyBudget = (newBudget) => {
    setDailyBudget(newBudget);
    saveDailyBudget(newBudget, activeUserId, true);
    if (currentUser?.id) {
      // Save timestamp so other devices know this is the most recent budget
      const ts = Date.now();
      saveBudgetTs(activeUserId, ts);
      syncUserProfileToFirestore(currentUser, { dailyBudget: newBudget, budgetUpdatedAt: ts });
    }

    if (!currentUser) {
      // User is not logged in: store pending budget transfer and direct to login modal!
      localStorage.setItem('spendwise_pending_guest_budget', newBudget.toString());
      if (newBudget > 0) {
        showToast(`Batas limit ${formatCurrency(newBudget, currency)} diatur! Silakan buat akun/masuk agar tersimpan di akun Anda.`, 'info');
      } else {
        showToast('Batas limit harian dinonaktifkan (Tanpa batas).', 'info');
      }
      handleOpenLogin();
    } else {
      if (newBudget > 0) {
        showToast(`Batas limit harian diatur ke ${formatCurrency(newBudget, currency)}`);
      } else {
        showToast('Batas limit harian dinonaktifkan (Tanpa batas)', 'info');
      }
    }
  };

  // Update accent color
  const handleUpdateAccentColor = (newColor) => {
    setAccentColor(newColor);
    saveAccentColor(newColor);
    showToast('Warna aksen berhasil diperbarui!');
  };

  // Update currency with automatic real exchange-rate conversion
  const handleUpdateCurrency = (newSymbol) => {
    if (!newSymbol || newSymbol === currency) return;
    const oldSymbol = currency;

    // 1. Convert daily budget limit if active
    let convertedBudget = dailyBudget;
    if (dailyBudget > 0) {
      convertedBudget = convertCurrencyAmount(dailyBudget, oldSymbol, newSymbol);
      setDailyBudget(convertedBudget);
      saveDailyBudget(convertedBudget, activeUserId);
    }

    // 2. Convert all recorded transactions so historical amounts remain realistic
    if (expenses.length > 0) {
      const convertedExpenses = expenses.map(exp => ({
        ...exp,
        amount: convertCurrencyAmount(exp.amount, oldSymbol, newSymbol)
      }));
      setExpenses(convertedExpenses);
      saveExpenses(convertedExpenses, activeUserId);
    }

    // 3. Update & persist currency
    setCurrency(newSymbol);
    saveCurrency(newSymbol, activeUserId);

    const budgetInfo = dailyBudget > 0
      ? ` (Limit disesuaikan kurs: ${formatCurrency(convertedBudget, newSymbol)})`
      : '';
    showToast(`Mata uang diubah ke ${newSymbol}${budgetInfo}!`, 'info');
  };

  // Category Management
  const handleSaveCategories = (updatedCategories, deletedCatId = null) => {
    setCategories(updatedCategories);
    saveCategories(updatedCategories, activeUserId);
    if (deletedCatId) {
      const hasAffected = expenses.some(e => e.categoryId === deletedCatId);
      if (hasAffected) {
        const remapped = expenses.map(e =>
          e.categoryId === deletedCatId ? { ...e, categoryId: 'other' } : e
        );
        setExpenses(remapped);
        saveExpenses(remapped, activeUserId);
      }
    }
    showToast('Kategori berhasil diperbarui');
  };

  const handleResetCategories = () => {
    setCategories(DEFAULT_CATEGORIES);
    saveCategories(DEFAULT_CATEGORIES, activeUserId);
    showToast('Kategori berhasil dikembalikan ke 10 kategori default SpendWise');
  };

  // Export Excel Modal
  const handleOpenExportModal = () => {
    setIsExportModalOpen(true);
  };

  const handleExportSuccess = () => {
    showToast(t('toasts.excelDownloaded'));
  };

  const handleExportCSV = handleOpenExportModal;

  // Clear all recorded expenses and reset data for the current account
  const handleResetData = () => {
    const fresh = resetAllData(activeUserId);
    setExpenses(fresh.expenses);
    setDailyBudget(fresh.dailyBudget);
    setCurrency(fresh.currency);
    setCategories(fresh.categories);
    showToast(t('toasts.dataCleared'), 'info');
  };

  // Manual cloud backup: push all local expenses + profile to Firestore
  const handleSyncToCloud = async () => {
    if (!currentUser?.id || currentUser.id === 'guest') {
      showToast(language === 'en' ? 'Please log in to sync.' : 'Silakan login terlebih dahulu.', 'warning');
      return;
    }
    await syncAllExpensesToFirestore(currentUser.id, currentUser.idToken, expenses);
    await syncUserProfileToFirestore(currentUser, { dailyBudget });
    showToast(language === 'en' ? `${expenses.length} expenses backed up to cloud!` : `${expenses.length} transaksi berhasil di-backup ke cloud!`);
  };

  return (
    <>
      <div className="app-layout">
        {/* Left Navigation Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={navigateTo}
            onOpenExpenseModal={handleOpenAddExpense}
            onOpenCategoryModal={handleOpenCategories}
            onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            dailyBudget={dailyBudget}
            currency={currency}
            onExportCSV={handleExportCSV}
            currentUser={currentUser}
            onOpenAuthModal={handleOpenLogin}
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            unreadTransactionsCount={unreadTransactionsCount}
            linkedAccounts={linkedAccounts}
            onSwitchAccount={handleSwitchAccount}
            onOpenAddAccount={handleOpenAddAccount}
            onRemoveLinkedAccount={handleRequestUnlink}
          />

          {/* Main Content Viewport */}
          <div className="app-main-viewport">
            {/* Topbar Header */}
            <Header
              onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
              onOpenMenu={() => setIsMobileMenuOpen(true)}
              activeTab={activeTab}
              totalSpendToday={totalSpendToday}
              currency={currency}
              currentUser={currentUser}
              onOpenProfile={() => {
                if (!currentUser) {
                  handleOpenLogin();
                  return;
                }
                navigateTo('profile');
              }}
              onOpenAuthModal={handleOpenLogin}
              theme={theme}
              toggleTheme={toggleTheme}
            />

        {/* Main Website Content Body */}
        <main className="main-content">
        {/* TAB 1: RINGKASAN (DASHBOARD) */}
        {activeTab === 'dashboard' && (
          <div className="tab-dashboard-view">
            {/* 1. Hero Summary Cards (Pengeluaran Hari Ini & Batas Limit) */}
            <DailySummaryCards
              expenses={expenses}
              selectedDate={selectedDate}
              dailyBudget={dailyBudget}
              currency={currency}
              categories={categories}
              onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            />

            {/* 2. Navigasi Tanggal Modern */}
            <DateNavigator
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              expenses={expenses}
              currency={currency}
            />

            {/* 3. Daftar Transaksi Hari Terpilih */}
            <ExpenseList
              expenses={expenses}
              selectedDate={selectedDate}
              currency={currency}
              categories={categories}
              currentUser={currentUser}
              onEditExpense={(item) => {
                if (!currentUser) {
                  showToast('Silakan buat akun atau masuk terlebih dahulu.', 'warning');
                  handleOpenLogin();
                  return;
                }
                setExpenseToEdit(item);
                setIsExpenseModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
              onQuickAddPreset={handleQuickAddPreset}
              onOpenAddModal={handleOpenAddExpense}
            />

            {/* 4. Grafik Tren & Kategori */}
            <ChartsSection
              expenses={expenses}
              selectedDate={selectedDate}
              dailyBudget={dailyBudget}
              currency={currency}
              categories={categories}
              onSelectDate={setSelectedDate}
            />
          </div>
        )}

        {/* TAB 2: TRANSACTIONS HISTORY */}
        {activeTab === 'transactions' && (
          <div className="tab-transactions-view">
            <ExpenseList
              expenses={expenses}
              selectedDate={selectedDate}
              currency={currency}
              categories={categories}
              currentUser={currentUser}
              onEditExpense={(item) => {
                if (!currentUser) {
                  showToast('Silakan buat akun atau masuk terlebih dahulu.', 'warning');
                  handleOpenLogin();
                  return;
                }
                setExpenseToEdit(item);
                setIsExpenseModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
              onQuickAddPreset={handleQuickAddPreset}
              onOpenAddModal={handleOpenAddExpense}
              showAllDates={true}
            />
          </div>
        )}

        {/* TAB 3: SETTINGS & PREFERENCES */}
        {activeTab === 'settings' && (
          <SettingsPage
            theme={theme}
            toggleTheme={toggleTheme}
            accentColor={accentColor}
            onUpdateAccentColor={handleUpdateAccentColor}
            currency={currency}
            onUpdateCurrency={handleUpdateCurrency}
            dailyBudget={dailyBudget}
            onUpdateDailyBudget={handleUpdateDailyBudget}
            onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            onExportCSV={handleExportCSV}
            currentUser={currentUser}
            onOpenAuthModal={handleOpenLogin}
            onLogout={handleLogout}
            onResetData={handleResetData}
            onSyncToCloud={currentUser ? handleSyncToCloud : undefined}
            onBackToDashboard={() => navigateTo('dashboard')}
            onOpenCookieSettings={() => setIsCookieBannerOpen(true)}
          />
        )}

        {/* TAB 4: DEDICATED PROFILE PAGE */}
        {activeTab === 'profile' && (
          <ProfilePage
            currentUser={currentUser}
            onLogin={handleLogin}
            onUpdateProfile={(updatedUser) => {
              if (
                currentUser?.provider === 'google' ||
                currentUser?.role === 'Google Account' ||
                String(currentUser?.id || '').startsWith('google-') ||
                (typeof currentUser?.avatar === 'string' && currentUser.avatar.includes('googleusercontent.com'))
              ) {
                return;
              }
              setCurrentUser(updatedUser);
              saveCurrentUser(updatedUser);
              setLinkedAccounts(loadLinkedAccounts());
              syncUserProfileToFirestore(updatedUser, { dailyBudget });
              showToast('Profil berhasil diperbarui!');
            }}
            expenses={expenses}
            currency={currency}
            onUpdateCurrency={handleUpdateCurrency}
            dailyBudget={dailyBudget}
            onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            theme={theme}
            toggleTheme={toggleTheme}
            categories={categories}
            onOpenCategoryModal={handleOpenCategories}
            onExportCSV={handleExportCSV}
            onLogout={handleLogout}
            onOpenAuthModal={handleOpenLogin}
            onBackToDashboard={() => navigateTo('dashboard')}
            linkedAccounts={linkedAccounts}
            onSwitchAccount={handleSwitchAccount}
            onOpenAddAccount={handleOpenAddAccount}
            onRemoveLinkedAccount={handleRequestUnlink}
            onOpenCookieSettings={() => setIsCookieBannerOpen(true)}
          />
        )}

        {/* TAB 5: DEDICATED CATEGORIES MANAGEMENT PAGE */}
        {activeTab === 'categories' && (
          <CategoriesPage
            categories={categories}
            currentUser={currentUser}
            onSaveCategories={handleSaveCategories}
            onResetCategories={handleResetCategories}
            expenses={expenses}
            onBackToDashboard={() => navigateTo('dashboard')}
          />
        )}
      </main>
      </div>
    </div>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile <= 768px) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={navigateTo}
        onOpenAddExpense={handleOpenAddExpense}
        unreadTransactionsCount={unreadTransactionsCount}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        isMenuOpen={isMobileMenuOpen}
      />

      {/* Mobile Menu Action Sheet (Bottom Drawer) */}
      <MobileMenuSheet
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenLogin}
        onLogout={handleLogout}
        linkedAccounts={linkedAccounts}
        onSwitchAccount={handleSwitchAccount}
        onOpenAddAccount={handleOpenAddAccount}
        onSelectTab={navigateTo}
        theme={theme}
        toggleTheme={toggleTheme}
        dailyBudget={dailyBudget}
        currency={currency}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onExportCSV={handleExportCSV}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
      />

      {/* Formulir Catat / Ubah Pengeluaran */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        defaultDate={selectedDate}
        currency={currency}
        categories={categories}
        onOpenCategoryModal={() => {
          setIsExpenseModalOpen(false);
          handleOpenCategories();
        }}
      />

      {/* Modal Pengaturan Batas Limit Harian */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        dailyBudget={dailyBudget}
        onUpdateDailyBudget={handleUpdateDailyBudget}
        currency={currency}
        currentUser={currentUser}
      />

      {/* Modal Autentikasi / Akun Login */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setIsAuthRegisterMode(false);
          setIsLinkingAccount(false);
        }}
        onLogin={handleLogin}
        currentUser={currentUser}
        initialRegisterMode={isAuthRegisterMode}
        isLinkingAccount={isLinkingAccount}
      />

      {/* Modal Ekspor Data Excel dengan Pilihan Rentang Waktu */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        expenses={expenses}
        categories={categories}
        currency={currency}
        onExportSuccess={handleExportSuccess}
      />

      {/* Modal Konfirmasi Lepas Tautan Akun dengan Tampilan UI Kustom */}
      <UnlinkAccountModal
        isOpen={Boolean(accountToUnlink)}
        account={accountToUnlink}
        onClose={() => setAccountToUnlink(null)}
        onConfirm={handleConfirmUnlink}
      />

      {/* Notifikasi Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Peringatan & Pengaturan Cookie (Standar GDPR) */}
      <CookieConsentBanner
        forceOpen={isCookieBannerOpen}
        onClose={() => setIsCookieBannerOpen(false)}
      />

      {/* Mobile PWA Install Guide Modal (Khusus Mobile) */}
      <InstallPromptModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      />
    </>
  );
}

export default App;
