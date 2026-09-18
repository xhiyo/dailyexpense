/**
 * SpendWise Mobile PWA Utility
 * Manages native install prompts and detects standalone / mobile mode.
 */

let deferredInstallPrompt = null;
const listeners = new Set();

export const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const isMobileWidth = window.innerWidth <= 768;
  return isMobileUA || isMobileWidth;
};

// Initialize listener for Android Chrome / Chromium beforeinstallprompt
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Only capture on mobile devices
    if (isMobileDevice()) {
      e.preventDefault();
      deferredInstallPrompt = e;
      listeners.forEach((fn) => fn(true));
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    listeners.forEach((fn) => fn(false));
  });
}

export const subscribeInstallAvailability = (callback) => {
  listeners.add(callback);
  callback(Boolean(deferredInstallPrompt));
  return () => listeners.delete(callback);
};

export const triggerInstallPrompt = async () => {
  if (isStandalone()) {
    return { outcome: 'already_installed' };
  }

  if (deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      listeners.forEach((fn) => fn(false));
      return { outcome: choiceResult.outcome }; // 'accepted' | 'dismissed'
    } catch (err) {
      console.warn('Error invoking install prompt:', err);
      return { outcome: 'manual_required' };
    }
  }

  return { outcome: 'manual_required' };
};
