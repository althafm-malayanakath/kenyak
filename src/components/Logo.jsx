import React from 'react';

export default function Logo({ className = '', style = {}, height = '46px', width = 'auto' }) {
  return (
    <img
      src="/logo.png"
      alt="KENYAK"
      className={`kenyak-brand-logo ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        height: height || '46px',
        width: width || 'auto',
        filter: 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.55)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.7))',
        ...style
      }}
    />
  );
}
