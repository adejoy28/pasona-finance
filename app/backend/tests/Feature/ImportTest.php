<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_check_returns_tuples_for_account_and_date_range(): void
    {
        $user = User::factory()->create();

        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Main Checking',
            'type' => 'bank',
            'currency' => 'NGN',
            'starting_balance' => 0,
        ]);

        // In range
        Transaction::create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'transaction_date' => '2026-06-05',
            'type' => 'expense',
            'amount' => 3500.50,
            'description' => 'Groceries',
            'reference' => 'REF-001',
        ]);

        // Out of range (earlier)
        Transaction::create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'transaction_date' => '2026-05-20',
            'type' => 'income',
            'amount' => 50000,
            'description' => 'May Bonus',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/import/check', [
                'account_id' => $account->id,
                'date_from' => '2026-06-01',
                'date_to' => '2026-06-30',
            ]);

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertExactJson([
                [
                    'date' => '2026-06-05',
                    'type' => 'expense',
                    'amount' => 3500.50,
                    'reference' => 'REF-001',
                ],
            ]);
    }

    public function test_import_check_validates_account_ownership(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $otherAccount = Account::create([
            'user_id' => $otherUser->id,
            'name' => 'Other Account',
            'type' => 'bank',
            'currency' => 'NGN',
            'starting_balance' => 0,
        ]);

        $this->actingAs($user)
            ->postJson('/api/import/check', [
                'account_id' => $otherAccount->id,
                'date_from' => '2026-06-01',
                'date_to' => '2026-06-30',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['account_id']);
    }

    public function test_import_store_requires_uuid_and_stamps_import_batch_id(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Main Checking',
            'type' => 'bank',
            'currency' => 'NGN',
            'starting_balance' => 0,
        ]);

        $batchId = 'batch-uuid-12345';
        $rowUuid = 'row-uuid-001';

        $response = $this->actingAs($user)
            ->postJson('/api/import/store', [
                'import_batch_id' => $batchId,
                'transactions' => [
                    [
                        'uuid' => $rowUuid,
                        'account_id' => $account->id,
                        'transaction_date' => '2026-06-10',
                        'amount' => 12000,
                        'type' => 'expense',
                        'description' => 'Electricity Bill',
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'imported_count' => 1,
                'skipped_count' => 0,
                'import_batch_id' => $batchId,
            ]);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'uuid' => $rowUuid,
            'import_batch_id' => $batchId,
            'amount' => 12000,
        ]);
    }

    public function test_import_store_skips_existing_user_uuid_without_error(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Main Checking',
            'type' => 'bank',
            'currency' => 'NGN',
            'starting_balance' => 0,
        ]);

        // Pre-existing row with uuid-aaa
        Transaction::create([
            'user_id' => $user->id,
            'uuid' => 'uuid-aaa',
            'account_id' => $account->id,
            'transaction_date' => '2026-06-10',
            'amount' => 500,
            'type' => 'expense',
            'description' => 'Existing Coffee',
        ]);

        // Send a batch with uuid-aaa and new uuid-bbb
        $response = $this->actingAs($user)
            ->postJson('/api/import/store', [
                'import_batch_id' => 'batch-retry-001',
                'transactions' => [
                    [
                        'uuid' => 'uuid-aaa',
                        'account_id' => $account->id,
                        'transaction_date' => '2026-06-10',
                        'amount' => 500,
                        'type' => 'expense',
                        'description' => 'Existing Coffee',
                    ],
                    [
                        'uuid' => 'uuid-bbb',
                        'account_id' => $account->id,
                        'transaction_date' => '2026-06-11',
                        'amount' => 750,
                        'type' => 'expense',
                        'description' => 'Lunch',
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'imported_count' => 1,
                'skipped_count' => 1,
            ]);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'uuid' => 'uuid-bbb',
        ]);
    }

    public function test_import_batches_undo_soft_deletes_batch_transactions(): void
    {
        $user = User::factory()->create();

        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Main Checking',
            'type' => 'bank',
            'currency' => 'NGN',
            'starting_balance' => 0,
        ]);

        $targetBatch = 'batch-target-999';
        $otherBatch = 'batch-keep-111';

        $tx1 = Transaction::create([
            'user_id' => $user->id,
            'uuid' => 'uuid-tx1',
            'import_batch_id' => $targetBatch,
            'account_id' => $account->id,
            'transaction_date' => '2026-06-15',
            'amount' => 1000,
            'type' => 'expense',
        ]);

        $tx2 = Transaction::create([
            'user_id' => $user->id,
            'uuid' => 'uuid-tx2',
            'import_batch_id' => $targetBatch,
            'account_id' => $account->id,
            'transaction_date' => '2026-06-16',
            'amount' => 2000,
            'type' => 'income',
        ]);

        $txOther = Transaction::create([
            'user_id' => $user->id,
            'uuid' => 'uuid-other',
            'import_batch_id' => $otherBatch,
            'account_id' => $account->id,
            'transaction_date' => '2026-06-17',
            'amount' => 3000,
            'type' => 'expense',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/import/batches/{$targetBatch}/undo");

        $response->assertOk()
            ->assertJson([
                'message' => 'Successfully reverted 2 imported transactions.',
                'deleted_count' => 2,
            ]);

        $this->assertSoftDeleted('transactions', ['id' => $tx1->id]);
        $this->assertSoftDeleted('transactions', ['id' => $tx2->id]);
        $this->assertNotSoftDeleted('transactions', ['id' => $txOther->id]);
    }

    public function test_import_store_handles_sparse_keys_and_optional_fields_consistently(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $accountA = Account::create([
            'user_id' => $user->id,
            'name' => 'Account A',
            'type' => 'bank',
            'currency' => 'NGN',
            'starting_balance' => 0,
        ]);

        $accountB = Account::create([
            'user_id' => $user->id,
            'name' => 'Account B',
            'type' => 'bank',
            'currency' => 'NGN',
            'starting_balance' => 0,
        ]);

        $category = $user->categories()->where('type', 'expense')->first();

        $response = $this->actingAs($user)
            ->postJson('/api/import/store', [
                'import_batch_id' => 'batch-sparse-keys',
                'transactions' => [
                    // Row 0: has category_id and reference
                    [
                        'uuid' => 'row-sparse-1',
                        'account_id' => $accountA->id,
                        'transaction_date' => '2026-06-10',
                        'amount' => 1500,
                        'type' => 'expense',
                        'category_id' => $category->id,
                        'reference' => 'REF-001',
                    ],
                    // Row 1: missing category_id and reference (sparse keys)
                    [
                        'uuid' => 'row-sparse-2',
                        'account_id' => $accountA->id,
                        'transaction_date' => '2026-06-11',
                        'amount' => 2000,
                        'type' => 'income',
                    ],
                    // Row 2: transfer with to_account_id
                    [
                        'uuid' => 'row-sparse-3',
                        'account_id' => $accountA->id,
                        'to_account_id' => $accountB->id,
                        'transaction_date' => '2026-06-12',
                        'amount' => 5000,
                        'type' => 'transfer',
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'imported_count' => 3,
                'skipped_count' => 0,
            ]);

        $this->assertDatabaseHas('transactions', [
            'uuid' => 'row-sparse-1',
            'category_id' => $category->id,
            'reference' => 'REF-001',
        ]);
        $this->assertDatabaseHas('transactions', [
            'uuid' => 'row-sparse-2',
            'category_id' => null,
            'reference' => null,
        ]);
        $this->assertDatabaseHas('transactions', [
            'uuid' => 'row-sparse-3',
            'to_account_id' => $accountB->id,
            'category_id' => null,
        ]);
    }
}
