<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\AiChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * AssistantController
 *
 * Implements Phase 9b (Mary AI assistant) message endpoint.
 * Accepts user queries, processes financial tools / LLM completions,
 * and returns replies with proposed transaction drafts and actions.
 */
class AssistantController extends Controller
{
    public function __construct(
        protected AiChatService $aiService
    ) {}

    /**
     * Handle incoming assistant messages.
     * Rate limited to 20 requests per minute per user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function message(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message'         => ['required', 'string', 'min:1', 'max:1000'],
            'context'         => ['nullable', 'array'],
            'context.month'   => ['nullable', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'context.history' => ['nullable', 'array'],
            'context.history.*.role'    => ['required_with:context.history', 'string', 'in:user,assistant'],
            'context.history.*.content' => ['required_with:context.history', 'string', 'max:5000'],
        ]);

        $user = $request->user();
        $message = trim($validated['message']);
        $month = $validated['context']['month'] ?? null;
        $history = $validated['context']['history'] ?? [];

        $result = $this->aiService->assistantMessage(
            $user,
            $message,
            $history,
            $month
        );

        // Minimal logging per spec: log count without storing transaction details
        $actionCount = count($result['actions'] ?? []);
        Log::info('Assistant message processed', [
            'user_id' => $user->id,
            'actions_count' => $actionCount,
        ]);

        return response()->json($result);
    }
}
