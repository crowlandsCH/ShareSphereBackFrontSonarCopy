import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Portfolio } from './components/Portfolio';
import { TradeForm } from './components/TradeForm';
import { AdminPanel } from './components/AdminPanel';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// ⭐ NEW: Separate component that uses useAuth()
function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  // Determine the role
  const userRole = isAuthenticated 
    ? (user?.roles?.includes('admin') ? 'admin' : 'user')
    : null;

  console.log('🔐 Debug:', { isAuthenticated, user, userRole });  // ← Debug-Log

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole={userRole} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Routes>
          {/* Öffentliche Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Geschützte Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/portfolio" 
            element={
              <ProtectedRoute>
                <Portfolio />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trade" 
            element={
              <ProtectedRoute>
                <TradeForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      
      <Toaster position="top-right" richColors />
    </div>
  );
}

// ⭐ IMPORTANT: useAuth() is called INSIDE AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}