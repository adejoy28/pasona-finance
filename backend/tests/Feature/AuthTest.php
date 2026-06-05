<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ── Register ──────────────────────────────────────────────

    public function test_register_returns_token_and_user(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'user' => ['id', 'name', 'email'],
            ])
            ->assertJsonPath('token_type', 'Bearer');

        $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'john@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_register_fails_with_short_password(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_register_fails_when_password_not_confirmed(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    // ── Login ─────────────────────────────────────────────────

    public function test_login_returns_token_for_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'user' => ['id', 'name', 'email'],
            ]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_fails_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nobody@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    // ── Logout ────────────────────────────────────────────────

    public function test_logout_deletes_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth_token')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertStatus(200);

        // Token should be gone — subsequent request must 401
        $this->withToken($token)
            ->getJson('/api/me')
            ->assertStatus(401);
    }

    public function test_logout_requires_authentication(): void
    {
        $this->postJson('/api/logout')
            ->assertStatus(401);
    }

    // ── Me ────────────────────────────────────────────────────

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/me')
            ->assertStatus(200)
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('email', $user->email);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/me')
            ->assertStatus(401);
    }

    // ── Check Email ───────────────────────────────────────────

    public function test_check_email_returns_unavailable_for_existing_email(): void
    {
        $email = 'john'.'@'.'example.com';
        User::factory()->create(['email' => $email]);

        $this->getJson('/api/auth/check-email?email='.urlencode($email))
            ->assertStatus(200)
            ->assertExactJson(['available' => false]);
    }

    public function test_check_email_returns_available_for_unknown_email(): void
    {
        $email = 'ada'.'@'.'example.com';

        $this->getJson('/api/auth/check-email?email='.urlencode($email))
            ->assertStatus(200)
            ->assertExactJson(['available' => true]);
    }

    public function test_check_email_normalises_case_and_whitespace(): void
    {
        $stored = 'john'.'@'.'example.com';
        User::factory()->create(['email' => $stored]);

        // Casing and surrounding whitespace must not bypass the check.
        $probe = '  JOHN@Example.com  ';
        $this->getJson('/api/auth/check-email?email='.urlencode($probe))
            ->assertStatus(200)
            ->assertExactJson(['available' => false]);
    }

    public function test_check_email_rejects_missing_email(): void
    {
        $this->getJson('/api/auth/check-email')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_check_email_rejects_malformed_email(): void
    {
        $this->getJson('/api/auth/check-email?email=not-an-email')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_check_email_is_throttled(): void
    {
        // 30/min is the configured cap; the 31st request must 429.
        $domain = '@example.com';
        for ($i = 0; $i < 30; $i++) {
            $this->getJson('/api/auth/check-email?email=user'.$i.$domain)
                ->assertStatus(200);
        }

        $this->getJson('/api/auth/check-email?email=blocked'.$domain)
            ->assertStatus(429);
    }
}
