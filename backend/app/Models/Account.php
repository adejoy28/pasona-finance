<?php

namespace App\Models;

/**
 * Account File
 * 
 * Serves the Account Management feature. Connects to Users and Transactions.
 */

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Account Model
 * 
 * Represents a financial account like a Bank account, Mobile Money, or Cash.
 * Tracks the starting balance and linked transactions.
 */
class Account extends Model
{
    use HasFactory;

    /**
     * Attributes that are mass assignable.
     * 
     * @var array
     */
    protected $fillable = [
        'user_id',
        'name',
        'type',
        'starting_balance',
        'notes',
    ];

    /**
     * Get the user that owns the account.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all transactions associated with this account (as the source account).
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get all transfers received by this account.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function receivedTransfers()
    {
        return $this->hasMany(Transaction::class, 'to_account_id');
    }

    /**
     * Accessor for live balance calculation.
     * Balance = Starting Balance + Total Income - Total Expense - Total Transfers Out + Total Transfers In
     * 
     * @return float
     */
    public function getBalanceAttribute()
    {
        $income = $this->transactions()->where('type', 'income')->sum('amount');
        $expense = $this->transactions()->where('type', 'expense')->sum('amount');
        $transfersOut = $this->transactions()->where('type', 'transfer')->sum('amount');
        $transfersIn = $this->receivedTransfers()->sum('amount');

        return $this->starting_balance + $income - $expense - $transfersOut + $transfersIn;
    }
}
