import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import FieldDashboard from './pages/field/Dashboard';
import RouteMap from './pages/field/RouteMap';
import RunningSession from './pages/field/RunningSession';
import './index.css';

// Simple Route Guard
const ProtectedRoute = ({ children, role }: { children: React.ReactElement, role: 'admin' | 'field' }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/" />;

  const user = JSON.parse(userStr);
  if (user.role !== role) return <Navigate to="/" />; // or unauth page

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Field User Routes */}
        <Route path="/field" element={
          <ProtectedRoute role="field">
            <FieldDashboard />
          </ProtectedRoute>
        } />
        <Route path="/field/route/:id" element={
          <ProtectedRoute role="field">
            <RouteMap />
          </ProtectedRoute>
        } />
        <Route path="/field/run/:runId" element={
          <ProtectedRoute role="field">
            <RunningSession />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
