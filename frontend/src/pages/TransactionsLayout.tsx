import { Outlet } from "react-router";
import { FinanceNavbar } from "@/components/finance/Navbar";

export function TransactionsLayout() {
  return (
    <>
      <Outlet />
      <FinanceNavbar />
    </>
  );
}
