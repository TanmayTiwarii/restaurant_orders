import React from 'react';

export default function Input({
  label,
  error,
  type = 'text',
  className = '',
  id,
  helperText,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`form-input ${error ? 'border-danger' : ''} ${className}`}
        style={error ? { borderColor: 'var(--danger)' } : {}}
        {...props}
      />
      {helperText && !error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{helperText}</span>
      )}
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.2rem' }}>
          {error}
        </span>
      )}
    </div>
  );
}
