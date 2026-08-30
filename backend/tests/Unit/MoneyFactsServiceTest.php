<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\MoneyFactsService;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class MoneyFactsServiceTest extends TestCase
{
    private MoneyFactsService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new MoneyFactsService();
    }

    public function test_facts_catalog_is_rich_and_well_structured(): void
    {
        $this->assertGreaterThanOrEqual(30, count(MoneyFactsService::FACTS));

        foreach (MoneyFactsService::FACTS as $item) {
            $this->assertArrayHasKey('category', $item);
            $this->assertArrayHasKey('title', $item);
            $this->assertArrayHasKey('fact', $item);
            $this->assertArrayHasKey('take', $item);
            $this->assertNotEmpty($item['title']);
            $this->assertNotEmpty($item['fact']);
            $this->assertNotEmpty($item['take']);
        }
    }

    public function test_get_daily_fact_returns_consistent_fact_for_same_day_and_user(): void
    {
        $user = new User(['id' => 42, 'name' => 'Jane Doe', 'timezone' => 'Africa/Lagos']);
        $user->id = 42;
        $date = Carbon::parse('2026-06-15 12:00:00', 'Africa/Lagos');

        $fact1 = $this->service->getDailyFact($user, $date);
        $fact2 = $this->service->getDailyFact($user, $date);

        $this->assertSame($fact1['title'], $fact2['title']);
    }

    public function test_get_daily_fact_rotates_across_consecutive_days(): void
    {
        $user = new User(['id' => 1, 'name' => 'John', 'timezone' => 'Africa/Lagos']);
        $user->id = 1;

        $day1 = Carbon::parse('2026-06-15', 'Africa/Lagos');
        $day2 = Carbon::parse('2026-06-16', 'Africa/Lagos');

        $factDay1 = $this->service->getDailyFact($user, $day1);
        $factDay2 = $this->service->getDailyFact($user, $day2);

        $this->assertNotSame($factDay1['title'], $factDay2['title']);
    }

    public function test_get_dynamic_copy_includes_streak_when_active(): void
    {
        $user = new User(['id' => 7, 'name' => 'Adebayo', 'timezone' => 'Africa/Lagos', 'reminder_time' => '20:30']);
        $user->id = 7;
        $date = Carbon::parse('2026-06-15', 'Africa/Lagos'); // Monday

        $copy = $this->service->getDynamicCopy($user, $date, false, 5, 0.0);

        $this->assertStringContainsString('5-day', $copy['headline']);
        $this->assertStringContainsString('5-Day', $copy['pushTitle']);
    }

    public function test_get_dynamic_copy_for_logged_today_user(): void
    {
        $user = new User(['id' => 10, 'name' => 'Chioma', 'timezone' => 'Africa/Lagos']);
        $user->id = 10;
        $date = Carbon::parse('2026-06-15', 'Africa/Lagos');

        $copy = $this->service->getDynamicCopy($user, $date, true, 3, 14500.0);

        $this->assertNotEmpty($copy['subject']);
        $this->assertNotEmpty($copy['headline']);
        $this->assertNotEmpty($copy['pushTitle']);
    }
}
