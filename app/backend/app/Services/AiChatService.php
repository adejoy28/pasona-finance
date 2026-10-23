<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AiChatService
 *
 * Handles prompting and communication with the Groq API (OpenAI-compatible)
 * for personal finance Q&A, proactive insights, and the Phase 9b Mary assistant.
 */
class AiChatService
{
    private const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    private const REQUEST_TIMEOUT_SECONDS = 25;
    private const MAX_RESPONSE_TOKENS = 1024;

    /**
     * Handle multi-turn conversation with Mary (Phase 9b).
     *
     * @param User $user
     * @param string $message
     * @param array<int, array{role: string, content: string}> $history
     * @param string|null $month
     * @return array{kind: string, reply: string, actions: array<int, array<string, mixed>>}
     */
    public function assistantMessage(User $user, string $message, array $history = [], ?string $month = null): array
    {
        $context = $this->resolveAssistantContext($user, $month);
        $apiKey = config('services.groq.api_key');

        if (!empty($apiKey)) {
            $systemPrompt = $this->buildAssistantSystemPrompt($user, $context);
            $payloadMessages = $this->buildMessagesPayload($systemPrompt, $history, $message);
            $tools = $this->buildAssistantTools();

            $groqResult = $this->callGroqWithTools($apiKey, $payloadMessages, $tools);
            if ($groqResult !== null) {
                return $groqResult;
            }
        }

        // Deterministic fallback if Groq API key is missing, rate limited, or errored
        return $this->fallbackAssistantReply($user, $message, $context);
    }

    /**
     * Handle a multi-turn chat conversation (Legacy endpoint).
     *
     * @param User $user
     * @param string $question
     * @param array<int, array{role: string, content: string}> $messages
     * @param array<string, mixed> $context
     * @return array<string, mixed>
     */
    public function chat(User $user, string $question, array $messages = [], array $context = []): array
    {
        $apiKey = config('services.groq.api_key');
        if (empty($apiKey)) {
            return [
                'kind' => 'not_configured',
                'message' => 'Groq API key is not configured. Please add GROQ_API_KEY to your environment.',
            ];
        }

        $systemPrompt = $this->buildSystemPrompt($user, $context);
        $payloadMessages = $this->buildMessagesPayload($systemPrompt, $messages, $question);

        return $this->callGroq($apiKey, $payloadMessages, $question);
    }

    /**
     * Handle single-turn AI insights generation.
     *
     * @param User $user
     * @param string $question
     * @param array<string, mixed> $context
     * @return array<string, mixed>
     */
    public function insights(User $user, string $question, array $context = []): array
    {
        return $this->chat($user, $question, [], $context);
    }

