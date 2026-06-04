<?php

namespace App\Models;

/**
 * Transaction File
 * 
 * Serves the Core Transaction Logging feature. Connects to Users, Accounts, and Categories.
 */

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Transaction Model
 * 
 * Represents a single financial movement (Income, Expense, or Transfer).
 * Tracks amount, accounts involved, category, and sync status.
 */
class Transaction extends Model
{
    use HasFactory;

    /**
     * Attributes that are mass assignable.
     * 
     * @var array
     */
    protected $fillable = [
        'user_id',
        'account_id',
        'to_account_id',
        'type',
        'category_id',
        'amount',
        'description',
        'reference',
        'transaction_date',
        'is_synced',
    ];

    /**
     * Get the user who owns this transaction.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the primary account involved in the transaction.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the target account (only for transfers).
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function toAccount()
    {
        return $this->belongsTo(Account::class, 'to_account_id');
    }

    /**
     * Get the category this transaction belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Check whether a transaction with the same fingerprint already
     * exists for the given user. Used by the controller's store path
     * and by the offline-sync job to avoid double-inserts.
     *
     * Fingerprint: user_id + transaction_date + type + amount + account_id.
     * Transfers are intentionally not distinguished by to_account_id — the
     * store endpoint already uses the same key, so the job stays aligned
     * with the single-create path. Callers that need to bypass the check
     * (e.g. legitimate retries) can pass `force` at the controller level
     * or simply not call this helper.
     */
    public static function isPotentialDuplicate(
        int $userId,
        string $transactionDate,
        string $type,
        float $amount,
        int $accountId,
    ): bool {
        return static::query()
            ->where('user_id', $userId)
            ->where('transaction_date', $transactionDate)
            ->where('type', $type)
            ->where('amount', $amount)
            ->where('account_id', $accountId)
            ->exists();
    }
}
