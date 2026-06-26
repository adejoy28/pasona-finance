<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_transactions_cannot_use_another_users_category(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Main Wallet',
            'type' => 'mobile',
            'currency' => 'NGN',
            'starting_balance' => 0,
        ]);

        $otherCategory = Category::create([
            'user_id' => $otherUser->id,
            'name' => 'Other Food',
            'type' => 'expense',
        ]);

        $this->actingAs($user)
            ->postJson('/api/transactions', [
                'account_id' => $account->id,
                'type' => 'expense',
                'category_id' => $otherCategory->id,
                'amount' => 500,
                'transaction_date' => '2026-06-25',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }

    public function test_account_balances_ignore_soft_deleted_transactions(): void
    {
        $user = User::factory()->create();

        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Cash',
            'type' => 'cash',
            'currency' => 'NGN',
            'starting_balance' => 100,
        ]);

        Transaction::create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'type' => 'income',
            'amount' => 50,
            'transaction_date' => '2026-06-25',
        ]);

        $deleted = Transaction::create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'type' => 'expense',
            'amount' => 20,
            'transaction_date' => '2026-06-25',
        ]);
        $deleted->delete();

        $this->assertSame(150.0, $account->fresh()->balance);
        $this->assertSame(150.0, Account::balancesFor($user->id, [$account->id])[$account->id]);
    }

    public function test_deleting_account_soft_deletes_source_and_received_transfer_transactions(): void
    {
        $user = User::factory()->create();

        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Opay',
            'type' => 'mobile',
            'currency' => 'NGN',
            'starting_balance' => 0,
        ]);

        $otherAccount = Account::create([
            'user_id' => $user->id,
            'name' => 'Kuda',
            'type' => 'bank',
            'currency' => 'NGN',
            'starting_balance' => 0,
        ]);

        $sourceTransaction = Transaction::create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'type' => 'expense',
            'amount' => 100,
            'transaction_date' => '2026-06-25',
        ]);

        $receivedTransfer = Transaction::create([
            'user_id' => $user->id,
            'account_id' => $otherAccount->id,
            'to_account_id' => $account->id,
            'type' => 'transfer',
            'amount' => 250,
            'transaction_date' => '2026-06-25',
        ]);

        $this->actingAs($user)
            ->deleteJson("/api/accounts/{$account->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('accounts', ['id' => $account->id]);
        $this->assertSoftDeleted('transactions', ['id' => $sourceTransaction->id]);
        $this->assertSoftDeleted('transactions', ['id' => $receivedTransfer->id]);
    }
}
