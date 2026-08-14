import { type ReactNode } from "react";
import { Navigate } from "react-router";
import { getAuthToken } from "./token";

/**
 * Route guard component. Wrap any route that requires authentication.
 * Redirects to /login if no auth token is present.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!getAuthToken()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
