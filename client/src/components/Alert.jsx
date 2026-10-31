import React from 'react';

export default function Alert({
  type = 'info', // 'success' | 'warning' | 'danger' | 'info'
  title,
  children,
  onClose,
  className = ''
}) {
  const alertTypeClass = `alert-${type === 'error' ? 'danger' : type}`;

  return (
    <div className={`alert ${alertTypeClass} ${className}`.trim()} role="alert">
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          aria-label="Close alert"
        >
          &times;
        </button>
      )}
    </div>
  );
}

