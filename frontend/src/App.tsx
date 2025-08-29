import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { VerifyEmail } from './components/auth/VerifyEmail';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ResetPassword } from './components/auth/ResetPassword';
import { Transactions } from './components/Transactions';
import { PdfUpload } from './components/PdfUpload';
import { Analytics } from './components/Analytics';
import { MonthlyTrends } from './components/analytics/MonthlyTrends';
import { BudgetTracking } from './components/analytics/BudgetTracking';
import { SpendingAlerts } from './components/analytics/SpendingAlerts';
import { CashFlowForecast } from './components/analytics/CashFlowForecast';
import { GoalTracking } from './components/analytics/GoalTracking';
import { TaxTracker } from './components/analytics/TaxTracker';
import { Statements } from './components/Statements';
import { Billing } from './components/Billing';
import { Settings } from './components/Settings';
import { LandingPage } from './components/LandingPage';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />
  <Route path="/verify-email" element={<VerifyEmail />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Layout>
                <PdfUpload />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Layout>
                <Transactions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/trends"
          element={
            <ProtectedRoute>
              <Layout>
                {/* Default to FREE when embedding standalone; component will self-adapt once centralized analytics page is preferred */}
                <MonthlyTrends planType="FREE" />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/budget"
          element={
            <ProtectedRoute>
              <Layout>
                <BudgetTracking />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/alerts"
          element={
            <ProtectedRoute>
              <Layout>
                <SpendingAlerts />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/forecast"
          element={
            <ProtectedRoute>
              <Layout>
                <CashFlowForecast />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/goals"
          element={
            <ProtectedRoute>
              <Layout>
                <GoalTracking />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/tax"
          element={
            <ProtectedRoute>
              <Layout>
                <TaxTracker />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/statements"
          element={
            <ProtectedRoute>
              <Layout>
                <Statements />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <Layout>
                <Billing />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
};

export default App;