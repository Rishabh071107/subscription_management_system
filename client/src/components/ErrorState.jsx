import React from 'react';
import Button from './Button.jsx';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry
}) {
  return (
    <div className="state-container">
      <div className="state-icon" style={{ color: 'var(--color-danger)' }}>⚠️</div>
      <h3 className="state-title">{title}</h3>
      <p className="state-message">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

