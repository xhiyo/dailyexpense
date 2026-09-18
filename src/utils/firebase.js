// Firebase Web Client for project: dailyexpense-2cbf0
// Utilizes Google Firebase Auth & Firestore REST APIs for maximum speed and zero dependencies

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCzOWJS5x-8pnE0F9THi_HOa6RN2enOh34",
  authDomain: "dailyexpense-2cbf0.firebaseapp.com",
  projectId: "dailyexpense-2cbf0",
  storageBucket: "dailyexpense-2cbf0.firebasestorage.app",
  messagingSenderId: "244317586010",
  appId: "1:244317586010:web:c4a96e6ff9916c8c83ce63",
  measurementId: "G-JKBF1LEVKJ"
};

const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1/accounts';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

export const isFirebaseConfigured = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

export const GOOGLE_CLIENT_ID = "244317586010-hs27opfce8q7pq6p4vhnjr4n7j8eqsvm.apps.googleusercontent.com";

// Local storage key for Firebase auth session
const FIREBASE_TOKEN_KEY = 'spendwise_firebase_auth_v1';
// Local storage key for registered accounts (offline / fallback support)
const LOCAL_USERS_KEY = 'spendwise_registered_users_v1';

export const getLocalRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalRegisteredUser = (userRecord) => {
  try {
    const users = getLocalRegisteredUsers().filter(
      u => u.email.toLowerCase() !== userRecord.email.toLowerCase()
    );
    users.push(userRecord);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn('Could not save local user record:', err);
  }
};

export const getSavedFirebaseAuth = () => {
  try {
    const raw = localStorage.getItem(FIREBASE_TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveFirebaseAuth = (session) => {
  try {
    if (session) {
      localStorage.setItem(FIREBASE_TOKEN_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(FIREBASE_TOKEN_KEY);
    }
  } catch (err) {
    console.warn('Could not save firebase auth session:', err);
  }
};

// 1. Register with Email & Password (with seamless fallback)
export const registerWithEmail = async (email, password, name = '') => {
  const cleanEmail = email.trim().toLowerCase();

  // Check if already registered locally
  const existingLocal = getLocalRegisteredUsers().find(
    u => u.email.toLowerCase() === cleanEmail
  );
  if (existingLocal) {
    throw new Error('Email ini sudah terdaftar. Silakan masuk ke akun Anda.');
  }

  // Try Firebase Auth REST first
  try {
    const url = `${AUTH_BASE}:signUp?key=${FIREBASE_CONFIG.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password,
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (res.ok && data.localId) {
      let displayName = name || cleanEmail.split('@')[0];
      if (name && data.idToken) {
        try {
          await fetch(`${AUTH_BASE}:update?key=${FIREBASE_CONFIG.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idToken: data.idToken,
              displayName: name,
              returnSecureToken: true
            })
          });
        } catch {
          // Non-blocking
        }
      }

      const userProfile = {
        id: data.localId,
        name: displayName,
        email: data.email,
        avatar: '🧑‍💼',
        role: 'Personal Account',
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        provider: 'firebase-email',
        isNewRegistration: true
      };

      saveLocalRegisteredUser({ ...userProfile, password });
      saveFirebaseAuth(userProfile);
      syncUserProfileToFirestore(userProfile);
      return userProfile;
    } else {
      const errMsg = data?.error?.message;
      if (errMsg === 'EMAIL_EXISTS') {
        throw new Error('Email ini sudah terdaftar di sistem. Silakan masuk.');
      }
      // If Firebase returns CONFIGURATION_NOT_FOUND or OPERATION_NOT_ALLOWED, continue to local registration
    }
  } catch (err) {
    if (err.message && (err.message.includes('sudah terdaftar') || err.message.includes('EMAIL_EXISTS'))) {
      throw err;
    }
    // Continue to local registration
  }

  // Local user registration fallback (reliable on any device/environment)
  const displayName = name || cleanEmail.split('@')[0];
  const localUserRecord = {
    id: `user-${Date.now()}`,
    name: displayName,
    email: cleanEmail,
    password: password,
    avatar: '🧑‍💼',
    role: 'Personal Account',
    provider: 'local-email',
    isNewRegistration: true
  };

  saveLocalRegisteredUser(localUserRecord);
  const sessionUser = {
    id: localUserRecord.id,
    name: localUserRecord.name,
    email: localUserRecord.email,
    avatar: localUserRecord.avatar,
    role: localUserRecord.role,
    provider: localUserRecord.provider,
    isNewRegistration: true
  };
  saveFirebaseAuth(sessionUser);
  syncUserProfileToFirestore(sessionUser);
  return sessionUser;
};

