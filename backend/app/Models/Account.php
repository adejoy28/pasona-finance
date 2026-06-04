<?php

namespace App\Models;

/**
 * Account File
 * 
 * Serves the Account Management feature. Connects to Users and Transactions.
 */

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

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
     * Computed with a single conditional-sum query against the
     * transactions table (4 queries down to 1 per account).
     *
     * @return float
     */
    public function getBalanceAttribute()
    {
        $id = $this->getKey();

        $row = DB::table('transactions')
            ->where(function ($q) use ($id) {
                $q->where('account_id', $id)
                  ->orWhere('to_account_id', $id);
            })
            ->selectRaw("
                COALESCE(SUM(CASE
                    WHEN account_id   = ? AND type = 'income'   THEN  amount
                    WHEN account_id   = ? AND type = 'expense'  THEN -amount
                    WHEN account_id   = ? AND type = 'transfer' THEN -amount
                    WHEN to_account_id = ? AND type = 'transfer' THEN  amount
                    ELSE 0
                END), 0) AS net
            ", [$id, $id, $id, $id])
            ->first();

        return $this->starting_balance + (float) $row->net;
    }
}
