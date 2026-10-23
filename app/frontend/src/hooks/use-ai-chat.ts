import { useCallback, useEffect, useRef, useState } from "react";
import {
  accounts as accountsApi,
  categories as categoriesApi,
  transactions as transactionsApi,
  type AccountDto,
  type CategoryDto,
  type TransactionDto,
} from "@/lib/api";
import {
  sendAssistantMessage,
  type AssistantAction,
  type ProposedDraft,
} from "@/lib/api/assistant";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { formatCurrency } from "@/lib/finance";
import { useMe } from "@/hooks/use-me";
import { notify } from "@/hooks/use-toast";

export type MaryCard = {
  id: string;
  amount: number;
  kind: "expense" | "income";
  description: string;
  account: string;
  category: string;
  force?: boolean;
  done?: "added" | "cancel";
};

export type MaryMessage = {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  card?: MaryCard;
  actions?: AssistantAction[];
  errorKind?: "offline" | "expired" | "server" | "generic";
  retryPrompt?: string;
};

export function useAiChat() {
  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;
  const userName = userQuery.data?.name?.split(" ")[0] ?? "there";

  const [messages, setMessages] = useState<MaryMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionDto[]>([]);

  // Load supporting financial metadata for interactive card choices & duplicate detection
  const loadMetadata = useCallback(async () => {
    try {
      const [accs, cats, txRes] = await Promise.all([
        accountsApi.listAccounts().catch(() => []),
        categoriesApi.listCategories().catch(() => []),
        transactionsApi.listTransactions({ per_page: 50 }).catch(() => ({ data: [] })),
      ]);
      setAccounts(accs || []);
      setCategories(cats || []);
      setRecentTransactions((txRes as { data?: TransactionDto[] })?.data || []);
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // Initial welcome message if conversation is empty
  const ensureWelcome = useCallback(() => {
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [
        {
          id: "welcome",
          role: "assistant",
          content: `Hi ${userName}, I am Mary. Ask about your balance, spending or budget, or tell me what you spent, like “spent 2,500 on lunch from OPay”. I always ask you to confirm before I save anything.`,
        },
      ];
    });
  }, [userName]);

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSending) return;

      const userMsgId = `user-${Date.now()}`;
      setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: trimmed }]);
      setIsSending(true);

      // Handle offline state
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsSending(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "error",
            content:
              "I need a connection to answer. Your changes are safe on this device. Try again when you are back online.",
            errorKind: "offline",
            retryPrompt: trimmed,
          },
        ]);
        return;
      }

      try {
        const history = messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .slice(-6)
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

        const response = await sendAssistantMessage({
          message: trimmed,
          context: {
            history,
          },
        });

        const reply = response.reply || "I understood that. Check and confirm below.";
        const actions = response.actions || [];

        // Check if there is a proposed transaction draft action
        const draftAction = actions.find(
          (a): a is { type: "propose_transaction"; draft: ProposedDraft } =>
            a.type === "propose_transaction",
        );

        let card: MaryCard | undefined = undefined;
        if (draftAction && draftAction.draft) {
          const d = draftAction.draft;
          card = {
            id: `card-${Date.now()}`,
            amount: Number(d.amount) || 0,
            kind: d.kind === "income" ? "income" : "expense",
            description: d.description || "transaction",
            account: d.account || "",
            category: d.category || "",
          };
        } else {
          // Client-side safety parser: if Groq described the draft in text without the tool call,
          // or user stated an expense, reliably construct the interactive confirm card!
          const parsed = extractFallbackDraft(trimmed, reply, accounts, categories);
          if (parsed) {
            card = {
              id: `card-${Date.now()}`,
              ...parsed,
            };
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `mary-${Date.now()}`,
            role: "assistant",
            content: reply,
            card,
            actions,
          },
        ]);
      } catch (err: unknown) {
        const errorObj = err as { status?: number; message?: string };
        const status = errorObj?.status;

        if (status === 401) {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: "error",
              content: "Your session expired. Sign in and ask me again.",
              errorKind: "expired",
              retryPrompt: trimmed,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: "error",
              content: "I could not reach the server. Nothing was lost.",
              errorKind: "server",
              retryPrompt: trimmed,
            },
          ]);
        }
      } finally {
        setIsSending(false);
      }
    },
    [isSending, messages],
  );

  const updateCard = useCallback((cardId: string, updates: Partial<MaryCard>) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.card && m.card.id === cardId) {
          return {
            ...m,
            card: { ...m.card, ...updates },
          };
        }
        return m;
      }),
    );
  }, []);

  const cancelCard = useCallback(
    (cardId: string) => {
      updateCard(cardId, { done: "cancel" });
    },
    [updateCard],
  );

  const confirmCard = useCallback(
    async (cardId: string) => {
      const targetMessage = messages.find((m) => m.card && m.card.id === cardId);
      if (!targetMessage || !targetMessage.card) return;
      const card = targetMessage.card;

      if (!card.account || !card.account.trim()) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "error",
            content: "Choose an account first. I will not guess where this money came from or went.",
            errorKind: "generic",
          },
        ]);
        return;
      }

      // Find matching account
      const chosenAccount = accounts.find(
        (a) => a.name.toLowerCase() === card.account.toLowerCase(),
      );
      if (!chosenAccount) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "error",
            content: `Could not find an account named "${card.account}". Please select from your accounts list.`,
            errorKind: "generic",
          },
        ]);
        return;
      }

      // Check for duplicates today
      const todayIso = new Date().toISOString().slice(0, 10);
      const isDuplicate = recentTransactions.some((t) => {
        const txDate = (t.transaction_date || "").slice(0, 10);
        const sameDay = txDate === todayIso;
        const sameKind = t.type === card.kind;
        const sameAmount = Math.abs(Number(t.amount) - Number(card.amount)) < 0.005;
        const sameAccount = t.account_id === chosenAccount.id;
        return sameDay && sameKind && sameAmount && sameAccount;
      });

      if (isDuplicate && !card.force) {
        updateCard(cardId, { force: true });
        setMessages((prev) => [
          ...prev,
          {
            id: `dup-${Date.now()}`,
            role: "assistant",
            content:
              "This looks like a duplicate: same day, type, amount and account. Press Add anyway if it is a separate transaction.",
          },
        ]);
        return;
      }

      // Find category
      const chosenCategory = categories.find(
        (c) => c.name.toLowerCase() === card.category.toLowerCase(),
      );

      try {
        const created = await transactionsApi.createTransaction({
          amount: card.amount,
          type: card.kind,
          description: card.description || "transaction",
          account_id: chosenAccount.id,
          category_id: chosenCategory?.id,
          transaction_date: new Date().toISOString(),
          source: "mary",
        });

        updateCard(cardId, { done: "added" });

        // Calculate and report new balance
        const oldBalance = Number(chosenAccount.balance ?? 0);
        const newBalance =
          card.kind === "income" ? oldBalance + card.amount : oldBalance - card.amount;
        const balFmt = formatCurrency(newBalance, chosenAccount.currency || userCurrency);
        const amtFmt = formatCurrency(card.amount, chosenAccount.currency || userCurrency);

        setMessages((prev) => [
          ...prev,
          {
            id: `saved-${Date.now()}`,
            role: "assistant",
            content: `Added ${amtFmt} to ${chosenAccount.name}. ${chosenAccount.name} now has ${balFmt}.`,
          },
        ]);

        // Undo toast
        const savedId = created.id;
        notify.success("Transaction added", {
          undo: async () => {
            try {
              await transactionsApi.deleteTransaction(savedId);
              updateCard(cardId, { done: "cancel" });
              notify.info("Transaction undone");
              window.dispatchEvent(new CustomEvent("pasona:transaction-created"));
            } catch {
              notify.error("Could not undo transaction");
            }
          },
        });

        // Trigger updates across dashboard / transaction lists
        window.dispatchEvent(new CustomEvent("pasona:transaction-created"));
        loadMetadata();
      } catch (err: unknown) {
        const errorObj = err as { status?: number; message?: string };
        if (errorObj?.status === 409 && !card.force) {
          updateCard(cardId, { force: true });
          setMessages((prev) => [
            ...prev,
            {
              id: `dup-${Date.now()}`,
              role: "assistant",
              content:
                "This looks like a duplicate: same day, type, amount and account. Press Add anyway if it is a separate transaction.",
            },
          ]);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "error",
            content: errorObj?.message || "Could not save transaction. Please try again.",
            errorKind: "server",
          },
        ]);
      }
    },
    [accounts, categories, loadMetadata, messages, recentTransactions, updateCard, userCurrency],
  );

  const reset = useCallback(() => {
    setMessages([]);
  }, []);

  const editAndResend = useCallback(
    (messageId: string, newContent: string) => {
      const trimmed = newContent.trim();
      if (!trimmed || isSending) return;

      // Find the index of the message being edited
      const targetIndex = messages.findIndex((m) => m.id === messageId);
      if (targetIndex === -1) {
        send(trimmed);
        return;
      }

      // Truncate message history up to the message being replaced
      setMessages((prev) => prev.slice(0, targetIndex));

      // Resend with new content
      send(trimmed);
    },
    [isSending, messages, send],
  );

  const retryLast = useCallback(() => {
    if (isSending) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      editAndResend(lastUserMsg.id, lastUserMsg.content);
    }
  }, [editAndResend, isSending, messages]);

  return {
    messages,
    isSending,
    accounts,
    categories,
    userCurrency,
    send,
    editAndResend,
    retryLast,
    confirmCard,
    cancelCard,
    updateCard,
    reset,
    ensureWelcome,
  };
}

