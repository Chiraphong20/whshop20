// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // เช็คว่ามีกุญแจใน localStorage หรือไม่
  const isAuthenticated = localStorage.getItem('isAdminLoggedIn') === 'true';

  // ถ้ามี -> ให้ผ่านไป (Render Outlet คือหน้าลูกๆ)
  // ถ้าไม่มี -> ดีดไปหน้า /login
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;