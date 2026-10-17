import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { transactions as transactionsApi, type TransactionDto } from "@/lib/api";
import { DEFAULT_CURRENCY, resolveCurrency } from "@/lib/currencies";
import { DuplicateReviewView } from "@/components/finance/DuplicateReviewView";
import { HistorySkeleton } from "@/components/finance/Skeletons";

export function DuplicateReviewPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [txDtos, setTxDtos] = useState<TransactionDto[]>([]);
  const [userCurrency, setUserCurrency] = useState(DEFAULT_CURRENCY);

  const loadData = async () => {
    try {
      setLoading(true);
      const txRes = await transactionsApi.listTransactions({ per_page: 500 });
      setTxDtos(Array.isArray(txRes) ? txRes : txRes.data ?? []);

      try {
        const storedCurrency = localStorage.getItem("pasona.currency");
        if (storedCurrency) {
          setUserCurrency(resolveCurrency(storedCurrency)?.symbol ?? DEFAULT_CURRENCY);
        }
      } catch {
        // ignore
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  if (loading && txDtos.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <HistorySkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <DuplicateReviewView
        transactions={txDtos}
        userCurrency={userCurrency}
        onRefresh={loadData}
        onBack={() => navigate("/transactions")}
      />
    </div>
  );
}