function extractFallbackDraft(
  userText: string,
  botReply: string,
  accounts: AccountDto[],
  categories: CategoryDto[],
): Omit<MaryCard, "id"> | null {
  const q = userText.trim().toLowerCase();

  // 1. Check if user explicitly asked to add/log a transaction:
  // e.g. "spent 2,500 on lunch from OPay", "log 10,000 salary", "paid 1500 for coffee"
  // Must NOT be an inquiry/question like "check it for me", "how much did I spend", "what is my budget"
  const isQuestion = /^(how|what|check|view|show|tell|why|can you)\b/i.test(q);
  const userWantsAdd =
    !isQuestion &&
    /\d/.test(q) &&
    (/^(add|log|record|spent|spend|paid|pay|bought|buy|got|received|earned)\b/i.test(q) ||
      /\b(spent|spend|paid|pay|bought|buy|received|earned)\s+(?:₦|ngn|\$)?\s*\d/i.test(q));

  // 2. Or if bot explicitly confirmed creating a draft: e.g. "drafted a transaction for ₦2,500"
  const botDraftMatch = botReply.match(
    /drafted a transaction for\s*(?:₦|ngn|\$)?\s*([\d,]+(?:\.\d+)?)/i,
  );

  if (!userWantsAdd && !botDraftMatch) {
    return null;
  }

  // Extract amount
  let amt = 0;
  if (userWantsAdd) {
    const match = q.match(/(?:₦|ngn|\$)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k\b)?/i);
    if (match) {
      const rawNum = match[1].replace(/,/g, "");
      // Guard: ignore standalone 4-digit years like 2024..2027 if without currency symbol
      const isYear =
        (rawNum === "2024" || rawNum === "2025" || rawNum === "2026" || rawNum === "2027") &&
        !match[0].includes("₦") &&
        !match[0].includes("$") &&
        !match[2];

      if (!isYear) {
        amt = parseFloat(rawNum);
        if (match[2]) amt *= 1000;
      }
    }
  } else if (botDraftMatch) {
    amt = parseFloat(botDraftMatch[1].replace(/,/g, ""));
  }

  if (!(amt > 0)) return null;

  const sourceText = userWantsAdd ? q : `${q} ${botReply.toLowerCase()}`;
  const kind = /\b(received|got|earned|salary|income|paid me)\b/i.test(sourceText)
    ? "income"
    : "expense";

  // Match account
  let matchedAccount = "";
  for (const a of accounts) {
    if (sourceText.includes(a.name.toLowerCase())) {
      matchedAccount = a.name;
      break;
    }
  }

  // Match category
  let matchedCategory = "";
  for (const c of categories) {
    if (sourceText.includes(c.name.toLowerCase())) {
      matchedCategory = c.name;
      break;
    }
  }
  if (!matchedCategory) {
    matchedCategory = kind === "income" ? "Salary" : "General";
  }

  // Extract description
  let desc = userText
    .replace(/(?:₦|ngn|\$)?\s*\d[\d,]*(?:\.\d+)?\s*k?\b/gi, "")
    .replace(
      /\b(add|log|record|spent|spend|paid|pay|bought|buy|got|received|earned|on|for|from|in|to|naira|ngn)\b/gi,
      " ",
    );
  if (matchedAccount) {
    desc = desc.replace(new RegExp(matchedAccount, "gi"), " ");
  }
  desc = desc.replace(/[₦$]/g, "").replace(/\s+/g, " ").trim();

  return {
    amount: amt,
    kind,
    description: desc || "transaction",
    account: matchedAccount,
    category: matchedCategory,
  };
}
