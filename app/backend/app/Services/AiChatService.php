<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AiChatService
 *
 * Handles prompting and communication with the Groq API (OpenAI-compatible)
 * for personal finance Q&A and proactive insights.
 */
class AiChatService
{
    private const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    private const REQUEST_TIMEOUT_SECONDS = 25;
    private const MAX_RESPONSE_TOKENS = 1024;

    /**
     * Handle a multi-turn chat conversation.
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
     * Build the system prompt with user's financial context.
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

        // Include recent history (up to last 10 messages)
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
     * @param User $user
     * @param array<string, mixed> $context
     * @param string $currency
     * @return string
     */
    private function formatFinancialContext(User $user, array $context, string $currency): string
    {
        $lines = ["- User Name: {$user->name}", "- Preferred Currency: {$currency}"];

        // Format summary if provided
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

        // Format accounts
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

        // Format recent transactions
        if (!empty($context['transactions']) && is_array($context['transactions'])) {
            $lines[] = "- Recent Transactions (up to 30):";
            foreach (array_slice($context['transactions'], 0, 30) as $tx) {
                if (is_array($tx)) {
                    $date = $tx['transaction_date'] ?? ($tx['date'] ?? '');
                    $desc = $tx['description'] ?? ($tx['notes'] ?? 'Transaction');
                    $type = $tx['type'] ?? 'expense';
                    $amount = isset($tx['amount']) ? number_format((float) $tx['amount'], 2) : '0.00';
                    $category = is_array($tx['category'] ?? null) ? ($tx['category']['name'] ?? '') : ($tx['category_name'] ?? '');
                    $catStr = $category ? " [{$category}]" : '';
                    $lines[] = "  * {$date} | {$desc}{$catStr} | {$type}: {$amount} {$currency}";
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
