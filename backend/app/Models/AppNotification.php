<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * In-app notification record.
 *
 * Created whenever the backend sends a mail or when notable app events
 * occur (account created, import completed, etc.). Surfaced by the
 * notification bell in the SPA.
 */
class AppNotification extends Model
{
    protected $table = 'notifications';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'data',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'data'    => 'array',
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Convenience factory — create a notification for a user.
     *
     * @param  User|int  $user   User model or ID
     * @param  string    $type   Notification type slug
     * @param  string    $title  Human-readable title
     * @param  string    $body   Short description / body text
     * @param  array<string,mixed>|null  $data  Optional JSON payload
     */
    public static function push(
        User|int $user,
        string $type,
        string $title,
        string $body,
        ?array $data = null,
    ): static {
        return static::create([
            'user_id' => $user instanceof User ? $user->id : $user,
            'type'    => $type,
            'title'   => $title,
            'body'    => $body,
            'data'    => $data,
        ]);
    }
}
