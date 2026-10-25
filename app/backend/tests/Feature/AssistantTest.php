<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AssistantTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_assistant_requests_are_blocked(): void
    {
        $this->postJson('/api/assistant/message', ['message' => 'Hello'])
            ->assertStatus(401);
    }

    public function test_assistant_returns_fallback_draft_when_groq_key_missing(): void
    {
        Config::set('services.groq.api_key', null);

        $user = User::factory()->create();
        Account::create([
            'user_id' => $user->id,
            'name' => 'OPay',
            'type' => 'mobile',
            'currency' => 'NGN',
            'starting_balance' => 15000,
        ]);
        Category::create([
            'user_id' => $user->id,
            'name' => 'Food & Dining',
            'type' => 'expense',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/assistant/message', [
                'message' => 'Spent 2,500 on lunch from OPay',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'kind' => 'ok',
            ]);

        $data = $response->json();
        $this->assertNotEmpty($data['reply']);
        $this->assertNotEmpty($data['actions']);
        $this->assertEquals('propose_transaction', $data['actions'][0]['type']);
        $this->assertEquals(2500, $data['actions'][0]['draft']['amount']);
        $this->assertEquals('expense', $data['actions'][0]['draft']['kind']);
        $this->assertEquals('OPay', $data['actions'][0]['draft']['account']);
    }

    public function test_assistant_answers_balance_with_fallback_when_groq_key_missing(): void
    {
        Config::set('services.groq.api_key', null);

        $user = User::factory()->create();
        Account::create([
            'user_id' => $user->id,
            'name' => 'Access Bank',
            'type' => 'bank',
            'currency' => 'NGN',
            'starting_balance' => 50000,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/assistant/message', [
                'message' => 'What is my total balance?',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'kind' => 'ok',
            ]);

        $this->assertStringContainsString('Access Bank', $response->json('reply'));
    }

    public function test_assistant_handles_groq_tool_calls_successfully(): void
    {
        Config::set('services.groq.api_key', 'gsk_dummy_test_key');

        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'role' => 'assistant',
                            'content' => 'Here is the draft for lunch from OPay. Please check and confirm.',
                            'tool_calls' => [
                                [
                                    'id' => 'call_123',
                                    'type' => 'function',
                                    'function' => [
                                        'name' => 'propose_transaction',
                                        'arguments' => json_encode([
                                            'amount' => 2500,
                                            'kind' => 'expense',
                                            'description' => 'lunch',
                                            'account' => 'OPay',
                                            'category' => 'Food & Dining',
                                        ]),
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        Account::create([
            'user_id' => $user->id,
            'name' => 'OPay',
            'type' => 'mobile',
            'currency' => 'NGN',
            'starting_balance' => 15000,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/assistant/message', [
                'message' => 'Spent 2,500 on lunch from OPay',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'kind' => 'ok',
                'reply' => 'Here is the draft for lunch from OPay. Please check and confirm.',
                'actions' => [
                    [
                        'type' => 'propose_transaction',
                        'draft' => [
                            'amount' => 2500,
                            'kind' => 'expense',
                            'description' => 'lunch',
                            'account' => 'OPay',
                            'category' => 'Food & Dining',
                        ],
                    ],
                ],
            ]);
    }

    public function test_assistant_rate_limiting(): void
    {
        Config::set('services.groq.api_key', null);

        $user = User::factory()->create();

        // 20 requests per minute allowed
        for ($i = 0; $i < 20; $i++) {
            $this->actingAs($user)
                ->postJson('/api/assistant/message', ['message' => 'Hello'])
                ->assertStatus(200);
        }

        // 21st request should be throttled (429)
        $this->actingAs($user)
            ->postJson('/api/assistant/message', ['message' => 'Hello again'])
            ->assertStatus(429);
    }
}
