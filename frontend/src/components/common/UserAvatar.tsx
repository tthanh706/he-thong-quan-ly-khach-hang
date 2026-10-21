import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  url?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function UserAvatar({ url, name, size = 32, className = '', style = {} }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [url]);

  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : 'U';

  if (!url || hasError) {
    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: '#7545d9',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: `${Math.max(11, Math.round(size * 0.42))}px`,
          flexShrink: 0,
          userSelect: 'none',
          overflow: 'hidden',
          ...style,
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: '#f4f0ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <img
        src={url}
        alt={name || 'Avatar'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export default UserAvatar;
