import React from 'react';

export default function KPIStatCard({
  title,
  value,
  icon,
  iconTheme = 'default',
  footer,
  valueColor,
  className = ''
}) {
  return (
    <div className={`metric-card ${className}`.trim()}>
      <div className="metric-header">
        <span className="metric-label">{title}</span>
        <div className={`metric-icon-box ${iconTheme ? `icon-${iconTheme}` : ''}`.trim()}>
          {icon}
        </div>
      </div>
      <div className="metric-value" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      {footer && <div className="metric-footer">{footer}</div>}
    </div>
  );
}

