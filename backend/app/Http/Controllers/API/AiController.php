<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\AiChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * AiController
 *
 * Exposes AI Chat and Insights endpoints powered by Groq.
 */
class AiController extends Controller
{
    public function __construct(
        protected AiChatService $aiService
    ) {}

    /**
     * Handle multi-turn chat with the AI financial assistant.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question'     => ['required', 'string', 'min:1', 'max:1000'],
            'messages'     => ['nullable', 'array'],
            'messages.*.role'    => ['required_with:messages', 'string', 'in:user,assistant'],
            'messages.*.content' => ['required_with:messages', 'string', 'max:5000'],
            'summary'      => ['nullable', 'array'],
            'accounts'     => ['nullable', 'array'],
            'transactions' => ['nullable', 'array'],
            'currency'     => ['nullable', 'string', 'max:10'],
        ]);

        $user = $request->user();
        $context = $this->resolveContext($user, $validated);

        $result = $this->aiService->chat(
            $user,
            $validated['question'],
            $validated['messages'] ?? [],
            $context
        );

        return response()->json($result);
    }

    /**
     * Generate a single-turn insight based on current financial data.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function insights(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question'     => ['required', 'string', 'min:1', 'max:1000'],
            'summary'      => ['nullable', 'array'],
            'accounts'     => ['nullable', 'array'],
            'transactions' => ['nullable', 'array'],
            'currency'     => ['nullable', 'string', 'max:10'],
        ]);

        $user = $request->user();
        $context = $this->resolveContext($user, $validated);

        $result = $this->aiService->insights(
            $user,
            $validated['question'],
            $context
        );

        return response()->json($result);
    }

    /**
     * Resolve financial context, querying database records for the authenticated user
     * to guarantee data isolation and privacy.
     *
     * @param \App\Models\User $user
     * @param array<string, mixed> $validated
     * @return array<string, mixed>
     */
    private function resolveContext($user, array $validated): array
    {
        // Authoritative accounts from DB
        $accounts = $user->accounts()->select(['id', 'name', 'type', 'currency'])->get()->toArray();

        // Authoritative recent transactions (sanitized: no descriptions or references)
        $transactions = $user->transactions()
            ->with('category:id,name')
            ->latest('transaction_date')
            ->limit(30)
            ->get(['id', 'category_id', 'type', 'amount', 'transaction_date'])
            ->toArray();

        return [
            'summary'      => $validated['summary'] ?? null,
            'accounts'     => $accounts,
            'transactions' => $transactions,
            'currency'     => $validated['currency'] ?? $user->currency ?? 'NGN',
        ];
    }
}
