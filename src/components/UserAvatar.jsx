import React, { useState, useEffect } from 'react';

/**
 * UserAvatar - Premium resilient avatar component
 * Guaranteed 1:1 aspect-ratio, circular clipping, and Google CDN cross-origin support.
 */
export const UserAvatar = ({ user, size = 28, className = '', style = {} }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar]);

  const initial = (
    user?.name?.trim?.()?.charAt(0) ||
    user?.email?.trim?.()?.charAt(0) ||
    'U'
  ).toUpperCase();

  const isUrl = Boolean(
    user?.avatar &&
    typeof user.avatar === 'string' &&
    user.avatar.startsWith('http')
  );

  const hasValidPhoto = isUrl && !imgError;

  return (
    <div
      className={`user-avatar-circle ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
        aspectRatio: '1 / 1',
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--accent-primary, #2563eb)',
        color: '#ffffff',
        fontWeight: 700,
        fontSize: `${Math.max(11, Math.round(size * 0.44))}px`,
        lineHeight: 1,
        flexShrink: 0,
        boxSizing: 'border-box',
        userSelect: 'none',
        position: 'relative',
        ...style
      }}
    >
      {hasValidPhoto ? (
        <img
          src={user.avatar}
          alt=""
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            minWidth: '100%',
            minHeight: '100%',
            objectFit: 'cover',
            display: 'block',
            borderRadius: '50%',
            aspectRatio: '1 / 1',
            flexShrink: 0
          }}
        />
      ) : (
        <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {initial}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
