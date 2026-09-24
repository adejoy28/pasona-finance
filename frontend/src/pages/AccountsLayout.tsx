import { Outlet } from "react-router";
import { FinanceNavbar } from "@/components/finance/Navbar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function AccountsLayout() {
  return (
    <>
      <ErrorBoundary title="Account View Error" message="An error occurred while loading this account view.">
        <Outlet />
      </ErrorBoundary>
      <FinanceNavbar />
    </>
  );
}
