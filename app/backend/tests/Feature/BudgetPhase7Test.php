<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Budget;
use App\Models\Category;
use App\Models\Goal;
use App\Models\RecurringBill;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BudgetPhase7Test extends TestCase
{
    use RefreshDatabase;

    public function test_budget_upsert_and_copy_previous()
    {
        $user = User::factory()->create();
        $catFood = Category::firstOrCreate(['user_id' => $user->id, 'name' => 'Food'], ['type' => 'expense']);
        $catRent = Category::firstOrCreate(['user_id' => $user->id, 'name' => 'Rent'], ['type' => 'expense']);

        // 1. Upsert single budget
        $res = $this->actingAs($user)->postJson('/api/budgets', [
            'month' => '2026-08',
            'category_id' => $catFood->id,
            'limit_amount' => 50000,
        ]);
        $res->assertStatus(200);

        // 2. Bulk upsert
        $res2 = $this->actingAs($user)->postJson('/api/budgets', [
            'month' => '2026-08',
            'budgets' => [
                ['category_id' => $catFood->id, 'limit_amount' => 45000],
                ['category_id' => $catRent->id, 'limit_amount' => 150000],
            ],
        ]);
        $res2->assertStatus(200);

        // Verify index
        $indexRes = $this->actingAs($user)->getJson('/api/budgets?month=2026-08');
        $indexRes->assertStatus(200)
            ->assertJsonPath('summary.planned', 195000);

        // 3. Copy previous month to next month
        $copyRes = $this->actingAs($user)->postJson('/api/budgets/copy-previous', [
            'target_month' => '2026-09',
            'source_month' => '2026-08',
        ]);
        $copyRes->assertStatus(200)->assertJsonPath('count', 2);

        $nextMonthRes = $this->actingAs($user)->getJson('/api/budgets?month=2026-09');
        $nextMonthRes->assertStatus(200)
            ->assertJsonPath('summary.planned', 195000);
    }

    public function test_goal_creation_and_contribution()
    {
        $user = User::factory()->create();
        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Bank Account',
            'type' => 'bank',
            'currency' => 'NGN',
            'starting_balance' => 200000,
        ]);

        $futureDate = Carbon::now()->addMonths(6)->format('Y-m-d');

        // Create goal
        $res = $this->actingAs($user)->postJson('/api/goals', [
            'name' => 'New Laptop',
            'target_amount' => 450000,
            'target_date' => $futureDate,
            'account_id' => $account->id,
            'color' => '#2a78d6',
        ]);
        $res->assertStatus(201);
        $goalId = $res->json('id');

        // Contribute to goal
        $contribRes = $this->actingAs($user)->postJson("/api/goals/{$goalId}/contribute", [
            'amount' => 50000,
            'account_id' => $account->id,
        ]);
        $contribRes->assertStatus(200);

        $goal = Goal::find($goalId);
        $this->assertEquals(50000, (float)$goal->saved_amount);

        // Verify transaction created
        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'account_id' => $account->id,
            'type' => 'expense',
            'amount' => 50000,
            'description' => 'Saving: New Laptop',
        ]);
    }

    public function test_recurring_bill_creation_and_mark_paid()
    {
        $user = User::factory()->create();
        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'OPay Wallet',
            'type' => 'mobile',
            'currency' => 'NGN',
            'starting_balance' => 50000,
        ]);
        $cat = Category::firstOrCreate([
            'user_id' => $user->id,
            'name' => 'Utilities',
        ], [
            'type' => 'expense',
        ]);

        $nextDue = Carbon::now()->addDays(5)->format('Y-m-d');

        // Create recurring bill
        $res = $this->actingAs($user)->postJson('/api/recurring-bills', [
            'name' => 'Internet Subscription',
            'amount' => 15000,
            'type' => 'expense',
            'account_id' => $account->id,
            'category_id' => $cat->id,
            'frequency' => 'monthly',
            'next_due' => $nextDue,
        ]);
        $res->assertStatus(201);
        $billId = $res->json('id');

        // Mark paid
        $paidRes = $this->actingAs($user)->postJson("/api/recurring-bills/{$billId}/mark-paid");
        $paidRes->assertStatus(200);

        // Transaction recorded
        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'amount' => 15000,
            'description' => 'Internet Subscription',
        ]);

        // Next due date advanced by 1 month
        $bill = RecurringBill::find($billId);
        $expectedNext = Carbon::parse($nextDue)->addMonth()->format('Y-m-d');
        $this->assertEquals($expectedNext, $bill->next_due->format('Y-m-d'));
    }

    public function test_user_cannot_access_or_modify_other_users_budget_resources()
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $goalB = Goal::create([
            'user_id' => $userB->id,
            'name' => 'Secret Car',
            'target_amount' => 1000000,
            'saved_amount' => 0,
            'target_date' => Carbon::now()->addYear()->format('Y-m-d'),
        ]);

        $billB = RecurringBill::create([
            'user_id' => $userB->id,
            'name' => 'Secret Bill',
            'amount' => 20000,
            'type' => 'expense',
            'frequency' => 'monthly',
            'next_due' => Carbon::now()->addDays(3)->format('Y-m-d'),
        ]);

        // User A cannot update Goal B
        $this->actingAs($userA)->putJson("/api/goals/{$goalB->id}", ['name' => 'Hacked'])
            ->assertStatus(403);

        // User A cannot delete Bill B
        $this->actingAs($userA)->deleteJson("/api/recurring-bills/{$billB->id}")
            ->assertStatus(403);
    }
}
