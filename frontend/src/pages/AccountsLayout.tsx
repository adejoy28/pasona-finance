import { Outlet } from "react-router";
import { FinanceNavbar } from "@/components/finance/Navbar";

export function AccountsLayout() {
  return (
    <>
      <Outlet />
      <FinanceNavbar />
    </>
  );
}
