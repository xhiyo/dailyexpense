import React, { useState, useEffect, useRef } from 'react';
import {
  LogIn,
  UserPlus,
  X,
  Loader2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import {
  isFirebaseConfigured,
  loginWithEmail,
  registerWithEmail,
  loginWithDemoUser,
  GOOGLE_CLIENT_ID,
  signInWithGoogleCredential
} from '../utils/firebase';
import { SpendWiseLogo } from './SpendWiseLogo';
import { useTranslation } from '../i18n/LanguageContext';

export const AuthModal = ({
  isOpen,
  onClose,
  onLogin,
  initialRegisterMode = false,
  isLinkingAccount = false
}) => {
  const { t, language } = useTranslation();
  const [isRegisterMode, setIsRegisterMode] = useState(initialRegisterMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const googleBtnRef = useRef(null);

  const handleGoogleResponse = async (response) => {
    if (!response.credential) return;
    setLoading(true);
    setLoadingMessage(language === 'en' ? 'Connecting to Google Account...' : 'Menghubungkan ke Akun Google...');
    setError('');
    try {
      const user = await signInWithGoogleCredential(response.credential);
      onLogin(user, true);
      onClose();
    } catch (err) {
      setError(err.message || (language === 'en' ? 'Google sign in failed.' : 'Login dengan Google gagal.'));
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsRegisterMode(initialRegisterMode);
      setError('');
      setFieldErrors({ name: '', email: '', password: '' });
    }
  }, [isOpen, initialRegisterMode]);

  // Render Google Identity Button
  useEffect(() => {
    if (!isOpen) return;

    let checkInterval = null;

    const initGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          const containerWidth = googleBtnRef.current.offsetWidth || 360;
          const btnWidth = Math.max(260, Math.min(384, containerWidth));

          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: btnWidth,
            text: isRegisterMode ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });
        } catch (err) {
          console.warn('Google Identity initialization error:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGoogle();
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isOpen, isRegisterMode]);

  if (!isOpen) return null;

  const validateEmail = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      return language === 'en' ? 'Email address is required.' : 'Mohon masukkan alamat email.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return language === 'en'
        ? 'Please enter a valid email address (e.g. user@gmail.com).'
        : 'Format email tidak valid (contoh: user@gmail.com).';
    }
    return '';
  };

  const validatePassword = (val) => {
    if (!val) {
      return language === 'en' ? 'Password is required.' : 'Mohon masukkan kata sandi.';
    }
    if (val.length < 6) {
      return language === 'en'
        ? 'Password must be at least 6 characters.'
        : 'Kata sandi minimal 6 karakter.';
    }
    return '';
  };

  const validateName = (val) => {
    if (!val.trim()) {
      return language === 'en' ? 'Full name is required.' : 'Mohon masukkan nama lengkap Anda.';
    }
    return '';
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
    if (error) setError('');
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const nameErr = isRegisterMode ? validateName(name) : '';

    if (emailErr || passwordErr || nameErr) {
      setFieldErrors({
        email: emailErr,
        password: passwordErr,
        name: nameErr
      });
      setError(language === 'en' ? 'Please check the highlighted fields below.' : 'Mohon periksa data yang belum sesuai di bawah ini.');
      return;
    }

    setFieldErrors({ name: '', email: '', password: '' });
    setLoading(true);
    setLoadingMessage(
      isRegisterMode
        ? (language === 'en' ? 'Creating your account...' : 'Membuat akun Anda...')
        : (language === 'en' ? 'Signing in...' : 'Masuk ke akun...')
    );

    try {
      if (isRegisterMode) {
        const user = await registerWithEmail(email.trim(), password, name.trim());
        onLogin(user, true);
        onClose();
      } else {
        const user = await loginWithEmail(email.trim(), password);
        onLogin(user, true);
        onClose();
      }
    } catch (err) {
      const msg = err.message || (language === 'en' ? 'Authentication failed. Please try again.' : 'Autentikasi gagal. Silakan coba lagi.');
      setError(msg);
      if (msg.toLowerCase().includes('sandi') || msg.toLowerCase().includes('password')) {
        setFieldErrors(prev => ({ ...prev, password: msg }));
      } else if (msg.toLowerCase().includes('email')) {
        setFieldErrors(prev => ({ ...prev, email: msg }));
      }
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCustomGoogleClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError(language === 'en' ? 'Google service is loading, please try again in a moment.' : 'Layanan Google sedang dimuat, silakan coba sesaat lagi.');
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="auth-close-btn"
          onClick={onClose}
          aria-label={t('common.close')}
          title={t('common.close')}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-brand-logo">
            <SpendWiseLogo size={46} />
          </div>
          <h2 className="auth-title">
            {isLinkingAccount
              ? (language === 'en' ? 'Link Account' : 'Tautkan Akun')
              : isRegisterMode
                ? t('auth.registerTitle')
                : t('auth.signInTitle')}
          </h2>
          <p className="auth-subtitle">
            {isLinkingAccount
              ? (language === 'en' ? 'Link another account to your device (maximum 3 accounts)' : 'Tautkan akun lain pada perangkat Anda (maksimal 3 akun)')
              : isRegisterMode
                ? t('auth.registerSubtitle')
                : t('auth.signInSubtitle')}
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="auth-segmented-tabs">
          <button
            type="button"
            className={`auth-segmented-tab-btn ${!isRegisterMode ? 'is-active' : ''}`}
            onClick={() => {
              setIsRegisterMode(false);
              setError('');
              setFieldErrors({ name: '', email: '', password: '' });
            }}
          >
            <LogIn size={15} />
            <span>{t('auth.signInBtn')}</span>
          </button>
          <button
            type="button"
            className={`auth-segmented-tab-btn ${isRegisterMode ? 'is-active' : ''}`}
            onClick={() => {
              setIsRegisterMode(true);
              setError('');
              setFieldErrors({ name: '', email: '', password: '' });
            }}
          >
            <UserPlus size={15} />
            <span>{t('auth.registerBtn')}</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={16} className="auth-error-icon" />
            <div className="auth-error-body">
              <span>{error}</span>
              {error.toLowerCase().includes('daftar') && !isRegisterMode && (
                <button
                  type="button"
                  className="auth-error-action-btn"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setError('');
                    setFieldErrors({ name: '', email: '', password: '' });
                  }}
                >
                  {language === 'en' ? '👉 Click here to Sign Up' : '👉 Klik di sini untuk Daftar Akun Baru'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {isRegisterMode && (
            <div className="auth-field-group">
              <label className="auth-field-label">{t('auth.nameLabel')}</label>
              <div className={`auth-input-wrapper ${fieldErrors.name ? 'has-error' : ''}`}>
                <User size={16} className="auth-input-icon" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder={t('auth.namePlaceholder')}
                  value={name}
                  onChange={handleNameChange}
                  autoComplete="name"
                />
              </div>
              {fieldErrors.name && (
                <span className="auth-field-error">
                  <AlertCircle size={13} /> {fieldErrors.name}
                </span>
              )}
            </div>
          )}

          <div className="auth-field-group">
            <label className="auth-field-label">{t('auth.emailLabel')}</label>
            <div className={`auth-input-wrapper ${fieldErrors.email ? 'has-error' : ''}`}>
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={handleEmailChange}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && (
              <span className="auth-field-error">
                <AlertCircle size={13} /> {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="auth-field-group">
            <label className="auth-field-label">{t('auth.passwordLabel')}</label>
            <div className={`auth-input-wrapper ${fieldErrors.password ? 'has-error' : ''}`}>
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={handlePasswordChange}
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="auth-field-error">
                <AlertCircle size={13} /> {fieldErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{loadingMessage || (isFirebaseConfigured ? 'Connecting...' : 'Processing...')}</span>
              </>
            ) : (
              <span>{isRegisterMode ? t('auth.registerBtn') : t('auth.signInBtn')}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>{language === 'en' ? 'or continue with' : 'atau lanjutkan dengan'}</span>
        </div>

        {/* Google One-Click Sign In */}
        <div className="google-auth-section">
          <div ref={googleBtnRef} className="google-btn-wrapper">
            <button
              type="button"
              className="google-custom-btn"
              onClick={handleCustomGoogleClick}
              disabled={loading}
            >
              <svg className="google-icon-svg" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{t('auth.googleBtn')}</span>
            </button>
          </div>
        </div>

        {/* Footer switch prompt */}
        <div className="auth-footer-prompt">
          {isRegisterMode ? (
            <span>
              {t('auth.hasAccountText')}{' '}
              <button
                type="button"
                className="auth-footer-switch-btn"
                onClick={() => {
                  setIsRegisterMode(false);
                  setError('');
                  setFieldErrors({ name: '', email: '', password: '' });
                }}
              >
                {t('auth.signInLink')}
              </button>
            </span>
          ) : (
            <span>
              {t('auth.noAccountText')}{' '}
              <button
                type="button"
                className="auth-footer-switch-btn"
                onClick={() => {
                  setIsRegisterMode(true);
                  setError('');
                  setFieldErrors({ name: '', email: '', password: '' });
                }}
              >
                {t('auth.signUpLink')}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
