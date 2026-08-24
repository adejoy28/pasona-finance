import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router";
import { PopupProvider } from "@/components/ui/popup";
import { ProtectedRoute } from "@/lib/auth/guard";
import { onUnauthorized } from "@/lib/api";

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
import { ImportPage } from "@/pages/ImportPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { TestInputPage } from "@/pages/TestInputPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { DownloadPage } from "@/pages/DownloadPage";

import { initCapacitor } from "@/lib/capacitor";
import { AppInstallBanner } from "@/components/finance/AppInstallBanner";
import { SyncIndicator } from "@/components/finance/SyncIndicator";

function UnauthorizedHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    onUnauthorized(() => {
      void navigate("/login");
    });
    return () => onUnauthorized(null);
  }, [navigate]);

  return null;
}

export function App() {
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
      {/* <AppInstallBanner /> */}
      <SyncIndicator />
      <UnauthorizedHandler />
      <PopupProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<SplashPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email/verify" element={<EmailVerify />} />
          <Route path="/privacy" element={<PrivacyPage />} />
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
      </PopupProvider>
    </BrowserRouter>
  );
}

export default App;