    /**
     * Resolve financial context for Mary assistant from user models.
     *
     * @param User $user
     * @param string|null $month
     * @return array<string, mixed>
     */
    private function resolveAssistantContext(User $user, ?string $month = null): array
    {
        $currency = $user->currency ?: 'NGN';
        $accounts = $user->accounts()->get();
        $balances = Account::balancesFor($user->id, $accounts->pluck('id')->all());

        $accountList = [];
        foreach ($accounts as $acc) {
            $accountList[] = [
                'id' => $acc->id,
                'name' => $acc->name,
                'type' => $acc->type,
                'currency' => $acc->currency ?: $currency,
                'balance' => (float) ($balances[$acc->id] ?? 0.0),
            ];
        }
        $totalBalance = array_sum($balances);

        // Date range
        if ($month && preg_match('/^\d{4}-\d{2}$/', $month)) {
            $startOfMonth = Carbon::parse($month . '-01')->startOfMonth();
            $endOfMonth = Carbon::parse($month . '-01')->endOfMonth();
        } else {
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth = Carbon::now()->endOfMonth();
        }

        // Income vs Expense
        $monthlyIncome = (float) $user->transactions()
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // Savings categories separation (Savings is not spending)
        $savingsCategoryIds = $user->categories()->where('name', 'Savings')->pluck('id')->all();

        $monthlySaved = (float) $user->transactions()
            ->where('type', 'expense')
            ->whereIn('category_id', $savingsCategoryIds)
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $monthlySpent = (float) $user->transactions()
            ->where('type', 'expense')
            ->whereNotIn('category_id', $savingsCategoryIds)
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // Categories
        $categories = $user->categories()->get(['id', 'name', 'type'])->toArray();

        // Budgets
        $budgets = [];
        if (method_exists($user, 'budgets')) {
            $userBudgets = $user->budgets()->with('category')->get();
            foreach ($userBudgets as $b) {
                $spent = (float) $user->transactions()
                    ->where('category_id', $b->category_id)
                    ->where('type', 'expense')
                    ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
                    ->sum('amount');
                $budgets[] = [
                    'category' => $b->category?->name ?? 'Category',
                    'amount' => (float) $b->amount,
                    'spent' => $spent,
                    'left' => max(0.0, (float) $b->amount - $spent),
                ];
            }
        }

        // Recurring bills
        $bills = [];
        if (method_exists($user, 'recurringBills')) {
            $userBills = $user->recurringBills()->get();
            foreach ($userBills as $bill) {
                $dueDate = $bill->next_due ?? ($bill->next_due_date ?? null);
                $formattedDueDate = $dueDate ? Carbon::parse($dueDate)->format('Y-m-d') : '';
                $bills[] = [
                    'name' => $bill->name,
                    'amount' => (float) $bill->amount,
                    'next_due_date' => $formattedDueDate,
                ];
            }
        }

        // Duplicates in last 7 days
        $recentTransactions = $user->transactions()
            ->where('transaction_date', '>=', Carbon::now()->subDays(7)->startOfDay())
            ->get(['id', 'transaction_date', 'amount', 'type', 'account_id', 'description']);

        $grouped = $recentTransactions->groupBy(function ($t) {
            $dateStr = $t->transaction_date ? Carbon::parse($t->transaction_date)->format('Y-m-d') : '';
            return $dateStr . '|' . $t->account_id . '|' . (string) $t->amount . '|' . $t->type;
        });
        $duplicatesCount = $grouped->filter(fn($group) => $group->count() > 1)->count();

        return [
            'currency' => $currency,
            'accounts' => $accountList,
            'total_balance' => $totalBalance,
            'monthly_income' => $monthlyIncome,
            'monthly_spent' => $monthlySpent,
            'monthly_saved' => $monthlySaved,
            'categories' => $categories,
            'budgets' => $budgets,
            'bills' => $bills,
            'duplicates_count' => $duplicatesCount,
            'month_label' => $startOfMonth->format('F Y'),
        ];
    }

    /**
     * Build the system prompt specifically for Mary (Addendum F).
     *
     * @param User $user
     * @param array<string, mixed> $context
     * @return string
     */
    private function buildAssistantSystemPrompt(User $user, array $context): string
    {
        $currency = $context['currency'];
        $accountsSummary = implode("\n", array_map(function ($a) use ($currency) {
            return "  * {$a['name']} ({$a['type']}): " . number_format($a['balance'], 2) . " {$currency}";
        }, $context['accounts']));

        $categoriesSummary = implode(', ', array_column($context['categories'], 'name'));

        return <<<PROMPT
You are Mary, an intelligent, empathetic, and accurate personal financial assistant for Pasona Finance Tracker.
You help users understand their spending, track savings, manage budgets, spot duplicates, and record transactions.

BINDING RULES:
1. Persona: Your name is Mary. Subtitle: "Ask about your money".
2. Accuracy: Ground all replies in the user's data below. Never compute or invent balances.
3. Savings Isolation: "Savings are not spending". Monthly spent does NOT include money moved to savings.
4. Transaction Drafting (Writes):
   - When the user mentions adding, logging, paying, or spending money (e.g. "spent 2,500 on lunch from OPay"), you MUST call the `propose_transaction` tool with the extracted details.
   - Set `account` ONLY if the user explicitly mentioned an account name matching their accounts list. If not specified, leave `account` empty (""). Never guess or default an account.
   - Explain what you understood and instruct them to check and confirm it. Do not say the transaction is saved; it is only a draft.
5. Navigation: If discussing budgets, bills, duplicates, or accounts, call the `navigate` tool with the relevant destination.
6. Conciseness: Keep conversational answers under 3 short paragraphs. Always use {$currency} (₦).

USER CONTEXT ({$context['month_label']}):
- Total Balance: {$context['total_balance']} {$currency}
- Accounts:
{$accountsSummary}
- Income this month: {$context['monthly_income']} {$currency}
- Spent this month (excluding savings): {$context['monthly_spent']} {$currency}
- Saved this month: {$context['monthly_saved']} {$currency}
- User Categories: {$categoriesSummary}
- Duplicates waiting for review: {$context['duplicates_count']}
PROMPT;
    }

