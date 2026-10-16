<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Laravel\Sanctum\HasApiTokens;

/**
 * User Model
 *
 * Represents a user of the finance tracker. Each user owns their own accounts,
 * categories, and transactions.
 *
 * Implements MustVerifyEmail so Laravel auto-sends the
 * {@see VerifyEmailNotification} on register, but no global
 * "ensure-verified" middleware is applied to the API: only the
 * "sensitive" routes (CSV import, transaction sync) require it. The
 * SPA can call /api/email/verification-status to render a dismissible
 * banner for unverified users.
 */
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'avatar',
        'reminder_time',
        'reminder_frequency',
        'marketing_opt_in',
        'timezone',
        'currency',
        'reminder_announced_at',
        'streak_notified_at',
    ];

    /**
     * Model-level defaults applied for every new User instance.
     */
    protected $attributes = [
        'reminder_time'      => '21:10',
        'reminder_frequency' => 'daily',
        'marketing_opt_in'   => true,
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'      => 'datetime',
            'reminder_last_sent_at'  => 'datetime',
            'reminder_announced_at'  => 'datetime',
            'streak_notified_at'     => 'datetime',
            'marketing_opt_in'       => 'boolean',
            'password'               => 'hashed',
        ];
    }

    /**
     * Calculate the user's consecutive day logging streak.
     */
    public function calculateStreak(): int
    {
        $tz = $this->timezone ?: 'Africa/Lagos';
        $today = \Illuminate\Support\Carbon::now($tz)->startOfDay();

        $dates = $this->transactions()
            ->selectRaw('DATE(transaction_date) as tx_date')
            ->whereNotNull('transaction_date')
            ->distinct()
            ->orderByDesc('tx_date')
            ->limit(60)
            ->pluck('tx_date')
            ->map(fn ($d) => \Illuminate\Support\Carbon::parse($d, $tz)->startOfDay())
            ->values();

        if ($dates->isEmpty()) {
            return 0;
        }

        $streak = 0;
        $checkDate = $today->copy();

        if (! $dates->contains(fn ($d) => $d->equalTo($today))) {
            $checkDate->subDay();
        }

        while ($dates->contains(fn ($d) => $d->equalTo($checkDate))) {
            $streak++;
            $checkDate->subDay();
        }

        return $streak;
    }

    /**
     * Get all financial accounts owned by the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function accounts()
    {
        return $this->hasMany(Account::class);
    }

    public function pushSubscriptions()
    {
        return $this->hasMany(PushSubscription::class);
    }

    public function appNotifications()
    {
        return $this->hasMany(AppNotification::class);
    }

    /**
     * Get all custom categories created by the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    /**
     * Get all transactions logged by the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Send the password reset notification using our app's notification
     * (which builds a frontend URL rather than the default web route).
     *
     * @param  string  $token
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Send the email verification notification using our app's
     * notification (which points the user at the SPA confirm page
     * rather than Laravel's default web verify route).
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification);
    }

    /**
     * Default categories that are copied to every newly created user.
     * The copies are owned by the user (`user_id` set) so they can be
     * edited or deleted without affecting other users.
     */
    public const DEFAULT_CATEGORIES = [
        ['name' => 'Food & Groceries', 'type' => 'expense'],
        ['name' => 'Transport', 'type' => 'expense'],
        ['name' => 'Healthcare', 'type' => 'expense'],
        ['name' => 'Bank Charges', 'type' => 'expense'],
        ['name' => 'Shopping', 'type' => 'expense'],
        ['name' => 'Entertainment', 'type' => 'expense'],
        ['name' => 'Utilities', 'type' => 'expense'],
        ['name' => 'Rent', 'type' => 'expense'],
        ['name' => 'Airtime & Data', 'type' => 'expense'],
        ['name' => 'Education', 'type' => 'expense'],
        ['name' => 'Savings', 'type' => 'expense'],
        ['name' => 'Tithe', 'type' => 'expense'],
        ['name' => 'Salary', 'type' => 'income'],
        ['name' => 'Freelance', 'type' => 'income'],
        ['name' => 'Gifts', 'type' => 'income'],
        ['name' => 'Investment', 'type' => 'income'],
    ];

    public function announcements(): BelongsToMany
    {
        return $this->belongsToMany(Announcement::class)
            ->withPivot('delivered_at')
            ->using(AnnouncementUser::class);
    }

    /**
     * Boot the model.
     *
     * Whenever a new user is created, give them their own editable copy
     * of the default categories. This runs for every creation path
     * (registration, OAuth, factories, etc.).
     */
    protected static function booted(): void
    {
        static::created(function (User $user) {
            $now = now();
            $rows = array_map(fn ($c) => [
                'user_id'    => $user->id,
                'name'       => $c['name'],
                'type'       => $c['type'],
                'created_at' => $now,
                'updated_at' => $now,
            ], self::DEFAULT_CATEGORIES);

            $user->categories()->insert($rows);
        });
    }
}
