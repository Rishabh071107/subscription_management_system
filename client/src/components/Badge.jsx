import React from 'react';

const Badge = ({ status, text }) => {
  const displayStatus = (status || text || '').toString().toUpperCase();
  const badgeClass = `badge badge-${displayStatus.toLowerCase()}`;

  return (
    <span className={badgeClass}>
      {text || displayStatus.replace('_', ' ')}
    </span>
  );
};

export default Badge;
