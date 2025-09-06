import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CryptoProvider } from './contexts/CryptoContext';

// Auth Layout and Pages
import AuthLayout from './components/layouts/AuthLayout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VerifyMFA from './pages/auth/VerifyMFA';
import SetupPassphrase from './pages/auth/SetupPassphrase';

// App Layout and Pages
import AppLayout from './components/layouts/AppLayout';
import Home from './pages/app/Home';
import AddNote from './pages/app/AddNote';
import EditNote from './pages/app/EditNote';
import Favorites from './pages/app/Favorites';
import Trash from './pages/app/Trash';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CryptoProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={
                  <PublicRoute>
                    <AuthLayout>
                      <Login />
                    </AuthLayout>
                  </PublicRoute>
                } />
                <Route path="/signup" element={
                  <PublicRoute>
                    <AuthLayout>
                      <Signup />
                    </AuthLayout>
                  </PublicRoute>
                } />
                <Route path="/verify-mfa" element={
                  <PublicRoute>
                    <AuthLayout>
                      <VerifyMFA />
                    </AuthLayout>
                  </PublicRoute>
                } />
                <Route path="/setup-passphrase" element={
                  <ProtectedRoute>
                    <AuthLayout>
                      <SetupPassphrase />
                    </AuthLayout>
                  </ProtectedRoute>
                } />

                {/* Protected Routes */}
                <Route path="/app" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Home />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/app/add" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AddNote />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/app/edit/:id" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <EditNote />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/app/favorites" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Favorites />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/app/trash" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Trash />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </Router>
        </CryptoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;