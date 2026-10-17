<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RecurringBill extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'amount',
        'type',
        'account_id',
        'category_id',
        'frequency',
        'next_due',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'next_due' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Advance next_due based on frequency.
     */
    public function advanceNextDue(): void
    {
        $current = \Carbon\Carbon::parse($this->next_due);
        if ($this->frequency === 'weekly') {
            $this->next_due = $current->addWeek()->format('Y-m-d');
        } elseif ($this->frequency === 'yearly') {
            $this->next_due = $current->addYear()->format('Y-m-d');
        } else {
            $this->next_due = $current->addMonth()->format('Y-m-d');
        }
        $this->save();
    }
}
