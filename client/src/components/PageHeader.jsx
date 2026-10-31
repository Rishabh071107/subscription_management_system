import React from 'react';
import Breadcrumb from './Breadcrumb.jsx';

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className = ''
}) {
  return (
    <div className={`page-header ${className}`.trim()}>
      <div className="page-header-left">
        {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