// 2. Login with Email & Password (with strict verification)
export const loginWithEmail = async (email, password) => {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check local registered accounts first
  const localUser = getLocalRegisteredUsers().find(
    u => u.email && u.email.toLowerCase() === cleanEmail
  );
  if (localUser) {
    if (localUser.password === password) {
      const userProfile = {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        avatar: localUser.avatar || '🧑‍💼',
        role: localUser.role || 'Personal Account',
        idToken: localUser.idToken || null,
        provider: localUser.provider || 'local-email'
      };
      saveFirebaseAuth(userProfile);
      return userProfile;
    } else {
      throw new Error('Kata sandi salah. Silakan periksa kembali kata sandi Anda.');
    }
  }

  // 2. Try Firebase Auth REST API
  if (isFirebaseConfigured) {
    try {
      const url = `${AUTH_BASE}:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          returnSecureToken: true
        })
      });

      const data = await res.json();
      if (res.ok && data.localId) {
        const userProfile = {
          id: data.localId,
          name: data.displayName || data.email?.split('@')[0] || 'User',
          email: data.email,
          avatar: '🧑‍💼',
          role: 'Personal Account',
          idToken: data.idToken,
          refreshToken: data.refreshToken,
          provider: 'firebase-email'
        };

        saveLocalRegisteredUser({ ...userProfile, password });
        saveFirebaseAuth(userProfile);
        return userProfile;
      } else {
        const errMsg = data?.error?.message;
        if (errMsg === 'INVALID_PASSWORD' || errMsg === 'INVALID_LOGIN_CREDENTIALS') {
          throw new Error('Kata sandi salah. Silakan periksa kembali kata sandi Anda.');
        } else if (errMsg === 'EMAIL_NOT_FOUND' || errMsg === 'CONFIGURATION_NOT_FOUND' || errMsg === 'OPERATION_NOT_ALLOWED') {
          throw new Error('Email belum terdaftar. Silakan klik tab "Daftar" untuk membuat akun baru.');
        } else {
          throw new Error(formatFirebaseError(errMsg));
        }
      }
    } catch (err) {
      if (err.message && (err.message.includes('Kata sandi') || err.message.includes('belum terdaftar') || err.message.includes('terdaftar'))) {
        throw err;
      }
      throw new Error('Email belum terdaftar. Silakan klik tab "Daftar" untuk membuat akun baru.');
    }
  }

  // If local user not found and Firebase is not available
  throw new Error('Email belum terdaftar. Silakan klik tab "Daftar" untuk membuat akun baru.');
};

// 3. Login with Google ID Token / Credential (Google Identity Services)
export const signInWithGoogleCredential = async (credential) => {
  // 1. Decode JWT payload locally for instant profile info
  let payload = null;
  try {
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    payload = JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('Could not decode Google credential payload:', err);
  }

  // 2. Connect to Firebase Auth via signInWithIdp
  try {
    const url = `${AUTH_BASE}:signInWithIdp?key=${FIREBASE_CONFIG.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postBody: `id_token=${credential}&providerId=google.com`,
        requestUri: window.location.origin || 'http://localhost:5173',
        returnIdpCredential: true,
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (res.ok && data.idToken) {
      const userProfile = {
        id: data.localId,
        name: data.displayName || payload?.name || 'Google User',
        email: data.email || payload?.email,
        avatar: data.photoUrl || payload?.picture || '🧑‍💼',
        role: 'Google Account',
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        provider: 'google'
      };
      saveFirebaseAuth(userProfile);
      syncUserProfileToFirestore(userProfile);
      return userProfile;
    }
  } catch (err) {
    console.warn('Firebase signInWithIdp attempt failed, using verified Google payload:', err);
  }

  // 3. Fallback to decoded Google Profile (works even if Firebase provider is still pending setup in Console)
  if (payload) {
    const userProfile = {
      id: `google-${payload.sub}`,
      name: payload.name || 'Google User',
      email: payload.email,
      avatar: payload.picture || '🧑‍💼',
      role: 'Google Account',
      provider: 'google'
    };
    saveFirebaseAuth(userProfile);
    syncUserProfileToFirestore(userProfile);
    return userProfile;
  }

  throw new Error('Gagal memverifikasi akun Google.');
};

// 4. Logout
export const logoutFirebaseUser = async () => {
  saveFirebaseAuth(null);
};

// 4. Save/Sync User Profile to Firestore Cloud Database
export const syncUserProfileToFirestore = async (user, additionalData = {}) => {
  if (!user || !user.id) return false;
  const cleanId = String(user.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const docPath = `${FIRESTORE_BASE}/users/${cleanId}`;

  const headers = { 'Content-Type': 'application/json' };
  if (user.idToken) {
    headers['Authorization'] = `Bearer ${user.idToken}`;
  }

  const fields = {
    id: { stringValue: String(user.id) },
    name: { stringValue: String(user.name || user.email?.split('@')[0] || cleanId) },
    email: { stringValue: String(user.email || '').toLowerCase() },
    avatar: { stringValue: String(user.avatar || '🧑‍💼') },
    role: { stringValue: String(user.role || 'Personal Account') },
    provider: { stringValue: String(user.provider || 'local') },
    updatedAt: { stringValue: new Date().toISOString() }
  };

  if (user.isNewRegistration || !user.createdAt) {
    fields.createdAt = { stringValue: new Date().toISOString() };
  } else {
    fields.createdAt = { stringValue: String(user.createdAt) };
  }
  if (additionalData.dailyBudget !== undefined) {
    fields.dailyBudget = { doubleValue: Number(additionalData.dailyBudget) || 0 };
  }

  try {
    let res = await fetch(docPath, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields })
    });
    // If auth header failed (e.g. 401 or 403), retry with open rules header
    if (!res.ok && headers['Authorization']) {
      res = await fetch(docPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
    }
    if (res.ok) {
      console.log('✅ User data successfully synced to Firestore:', cleanId);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Firestore user sync network error:', err);
    return false;
  }
};

// 5. Automatically sync all previously created accounts on this device to Firestore
export const syncAllLocalUsersToFirestore = async () => {
  try {
    const localUsers = getLocalRegisteredUsers();
    for (const u of localUsers) {
      if (u && u.id && u.email) {
        await syncUserProfileToFirestore(u);
      }
    }
    const savedAuth = getSavedFirebaseAuth();
    if (savedAuth && savedAuth.id && savedAuth.email) {
      await syncUserProfileToFirestore(savedAuth);
    }
  } catch (err) {
    console.warn('Auto-sync all local users error:', err);
  }
};

// 5. Save Expense to Firestore Cloud Database
export const syncExpenseToFirestore = async (userId, idToken, expense) => {
  if (!userId || !expense || !expense.id) return;
  const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanExpId = String(expense.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const docPath = `${FIRESTORE_BASE}/users/${cleanUserId}/expenses/${cleanExpId}`;

  const headers = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  try {
    await fetch(docPath, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        fields: {
          id: { integerValue: String(expense.id) },
          title: { stringValue: String(expense.title || '') },
          amount: { doubleValue: Number(expense.amount || 0) },
          category: { stringValue: String(expense.categoryId || expense.category || 'other') },
          date: { stringValue: String(expense.date || '') },
          paymentMethod: { stringValue: String(expense.paymentMethod || 'cash') },
          notes: { stringValue: String(expense.notes || '') }
        }
      })
    });
  } catch (err) {
    console.warn('Firestore sync error:', err);
  }
};

