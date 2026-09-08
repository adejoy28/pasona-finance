<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_requests_are_blocked(): void
    {
        $this->postJson('/api/ai/chat', ['question' => 'How can I save money?'])
            ->assertStatus(401);

        $this->postJson('/api/ai/insights', ['question' => 'Review my budget'])
            ->assertStatus(401);
    }

    public function test_ai_chat_returns_not_configured_when_groq_api_key_missing(): void
    {
        Config::set('services.groq.api_key', null);

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/ai/chat', [
                'question' => 'How can I save money?',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'kind' => 'not_configured',
            ]);
    }

    public function test_ai_chat_returns_ok_when_groq_responds_successfully(): void
    {
        Config::set('services.groq.api_key', 'gsk_dummy_test_key');

        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'role' => 'assistant',
                            'content' => 'Based on your accounts, you have good cash reserves. Consider setting aside 20% into savings.',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        Account::create([
            'user_id' => $user->id,
            'name' => 'Salary Account',
            'type' => 'bank',
            'currency' => 'NGN',
            'starting_balance' => 50000,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/ai/chat', [
                'question' => 'How am I doing overall?',
                'messages' => [
                    ['role' => 'user', 'content' => 'Hello'],
                    ['role' => 'assistant', 'content' => 'Hi! How can I help with your finances?'],
                ],
                'currency' => 'NGN',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'kind' => 'ok',
                'question' => 'How am I doing overall?',
                'answer' => 'Based on your accounts, you have good cash reserves. Consider setting aside 20% into savings.',
            ]);
    }

    public function test_ai_insights_returns_ok_when_groq_responds(): void
    {
        Config::set('services.groq.api_key', 'gsk_dummy_test_key');

        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'role' => 'assistant',
                            'content' => 'Your monthly expenses are well balanced against your income.',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/ai/insights', [
                'question' => 'Am I saving enough this month?',
                'summary' => [
                    'monthly_income' => 200000,
                    'monthly_expense' => 80000,
                    'net_balance' => 120000,
                ],
                'currency' => 'NGN',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'kind' => 'ok',
                'question' => 'Am I saving enough this month?',
                'answer' => 'Your monthly expenses are well balanced against your income.',
            ]);
    }

    public function test_ai_chat_handles_groq_error_gracefully(): void
    {
        Config::set('services.groq.api_key', 'gsk_dummy_test_key');

        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response('Rate limit exceeded', 429),
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/ai/chat', [
                'question' => 'How can I budget better?',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'kind' => 'error',
                'retryable' => true,
            ]);
    }
}
