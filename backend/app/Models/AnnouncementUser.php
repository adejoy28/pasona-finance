<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class AnnouncementUser extends Pivot
{
    protected $table = 'announcement_user';

    protected function casts(): array
    {
        return [
            'delivered_at' => 'datetime',
        ];
    }
}
