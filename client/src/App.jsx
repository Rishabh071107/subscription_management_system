import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

// Layouts
import PublicLayout from './layouts/PublicLayout.jsx';
import InternalLayout from './layouts/InternalLayout.jsx';
import CustomerPortalLayout from './layouts/CustomerPortalLayout.jsx';

// Auth Pages
import Login from './modules/auth/Login.jsx';
import Register from './modules/auth/Register.jsx';
import ForgotPassword from './modules/auth/ForgotPassword.jsx';
import ResetPassword from './modules/auth/ResetPassword.jsx';
import AccessDenied from './modules/auth/AccessDenied.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public Auth Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Register />} />
              <Route path="/register" element={<Navigate to="/signup" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/403" element={<AccessDenied />} />
            </Route>

            {/* Placeholder fallbacks for internal & portal to be hooked up in Phase 00D/00E */}
            <Route path="/admin/*" element={<Navigate to="/login" replace />} />
            <Route path="/portal/*" element={<Navigate to="/login" replace />} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
