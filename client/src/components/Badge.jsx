import React from 'react';

export default function Badge({
  status,
  text,
  variant, // optional override: 'active' | 'pending' | 'danger' | 'draft' | 'info'
  className = ''
}) {
  const displayStatus = (status || text || '').toString().toUpperCase();
  const inferredVariant = (variant || status || text || 'secondary')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '_');

  return (
    <span className={`badge badge-${inferredVariant} ${className}`.trim()}>
      {text || displayStatus.replace(/_/g, ' ')}
    </span>
  );
}
