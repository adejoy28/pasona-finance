<?php

namespace App\Models;

/**
 * Category File
 * 
 * Serves the Transaction Classification feature. Connects to Users and Transactions.
 */

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Category Model
 * 
 * Represents a group for transactions (e.g., Food, Transport).
 * Categories can be system defaults or custom ones created by users.
 */
class Category extends Model
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
        'is_default',
    ];

    /**
     * Get the user that created the category.
     * Will be null for default system categories.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all transactions belonging to this category.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
