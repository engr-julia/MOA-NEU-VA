import React from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MOAList from './pages/MOAList';
import UserManagement from './pages/UserManagement';
import AuditTrail from './pages/AuditTrail';
import ProfilePage from './pages/Profile';
import UserActivity from './pages/UserActivity';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-400 italic">Loading session...</div>;
  if (!user) return <Navigate to="/login" />;
  
  // Ensure profile is loaded from Firestore before rendering protected content
  if (!profile) return <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-400 italic">Syncing profile with server...</div>;
  
  if (profile.isBlocked) return <div className="flex items-center justify-center h-screen text-red-600 font-bold bg-red-50">Your account has been blocked. Please contact an administrator.</div>;
  
  // If roles are specified, ensure the user has the required role
  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="moas" element={<MOAList />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={['superadmin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit"
            element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <AuditTrail />
              </ProtectedRoute>
            }
          />
          <Route
            path="activity"
            element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <UserActivity />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
