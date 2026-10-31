import React from 'react';

export default function LoadingState({ message = 'Loading details...' }) {
  return (
    <div className="state-container">
      <div className="spinner" style={{ marginBottom: 16 }} />
      <div className="state-message">{message}</div>
    </div>
  );
}

