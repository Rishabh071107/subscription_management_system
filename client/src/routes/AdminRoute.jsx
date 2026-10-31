import React from 'react';
import RequireRole from './RequireRole.jsx';

export default function AdminRoute() {
  return <RequireRole allowedRoles={['ADMIN']} />;
}

