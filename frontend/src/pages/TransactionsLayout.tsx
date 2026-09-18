import { Outlet } from "react-router";
import { FinanceNavbar } from "@/components/finance/Navbar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function TransactionsLayout() {
  return (
    <>
      <ErrorBoundary title="Transactions View Error" message="An error occurred while loading transactions.">
        <Outlet />
      </ErrorBoundary>
      <FinanceNavbar />
    </>
  );
}
