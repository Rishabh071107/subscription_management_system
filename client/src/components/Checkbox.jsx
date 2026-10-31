import React from 'react';

export default function Checkbox({
  label,
  id,
  name,
  checked,
  onChange,
  disabled = false,
  error,
  className = '',
  ...props
}) {
  const checkboxId = id || name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`form-group ${className}`} style={{ marginBottom: 'var(--spacing-3)' }}>
      <label className="checkbox-label" htmlFor={checkboxId}>
        <input
          type="checkbox"
          id={checkboxId}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="checkbox-input"
          {...props}
        />
        <span>{label}</span>
      </label>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

