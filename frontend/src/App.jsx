import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';

import OwnerLayout from './layouts/OwnerLayout';
import WaiterLayout from './layouts/WaiterLayout';

import LoginPage from './pages/LoginPage';

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import SalesAuditPage from './pages/owner/SalesAuditPage';
import SalesPage from './pages/owner/SalesPage';
import DailyReportPage from './pages/owner/DailyReportPage';
import ProductsPage from './pages/owner/ProductsPage';
import UsersPage from './pages/owner/UsersPage';

// Waiter pages
import WaiterHome from './pages/waiter/WaiterHome';
import NewSalePage from './pages/waiter/NewSalePage';
import MySalesPage from './pages/waiter/MySalesPage';

import { useAuth } from './context/AuthContext';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'OWNER') return <Navigate to="/owner/dashboard" replace />;
  return <Navigate to="/waiter/new-sale" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Owner routes */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute>
            <RoleRoute role="OWNER">
              <OwnerLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="audit" element={<SalesAuditPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="report" element={<DailyReportPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>

      {/* Waiter routes */}
      <Route
        path="/waiter"
        element={
          <ProtectedRoute>
            <RoleRoute role="WAITER">
              <WaiterLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<WaiterHome />} />
        <Route path="home" element={<WaiterHome />} />
        <Route path="new-sale" element={<NewSalePage />} />
        <Route path="my-sales" element={<MySalesPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
