import React from 'react';

export default function EmptyState({
  title = 'No items found',
  message = 'There are no records available to display at this time.',
  icon = '📁',
  action
}) {
  return (
    <div className="state-container">
      <div className="state-icon">{icon}</div>
      <h3 className="state-title">{title}</h3>
      <p className="state-message">{message}</p>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
