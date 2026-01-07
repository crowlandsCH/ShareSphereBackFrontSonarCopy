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

// ⭐ AKTUALISIERT: Berücksichtigt isLoading
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Warte, bis der Auth-Check abgeschlossen ist
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ?  <>{children}</> : <Navigate to="/login" replace />;
}

// ⭐ NEU: Redirect zu Dashboard wenn bereits eingeloggt
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Warte, bis der Auth-Check abgeschlossen ist
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    );
  }
  
  // Wenn bereits eingeloggt, leite zum Dashboard weiter
  return isAuthenticated ?  <Navigate to="/" replace /> : <>{children}</>;
}

// ⭐ NEW: Separate component that uses useAuth()
function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  // Determine the role
  const userRole = isAuthenticated 
    ? (user?.roles?.includes('admin') ? 'admin' : 'user')
    : null;

  console.log('🔐 Debug:', { isAuthenticated, user, userRole });

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole={userRole} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Routes>
          {/* ⭐ AKTUALISIERT: Öffentliche Routes mit Redirect */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          
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