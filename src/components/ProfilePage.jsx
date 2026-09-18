import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  Trash2,
  Check,
  ArrowLeft,
  FileSpreadsheet,
  LogOut,
  Calendar,
  Lock,
  Edit2,
  User,
  LogIn,
  Sparkles,
  UserPlus,
  Plus
} from 'lucide-react';
import { formatCurrency } from '../utils/storage';
import { UserAvatar } from './UserAvatar';
import { loginWithDemoUser, syncUserProfileToFirestore } from '../utils/firebase';
import { useTranslation } from '../i18n/LanguageContext';

const GoogleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

export const ProfilePage = ({
  currentUser,
  onUpdateProfile,
  onLogin,
  expenses = [],
  currency = 'Rp',
  onExportCSV,
  onLogout,
  onOpenAuthModal,
  onBackToDashboard,
  linkedAccounts = [],
  onSwitchAccount,
  onOpenAddAccount,
  onRemoveLinkedAccount,
  onOpenCookieSettings
}) => {
  const { t, language } = useTranslation();
  const isMaxAccounts = Boolean(linkedAccounts && linkedAccounts.length >= 3);
  const isGoogleUser = Boolean(
    currentUser && (
      currentUser.provider === 'google' ||
      currentUser.role === 'Google Account' ||
      String(currentUser.id || '').startsWith('google-') ||
      (typeof currentUser.avatar === 'string' && currentUser.avatar.includes('googleusercontent.com'))
    )
  );

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  // Sync state if currentUser changes from outside and keep Firestore synced
  React.useEffect(() => {
    setName(currentUser?.name || '');
    setEmail(currentUser?.email || '');
    setAvatar(currentUser?.avatar || '');
    if (currentUser?.id) {
      syncUserProfileToFirestore(currentUser);
    }
  }, [currentUser]);

  // Financial statistics
  const stats = useMemo(() => {
    const userExpenses = expenses || [];
    const totalSpent = userExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const txCount = userExpenses.length;
    const avgPerTx = txCount > 0 ? Math.round(totalSpent / txCount) : 0;

    // Date range
    let firstDate = '-';
    let lastDate = '-';
    if (txCount > 0) {
      const sortedDates = [...userExpenses].map(e => e.date).filter(Boolean).sort();
      if (sortedDates.length > 0) {
        firstDate = sortedDates[0];
        lastDate = sortedDates[sortedDates.length - 1];
      }
    }

    return { totalSpent, txCount, avgPerTx, firstDate, lastDate };
  }, [expenses]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(language === 'en' ? 'Please upload a valid image file' : 'Mohon unggah berkas gambar yang valid');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert(language === 'en' ? 'Maximum photo file size is 2MB' : 'Ukuran berkas foto maksimal 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatar('');
  };

  const handleCancelEdit = () => {
    setName(currentUser?.name || '');
    setAvatar(currentUser?.avatar || '');
    setIsEditing(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isGoogleUser || !currentUser) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const updated = {
      ...currentUser,
      name: trimmedName,
      avatar: avatar
    };

    onUpdateProfile(updated);
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="tab-profile-view">
      {/* Page Header */}
      <div className="page-header-banner">
        <div>
          <h2 className="page-heading">{t('profile.pageTitle')}</h2>
          <p className="page-subheading">{t('profile.pageSubtitle')}</p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={onBackToDashboard}
        >
          <ArrowLeft size={16} />
          <span>{t('common.back')}</span>
        </button>
      </div>

      {/* Main Profile Grid */}
      <div className="profile-grid">
        {/* Card 1: Identitas Profil */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div>
              <h4 className="profile-card-title">{t('profile.personalInfoTitle')}</h4>
              <p className="profile-card-desc">
                {isGoogleUser
                  ? (language === 'en' ? 'Account identity is linked with your Google profile' : 'Identitas akun disinkronkan langsung dari profil Google Anda')
                  : isEditing
                    ? (language === 'en' ? 'Edit display name or avatar' : 'Ubah nama tampilan atau foto profil akun Anda')
                    : t('profile.personalInfoDesc')}
              </p>
            </div>
            {saveSuccess && (
              <span className="profile-save-success">
                <Check size={14} /> {t('common.success')}
              </span>
            )}
          </div>

          {!isEditing ? (
            <div className="profile-card-body">
              <div className="profile-identity-display-box">
                <UserAvatar user={currentUser} size={64} />
                <div className="profile-identity-text">
                  <div className="profile-identity-name-row">
                    <h3 className="profile-display-fullname">{currentUser.name}</h3>
                    {isGoogleUser && (
                      <span className="profile-google-verified-badge" title="Google Account">
                        <GoogleIcon size={14} />
                        <span>Google</span>
                      </span>
                    )}
                  </div>
                  <span className="profile-display-email font-mono">{currentUser.email}</span>
                </div>
              </div>

              {/* Tanda plus bersih di tengah akun (sesuai permintaan user) */}
              <div className="profile-center-add-wrap">
                <button
                  type="button"
                  id="profile-center-plus-btn"
                  className={`profile-center-plus-btn ${isMaxAccounts ? 'is-maxed' : ''}`}
                  onClick={() => {
                    if (onOpenAddAccount) onOpenAddAccount();
                    else onOpenAuthModal();
                  }}
                  title={
                    isMaxAccounts
                      ? (language === 'en' ? 'Maximum 3 accounts linked' : 'Maksimal 3 akun tercapai')
                      : t('profile.addAccountBtn')
                  }
                  aria-label={t('profile.addAccountBtn')}
                >
                  <Plus size={16} />
                </button>
              </div>

              {isGoogleUser ? (
                <div className="profile-google-managed-callout">
                  <div className="profile-google-callout-body">
                    <strong className="profile-google-callout-title">
                      {language === 'en' ? 'Identity Managed by Google' : 'Identitas Dikelola oleh Google'}
                    </strong>
                    <p className="profile-google-callout-desc">
                      {language === 'en'
                        ? 'Profile name and photo are connected to your Google Account.'
                        : 'Nama dan foto profil terikat dengan Akun Google Anda dan tidak dapat diedit langsung di aplikasi ini.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="profile-card-footer-actions">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 size={14} />
                    <span>{t('profile.editProfileBtn')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="profile-card-body">
              {/* Avatar Row */}
              <div className="profile-avatar-row">
                <UserAvatar
                  user={{ name: name || currentUser?.name, email, avatar }}
                  size={64}
                />
                <div className="profile-avatar-controls">
                  <span className="profile-avatar-label">
                    {language === 'en' ? 'Profile Picture' : 'Foto Profil'}
                  </span>
                  <div className="profile-avatar-btn-group">
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={14} />
                      <span>{language === 'en' ? 'Upload Photo' : 'Unggah Foto'}</span>
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        className="btn-secondary btn-sm text-danger"
                        onClick={handleRemovePhoto}
                      >
                        <Trash2 size={14} />
                        <span>{t('common.delete')}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Profile Form */}
              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-name">{t('profile.nameLabel')}</label>
                  <input
                    id="profile-name"
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label" htmlFor="profile-email">{t('profile.emailLabel')}</label>
                    <span className="profile-locked-pill" title={t('profile.emailLockedHint')}>
                      <Lock size={11} />
                      <span>{t('common.permanent')}</span>
                    </span>
                  </div>
                  <input
                    id="profile-email"
                    type="email"
                    className="form-input input-locked"
                    value={email}
                    readOnly
                    disabled
                  />
                  <span className="profile-field-subhint">
                    {t('profile.emailLockedHint')}
                  </span>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancelEdit}
                  >
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="btn-primary">
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Card 2: Informasi Akun & Sistem */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div>
              <h4 className="profile-card-title">{t('profile.personalInfoTitle')} & System</h4>
              <p className="profile-card-desc">Membership status, security, and version</p>
            </div>
          </div>

          <div className="profile-info-list">
            <div className="profile-info-item">
              <span className="profile-info-label">{t('profile.membershipType')}</span>
              <span className="profile-info-val">
                {isGoogleUser ? (
                  <span className="profile-google-badge-val">
                    <GoogleIcon size={14} />
                    <span>Google Account</span>
                  </span>
                ) : (
                  currentUser?.role || 'Personal'
                )}
              </span>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">{t('profile.dataSecurity')}</span>
              <span className="profile-info-val" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                <Lock size={13} />
                <span>{t('profile.securityVal')}</span>
              </span>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">{t('profile.activeCurrency')}</span>
              <span className="profile-info-val font-mono">
                {currency === 'Rp' ? 'IDR (Rp - Rupiah)' : currency}
              </span>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">{t('profile.appVersion')}</span>
              <span className="profile-info-val">
                <span>Version 1.0</span>
              </span>
            </div>
          </div>

          <div className="profile-session-actions">
            <div className="profile-session-btn-row">
              <button
                type="button"
                className="btn-danger-outline"
                onClick={onLogout}
              >
                <LogOut size={14} />
                <span>{t('profile.logOutBtn')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card: Manajemen Akun Ditautkan (Multi-Account Switcher) */}
        <div className="profile-card profile-linked-accounts-card">
          <div className="profile-card-header">
            <div>
              <div className="profile-linked-title-row">
                <h4 className="profile-card-title">{t('profile.linkedAccountsTitle')}</h4>
                <span className="profile-linked-count-badge font-mono">
                  {linkedAccounts.length}/3
                </span>
              </div>
              <p className="profile-card-desc">{t('profile.linkedAccountsDesc')}</p>
            </div>
            {!isMaxAccounts ? (
              <button
                type="button"
                className="profile-top-right-add-btn"
                onClick={() => {
                  if (onOpenAddAccount) onOpenAddAccount();
                  else onOpenAuthModal();
                }}
              >
                <Plus size={15} />
                <span>{t('profile.addAccountBtn')}</span>
              </button>
            ) : (
              <span className="profile-max-reached-badge">
                {language === 'en' ? 'Max 3 Accounts' : 'Maks. 3 Akun'}
              </span>
            )}
          </div>

          <div className="profile-linked-list">
            {linkedAccounts.length > 0 ? (
              linkedAccounts.map(account => {
                const isActive = account.id === currentUser.id;
                return (
                  <div
                    key={account.id}
                    className={`profile-linked-item ${isActive ? 'is-active' : 'is-clickable'}`}
                    onClick={() => {
                      if (!isActive && onSwitchAccount) {
                        onSwitchAccount(account);
                      }
                    }}
                    title={isActive ? t('profile.activeBadge') : `${account.name} (${account.email})`}
                  >
                    <div className="profile-linked-item-left">
                      <UserAvatar user={account} size={36} />
                      <div className="profile-linked-item-info">
                        <div className="profile-linked-item-name-row">
                          <strong className="profile-linked-name">{account.name}</strong>
                          {isActive && (
                            <span className="profile-active-pill">
                              <Check size={11} /> {t('profile.activeBadge')}
                            </span>
                          )}
                        </div>
                        <span className="profile-linked-email font-mono">{account.email}</span>
                      </div>
                    </div>

                    <div className="profile-linked-item-actions">
                      {isActive ? (
                        <button
                          type="button"
                          className="btn-danger-outline btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLogout();
                          }}
                          title={t('profile.logOutBtn')}
                        >
                          <LogOut size={13} />
                          <span>{t('profile.logOutBtn')}</span>
                        </button>
                      ) : (
                        onRemoveLinkedAccount && (
                          <button
                            type="button"
                            className="profile-unlink-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveLinkedAccount(account);
                            }}
                            title={t('profile.unlinkAccount')}
                            aria-label={t('profile.unlinkAccount')}
                          >
                            <span>{t('profile.unlinkAccount')}</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="profile-linked-item is-active">
                <div className="profile-linked-item-left">
                  <UserAvatar user={currentUser} size={36} />
                  <div className="profile-linked-item-info">
                    <strong className="profile-linked-name">{currentUser.name}</strong>
                    <span className="profile-linked-email font-mono">{currentUser.email}</span>
                  </div>
                </div>
                <span className="profile-active-pill">
                  <Check size={11} /> {t('profile.activeBadge')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Ringkasan Aktivitas Finansial Akun */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div>
              <h4 className="profile-card-title">{t('profile.activityTitle')}</h4>
              <p className="profile-card-desc">{t('profile.activityDesc')}</p>
            </div>
          </div>

          <div className="profile-metrics-row">
            <div className="profile-metric-tile">
              <span className="profile-metric-title">{t('profile.totalSpent')}</span>
              <strong className="profile-metric-number font-mono">
                {formatCurrency(stats.totalSpent, currency)}
              </strong>
            </div>

            <div className="profile-metric-tile">
              <span className="profile-metric-title">{t('profile.txCount')}</span>
              <strong className="profile-metric-number font-mono">
                {stats.txCount} {t('common.transactions')}
              </strong>
            </div>

            <div className="profile-metric-tile">
              <span className="profile-metric-title">{t('profile.avgPerTx')}</span>
              <strong className="profile-metric-number font-mono">
                {formatCurrency(stats.avgPerTx, currency)}
              </strong>
            </div>
          </div>

          <div className="profile-date-range-info">
            <Calendar size={14} />
            <span>
              {t('profile.dateRange', { from: stats.firstDate, to: stats.lastDate })}
            </span>
          </div>
        </div>

        {/* Card 4: Ekspor Laporan Excel */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div>
              <h4 className="profile-card-title">{t('profile.exportCardTitle')}</h4>
              <p className="profile-card-desc">{t('profile.exportCardDesc')}</p>
            </div>
          </div>

          <p className="profile-card-body-text">
            {t('profile.exportCardBody')}
          </p>

          <div className="profile-export-btn-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={onExportCSV}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <FileSpreadsheet size={16} />
              <span>{t('profile.downloadExcelBtn')}</span>
            </button>
            {onOpenCookieSettings && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onOpenCookieSettings}
              >
                <span>{language === 'en' ? 'Cookie Notice' : 'Peringatan Cookie'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