    /**
     * Tool definitions for Groq / OpenAI completions.
     *
     * @return array<int, array<string, mixed>>
     */
    private function buildAssistantTools(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'propose_transaction',
                    'description' => 'Draft a new income or expense transaction for user review. Never saves directly.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'amount' => ['type' => 'number', 'description' => 'Positive number amount'],
                            'kind' => ['type' => 'string', 'enum' => ['expense', 'income'], 'description' => 'Whether this is an expense or income'],
                            'description' => ['type' => 'string', 'description' => 'Brief description or memo'],
                            'account' => ['type' => 'string', 'description' => 'Account name only if explicitly stated by user. Leave empty if omitted.'],
                            'category' => ['type' => 'string', 'description' => 'Matching category name or empty string.'],
                        ],
                        'required' => ['amount', 'kind', 'description'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'navigate',
                    'description' => 'Direct the user to a tab in the app',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'to' => ['type' => 'string', 'enum' => ['budgets', 'goals', 'bills', 'duplicates', 'accounts', 'history', 'home']],
                        ],
                        'required' => ['to'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Call Groq API with tool support and parse actions.
     *
     * @param string $apiKey
     * @param array<int, array{role: string, content: string}> $messages
     * @param array<int, array<string, mixed>> $tools
     * @return array{kind: string, reply: string, actions: array<int, array<string, mixed>>}|null
     */
    private function callGroqWithTools(string $apiKey, array $messages, array $tools): ?array
    {
        $model = config('services.groq.model', 'qwen/qwen3.8-27b');

        try {
            $response = Http::withToken($apiKey)
                ->timeout(self::REQUEST_TIMEOUT_SECONDS)
                ->post(self::GROQ_API_URL, [
                    'model' => $model,
                    'messages' => $messages,
                    'tools' => $tools,
                    'tool_choice' => 'auto',
                    'max_tokens' => self::MAX_RESPONSE_TOKENS,
                    'temperature' => 0.5,
                ]);

            if ($response->successful()) {
                $choice = $response->json('choices.0.message');
                $reply = trim((string) ($choice['content'] ?? ''));
                $actions = [];

                if (!empty($choice['tool_calls']) && is_array($choice['tool_calls'])) {
                    foreach ($choice['tool_calls'] as $tc) {
                        $fnName = $tc['function']['name'] ?? '';
                        $fnArgs = json_decode((string) ($tc['function']['arguments'] ?? '{}'), true) ?: [];

                        if ($fnName === 'propose_transaction') {
                            $actions[] = [
                                'type' => 'propose_transaction',
                                'draft' => [
                                    'amount' => (float) ($fnArgs['amount'] ?? 0.0),
                                    'kind' => in_array($fnArgs['kind'] ?? '', ['income', 'expense'], true) ? $fnArgs['kind'] : 'expense',
                                    'description' => (string) ($fnArgs['description'] ?? 'transaction'),
                                    'account' => (string) ($fnArgs['account'] ?? ''),
                                    'category' => (string) ($fnArgs['category'] ?? ''),
                                ],
                            ];
                        } elseif ($fnName === 'navigate') {
                            $actions[] = [
                                'type' => 'navigate',
                                'to' => (string) ($fnArgs['to'] ?? 'home'),
                            ];
                        }
                    }
                }

                if (empty($reply) && !empty($actions)) {
                    $reply = 'Here is what I understood. Check it, then confirm.';
                }

                return [
                    'kind' => 'ok',
                    'reply' => $reply,
                    'actions' => $actions,
                ];
            }

            Log::warning('Groq assistant call returned error: ' . $response->status(), [
                'body' => $response->body(),
            ]);
            return null;
        } catch (\Throwable $e) {
            Log::warning('Groq assistant exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Fallback intent and transaction proposal matcher (prototype-aligned).
     *
     * @param User $user
     * @param string $message
     * @param array<string, mixed> $context
     * @return array{kind: string, reply: string, actions: array<int, array<string, mixed>>}
     */
    private function fallbackAssistantReply(User $user, string $message, array $context): array
    {
        $q = strtolower(trim($message));
        $currency = $context['currency'];
        $sym = $currency === 'NGN' ? '₦' : ($currency === 'USD' ? '$' : "{$currency} ");

        // 1. Transaction proposal (spent, paid, bought, received, earned, log, add)
        $isTxDraft = preg_match('/\b(add|log|record|spent|spend|paid|pay|bought|buy|got|received|earned)\b/i', $q)
            && preg_match('/\d/', $q)
            && !preg_match('/^(how|what)\b/i', $q);

        if ($isTxDraft) {
            $amt = $this->parseFallbackAmount($q);
            $kind = preg_match('/\b(received|got|earned|salary|income|paid me)\b/i', $q) ? 'income' : 'expense';

            // Find matching account
            $accountName = '';
            foreach ($context['accounts'] as $acc) {
                if (str_contains($q, strtolower($acc['name']))) {
                    $accountName = $acc['name'];
                    break;
                }
            }

            // Find matching category
            $categoryName = '';
            foreach ($context['categories'] as $cat) {
                if (str_contains($q, strtolower($cat['name']))) {
                    $categoryName = $cat['name'];
                    break;
                }
            }
            if (empty($categoryName)) {
                $categoryName = $kind === 'income' ? 'Salary' : 'General';
            }

            // Clean description
            $desc = preg_replace('/(\d[\d,]*(?:\.\d+)?)\s*k?\b/i', '', $q);
            $desc = preg_replace('/\b(add|log|record|spent|spend|paid|pay|bought|buy|got|received|earned|on|for|from|in|to|naira|ngn)\b/i', ' ', $desc);
            if ($accountName !== '') {
                $desc = str_ireplace(strtolower($accountName), ' ', $desc);
            }
            $desc = trim(preg_replace('/[₦$]/u', '', preg_replace('/\s+/', ' ', $desc)));

            if ($amt > 0) {
                return [
                    'kind' => 'ok',
                    'reply' => 'Here is what I understood. Check it, then confirm.',
                    'actions' => [
                        [
                            'type' => 'propose_transaction',
                            'draft' => [
                                'amount' => $amt,
                                'kind' => $kind,
                                'description' => $desc ?: 'transaction',
                                'account' => $accountName,
                                'category' => $categoryName,
                            ],
                        ],
                    ],
                ];
            }
        }

        // 2. Duplicates
        if (preg_match('/duplicate|twice|double/i', $q)) {
            $count = $context['duplicates_count'];
            $reply = $count > 0
                ? "You have {$count} possible duplicate(s) waiting for review."
                : 'No possible duplicates right now. Transfers between your own accounts are counted once.';

            $actions = $count > 0 ? [['type' => 'navigate', 'to' => 'duplicates']] : [];
            return ['kind' => 'ok', 'reply' => $reply, 'actions' => $actions];
        }

        // 3. Balance
        if (preg_match('/balance|how much (money )?do i have|net worth|total/i', $q) && !str_contains($q, 'spen')) {
            $totalFmt = number_format($context['total_balance'], 2);
            $lines = ["Your total balance is {$sym}{$totalFmt} across " . count($context['accounts']) . ' accounts:'];
            foreach ($context['accounts'] as $acc) {
                $balFmt = number_format($acc['balance'], 2);
                $lines[] = "- {$acc['name']}: {$sym}{$balFmt}";
            }
            return ['kind' => 'ok', 'reply' => implode("\n", $lines), 'actions' => []];
        }

        // 4. Budgets
        if (preg_match('/budget|limit/i', $q)) {
            $budgets = $context['budgets'];
            if (!empty($budgets)) {
                $totalLimit = array_sum(array_column($budgets, 'amount'));
                $totalSpent = array_sum(array_column($budgets, 'spent'));
                $left = max(0.0, $totalLimit - $totalSpent);
                $pct = $totalLimit > 0 ? round(($totalSpent / $totalLimit) * 100) : 0;
                $reply = "You have {$sym}" . number_format($left, 2) . " left of {$sym}" . number_format($totalLimit, 2) . " for {$context['month_label']}. That is {$pct}% used.";
            } else {
                $reply = "You haven't set up monthly budgets for {$context['month_label']} yet.";
            }
            return [
                'kind' => 'ok',
                'reply' => $reply,
                'actions' => [['type' => 'navigate', 'to' => 'budgets']],
            ];
        }

        // 5. Bills
        if (preg_match('/bill|due|upcoming|recurring/i', $q)) {
            $bills = $context['bills'];
            if (!empty($bills)) {
                $lines = ['Next up:'];
                foreach (array_slice($bills, 0, 3) as $b) {
                    $amtFmt = number_format($b['amount'], 2);
                    $lines[] = "- {$b['name']}: {$sym}{$amtFmt} (due {$b['next_due_date']})";
                }
                $reply = implode("\n", $lines);
            } else {
                $reply = 'No upcoming bills found.';
            }
            return [
                'kind' => 'ok',
                'reply' => $reply,
                'actions' => [['type' => 'navigate', 'to' => 'bills']],
            ];
        }

        // 6. Spending
        if (preg_match('/spen[dt]|expense|cost/i', $q)) {
            $spentFmt = number_format($context['monthly_spent'], 2);
            $reply = "You spent {$sym}{$spentFmt} in {$context['month_label']}, not counting savings.";
            return ['kind' => 'ok', 'reply' => $reply, 'actions' => []];
        }

        // 7. Income
        if (preg_match('/income|earn|salary|came in/i', $q)) {
            $incFmt = number_format($context['monthly_income'], 2);
            $reply = "Income for {$context['month_label']} is {$sym}{$incFmt}.";
            return ['kind' => 'ok', 'reply' => $reply, 'actions' => []];
        }

        // Default greeting
        $userName = $user->name ? explode(' ', $user->name)[0] : 'there';
        return [
            'kind' => 'ok',
            'reply' => "Hi {$userName}, I am Mary. Ask about your balance, spending or budget, or tell me what you spent, like “spent 2,500 on lunch from OPay”. I always ask you to confirm before I save anything.",
            'actions' => [],
        ];
    }

    /**
     * Parse amount from text string supporting 'k' multipliers.
     *
     * @param string $text
     * @return float
     */
    private function parseFallbackAmount(string $text): float
    {
        if (preg_match('/(\d[\d,]*(?:\.\d+)?)\s*(k\b)?/i', $text, $matches)) {
            $raw = (float) str_replace(',', '', $matches[1]);
            return !empty($matches[2]) ? $raw * 1000 : $raw;
        }
        return 0.0;
    }

    /**
     * Build the legacy system prompt with user's financial context.
     *
     * @param User $user
     * @param array<string, mixed> $context
     * @return string
     */
    private function buildSystemPrompt(User $user, array $context): string
    {
        $currency = $context['currency'] ?? $user->currency ?? 'NGN';
        $financialSummary = $this->formatFinancialContext($user, $context, $currency);

        return <<<PROMPT
You are Pasona Assistant, an intelligent, encouraging, and accurate personal financial assistant.
You help users understand their spending, track savings, spot wasteful habits, and achieve financial security.

GUIDELINES:
1. Tone: Friendly, concise, empathetic, and actionable.
2. Structure: Use short paragraphs or clear bullet points. Keep answers within 2 to 4 concise paragraphs.
3. Currency: Always format money values using {$currency} (or the symbol ₦ if NGN, $ if USD).
4. Accuracy: Base your analysis solely on the user's financial summary and transactions provided below. Never invent transactions or balances.
5. If the user asks general financial questions, give sound financial principles (such as the 50/30/20 rule, emergency funds, paying yourself first).
6. Non-Advisory Disclaimer: Keep your advice strictly educational and budgeting-focused. You do not provide certified financial, investment, tax, or legal advice.

USER FINANCIAL DATA:
{$financialSummary}
PROMPT;
    }

    /**
     * Assemble payload messages for the OpenAI-compatible chat completion.
     *
     * @param string $systemPrompt
     * @param array<int, array{role: string, content: string}> $history
     * @param string $question
     * @return array<int, array{role: string, content: string}>
     */
    private function buildMessagesPayload(string $systemPrompt, array $history, string $question): array
    {
        $payload = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        $trimmedHistory = array_slice($history, -10);
        foreach ($trimmedHistory as $msg) {
            if (isset($msg['role'], $msg['content']) && in_array($msg['role'], ['user', 'assistant'], true)) {
                $payload[] = [
                    'role' => $msg['role'],
                    'content' => (string) $msg['content'],
                ];
            }
        }

        $payload[] = [
            'role' => 'user',
            'content' => $question,
        ];

        return $payload;
    }

    /**
     * Format financial context into a human-readable text block for the LLM.
     *
     * Anonymizes user identifiers and transaction descriptions to strictly
     * uphold the privacy policy and user disclosures.
     *
     * @param User $user
     * @param array<string, mixed> $context
     * @param string $currency
     * @return string
     */
    private function formatFinancialContext(User $user, array $context, string $currency): string
    {
        $lines = ["- Preferred Currency: {$currency}"];

        if (!empty($context['summary']) && is_array($context['summary'])) {
            $sum = $context['summary'];
            if (isset($sum['net_balance'])) {
                $lines[] = "- Current Net Balance: " . number_format((float) $sum['net_balance'], 2) . " {$currency}";
            }
            if (isset($sum['monthly_income'])) {
                $lines[] = "- Monthly Income (This Month): " . number_format((float) $sum['monthly_income'], 2) . " {$currency}";
            }
            if (isset($sum['monthly_expense'])) {
                $lines[] = "- Monthly Expenses (This Month): " . number_format((float) $sum['monthly_expense'], 2) . " {$currency}";
            }
        }

        if (!empty($context['accounts']) && is_array($context['accounts'])) {
            $lines[] = "- Accounts:";
            foreach (array_slice($context['accounts'], 0, 10) as $acc) {
                if (is_array($acc)) {
                    $name = $acc['name'] ?? 'Account';
                    $type = $acc['type'] ?? 'wallet';
                    $bal = isset($acc['balance']) ? number_format((float) $acc['balance'], 2) : '0.00';
                    $lines[] = "  * {$name} ({$type}): {$bal} {$currency}";
                }
            }
        }

        // Format recent transactions (Anonymized: omit descriptions & references per privacy policy)
        if (!empty($context['transactions']) && is_array($context['transactions'])) {
            $lines[] = "- Recent Transactions (up to 30, anonymized categories):";
            foreach (array_slice($context['transactions'], 0, 30) as $tx) {
                if (is_array($tx)) {
                    $date = $tx['transaction_date'] ?? ($tx['date'] ?? '');
                    $type = $tx['type'] ?? 'expense';
                    $amount = isset($tx['amount']) ? number_format((float) $tx['amount'], 2) : '0.00';
                    $category = is_array($tx['category'] ?? null) ? ($tx['category']['name'] ?? '') : ($tx['category_name'] ?? '');
                    $catStr = $category ?: 'General';
                    $lines[] = "  * {$date} | Category: {$catStr} | {$type}: {$amount} {$currency}";
                }
            }
        }

        return implode("\n", $lines);
    }

    /**
     * Dispatch HTTP call to Groq and parse the response.
     *
     * @param string $apiKey
     * @param array<int, array{role: string, content: string}> $messages
     * @param string $question
     * @return array<string, mixed>
     */
    private function callGroq(string $apiKey, array $messages, string $question): array
    {
        $model = config('services.groq.model', 'qwen/qwen3.8-27b');

        try {
            $response = Http::withToken($apiKey)
                ->timeout(self::REQUEST_TIMEOUT_SECONDS)
                ->post(self::GROQ_API_URL, [
                    'model' => $model,
                    'messages' => $messages,
                    'max_tokens' => self::MAX_RESPONSE_TOKENS,
                    'temperature' => 0.6,
                ]);

            if ($response->successful()) {
                $answer = trim((string) $response->json('choices.0.message.content'));
                return [
                    'kind' => 'ok',
                    'answer' => $answer,
                    'question' => $question,
                    'generatedAt' => Carbon::now()->toIso8601String(),
                ];
            }

            Log::error('Groq API error response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'kind' => 'error',
                'message' => 'The AI service encountered an error. Please try again.',
                'retryable' => true,
            ];
        } catch (\Throwable $e) {
            Log::error('Groq API connection exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'kind' => 'error',
                'message' => 'Unable to connect to the AI service. Please check your connection and try again.',
                'retryable' => true,
            ];
        }
    }
}
