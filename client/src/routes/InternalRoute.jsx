import React from 'react';
import RequireRole from './RequireRole.jsx';

export default function InternalRoute() {
  return <RequireRole allowedRoles={['ADMIN', 'STAFF']} />;
}
