import React from 'react';
import RequireRole from './RequireRole.jsx';

export default function CustomerPortalRoute() {
  return <RequireRole allowedRoles={['CUSTOMER']} />;
}
