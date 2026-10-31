import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

// Layouts
import PublicLayout from './layouts/PublicLayout.jsx';
import InternalLayout from './layouts/InternalLayout.jsx';
import CustomerPortalLayout from './layouts/CustomerPortalLayout.jsx';

// Route Guards
import PublicOnlyRoute from './routes/PublicOnlyRoute.jsx';
import AdminRoute from './routes/AdminRoute.jsx';
import InternalRoute from './routes/InternalRoute.jsx';
import CustomerPortalRoute from './routes/CustomerPortalRoute.jsx';

// Auth Pages
import Login from './modules/auth/Login.jsx';
import Register from './modules/auth/Register.jsx';
import ForgotPassword from './modules/auth/ForgotPassword.jsx';
import ResetPassword from './modules/auth/ResetPassword.jsx';
import AccessDenied from './modules/auth/AccessDenied.jsx';

// Internal / Admin Pages
import AdminDashboard from './modules/dashboard/AdminDashboard.jsx';
import UserList from './modules/users/UserList.jsx';
import ProfilePage from './modules/profile/ProfilePage.jsx';
import SettingsPage from './modules/settings/SettingsPage.jsx';
import InvoiceList from './modules/invoices/InvoiceList.jsx';
import InvoiceDetail from './modules/invoices/InvoiceDetail.jsx';

// Customer Portal Pages
import CustomerDashboard from './modules/dashboard/CustomerDashboard.jsx';
import PortalProfilePage from './modules/portal/PortalProfilePage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public Auth Routes */}
            <Route element={<PublicOnlyRoute />}>
              <Route element={<PublicLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/register" element={<Navigate to="/signup" replace />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>
            </Route>

            {/* Access Denied (Standalone public layout) */}
            <Route element={<PublicLayout />}>
              <Route path="/403" element={<AccessDenied />} />
            </Route>

            {/* Admin-Only Routes */}
            <Route element={<AdminRoute />}>
              <Route element={<InternalLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/staff" element={<UserList roleFilter="STAFF" />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Internal Routes (Admin & Staff) */}
            <Route element={<InternalRoute />}>
              <Route element={<InternalLayout />}>
                <Route path="/customers" element={<UserList roleFilter="CUSTOMER" />} />
                <Route path="/invoices" element={<InvoiceList />} />
                <Route path="/invoices/:id" element={<InvoiceDetail />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Customer Portal Routes (Customer Only) */}
            <Route element={<CustomerPortalRoute />}>
              <Route element={<CustomerPortalLayout />}>
                <Route path="/portal/dashboard" element={<CustomerDashboard />} />
                <Route path="/portal/invoices" element={<InvoiceList />} />
                <Route path="/portal/invoices/:id" element={<InvoiceDetail />} />
                <Route path="/portal/profile" element={<PortalProfilePage />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
