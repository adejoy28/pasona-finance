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
     * Accessor for live balance calculation on a single account.
     * Balance = Starting Balance + Total Income - Total Expense - Total Transfers Out + Total Transfers In
     *
     * Single conditional-sum query against the transactions table.
     * For lists of accounts, use {@see self::balancesFor()} instead —
     * it batches every account into one query and avoids the N+1 trap.
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

    /**
     * Compute live balances for many accounts in a single query.
     *
     * Returns a map of `account_id => balance`. The caller is responsible
     * for hydrating the result onto the model collection (e.g. via
     * `$account->setAttribute('balance', $map[$account->id])` then
     * `$account->append('balance')`).
     *
     * One query regardless of account count, so it scales where the
     * per-account accessor triggers a fresh aggregate query each time.
     *
     * @param  int    $userId
     * @param  array  $accountIds
     * @return array<int, float>
     */
    public static function balancesFor(int $userId, array $accountIds): array
    {
        if (empty($accountIds)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($accountIds), '?'));

        $sql = "
            SELECT account_id, SUM(net) AS net
            FROM (
                SELECT account_id,
                       CASE type
                           WHEN 'income'   THEN  amount
                           WHEN 'expense'  THEN -amount
                           WHEN 'transfer' THEN -amount
                       END AS net
                FROM transactions
                WHERE account_id IN ({$placeholders}) AND user_id = ?
                UNION ALL
                SELECT to_account_id AS account_id, amount AS net
                FROM transactions
                WHERE to_account_id IN ({$placeholders})
                  AND type = 'transfer'
                  AND user_id = ?
            ) t
            GROUP BY account_id
        ";

        $bindings = array_merge($accountIds, [$userId], $accountIds, [$userId]);

        $balances = array_fill_keys($accountIds, 0.0);

        foreach (DB::select($sql, $bindings) as $row) {
            $balances[$row->account_id] = (float) $row->net;
        }

        // Add each account's starting_balance on top of the transaction net.
        $starters = DB::table('accounts')
            ->whereIn('id', $accountIds)
            ->pluck('starting_balance', 'id');

        foreach ($balances as $id => $net) {
            $balances[$id] = $net + (float) ($starters[$id] ?? 0);
        }

        return $balances;
    }
}
