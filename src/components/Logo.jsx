import React from 'react';

export default function Logo({ className = '', style = {}, height, width }) {
  return (
    <img
      src="/logo.png"
      alt="KENYAK"
      className={`kenyak-brand-logo ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.45)) drop-shadow(0 0 1px rgba(255, 255, 255, 0.6))',
        ...(height ? { height } : {}),
        ...(width ? { width } : {}),
        ...style
      }}
    />
  );
}
