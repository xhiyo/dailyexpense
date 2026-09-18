/**
 * SpendWise Cookie Utilities
 * Provides secure and cross-browser cookie manipulation for session persistence and GDPR-friendly consent.
 */

export const AUTH_COOKIE_NAME = 'spendwise_session';
export const CONSENT_COOKIE_NAME = 'spendwise_cookie_consent';

/**
 * Set a cookie with standard security attributes
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value (will be URI encoded)
 * @param {number|object} optionsOrDays - Number of days or options object { days, path, sameSite, secure }
 */
export const setCookie = (name, value, optionsOrDays = 30) => {
  if (typeof document === 'undefined') return;

  let days = 30;
  let path = '/';
  let sameSite = 'Lax';
  let secure = window.location.protocol === 'https:';

  if (typeof optionsOrDays === 'number') {
    days = optionsOrDays;
  } else if (typeof optionsOrDays === 'object' && optionsOrDays !== null) {
    if (typeof optionsOrDays.days === 'number') days = optionsOrDays.days;
    if (optionsOrDays.path) path = optionsOrDays.path;
    if (optionsOrDays.sameSite) sameSite = optionsOrDays.sameSite;
    if (typeof optionsOrDays.secure === 'boolean') secure = optionsOrDays.secure;
  }

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}`;

  if (days > 0) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  if (secure) {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
};

/**
 * Read a cookie by name
 * @param {string} name - Name of the cookie
 * @returns {string|null} - Decoded cookie string or null if not found
 */
export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;

  const target = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i].trim();
    if (c.indexOf(target) === 0) {
      try {
        return decodeURIComponent(c.substring(target.length));
      } catch (err) {
        return c.substring(target.length);
      }
    }
  }

  return null;
};

/**
 * Delete a cookie by expiring it
 * @param {string} name - Name of the cookie
 * @param {string} path - Cookie path (default: '/')
 */
export const deleteCookie = (name, path = '/') => {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

/**
 * Store user session in cookie
 * @param {object} user - User object
 * @param {boolean} rememberMe - Whether to persist across browser restarts (30 days vs session)
 */
export const setAuthCookie = (user, rememberMe = true) => {
  if (!user) {
    removeAuthCookie();
    return;
  }

  try {
    const payload = JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role || 'Personal Account',
      savedAt: Date.now()
    });

    // If rememberMe is true, store for 30 days. Otherwise, 1 day.
    const days = rememberMe ? 30 : 1;
    setCookie(AUTH_COOKIE_NAME, payload, { days, path: '/', sameSite: 'Lax' });
  } catch (err) {
    console.error('Failed to set auth cookie:', err);
  }
};

/**
 * Retrieve user session from cookie
 * @returns {object|null} - User object or null
 */
export const getAuthCookie = () => {
  try {
    const raw = getCookie(AUTH_COOKIE_NAME);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.email) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse auth cookie:', err);
  }
  return null;
};

/**
 * Remove user session cookie
 */
export const removeAuthCookie = () => {
  deleteCookie(AUTH_COOKIE_NAME, '/');
};

/**
 * Default consent settings
 */
export const DEFAULT_COOKIE_CONSENT = {
  necessary: true, // Always required for login & session security
  preferences: true, // Currency, accent color & theme
  analytics: true, // App usage metrics & performance
  status: 'pending', // 'accepted' | 'customized' | 'rejected_non_essential' | 'pending'
  updatedAt: null
};

/**
 * Get cookie consent settings
 * @returns {object}
 */
export const getCookieConsent = () => {
  try {
    const raw = getCookie(CONSENT_COOKIE_NAME);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_COOKIE_CONSENT,
        ...parsed
      };
    }
  } catch (err) {
    console.error('Failed to read cookie consent:', err);
  }
  return { ...DEFAULT_COOKIE_CONSENT };
};

/**
 * Check if the user has already answered cookie consent
 * @returns {boolean}
 */
export const hasAnsweredCookieConsent = () => {
  const consent = getCookieConsent();
  return consent.status !== 'pending';
};

/**
 * Save cookie consent choices
 * Stored for 365 days
 * @param {object} settings
 */
export const setCookieConsent = (settings = {}) => {
  try {
    const payload = {
      necessary: true,
      preferences: settings.preferences !== false,
      analytics: settings.analytics !== false,
      status: settings.status || 'accepted',
      updatedAt: new Date().toISOString()
    };
    setCookie(CONSENT_COOKIE_NAME, JSON.stringify(payload), { days: 365, path: '/', sameSite: 'Lax' });
    return payload;
  } catch (err) {
    console.error('Failed to save cookie consent:', err);
    return DEFAULT_COOKIE_CONSENT;
  }
};

/**
 * Get all cookies as key-value pairs for debugging/display
 * @returns {Array<{ name: string, value: string }>}
 */
export const getAllCookiesList = () => {
  if (typeof document === 'undefined') return [];
  const raw = document.cookie;
  if (!raw) return [];
  return raw
    .split(';')
    .map((item) => {
      const parts = item.trim().split('=');
      const name = parts[0] ? decodeURIComponent(parts[0]) : '';
      const value = parts.slice(1).join('=') ? decodeURIComponent(parts.slice(1).join('=')) : '';
      return { name, value };
    })
    .filter((c) => c.name.length > 0);
};

/**
 * Delete all SpendWise-related cookies
 */
export const clearAllSpendWiseCookies = () => {
  deleteCookie(AUTH_COOKIE_NAME, '/');
  deleteCookie(CONSENT_COOKIE_NAME, '/');
};