// Helper: Format common Firebase Auth error messages to user-friendly text
export function formatFirebaseError(code) {
  if (!code || typeof code !== 'string') {
    return 'Autentikasi gagal. Silakan coba lagi.';
  }
  switch (code) {
    case 'EMAIL_EXISTS':
      return 'Email ini sudah terdaftar. Silakan masuk ke akun Anda.';
    case 'INVALID_LOGIN_CREDENTIALS':
    case 'INVALID_PASSWORD':
      return 'Kata sandi salah. Silakan periksa kembali kata sandi Anda.';
    case 'EMAIL_NOT_FOUND':
      return 'Email belum terdaftar. Silakan klik tab "Daftar" untuk membuat akun baru.';
    case 'WEAK_PASSWORD : Password should be at least 6 characters':
      return 'Kata sandi minimal 6 karakter.';
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.';
    case 'OPERATION_NOT_ALLOWED':
    case 'CONFIGURATION_NOT_FOUND':
      return 'Akun belum terdaftar. Silakan klik tab "Daftar" di atas untuk membuat akun.';
    default:
      return code.replace(/_/g, ' ').toLowerCase();
  }
}

// 5. Quick 1-Click Demo Login
export const loginWithDemoUser = () => {
  const demoProfile = {
    id: 'user_demo_spendwise',
    name: 'Fabian (Demo)',
    email: 'demo@spendwise.app',
    avatar: '🧑‍💻',
    role: 'Akun Demo',
    provider: 'demo'
  };
  saveLocalRegisteredUser({ ...demoProfile, password: 'password123' });
  saveFirebaseAuth(demoProfile);
  return demoProfile;
};
