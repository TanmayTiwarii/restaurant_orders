import React from 'react';

export default function Badge({ children, variant = 'primary', className = '' }) {
  return (
    <span className={`badge ${variant.startsWith('badge-') ? variant : `badge-${variant}`} ${className}`}>
      {children}
    </span>
  );
}
