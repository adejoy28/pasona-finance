import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/lib/auth/guard";
import { onUnauthorized } from "@/lib/api";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { getCachedUser } from "@/hooks/use-me";

import { SplashPage } from "@/pages/SplashPage";
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { EmailVerify } from "@/pages/EmailVerify";
import { AccountsLayout } from "@/pages/AccountsLayout";
import { AccountsIndex } from "@/pages/AccountsIndex";
import { AccountDetail } from "@/pages/AccountDetail";
import { TransactionsLayout } from "@/pages/TransactionsLayout";
import { TransactionsIndex } from "@/pages/TransactionsIndex";
import { TransactionsAdd } from "@/pages/TransactionsAdd";
import { TransactionDetail } from "@/pages/TransactionDetail";
import { Categories } from "@/pages/Categories";
import { Settings } from "@/pages/Settings";
import { ProfilePage } from "@/pages/ProfilePage";
import { ImportPage } from "@/pages/ImportPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { TermsPage } from "@/pages/TermsPage";
import { TestInputPage } from "@/pages/TestInputPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { DownloadPage } from "@/pages/DownloadPage";

import { initCapacitor } from "@/lib/capacitor";
import { SubtlePopups } from "@/components/finance/SubtlePopups";
import { NetworkStatusBar } from "@/components/finance/NetworkStatusBar";
import { SessionExpiredModal } from "@/components/finance/SessionExpiredModal";
import { SplashScreen } from "@/components/finance/SplashScreen";
import { NativeNotificationListener } from "@/components/finance/NativeNotificationListener";
import { useTheme } from "@/hooks/use-theme";

function UnauthorizedHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    onUnauthorized(() => {
      // Only redirect when there is no user session cached in memory
      if (!getCachedUser()) {
        void navigate("/login");
      }
    });
    return () => onUnauthorized(null);
  }, [navigate]);

  return null;
}

export function App() {
  useTheme();

  useEffect(() => {
    initCapacitor();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("[pwa] service worker registered"))
        .catch((err) => console.error("[pwa] registration failed", err));
    }
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <SplashScreen duration={1500} />
        <Toaster />
        <SubtlePopups />
        <NetworkStatusBar />
        <SessionExpiredModal />
        <NativeNotificationListener />
        <UnauthorizedHandler />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<SplashPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email/verify" element={<EmailVerify />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/test-input" element={<TestInputPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <AccountsLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AccountsIndex />} />
            <Route path=":accountId" element={<AccountDetail />} />
          </Route>

          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <TransactionsLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TransactionsIndex />} />
            <Route path="add" element={<TransactionsAdd />} />
            <Route path=":transactionId" element={<TransactionDetail />} />
          </Route>

          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/import"
            element={
              <ProtectedRoute>
                <ImportPage />
              </ProtectedRoute>
            }
          />

          {/* 404 fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
