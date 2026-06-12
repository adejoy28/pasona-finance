<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Announcement extends Model
{
    protected $fillable = [
        'name',
        'subject',
        'template',
        'template_vars',
        'scheduled_at',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'template_vars' => 'array',
            'scheduled_at'  => 'datetime',
            'sent_at'       => 'datetime',
        ];
    }

    public function recipients(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('delivered_at')
            ->using(AnnouncementUser::class);
    }

    public function scopePending($query)
    {
        return $query->whereNull('sent_at')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now());
    }

    public function hasDeliveredTo(User $user): bool
    {
        return $this->recipients()->where('user_id', $user->id)->exists();
    }

    public function markDelivered(User $user): void
    {
        $this->recipients()->attach($user->id);
    }

    public function markSent(): void
    {
        $this->update(['sent_at' => now()]);
    }
}
