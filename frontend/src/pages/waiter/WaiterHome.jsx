import React from 'react';
import { Navigate } from 'react-router-dom';

// WaiterHome just redirects to new-sale as the primary screen
export default function WaiterHome() {
  return <Navigate to="/waiter/new-sale" replace />;
}
