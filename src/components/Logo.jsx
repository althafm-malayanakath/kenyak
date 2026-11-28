import React from 'react';

export default function Logo({ className = '', style = {}, width = '36px', height = 'auto' }) {
  return (
    <img
      src="/logo.png"
      alt="KENYAK"
      width={width}
      height={height}
      className={`kenyak-brand-logo ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        filter: 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.45)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7))',
        ...style
      }}
    />
  );
}
